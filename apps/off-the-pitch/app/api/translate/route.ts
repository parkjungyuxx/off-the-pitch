import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getTranslationPrompt } from "@/lib/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage = "ko" } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    const systemPrompt = getTranslationPrompt({ targetLanguage });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 비용 효율적인 모델 사용 (gpt-4o로 변경 가능)
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
      temperature: 0.3, // 일관된 번역을 위해 낮은 temperature 설정
      max_tokens: 1000, // 필요에 따라 조정
    });

    const translatedText = completion.choices[0]?.message?.content;

    if (!translatedText) {
      return NextResponse.json(
        { error: "Translation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
