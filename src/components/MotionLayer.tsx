"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { BLOCK_FALLBACK, COUNT_SELECTORS, MOTION_EXCLUDE, MOTION_GROUPS, type MotionVariant } from "@/lib/motion";

const STEP_MS = 75;
const MAX_STEPS = 10;
const NESTED_MS = 220;
const COUNT_MS = 1400;

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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enabled || reduced) {
      root.classList.remove("motion-ready", "motion-live");
      return;
    }
    root.classList.add("motion-ready", "motion-live");
    const main = document.getElementById("main");
    if (!main) return;

    const counted = new WeakSet<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const parent = entry.target.parentElement;
        // Cards in a sideways-scrolling row never cross the viewport on their own, so the row enters together.
        const row = parent && parent.scrollWidth > parent.clientWidth + 1 ? Array.from(parent.children).filter((child) => child instanceof HTMLElement && child.dataset.motion) : [entry.target];
        for (const item of row) {
          item.classList.add("is-revealed");
          observer.unobserve(item);
        }
        for (const number of entry.target.querySelectorAll(COUNT_SELECTORS.join(","))) {
          if (counted.has(number)) continue;
          counted.add(number);
          countUp(number);
        }
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });

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
        element.style.setProperty("--reveal-delay", `${(siblings.indexOf(element) % MAX_STEPS) * STEP_MS + nested}ms`);
        observer.observe(element);
      }
    };

    let frame = 0;
    let idle = 0;
    let timer = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    // The page segment hydrates after this layout effect, so tagging waits for an idle moment.
    const start = () => {
      scan();
      mutations.observe(main, { childList: true, subtree: true });
    };
    const whenIdle = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(start, { timeout: 700 });
      else timer = setTimeout(start, 120) as unknown as number;
    };
    if (document.readyState === "complete") whenIdle();
    else window.addEventListener("load", whenIdle, { once: true });
    return () => {
      window.removeEventListener("load", whenIdle);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
    };
  }, [pathname, enabled]);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.current?.style.setProperty("--scroll", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname, enabled]);

  return enabled ? <div ref={bar} className="scroll-progress" aria-hidden="true" /> : null;
}
