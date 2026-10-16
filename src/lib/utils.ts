import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Session } from "./types";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const minutes = (seconds: number) => Math.max(1, Math.round(seconds / 60));
export const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2,"0")}:${String(seconds % 60).padStart(2,"0")}`;
export const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
export function streak(sessions: Session[]) {
  const dates = new Set(sessions.map((s) => new Date(s.date).toDateString()));
  let count = 0; const date = new Date();
  if (!dates.has(date.toDateString())) date.setDate(date.getDate() - 1);
  while (dates.has(date.toDateString())) { count++; date.setDate(date.getDate() - 1); }
  return count;
}
export function weekData(sessions: Session[]) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(now); date.setDate(now.getDate() - (6 - offset));
    const value = sessions.filter((s) => new Date(s.date).toDateString() === date.toDateString()).reduce((sum, s) => sum + s.duration, 0);
    return { day: date.toLocaleDateString("en", { weekday: "short" }).slice(0, 1), minutes: value };
  });
}
