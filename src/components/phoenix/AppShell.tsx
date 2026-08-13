import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Bell,
  Gauge,
  List,
  MapTrifold,
  ShieldStar,
  SignOut,
  Siren,
  UserCircle,
  UsersThree,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { PhoenixLogo, PhoenixMark } from "@/components/brand/PhoenixLogo";
import { useAuth } from "@/lib/phoenix/auth";
import { listNotifications } from "@/lib/phoenix/api";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: Icon;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/sos", label: "Emergency SOS", icon: Siren },
  { to: "/incidents", label: "Incidents", icon: WarningCircle },
  { to: "/contacts", label: "Contacts", icon: UsersThree },
  { to: "/map", label: "Safety Map", icon: MapTrifold },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 30000,
  });
  const unread = notifications.filter((item) => !item.is_read).length;

  const items = isAdmin
    ? [...NAV, { to: "/admin", label: "Command Center", icon: ShieldStar }]
    : NAV;

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-2 p-4">
      <Link to="/dashboard" className="px-2 py-3">
        <PhoenixLogo />
      </Link>
      <nav className="mt-2 flex flex-1 flex-col gap-1" aria-label="App">
        {items.map((item) => {
          const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/12 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon size={20} weight={active ? "fill" : "duotone"} />
              {item.label}
              {item.to === "/notifications" && unread > 0 ? (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-emergency px-1.5 text-[11px] font-bold text-emergency-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-xl border border-border bg-surface/60 p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-primary">
            <UserCircle size={20} weight="duotone" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile?.full_name ?? "PHOENIX user"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="mt-2 w-full justify-start" onClick={handleSignOut}>
          <SignOut size={18} /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-surface/40 lg:block">
        {sidebar}
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <PhoenixMark className="h-7 w-7 text-primary" />
            <span className="font-display text-base font-bold tracking-[0.2em]">PHOENIX</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Notifications">
              <Link to="/notifications" className="relative">
                <Bell size={20} />
                {unread > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emergency" />
                ) : null}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={20} /> : <List size={20} />}
            </Button>
          </div>
        </header>

        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-border bg-background lg:hidden"
          >
            {sidebar}
          </motion.div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
