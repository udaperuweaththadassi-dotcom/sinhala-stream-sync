import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Sintype.lk" },
      { name: "description", content: "Sintype.lk is a free productivity tool for Sri Lankan writers, designers, and developers — converting Singlish to Sinhala Unicode and Legacy FM fonts." },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: () => (
    <article className="max-w-3xl mx-auto px-4 py-12 prose-invert">
      <h1 className="font-display text-4xl neon-text mb-6">About Sintype.lk</h1>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p><strong className="text-foreground">Sintype.lk</strong> is a modern Sinhala typing platform built for the everyday workflows of Sri Lankan students, content creators, journalists, graphic designers, and developers.</p>
        <p>Most Sinhala typing tools still feel stuck in the early 2000s. We rebuilt the experience from the ground up — a clean, accessible interface with real-time conversion, voice input, mobile pairing, and seamless switching between modern <strong className="text-foreground">Unicode</strong> and traditional <strong className="text-foreground">Legacy FM fonts</strong> for print and design work.</p>
        <p>Whether you're writing a blog post, captioning a reel, drafting an article in InDesign, or simply replying to a relative on WhatsApp — Sintype.lk meets you where you are. Free, fast, and respectful of your privacy.</p>
        <h2 className="text-foreground font-display text-2xl mt-8">Why we built it</h2>
        <p>Sri Lankan typists shouldn't have to download desktop-only software, juggle keyboard layouts, or pay for basic conversions. By combining a phonetic <em>Singlish</em> input model with both Unicode and FM output, we hope to bridge the generational gap between modern web publishing and legacy newspaper / design workflows.</p>
      </div>
    </article>
  ),
});
