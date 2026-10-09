"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MOTION_TARGETS, STAGGER_SELECTORS } from "@/lib/motion";

const STEP_MS = 80;
const MAX_STEPS = 6;

export function MotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (pathname.startsWith("/admin") || reduced) {
      root.classList.remove("motion-ready", "motion-live");
      return;
    }
    root.classList.add("motion-ready", "motion-live");
    const main = document.getElementById("main");
    if (!main) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    const watched = new WeakSet<Element>();
    const scan = () => {
      for (const grid of main.querySelectorAll<HTMLElement>(STAGGER_SELECTORS.join(","))) {
        Array.from(grid.children).forEach((child, index) => (child as HTMLElement).style.setProperty("--reveal-delay", `${(index % MAX_STEPS) * STEP_MS}ms`));
      }
      for (const element of main.querySelectorAll<HTMLElement>(MOTION_TARGETS.join(","))) {
        if (element.classList.contains("is-revealed") || watched.has(element)) continue;
        watched.add(element);
        observer.observe(element);
      }
    };

    scan();
    let frame = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mutations.observe(main, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
