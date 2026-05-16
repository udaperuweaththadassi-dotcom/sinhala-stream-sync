import { useEffect, useState } from "react";

export function TypingTitle({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 110);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span className={className}>
      {shown}
      <span className="caret" style={{ height: "0.9em" }} />
    </span>
  );
}
