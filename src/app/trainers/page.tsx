"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Check, ExternalLink, Feather, Gauge, LoaderCircle, MessageCircle, RefreshCw, Wind } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, Select } from "@/components/ui";
import { languageLabels } from "@/content/exercises";
import { useStore } from "@/lib/store";
import type { GuidedSession, SessionBeat } from "@/lib/session";
import type { Category, Difficulty, Language } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories: { id: Category; label: string; description: string; detail: string; icon: typeof Wind }[] = [
  { id: "breathing", label: "Settle in", description: "Awareness into connected speech", detail: "A complete progression from releasing tension to reading a fresh passage—never just one breathing sentence.", icon: Wind },
  { id: "pace", label: "Pace & pauses", description: "Phrases, sentences, then a passage", detail: "Practise natural thought groups and optional pause points using newly retrieved book text.", icon: Gauge },
  { id: "articulation", label: "Light contact", description: "Words into longer speech", detail: "Begin with manageable source phrases, then carry an easy, unforced contact into connected reading.", icon: Feather },
  { id: "reading", label: "Read aloud", description: "Build depth and naturalness", detail: "Preview sentences, read an attributed passage, revisit it differently, and retell the meaning.", icon: BookOpen },
  { id: "prompts", label: "Speak freely", description: "From source ideas to your own", detail: "Read for context, retell, respond, and connect the passage to real-life communication.", icon: MessageCircle },
];

type Mode = "browse" | "loading" | "practice" | "complete";

export default function TrainersPage() {
  const { preferences, recent, completed, recordUsed, markCompleted } = useStore();
  const [category, setCategory] = useState<Category>("breathing");
  const [language, setLanguage] = useState<Language>(preferences.language === "mixed" ? "english" : preferences.language);
  const [difficulty, setDifficulty] = useState<Difficulty>(preferences.difficulty);
  const [mode, setMode] = useState<Mode>("browse");
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const selected = categories.find((item) => item.id === category)!;

  const loadPractice = async (refresh = false) => {
    setMode("loading"); setError(null);
    try {
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language, difficulty, category, recentIds: recent, completedIds: completed, minutes: 10, refresh }) });
      const result = await response.json() as { session?: GuidedSession; error?: string };
      if (!response.ok || !result.session) throw new Error(result.error || "Could not retrieve a passage");
      setSession(result.session); setIndex(0); recordUsed(result.session.usedIds); setMode("practice");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Online sources are unavailable. Please try again."); setMode("browse");
    }
  };

  if (mode === "loading") return <div className="grid min-h-screen place-items-center p-6 text-center"><div><LoaderCircle className="mx-auto animate-spin text-teal-600" size={38}/><h1 className="mt-5 text-2xl font-bold">Retrieving a fresh book passage…</h1><p className="mt-2 text-slate-500">Nothing is selected from a built-in exercise list.</p></div></div>;
  if ((mode === "practice" || mode === "complete") && session) return <CategoryPractice category={selected} session={session} index={index} setIndex={setIndex} complete={() => { session.usedIds.forEach(markCompleted); setMode("complete"); }} mode={mode} another={() => loadPractice(true)} exit={() => setMode("browse")}/>;

  return <AppShell><div className="page-wrap">
    <div className="max-w-3xl"><Badge>DEEP PRACTICE</Badge><h1 className="mt-4 text-4xl font-bold tracking-[-.035em] md:text-6xl">Choose a skill.<br/><span className="text-gradient">Get a complete session.</span></h1><p className="mt-5 text-lg leading-8 text-slate-500">Every category now uses a newly fetched, attributed book passage and guides you from a manageable starting point into connected speech.</p></div>
    <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-4 sm:grid-cols-2">{categories.map(({ id, label, description, detail, icon: Icon }) => <motion.button layout key={id} onClick={() => setCategory(id)} className={cn("group rounded-[1.6rem] border bg-white p-6 text-left shadow-[0_12px_35px_rgba(15,23,42,.04)] transition dark:bg-slate-900", category === id ? "border-teal-400 ring-4 ring-teal-500/10" : "border-slate-200 hover:-translate-y-1 hover:border-teal-200 dark:border-slate-800")}><div className="flex items-start justify-between"><span className={cn("grid size-12 place-items-center rounded-2xl transition", category === id ? "bg-teal-600 text-white" : "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300")}><Icon size={21}/></span>{category === id && <Check className="text-teal-600" size={20}/>}</div><h2 className="mt-5 text-xl font-bold">{label}</h2><p className="mt-1 text-sm font-medium text-teal-700 dark:text-teal-300">{description}</p><p className="mt-3 text-sm leading-6 text-slate-500">{detail}</p></motion.button>)}</div>
      <Card className="h-fit p-6 lg:sticky lg:top-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-700">Prepare session</p><h2 className="mt-2 text-2xl font-bold">{selected.label}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Fresh online material each time. Completed passages are avoided in future retrievals.</p><div className="mt-6 grid gap-5"><Select label="Language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{Object.entries(languageLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</Select><Select label="Level" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}><option value="easy">Gentle</option><option value="medium">Steady</option><option value="advanced">Stretch</option></Select>{error && <p role="alert" className="rounded-2xl bg-rose-50 p-4 text-sm leading-6 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">{error}</p>}<Button onClick={() => loadPractice()} className="w-full">Fetch and begin <ArrowRight size={17}/></Button></div></Card>
    </div>
  </div></AppShell>;
}

