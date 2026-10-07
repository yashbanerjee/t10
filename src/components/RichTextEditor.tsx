"use client";

import { useRef } from "react";
import { Bold, Heading2, ImagePlus, Italic, Link2, List, Quote } from "lucide-react";
import type { ReactNode } from "react";

export function RichTextEditor({ value, onChange, required }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const input = useRef<HTMLTextAreaElement>(null);
  /** Toggles a line prefix such as `## ` or `- ` on every line in the selection instead of inserting it mid-sentence. */
  function toggleLinePrefix(prefix: string) {
    const element = input.current; if (!element) return;
    const start = element.selectionStart; const end = element.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEndIndex = value.indexOf("\n", end); const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const marker = prefix.trim();
    const pattern = marker === "##" ? /^\s*(?:#{1,6}\s*)+/ : new RegExp(`^\\s*${marker.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&")}\\s?`);
    const allHave = lines.every((line) => pattern.test(line));
    const next = lines.map((line) => allHave ? line.replace(pattern, "") : `${prefix}${line.replace(pattern, "")}`).join("\n");
    onChange(`${value.slice(0, lineStart)}${next}${value.slice(lineEnd)}`);
    requestAnimationFrame(() => { element.focus(); element.setSelectionRange(lineStart, lineStart + next.length); });
  }
  function insert(prefix: string, suffix = "", promptLabel?: string, syntax?: string) {
    const element = input.current; if (!element) return;
    const start = element.selectionStart; const end = element.selectionEnd; let selected = value.slice(start, end);
    if (promptLabel && syntax) { const url = window.prompt(promptLabel); if (!url) return; const label = selected || (syntax === "image" ? "Image description" : "link text"); const insertText = syntax === "image" ? `![${label}](${url})` : `[${label}](${url})`; selected = ""; prefix = insertText; suffix = ""; }
    if (!selected && suffix) selected = "text";
    const insertion = `${prefix}${selected}${suffix}`; onChange(`${value.slice(0, start)}${insertion}${value.slice(end)}`);
    requestAnimationFrame(() => { element.focus(); const cursor = start + prefix.length; element.setSelectionRange(cursor, cursor + selected.length); });
  }
  const tools: { label: string; icon: ReactNode; run: () => void }[] = [
    { label: "Heading", icon: <Heading2 size={13} />, run: () => toggleLinePrefix("## ") },
    { label: "Bold", icon: <Bold size={13} />, run: () => insert("**", "**") },
    { label: "Italic", icon: <Italic size={13} />, run: () => insert("*", "*") },
    { label: "Bulleted list", icon: <List size={13} />, run: () => toggleLinePrefix("- ") },
    { label: "Quote", icon: <Quote size={13} />, run: () => toggleLinePrefix("> ") },
    { label: "Add link", icon: <Link2 size={13} />, run: () => insert("", "", "Enter a link URL", "link") },
    { label: "Add image", icon: <ImagePlus size={13} />, run: () => insert("", "", "Enter an image URL", "image") },
  ];
  return <div className="rich-editor"><div className="rich-toolbar" aria-label="Text formatting">{tools.map(({ label, icon, run }) => <button key={label} type="button" aria-label={label} title={label} onClick={run}>{icon}</button>)}</div><textarea ref={input} required={required} value={value} onChange={(event) => onChange(event.target.value)} rows={12} placeholder="Write your story… Use the toolbar for headings, emphasis, lists, quotes, links and images." /><p>Safe Markdown formatting · HTML is disabled</p></div>;
}

