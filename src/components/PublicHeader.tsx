"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, Ticket, X } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";
import { track } from "@/lib/analytics";
import { useCart } from "@/components/CartProvider";

const links = [
  ["Home", "/"],
  ["Team", "/team"],
  ["Fixtures", "/fixtures"],
  ["Shop", "/shop"],
  ["Vote", "/fan#vote"],
  ["Fan Zone", "/fan"],
  ["News", "/news"],
  ["Sponsors", "/partners"],
];

const searchPages = [
  ["Team", "/team"],
  ["Fixtures", "/fixtures"],
  ["Shop", "/shop"],
  ["Vote", "/fan#vote"],
  ["Fan Zone", "/fan"],
  ["News", "/news"],
  ["Sponsors", "/partners"],
  ["Gallery", "/gallery"],
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
      <span className="league-chip">ABU DHABI <b>T10</b></span>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => {
          const path = href.split("#")[0] || "/";
          const active = label === "Vote" ? pathname.startsWith("/polls") : label === "Fan Zone" ? pathname === "/fan" || pathname.startsWith("/contests") : path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
          return <Link key={label} className={active ? "is-active" : ""} href={href}>{label}</Link>;
        })}
      </nav>
      <div className="header-tools">
        <p className="header-slogan"><span>UNITED TIGERS</span><strong>Let’s Go Hunt</strong></p>
        <button className="header-icon" type="button" aria-label={searching ? "Close search" : "Search the site"} aria-expanded={searching} onClick={() => setSearching((value) => !value)}>{searching ? <X size={16} /> : <Search size={16} />}</button>
        <Link className="header-icon header-cart" href="/cart" aria-label={`Bag, ${cart.count} items`}><ShoppingBag size={16} />{cart.count > 0 && <b>{cart.count}</b>}</Link>
        <Link className="header-tickets" href="/fixtures" onClick={() => track("fixture_click", { href: "/fixtures" })}><Ticket size={15} /> TICKETS</Link>
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
      <Link className="mobile-match-link" onClick={() => setOpen(false)} href="/fixtures">TICKETS</Link>
    </nav>}
  </header>;
}
