import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { BrandLockup } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { redeemInvitation } from "@/lib/auth/onboarding.functions";

export const Route = createFileRoute("/invite/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Join the team — AgriPen Team App" },
      {
        name: "description",
        content: "Redeem your AgriPen invitation and create your team account.",
      },
      { property: "og:title", content: "Join the team — AgriPen Team App" },
      {
        property: "og:description",
        content: "Redeem your AgriPen invitation and create your team account.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const redeem = useServerFn(redeemInvitation);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    specialization: "",
    dateOfBirth: "",
  });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await redeem({ data: { token, ...form } });
      await signIn(form.email, form.password);
      toast.success("Welcome to the AgriPen team");
      void navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "This invitation could not be used.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={onSubmit} className="glass w-full max-w-md space-y-5 rounded-3xl p-8">
        <BrandLockup />
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You were invited to the private AgriPen workspace. Fill in your details to join.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" required value={form.firstName} onChange={set("firstName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" required value={form.lastName} onChange={set("lastName")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={set("email")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set("password")}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input id="jobTitle" value={form.jobTitle} onChange={set("jobTitle")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={form.specialization}
              onChange={set("specialization")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">Date of birth (optional)</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={set("dateOfBirth")}
          />
        </div>

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Creating your account…" : "Join the team"}
        </Button>
      </form>
    </div>
  );
}
