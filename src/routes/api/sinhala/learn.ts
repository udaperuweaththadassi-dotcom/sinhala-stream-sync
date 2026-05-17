import { createAPIFileRoute } from "@tanstack/react-start/api";
import { processConversion } from "@/lib/sinhala";

/**
 * POST /api/sinhala/learn
 * 
 * Endpoint for SmartLearningEngine to learn from user input
 * - Receives Singlish text
 * - Converts to Sinhala
 * - Returns result for client-side learning
 */

interface LearnRequest {
  text: string;
  timestamp: number;
}

interface LearnResponse {
  success: boolean;
  converted?: string;
  suggestion?: string;
  error?: string;
}

export const APIRoute = createAPIFileRoute("/api/sinhala/learn")(async (opts) => {
  // Only allow POST requests
  if (opts.request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse request body
    let requestData: LearnRequest;
    try {
      requestData = await opts.request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { text, timestamp } = requestData;

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid text input" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!timestamp || typeof timestamp !== "number") {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid timestamp" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert Singlish to Sinhala (Unicode mode)
    const converted = processConversion(text.trim(), "unicode");

    // TODO: Optional - Save to database (Supabase, D1, etc.)
    // await saveLearningData({ text, converted, timestamp });

    const response: LearnResponse = {
      success: true,
      converted: converted,
      suggestion: null, // Optional: return AI suggestions if needed
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[/api/sinhala/learn] Error:", error);

    const response: LearnResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
