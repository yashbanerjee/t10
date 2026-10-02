import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, MoveDown, Trophy } from "lucide-react";
import { getContests, getCurrentSeason, getMatches, getNews, getPlayers, getPolls, getProducts, getPublicSettings, getRecords, getSponsors, getUpdates } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { PlayerCard } from "@/components/PlayerCard";
import { NewsCard, UpdateCard } from "@/components/ContentCards";
import { SectionHeading } from "@/components/SectionHeading";
import { EmptyState } from "@/components/EmptyState";
import { Reveal } from "@/components/Reveal";
import { StatusBadge } from "@/components/Badge";
import { LiveScore } from "@/components/LiveScore";
import { getLivePollIntervalMs } from "@/lib/site-settings";

export const metadata: Metadata = { title: "United Tigers | The Tigers Are Ready", description: "The official digital home of United Tigers. Meet the squad and follow the team into the 2026 Abu Dhabi T10 season." };

export default async function HomePage() {
  const [players, matches, news, updates, sponsors, records, settings, season, pollIntervalMs, products, polls, contests] = await Promise.all([getPlayers(), getMatches(), getNews(), getUpdates(), getSponsors(), getRecords(), getPublicSettings(), getCurrentSeason(), getLivePollIntervalMs(), getProducts(), getPolls(), getContests()]);
  const homepage = (settings.homepage ?? {}) as Record<string, unknown>;
  const featuredPlayer = players.find((player) => player.isIconPlayer) ?? players[0];
  const upcoming = matches.find((match) => match.status === "UPCOMING" || match.status === "LIVE");
  const previous = [...matches].reverse().find((match) => match.status === "COMPLETED");
  const headline = typeof homepage.title === "string" ? homepage.title : "THE TIGERS ARE READY.";
  const heroImage = typeof homepage.heroImage === "string" ? homepage.heroImage : "/images/stadium-hero.png";
  const seasonYear = "year" in season ? season.year : 2026;
  const completed = matches.filter((match) => match.status === "COMPLETED");
  const wins = completed.filter((match) => /united tigers won/i.test(match.result || "")).length;
  const runsScored = completed.reduce((total, match) => total + match.innings.filter((entry) => entry.battingTeam === "United Tigers").reduce((sum, entry) => sum + entry.runs, 0), 0);
  const wicketsTaken = completed.reduce((total, match) => total + match.innings.filter((entry) => entry.battingTeam !== "United Tigers").reduce((sum, entry) => sum + entry.wickets, 0), 0);
  return <>
    <section className="home-hero" style={{ "--hero-image": `url('${heroImage}')` } as React.CSSProperties}>
      <div className="hero-orbit" aria-hidden="true" /><span className="hero-scroll-ball" aria-hidden="true" />
      <div className="hero-content">
        <div className="hero-overline"><span />ABU DHABI T10 · {seasonYear}</div>
        <span className="hero-kicker">{headline}</span>
        <h1>UNITED<span>TIGERS</span></h1>
        <p className="hero-subtitle">{typeof homepage.subtitle === "string" ? homepage.subtitle : "The next chapter starts here. Meet the squad, follow the build-up and get ready for cricket at full throttle."}</p>
        <div className="hero-actions"><Link className="button button-primary" href="/team">VIEW SQUAD <ArrowRight size={15} /></Link><Link className="button button-outline" href="/fixtures">FIXTURES <ArrowUpRight size={15} /></Link></div>
      </div>
      <div className="hero-index"><i />2026 · ABU DHABI</div><a className="hero-scroll" href="#season"><span>SCROLL TO EXPLORE</span><i /><MoveDown size={13} /></a>
    </section>
    <div className="ticker"><div className="ticker-inner wrap"><span>UNITED TIGERS</span><i /><span>ABU DHABI T10</span><i /><span>THE FASTEST FORMAT</span><i /><span>2026 SEASON</span><i /><span>UNITED TIGERS</span></div></div>
    <section className="fan-launch"><div className="wrap fan-launch-grid">
      <Link href="/shop"><span>01 · KIT</span><h2>{products[0]?.name ?? "THE SHOP"}</h2><p>{products[0] ? formatMoney(products[0].price) : "Colours, sizes and a bag that books with your phone."}</p></Link>
      <Link href={polls[0] ? `/polls/${polls[0].slug}` : "/fan"}><span>02 · POLL</span><h2>{polls[0]?.question ?? "HAVE YOUR SAY"}</h2><p>Vote with your name, email and phone.</p></Link>
      <Link href={contests[0] ? `/contests/${contests[0].slug}` : "/fan"}><span>03 · CONTEST</span><h2>{contests[0]?.title ?? "WIN WITH THE TIGERS"}</h2><p>{contests[0]?.prize ?? "Club contests open from the fan zone."}</p></Link>
    </div></section>

    <section className="section" id="season"><div className="wrap">
      <SectionHeading overline="MATCH DAY" title={upcoming?.status === "LIVE" ? "LIVE NOW" : "NEXT UP"} href="/fixtures" linkText="ALL FIXTURES" />
      {upcoming ? <div className="next-match">
        <div className="match-caption"><StatusBadge live={upcoming.status === "LIVE"}>{upcoming.status}</StatusBadge><strong>{upcoming.competition ?? "2026 T10 SEASON"}</strong><small>{upcoming.matchNumber ?? "FIXTURE"}</small></div>
        <div className="match-fixture"><div className="match-teams"><span className="match-team-home">UNITED TIGERS</span><span className="vs-mark">VS</span><span>{upcoming.opponent.toUpperCase()}</span></div><div className="fixture-placeholder">{upcoming.status === "LIVE" ? "SCORE UPDATING" : "TIGERS READY FOR THE NEXT CHALLENGE"}</div></div>
        <div className="match-details"><div className="detail-line"><span>DATE</span><strong>{new Date(upcoming.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dubai" })}</strong></div><div className="detail-line"><span>VENUE</span><strong>{upcoming.venue?.name ?? "Venue TBC"}</strong></div><Link className="text-link" href={`/matches/${upcoming.slug}`}>MATCH CENTRE <ArrowUpRight size={14} /></Link></div>
      </div> : <div className="next-match">
        <div className="match-caption"><span className="eyebrow"><i className="eyebrow-dot" />2026 SEASON</span><strong>THE COUNTDOWN STARTS HERE.</strong><small>FIXTURE LIST PENDING</small></div>
        <div className="match-fixture"><div className="match-teams"><span className="match-team-home">UNITED TIGERS</span><span className="vs-mark">VS</span><span>THE FIELD</span></div><div className="fixture-placeholder">OFFICIAL FIXTURES WILL APPEAR HERE</div></div>
        <div className="match-details"><div className="detail-line"><span>SEASON</span><strong>ABU DHABI T10 · 2026</strong></div><div className="detail-line"><span>FIRST BALL</span><strong>TO BE ANNOUNCED</strong></div><Link className="text-link" href="/fixtures">FOLLOW FIXTURES <ArrowUpRight size={14} /></Link></div>
      </div>}
      {upcoming?.status === "LIVE" && <LiveScore slug={upcoming.slug} pollIntervalMs={pollIntervalMs} initial={{ status: upcoming.status, liveState: upcoming.liveState as never, innings: upcoming.innings.map((entry) => ({ runs: entry.runs, wickets: entry.wickets, overs: entry.overs.toString() })) }} />}
      <div className="last-match-card"><div><span className="eyebrow"><i className="eyebrow-dot" />LAST MATCH</span><h3>{previous ? previous.result || `UNITED TIGERS vs ${previous.opponent}` : "THE FIRST INNINGS IS STILL AHEAD."}</h3><p>{previous ? `${previous.venue?.name ?? "Venue to be confirmed"} · ${new Date(previous.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dubai" })}` : "The Tigers are preparing for their debut season. Results and scorecards will live here after the opening match."}</p></div>{previous ? <Link className="button button-outline" href={`/matches/${previous.slug}`}>VIEW SCORECARD <ArrowUpRight size={15} /></Link> : <span className="first-match-mark"><Trophy size={20} />01</span>}</div>
      <div className="season-strip" style={{ marginTop: 18 }}>
        <div className="season-stat"><span>Matches played</span><strong>{completed.length || "—"}</strong><small>{completed.length ? "2026 season" : "Scorecards to come"}</small></div>
        <div className="season-stat"><span>Wins</span><strong>{completed.length ? wins : "—"}</strong><small>Season record</small></div>
        <div className="season-stat"><span>Runs scored</span><strong>{completed.length ? runsScored : "—"}</strong><small>Team total</small></div>
        <div className="season-stat"><span>Wickets taken</span><strong>{completed.length ? wicketsTaken : "—"}</strong><small>Team total</small></div>
      </div>
    </div></section>

    <section className="section section-dark"><div className="wrap">
      <SectionHeading overline="THE PEOPLE BEHIND THE STRIPES" title="MEET THE SQUAD" href="/team" linkText="FULL SQUAD" />
      <div className="player-feature">
        {featuredPlayer && <PlayerCard player={featuredPlayer} featured />}
        <Reveal className="player-feature-copy"><span className="eyebrow"><i className="eyebrow-dot" />ICON PLAYER</span><h3>{featuredPlayer?.fullName ?? "THE TIGERS"}</h3><p>Fakhar Zaman leads the announced names as the United Tigers icon player for the 2026 Abu Dhabi T10. Player roles and profile details will be confirmed by the club.</p><Link className="text-link" href={featuredPlayer ? `/players/${featuredPlayer.slug}` : "/team"}>PLAYER PROFILE <ArrowUpRight size={14} /></Link></Reveal>
      </div>
      <div className="player-grid" style={{ marginTop: 26 }}>{players.filter((player) => !player.isIconPlayer).slice(0, 3).map((player) => <PlayerCard key={player.id} player={player} />)}</div>
    </div></section>

    <section className="section"><div className="wrap">
      <SectionHeading overline="INSIDE THE TIGERS" title="THE DAILY" href="/updates" linkText="ALL UPDATES" />
      {updates.length ? <div className="update-grid">{updates.slice(0, 3).map((item) => <UpdateCard key={item.id} item={item} />)}</div> : <EmptyState title="No team updates yet" description="Training notes, match-day moments and news from the Tigers will be published here." />}
    </div></section>

    <section className="section section-dark"><div className="wrap">
      <SectionHeading overline="THE LATEST" title="TIGERS NEWSROOM" href="/news" linkText="ALL STORIES" />
      {news.length ? <div className="news-grid">{news.slice(0, 3).map((item, index) => <NewsCard key={item.id} item={item} featured={index === 0} />)}</div> : <EmptyState title="The story starts soon" description="Official team news and match reports will appear here." kind="news" />}
    </div></section>

    <section className="section"><div className="wrap">
      <SectionHeading overline="BUILT ON BIG MOMENTS" title="RECORDS START HERE" href="/records" linkText="RECORDS & STATS" />
      {records.length ? <div className="record-grid">{records.slice(0, 3).map((record) => <div className="record-card" key={record.id}><span>{record.scope} · {record.category}</span><strong>{record.value}</strong><h3>{record.title}</h3><p>{record.playerName || "United Tigers"}</p></div>)}</div> : <div className="announcement-band"><div><span>NEW TEAM. CLEAN SCOREBOARD.</span><strong>EVERY RECORD IS STILL TO BE WRITTEN.</strong></div><Link href="/stats" aria-label="Explore statistics"><ArrowUpRight size={21} /></Link></div>}
    </div></section>

    <section className="section section-dark"><div className="wrap">
      <div className="section-heading"><div><span className="eyebrow"><i className="eyebrow-dot" />THE TIGERS FAMILY</span><h2>POWERED BY<br />OUR PARTNERS</h2></div><Link className="text-link" href="/partners">PARTNER WITH US <ArrowUpRight size={14} /></Link></div>
      {sponsors.length ? <div className="partner-grid">{sponsors.slice(0, 4).map((sponsor) => <div className="partner-item" key={sponsor.id}>{sponsor.logoUrl ? <Image src={sponsor.logoUrl} alt={sponsor.name} fill sizes="(max-width: 760px) 50vw, 25vw" /> : <span>{sponsor.name}</span>}</div>)}</div> : <div className="sponsor-cta" style={{ marginTop: 0 }}><h3>Make the next chapter yours.</h3><span>Partnership opportunities for the 2026 season</span><Link className="button button-outline" href="/contact">TALK PARTNERSHIPS <ArrowRight size={15} /></Link></div>}
    </div></section>

    <section className="section"><div className="wrap">
      <div className="about-grid"><div className="about-art" /><div className="about-copy"><span className="eyebrow"><i className="eyebrow-dot" />A NEW CHAPTER</span><h2>A TEAM<br />BUILT FOR<br />THE MOMENT.</h2><p>United Tigers arrive in the Abu Dhabi T10 with a simple ambition: bring people together around fearless cricket, big moments and a team that keeps moving forward.</p><Link className="text-link" href="/about">OUR STORY <ArrowUpRight size={14} /></Link></div></div>
    </div></section>
    <section className="social-band"><div className="wrap social-band-inner"><div><span className="eyebrow"><i className="eyebrow-dot" />FOLLOW THE TIGERS</span><h2>JOIN THE PRIDE.</h2><p>Follow <strong>@unitedtigers.ae</strong> for the latest from the team.</p></div><a className="button button-primary" href="https://www.instagram.com/unitedtigers.ae/" target="_blank" rel="noreferrer">FOLLOW ON INSTAGRAM <ArrowUpRight size={16} /></a></div></section>
  </>;
}

