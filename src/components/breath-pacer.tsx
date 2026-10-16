"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownToLine, Pause, Play, RotateCcw, Wind } from "lucide-react";
import {
  BREATH,
  breathPhaseCue,
  buildBreathUnits,
  restMsForUnit,
  wordSchedule,
} from "@/lib/breath";
import type { BreathEvery } from "@/lib/breath";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "inhale" | "speak" | "rest" | "done";

export interface BreathPacerProps {
  sentences: string[];
  language: Language;
  wpm: number;
  breathingGuide: boolean;
  /** How often a breath is suggested. "free" removes enforced inhales entirely. */
  breathEvery?: BreathEvery;
  autoAdvance?: boolean;
  reducedMotion?: boolean;
  onComplete?: () => void;
}

/**
 * The breath-coordination engine. Walks a passage one breath unit (normally a
 * whole sentence) at a time. In "sentence" mode an inhale window precedes each
 * unit and the orb expands/contracts with the breath. In "free" mode there are
 * no enforced inhales — the words simply pace and you breathe whenever you need.
 */
export function BreathPacer({
  sentences,
  language,
  wpm,
  breathingGuide,
  breathEvery = "sentence",
  autoAdvance = true,
  reducedMotion = false,
  onComplete,
}: BreathPacerProps) {
  const units = useMemo(() => buildBreathUnits(sentences), [sentences]);
  const cue = breathPhaseCue[language];
  const free = breathEvery === "free";

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [wordIndex, setWordIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const activeRef = useRef<HTMLSpanElement>(null);
  const current = units[index];

  useEffect(() => {
    if (phase === "speak") activeRef.current?.scrollIntoView({ block: "center", behavior: reducedMotion ? "auto" : "smooth" });
  }, [index, phase, reducedMotion]);

  useEffect(() => {
    if (!playing || !current) return;

    if (phase === "inhale") {
      const ms = free ? 60 : BREATH.inhaleMs + BREATH.holdMs;
      const timer = setTimeout(() => setPhase("speak"), ms);
      return () => clearTimeout(timer);
    }

    if (phase === "speak") {
      const { starts, total } = wordSchedule(current, wpm);
      const started = Date.now();
      const id = setInterval(() => {
        const elapsed = Date.now() - started;
        if (elapsed >= total) {
          setWordIndex(current.words.length);
          clearInterval(id);
          setPhase("rest");
          return;
        }
        let w = 0;
        while (w + 1 < starts.length && starts[w + 1] <= elapsed) w += 1;
        setWordIndex(w);
      }, 50);
      return () => clearInterval(id);
    }

    if (phase === "rest") {
      const ms = restMsForUnit(current);
      const timer = setTimeout(() => {
        const last = index >= units.length - 1;
        if (last) {
          setPhase("done");
          setPlaying(false);
          onComplete?.();
        } else {
          setWordIndex(-1);
          setIndex((value) => value + 1);
          setPhase(free ? "speak" : "inhale");
          if (!autoAdvance) setPlaying(false);
        }
      }, ms);
      return () => clearTimeout(timer);
    }
  }, [phase, index, playing, current, units.length, wpm, free, autoAdvance, onComplete]);

  const start = useCallback(() => {
    if (phase === "done") { setIndex(0); setWordIndex(-1); }
    setPhase((prev) => (prev === "speak" || prev === "rest" ? prev : free ? "speak" : "inhale"));
    setPlaying(true);
  }, [phase, free]);

  const pause = useCallback(() => setPlaying(false), []);
  const restartUnit = useCallback(() => { setWordIndex(-1); setPhase(free ? "speak" : "inhale"); setPlaying(true); }, [free]);
  const restartAll = useCallback(() => { setIndex(0); setWordIndex(-1); setPhase(free ? "speak" : "inhale"); setPlaying(true); }, [free]);

  // Space toggles play/pause (unless the user is typing somewhere).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      event.preventDefault();
      if (playing) setPlaying(false); else start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, start]);

  const expanded = phase === "inhale";
  const orbDurationSec = current
    ? (phase === "inhale" ? BREATH.inhaleMs : phase === "speak" ? wordSchedule(current, wpm).total : restMsForUnit(current)) / 1000
    : 0.3;

  const phaseLabel = free
    ? cue.free
    : phase === "inhale" ? cue.inhale : phase === "speak" ? cue.speak : phase === "rest" ? cue.rest : cue.speak;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {breathingGuide && (
        <div className="mb-6 flex flex-col items-center">
          <div className="breath-stage">
            <motion.div
              className={cn("breath-orb-core", !free && phase === "inhale" && "is-inhale", !free && phase === "speak" && "is-speak", free && "is-ambient")}
              animate={reducedMotion || free ? undefined : { scale: expanded ? 1 : 0.6 }}
              transition={reducedMotion || free ? undefined : { duration: orbDurationSec, ease: expanded ? "easeInOut" : "linear" }}
            >
              {!free && phase === "inhale" ? <ArrowDownToLine size={30} /> : <Wind size={30} />}
            </motion.div>
          </div>
          <p className={cn("mt-4 text-sm font-bold uppercase tracking-[.14em]", phase === "speak" || free ? "text-teal-600 dark:text-teal-300" : "text-sky-600 dark:text-sky-300")}>
            {phase === "idle" || phase === "done" ? (free ? cue.free : cue.speak) : phaseLabel}
          </p>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
        {playing ? (
          <button onClick={pause} className="pacer-btn pacer-btn-primary"><Pause size={18} /> Pause</button>
        ) : (
          <button onClick={start} className="pacer-btn pacer-btn-primary"><Play size={18} /> {phase === "done" ? "Read again" : phase === "idle" ? "Start" : "Resume"}</button>
        )}
        <button onClick={restartUnit} className="pacer-btn" title="Repeat this part"><RotateCcw size={16} /> {free ? "Line" : "Sentence"}</button>
        <button onClick={restartAll} className="pacer-btn" title="Start from the top"><RotateCcw size={16} /> Top</button>
        <span className="hidden text-xs text-slate-400 sm:inline">Space to {playing ? "pause" : "start"}</span>
      </div>

      <div className="reading-card">
        <p className="breath-reading text-xl leading-[2.1] md:text-2xl md:leading-[2.2]">
          {units.map((unit, u) => {
            const state = u < index ? "done" : u === index ? "active" : "pending";
            return (
              <span key={u}>
                {breathingGuide && !free && (
                  <span
                    className={cn("breath-mark", unit.endsSentence ? "breath-mark-short" : "breath-mark-long", u === index && phase === "inhale" && "is-now")}
                    aria-label="breathe in"
                  >
                    <ArrowDownToLine size={14} />
                  </span>
                )}
                <span ref={u === index ? activeRef : undefined} className={cn("breath-phrase", `is-${state}`)}>
                  {unit.words.map((word, w) => {
                    const spoken = state === "done" || (state === "active" && w < wordIndex);
                    const now = state === "active" && w === wordIndex && phase === "speak";
                    const pauseHere = unit.pauseAfter.includes(w) && w < unit.words.length - 1;
                    return (
                      <span key={w}>
                        <span className={cn("breath-word", spoken && "is-spoken", now && "is-now")}>{word}</span>
                        {pauseHere && <span className={cn("phrase-pause", now && "is-now")} aria-label="brief pause">·</span>}
                        {w < unit.words.length - 1 ? " " : ""}
                      </span>
                    );
                  })}
                </span>
                {unit.endsSentence ? <span className="breath-break" /> : " "}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
