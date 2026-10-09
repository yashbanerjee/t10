import Link from "next/link";
import { ArrowUpRight, Facebook, Handshake, Instagram } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";
import { LeagueMark } from "@/components/LeagueMark";
import { LightTrail } from "@/components/LightTrail";

const facebook = "https://www.facebook.com/share/1Bxhkk4L97/?mibextid=wwXIfr";
const instagram = "https://www.instagram.com/unitedtigers.ae?stkn=MXVlMjRrM24yZDMxbQ==";

export function PublicFooter() {
  return <footer className="site-footer">
    <LightTrail edge="top" />
    <div className="footer-top wrap">
      <div className="footer-brand">
        <TeamMark stacked />
        <p className="footer-tagline">Let’s Go Hunt</p>
        <p>The next chapter of cricket’s fastest format.</p>
        <a className="social-link" href={instagram} target="_blank" rel="noreferrer"><Instagram size={16} /> @unitedtigers.ae <ArrowUpRight size={14} /></a>
      </div>
      <div className="footer-col"><span className="eyebrow">EXPLORE</span><Link href="/team">Team</Link><Link href="/fixtures">Fixtures</Link><Link href="/points-table">Points table</Link><Link href="/stats">Stats centre</Link><Link href="/records">Records</Link><Link href="/vote">Vote</Link><Link href="/fan">Fan Zone</Link><Link href="/shop">Shop</Link></div>
      <div className="footer-col"><span className="eyebrow">THE CLUB</span><Link href="/news">News</Link><Link href="/updates">Tigers Daily</Link><Link href="/gallery">Gallery</Link><Link href="/about">Our story</Link><Link href="/franchises">About</Link><Link href="/partners">Partners</Link><Link href="/contact">Contact</Link></div>
      <div className="footer-callout">
        <span className="eyebrow">A NEW FORCE. A NEW CHAPTER.</span>
        <p>Follow every moment as the Tigers prepare for their first season.</p>
        <a href={instagram} target="_blank" rel="noreferrer">FOLLOW THE TIGERS <ArrowUpRight size={15} /></a>
        <Link className="footer-partner-btn" href="/become-a-partner"><Handshake size={15} /> BECOME A PARTNER</Link>
        <div className="footer-socials">
          <a className="is-facebook" href={facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={15} /></a>
          <a className="is-instagram" href={instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={15} /></a>
        </div>
      </div>
    </div>
    <div className="footer-bottom wrap">
      <span>© 2026 United Tigers. All rights reserved.</span>
      <span className="footer-league"><LeagueMark height={13} /><i aria-hidden="true" />UNITED ARAB EMIRATES</span>
      <div className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/admin/login">Club admin</Link></div>
    </div>
  </footer>;
}
