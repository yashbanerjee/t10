import Link from "next/link";

export function TeamMark({ compact = false }: { compact?: boolean }) {
  return <Link className={`team-mark ${compact ? "team-mark-compact" : ""}`} href="/" aria-label="United Tigers home">
    <span className="mark-icon" aria-hidden="true"><i /><i /><i /></span>
    <span className="mark-type"><strong>UNITED</strong><b>TIGERS</b></span>
  </Link>;
}

