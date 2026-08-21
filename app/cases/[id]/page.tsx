import { notFound } from "next/navigation";
import { getCase } from "@/lib/database/repository";
import { requireUserPage } from "@/lib/auth/guard";
import { Shell } from "@/components/shared/Shell";
import { CaseWorkspace } from "@/components/investigation/CaseWorkspace";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUserPage();
  const item = await getCase(id, session.userId);
  if (!item) notFound();
  return (
    <Shell>
      <CaseWorkspace item={item} />
    </Shell>
  );
}
