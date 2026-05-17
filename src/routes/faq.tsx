import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ · Sintype.lk" },
      { name: "description", content: "Common questions about typing Singlish, microphone issues, and copying Sinhala into Photoshop or MS Word without font errors." },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
  }),
  component: FaqPage,
});

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "How do I type in Singlish?",
    a: (
      <div className="space-y-2">
        <p>Just type Sinhala the way you'd write it in English. Examples:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code>ammaa</code> → අම්මා</li>
          <li><code>mama gedara yanavaa</code> → මම ගෙදර යනවා</li>
          <li><code>aa</code> → ආ, <code>ee</code> → ඊ, <code>uu</code> → ඌ</li>
          <li><code>th</code> → ථ, <code>dh</code> → ධ, <code>sh</code> → ශ</li>
          <li>Capital letters give the "harder" sound: <code>T</code> → ට, <code>D</code> → ඩ, <code>N</code> → ණ</li>
        </ul>
      </div>
    ),
  },
  {
    q: "What should I do if the microphone doesn't work?",
    a: (
      <div className="space-y-2">
        <p>Voice typing uses your browser's built-in speech engine. To get it working:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the site over <strong>HTTPS</strong> (the mic is blocked on insecure pages).</li>
          <li>Allow microphone permission when your browser asks. On iPhone/Safari you also need to allow it from Settings → Safari → Microphone.</li>
          <li>On iOS, use <strong>Safari</strong> for best results — third-party browsers may not expose the Web Speech API.</li>
          <li>If nothing happens, refresh the page once and tap the mic again.</li>
        </ul>
      </div>
    ),
  },
  {
    q: "How do I copy text to Photoshop or MS Word without font alignment errors?",
    a: (
      <div className="space-y-2">
        <p>Sinhala has two encodings — modern <strong>Unicode</strong> and the older <strong>Legacy FM</strong> fonts (FM Abhaya, FMBindumathi, etc.).</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>For <strong>MS Word, Google Docs, websites, social media</strong>: use the <em>Unicode</em> mode (default). Any modern Sinhala font will display it correctly.</li>
          <li>For <strong>Photoshop, Illustrator, older print templates</strong>: switch the toggle to <em>Legacy FM</em> mode, copy the output, then paste using an FM-series font (e.g. FM Abhaya, FMBindumathi). This avoids the broken pili and vowel-sign issues you get when pasting Unicode into FM fonts.</li>
          <li>Always paste with <strong>"Keep Text Only"</strong> (Ctrl/Cmd + Shift + V) to prevent the source font from overriding your destination font.</li>
        </ul>
      </div>
    ),
  },
  {
    q: "How does the mobile sync work?",
    a: <p>Sign in on your desktop, scan the QR code from the account panel with your phone, and anything you type or speak on the phone instantly streams into the main input box on the desktop.</p>,
  },
  {
    q: "Is my data stored anywhere?",
    a: <p>All conversions happen in your browser. Your last 20 conversions are kept in local storage on your device only. Phone-to-desktop messages are sent over a real-time channel and are not persisted on our servers.</p>,
  },
];

function FaqPage() {
  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <h1 className="font-display text-3xl sm:text-5xl font-bold neon-text">FAQ</h1>
        <p className="mt-3 text-muted-foreground">Quick answers to the most common questions.</p>
      </header>
      <Accordion type="single" collapsible className="neon-border p-2 sm:p-4">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border">
            <AccordionTrigger className="text-left px-3 hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="px-3 text-muted-foreground text-sm leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
