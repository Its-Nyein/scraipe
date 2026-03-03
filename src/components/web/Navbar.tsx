import { Link } from "@tanstack/react-router";
import { buttonVariants } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-(--header-bg) backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          {/* later we will add a logo here */}
          <img src="/images/logo.svg" alt="Scraipe Logo" className="size-8" />
          <h1 className="text-2xl font-bold">Scraipe</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/signin"
            className={buttonVariants({ variant: "secondary" })}
          >
            Login
          </Link>
          <Link to="/signup" className={buttonVariants()}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
