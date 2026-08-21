import { Shell } from "@/components/shared/Shell";
import { InvestigationFlow } from "@/components/investigation/InvestigationFlow";

export default function InvestigatePage() {
  return (
    <Shell>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">What do you want to check?</h1>
        <p className="mt-2 leading-6 text-case-muted">
          Paste a link, a document, a message someone sent you, or just describe your situation. We'll read it, check
          the facts against real sources where we can, and give you a plain answer — with the reasons behind it if you want them.
        </p>
        <div className="mt-6">
          <InvestigationFlow />
        </div>
      </section>
    </Shell>
  );
}
