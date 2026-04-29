import { Link, linkOptions } from "@tanstack/react-router";
import {
  BookmarkIcon,
  CompassIcon,
  FolderIcon,
  ImportIcon,
  LayoutDashboardIcon,
} from "lucide-react";

const navItems = linkOptions([
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboardIcon /> },
  { to: "/dashboard/items", label: "Items", icon: <BookmarkIcon /> },
  { to: "/dashboard/collections", label: "Collections", icon: <FolderIcon /> },
  { to: "/dashboard/import", label: "Import", icon: <ImportIcon /> },
  { to: "/dashboard/discover", label: "Discover", icon: <CompassIcon /> },
]);

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-sm md:hidden"
    >
      <ul className="flex h-14 items-center justify-around px-2">
        {navItems.map((item) => {
          const isRoot = item.to === "/dashboard";
          return (
            <li key={item.to} className="flex-1">
              <Link
                {...item}
                activeOptions={{ exact: isRoot, includeSearch: false }}
                activeProps={{
                  className: "text-primary",
                }}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground [&>svg]:size-5"
                aria-label={item.label}
              >
                {item.icon}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
