"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, Search } from "lucide-react";
import { NewsCard } from "@/components/ContentCards";

export function NewsExplorer({ articles }: { articles: Parameters<typeof NewsCard>[0]["item"][] }) {
  const [category, setCategory] = useState("ALL");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const categories = ["ALL", ...Array.from(new Set(articles.map((item) => item.category.toUpperCase())))];
  const filtered = useMemo(() => articles.filter((item) => (category === "ALL" || item.category.toUpperCase() === category) && `${item.title} ${item.excerpt}`.toLowerCase().includes(query.toLowerCase())), [articles, category, query]);
  useEffect(() => setVisibleCount(6), [category, query]);
  return <><div className="explorer-tools"><div className="filter-tabs" role="tablist" aria-label="Filter news categories">{categories.map((item) => <button key={item} role="tab" aria-selected={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="search-box"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stories" aria-label="Search news stories" /></label></div>
    {filtered.length ? <><p className="result-count" aria-live="polite">SHOWING {Math.min(visibleCount, filtered.length)} OF {filtered.length} STORIES</p><div className="news-grid">{filtered.slice(0, visibleCount).map((item, index) => <NewsCard key={item.slug} item={item} featured={index === 0 && filtered.length > 2} />)}</div>{visibleCount < filtered.length && <button className="button button-outline load-more" onClick={() => setVisibleCount((count) => count + 6)}>LOAD MORE STORIES <ArrowDown size={14} /></button>}</> : <div className="empty-state"><span><Search size={20} /></span><h3>No stories found</h3><p>Try a different search or category.</p></div>}
  </>;
}

