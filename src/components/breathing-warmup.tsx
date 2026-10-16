"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { cueWarmupExhale, cueWarmupHold, cueWarmupInhale } from "@/lib/cues";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/utils";

type PatternId = "belly" | "box" | "478";
type PhaseKind = "inhale" | "hold" | "exhale" | "holdEmpty";

interface Step { kind: PhaseKind; seconds: number }

const PATTERNS: Record<PatternId, { steps: Step[] }> = {
  // Diaphragmatic: gentle in, longer out — the base skill for speaking on the exhale.
  belly: { steps: [{ kind: "inhale", seconds: 4 }, { kind: "exhale", seconds: 6 }] },
  // Box breathing (4-4-4-4) — steadies the nervous system before speaking.
  box: { steps: [{ kind: "inhale", seconds: 4 }, { kind: "hold", seconds: 4 }, { kind: "exhale", seconds: 4 }, { kind: "holdEmpty", seconds: 4 }] },
  // 4-7-8 — a quick calming reset; the long exhale does the work.
  "478": { steps: [{ kind: "inhale", seconds: 4 }, { kind: "hold", seconds: 7 }, { kind: "exhale", seconds: 8 }] },
};

const PATTERN_LABEL: Record<PatternId, string> = { belly: "Belly breath", box: "Box 4·4·4·4", "478": "Calm 4·7·8" };

const LABELS: Record<Language, Record<PhaseKind, string>> = {
  english: { inhale: "Breathe in", hold: "Hold", exhale: "Breathe out slowly", holdEmpty: "Rest" },
  hindi: { inhale: "साँस लें", hold: "रोकें", exhale: "धीरे-धीरे साँस छोड़ें", holdEmpty: "विश्राम" },
  hinglish: { inhale: "Saans lo", hold: "Roko", exhale: "Dheere saans chhodo", holdEmpty: "Rest" },
};

export interface BreathingWarmupProps {
  language: Language;
  reducedMotion?: boolean;
  sound?: boolean;
  haptics?: boolean;
}

/** An animated, self-guided breathing warm-up with selectable patterns. */
export function BreathingWarmup({ language, reducedMotion = false, sound = false, haptics = false }: BreathingWarmupProps) {
  const [pattern, setPattern] = useState<PatternId>("belly");
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PATTERNS.belly.steps[0].seconds);
  const [playing, setPlaying] = useState(false);

  const steps = useMemo(() => PATTERNS[pattern].steps, [pattern]);
  const step = steps[stepIndex];
  const labels = LABELS[language];

  const reset = useCallback((next: PatternId) => {
    setPattern(next);
    setStepIndex(0);
    setSecondsLeft(PATTERNS[next].steps[0].seconds);
    setPlaying(false);
  }, []);

  // Advance through phases and tick the countdown. All state updates happen
  // inside timer callbacks (not synchronously in the effect body).
  useEffect(() => {
    if (!playing) return;
    const started = Date.now();
    const tick = setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      setSecondsLeft(Math.max(0, Math.ceil(step.seconds - elapsed)));
    }, 100);
    const advance = setTimeout(() => setStepIndex((value) => (value + 1) % steps.length), step.seconds * 1000);
    return () => { clearInterval(tick); clearTimeout(advance); };
  }, [playing, stepIndex, step.seconds, steps.length]);

  // Space toggles the breathing animation (unless the user is typing).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      event.preventDefault();
      setPlaying((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Sound + haptic cue at the start of each breathing phase.
  useEffect(() => {
    if (!playing) return;
    const opts = { sound, haptics };
    if (step.kind === "inhale") cueWarmupInhale(opts);
    else if (step.kind === "exhale") cueWarmupExhale(opts);
    else cueWarmupHold(opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, playing]);

  const expanded = step.kind === "inhale" || step.kind === "hold";

  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <div className="breath-stage breath-stage-lg mx-auto">
        <motion.div
          className="breath-orb-core is-warmup"
          animate={reducedMotion ? undefined : { scale: expanded ? 1 : 0.55 }}
          transition={reducedMotion ? undefined : { duration: step.kind === "hold" || step.kind === "holdEmpty" ? 0.2 : step.seconds, ease: "easeInOut" }}
        >
          <span className="text-3xl font-bold tabular-nums">{playing ? secondsLeft : step.seconds}</span>
        </motion.div>
      </div>

      <p className="mt-6 text-2xl font-bold md:text-3xl">{labels[step.kind]}</p>
      <p className="mt-2 text-sm text-slate-500">Let the out-breath be longer and easier than the in-breath. Never strain.</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {(Object.keys(PATTERNS) as PatternId[]).map((id) => (
          <button key={id} onClick={() => reset(id)} className={cn("choice-chip px-4", pattern === id && "choice-chip-active")}>{PATTERN_LABEL[id]}</button>
        ))}
      </div>
      <div className="mt-4 flex justify-center">
        {playing ? (
          <button onClick={() => setPlaying(false)} className="pacer-btn pacer-btn-primary"><Pause size={18} /> Pause</button>
        ) : (
          <button onClick={() => setPlaying(true)} className="pacer-btn pacer-btn-primary"><Play size={18} /> Begin breathing</button>
        )}
      </div>
    </div>
  );
}
