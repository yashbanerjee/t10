import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { SampleBadge } from "@/components/Badge";

export function PlayerCard({ player, featured = false }: { player: { id: string; fullName: string; displayName?: string | null; slug: string; profileImage?: string | null; role?: string | null; nationality?: string | null; country?: string | null; jerseyNumber?: number | null; isIconPlayer?: boolean; isDemo?: boolean }; featured?: boolean }) {
  const initials = player.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <Link className={`player-card ${featured ? "player-card-featured" : ""}`} href={`/players/${player.slug}`}>
    <div className="player-portrait">
      {player.profileImage ? <Image src={player.profileImage} alt={player.fullName} fill sizes={featured ? "(max-width: 768px) 90vw, 40vw" : "(max-width: 768px) 90vw, 25vw"} /> : <div className="portrait-fallback"><span>{initials}</span><i className="portrait-stripe" /></div>}
      <span className="player-number">{player.jerseyNumber ? `#${String(player.jerseyNumber).padStart(2, "0")}` : "UT"}</span>
      <span className="player-arrow"><ArrowUpRight size={18} /></span>
      {player.isIconPlayer && <span className="icon-player-label">ICON PLAYER</span>}
    </div>
    <div className="player-card-info"><div><h3>{player.displayName || player.fullName}</h3><p>{player.role?.replaceAll("_", " ") || "Role to be confirmed"}<span> / </span>{player.nationality || player.country || "Nationality TBC"}</p></div>{player.isDemo && <SampleBadge />}</div>
  </Link>;
}

