"use client";

import { useParams } from "next/navigation";
import { AdminWorkspace } from "@/components/AdminWorkspace";

export default function AdminSectionPage() {
  const params = useParams<{ section: string }>();
  return <AdminWorkspace section={params.section} />;
}

