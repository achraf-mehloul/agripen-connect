import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Menu, Search, WifiOff, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { BrandLockup } from "@/components/brand/brand-logo";
import { CommandPalette } from "@/components/layout/command-palette";
import { NAV_ITEMS } from "@/components/layout/nav-items";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAuth } from "@/lib/auth/auth-context";
import { fullName } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const online = useOnlineStatus();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const mobileItems = items.filter((item) => item.primary);

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-4 border-r border-sidebar-border bg-sidebar p-4 backdrop-blur-2xl lg:flex">
        <Link to="/dashboard" className="rounded-2xl p-1">
          <BrandLockup />
        </Link>

        <nav className="scroll-thin -mx-1 flex-1 space-y-1 overflow-y-auto px-1">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to as never}
              className={cn(
                "surface-hover flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground",
                isActive(item.to) &&
                  "border-border-strong bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <item.icon
                className={cn("h-[1.1rem] w-[1.1rem]", isActive(item.to) && "text-primary")}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link
          to="/settings"
          className="glass-subtle surface-hover flex min-w-0 items-center gap-3 rounded-2xl p-3"
        >
          <UserAvatar profile={profile} showPresence />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">
              {fullName(profile?.first_name, profile?.last_name)}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {profile?.job_title || (isAdmin ? "Administrator" : "Team member")}
            </span>
          </span>
        </Link>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* top bar */}
        <header className="glass-strong safe-top sticky top-0 z-30 border-b border-border">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl lg:hidden"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="lg:hidden">
                <BrandLockup />
              </div>
              <button
                onClick={() => setPaletteOpen(true)}
                className="glass-subtle surface-hover hidden min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground lg:flex"
              >
                <Search className="h-4 w-4" />
                <span className="truncate">Search the workspace…</span>
                <kbd className="ml-auto rounded-md border border-border px-1.5 py-0.5 text-[0.65rem]">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {!online ? (
                <span className="flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-[0.7rem] font-semibold text-warning">
                  <WifiOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Offline</span>
                </span>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl lg:hidden"
                onClick={() => setPaletteOpen(true)}
                aria-label="Search"
              >
                <Search className="h-[1.15rem] w-[1.15rem]" />
              </Button>
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={handleSignOut}
                aria-label="Sign out"
              >
                <LogOut className="h-[1.1rem] w-[1.1rem]" />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-28 pt-4 sm:px-5 lg:pb-10">
          {children}
        </main>

        {/* mobile bottom nav */}
        <nav className="glass-strong safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border lg:hidden">
          <ul className="grid grid-cols-5">
            {mobileItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to as never}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium text-muted-foreground",
                    isActive(item.to) && "text-primary",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
          />
          <div className="glass-strong animate-[rise_0.28s_var(--ease-out-quint)_both] absolute inset-y-0 left-0 flex w-[16.5rem] flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <BrandLockup />
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="scroll-thin flex-1 space-y-1 overflow-y-auto">
              {items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={cn(
                    "surface-hover flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium",
                    isActive(item.to) && "border-border-strong bg-sidebar-accent",
                  )}
                >
                  <item.icon
                    className={cn("h-[1.1rem] w-[1.1rem]", isActive(item.to) && "text-primary")}
                  />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
