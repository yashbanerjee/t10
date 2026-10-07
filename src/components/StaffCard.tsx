import Image from "next/image";

export function StaffCard({ member }: { member: { id: string; fullName: string; title: string; category: string; profileImage?: string | null; bio?: string | null } }) {
  const initials = member.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("");
  const area = member.category.replaceAll("_", " ");
  const badge = area === "COACHING" ? "COACH" : area === "SUPPORT" ? "STAFF" : "LEAD";
  return <article className="player-card">
    <div className="player-portrait">
      {member.profileImage ? <Image src={member.profileImage} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" /> : <div className="portrait-fallback"><span>{initials}</span><i className="portrait-stripe" /></div>}
      <span className="player-number">{badge}</span>
    </div>
    <div className="player-card-info"><div><h3>{member.fullName}</h3><p>{member.title}<span> / </span>{area}</p>{member.bio && <p className="staff-bio">{member.bio}</p>}</div></div>
  </article>;
}
