"use client";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export function ProfileForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setName(d.user?.name ?? "");
        setEmail(d.user?.email ?? "");
      });
  }, []);

  async function saveName() {
    setSavingName(true);
    setNameError("");
    setNameSaved(false);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error ?? "Couldn't save your name.");
        return;
      }
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword() {
    setSavingPassword(true);
    setPasswordError("");
    setPasswordSaved(false);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Couldn't change your password.");
        return;
      }
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordSaved(false), 2000);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-case-muted">Your name</label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add your name"
            className="w-full rounded-lg border border-case-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-case-cyan"
          />
          <button
            onClick={saveName}
            disabled={savingName}
            className="shrink-0 rounded-lg bg-case-cyan px-4 py-2 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-60"
          >
            {nameSaved ? <Check size={16} /> : savingName ? "Saving..." : "Save"}
          </button>
        </div>
        {nameError && <p className="mt-1.5 text-xs text-case-red">{nameError}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-case-muted">Email</label>
        <input value={email} disabled className="w-full rounded-lg border border-case-border bg-black/10 px-3 py-2 text-sm text-case-muted" />
      </div>

      <div className="border-t border-case-border pt-5">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-case-muted">Change password</label>
        <div className="space-y-2">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full rounded-lg border border-case-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-case-cyan"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full rounded-lg border border-case-border bg-black/20 px-3 py-2 text-sm outline-none focus:border-case-cyan"
          />
          <button
            onClick={savePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            className="rounded-lg border border-case-border px-4 py-2 text-sm text-case-text transition hover:border-case-cyan/60 disabled:opacity-50"
          >
            {passwordSaved ? "Password updated" : savingPassword ? "Saving..." : "Update password"}
          </button>
        </div>
        {passwordError && <p className="mt-1.5 text-xs text-case-red">{passwordError}</p>}
      </div>
    </div>
  );
}
