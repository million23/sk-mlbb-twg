import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCommitteeAuth } from "@/hooks/use-committee-auth";
import {
  ensureCommitteeAuth,
  isCommitteeSessionValid,
} from "@/lib/supabase/committee-auth";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/app/auth/login")({
  component: AdminLoginPage,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const snap = await ensureCommitteeAuth();
    if (isCommitteeSessionValid(snap)) {
      throw redirect({ to: "/app" });
    }
  },
});

const loginFormSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

type LoginFormSchema = z.infer<typeof loginFormSchema>;

function AdminLoginPage() {
  const { signIn } = useCommitteeAuth();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginFormSchema,
    validators: {
      onSubmit: loginFormSchema,
      onChange: loginFormSchema,
      onBlur: loginFormSchema,
    },
    onSubmit: async ({ value }) => {
      const toastId = toast.loading("Logging in...");
      try {
        await signIn(value.email, value.password);
        toast.success("Welcome back!", { id: toastId });
        await navigate({ to: "/app" });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Invalid email or password",
          { id: toastId },
        );
      }
    },
  });

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)]"
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            Admin sign-in
          </p>
          <h1 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
            SK MLBB Tracker
          </h1>
          <p className="text-muted-foreground text-sm">
            Committee access only. Sign in to manage the tournament.
          </p>
        </div>

        <form
          className="rounded-xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-sm"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field className="w-full" data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      type="email"
                      placeholder="Email"
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      autoComplete="email"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      type="password"
                      placeholder="Password"
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      autoComplete="current-password"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
            <Button type="submit" className="w-full" disabled={form.state.isSubmitting}>
              {form.state.isSubmitting ? "Logging in..." : "Sign in"}
            </Button>
          </FieldGroup>
        </form>

        <p className="text-center text-muted-foreground text-xs">
          <Link to="/" className="underline underline-offset-4 hover:text-foreground">
            Back to public site
          </Link>
        </p>
      </div>
    </main>
  );
}
