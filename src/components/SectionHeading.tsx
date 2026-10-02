import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeading({ overline, title, href, linkText = "VIEW ALL", light = false }: { overline: string; title: string; href?: string; linkText?: string; light?: boolean }) {
  return <div className={`section-heading ${light ? "section-heading-light" : ""}`}><div><span className="eyebrow"><i className="eyebrow-dot" />{overline}</span><h2>{title}</h2></div>{href && <Link className="text-link" href={href}>{linkText}<ArrowUpRight size={15} /></Link>}</div>;
}

