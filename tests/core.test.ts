import test from "node:test";
import assert from "node:assert/strict";
import { summarize } from "../src/lib/stats";
import { hasPermission } from "../src/lib/auth";
import { contactSubmissionSchema, loginSchema } from "../src/lib/validation";
import { calculatePlayerReport } from "../src/lib/performance";

const match = (matchId: string, year: number) => ({ id: `innings-${matchId}`, matchId, match: { season: { year } } });

test("batting and bowling calculations use scorecard totals and cricket over notation", () => {
  const batting = [
    { innings: match("m1", 2026), runs: 30, balls: 15, fours: 3, sixes: 2, dismissal: "caught" },
    { innings: match("m1", 2026), runs: 20, balls: 10, fours: 2, sixes: 1, dismissal: "not out" },
    { innings: match("m0", 2025), runs: 60, balls: 30, fours: 4, sixes: 3, dismissal: "bowled" },
  ];
  const bowling = [
    { innings: match("m1", 2026), overs: 1.2, maidens: 0, runs: 24, wickets: 2 },
    { innings: match("m0", 2025), overs: 2, maidens: 0, runs: 12, wickets: 1 },
  ];
  const fielding = [
    { catches: 1, runOuts: 0, stumpings: 0, match: { season: { year: 2026 } } },
    { catches: 2, runOuts: 1, stumpings: 1, match: { season: { year: 2025 } } },
  ];
  const current = summarize(batting, bowling, fielding, 2026);
  assert.equal(current.matches, 1);
  assert.equal(current.runs, 50);
  assert.equal(current.average, 50);
  assert.equal(current.strikeRate, 200);
  assert.equal(current.highestScore, 30);
  assert.equal(current.bowlingOvers, "1.2");
  assert.equal(current.economy, 18);
  assert.equal(current.bowlingAverage, 12);
  assert.equal(current.catches, 1);
  const career = summarize(batting, bowling, fielding);
  assert.equal(career.matches, 2);
  assert.equal(career.runs, 110);
  assert.equal(career.catches, 3);
});

test("role permissions keep content and statistics scopes distinct", () => {
  assert.equal(hasPermission("SUPER_ADMIN", "USERS_WRITE"), true);
  assert.equal(hasPermission("EDITOR", "CONTENT_WRITE"), true);
  assert.equal(hasPermission("EDITOR", "MATCH_WRITE"), false);
  assert.equal(hasPermission("STATISTICS_MANAGER", "STATS_WRITE"), true);
  assert.equal(hasPermission("STATISTICS_MANAGER", "CONTENT_WRITE"), false);
});

test("contact and sign-in inputs reject malformed or oversized values", () => {
  assert.equal(loginSchema.safeParse({ email: "admin@example.com", password: "a-strong-password" }).success, true);
  assert.equal(loginSchema.safeParse({ email: "not-an-email", password: "short" }).success, false);
  assert.equal(contactSubmissionSchema.safeParse({ name: "A", email: "wrong", subject: "hi", message: "short" }).success, false);
  assert.equal(contactSubmissionSchema.safeParse({ name: "Sam User", email: "fan@example.com", subject: "Partnership", message: "I would like to learn more about partnership opportunities." }).success, true);
});

test("player report index is scorecard-derived and omitted without recorded performance", () => {
  assert.equal(calculatePlayerReport({ matches: 0, innings: 0, runs: 0, average: null, strikeRate: null, wickets: 0, economy: null, catches: 0, runOuts: 0, stumpings: 0 }), null);
  assert.deepEqual(calculatePlayerReport({ matches: 1, innings: 1, runs: 40, average: 40, strikeRate: 200, wickets: 0, economy: null, catches: 1, runOuts: 0, stumpings: 0 }), { overall: 58, batting: 100, bowling: null, fielding: 15 });
});

