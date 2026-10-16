"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Difficulty, Language, Preferences, Session } from "./types";
import type { ActivePassage, GuidedSession } from "./session";
import { getSupabase } from "./supabase";

interface StoreValue {
  preferences: Preferences;
  sessions: Session[];
  favorites: string[];
  completed: string[];
  recent: string[];
  /** An online passage session saved mid-way, to resume until it is completed. */
  activePassage: ActivePassage | null;
  updatePreferences: (value: Partial<Preferences>) => void;
  addSession: (session: Session) => void;
  toggleFavorite: (id: string) => void;
  markCompleted: (id: string) => void;
  recordUsed: (ids: string[]) => void;
  clearHistory: () => void;
  saveActivePassage: (session: GuidedSession, language: Language | "mixed", difficulty: Difficulty) => void;
  clearActivePassage: () => void;
}

const RECENT_CAP = 120;

const defaults: Preferences = { goal: 10, language: "mixed", difficulty: "easy", theme: "system", reducedMotion: false, showPauseMarkers: true, pace: "slow", breathingGuide: true, autoAdvance: true, breathEvery: "sentence", skills: ["breathing","pace","articulation","reading","prompts"] };
const Store = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState(defaults);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [activePassage, setActivePassage] = useState<ActivePassage | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setPreferences({ ...defaults, ...JSON.parse(localStorage.getItem("speakflow-preferences") || "{}") });
        setSessions(JSON.parse(localStorage.getItem("speakflow-sessions") || "[]"));
        setFavorites(JSON.parse(localStorage.getItem("speakflow-favorites") || "[]"));
        setCompleted(JSON.parse(localStorage.getItem("speakflow-completed") || "[]"));
        setRecent(JSON.parse(localStorage.getItem("speakflow-recent") || "[]"));
        setActivePassage(JSON.parse(localStorage.getItem("speakflow-active-passage") || "null"));
      } catch {}
      setReady(true);
    });
  }, []);

  useEffect(() => { if (ready) localStorage.setItem("speakflow-preferences", JSON.stringify(preferences)); }, [preferences, ready]);
  useEffect(() => { if (ready) localStorage.setItem("speakflow-sessions", JSON.stringify(sessions)); }, [sessions, ready]);
  useEffect(() => { if (ready) localStorage.setItem("speakflow-favorites", JSON.stringify(favorites)); }, [favorites, ready]);
  useEffect(() => { if (ready) localStorage.setItem("speakflow-completed", JSON.stringify(completed)); }, [completed, ready]);
  useEffect(() => { if (ready) localStorage.setItem("speakflow-recent", JSON.stringify(recent)); }, [recent, ready]);
  useEffect(() => { if (ready) localStorage.setItem("speakflow-active-passage", JSON.stringify(activePassage)); }, [activePassage, ready]);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const loadAccount = async (userId: string) => {
      const [{ data: profile }, { data: remoteSessions }, { data: remoteFavorites }, { data: remoteCompletions }, { data: remoteRecent }, { data: remoteActive }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("practice_sessions").select("*").order("started_at", { ascending: false }),
        supabase.from("favorites").select("exercise_id"),
        supabase.from("completions").select("exercise_id"),
        supabase.from("user_recent_content").select("content_id").order("used_at", { ascending: false }).limit(RECENT_CAP),
        supabase.from("active_passages").select("session_data").eq("user_id", userId).maybeSingle(),
      ]);
      if (profile) setPreferences({ ...defaults, goal: profile.daily_goal, language: profile.language, difficulty: profile.difficulty, theme: profile.theme, reducedMotion: profile.reduced_motion, showPauseMarkers: profile.show_pause_markers ?? true, pace: profile.pace ?? defaults.pace, breathingGuide: profile.breathing_guide ?? defaults.breathingGuide, autoAdvance: profile.auto_advance ?? defaults.autoAdvance, breathEvery: profile.breath_every ?? defaults.breathEvery, skills: profile.skills || [] });
      if (remoteSessions) setSessions(remoteSessions.map((s) => ({ id:s.id, date:s.started_at, duration:s.duration_minutes, exercises:s.exercise_ids, categories:s.categories, languages:s.languages, difficulty:s.difficulty, confidence:s.confidence, comfort:s.comfort, notes:s.notes })));
      if (remoteFavorites) setFavorites(remoteFavorites.map((x) => x.exercise_id));
      if (remoteCompletions) setCompleted(remoteCompletions.map((x) => x.exercise_id));
      if (remoteRecent) setRecent(remoteRecent.map((x) => x.content_id));
      if (remoteActive?.session_data) setActivePassage(remoteActive.session_data as ActivePassage);
    };
    void supabase.auth.getUser().then(({ data }) => data.user && loadAccount(data.user.id));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (session?.user) void loadAccount(session.user.id); });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", preferences.theme === "dark" || (preferences.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
    document.documentElement.dataset.motion = preferences.reducedMotion ? "reduced" : "full";
  }, [preferences.theme, preferences.reducedMotion]);

  const value = useMemo<StoreValue>(() => ({
    preferences, sessions, favorites, completed, recent, activePassage,
    recordUsed: (ids) => {
      setRecent((current) => [...ids, ...current.filter((id) => !ids.includes(id))].slice(0, RECENT_CAP));
      const supabase = getSupabase();
      if (supabase) void supabase.auth.getUser().then(({ data }) => data.user && supabase.from("user_recent_content").upsert(ids.map((contentId) => ({ user_id: data.user!.id, content_id: contentId, used_at: new Date().toISOString() }))));
    },
    updatePreferences: (value) => {
      setPreferences((current) => {
        const next = { ...current, ...value };
        const supabase = getSupabase();
        if (supabase) void supabase.auth.getUser().then(({data}) => data.user && supabase.from("profiles").update({ daily_goal:next.goal, language:next.language, difficulty:next.difficulty, theme:next.theme, reduced_motion:next.reducedMotion, show_pause_markers:next.showPauseMarkers, pace:next.pace, breathing_guide:next.breathingGuide, auto_advance:next.autoAdvance, breath_every:next.breathEvery, skills:next.skills, updated_at:new Date().toISOString() }).eq("id",data.user.id));
        return next;
      });
    },
    addSession: (session) => {
      setSessions((current) => [session, ...current]);
      const supabase=getSupabase(); if(supabase) void supabase.auth.getUser().then(({data})=>data.user&&supabase.from("practice_sessions").insert({ id:session.id,user_id:data.user.id,started_at:session.date,duration_minutes:session.duration,exercise_ids:session.exercises,categories:session.categories,languages:session.languages,difficulty:session.difficulty,confidence:session.confidence,comfort:session.comfort,notes:session.notes }));
    },
    toggleFavorite: (id) => {
      const removing=favorites.includes(id); setFavorites((current) => removing ? current.filter((item) => item !== id) : [...current, id]);
      const supabase=getSupabase(); if(supabase) void supabase.auth.getUser().then(({data})=>data.user&&(removing?supabase.from("favorites").delete().eq("user_id",data.user.id).eq("exercise_id",id):supabase.from("favorites").upsert({user_id:data.user.id,exercise_id:id})));
    },
    markCompleted: (id) => {
      setCompleted((current) => current.includes(id) ? current : [...current, id]);
      const supabase=getSupabase(); if(supabase) void supabase.auth.getUser().then(({data})=>data.user&&supabase.from("completions").upsert({user_id:data.user.id,exercise_id:id}));
    },
    clearHistory: () => { setSessions([]); setCompleted([]); const supabase=getSupabase(); if(supabase) void supabase.auth.getUser().then(({data})=>{if(data.user){void supabase.from("practice_sessions").delete().eq("user_id",data.user.id);void supabase.from("completions").delete().eq("user_id",data.user.id)}}); },
    saveActivePassage: (session, language, difficulty) => {
      const payload: ActivePassage = { session, language, difficulty };
      setActivePassage(payload);
      const supabase=getSupabase(); if(supabase) void supabase.auth.getUser().then(({data})=>data.user&&supabase.from("active_passages").upsert({ user_id:data.user.id, session_data:payload, updated_at:new Date().toISOString() }));
    },
    clearActivePassage: () => {
      setActivePassage(null);
      const supabase=getSupabase(); if(supabase) void supabase.auth.getUser().then(({data})=>data.user&&supabase.from("active_passages").delete().eq("user_id",data.user.id));
    },
  }), [preferences, sessions, favorites, completed, recent, activePassage]);

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useStore() {
  const value = useContext(Store);
  if (!value) throw new Error("useStore must be used within StoreProvider");
  return value;
}
