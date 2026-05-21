import { createFileRoute } from "@tanstack/react-router";
import { processConversion } from "@/lib/sinhala";

export const Route = createFileRoute("/api/sinhala/learn")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { text?: unknown; timestamp?: unknown };
          const text = typeof body.text === "string" ? body.text.trim() : "";
          if (!text) {
            return new Response(
              JSON.stringify({ success: false, error: "Invalid text input" }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }
          const converted = processConversion(text, "unicode");
          return new Response(
            JSON.stringify({ success: true, converted }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          return new Response(
            JSON.stringify({
              success: false,
              error: err instanceof Error ? err.message : "Unknown error",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
