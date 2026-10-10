import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Calendar, ChevronRight, Download, Facebook, Globe, Instagram, MapPin, Shield, Trophy, Users } from "lucide-react";
import { getFranchises, getGallery, getMatches, getPlayers, getPolls, getProducts, getPublicSettings, getSponsors, getUpdates } from "@/lib/data";
import { FranchiseGrid } from "@/components/FranchiseGrid";
import { PartnerRequestForm } from "@/components/PartnerBrochure";
import { getPartnerBrochureUrl } from "@/lib/partner-brochure";
import { LiveScore } from "@/components/LiveScore";
import { LeagueMark } from "@/components/LeagueMark";
import { LightTrail } from "@/components/LightTrail";
import { PhotoFrame } from "@/components/PhotoFrame";
import { ProductCard } from "@/components/ProductCard";
import { VideoPoster } from "@/components/VideoPoster";
import { teamLogo, teamShortName } from "@/lib/league";
import { getLivePollIntervalMs, homepageDefaults, readHomepageBanner } from "@/lib/site-settings";

export const metadata: Metadata = { title: "United Tigers | The Next Game Starts Here", description: "The official home of United Tigers. Fixtures, the squad, the vote and the Abu Dhabi T10." };

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
  const [players, matches, sponsors, settings, polls, pollIntervalMs, updates, gallery, products, franchises] = await Promise.all([getPlayers(), getMatches(), getSponsors(), getPublicSettings(), getPolls(), getLivePollIntervalMs(), getUpdates(), getGallery(), getProducts(), getFranchises()]);
  const brochureUrl = await getPartnerBrochureUrl();
  const banner = readHomepageBanner(settings.homepage ?? homepageDefaults);
  const daily = updates.filter((update) => !update.isDemo).slice(0, 3);
  const pastMatches = gallery.filter((item) => /past match/i.test(item.category));
  const pastPhotos = pastMatches.filter((item) => item.type !== "VIDEO");
  const matchClips = [...pastMatches.filter((item) => item.type === "VIDEO"), ...pastPhotos].slice(0, 3);
  const matchHref = "/gallery#album-past-matches";
  const onTheBoard = new Set(matchClips.map((item) => item.id));
  const moments = pastPhotos.filter((item) => !onTheBoard.has(item.id)).slice(0, 4);
  const stayPhoto = pastPhotos.find((item) => !onTheBoard.has(item.id) && !moments.some((moment) => moment.id === item.id) && /crowd|champions|podium|title night/i.test(item.title))?.mediaUrl
    ?? pastPhotos.find((item) => !onTheBoard.has(item.id) && !moments.some((moment) => moment.id === item.id))?.mediaUrl;
  const kit = products.filter((product) => product.isFeatured).slice(0, 4);
  const customBanner = banner.mode === "image" && banner.image ? banner.image : null;
  const meetOurTigers = ["fakhar-zaman", "faheem-ashraf", "azmatullah-omarzai", "nurul-hasan"];
  const squad = meetOurTigers.flatMap((slug) => players.filter((player) => player.slug === slug));
  const heroCast = [
    "/images/hero-cast/01-neon-champion.webp",
    "/images/hero-cast/02-cricketer.webp",
    "/images/hero-cast/03-neon-portrait.webp",
    "/images/hero-cast/04-cricket-star.webp",
    "/images/hero-cast/05-confident.webp",
  ];
  const cast = banner.showPlayers ? <span className="banner-cast" aria-hidden="true">
    {heroCast.map((src, index) => <i key={src} className={`rank-${Math.floor(Math.abs(index - (heroCast.length - 1) / 2))}`} style={{ "--cast-i": index } as React.CSSProperties}><Image src={src} alt="" fill sizes="(max-width: 760px) 120px, 200px" quality={85} /></i>)}
  </span> : null;
  const upcoming = matches.find((match) => match.status === "UPCOMING" || match.status === "LIVE");
  const kickoff = upcoming ? when(upcoming.date) : null;
  const opponentLogo = upcoming ? teamLogo(upcoming.opponent, upcoming.opponentLogoUrl) : null;
  const poll = [...polls].sort((left, right) => right.options.filter((option) => playerForLabel(option.label, players)).length - left.options.filter((option) => playerForLabel(option.label, players)).length)[0] ?? polls[0];
  // The board shows the most recent result and the next fixture, one row each.
  const listed = [...matches.filter((match) => match.status === "COMPLETED").slice(-1), ...matches.filter((match) => match.status === "UPCOMING" || match.status === "LIVE").slice(0, 1)];

  return <>
    <section className="home-stage" style={customBanner ? { "--banner": `url("${customBanner}")` } as React.CSSProperties : undefined}>
      {customBanner ? <Link className="stage-banner" href={banner.ctaHref} aria-label={banner.ctaLabel}>
        <Image src={customBanner} alt="" fill priority sizes="(min-width: 1600px) 1600px, 100vw" quality={90} unoptimized={!customBanner.startsWith("/")} />
        <span className="banner-embers" aria-hidden="true" />
        {cast}
      </Link> : <Link className="hero-poster" href={banner.ctaHref} aria-label={banner.ctaLabel}>
        <span className="poster-art" aria-hidden="true"><Image src="/images/hero-art.webp" alt="" fill priority sizes="100vw" quality={85} /></span>
        <span className="banner-embers" aria-hidden="true" />
        <span className="banner-flare" aria-hidden="true" />
        <span className="poster-copy">
          <span className="poster-league"><LeagueMark height={24} priority /></span>
          <h1 className="poster-title"><span>{banner.title}</span><strong>{banner.accent}</strong></h1>
          <span className="poster-tagline">{banner.tagline.split(/\s+/).map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}</span>
          <span className="poster-unity" aria-hidden="true"><b>United</b><em>as one</em></span>
        </span>
        {banner.roar ? <span className="poster-roar">{banner.roar.split(/\s+/).map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}</span> : null}
        <span className="poster-crest">
          <Image src="/brand/tiger-gold.png" alt="" width={822} height={688} sizes="120px" />
          <span><strong>United Tigers</strong><small>Abu Dhabi</small></span>
          <span className="banner-glint" aria-hidden="true" />
        </span>
        {cast}
        <span className="poster-strip" aria-hidden="true">
          <span>Cricket<i />Beyond boundaries<i />A stronger tomorrow</span>
          <span>Players<i />Fans<i />Community<i />Impact</span>
        </span>
      </Link>}
      {customBanner ? <h1 className="sr-only">United Tigers: {banner.title} {banner.accent}. {banner.tagline}. {banner.roar}</h1> : null}
      <div className="wrap dash-grid">
        <article className="dash-card next-match-card">
          <header><span className="is-gold">NEXT MATCH</span><small><LeagueMark height={11} /></small></header>
          {upcoming && kickoff ? <>
            <div className="crest-row">
              <div><b className="has-crest"><Image src="/brand/tiger-gold.png" alt="" width={822} height={688} /></b><strong>United Tigers</strong><em>Abu Dhabi</em></div>
              <span>VS</span>
              <div>{opponentLogo ? <b className="has-logo"><span><Image src={opponentLogo} alt="" fill sizes="64px" /></span></b> : <b>{teamShortName(upcoming.opponent, upcoming.opponentShort)}</b>}<strong>{upcoming.opponent}</strong><em>{upcoming.venue?.city || "Away"}</em></div>
            </div>
            <p className="match-meta"><span><Calendar size={12} aria-hidden="true" /> {kickoff.day} · {kickoff.time}</span><span><MapPin size={12} aria-hidden="true" /> Abu Dhabi</span></p>
            {upcoming.status === "LIVE" && <LiveScore slug={upcoming.slug} pollIntervalMs={pollIntervalMs} initial={{ status: upcoming.status, liveState: upcoming.liveState as never, innings: upcoming.innings.map((entry) => ({ runs: entry.runs, wickets: entry.wickets, overs: entry.overs.toString() })) }} />}
          </> : <>
            <div className="crest-row"><div><b className="has-crest"><Image src="/brand/tiger-gold.png" alt="" width={822} height={688} /></b><strong>United Tigers</strong><em>Abu Dhabi</em></div><span>VS</span><div><b>T10</b><strong>The field</strong><em>Abu Dhabi</em></div></div>
            <p className="dash-empty">The next fixture will appear here as soon as it is confirmed.</p>
            <Link className="button button-orange" href="/fixtures">ALL FIXTURES <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </>}
        </article>

        <article className="dash-card">
          <header><span>MEET OUR TIGERS</span><Link href="/team">View all <ArrowUpRight size={13} /></Link></header>
          <div className="mini-squad">
            {squad.map((player) => {
              const name = splitName(player.fullName);
              return <Link href={`/players/${player.slug}`} key={player.id}>
                <i>{player.profileImage ? <Image src={player.profileImage} alt="" fill sizes="(max-width: 760px) 170px, 120px" /> : name.last.slice(0, 1)}</i>
                <small>{name.first}</small>
                <strong>{name.last}</strong>
              </Link>;
            })}
          </div>
        </article>

        <article className="dash-card dash-vote">
          <div className="dash-vote-head">
            <header><span>VOTE FOR <em>PLAYER OF THE MATCH</em></span></header>
            <Link className="button button-accent" href={poll ? `/polls/${poll.slug}` : "/vote"}>CAST VOTE</Link>
          </div>
          <p>{poll?.question ?? "Who lit up the game?"}</p>
          <div className="vote-faces">
            {(poll?.options ?? []).slice(0, 5).map((option, index) => {
              const face = playerForLabel(option.label, players);
              return <span className={index === 0 ? "is-picked" : ""} key={option.id} title={option.label}>{face?.profileImage ? <Image src={face.profileImage} alt="" fill sizes="(max-width: 980px) 20vw, 80px" /> : option.label.slice(0, 1)}</span>;
            })}
          </div>
        </article>

        <article className="dash-card">
          <header><span className="is-gold">TIGERS NATION</span></header>
          <ul className="nation-stats">
            <li><Users size={16} aria-hidden="true" /><strong>1M+</strong><span>Fans worldwide</span></li>
            <li><Shield size={16} aria-hidden="true" /><strong>7</strong><span>Franchise teams</span></li>
            <li><Globe size={16} aria-hidden="true" /><strong>150+</strong><span>International players</span></li>
            <li><Trophy size={16} aria-hidden="true" /><strong>2</strong><span>Championships</span></li>
          </ul>
        </article>
      </div>
    </section>

    <section className="home-board">
      <div className="wrap board-grid">
        <div>
          <div className="board-head"><h2>PAST MATCHES</h2><Link href={matchHref}>View all <ArrowUpRight size={14} /></Link></div>
          <div className="highlight-row">
            {matchClips.length ? matchClips.map((item) => <article key={item.id}>
              <span className={item.type === "VIDEO" ? "is-video" : undefined}>
                {item.type === "VIDEO" ? <VideoPoster src={item.mediaUrl} label={item.altText || item.title} /> : <PhotoFrame src={item.mediaUrl} label={item.altText || item.title} />}
                <small>{item.type === "VIDEO" ? "VIDEO" : "PHOTO"}</small>
              </span>
              <strong><Link href={matchHref}>{item.title}</Link></strong>
            </article>) : <p className="dash-empty">Previous match photos and videos will appear here once they are published.</p>}
          </div>
        </div>
        <div>
          <div className="board-head"><h2>FIXTURES & RESULTS</h2><Link href="/fixtures">View all <ArrowUpRight size={14} /></Link></div>
          <div className="result-list">
            {listed.length ? listed.map((match) => {
              const won = /united tigers won/i.test(match.result || "");
              const label = match.status === "LIVE" ? "LIVE" : match.status === "COMPLETED" ? (won ? "WIN" : "RESULT") : "UP NEXT";
              const score = match.innings.length ? match.innings.map((innings) => `${innings.runs}/${innings.wickets} (${innings.overs})`).join(" – ") : "";
              const logo = teamLogo(match.opponent, match.opponentLogoUrl);
              return <Link href={`/matches/${match.slug}`} key={match.id}>
                <span>{logo ? <i style={{ backgroundImage: `url('${logo}')` }} aria-hidden="true" /> : null}vs {match.opponent}</span>
                <small>{when(match.date).day}</small>
                <em>{score || (match.status === "UPCOMING" || match.status === "LIVE" ? when(match.date).time : match.result || match.competition || "Abu Dhabi T10")}</em>
                <b className={label === "WIN" ? "is-win" : label === "UP NEXT" || label === "LIVE" ? "is-next" : ""}>{label}</b>
                <ChevronRight className="result-go" size={14} aria-hidden="true" />
              </Link>;
            }) : <p className="dash-empty">Fixtures will be listed here.</p>}
          </div>
        </div>
        <aside className="stay-card">
          <h2>STAY CONNECTED</h2>
          <div className="stay-links">
            <a className="is-facebook" href="https://www.facebook.com/share/1Bxhkk4L97/?mibextid=wwXIfr" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={16} /></a>
            <a className="is-instagram" href="https://www.instagram.com/unitedtigers.ae?stkn=MXVlMjRrM24yZDMxbQ==" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={16} /></a>
          </div>
          <p>#LetsGoHunt</p>
          <div className="stay-photo" style={stayPhoto ? { backgroundImage: `url('${stayPhoto}')` } : undefined}><strong>Once a Tiger<br />always a Tiger</strong></div>
        </aside>
      </div>
    </section>

    {(daily.length > 0 || moments.length > 0) && <section className="home-pulse">
      <div className={`wrap pulse-grid${daily.length && moments.length ? "" : " is-single"}`}>
        {daily.length > 0 && <div>
          <div className="board-head"><h2>TIGERS DAILY</h2><Link href="/updates">View all <ArrowUpRight size={14} /></Link></div>
          <div className="daily-list">
            {daily.map((update) => <Link href={update.slug === "player-draft" ? "/draft" : `/updates/${update.slug}`} key={update.id}>
              <time dateTime={new Date(update.publishedAt).toISOString()}>{when(update.publishedAt).day}</time>
              <span className="update-category">{update.category.replaceAll("_", " ")}</span>
              <strong>{update.title}</strong>
              <p>{update.description}</p>
              <ChevronRight className="result-go" size={14} aria-hidden="true" />
            </Link>)}
          </div>
        </div>}
        {moments.length > 0 && <div>
          <div className="board-head"><h2>FEATURED MOMENTS</h2><Link href="/gallery">Gallery <ArrowUpRight size={14} /></Link></div>
          <div className={`moment-grid count-${moments.length}`}>
            {moments.map((item) => <PhotoFrame key={item.id} src={item.mediaUrl} label={item.altText || item.title} caption={item.title} />)}
          </div>
        </div>}
      </div>
    </section>}

    {kit.length > 0 && <section className="home-feature-kit">
      <div className="wrap">
        <div className="board-head"><h2>OFFICIAL KIT</h2><Link href="/shop">Shop all <ArrowUpRight size={14} /></Link></div>
        <div className="product-grid">{kit.map((product) => <ProductCard product={product} key={product.id} />)}</div>
      </div>
    </section>}

    <section className="home-franchises">
      <div className="wrap home-franchises-layout">
        {franchises.length > 0 && <div className="home-franchises-main">
          <div className="board-head"><h2>OUR FRANCHISES</h2><Link href="/franchises">About <ArrowUpRight size={14} /></Link></div>
          <FranchiseGrid franchises={franchises} />
        </div>}
        <aside className="home-partner">
          <div className="board-head"><h2>PARTNER WITH US</h2></div>
          <div className="home-partner-card">
            {brochureUrl && <a className="brochure-cover" href={brochureUrl} download="United-Tigers-Partnership-Brochure.pdf" aria-label="Download the partnership brochure (PDF)">
              <Image src="/brand/partner-brochure-cover.webp" alt="" width={900} height={506} sizes="(max-width: 900px) 100vw, 40vw" />
              <span className="brochure-cover-action"><Download size={18} /> DOWNLOAD BROCHURE</span>
            </a>}
            <p>Put your brand alongside United Tigers in cricket’s fastest format. Tap the cover to download the brochure, or leave your details and our partnerships team will contact you.</p>
            <PartnerRequestForm />
          </div>
        </aside>
      </div>
    </section>

    <section className="partner-rail is-floating">
      <LightTrail edge="top" />
      <div className="wrap">
        <span>OUR PARTNERS</span>
        {sponsors.length ? <div className="partner-marquee">
          <div className="partner-track" style={{ "--partner-count": sponsors.length } as React.CSSProperties}>
            {[0, 1].map((copy) => <div className="partner-set" key={copy} aria-hidden={copy === 1 || undefined}>
              {sponsors.map((sponsor) => {
                const logo = sponsor.logoUrl && !sponsor.logoUrl.includes("/images/demo/") ? sponsor.logoUrl : null;
                const mark = logo ? <><Image src={logo} alt="" width={200} height={44} /><b>{sponsor.name}</b></> : sponsor.name;
                return sponsor.website ? <a key={sponsor.id} href={sponsor.website} target="_blank" rel="noreferrer" tabIndex={copy === 1 ? -1 : undefined}>{mark}</a> : <span key={sponsor.id}>{mark}</span>;
              })}
            </div>)}
          </div>
        </div> : <div><Link href="/partners">Partner with the Tigers</Link></div>}
        <em>CRICKET UNITES PEOPLE</em>
      </div>
    </section>
  </>;
}

