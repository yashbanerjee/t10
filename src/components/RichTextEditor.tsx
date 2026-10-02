"use client";

import { useRef } from "react";
import { Bold, Heading2, ImagePlus, Italic, Link2, List, Quote } from "lucide-react";
import type { ReactNode } from "react";

export function RichTextEditor({ value, onChange, required }: { value: string; onChange: (value: string) => void; required?: boolean }) {
  const input = useRef<HTMLTextAreaElement>(null);
  function insert(prefix: string, suffix = "", promptLabel?: string, syntax?: string) {
    const element = input.current; if (!element) return;
    const start = element.selectionStart; const end = element.selectionEnd; let selected = value.slice(start, end);
    if (promptLabel && syntax) { const url = window.prompt(promptLabel); if (!url) return; const label = selected || (syntax === "image" ? "Image description" : "link text"); const insertText = syntax === "image" ? `![${label}](${url})` : `[${label}](${url})`; selected = ""; prefix = insertText; suffix = ""; }
    if (!selected && suffix) selected = "text";
    const insertion = `${prefix}${selected}${suffix}`; onChange(`${value.slice(0, start)}${insertion}${value.slice(end)}`);
    requestAnimationFrame(() => { element.focus(); const cursor = start + prefix.length; element.setSelectionRange(cursor, cursor + selected.length); });
  }
  const tools: { label: string; icon: ReactNode; run: () => void }[] = [
    { label: "Heading", icon: <Heading2 size={13} />, run: () => insert("## ") },
    { label: "Bold", icon: <Bold size={13} />, run: () => insert("**", "**") },
    { label: "Italic", icon: <Italic size={13} />, run: () => insert("*", "*") },
    { label: "Bulleted list", icon: <List size={13} />, run: () => insert("- ") },
    { label: "Quote", icon: <Quote size={13} />, run: () => insert("> ") },
    { label: "Add link", icon: <Link2 size={13} />, run: () => insert("", "", "Enter a link URL", "link") },
    { label: "Add image", icon: <ImagePlus size={13} />, run: () => insert("", "", "Enter an image URL", "image") },
  ];
  return <div className="rich-editor"><div className="rich-toolbar" aria-label="Text formatting">{tools.map(({ label, icon, run }) => <button key={label} type="button" aria-label={label} title={label} onClick={run}>{icon}</button>)}</div><textarea ref={input} required={required} value={value} onChange={(event) => onChange(event.target.value)} rows={12} placeholder="Write your story… Use the toolbar for headings, emphasis, lists, quotes, links and images." /><p>Safe Markdown formatting · HTML is disabled</p></div>;
}

