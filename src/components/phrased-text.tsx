import { ArrowDown } from "lucide-react";
import { breathCue } from "@/content/exercises";
import { Language } from "@/lib/types";

/** Renders each sentence on its own line with a "breathe out · speak slowly"
 *  cue between every sentence, reinforcing exhale-led, slow speech. */
export function PhrasedText({ phrases, language, size = "lg" }: { phrases: string[]; language: Language; size?: "lg" | "xl" }) {
  return (
    <div className="grid gap-3">
      {phrases.map((phrase, i) => (
        <div key={i} className="grid gap-3">
          <p className={size === "xl" ? "text-2xl font-medium leading-snug md:text-4xl md:leading-tight" : "text-lg font-medium leading-snug"}>{phrase}</p>
          {i < phrases.length - 1 && (
            <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <ArrowDown size={13} /> {breathCue[language]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
