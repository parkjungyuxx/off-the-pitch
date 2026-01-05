import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getTranslationPrompt } from "@/lib/prompts";

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = getTranslationPrompt({ targetLanguage });

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
