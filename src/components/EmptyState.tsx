import { CalendarDays, CircleDot, Images, Newspaper } from "lucide-react";

const icons = { calendar: CalendarDays, news: Newspaper, gallery: Images, default: CircleDot };
export function EmptyState({ title, description, kind = "default" }: { title: string; description: string; kind?: keyof typeof icons }) {
  const Icon = icons[kind];
  return <div className="empty-state"><span><Icon size={20} /></span><h3>{title}</h3><p>{description}</p></div>;
}

