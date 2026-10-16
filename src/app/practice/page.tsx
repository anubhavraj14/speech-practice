"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Check, ExternalLink, Feather, LoaderCircle, MessageCircle, RefreshCw, Sparkles, Volume2, VolumeX, Wind } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, Select } from "@/components/ui";
import { BreathPacer } from "@/components/breath-pacer";
import { BreathingWarmup } from "@/components/breathing-warmup";
import { languageLabels } from "@/content/exercises";
import { scenarioFor } from "@/content/scenarios";
import { BREATH_EVERY_LABEL, PACE_LABEL, PACE_WPM } from "@/lib/breath";
import { cueComplete } from "@/lib/cues";
import { buildSession } from "@/lib/session";
import type { GuidedSession, SessionBeat, Stage } from "@/lib/session";
import { useStore } from "@/lib/store";
import type { BreathEvery, Category, Difficulty, Language, Pace } from "@/lib/types";
import { cn } from "@/lib/utils";

const stageMeta: Record<Stage, { label: string; eyebrow: string; icon: typeof Wind }> = {
  relax: { label: "Settle", eyebrow: "Find an easy breath", icon: Wind },
  warmup: { label: "Easy starts", eyebrow: "One phrase per out-breath", icon: Feather },
  sentences: { label: "Breath groups", eyebrow: "Breathe in, then speak", icon: MessageCircle },
  paragraph: { label: "Guided reading", eyebrow: "Breathe at each mark", icon: BookOpen },
  express: { label: "Your words", eyebrow: "Plan your breaths", icon: Sparkles },
  converse: { label: "Conversation", eyebrow: "Real exchanges, calm breaths", icon: MessageCircle },
  apply: { label: "Real life", eyebrow: "Carry it with you", icon: ArrowRight },
};
const stageCategory: Record<Stage, Category> = { relax: "breathing", warmup: "articulation", sentences: "pace", paragraph: "reading", express: "prompts", converse: "prompts", apply: "prompts" };
const durationOptions = [5, 10, 15, 20, 30] as const;
const paceOptions: Pace[] = ["slow", "steady", "natural"];
const breathEveryOptions: BreathEvery[] = ["sentence", "free"];

type Phase = "setup" | "loading" | "run" | "reflect" | "done";
type Source = "curated" | "online";

