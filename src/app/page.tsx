import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Calendar, Clock, Globe, Instagram, MapPin, Play, Shield, Users, Youtube } from "lucide-react";
import { getMatches, getNews, getPlayers, getPolls, getPublicSettings, getSponsors } from "@/lib/data";
import { LiveScore } from "@/components/LiveScore";
import { NationSignup } from "@/components/NationSignup";
import { homepageDefaults, readHomepageBanner } from "@/lib/site-settings";
import { getLivePollIntervalMs } from "@/lib/site-settings";

export const metadata: Metadata = { title: "United Tigers | The Next Game Starts Here", description: "The official home of United Tigers. Fixtures, the squad, the vote and the Abu Dhabi T10." };

const shots = ["/images/demo/gallery-match.jpg", "/images/demo/news-opener.jpg", "/images/demo/gallery-huddle.jpg"];

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return { first: parts.slice(0, -1).join(" "), last: parts.at(-1) ?? fullName };
}

function when(value: Date | string) {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dubai" }).toUpperCase(),
    time: `${date.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })} GST`,
  };
}

function playerForLabel(label: string, roster: { fullName: string; profileImage: string | null }[]) {
  const needle = label.trim().toLowerCase();
  return roster.find((player) => player.fullName.toLowerCase() === needle)
    ?? roster.find((player) => needle.includes(player.fullName.toLowerCase()) || player.fullName.toLowerCase().includes(needle));
}

