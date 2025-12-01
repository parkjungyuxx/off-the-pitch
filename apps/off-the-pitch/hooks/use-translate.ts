import { useState, useEffect } from "react";
import { translateText } from "@/lib/translate";

interface UseTranslateOptions {
  originalText: string;
}

interface UseTranslateReturn {
  isTranslated: boolean;
  translatedContent: string;
  isTranslating: boolean;
  translateError: string | null;
  translateMessage: string;
  handleTranslate: () => Promise<void>;
  resetTranslation: () => void;
}

export function useTranslate({
  originalText,
}: UseTranslateOptions): UseTranslateReturn {
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateMessage, setTranslateMessage] =
    useState<string>("번역 중입니다...");

  useEffect(() => {
    if (!isTranslating) {
      setTranslateMessage("번역 중입니다...");
      return;
    }

    const timer3s = setTimeout(() => {
      setTranslateMessage("번역 중입니다. 조금만 기다려주세요");
    }, 3000);

    const timer5s = setTimeout(() => {
      setTranslateMessage("번역 중입니다. 조금만 더 기다려주세요");
    }, 5000);

    const timer10s = setTimeout(() => {
      setTranslateMessage("번역 중입니다. 곧 완료됩니다");
    }, 10000);

    return () => {
      clearTimeout(timer3s);
      clearTimeout(timer5s);
      clearTimeout(timer10s);
    };
  }, [isTranslating]);

  const handleTranslate = async () => {
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedContent) {
      setIsTranslated(true);
      return;
    }

    try {
      setIsTranslating(true);
      setTranslateError(null);
      const translated = await translateText({ text: originalText });
      setTranslatedContent(translated);
      setIsTranslated(true);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslateError("번역에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsTranslating(false);
    }
  };

  const resetTranslation = () => {
    setIsTranslated(false);
    setTranslatedContent("");
    setTranslateError(null);
  };

  return {
    isTranslated,
    translatedContent,
    isTranslating,
    translateError,
    translateMessage,
    handleTranslate,
    resetTranslation,
  };
}