export default function PracticePage() {
  const router = useRouter();
  const { preferences, recent, completed, sessions, activePassage, recordUsed, updatePreferences, addSession, markCompleted, saveActivePassage, clearActivePassage } = useStore();
  const [phase, setPhase] = useState<Phase>("setup");
  const [language, setLanguage] = useState<Language | "mixed">(preferences.language);
  const [difficulty, setDifficulty] = useState<Difficulty>(preferences.difficulty);
  const [minutes, setMinutes] = useState<(typeof durationOptions)[number]>(preferences.goal);
  const [source, setSource] = useState<Source>("curated");
  const [pace, setPace] = useState<Pace>(preferences.pace);
  const [breathingGuide, setBreathingGuide] = useState(preferences.breathingGuide);
  const [breathEvery, setBreathEvery] = useState<BreathEvery>(preferences.breathEvery);
  const [sound, setSound] = useState(preferences.sound);
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [startedSource, setStartedSource] = useState<Source>("curated");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latestComfort = sessions[0]?.comfort;

  const changePace = (value: Pace) => { setPace(value); updatePreferences({ pace: value }); };
  const changeGuide = (value: boolean) => { setBreathingGuide(value); updatePreferences({ breathingGuide: value }); };
  const changeBreathEvery = (value: BreathEvery) => { setBreathEvery(value); updatePreferences({ breathEvery: value }); };
  const changeSound = (value: boolean) => { setSound(value); updatePreferences({ sound: value }); };

  const runCurated = () => {
    setError(null); setNotice(null); updatePreferences({ language, difficulty });
    const built = buildSession(language, difficulty, minutes, recent);
    setSession(built); setStartedSource("curated"); recordUsed(built.usedIds); setPhase("run");
  };

  // Only offer to resume a saved passage for the exact same language + difficulty.
  const canResume = source === "online" && !!activePassage && activePassage.language === language && activePassage.difficulty === difficulty;

  const resumePassage = () => {
    if (!activePassage) return;
    setError(null); setNotice("Resuming your saved passage. It stays saved until you finish it.");
    setSession(activePassage.session); setStartedSource("online"); setPhase("run");
  };

  const fetchOnline = async () => {
    setError(null); setNotice(null); updatePreferences({ language, difficulty }); setPhase("loading");
    try {
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language, difficulty, minutes, recentIds: recent, completedIds: completed, refresh: true }) });
      if (!response.ok) throw new Error("Session could not be prepared");
      const result = await response.json() as { session: GuidedSession; notice: string | null };
      setSession(result.session); setStartedSource("online"); setNotice(result.notice ?? null);
      recordUsed(result.session.usedIds); saveActivePassage(result.session, language, difficulty); setPhase("run");
    } catch {
      setError("We couldn’t reach the reading sources. Try “Everyday conversation” instead — it works offline."); setPhase("setup");
    }
  };

  const begin = () => {
    if (source === "curated") return runCurated();
    if (canResume) return resumePassage();
    return fetchOnline();
  };

  const finish = () => {
    if (startedSource === "online") clearActivePassage();
    setPhase("reflect");
  };

  if (phase === "loading") return <LoadingCoach />;
  if (phase === "run" && session) return <Coach session={session} notice={notice} pace={pace} setPace={changePace} breathingGuide={breathingGuide} setBreathingGuide={changeGuide} breathEvery={breathEvery} setBreathEvery={changeBreathEvery} sound={sound} setSound={changeSound} haptics={preferences.haptics} autoAdvance={preferences.autoAdvance} reducedMotion={preferences.reducedMotion} exit={() => setPhase("setup")} finish={finish} />;
  if (phase === "reflect" && session) return <Reflection onSave={(confidence, comfort, notes) => {
    session.usedIds.filter((id) => !id.startsWith("theme:")).forEach(markCompleted);
    addSession({ id: crypto.randomUUID(), date: new Date().toISOString(), duration: minutes, exercises: session.usedIds, categories: [...new Set(session.stages.map((stage) => stageCategory[stage]))], languages: [...new Set(session.beats.map((beat) => beat.language))], difficulty, confidence, comfort, notes });
    setPhase("done");
  }} onSkip={() => setPhase("done")} />;
  if (phase === "done") return <Completion sound={sound} haptics={preferences.haptics} restart={() => setPhase("setup")} dashboard={() => router.push("/dashboard")} />;

  return <AppShell><div className="page-wrap">
    <div className="hero-grid overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,118,110,.12)] backdrop-blur-xl md:p-10 dark:border-white/10 dark:bg-slate-950/70">
      <div className="max-w-2xl">
        <Badge>BREATH-COORDINATION COACH</Badge>
        <h1 className="mt-5 text-4xl font-bold tracking-[-.04em] md:text-6xl">Breathe in, then <span className="text-gradient">speak on the out-breath.</span></h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 md:text-lg dark:text-slate-300">A visual guide shows you exactly when to breathe and when to speak, one natural phrase at a time. Nothing is recorded.</p>
      </div>
      <div className="coach-orbit mt-8 md:mt-0"><div className="coach-orb"><Wind size={34}/></div><span className="orbit-dot"/></div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <Card className="glass-card p-6 md:p-7">
        <h2 className="text-lg font-bold">Shape today’s practice</h2>
        <p className="mt-1 text-sm text-slate-500">You stay in control at every step.</p>
        <div className="mt-6 grid gap-5">
          <div>
            <p className="text-sm font-medium">Material</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => setSource("curated")} className={cn("choice-chip px-3 py-3 text-xs leading-tight", source === "curated" && "choice-chip-active")}>Everyday conversation<span className="block font-normal opacity-70">Realistic · offline</span></button>
              <button onClick={() => setSource("online")} className={cn("choice-chip px-3 py-3 text-xs leading-tight", source === "online" && "choice-chip-active")}>Book passage<span className="block font-normal opacity-70">Fresh · online</span></button>
            </div>
          </div>
          <Select label="Language" value={language} onChange={(event) => setLanguage(event.target.value as Language | "mixed")}><option value="mixed">A balanced mix</option>{Object.entries(languageLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select>
          <Select label="Challenge level" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}><option value="easy">Gentle</option><option value="medium">Steady</option><option value="advanced">Stretch</option></Select>
          <div><p className="text-sm font-medium">Speaking pace</p><div className="mt-2 grid grid-cols-3 gap-2">{paceOptions.map((value) => <button key={value} onClick={() => setPace(value)} className={cn("choice-chip", pace === value && "choice-chip-active")}>{PACE_LABEL[value]}<span className="block text-[10px] font-normal opacity-70">{PACE_WPM[value]} wpm</span></button>)}</div></div>
          <div><p className="text-sm font-medium">Breaths</p><div className="mt-2 grid grid-cols-2 gap-2">{breathEveryOptions.map((value) => <button key={value} onClick={() => setBreathEvery(value)} className={cn("choice-chip px-3 py-3 text-xs leading-tight", breathEvery === value && "choice-chip-active")}>{BREATH_EVERY_LABEL[value]}<span className="block font-normal opacity-70">{value === "sentence" ? "Breathe at sentences" : "Breathe when you want"}</span></button>)}</div></div>
          <div><p className="text-sm font-medium">Session size</p><div className="mt-2 grid grid-cols-5 gap-2">{durationOptions.map((value) => <button key={value} onClick={() => setMinutes(value)} className={cn("choice-chip", minutes === value && "choice-chip-active")}>{value}<span className="hidden sm:inline"> min</span></button>)}</div></div>
          {canResume && <div className="rounded-2xl bg-teal-50 p-4 text-sm leading-6 text-teal-900 dark:bg-teal-950/40 dark:text-teal-100"><p className="font-semibold">You have a saved passage in progress.</p><p className="mt-1">“Resume” will continue it. It stays saved until you finish it.</p><button onClick={() => { clearActivePassage(); void fetchOnline(); }} className="mt-2 font-semibold underline underline-offset-2">Start a new passage instead</button></div>}
          {latestComfort && latestComfort <= 2 && <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">Your last session felt challenging. A shorter or gentler session may feel more useful today—but the choice is yours.</div>}
          {error && <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}
          <Button onClick={begin} className="h-13 w-full text-base">{canResume ? "Resume my passage" : "Begin my session"} <ArrowRight size={18}/></Button>
        </div>
      </Card>
      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800"><p className="text-xs font-bold tracking-[.18em] text-teal-700 dark:text-teal-300">YOUR PATH</p><h2 className="mt-2 text-2xl font-bold">Breath first, then real speech.</h2></div>
        <div className="grid gap-0">{Object.entries(stageMeta).map(([key, meta], index) => { const Icon = meta.icon; return <div key={key} className="group flex items-center gap-4 border-b border-slate-100 px-6 py-4 last:border-0 dark:border-slate-800"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700 transition group-hover:scale-105 dark:bg-teal-950 dark:text-teal-300"><Icon size={18}/></span><div className="flex-1"><p className="font-semibold">{meta.label}</p><p className="text-sm text-slate-500">{meta.eyebrow}</p></div><span className="text-xs font-bold text-slate-300">0{index + 1}</span></div>})}</div>
      </Card>
    </div>
    <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-400">SpeakFlow supports independent practice, not diagnosis or treatment. Breathing guidance is a settling and coordination aid, not a cure. A qualified speech-language pathologist can tailor strategies to you.</p>
  </div></AppShell>;
}

function LoadingCoach() { return <div className="grid min-h-screen place-items-center bg-[var(--background)] p-6 text-center"><div><div className="relative mx-auto grid size-24 place-items-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><span className="absolute inset-0 animate-ping rounded-full bg-teal-300/30"/><LoaderCircle className="animate-spin" size={30}/></div><h1 className="mt-7 text-2xl font-bold">Finding a fresh passage…</h1><p className="mt-2 text-slate-500">Checking public-domain and freely licensed sources.</p></div></div>; }

function Coach({ session, notice, pace, setPace, breathingGuide, setBreathingGuide, breathEvery, setBreathEvery, sound, setSound, haptics, autoAdvance, reducedMotion, exit, finish }: { session: GuidedSession; notice: string | null; pace: Pace; setPace: (value: Pace) => void; breathingGuide: boolean; setBreathingGuide: (value: boolean) => void; breathEvery: BreathEvery; setBreathEvery: (value: BreathEvery) => void; sound: boolean; setSound: (value: boolean) => void; haptics: boolean; autoAdvance: boolean; reducedMotion: boolean; exit: () => void; finish: () => void }) {
  const [index, setIndex] = useState(0);
  const beat = session.beats[index];
  const meta = stageMeta[beat.stage];
  const Icon = meta.icon;
  const progress = ((index + 1) / session.beats.length) * 100;
  const next = () => index === session.beats.length - 1 ? finish() : setIndex((value) => value + 1);

  // Arrow keys move between steps (Space is handled by the pacer / warm-up).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (event.key === "ArrowRight") { event.preventDefault(); next(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); if (index > 0) setIndex((value) => value - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, session.beats.length]);

  return <div className="coach-screen min-h-screen">
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4"><button onClick={exit} className="icon-button" aria-label="Exit session"><ArrowLeft size={19}/></button><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800"><motion.div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400" animate={{ width: `${progress}%` }}/></div><span className="text-xs font-bold tabular-nums text-slate-500">{index + 1} / {session.beats.length}</span></div>
    </header>
    <main className="mx-auto flex min-h-[calc(100vh-69px)] max-w-6xl flex-col px-5 py-8 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20"><Icon size={20}/></span><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-700 dark:text-teal-300">{meta.eyebrow}</p><h1 className="text-xl font-bold">{meta.label}</h1></div></div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 sm:flex dark:border-slate-700 dark:bg-slate-900">{paceOptions.map((value) => <button key={value} onClick={() => setPace(value)} className={cn("rounded-full px-3 py-1 text-xs font-bold transition", pace === value ? "bg-teal-600 text-white" : "text-slate-500")}>{PACE_LABEL[value]}</button>)}</div>
          <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 sm:flex dark:border-slate-700 dark:bg-slate-900">{breathEveryOptions.map((value) => <button key={value} onClick={() => setBreathEvery(value)} className={cn("rounded-full px-3 py-1 text-xs font-bold transition", breathEvery === value ? "bg-teal-600 text-white" : "text-slate-500")}>{BREATH_EVERY_LABEL[value]}</button>)}</div>
          <button onClick={() => setBreathingGuide(!breathingGuide)} className={cn("choice-chip flex items-center gap-2 px-4", breathingGuide && "choice-chip-active")}><Wind size={15}/> Breath guide</button>
          <button onClick={() => setSound(!sound)} aria-label={sound ? "Mute sound" : "Enable sound"} className={cn("choice-chip flex items-center gap-2 px-3", sound && "choice-chip-active")}>{sound ? <Volume2 size={15}/> : <VolumeX size={15}/>}</button>
        </div>
      </div>
      {notice && index === 0 && <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-100">{notice}</p>}
      <AnimatePresence mode="wait"><motion.section key={beat.id} initial={{ opacity: 0, y: 24, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -16, filter: "blur(6px)" }} transition={{ duration: .38, ease: [0.22, 1, 0.36, 1] }} className="my-auto py-8"><BeatContent beat={beat} index={index} pace={pace} breathingGuide={breathingGuide} breathEvery={breathEvery} autoAdvance={autoAdvance} reducedMotion={reducedMotion} sound={sound} haptics={haptics}/></motion.section></AnimatePresence>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200/70 pt-5 dark:border-slate-800"><Button variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}><ArrowLeft size={17}/> Back</Button><p className="hidden text-sm text-slate-400 sm:block">Move on when you feel ready. <span className="text-slate-300">· ← → to navigate · Space to play</span></p><Button onClick={next}>{index === session.beats.length - 1 ? "Reflect" : "Continue"} <ArrowRight size={17}/></Button></div>
    </main>
  </div>;
}

function BeatContent({ beat, index, pace, breathingGuide, breathEvery, autoAdvance, reducedMotion, sound, haptics }: { beat: SessionBeat; index: number; pace: Pace; breathingGuide: boolean; breathEvery: BreathEvery; autoAdvance: boolean; reducedMotion: boolean; sound: boolean; haptics: boolean }) {
  const wpm = PACE_WPM[pace];

  if (beat.type === "breathe") return <div className="mx-auto max-w-2xl text-center">
    <BreathingWarmup language={beat.language} reducedMotion={reducedMotion} sound={sound} haptics={haptics}/>
    <CoachNote>Breathing awareness helps you settle and speak on the out-breath. It is a coordination aid, not a cure for stuttering.</CoachNote>
  </div>;

  if (beat.type === "paragraph") return <div className="mx-auto max-w-3xl">
    <div className="mb-6 text-center"><p className="text-sm font-semibold text-slate-500">{beat.title}</p>{beat.source && <p className="mt-1 text-xs text-slate-400">{beat.source.author && `${beat.source.author} · `}{beat.source.url ? <a className="inline-flex items-center gap-1 underline underline-offset-2" href={beat.source.url} target="_blank" rel="noreferrer">{beat.source.label}<ExternalLink size={11}/></a> : beat.source.label}</p>}</div>
    <BreathPacer sentences={beat.sentences ?? []} language={beat.language} wpm={wpm} breathingGuide={breathingGuide} breathEvery={breathEvery} autoAdvance={autoAdvance} reducedMotion={reducedMotion} sound={sound} haptics={haptics}/>
    <CoachNote>Speak each sentence on one easy out-breath. Commas are just gentle slow-downs, not breaths — breathe at the sentence breaks, or switch to “Free” and breathe whenever you need.</CoachNote>
  </div>;

  if (beat.type === "warmup" || beat.type === "sentence") return <div className="mx-auto max-w-3xl">
    <p className="mb-5 text-center text-sm font-semibold text-teal-700 dark:text-teal-300">{beat.type === "warmup" ? "Ease in — one phrase on the out-breath" : "Breathe, then speak this line"}</p>
    <BreathPacer sentences={beat.text ? [beat.text] : []} language={beat.language} wpm={wpm} breathingGuide={breathingGuide} breathEvery={breathEvery} autoAdvance={autoAdvance} reducedMotion={reducedMotion} sound={sound} haptics={haptics}/>
  </div>;

  // speak beats: express (own words), converse (scenario), apply (real life)
  if (beat.stage === "converse") {
    const scenario = scenarioFor(beat.language, index);
    return <div className="mx-auto max-w-3xl">
      <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-slate-400">{scenario.context}</p>
        <p className="mt-2 text-lg font-semibold">{scenario.prompt}</p>
      </div>
      <p className="mb-4 text-center text-sm font-semibold text-teal-700 dark:text-teal-300">A natural reply — follow the breaths</p>
      <BreathPacer sentences={scenario.model} language={beat.language} wpm={wpm} breathingGuide={breathingGuide} breathEvery={breathEvery} autoAdvance={autoAdvance} reducedMotion={reducedMotion} sound={sound} haptics={haptics}/>
      <CoachNote>{scenario.yourTurn}</CoachNote>
    </div>;
  }

  const prompt = beat.text ?? "";
  return <div className="mx-auto max-w-2xl text-center">
    <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">{beat.stage === "express" ? "Your turn — in your own words" : "Take it into real life"}</p>
    <h2 className="mt-5 text-3xl font-semibold leading-[1.35] tracking-tight md:text-4xl md:leading-[1.3]">{prompt}</h2>
    <CoachNote>Say your answer out loud. Plan a breath between each idea — one thought per out-breath. Stuttering is allowed; finishing the thought matters more than fluency.</CoachNote>
  </div>;
}

function CoachNote({ children }: { children: React.ReactNode }) { return <p className="mx-auto mt-8 max-w-2xl rounded-2xl border border-teal-100 bg-teal-50/70 px-5 py-4 text-sm leading-6 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100">{children}</p>; }

function Reflection({ onSave, onSkip }: { onSave: (confidence: number, comfort: number, notes: string) => void; onSkip: () => void }) {
  const [comfort, setComfort] = useState(3); const [confidence, setConfidence] = useState(3); const [notes, setNotes] = useState("");
  return <AppShell><div className="page-wrap max-w-3xl"><Badge>CHECK IN</Badge><h1 className="mt-5 text-4xl font-bold tracking-tight">How did communication feel?</h1><p className="mt-3 text-slate-500">This personal reflection adapts future suggestions. It does not diagnose or score your speech.</p><Card className="mt-8 grid gap-8 p-6 md:p-8"><Rating label="Comfort while speaking" value={comfort} setValue={setComfort}/><Rating label="Confidence sharing your message" value={confidence} setValue={setConfidence}/><label className="grid gap-2 text-sm font-semibold">A note to future you<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-28 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-normal outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-900" placeholder="What felt useful? What would you change next time?"/></label><div className="flex flex-wrap gap-3"><Button onClick={() => onSave(confidence, comfort, notes)}>Save reflection <Check size={17}/></Button><Button variant="ghost" onClick={onSkip}>Skip</Button></div></Card></div></AppShell>;
}
function Rating({ label, value, setValue }: { label: string; value: number; setValue: (value: number) => void }) { return <div><p className="font-semibold">{label}</p><div className="mt-3 grid grid-cols-5 gap-2">{[1,2,3,4,5].map((item) => <button key={item} onClick={() => setValue(item)} className={cn("choice-chip py-3", value === item && "choice-chip-active")}>{item}</button>)}</div><div className="mt-2 flex justify-between text-xs text-slate-400"><span>Difficult</span><span>Comfortable</span></div></div>; }
function Completion({ sound, haptics, restart, dashboard }: { sound: boolean; haptics: boolean; restart: () => void; dashboard: () => void }) { useEffect(() => { cueComplete({ sound, haptics }); }, [sound, haptics]); return <AppShell><div className="grid min-h-[90vh] place-items-center p-6 text-center"><motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}><div className="mx-auto grid size-24 place-items-center rounded-[2rem] bg-teal-600 text-white shadow-2xl shadow-teal-500/25"><Check size={40}/></div><h1 className="mt-7 text-4xl font-bold">You made space to speak.</h1><p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">Progress can mean more comfort, less avoidance, or simply saying what you wanted to say.</p><div className="mt-8 flex justify-center gap-3"><Button variant="secondary" onClick={restart}><RefreshCw size={17}/> Another session</Button><Button onClick={dashboard}>Dashboard</Button></div></motion.div></div></AppShell>; }
