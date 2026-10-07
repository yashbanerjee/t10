import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Smaller lockup for tight spaces such as the admin sidebar. */
  compact?: boolean;
  /** Tiger above the wordmark (brand sheet lockup) instead of beside it. */
  stacked?: boolean;
  /** `dark` is the gold-and-white lockup for purple surfaces; `light` is the Purple Heart lockup for light surfaces. */
  tone?: "dark" | "light";
  /** Preload the artwork (use for the site header). */
  priority?: boolean;
};

/** Official United Tigers lockup: tiger head plus the two-line "United / Tigers" wordmark. */
export function TeamMark({ compact = false, stacked = false, tone = "dark", priority = false }: Props) {
  const light = tone === "light";
  const className = ["team-mark", compact ? "team-mark-compact" : "", stacked ? "team-mark-stacked" : "", light ? "team-mark-light" : ""].filter(Boolean).join(" ");
  return <Link className={className} href="/" aria-label="United Tigers home">
    <span className="mark-icon" aria-hidden="true"><Image src={light ? "/brand/tiger-purple.png" : "/brand/tiger-gold.png"} alt="" width={822} height={688} priority={priority} /></span>
    <span className="mark-type" aria-hidden="true">
      <Image src={light ? "/brand/wordmark-united-purple.png" : "/brand/wordmark-united-white.png"} alt="" width={790} height={200} priority={priority} />
      <Image src={light ? "/brand/wordmark-tigers-purple.png" : "/brand/wordmark-tigers-gold.png"} alt="" width={742} height={248} priority={priority} />
    </span>
  </Link>;
}
