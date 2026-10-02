import type { Metadata } from "next";
import { getNews } from "@/lib/data";
import { NewsExplorer } from "@/components/NewsExplorer";

export const metadata: Metadata = { title: "Newsroom", description: "Latest United Tigers news, announcements and match reports." };
export default async function NewsPage() {
  const articles = await getNews();
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow"><i className="eyebrow-dot" />FROM THE TIGERS</span><h1>THE<br />NEWSROOM</h1><p>Stories, team updates and match reports from the United Tigers camp.</p></div></section><section className="section"><div className="wrap"><NewsExplorer articles={articles} /></div></section></div>;
}

