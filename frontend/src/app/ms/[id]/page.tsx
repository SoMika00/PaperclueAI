import { redirect } from "next/navigation";

// Legacy route from v1 — the workspace now lives under /manuscripts/:id/*.
export default function LegacyWorkspace({ params }: { params: { id: string } }) {
  redirect(`/manuscripts/${params.id}/overview`);
}
