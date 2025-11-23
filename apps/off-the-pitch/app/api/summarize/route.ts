import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseClient } from "@/lib/supabase";
import { getSummaryPrompt, getTranslationPrompt } from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 서버 사이드에서 사용할 번역 함수
async function translateTextServerSide(text: string): Promise<string> {
  const systemPrompt = getTranslationPrompt({ targetLanguage: "ko" });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return completion.choices[0]?.message?.content || text;
}

export async function GET(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // 어제 00:00부터 오늘 23:59까지의 트윗 가져오기
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const since = yesterdayStart.toISOString();
    const until = now.toISOString();

    // Supabase에서 어제~오늘 트윗 가져오기
    const supabase = getSupabaseClient();
    const { data: tweets, error: tweetsError } = await supabase
      .from("tweets")
      .select("tweet_text, created_at")
      .gte("created_at", since)
      .lte("created_at", until)
      .order("created_at", { ascending: false })
      .limit(50); // 최근 50개 트윗

    if (tweetsError) {
      console.error("Error fetching tweets:", tweetsError);
      return NextResponse.json(
        { error: "Failed to fetch tweets" },
        { status: 500 }
      );
    }

    if (!tweets || tweets.length === 0) {
      return NextResponse.json({
        summary:
          "어제부터 오늘까지 흥미로운 이적시장 뉴스를 요약해드릴게요!\n\n아직 새로운 이적 뉴스가 없네요. 조금만 기다려주세요!",
      });
    }

    // 트윗 텍스트 번역 (한글이 아닌 경우)
    const translatedTweets = await Promise.all(
      tweets.map(async (tweet) => {
        try {
          // 이미 한글인지 간단히 체크 (더 정교한 체크는 필요시 추가)
          const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(tweet.tweet_text);
          if (isKorean) {
            return tweet.tweet_text;
          }
          // 영어나 다른 언어면 번역
          return await translateTextServerSide(tweet.tweet_text);
        } catch (error) {
          console.error("Translation error:", error);
          return tweet.tweet_text; // 번역 실패 시 원문 반환
        }
      })
    );

    // 요약 프롬프트 생성
    const systemPrompt = getSummaryPrompt(translatedTweets);

    // OpenAI로 요약 생성
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: "이적시장 뉴스를 요약해주세요.",
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: "Summary generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
