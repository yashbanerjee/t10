import Link from "next/link";
import { ArrowUpRight, Instagram, Youtube } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";

export function PublicFooter() {
  return <footer className="site-footer">
    <div className="footer-top wrap">
      <div className="footer-brand"><TeamMark /><p>The next chapter of cricket’s fastest format.</p><a className="social-link" href="https://www.instagram.com/unitedtigers.ae/" target="_blank" rel="noreferrer"><Instagram size={16} /> @unitedtigers.ae <ArrowUpRight size={14} /></a></div>
      <div className="footer-col"><span className="eyebrow">EXPLORE</span><Link href="/team">Team</Link><Link href="/fixtures">Fixtures & results</Link><Link href="/shop">Shop</Link><Link href="/fan">Fan zone</Link><Link href="/news">Newsroom</Link><Link href="/gallery">Gallery</Link></div>
      <div className="footer-col"><span className="eyebrow">THE CLUB</span><Link href="/about">Our story</Link><Link href="/partners">Partners</Link><Link href="/contact">Contact</Link><Link href="/admin/login">Club admin</Link></div>
      <div className="footer-callout"><span className="eyebrow">A NEW FORCE. A NEW CHAPTER.</span><p>Follow every moment as the Tigers prepare for their first season.</p><a href="https://www.instagram.com/unitedtigers.ae/" target="_blank" rel="noreferrer">FOLLOW THE TIGERS <ArrowUpRight size={15} /></a></div>
    </div>
    <div className="footer-bottom wrap"><span>© 2026 United Tigers. All rights reserved.</span><span>ABU DHABI · UNITED ARAB EMIRATES</span><div className="footer-legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="https://www.youtube.com/" aria-label="YouTube"><Youtube size={15} /></a></div></div>
  </footer>;
}