function CategoryPractice({ category, session, index, setIndex, complete, mode, another, exit }: { category: (typeof categories)[number]; session: GuidedSession; index: number; setIndex: (value: number | ((current: number) => number)) => void; complete: () => void; mode: Mode; another: () => void; exit: () => void }) {
  if (mode === "complete") return <AppShell><div className="grid min-h-[90vh] place-items-center p-6 text-center"><div><div className="mx-auto grid size-20 place-items-center rounded-[1.7rem] bg-teal-600 text-white"><Check size={34}/></div><h1 className="mt-6 text-4xl font-bold">Practice complete</h1><p className="mx-auto mt-3 max-w-md leading-7 text-slate-500">Fetch another source to continue this category with completely new material.</p><div className="mt-8 flex justify-center gap-3"><Button variant="secondary" onClick={exit}>Back to categories</Button><Button onClick={another}><RefreshCw size={17}/> Fetch new content</Button></div></div></div></AppShell>;
  const beat = session.beats[index];
  const progress = ((index + 1) / session.beats.length) * 100;
  return <div className="coach-screen min-h-screen"><header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75"><div className="mx-auto flex max-w-5xl items-center gap-4"><button onClick={exit} className="icon-button"><ArrowLeft size={18}/></button><div className="min-w-0"><p className="truncate text-sm font-bold">{category.label}</p><p className="text-xs text-slate-400">Step {index + 1} of {session.beats.length}</p></div><div className="ml-auto h-1.5 w-32 overflow-hidden rounded-full bg-slate-200 sm:w-64 dark:bg-slate-800"><motion.div animate={{ width: `${progress}%` }} className="h-full bg-teal-500"/></div></div></header><main className="mx-auto flex min-h-[calc(100vh-69px)] max-w-5xl flex-col px-5 py-8"><AnimatePresence mode="wait"><motion.div key={beat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="my-auto py-8"><DynamicBeat beat={beat} category={category.id} step={index}/></motion.div></AnimatePresence><div className="mt-auto flex justify-between border-t border-slate-200 pt-5 dark:border-slate-800"><Button variant="ghost" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}><ArrowLeft size={17}/> Back</Button><Button onClick={() => index === session.beats.length - 1 ? complete() : setIndex((value) => value + 1)}>{index === session.beats.length - 1 ? "Complete" : "Continue"}<ArrowRight size={17}/></Button></div></main></div>;
}

function DynamicBeat({ beat, category, step }: { beat: SessionBeat; category: Category; step: number }) {
  const guidance = category === "breathing" ? ["Let your shoulders and jaw soften. Notice an ordinary breath without making it deeper.", "Allow the next breath to arrive by itself. There is nothing to perform.", "Read this line once. Pause whenever your body asks for a breath.", "Try the next line while keeping your breathing comfortable."][Math.min(step, 3)] : category === "articulation" ? "Use light, easy contact. Clarity is useful; force is not." : category === "pace" ? "Group words by meaning. Pauses may move each time you read." : category === "reading" ? "Read for meaning, as though sharing this with one person." : "Keep attention on the idea you want to communicate. Stuttering is allowed.";
  if (beat.type === "breathe") return <div className="mx-auto max-w-2xl text-center"><div className="breath-visual mx-auto"><div className="breath-core"><Wind size={30}/></div></div><h1 className="mt-8 text-3xl font-bold md:text-5xl">{guidance}</h1><p className="mt-5 text-slate-500">Breathing awareness is only a settling step, not a treatment or cure.</p></div>;
  if (beat.type === "paragraph") return <div className="mx-auto max-w-3xl"><Source beat={beat}/><div className="reading-card mt-5"><p className="text-xl leading-[2.1] md:text-2xl">{beat.sentences?.map((sentence, index) => <span key={index}>{sentence}{index < (beat.sentences?.length || 0) - 1 && <span className="pause-dot">●</span>} </span>)}</p></div><p className="mx-auto mt-6 max-w-xl text-center text-sm leading-6 text-slate-500">{guidance}</p></div>;
  return <div className="mx-auto max-w-3xl text-center"><Source beat={beat}/><p className="mt-5 text-sm font-semibold text-teal-700 dark:text-teal-300">{guidance}</p><h1 className="mt-6 text-3xl font-semibold leading-[1.4] md:text-5xl">{beat.text}</h1></div>;
}
function Source({ beat }: { beat: SessionBeat }) { return beat.source ? <p className="text-center text-xs text-slate-400">{beat.source.author && `${beat.source.author} · `}<a href={beat.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">{beat.source.label}<ExternalLink size={11}/></a></p> : null; }
