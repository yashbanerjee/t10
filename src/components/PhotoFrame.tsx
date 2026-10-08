"use client";

import { useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

/** Thumbnail that opens the photo in a dialog. */
export function PhotoFrame({ src, label, caption }: { src: string; label: string; caption?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open() {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return <div className="photo-frame-host">
    <button type="button" className="photo-frame" onClick={open} aria-label={`View ${label}`}>
      <Image src={src} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
      {caption ? <strong>{caption}</strong> : null}
    </button>
    <dialog ref={dialogRef} className="video-popup photo-popup" aria-label={label} onClick={(event) => { if (event.target === dialogRef.current) close(); }}>
      <div className="video-popup-bar"><strong>{label}</strong><button type="button" onClick={close} aria-label="Close"><X size={16} /></button></div>
      <img src={src} alt={label} />
    </dialog>
  </div>;
}
