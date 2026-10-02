"use client";

import { useParams } from "next/navigation";
import { AdminRecordForm } from "@/components/AdminRecordForm";

export default function EditAdminRecordPage() {
  const params = useParams<{ section: string; id: string }>();
  return <AdminRecordForm section={params.section} recordId={params.id} />;
}
