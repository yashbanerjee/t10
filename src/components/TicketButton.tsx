import Link from "next/link";
import { ArrowUpRight, Ticket } from "lucide-react";
import type { TicketSettings } from "@/lib/site-settings";

/**
 * Buy Tickets call to action. Opens the configured ticket seller when a link is saved in
 * Site settings; otherwise it sends fans to the tickets page (or a custom fallback).
 */
export function TicketButton({ tickets, className = "button button-orange", fallbackHref = "/tickets", fallbackLabel }: { tickets: TicketSettings; className?: string; fallbackHref?: string; fallbackLabel?: string }) {
  if (tickets.url) {
    const external = /^https?:\/\//.test(tickets.url);
    return external
      ? <a className={className} href={tickets.url} target="_blank" rel="noreferrer"><Ticket size={14} aria-hidden="true" /> {tickets.label} <ArrowUpRight size={14} aria-hidden="true" /></a>
      : <Link className={className} href={tickets.url}><Ticket size={14} aria-hidden="true" /> {tickets.label}</Link>;
  }
  return <Link className={className} href={fallbackHref}><Ticket size={14} aria-hidden="true" /> {fallbackLabel ?? tickets.label}</Link>;
}
