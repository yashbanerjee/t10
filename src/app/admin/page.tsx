"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronRight, CircleAlert, FileText, Images, Mail, Megaphone, Plus, ShieldCheck, Users } from "lucide-react";

type Summary = { players: number; matches: number; news: number; updates: number; gallery: number; sponsors: number; unreadMessages: number; upcoming?: { date: string; opponent: string } | null; storage?: string };
export default function AdminDashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  useEffect(() => { fetch("/api/v1/admin/dashboard").then((response) => response.json()).then((result) => setData(result.data)).catch(() => setData(null)); }, []);
  const cards = [
    ["Players", data?.players ?? "—", "TEAM & STAFF", Users, "/admin/players"], ["Upcoming match", data?.upcoming?.opponent ?? "Schedule pending", "NEXT FIXTURE", CalendarDays, "/admin/matches"],
    ["News articles", data?.news ?? "—", "PUBLISHED & DRAFTS", FileText, "/admin/news"], ["Team updates", data?.updates ?? "—", "TIGERS DAILY", Megaphone, "/admin/updates"],
    ["Gallery items", data?.gallery ?? "—", "MEDIA LIBRARY", Images, "/admin/gallery"], ["Unread messages", data?.unreadMessages ?? "—", "CONTACT INBOX", Mail, "/admin/contacts"],
  ] as const;
  return <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />CLUB OPERATIONS</span><h1>Dashboard</h1><p>Manage what fans see across the United Tigers digital home.</p></div><Link className="admin-primary-btn" href="/admin/news/new"><Plus size={13} /> WRITE A STORY</Link></div>
    {data?.storage === "DATABASE_NOT_CONNECTED" && <div className="admin-demo-alert"><CircleAlert size={14} /> Admin demo session is active. Connect PostgreSQL and run the seed command to enable persistent content editing.</div>}
    <div className="admin-stat-grid">{cards.map(([title, value, label, Icon, href]) => <Link className="admin-stat-card" key={title} href={href}><div className="admin-metric-top"><span>{label}</span><Icon size={15} /></div><strong>{value}</strong><small>{title} <ChevronRight size={11} /></small></Link>)}</div>
    <div className="admin-dashboard-grid"><section className="admin-panel"><div className="admin-panel-header"><h2>CONTENT ACTIVITY</h2><Link href="/admin/audit">VIEW AUDIT LOG ↗</Link></div><div className="admin-activity"><div className="admin-activity-row"><span>Player profiles are ready for confirmation</span><span><Users size={12} /> TEAM</span></div><div className="admin-activity-row"><span>Fixture schedule pending from competition</span><span><CalendarDays size={12} /> MATCHES</span></div><div className="admin-activity-row"><span>Connect database to begin CMS editing</span><span><ShieldCheck size={12} /> SYSTEM</span></div></div></section><section className="admin-panel"><div className="admin-panel-header"><h2>QUICK PUBLISH</h2><span className="admin-panel-badge">SHORTCUTS</span></div><div className="admin-shortcuts"><Link href="/admin/news"><FileText size={16} /><span><strong>Write a story</strong><small>Create news or an announcement</small></span><ArrowUpRight size={14} /></Link><Link href="/admin/updates"><Megaphone size={16} /><span><strong>Post a team update</strong><small>Publish to Tigers Daily</small></span><ArrowUpRight size={14} /></Link><Link href="/admin/players"><Users size={16} /><span><strong>Update the squad</strong><small>Edit player profiles and details</small></span><ArrowUpRight size={14} /></Link></div></section></div>
  </div>;
}

