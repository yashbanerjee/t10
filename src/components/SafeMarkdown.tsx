import type { ReactNode } from "react";

/* eslint-disable @next/next/no-img-element */

function safeUrl(value: string) { return (value.startsWith("/") && !value.startsWith("//")) || /^https:\/\//i.test(value); }

function inline(text: string, keySeed: string): ReactNode[] {
  const pattern = /(!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  const pieces: ReactNode[] = []; let cursor = 0; let index = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) pieces.push(text.slice(cursor, start));
    const key = `${keySeed}-${index++}`;
    if (match[1]?.startsWith("![")) {
      const src = match[3]!; pieces.push(safeUrl(src) ? <span className="content-inline-image" key={key}><img src={src} alt={match[2] || ""} /></span> : match[2]);
    } else if (match[4]) {
      const href = match[5]!; pieces.push(safeUrl(href) ? <a key={key} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{match[4]}</a> : match[4]);
    } else if (match[6]) pieces.push(<strong key={key}>{match[6]}</strong>);
    else if (match[7]) pieces.push(<em key={key}>{match[7]}</em>);
    else if (match[8]) pieces.push(<code key={key}>{match[8]}</code>);
    cursor = start + match[0].length;
  }
  if (cursor < text.length) pieces.push(text.slice(cursor));
  return pieces;
}

function isBlockStart(line: string) { return /^#{2,3}\s|^>\s|^[-*]\s|^\d+\.\s/.test(line); }

export function SafeMarkdown({ content }: { content: string }) {
  const lines = content.replaceAll("\r", "").split("\n"); const blocks: ReactNode[] = []; let index = 0; let key = 0;
  while (index < lines.length) {
    const line = lines[index]?.trim() ?? ""; if (!line) { index++; continue; }
    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line);
    if (image) { blocks.push(safeUrl(image[2]) ? <figure className="content-image" key={key++}><img src={image[2]} alt={image[1]} /><figcaption>{image[1]}</figcaption></figure> : null); index++; continue; }
    if (line.startsWith("### ")) { blocks.push(<h3 key={key++}>{inline(line.slice(4), `h3-${index}`)}</h3>); index++; continue; }
    if (line.startsWith("## ")) { blocks.push(<h2 key={key++}>{inline(line.slice(3), `h2-${index}`)}</h2>); index++; continue; }
    if (line.startsWith("> ")) { blocks.push(<blockquote key={key++}>{inline(line.slice(2), `q-${index}`)}</blockquote>); index++; continue; }
    if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      const ordered = /^\d+\.\s/.test(line); const entries: ReactNode[] = [];
      while (index < lines.length && (ordered ? /^\d+\.\s/.test(lines[index].trim()) : /^[-*]\s/.test(lines[index].trim()))) { const current = lines[index].trim(); entries.push(<li key={index}>{inline(current.replace(ordered ? /^\d+\.\s/ : /^[-*]\s/, ""), `li-${index}`)}</li>); index++; }
      blocks.push(ordered ? <ol key={key++}>{entries}</ol> : <ul key={key++}>{entries}</ul>); continue;
    }
    const paragraph = [line]; index++;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index].trim())) { paragraph.push(lines[index].trim()); index++; }
    blocks.push(<p key={key++}>{inline(paragraph.join(" "), `p-${key}`)}</p>);
  }
  return <>{blocks}</>;
}

