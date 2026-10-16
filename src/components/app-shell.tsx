"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BookOpenText, Home, LogIn, LogOut, Menu, Settings, Sparkles, Wind, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";

const links = [
  { href:"/dashboard", label:"Dashboard", icon:Home },
  { href:"/practice", label:"Guided practice", icon:Sparkles },
  { href:"/trainers", label:"Exercise library", icon:BookOpenText },
  { href:"/progress", label:"My progress", icon:BarChart3 },
  { href:"/settings", label:"Settings", icon:Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [open,setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setAuthed(false); return; }
    void supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session?.user));
    return () => listener.subscription.unsubscribe();
  }, []);
  return <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-[var(--background)]/90 px-5 backdrop-blur lg:hidden dark:border-slate-800"><Brand/><button aria-label="Toggle menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></header>
    <aside className={cn("fixed inset-x-0 top-16 z-20 border-b border-slate-200 bg-[var(--background)] p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:p-6 dark:border-slate-800", !open && "hidden lg:flex")}>
      <div className="hidden lg:block"><Brand/></div>
      <nav className="mt-2 grid gap-1 lg:mt-12">{links.map(({href,label,icon:Icon})=><Link onClick={()=>setOpen(false)} key={href} href={href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800", pathname.startsWith(href) && "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200")}><Icon size={19}/>{label}</Link>)}</nav>
      <div className="mt-auto hidden rounded-3xl bg-slate-900 p-4 text-white lg:block dark:bg-slate-800"><p className="text-sm font-semibold">A gentle reminder</p><p className="mt-2 text-xs leading-5 text-slate-300">Comfortable communication matters more than perfect speech.</p></div>
      {authed ? (
        <button onClick={async()=>{await getSupabase()?.auth.signOut();setAuthed(false);router.push("/auth")}} className="mt-3 hidden items-center gap-2 px-4 py-2 text-sm text-slate-500 lg:flex"><LogOut size={17}/> Sign out</button>
      ) : (
        <Link href="/auth" onClick={()=>setOpen(false)} className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-slate-500"><LogIn size={17}/> Sign in to sync</Link>
      )}
    </aside>
    <main className="min-w-0">{children}</main>
  </div>;
}
function Brand(){return <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-teal-700 text-white"><Wind size={20}/></span><span className="text-xl">Speak<span className="text-teal-700 dark:text-teal-400">Flow</span></span></Link>}
