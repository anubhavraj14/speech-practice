"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenText, CalendarDays, CheckCircle2, Clock3, Flame, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card, LinkButton } from "@/components/ui";
import { useStore } from "@/lib/store";
import { isToday, streak, weekData } from "@/lib/utils";

const quickLinks = [
  { href:"/practice", icon:Sparkles, title:"Guided session", desc:"A paced, structured routine" },
  { href:"/trainers", icon:BookOpenText, title:"Exercise library", desc:"Practise a single skill" },
  { href:"/progress", icon:BarChart3, title:"My progress", desc:"See your trends & history" },
];

export default function Dashboard() {
  const { sessions, preferences, completed, updatePreferences } = useStore();
  const today = sessions.filter((s)=>isToday(s.date)).reduce((sum,s)=>sum+s.duration,0);
  const total = sessions.reduce((sum,s)=>sum+s.duration,0); const week = weekData(sessions); const max = Math.max(preferences.goal,...week.map((d)=>d.minutes));
  const goalPct = Math.min(100, Math.round((today/preferences.goal)*100));
  return <AppShell><div className="mx-auto max-w-7xl p-5 md:p-10">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-teal-700 dark:text-teal-400">YOUR DAILY SPACE</p><h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Good to see you.</h1><p className="mt-2 text-slate-500">A little comfortable practice is enough for today.</p></div><LinkButton href="/practice" className="self-start px-7">Start practice <ArrowRight size={18}/></LinkButton></div>
    <Card className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex-1"><div className="flex items-center justify-between text-sm"><span className="font-semibold">Today’s goal</span><span className="text-slate-500">{today} / {preferences.goal} min</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-500 transition-all duration-500" style={{width:`${Math.max(3,goalPct)}%`}}/></div><p className="mt-2 text-xs text-slate-400">{goalPct>=100?"Goal reached — lovely work. Any extra is a bonus.":`${Math.max(0,preferences.goal-today)} comfortable minutes to go.`}</p></div></Card>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={<Clock3/>} label="Today" value={`${today} min`} detail={`${Math.max(0,preferences.goal-today)} min to your goal`}/>
      <Metric icon={<Flame/>} label="Current streak" value={`${streak(sessions)} days`} detail="Consistency, not perfection"/>
      <Metric icon={<CalendarDays/>} label="Total practice" value={`${total} min`} detail={`${sessions.length} sessions`}/>
      <Metric icon={<CheckCircle2/>} label="Exercises completed" value={String(completed.length)} detail="At your own pace"/>
    </section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <Card><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">This week</h2><p className="text-sm text-slate-500">Minutes practised each day</p></div><span className="text-sm font-semibold text-teal-700">{week.reduce((s,d)=>s+d.minutes,0)} min</span></div><div className="mt-7 flex h-48 items-end justify-between gap-3">{week.map((d,i)=><div key={i} className="flex h-full flex-1 flex-col justify-end gap-2 text-center"><div className="relative flex flex-1 items-end justify-center rounded-xl bg-slate-50 dark:bg-slate-800"><div className="w-full rounded-xl bg-teal-500 transition-all" style={{height:`${Math.max(5,(d.minutes/max)*100)}%`}}/></div><span className="text-xs text-slate-500">{d.day}</span></div>)}</div></Card>
      <Card className="bg-teal-900 text-white dark:bg-teal-950"><Target className="text-teal-300"/><h2 className="mt-5 text-xl font-bold">Daily intention</h2><p className="mt-2 text-sm leading-6 text-teal-100">Choose a goal that fits your day. It is a guide, never a score.</p><div className="mt-5 grid grid-cols-4 gap-2">{([10,15,20,30] as const).map(goal=><button key={goal} onClick={()=>updatePreferences({goal})} className={`rounded-xl py-2 text-sm font-bold ${preferences.goal===goal?"bg-white text-teal-900":"bg-white/10 hover:bg-white/20"}`}>{goal}</button>)}</div></Card>
    </div>
    <section className="mt-6 grid gap-4 sm:grid-cols-3">{quickLinks.map(({href,icon:Icon,title,desc})=><Link key={href} href={href} className="group"><Card className="h-full transition hover:-translate-y-0.5 hover:border-teal-300 dark:hover:border-teal-700"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Icon size={20}/></span><ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-600"/></div><p className="mt-4 font-bold">{title}</p><p className="text-sm text-slate-500">{desc}</p></Card></Link>)}</section>
    <Card className="mt-6"><h2 className="text-lg font-bold">Recent sessions</h2>{sessions.length===0?<div className="py-12 text-center"><p className="font-semibold">Your practice story starts here</p><p className="mt-1 text-sm text-slate-500">Complete a guided session to see it here.</p></div>:<div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{sessions.slice(0,5).map(s=><div key={s.id} className="flex items-center justify-between py-4"><div><p className="font-semibold">Guided session</p><p className="mt-1 text-xs text-slate-500">{new Date(s.date).toLocaleDateString(undefined,{dateStyle:"medium"})} · {s.languages.map((l)=>l==="hindi"?"Hindi":l==="hinglish"?"Hinglish":"English").join(", ")} · comfort {s.comfort}/5</p></div><span className="font-semibold">{s.duration} min</span></div>)}</div>}</Card>
  </div></AppShell>;
}
function Metric({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}){return <Card><div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">{icon}</div><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></Card>}
