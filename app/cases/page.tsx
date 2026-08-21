import { listCases } from "@/lib/database/repository";
import { requireUserPage } from "@/lib/auth/guard";
import { Shell } from "@/components/shared/Shell";
import { CaseCard } from "@/components/cases/CaseCard";

export default async function CasesPage() {
  const session = await requireUserPage();
  const cases = await listCases(session.userId);
  return <Shell><section className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><h1 className="text-3xl font-semibold">My Cases</h1><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cases.map((item) => <CaseCard key={item.id} item={item} />)}</div></section></Shell>;
}
