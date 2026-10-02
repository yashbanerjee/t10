"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";
import { track } from "@/lib/analytics";

const links = [
  ["Team", "/team"], ["Fixtures", "/fixtures"], ["Stats", "/stats"], ["News", "/news"], ["Updates", "/updates"], ["About", "/about"],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <div className="header-inner wrap">
      <TeamMark />
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <Link className="header-cta" href="/fixtures" onClick={() => track("fixture_click", { href: "/fixtures" })}>MATCH CENTRE <ArrowUpRight size={15} /></Link>
      <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="mobile-nav" aria-label="Mobile navigation">
      {links.map(([label, href], index) => <Link key={href} style={{ "--i": index } as React.CSSProperties} onClick={() => setOpen(false)} href={href}><span>0{index + 1}</span>{label}<ArrowUpRight size={16} /></Link>)}
      <Link className="mobile-match-link" onClick={() => setOpen(false)} href="/fixtures">MATCH CENTRE <ArrowUpRight size={16} /></Link>
    </nav>}
  </header>;
}

