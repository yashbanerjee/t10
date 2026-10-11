import { SafeMarkdown } from "@/components/SafeMarkdown";
import { formatLegalDate, type LegalPage } from "@/lib/legal-pages";

export function LegalPageView({ page }: { page: LegalPage }) {
  return <div className="inner-page"><section className="inner-hero"><div className="wrap"><span className="eyebrow">UNITED TIGERS</span><h1>{page.title.toUpperCase()}.</h1>{page.intro && <p>{page.intro}</p>}</div></section><section className="section"><div className="wrap article-content"><p className="legal-updated">Last updated {formatLegalDate(page.updatedOn)}</p><SafeMarkdown content={page.content} /></div></section></div>;
}
