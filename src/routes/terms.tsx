import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · Sintype.lk" },
      { name: "description", content: "The terms that govern your use of Sintype.lk." },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: () => (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl neon-text mb-6">Terms of Service</h1>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>By using Sintype.lk you agree to use the service responsibly. The tool is provided "as is" without warranty of any kind. We are not liable for data loss, mistranscriptions, or any direct or indirect damages arising from use of the service.</p>
        <p>You retain ownership of the text you type. You may use the converted output freely for personal, educational, or commercial purposes.</p>
        <p>You agree not to use Sintype.lk to generate or distribute unlawful, abusive, or harmful content.</p>
        <p>We reserve the right to update these terms at any time. Continued use of the service constitutes acceptance of the updated terms.</p>
      </div>
    </article>
  ),
});
