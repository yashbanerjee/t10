"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BLOCK_FALLBACK, COUNT_SELECTORS, MOTION_EXCLUDE, MOTION_GROUPS, moodFor, type MotionVariant } from "@/lib/motion";

const STEP_MS = 60;
const MAX_STEPS = 8;
const NESTED_MS = 140;
const COUNT_MS = 1100;
const WELCOME_KEY = "ut-welcome";

const groups = Object.entries(MOTION_GROUPS) as [MotionVariant, readonly string[]][];

function countUp(element: Element) {
  const node = Array.from(element.childNodes).find((child) => child.nodeType === Node.TEXT_NODE && child.nodeValue?.trim());
  const match = node?.nodeValue?.match(/^(\s*)(\d[\d,]*)([^]*)$/);
  if (!node || !match) return;
  const [, lead, digits, tail] = match;
  const target = Number(digits.replaceAll(",", ""));
  if (!Number.isFinite(target) || target === 0) return;
  const original = node.nodeValue;
  const started = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - started) / COUNT_MS);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.nodeValue = progress < 1 ? `${lead}${Math.round(target * eased).toLocaleString("en-US")}${tail}` : original;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function MotionLayer() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const enabled = !pathname.startsWith("/admin");

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mood = moodFor(pathname);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enabled || reduced) {
      root.classList.remove("motion-ready", "motion-live");
      return;
    }
    root.classList.add("motion-ready", "motion-live");
    let seen = false;
    try { seen = localStorage.getItem(WELCOME_KEY) === "1"; } catch { /* private mode keeps the welcome */ }
    root.classList.toggle("is-return", seen);
    root.classList.toggle("is-welcome", !seen);
    const main = document.getElementById("main");
    if (!main) return;

    const counted = new WeakSet<Element>();
    const countInside = (scope: Element) => {
      for (const number of scope.querySelectorAll(COUNT_SELECTORS.join(","))) {
        if (counted.has(number)) continue;
        counted.add(number);
        countUp(number);
      }
    };
    const show = (item: Element) => {
      item.classList.add("is-revealed");
      observer.unobserve(item);
      countInside(item);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const parent = entry.target.parentElement;
        // Cards in a sideways-scrolling row never cross the viewport on their own, so the row enters together.
        const row = parent && parent.scrollWidth > parent.clientWidth + 1 ? Array.from(parent.children).filter((child) => child instanceof HTMLElement && child.dataset.motion) : [entry.target];
        for (const item of row) show(item);
      }
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.04 });

    const watched = new WeakSet<Element>();
    const scan = () => {
      const found = new Map<HTMLElement, MotionVariant>();
      for (const [variant, selectors] of groups) {
        for (const element of main.querySelectorAll<HTMLElement>(selectors.join(","))) if (!found.has(element)) found.set(element, variant);
      }
      for (const element of main.querySelectorAll<HTMLElement>(BLOCK_FALLBACK.join(","))) if (!found.has(element)) found.set(element, "rise");

      const fresh = [...found].filter(([element]) => !watched.has(element) && !element.matches(MOTION_EXCLUDE) && !element.classList.contains("is-revealed"));
      for (const [element, variant] of fresh) {
        watched.add(element);
        element.dataset.motion = variant;
      }
      for (const [element] of fresh) {
        const siblings = element.parentElement ? Array.from(element.parentElement.children).filter((child) => found.has(child as HTMLElement)) : [element];
        const nested = element.parentElement?.closest("[data-motion]") ? NESTED_MS : 0;
        element.style.setProperty("--reveal-delay", `${(siblings.indexOf(element) % MAX_STEPS) * (seen ? 30 : STEP_MS) + nested}ms`);
        const box = element.getBoundingClientRect();
        if (box.top < window.innerHeight * 0.96 && box.bottom > 0) show(element);
        else observer.observe(element);
      }
    };

    let frame = 0;
    let idle = 0;
    let timer = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    // One frame lets the page segment hydrate; idle keeps the first paint free of extra work.
    const start = () => {
      scan();
      mutations.observe(main, { childList: true, subtree: true });
    };
    const whenIdle = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 240 });
      else timer = setTimeout(start, 80) as unknown as number;
    };
    const kickoff = requestAnimationFrame(whenIdle);
    const remember = window.setTimeout(() => {
      try { localStorage.setItem(WELCOME_KEY, "1"); } catch { /* the welcome simply plays again next time */ }
    }, 1800);
    const settle = window.setTimeout(() => root.classList.add("motion-settle"), seen ? 350 : 700);
    // Loops inside a section stop while it is off screen, so scrolling stays light.
    const quiet = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.classList.toggle("is-quiet", !entry.isIntersecting);
    }, { rootMargin: "120px 0px" });
    for (const scene of document.querySelectorAll(".home-stage, .home-board, .home-pulse, .home-feature-kit, .partner-rail, .inner-hero, .inner-page > .section, .site-footer")) quiet.observe(scene);
    return () => {
      cancelAnimationFrame(kickoff);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      window.clearTimeout(remember);
      window.clearTimeout(settle);
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      quiet.disconnect();
    };
  }, [pathname, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty("--scroll", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    let settled = 0;
    const onScroll = () => {
      root.classList.add("is-scrolling");
      window.clearTimeout(settled);
      settled = window.setTimeout(() => root.classList.remove("is-scrolling"), 140);
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settled);
      root.classList.remove("is-scrolling");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname, enabled]);

  return enabled ? <div ref={bar} className="scroll-progress" aria-hidden="true" /> : null;
}
