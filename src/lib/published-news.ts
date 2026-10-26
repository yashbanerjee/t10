import type { NewsArticle } from "@prisma/client";

/** Approved signing announcements shipped with the app until the CMS/database row exists. */
export const mirHamzaStory = `Abu Dhabi, UAE: United Tigers have officially secured the services of Pakistan international left-arm fast bowler Mir Hamza for the upcoming 2026 Abu Dhabi T10 League, adding valuable international experience, quality and firepower to their bowling department.

The experienced Pakistani pacer, known for his exceptional control, ability to swing the ball and disciplined bowling, is set to bring a new dimension to the United Tigers' pace attack in the fast-paced T10 format.

Having represented Pakistan at the international level and established himself as a reliable performer in domestic cricket, Mir Hamza arrives with a strong reputation for troubling batters through his accuracy, movement and intelligent variations.

His inclusion is expected to provide United Tigers with an important bowling option, particularly during the crucial powerplay overs, where early breakthroughs can significantly influence the outcome of a T10 contest.

The signing also underlines United Tigers' ambition to assemble a competitive and well-balanced squad capable of challenging the strongest franchises in the tournament.

With Pakistan star Fakhar Zaman leading the side, the addition of Mir Hamza further strengthens the franchise's Pakistani contingent and adds another experienced campaigner to its ranks.

United Tigers will be looking to make a strong impression in the 2026 Abu Dhabi T10 League, combining international talent, emerging players and an aggressive brand of cricket.

A new challenge awaits. A new Tiger joins the hunt.

Welcome to United Tigers, Mir Hamza! 🐅🇵🇰

The journey starts now. The roar begins in Abu Dhabi. Let's Go Hunt!`;

export const joeClarkeStory = `United Tigers have officially secured the services of explosive English batter Joe Clarke for the upcoming Abu Dhabi T10 League 2026.

Renowned for his fearless stroke play, aggressive intent and match-winning ability, Clarke brings international franchise cricket experience and serious firepower to the Tigers' batting line-up.

United Tigers Head Coach Yasir Arafat expressed his excitement over the signing, stating:

> "Joe Clarke is exactly the kind of explosive batter we want in our squad. His aggressive approach, experience and ability to dominate bowling attacks make him a valuable addition. We believe he will play a crucial role in our campaign this season."`;

type PublishedNewsSeed = Omit<NewsArticle, "createdAt" | "updatedAt">;

export const publishedNewsCatalog: PublishedNewsSeed[] = [
  {
    id: "news_joe_clarke_signing",
    title: "United Tigers Sign English Powerhouse Joe Clarke for Abu Dhabi T10 2026",
    slug: "joe-clarke-joins-united-tigers",
    excerpt: "United Tigers have officially secured the services of explosive English batter Joe Clarke for the upcoming Abu Dhabi T10 League 2026.",
    content: joeClarkeStory,
    category: "TEAM NEWS",
    authorName: "United Tigers",
    coverImage: "/news/joe-clarke-signing.jpg",
    ogImage: "/news/joe-clarke-signing.jpg",
    seoTitle: "Joe Clarke joins United Tigers for Abu Dhabi T10 2026",
    seoDescription: "Explosive English batter Joe Clarke joins United Tigers for the 2026 Abu Dhabi T10, adding fearless stroke play to the batting line-up.",
    status: "PUBLISHED",
    publishedAt: new Date("2026-10-26T07:30:00.000Z"),
    isFeatured: true,
    isDemo: false,
  },
  {
    id: "news_mir_hamza_signing",
    title: "United Tigers Strengthen Bowling Attack with Signing of Pakistan International Mir Hamza for Abu Dhabi T10 2026",
    slug: "mir-hamza-joins-united-tigers",
    excerpt: "United Tigers have officially secured the services of Pakistan international left-arm fast bowler Mir Hamza for the upcoming 2026 Abu Dhabi T10 League, adding valuable international experience, quality and firepower to their bowling department.",
    content: mirHamzaStory,
    category: "TEAM NEWS",
    authorName: "United Tigers",
    coverImage: "/news/mir-hamza-signing.jpg",
    ogImage: "/news/mir-hamza-signing.jpg",
    seoTitle: "Mir Hamza joins United Tigers for Abu Dhabi T10 2026",
    seoDescription: "Pakistan international Mir Hamza joins United Tigers for the 2026 Abu Dhabi T10, adding control, swing and powerplay firepower to the pace attack.",
    status: "PUBLISHED",
    publishedAt: new Date("2026-10-26T06:00:00.000Z"),
    isFeatured: true,
    isDemo: false,
  },
];

function materialize(seed: PublishedNewsSeed): NewsArticle {
  const stamp = seed.publishedAt ?? new Date();
  return { ...seed, createdAt: stamp, updatedAt: stamp };
}

function isLive(article: PublishedNewsSeed, now: Date) {
  return article.status === "PUBLISHED" && !article.isDemo && article.publishedAt != null && article.publishedAt <= now;
}

/** Merge CMS rows with bundled announcements. Database rows win when the slug exists in both. */
export function mergePublishedNews(dbArticles: NewsArticle[], now = new Date(), limit = 12) {
  const bySlug = new Map(dbArticles.map((article) => [article.slug, article]));
  for (const seed of publishedNewsCatalog) {
    if (!bySlug.has(seed.slug) && isLive(seed, now)) bySlug.set(seed.slug, materialize(seed));
  }
  return [...bySlug.values()]
    .filter((article) => isLive(article, now))
    .sort((left, right) => +new Date(right.publishedAt!) - +new Date(left.publishedAt!))
    .slice(0, limit);
}

export function publishedNewsBySlug(slug: string, now = new Date()) {
  const seed = publishedNewsCatalog.find((article) => article.slug === slug);
  return seed && isLive(seed, now) ? materialize(seed) : null;
}
