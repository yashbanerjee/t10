"use client";

import { useParams } from "next/navigation";
import { AdminRecordForm } from "@/components/AdminRecordForm";

export default function NewAdminRecordPage() {
  const params = useParams<{ section: string }>();
  return <AdminRecordForm section={params.section} recordId="new" />;
}
