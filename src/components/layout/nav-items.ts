import {
  Beaker,
  Files,
  Home,
  Library,
  Mail,
  MessageCircle,
  MessagesSquare,
  Rss,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  adminOnly?: boolean;
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home, primary: true },
  { to: "/feed", label: "Feed", icon: Rss, primary: true },
  { to: "/chat", label: "Groups", icon: MessagesSquare, primary: true },
  { to: "/messages", label: "Messages", icon: MessageCircle, primary: true },
  { to: "/files", label: "Files", icon: Files, primary: true },
  { to: "/experiments", label: "Experiments", icon: Beaker },
  { to: "/resources", label: "Resources", icon: Library },
  { to: "/emails", label: "Emails", icon: Mail },
  { to: "/team", label: "Team", icon: Users },
  { to: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
];
