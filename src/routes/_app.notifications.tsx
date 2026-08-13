import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Bell, BellRinging, CheckCircle, Info, Siren, WarningCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { EmptyState } from "@/components/phoenix/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/phoenix/auth";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/phoenix/api";
import { timeAgo } from "@/lib/phoenix/constants";
import type { AppNotification } from "@/lib/phoenix/constants";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — PHOENIX" },
      { name: "description", content: "Real-time updates on your SOS alerts and incident reports." },
      { property: "og:title", content: "Notifications — PHOENIX" },
      { property: "og:description", content: "Real-time updates on your emergencies and reports." },
    ],
  }),
  component: NotificationsPage,
});

const ICONS = {
  SOS: Siren,
  INCIDENT: WarningCircle,
  STATUS_UPDATE: CheckCircle,
  SYSTEM: Info,
} as const;

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => listNotifications(user!.id),
    enabled: Boolean(user?.id),
    refetchInterval: 30000,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const readOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => void refresh(),
  });
  const readAll = useMutation({
    mutationFn: () => markAllNotificationsRead(user!.id),
    onSuccess: () => void refresh(),
  });

  const unread = notifications.filter((item) => !item.is_read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You're all caught up."}
        action={
          unread ? (
            <Button variant="outline" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Alerts about your SOS activity and incident reports will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item: AppNotification, index) => {
            const IconComponent = ICONS[item.type] ?? Info;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`flex-row items-start gap-4 p-5 ${
                    item.is_read ? "" : "border-primary/40 bg-primary/5"
                  }`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                    <IconComponent size={20} weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {!item.is_read ? (
                        <span className="rounded-full bg-emergency/15 px-2 py-0.5 text-[11px] font-semibold text-emergency">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{timeAgo(item.created_at)}</span>
                      {item.link ? (
                        <Link to={item.link} className="font-medium text-primary hover:underline">
                          View details
                        </Link>
                      ) : null}
                      {!item.is_read ? (
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={() => readOne.mutate(item.id)}
                        >
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {!item.is_read ? (
                    <BellRinging size={18} className="shrink-0 text-primary" weight="fill" />
                  ) : null}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
