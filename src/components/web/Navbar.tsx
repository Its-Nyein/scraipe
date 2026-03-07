import { authClient } from "#/lib/auth-client";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button, buttonVariants } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";

export default function Navbar() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Logged out successfully");
          navigate({ to: "/" });
        },
        onError: ({ error }) => {
          toast.error(error.message);
        },
      },
    });
  };
  return (
    <nav className="sticky top-0 z-50 border-b bg-(--header-bg) backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <img src="/images/logo.svg" alt="Scraipe Logo" className="size-8" />
          <h1 className="text-2xl font-bold">Scraipe</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isPending ? null : session ? (
            <>
              <Button onClick={handleLogout} variant="secondary">
                Logout
              </Button>
              <Link to="/" className={buttonVariants()}>
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className={buttonVariants({ variant: "secondary" })}
              >
                Login
              </Link>
              <Link to="/signup" className={buttonVariants()}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
