import Image from "next/image";
import { LEAGUE_LOGO, LEAGUE_NAME } from "@/lib/league";

type Props = {
  /** Landscape is the primary lockup; portrait is only for spaces too narrow for it. */
  variant?: "landscape" | "portrait";
  /** Rendered height in CSS pixels; the width follows the artwork's ratio. */
  height?: number;
  className?: string;
  priority?: boolean;
};

/** Official Abu Dhabi T10 lockup in white, for the purple site surfaces. */
export function LeagueMark({ variant = "landscape", height = 16, className, priority = false }: Props) {
  const art = LEAGUE_LOGO[variant];
  const width = Math.round(height * (art.width / art.height));
  return <Image className={["league-mark", className].filter(Boolean).join(" ")} src={art.src} alt={LEAGUE_NAME} width={art.width} height={art.height} style={{ width, height }} sizes={`${width * 2}px`} priority={priority} />;
}
