import { Button } from "../ui/button";
import { ThemeToggle } from "./theme-toggle";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 border-b bg-(--header-bg) supports-backdrop-filter:bg-background/60">
            <div className="mx-auto flex items-center justify-between h-16 px-4">
                <div className="flex items-center gap-2">
                    {/* later we will add a logo here */}
                    <img src="/images/logo.svg" alt="Scraipe Logo" className="size-8" />
                    <h1 className="text-2xl font-bold">Scraipe</h1>
                </div>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button variant="secondary">Login</Button>
                    <Button>Get Started</Button>
                </div>
            </div>
        </nav>
    )
}