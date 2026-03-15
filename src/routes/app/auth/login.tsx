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
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/app/auth/login")({
    component: RouteComponent,
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
        onSubmit: ({ value }) => {
            toast.loading("Logging in...");
        },
    });

    return (
        <main className="flex justify-center items-center h-screen">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login to Admin Panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                                                autoComplete="off"
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
                                                autoComplete="off"
                                            />
                                            {isInvalid && (
                                                <FieldError errors={field.state.meta.errors} />
                                            )}
                                        </Field>
                                    );
                                }}
                            </form.Field>
                            <Button type="submit">Login</Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
