import { createFileRoute } from "@tanstack/react-router";
import { Mail, Github } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Sintype.lk" },
      { name: "description", content: "Get in touch with the Sintype.lk team for feedback, partnerships, or support." },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: () => (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="font-display text-4xl neon-text mb-6">Contact</h1>
      <p className="text-muted-foreground mb-8">Found a bug, want a feature, or just want to say hi? We'd love to hear from you.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <a href="mailto:hello@sintype.lk" className="neon-border p-5 flex items-center gap-3">
          <Mail className="w-5 h-5 text-[var(--neon-cyan)]" />
          <div>
            <p className="font-semibold">Email</p>
            <p className="text-sm text-muted-foreground">hello@sintype.lk</p>
          </div>
        </a>
        <a href="https://github.com/" target="_blank" rel="noreferrer" className="neon-border p-5 flex items-center gap-3">
          <Github className="w-5 h-5 text-[var(--neon-purple)]" />
          <div>
            <p className="font-semibold">GitHub</p>
            <p className="text-sm text-muted-foreground">Open issues & PRs</p>
          </div>
        </a>
      </div>
    </article>
  ),
});
