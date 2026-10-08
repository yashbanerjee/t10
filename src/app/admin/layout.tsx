"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, Gift, Images, LayoutDashboard, ListOrdered, LogOut, Mail, Megaphone, Newspaper, Settings, Shield, ShoppingBag, UserRound, Trophy, BriefcaseBusiness, Vote, Receipt } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";

const navGroups = [
  { label: "OVERVIEW", links: [{ title: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
  { label: "TEAM & MATCHES", links: [{ title: "Players", href: "/admin/players", icon: UserRound }, { title: "Coaching & staff", href: "/admin/staff", icon: BriefcaseBusiness }, { title: "Fixtures & matches", href: "/admin/matches", icon: CalendarDays }, { title: "Statistics", href: "/admin/records", icon: BarChart3 }, { title: "Points table", href: "/admin/standings", icon: ListOrdered }] },
  { label: "PUBLISHING", links: [{ title: "News", href: "/admin/news", icon: Newspaper }, { title: "Daily updates", href: "/admin/updates", icon: Megaphone }, { title: "Gallery", href: "/admin/gallery", icon: Images }, { title: "Partners", href: "/admin/sponsors", icon: Trophy }] },
  { label: "FANS", links: [{ title: "Merchandise", href: "/admin/products", icon: ShoppingBag }, { title: "Shop orders", href: "/admin/orders", icon: Receipt }, { title: "Polls", href: "/admin/polls", icon: Vote }, { title: "Contests", href: "/admin/contests", icon: Gift }] },
  { label: "ORGANIZATION", links: [{ title: "Messages", href: "/admin/contacts", icon: Mail }, { title: "Site settings", href: "/admin/settings", icon: Settings }, { title: "Audit log", href: "/admin/audit", icon: Shield }] },
  { label: "ADMIN ACCESS", links: [{ title: "Admin users", href: "/admin/users", icon: UserRound }, { title: "Roles & permissions", href: "/admin/roles", icon: Shield }] },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (pathname === "/admin/login") { setLoading(false); return; }
    fetch("/api/v1/auth/me").then((response) => response.ok ? response.json() : null).then((result) => {
      if (!result?.success) router.replace("/admin/login"); else setUser(result.data);
    }).catch(() => router.replace("/admin/login")).finally(() => setLoading(false));
  }, [pathname, router]);
  if (pathname === "/admin/login") return <>{children}</>;
  if (loading || !user) return <div className="admin-loading"><span className="admin-spinner" />SECURE ADMIN SESSION</div>;
  async function logout() { await fetch("/api/v1/auth/logout", { method: "POST" }); router.replace("/admin/login"); }
  return <div className="admin-shell">
    <aside className="admin-sidebar"><TeamMark compact tone="light" /><span className="admin-section-label">OFFICIAL CMS</span>{navGroups.filter((group) => group.label !== "ADMIN ACCESS" || user.role === "SUPER_ADMIN").map((group) => <div key={group.label}><p className="admin-side-label">{group.label}</p><nav className="admin-side-nav">{group.links.map(({ title, href, icon: Icon }) => <Link title={title} key={href} href={href} className={pathname === href || (href !== "/admin" && pathname.startsWith(href)) ? "active" : ""}><Icon size={15} /><span>{title}</span></Link>)}</nav></div>)}<div className="admin-user"><div className="admin-avatar">{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><strong>{user.name}</strong><small>{user.role.replaceAll("_", " ")}</small></div><button className="admin-logout" onClick={logout} aria-label="Sign out"><LogOut size={14} /></button></div></aside>
    <div className="admin-main"><header className="admin-topbar"><span className="crumb">UNITED TIGERS <b>/</b> ADMIN</span><Link href="/" target="_blank">VIEW WEBSITE ↗</Link></header>{children}</div>
  </div>;
}

