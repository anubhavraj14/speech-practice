import { describe, expect, it } from "vitest";
import { formatTime, streak, weekData } from "../src/lib/utils";
import type { Session } from "../src/lib/types";

const session = (date: Date, duration=15): Session => ({ id:crypto.randomUUID(), date:date.toISOString(), duration, exercises:[], categories:["pace"], languages:["english"], difficulty:"easy", confidence:3, comfort:4, notes:"" });
describe("practice metrics", () => {
  it("formats timer values", () => expect(formatTime(125)).toBe("02:05"));
  it("counts a streak including today", () => { const today=new Date(); const yesterday=new Date(); yesterday.setDate(today.getDate()-1); expect(streak([session(today),session(yesterday)])).toBe(2); });
  it("aggregates minutes for the week", () => expect(weekData([session(new Date(),20)]).at(-1)?.minutes).toBe(20));
});
