import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Play } from "lucide-react";
import { getContests, getGallery, getMatches, getNews, getPlayers, getPolls, getProducts, getPublicSettings, getSponsors } from "@/lib/data";
import { formatMoney } from "@/lib/money";
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
    time: `${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Dubai" })} GST`,
  };
}

export default async function HomePage() {
  const [players, matches, news, sponsors, settings, polls, pollIntervalMs, products, gallery, contests] = await Promise.all([getPlayers(), getMatches(), getNews(), getSponsors(), getPublicSettings(), getPolls(), getLivePollIntervalMs(), getProducts(), getGallery(), getContests()]);
  const banner = readHomepageBanner(settings.homepage ?? homepageDefaults);
  const custom = banner.mode === "image" && Boolean(banner.image);
  const portraits = players.filter((player) => player.profileImage).slice(0, 6).map((player) => player.profileImage as string);
  const cast = portraits.length >= 4 ? portraits : ["/images/demo/fakhar-zaman.jpg", "/images/demo/iftikhar-ahmed.jpg", "/images/demo/abbas-afridi.jpg", "/images/demo/odean-smith.jpg", "/images/demo/azmatullah-omarzai.jpg", "/images/demo/paul-van-meekeren.jpg"];
  const squad = players.slice(0, 4);
  const upcoming = matches.find((match) => match.status === "UPCOMING" || match.status === "LIVE");
  const kickoff = upcoming ? when(upcoming.date) : null;
  const poll = polls[0];
  const stories = news.slice(0, 3);
  const listed = matches.slice(0, 4);
  const leadStory = news.find((story) => story.isFeatured) ?? news[0];
  const sideStories = news.filter((story) => story.id !== leadStory?.id).slice(0, 2);
  const featuredKit = (products.some((product) => product.isFeatured) ? products.filter((product) => product.isFeatured) : products).slice(0, 4);
  const frames = gallery.filter((item) => item.type === "IMAGE");
  const featuredFrames = (frames.some((item) => item.isFeatured) ? frames.filter((item) => item.isFeatured) : frames).slice(0, 5);
  const spotlight = contests[0];

  return <>
    <section className={`home-stage ${custom ? "is-custom" : ""}`} style={custom ? { "--banner": `url("${banner.image}")` } as React.CSSProperties : undefined}>
      <div className="stage-top wrap">
        <div className="stage-copy">
          <p className="stage-kicker">ABU DHABI T10</p>
          <h1>{banner.title.trim().split(/\s+/).slice(0, -1).join(" ")}<br />{banner.title.trim().split(/\s+/).at(-1)}<span>{banner.accent}</span></h1>
          <p className="stage-tagline">{banner.tagline}</p>
          <Link className="button button-orange" href={banner.ctaHref}>{banner.ctaLabel} <ArrowUpRight size={16} /></Link>
        </div>
        {!custom && <div className="stage-art" aria-hidden="true">
          <div className="stage-sky" />
          <p className="stage-roar">{banner.roar}</p>
          <div className="stage-cast">
            {cast.map((src) => <div className="stage-player" key={src}><Image src={src} alt="" fill sizes="18vw" /></div>)}
          </div>
          <p className="stage-script">Cricket beyond borders</p>
        </div>}
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
            <dl>
              <div><dt>DATE</dt><dd>{kickoff.day}<br />{kickoff.time}</dd></div>
              <div><dt>VENUE</dt><dd>{upcoming.venue?.name ?? "Venue TBC"}</dd></div>
            </dl>
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
          <header><span>VOTE</span></header>
          <h2>{poll?.question ?? "Player of the match"}</h2>
          <p>Cast your vote and make your voice count.</p>
          <div className="vote-faces">
            {(poll?.options ?? []).slice(0, 4).map((option) => <span key={option.id}>{option.label.split(" ")[0]}</span>)}
          </div>
          <Link className="button button-orange" href={poll ? `/polls/${poll.slug}` : "/fan#vote"}>CAST YOUR VOTE</Link>
        </article>

        <article className="dash-card">
          <header><span>TIGERS NATION</span></header>
          <ul className="nation-stats">
            <li><strong>{players.length || "—"}</strong><span>Squad</span></li>
            <li><strong>{matches.length || "—"}</strong><span>Fixtures</span></li>
            <li><strong>{sponsors.length || "—"}</strong><span>Partners</span></li>
            <li><strong>10</strong><span>Overs</span></li>
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
              const label = match.status === "LIVE" ? "LIVE" : match.status === "COMPLETED" ? (won ? "WIN" : "RESULT") : "NEXT";
              return <Link href={`/matches/${match.slug}`} key={match.id}>
                <b className={label === "WIN" ? "is-win" : label === "NEXT" ? "is-next" : ""}>{label}</b>
                <span>vs {match.opponent}</span>
                <small>{when(match.date).day}</small>
                <em>{match.result || match.competition || "Abu Dhabi T10"}</em>
              </Link>;
            }) : <p className="dash-empty">Fixtures will be listed here.</p>}
          </div>
        </div>
        <aside className="stay-card">
          <h2>STAY CONNECTED</h2>
          <div className="stay-links">
            <a href="https://www.instagram.com/unitedtigers.ae/" target="_blank" rel="noreferrer">Instagram</a>
            <Link href="/news">News</Link>
            <Link href="/fan">Fan zone</Link>
            <Link href="/shop">Shop</Link>
          </div>
          <p>#UnitedTigers</p>
          <div className="stay-photo" style={{ backgroundImage: "url('/images/demo/gallery-stadium.jpg')" }} />
        </aside>
      </div>
    </section>

    <section className="home-feature">
      <div className="wrap">
        <div className="board-head"><h2>FROM THE NEWSROOM</h2><Link href="/news">View all <ArrowUpRight size={14} /></Link></div>
        {leadStory ? <div className="news-feature">
          <Link className="news-lead" href={`/news/${leadStory.slug}`}>
            <span style={{ backgroundImage: `url('${leadStory.coverImage || shots[0]}')` }} />
            <small>{leadStory.isFeatured ? "FEATURED" : leadStory.category}</small>
            <strong>{leadStory.title}</strong>
            <p>{leadStory.excerpt}</p>
          </Link>
          <div>
            {sideStories.map((story) => <Link href={`/news/${story.slug}`} key={story.id}>
              <span style={{ backgroundImage: `url('${story.coverImage || shots[1]}')` }} />
              <small>{story.category}</small>
              <strong>{story.title}</strong>
            </Link>)}
          </div>
        </div> : <p className="dash-empty">Club news will appear here.</p>}
      </div>
    </section>

    <section className="home-feature home-feature-kit">
      <div className="wrap">
        <div className="board-head"><h2>FEATURED KIT</h2><Link href="/shop">Shop all <ArrowUpRight size={14} /></Link></div>
        <div className="kit-row">
          {featuredKit.map((product) => {
            const colours = [...new Set(product.variants.map((variant) => variant.color))].slice(0, 3);
            return <Link href={`/shop/${product.slug}`} key={product.id}>
              <span className={product.image ? "" : "is-empty"} style={product.image ? { backgroundImage: `url('${product.image}')` } : undefined}>{product.category}</span>
              <strong>{product.name}</strong>
              <em>{formatMoney(product.price)}</em>
              <small>{colours.join(" · ") || "Club colours"}</small>
            </Link>;
          })}
        </div>
      </div>
    </section>

    <section className="home-feature">
      <div className="wrap">
        <div className="board-head"><h2>IN THE FRAME</h2><Link href="/gallery">Gallery <ArrowUpRight size={14} /></Link></div>
        <div className="frame-row">
          {(featuredFrames.length ? featuredFrames : shots.map((src, index) => ({ id: src, mediaUrl: src, title: ["Match night", "The opener", "The huddle"][index] ?? "United Tigers", altText: "" }))).map((item) => <Link href="/gallery" key={item.id}>
            <span style={{ backgroundImage: `url('${item.mediaUrl}')` }} />
            <strong>{item.title}</strong>
          </Link>)}
        </div>
      </div>
    </section>

    {spotlight && <section className="contest-band">
      <div className="wrap">
        <div>
          <span>FAN CONTEST</span>
          <h2>{spotlight.title}</h2>
          <p>{spotlight.prize ? `Prize · ${spotlight.prize}` : spotlight.description}</p>
        </div>
        <Link className="button button-orange" href={`/contests/${spotlight.slug}`}>ENTER NOW <ArrowUpRight size={16} /></Link>
      </div>
    </section>}

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

