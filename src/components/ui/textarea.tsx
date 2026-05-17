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