export default async function HomePage() {
  const [players, matches, news, sponsors, settings, polls, pollIntervalMs] = await Promise.all([getPlayers(), getMatches(), getNews(), getSponsors(), getPublicSettings(), getPolls(), getLivePollIntervalMs()]);
  const banner = readHomepageBanner(settings.homepage ?? homepageDefaults);
  const heroImage = banner.mode === "image" && banner.image ? banner.image : "/images/stadium-hero.png";
  const squad = players.slice(0, 4);
  const cast = players.filter((player) => player.profileImage).slice(0, 3);
  const upcoming = matches.find((match) => match.status === "UPCOMING" || match.status === "LIVE");
  const kickoff = upcoming ? when(upcoming.date) : null;
  const poll = [...polls].sort((left, right) => right.options.filter((option) => playerForLabel(option.label, players)).length - left.options.filter((option) => playerForLabel(option.label, players)).length)[0] ?? polls[0];
  const stories = news.slice(0, 3);
  const listed = [...matches.filter((match) => match.status === "COMPLETED").slice(-2), ...matches.filter((match) => match.status === "UPCOMING" || match.status === "LIVE").slice(0, 1)];

  return <>
    <section className="home-stage" style={{ "--banner": `url("${heroImage}")` } as React.CSSProperties}>
      <div className="stage-scene" aria-hidden="true">
        <div className="stage-sky" />
        <div className="stage-photo" />
        <div className="stage-glow" />
      </div>
      <div className="stage-top wrap">
        <div className="stage-copy">
          <p className="stage-kicker">ABU DHABI T10</p>
          <h1>{banner.title.trim().split(/\s+/).slice(0, -1).join(" ")}<br />{banner.title.trim().split(/\s+/).at(-1)}<span>{banner.accent}</span></h1>
          <p className="stage-tagline">{banner.tagline}</p>
          <Link className="button button-orange" href={banner.ctaHref}>{banner.ctaLabel} <ArrowUpRight size={16} /></Link>
        </div>
        {cast.length > 0 && <div className="stage-cast">
          {cast.map((player) => <span key={player.id}><Image src={player.profileImage!} alt="" fill sizes="200px" /></span>)}
        </div>}
        {banner.roar ? <p className="stage-roar">{banner.roar}</p> : null}
      </div>
      <div className="wrap dash-grid">
        <article className="dash-card">
          <header><span>NEXT MATCH</span><small>ABU DHABI T10</small></header>
          {upcoming && kickoff ? <>
            <div className="crest-row">
              <div><b>UT</b><strong>United Tigers</strong><em>Abu Dhabi</em></div>
              <span>VS</span>
              <div><b>{(upcoming.opponentShort || upcoming.opponent).slice(0, 2).toUpperCase()}</b><strong>{upcoming.opponent}</strong><em>{upcoming.venue?.city || "Away"}</em></div>
            </div>
            <p className="match-meta"><Calendar size={12} aria-hidden="true" /> {kickoff.day} · {kickoff.time}<br /><MapPin size={12} aria-hidden="true" /> {upcoming.venue?.name ?? "Venue TBC"}</p>
            {upcoming.status === "LIVE" && <LiveScore slug={upcoming.slug} pollIntervalMs={pollIntervalMs} initial={{ status: upcoming.status, liveState: upcoming.liveState as never, innings: upcoming.innings.map((entry) => ({ runs: entry.runs, wickets: entry.wickets, overs: entry.overs.toString() })) }} />}
            <Link className="button button-orange" href={`/matches/${upcoming.slug}`}>BUY TICKETS</Link>
          </> : <>
            <div className="crest-row"><div><b>UT</b><strong>United Tigers</strong><em>Abu Dhabi</em></div><span>VS</span><div><b>T10</b><strong>The field</strong><em>Abu Dhabi</em></div></div>
            <p className="dash-empty">The next fixture will appear here as soon as it is confirmed.</p>
            <Link className="button button-orange" href="/fixtures">BUY TICKETS</Link>
          </>}
        </article>

        <article className="dash-card">
          <header><span>MEET OUR TIGERS</span><Link href="/team">View all <ArrowUpRight size={13} /></Link></header>
          <div className="mini-squad">
            {squad.map((player) => {
              const name = splitName(player.fullName);
              return <Link href={`/players/${player.slug}`} key={player.id}>
                <i>{player.profileImage ? <Image src={player.profileImage} alt="" fill sizes="80px" /> : name.last.slice(0, 1)}</i>
                <b>{player.jerseyNumber ?? "UT"}</b>
                <small>{name.first}</small>
                <strong>{name.last}</strong>
                <em>{(player.role || "Player").replaceAll("_", " ")}</em>
              </Link>;
            })}
          </div>
        </article>

        <article className="dash-card">
          <header><span>VOTE FOR <em>PLAYER OF THE MATCH</em></span></header>
          <p>{poll?.question ?? "Who lit up the game?"}<br />Cast your vote and make your voice count.</p>
          <div className="vote-faces">
            {(poll?.options ?? []).slice(0, 5).map((option, index) => {
              const face = playerForLabel(option.label, players);
              return <span className={index === 0 ? "is-picked" : ""} key={option.id} title={option.label}>{face?.profileImage ? <Image src={face.profileImage} alt="" fill sizes="42px" /> : option.label.slice(0, 1)}</span>;
            })}
          </div>
          <Link className="button button-orange" href={poll ? `/polls/${poll.slug}` : "/fan#vote"}>CAST YOUR VOTE</Link>
        </article>

        <article className="dash-card">
          <header><span className="is-gold">TIGERS NATION</span></header>
          <ul className="nation-stats">
            <li><Users size={16} aria-hidden="true" /><strong>30K+</strong><span>Fans worldwide</span></li>
            <li><Shield size={16} aria-hidden="true" /><strong>6</strong><span>Franchise teams</span></li>
            <li><Globe size={16} aria-hidden="true" /><strong>30+</strong><span>T10 matches</span></li>
            <li><Clock size={16} aria-hidden="true" /><strong>90</strong><span>Minutes of thrill</span></li>
          </ul>
          <p className="nation-join">JOIN THE TIGERS NATION</p>
          <NationSignup />
        </article>
      </div>
    </section>

    <section className="home-board">
      <div className="wrap board-grid">
        <div>
          <div className="board-head"><h2>LATEST HIGHLIGHTS</h2><Link href="/news">View all <ArrowUpRight size={14} /></Link></div>
          <div className="highlight-row">
            {stories.map((story, index) => <Link href={`/news/${story.slug}`} key={story.id}>
              <span style={{ backgroundImage: `url('${story.coverImage || shots[index % shots.length]}')` }}><Play size={16} /></span>
              <small>{story.category}</small>
              <strong>{story.title}</strong>
            </Link>)}
          </div>
        </div>
        <div>
          <div className="board-head"><h2>FIXTURES & RESULTS</h2><Link href="/fixtures">View all <ArrowUpRight size={14} /></Link></div>
          <div className="result-list">
            {listed.length ? listed.map((match) => {
              const won = /united tigers won/i.test(match.result || "");
              const label = match.status === "LIVE" ? "LIVE" : match.status === "COMPLETED" ? (won ? "WIN" : "RESULT") : "UP NEXT";
              const score = match.innings.length ? match.innings.map((innings) => `${innings.runs}/${innings.wickets} (${innings.overs})`).join(" – ") : "";
              return <Link href={`/matches/${match.slug}`} key={match.id}>
                <b className={label === "WIN" ? "is-win" : label === "UP NEXT" || label === "LIVE" ? "is-next" : ""}>{label}</b>
                <span>vs {match.opponent}</span>
                <small>{when(match.date).day}</small>
                <em>{score || (match.status === "UPCOMING" || match.status === "LIVE" ? when(match.date).time : match.result || match.competition || "Abu Dhabi T10")}</em>
              </Link>;
            }) : <p className="dash-empty">Fixtures will be listed here.</p>}
          </div>
        </div>
        <aside className="stay-card">
          <h2>STAY CONNECTED</h2>
          <div className="stay-links">
            <a className="is-instagram" href="https://www.instagram.com/unitedtigers.ae/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={16} /></a>
            <a className="is-youtube" href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={16} /></a>
          </div>
          <p>#UnitedTigers</p>
          <div className="stay-photo" style={{ backgroundImage: "url('/images/demo/gallery-stadium.jpg')" }}><strong>Once a Tiger<br />always a Tiger</strong></div>
        </aside>
      </div>
    </section>

    <section className="partner-rail">
      <div className="wrap">
        <span>OUR PARTNERS</span>
        <div>
          {sponsors.length ? sponsors.map((sponsor) => sponsor.website ? <a key={sponsor.id} href={sponsor.website} target="_blank" rel="noreferrer">{sponsor.logoUrl ? <Image src={sponsor.logoUrl} alt={sponsor.name} width={120} height={36} /> : sponsor.name}</a> : <span key={sponsor.id}>{sponsor.logoUrl ? <Image src={sponsor.logoUrl} alt={sponsor.name} width={120} height={36} /> : sponsor.name}</span>) : <Link href="/partners">Partner with the Tigers</Link>}
        </div>
        <em>CRICKET UNITES PEOPLE</em>
      </div>
    </section>
  </>;
}

