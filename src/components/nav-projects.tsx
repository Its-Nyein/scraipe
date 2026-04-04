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
          {items.map((item) => (
            <SidebarMenuItem key={item.to as string}>
              <SidebarMenuButton asChild>
                <Link
                  {...item}
                  activeOptions={{ exact: true }}
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
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
