import type { Metadata } from "next";
import { LegalPageView } from "@/components/LegalPageView";
import { getLegalPage } from "@/lib/legal-page-data";

export async function generateMetadata(): Promise<Metadata> { const page = await getLegalPage("terms"); return { title: page.title, description: page.intro || undefined, alternates: { canonical: "/terms" } }; }
export default async function TermsPage() { return <LegalPageView page={await getLegalPage("terms")} />; }
