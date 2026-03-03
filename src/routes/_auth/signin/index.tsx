import { SignInForm } from "@/components/web/signin-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/signin/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <SignInForm />;
}
