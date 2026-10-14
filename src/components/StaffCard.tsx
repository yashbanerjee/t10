import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";

const BADGES: Record<string, string> = { LEADERSHIP: "LEAD", MANAGEMENT: "MGMT", COACHING: "COACH", SUPPORT: "STAFF", MEDIA: "MEDIA" };

export function StaffCard({ member }: { member: { id: string; fullName: string; title: string; category: string; profileImage?: string | null; bio?: string | null; facebook?: string | null; instagram?: string | null } }) {
  return <article className="player-card staff-card">
    <div className="player-portrait">
      {member.profileImage ? <Image src={member.profileImage} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" /> : <div className="portrait-fallback staff-fallback"><Image src="/brand/tiger-gold.png" alt="" width={822} height={688} /><i className="portrait-stripe" /></div>}
      <span className="player-number">{BADGES[member.category.toUpperCase()] ?? "STAFF"}</span>
    </div>
    <div className="player-card-info"><div>
      <h3>{member.fullName}</h3><p>{member.title}</p>
      {member.bio && <p className="staff-bio">{member.bio}</p>}
      {(member.facebook || member.instagram) && <div className="staff-socials">
        {member.facebook && <a className="is-facebook" href={member.facebook} target="_blank" rel="noreferrer" aria-label={`${member.fullName} on Facebook`}><Facebook size={15} /></a>}
        {member.instagram && <a className="is-instagram" href={member.instagram} target="_blank" rel="noreferrer" aria-label={`${member.fullName} on Instagram`}><Instagram size={15} /></a>}
      </div>}
    </div></div>
  </article>;
}
