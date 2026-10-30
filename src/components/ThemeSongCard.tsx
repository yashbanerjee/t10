"use client";

import { Download, ExternalLink, Music2 } from "lucide-react";
import type { ThemeSong } from "@/lib/theme-song";
import { themeSongCanDownload, themeSongEmbedUrl, themeSongWatchUrl } from "@/lib/theme-song";

export function ThemeSongCard({ song }: { song: ThemeSong }) {
  const downloadHref = song.downloadUrl || song.source;
  const canDownload = themeSongCanDownload(song);
  const embed = themeSongEmbedUrl(song);
  const watch = themeSongWatchUrl(song);
  const fileName = song.fileName || "united-tigers-theme";

  return <section className="theme-song" aria-label={song.title}>
    <div className="wrap theme-song-inner">
      <header className="theme-song-head">
        <span className="eyebrow"><i className="eyebrow-dot" /><Music2 size={12} aria-hidden="true" /> THEME SONG</span>
        <h2>{song.title}</h2>
        <p>{song.kind === "youtube" ? "Play the official United Tigers theme on YouTube." : song.kind === "video" ? "Watch the official United Tigers theme song." : "Listen to the official United Tigers theme song."}</p>
      </header>
      <div className={`theme-song-stage is-${song.kind}`}>
        {song.kind === "youtube" && embed ? (
          <div className="theme-song-frame">
            <iframe title={song.title} src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
          </div>
        ) : song.kind === "video" ? (
          <video className="theme-song-media" controls playsInline preload="metadata" poster={song.poster || undefined} src={song.source}>
            Your browser cannot play this video.
          </video>
        ) : (
          <div className="theme-song-audio">
            {song.poster ? <span className="theme-song-poster" style={{ backgroundImage: `url('${song.poster}')` }} aria-hidden="true" /> : <span className="theme-song-mark" aria-hidden="true"><Music2 size={28} /></span>}
            <audio controls preload="metadata" src={song.source}>Your browser cannot play this audio.</audio>
          </div>
        )}
        <div className="theme-song-actions">
          {canDownload ? (
            <a className="button button-accent" href={downloadHref} download={fileName}>
              DOWNLOAD <Download size={15} aria-hidden="true" />
            </a>
          ) : watch ? (
            <a className="button button-accent" href={watch} target="_blank" rel="noreferrer">
              OPEN ON YOUTUBE <ExternalLink size={15} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  </section>;
}
