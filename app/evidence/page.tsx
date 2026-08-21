import { listCases } from "@/lib/database/repository";
import { requireUserPage } from "@/lib/auth/guard";
import { Shell } from "@/components/shared/Shell";
import { EvidenceExplorer } from "@/components/evidence/EvidenceExplorer";

export default async function EvidencePage() {
  const session = await requireUserPage();
  const cases = await listCases(session.userId);
  const rows = cases.flatMap((c) =>
    c.evidence.map((e) => ({
      caseId: c.id,
      caseTitle: c.title,
      id: `${c.id}-${e.id}`,
      title: e.title,
      kind: e.kind,
      stance: e.stance,
      quality: e.quality,
      excerpt: e.excerpt
    }))
  );

  return (
    <Shell>
      <EvidenceExplorer rows={rows} />
    </Shell>
  );
}
