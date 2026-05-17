import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };


import { SinhalaTransliterator } from "@/lib/sinhala/engine";

const engine = new SinhalaTransliterator();

export default function SinhalaInput() {
  const [output, setOutput] = useState("");

  return (
    <div>
      <textarea
        onChange={(e) => setOutput(engine.transliterateText(e.target.value))}
        placeholder="Singlish type කරන්න..."
      />
      <p>{output}</p>
    </div>
  );
}
