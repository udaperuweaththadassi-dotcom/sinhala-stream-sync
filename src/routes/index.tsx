import { createFileRoute } from "@tanstack/react-router";
import { Converter } from "@/components/Converter";
import { TypingTitle } from "@/components/TypingTitle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sintype.lk — Singlish to Sinhala Converter" },
      { name: "description", content: "Type in Singlish and get real-time Sinhala Unicode or Legacy FM font output. Voice input, history, and mobile sync — all free." },
      { property: "og:title", content: "Sintype.lk — Singlish to Sinhala Converter" },
      { property: "og:description", content: "Real-time Singlish → Sinhala. Unicode + Legacy FM. Voice typing, QR mobile sync." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="max-w-7xl mx-auto px-4 pt-12 pb-6 text-center">
        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
          <TypingTitle text="Sintype.lk" className="neon-text" />
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg">
          Singlish in, Sinhala out — instantly. Switch between modern Unicode and Legacy FM fonts with one toggle.
        </p>
      </section>
      <Converter />
    </>
  );
}
