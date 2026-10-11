import type { Metadata } from "next";
import { LegalPageView } from "@/components/LegalPageView";
import { getLegalPage } from "@/lib/legal-page-data";

export async function generateMetadata(): Promise<Metadata> { const page = await getLegalPage("privacy"); return { title: page.title, description: page.intro || undefined, alternates: { canonical: "/privacy" } }; }
export default async function PrivacyPage() { return <LegalPageView page={await getLegalPage("privacy")} />; }
