"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX, X } from "lucide-react";

function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** Preview frame that opens the clip in a dialog. The player has no fullscreen or download control. */
export function VideoPoster({ src, label }: { src: string; label: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function rememberDuration() {
    const next = videoRef.current?.duration ?? 0;
    if (Number.isFinite(next) && next > 0) setDuration((current) => (current === next ? current : next));
  }

  useEffect(() => {
    rememberDuration();
  }, []);

  function open() {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    if (!dialog || !video) return;
    if (!dialog.open) dialog.showModal();
    video.currentTime = 0;
    setTime(0);
    rememberDuration();
    void video.play().catch(() => undefined);
  }

  function close() {
    videoRef.current?.pause();
    dialogRef.current?.close();
  }

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }

  return <>
    <button type="button" className="video-poster" onClick={open} aria-label={`Play ${label}`}>
      <video src={`${src}#t=0.1`} muted playsInline preload="metadata" tabIndex={-1} aria-hidden="true" />
      <i aria-hidden="true"><Play size={18} fill="currentColor" /></i>
    </button>
    <dialog ref={dialogRef} className="video-popup" aria-label={label} onClose={() => videoRef.current?.pause()} onClick={(event) => { if (event.target === dialogRef.current) close(); }}>
      <div className="video-popup-bar"><strong>{label}</strong><button type="button" onClick={close} aria-label="Close"><X size={16} /></button></div>
      <div className="video-popup-player">
        <video
          ref={videoRef}
          src={src}
          playsInline
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload nofullscreen noplaybackrate"
          preload="metadata"
          aria-label={label}
          onClick={toggle}
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => { setTime(videoRef.current?.currentTime ?? 0); rememberDuration(); }}
          onLoadedMetadata={rememberDuration}
          onDurationChange={rememberDuration}
        />
        <div className="video-popup-controls">
          <button type="button" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
          <span>{clock(time)} / {clock(duration)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={duration ? Math.min(time, duration) : 0}
            aria-label="Seek"
            onChange={(event) => {
              const next = Number(event.target.value);
              if (videoRef.current) videoRef.current.currentTime = next;
              setTime(next);
            }}
          />
          <button type="button" aria-label={muted ? "Unmute" : "Mute"} onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            video.muted = !video.muted;
            setMuted(video.muted);
          }}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
        </div>
      </div>
    </dialog>
  </>;
}
