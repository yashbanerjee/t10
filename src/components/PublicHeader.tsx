"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";
import { LeagueMark } from "@/components/LeagueMark";
import { LightTrail } from "@/components/LightTrail";
import { useCart } from "@/components/CartProvider";

const links = [
  ["Home", "/"],
  ["Team", "/team"],
  ["Fixtures", "/fixtures"],
  ["Stats", "/stats"],
  ["Shop", "/shop"],
  ["Vote", "/vote"],
  ["Fan Zone", "/fan"],
  ["News", "/news"],
  ["Sponsors", "/partners"],
];

const searchPages = [
  ["Team", "/team"],
  ["Fixtures", "/fixtures"],
  ["Stats centre", "/stats"],
  ["Records", "/records"],
  ["Shop", "/shop"],
  ["Vote", "/vote"],
  ["Fan Zone", "/fan"],
  ["News", "/news"],
  ["Tigers Daily", "/updates"],
  ["Player draft", "/draft"],
  ["Sponsors", "/partners"],
  ["Gallery", "/gallery"],
  ["Become a partner", "/become-a-partner"],
  ["About", "/about"],
  ["Contact", "/contact"],
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();
  const hits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return searchPages;
    return searchPages.filter(([label]) => label.toLowerCase().includes(needle));
  }, [query]);

  function go(event: FormEvent) {
    event.preventDefault();
    const target = hits[0]?.[1] ?? "/news";
    setSearching(false);
    setOpen(false);
    router.push(target);
  }

  return <header className="site-header">
    <div className="header-inner wrap">
      <TeamMark priority />
      <span className="league-chip"><LeagueMark height={14} priority /></span>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => {
          const path = href.split("#")[0] || "/";
          const active = label === "Vote" ? pathname === "/vote" || pathname.startsWith("/polls") : label === "Fan Zone" ? pathname === "/fan" || pathname.startsWith("/contests") : label === "Stats" ? pathname === "/stats" || pathname === "/records" : path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
          return <Link key={label} className={active ? "is-active" : ""} href={href}>{label}</Link>;
        })}
      </nav>
      <div className="header-tools">
        <p className="header-slogan"><span>UNITED TIGERS</span><strong>Let’s Go Hunt</strong></p>
        <button className="header-icon" type="button" aria-label={searching ? "Close search" : "Search the site"} aria-expanded={searching} onClick={() => setSearching((value) => !value)}>{searching ? <X size={16} /> : <Search size={16} />}</button>
        <Link className="header-icon header-cart" href="/cart" aria-label={`Bag, ${cart.count} items`}><ShoppingBag size={16} />{cart.count > 0 && <b>{cart.count}</b>}</Link>
        <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </div>
    </div>
    {searching && <form className="site-search wrap" onSubmit={go}>
      <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team, fixtures, shop, news" aria-label="Search the site" />
      <div>{hits.length ? hits.map(([label, href]) => <Link key={href} href={href} onClick={() => setSearching(false)}>{label}</Link>) : <span>No matching page. Try news.</span>}</div>
    </form>}
    {open && <nav className="mobile-nav" aria-label="Mobile navigation">
      {links.map(([label, href], index) => <Link key={label} onClick={() => setOpen(false)} href={href}><span>0{index + 1}</span>{label}</Link>)}
      <Link className="mobile-match-link" onClick={() => setOpen(false)} href="/cart">BAG{cart.count > 0 ? ` (${cart.count})` : ""}</Link>
      <p className="mobile-league"><LeagueMark height={14} /></p>
    </nav>}
    <LightTrail edge="bottom" />
  </header>;
}
