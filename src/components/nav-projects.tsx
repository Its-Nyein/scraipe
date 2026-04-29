import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavProjectsProps } from "@/lib/type";
import { Link } from "@tanstack/react-router";

export function NavProjects({ items }: NavProjectsProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="uppercase">General</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="flex flex-col gap-1">
          {items.map((item) => {
            const isRoot = item.to === "/dashboard";
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <Link
                    {...item}
                    activeOptions={{
                      exact: isRoot,
                      includeSearch: false,
                    }}
                    activeProps={{
                      className:
                        "bg-sidebar-accent text-sidebar-accent-foreground",
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
