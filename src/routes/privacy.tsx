import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · Sintype.lk" },
      { name: "description", content: "How Sintype.lk handles your data. Short answer: your typing stays on your device." },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl neon-text mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-foreground font-display text-xl mt-6">What we store</h2>
        <p>Sintype.lk runs almost entirely in your browser. The text you type and the conversion history (last 20 entries) are stored locally on your device using <code>localStorage</code> — they never leave your browser unless you explicitly use the Mobile Sync feature.</p>
        <h2 className="text-foreground font-display text-xl mt-6">Mobile Sync</h2>
        <p>When you pair a phone via QR code, messages are sent over an ephemeral real-time channel scoped to your private session ID. We do not persist or log these messages on our servers.</p>
        <h2 className="text-foreground font-display text-xl mt-6">Analytics & ads</h2>
        <p>We may use privacy-respecting analytics and Google AdSense to keep the service free. These services may set their own cookies; please review Google's policies for details.</p>
        <h2 className="text-foreground font-display text-xl mt-6">Contact</h2>
        <p>Questions? Reach us via the <a href="/contact" className="text-[var(--neon-cyan)] underline">Contact page</a>.</p>
      </div>
    </article>
  ),
});
