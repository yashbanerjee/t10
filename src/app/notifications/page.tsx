import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Newspaper, Trophy, Vote } from "lucide-react";
import { getContests, getNews, getPolls } from "@/lib/data";

export const metadata: Metadata = { title: "Notifications", description: "New United Tigers fan contests, polls and club news." };

/* eslint-disable @next/next/no-img-element */

const isOpen = (closesAt: Date | null) => !closesAt || closesAt.getTime() > Date.now();
const day = (date: Date | null) => date ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dubai" }).format(date) : "";

type Notice = { key: string; kind: "FAN CONTEST" | "POLL" | "NEWS"; title: string; body: string; href: string; date: Date | null; image: string | null };

export default async function NotificationsPage() {
  const [contests, polls, news] = await Promise.all([getContests(), getPolls(), getNews()]);
  const notices: Notice[] = [
    ...contests.filter((contest) => isOpen(contest.closesAt)).map((contest): Notice => ({ key: `contest-${contest.id}`, kind: "FAN CONTEST", title: contest.title, body: contest.prize ? `Prize: ${contest.prize}. ${contest.description}` : contest.description, href: `/contests/${contest.slug}`, date: contest.createdAt, image: contest.image })),
    ...polls.filter((poll) => isOpen(poll.closesAt)).map((poll): Notice => ({ key: `poll-${poll.id}`, kind: "POLL", title: poll.question, body: poll.description || "Cast your vote.", href: `/polls/${poll.slug}`, date: poll.createdAt, image: null })),
    ...news.slice(0, 10).map((story): Notice => ({ key: `news-${story.id}`, kind: "NEWS", title: story.title, body: story.excerpt, href: `/news/${story.slug}`, date: story.publishedAt, image: story.coverImage })),
  ].sort((left, right) => (right.date?.getTime() ?? 0) - (left.date?.getTime() ?? 0));
  const icons = { "FAN CONTEST": Trophy, POLL: Vote, NEWS: Newspaper };
  return <div className="inner-page">
    <section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />STAY IN THE LOOP</span><h1>NOTIFI&shy;CATIONS</h1><p>New fan contests, polls and club news, newest first.</p></div></section>
    <section className="section"><div className="wrap">
      {notices.length ? <div className="notice-list">{notices.map((notice) => {
        const Icon = icons[notice.kind];
        return <Link className="notice-item" href={notice.href} key={notice.key}>
          {notice.image ? <img className="notice-thumb" src={notice.image} alt="" loading="lazy" /> : <span className="notice-thumb is-icon" aria-hidden="true"><Icon size={24} /></span>}
          <div className="notice-text">
            <div className="notice-meta"><span>{notice.kind}</span>{notice.date && <time dateTime={notice.date.toISOString()}>{day(notice.date)}</time>}</div>
            <h2>{notice.title}</h2>
            {notice.body && <p>{notice.body}</p>}
          </div>
          <ArrowUpRight className="notice-arrow" size={18} />
        </Link>;
      })}</div> : <div className="fan-empty"><h2>You are all caught up.</h2><p>New contests, polls and club news will appear here.</p></div>}
    </div></section>
  </div>;
}
