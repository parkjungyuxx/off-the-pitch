export interface SummaryResponse {
  summary: string;
}

export async function getDailySummary(): Promise<string> {
  try {
    const response = await fetch("/api/summarize", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Summary generation failed");
    }

    const data: SummaryResponse = await response.json();
    return data.summary;
  } catch (error) {
    console.error("Summary error:", error);
    throw error;
  }
}
