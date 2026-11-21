"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { track } from "@/lib/analytics";
import {
  HOME_TEAM,
  kickoffTime,
  knockoutLogo,
  knockoutMark,
  knockoutSides,
  teamLogo,
} from "@/lib/league";

type Match = {
  id: string;
  slug: string;
  date: Date | string;
  status: string;
  opponent: string;
  opponentLogoUrl?: string | null;
  matchNumber?: string | null;
  competition?: string | null;
  venue?: { name: string } | null;
  innings?: {
    battingTeam: string;
    runs: number;
    wickets: number;
    overs: { toString(): string } | string | number;
  }[];
};

function KnockoutCrest({ side }: { side: string }) {
  const logo = knockoutLogo(side);
  if (logo) {
    return (
      <i className="fixture-crest">
        <Image src={logo} alt="" width={64} height={64} />
      </i>
    );
  }
  return <i className="fixture-crest fixture-crest-tbc">{knockoutMark(side)}</i>;
}

export function FixtureExplorer({
  matches,
  homeLogo = HOME_TEAM.logo,
}: {
  matches: Match[];
  homeLogo?: string;
}) {
  const hasUpcoming = matches.some(
    (match) => match.status === "UPCOMING" || match.status === "LIVE",
  );
  const [tab, setTab] = useState(hasUpcoming ? "UPCOMING" : "COMPLETED");
  const shown = useMemo(
    () =>
      matches.filter((match) =>
        tab === "UPCOMING"
          ? match.status === "UPCOMING" || match.status === "LIVE"
          : match.status === "COMPLETED",
      ),
    [matches, tab],
  );

  return (
    <>
      <div className="filter-tabs" role="tablist" aria-label="Fixture status">
        {["UPCOMING", "COMPLETED"].map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {shown.length ? (
        <div className="fixture-list">
          {shown.map((match) => {
            const date = new Date(match.date);
            const score = match.innings
              ?.map((entry) => `${entry.runs}/${entry.wickets}`)
              .join(" · ");
            const logo = teamLogo(match.opponent, match.opponentLogoUrl);
            const knockout = knockoutSides(match);
            return (
              <article
                className={`fixture-row${knockout ? " is-knockout" : ""}`}
                key={match.id}
              >
                <div className="fixture-date">
                  <span>
                    {date.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      timeZone: "Asia/Dubai",
                    })}
                  </span>
                  <small>{kickoffTime(date)} GST</small>
                </div>
                {knockout ? (
                  <div className="fixture-opponent">
                    {knockout.map((side, index) => (
                      <Fragment key={side}>
                        {index ? <span className="vs-mark">vs</span> : null}
                        <span className="fixture-team">
                          <KnockoutCrest side={side} />
                          {side}
                        </span>
                      </Fragment>
                    ))}
                  </div>
                ) : (
                  <div className="fixture-opponent">
                    <span className="fixture-team">
                      <i className="fixture-crest">
                        <Image src={homeLogo} alt="" width={375} height={512} />
                      </i>
                      United Tigers
                    </span>
                    <span className="vs-mark">vs</span>
                    <span className="fixture-team">
                      {logo ? (
                        <i className="fixture-crest">
                          <Image src={logo} alt="" width={64} height={64} />
                        </i>
                      ) : null}
                      {match.opponent}
                    </span>
                  </div>
                )}
                <div className="fixture-meta">
                  {match.competition ?? "Abu Dhabi T10"} ·{" "}
                  {match.venue?.name ?? "Venue TBC"}
                </div>
                {score ? (
                  <div className="fixture-score">{score}</div>
                ) : (
                  <div className="fixture-score is-tbc" aria-hidden="true">
                    —
                  </div>
                )}
                <Link
                  className="fixture-link"
                  href={`/matches/${match.slug}`}
                  onClick={() =>
                    track("fixture_click", {
                      id: match.id,
                      href: `/matches/${match.slug}`,
                    })
                  }
                >
                  {match.status === "COMPLETED" ? "SCORECARD ↗" : "MATCH CENTRE ↗"}
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span>{tab === "UPCOMING" ? (hasUpcoming ? "NEXT" : "2026") : "10"}</span>
          <h3>
            {tab === "UPCOMING"
              ? hasUpcoming
                ? "Fixtures are on the way"
                : "This season is over"
              : "The story starts soon"}
          </h3>
          <p>
            {tab === "UPCOMING"
              ? hasUpcoming
                ? "Official United Tigers fixtures will be published as soon as the tournament schedule is confirmed."
                : "The 2026 Abu Dhabi T10 campaign is complete. New fixtures will appear here when the next season starts."
              : "Match results and scorecards will appear here after the first game."}
          </p>
        </div>
      )}
    </>
  );
}
