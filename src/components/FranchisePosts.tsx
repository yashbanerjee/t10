import Image from "next/image";
import { Facebook, Instagram, Link2, Music2, Play, Twitter, Youtube } from "lucide-react";
import type { getFranchises } from "@/lib/data";

type Franchise = Awaited<ReturnType<typeof getFranchises>>[number];

const platforms: Record<string, { Icon: typeof Facebook; label: string; tone: string }> = {
  INSTAGRAM: { Icon: Instagram, label: "Instagram", tone: "instagram" },
  FACEBOOK: { Icon: Facebook, label: "Facebook", tone: "facebook" },
  YOUTUBE: { Icon: Youtube, label: "YouTube", tone: "youtube" },
  X: { Icon: Twitter, label: "X", tone: "x" },
  TIKTOK: { Icon: Music2, label: "TikTok", tone: "x" },
  LINK: { Icon: Link2, label: "the web", tone: "link" },
};
const VIDEO = /\/(reels?|tv|videos?|watch|shorts)\b|\/share\/[vr]\/|fb\.watch|youtu\.be/i;

/** Takes one post from each franchise in turn, so a franchise with many posts does not fill the whole row. */
export function franchisePostFeed(franchises: Franchise[]) {
  const queues = franchises.map((franchise) => franchise.posts.map((post) => ({ ...post, franchise: franchise.name })));
  const feed: (Franchise["posts"][number] & { franchise: string })[] = [];
  for (let round = 0; queues.some((queue) => queue.length > round); round++)
    for (const queue of queues) if (queue[round]) feed.push(queue[round]);
  return feed;
}

export function FranchisePosts({ posts, layout }: { posts: ReturnType<typeof franchisePostFeed>; layout: "strip" | "grid" }) {
  return <div className={`franchise-posts is-${layout}`}>
    {posts.map((post) => {
      const platform = platforms[post.platform] ?? platforms.LINK;
      const Badge = platform.Icon;
      return <a key={post.id} className="franchise-post" href={post.url} target="_blank" rel="noreferrer" title={post.caption ?? undefined} aria-label={`Open ${post.franchise} post on ${platform.label}`}>
        {post.imageUrl ? <Image src={post.imageUrl} alt="" fill sizes={layout === "strip" ? "150px" : "(max-width: 760px) 50vw, 240px"} /> : <span className="franchise-post-empty"><Badge size={30} /></span>}
        <span className={`franchise-post-badge is-${platform.tone}`} aria-hidden><Badge size={14} /></span>
        {VIDEO.test(post.url) && <span className="franchise-post-play" aria-hidden><Play size={14} fill="currentColor" /></span>}
        <span className="franchise-post-name">{post.franchise}</span>
      </a>;
    })}
  </div>;
}
