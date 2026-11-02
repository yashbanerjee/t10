"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Minus, Plus, X, ZoomIn } from "lucide-react";

/** Cover or inline news image: full graphic visible, tap to open a zoomable lightbox. */
export function ZoomableImage({ src, alt = "", priority = false, className = "article-image", sizes = "100vw" }: { src: string; alt?: string; priority?: boolean; className?: string; sizes?: string }) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);

  const close = useCallback(() => {
    setOpen(false);
    setScale(1);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "+" || event.key === "=") setScale((current) => Math.min(4, Number((current + 0.25).toFixed(2))));
      if (event.key === "-") setScale((current) => Math.max(1, Number((current - 0.25).toFixed(2))));
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return <>
    <button type="button" className={`${className} is-zoomable`} onClick={() => setOpen(true)} aria-label="View image full screen">
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
      <span className="zoomable-hint" aria-hidden="true"><ZoomIn size={16} /></span>
    </button>
    {open ? <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Zoomed image">
      <div className="image-lightbox-toolbar">
        <button type="button" onClick={() => setScale((current) => Math.max(1, Number((current - 0.25).toFixed(2))))} aria-label="Zoom out"><Minus size={18} /></button>
        <button type="button" onClick={() => setScale((current) => Math.min(4, Number((current + 0.25).toFixed(2))))} aria-label="Zoom in"><Plus size={18} /></button>
        <button type="button" onClick={close} aria-label="Close"><X size={18} /></button>
      </div>
      <div className="image-lightbox-stage" onClick={close}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})` }}
          onClick={(event) => event.stopPropagation()}
          draggable={false}
        />
      </div>
      <p className="image-lightbox-help">Pinch, scroll, or use + / − to zoom. Esc or tap outside to close.</p>
    </div> : null}
  </>;
}
