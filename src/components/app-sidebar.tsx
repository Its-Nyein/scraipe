import * as React from "react";

import { NavProjects } from "#/components/nav-projects";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "#/components/ui/sidebar";
import { Link, linkOptions } from "@tanstack/react-router";
import { BookmarkIcon, CompassIcon, ImportIcon } from "lucide-react";

const navItems = linkOptions([
  { to: "/dashboard/items", label: "Items", icon: <BookmarkIcon /> },
  { to: "/dashboard/import", label: "Import", icon: <ImportIcon /> },
  { to: "/dashboard/discover", label: "Discover", icon: <CompassIcon /> },
]);

function SidebarLogo() {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenuButton size="lg" asChild>
      <Link to="/dashboard">
        <div className="flex shrink-0 items-center justify-center rounded-md">
          <img src="/logo.svg" alt="Scraipe" className="size-7" />
        </div>
        {!isMobile && (
          <div className="grid flex-1 text-left text-sm font-medium">
            <span className="font-bold">Scraipe</span>
            <span className="text-xs text-muted-foreground">
              Your AI Knowledge Base
            </span>
          </div>
        )}
      </Link>
    </SidebarMenuButton>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarLogo />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavProjects items={navItems} />
      </SidebarContent>
      {/* <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter> */}
      <SidebarRail />
    </Sidebar>
  );
}
