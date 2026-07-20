import { redirect } from "next/navigation";

// Legacy route from v1 — the workspace now lives under /manuscripts/:id/*.
export default async function LegacyWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/manuscripts/${id}/overview`);
}
