import Link from "next/link";
import { requireUserPage } from "@/lib/auth/guard";
import { Shell } from "@/components/shared/Shell";
import { Card } from "@/components/ui/Card";
import { ResetDataButton } from "@/components/settings/ResetDataButton";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { User, Trash2 } from "lucide-react";

export default async function SettingsPage() {
  const session = await requireUserPage();

  return (
    <Shell>
      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-case-muted">Your account and your data. Nothing here is shared with anyone else.</p>

        <div className="mt-8 space-y-6">
          {session.isGuest ? (
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-mono text-sm uppercase tracking-[.22em] text-case-muted">
                <User size={15} className="text-case-cyan" /> You're browsing as a guest
              </h2>
              <p className="text-sm leading-6 text-case-muted">
                Your cases are saved to this browser, but won't follow you to another device. Create a free account to keep your history everywhere you sign in.
              </p>
              <Link href="/register" className="mt-4 inline-block rounded-lg bg-case-cyan px-4 py-2 text-sm font-semibold text-black hover:brightness-110">
                Create an account
              </Link>
            </Card>
          ) : (
            <Card>
              <h2 className="mb-4 flex items-center gap-2 font-mono text-sm uppercase tracking-[.22em] text-case-muted">
                <User size={15} className="text-case-cyan" /> Your profile
              </h2>
              <ProfileForm />
            </Card>
          )}

          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-mono text-sm uppercase tracking-[.22em] text-case-muted">
              <Trash2 size={15} className="text-case-cyan" /> Your data
            </h2>
            <p className="text-sm leading-6 text-case-muted">
              This clears everything you've checked and starts fresh with a sample case, so you can see how it works.
            </p>
            <div className="mt-3">
              <ResetDataButton />
            </div>
          </Card>
        </div>
      </section>
    </Shell>
  );
}
