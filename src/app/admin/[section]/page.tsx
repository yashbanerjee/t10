"use client";

import { useParams } from "next/navigation";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { LegalPagesPanel } from "@/components/LegalPagesPanel";

export default function AdminSectionPage() {
  const params = useParams<{ section: string }>();
  if (params.section === "legal") return <LegalPagesPanel />;
  return <AdminWorkspace section={params.section} />;
}
