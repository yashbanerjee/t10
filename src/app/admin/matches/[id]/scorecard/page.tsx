"use client";

import { useParams } from "next/navigation";
import { ScorecardEditor } from "@/components/ScorecardEditor";

export default function MatchScorecardPage() {
  const { id } = useParams<{ id: string }>();
  return <ScorecardEditor id={id} />;
}

