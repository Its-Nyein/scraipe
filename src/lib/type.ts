import type { LinkOptions } from "@tanstack/react-router";

export type NavItem = LinkOptions & {
  label: string;
  icon: React.ReactNode;
};

export interface NavProjectsProps {
  items: readonly NavItem[];
}
