export interface TranslateOptions {
  text: string;
  targetLanguage?: "ko" | "en";
}

export interface TranslateResponse {
  translatedText: string;
}

export async function translateText({
  text,
  targetLanguage = "ko",
}: TranslateOptions): Promise<string> {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, targetLanguage }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Translation failed");
    }

    const data: TranslateResponse = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

