import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { usePocketBaseAuth } from "@/hooks/use-pocketbase-auth";
import { pb } from "@/lib/pocketbase";

export const Route = createFileRoute("/app/auth/login")({
  component: RouteComponent,
  beforeLoad: () => {
    if (typeof window !== "undefined" && pb.authStore.isValid) {
      const id = pb.authStore.record?.id;
      if (id) throw redirect({ to: "/app/$id/", params: { id } } as never);
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

function RouteComponent() {
  const { signIn } = usePocketBaseAuth();
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
        const { record } = await signIn(value.email, value.password);
        toast.success("Welcome back!", { id: toastId });
        if (record?.id) {
          await navigate({ to: "/app/$id/", params: { id: record.id } } as never);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Invalid email or password",
          { id: toastId }
        );
      }
    },
  });

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Admin Panel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
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
              <Button type="submit" disabled={form.state.isSubmitting}>
                {form.state.isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
