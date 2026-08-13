import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { toast } from "sonner";
import { z } from "zod";
import { PencilSimple, Plus, Star, Trash, UsersThree } from "@phosphor-icons/react";
import { PageHeader } from "@/components/phoenix/AppShell";
import { EmptyState } from "@/components/phoenix/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/phoenix/auth";
import { createContact, deleteContact, listContacts, updateContact } from "@/lib/phoenix/api";
import { RELATIONSHIPS } from "@/lib/phoenix/constants";
import type { EmergencyContact } from "@/lib/phoenix/constants";

export const Route = createFileRoute("/_app/contacts")({
  head: () => ({
    meta: [
      { title: "Emergency Contacts — PHOENIX" },
      { name: "description", content: "Manage the trusted contacts notified when you raise an SOS." },
      { property: "og:title", content: "Emergency Contacts — PHOENIX" },
      { property: "og:description", content: "Manage the trusted contacts notified during emergencies." },
    ],
  }),
  component: ContactsPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(100),
  relationship: z.string().trim().min(1, "Choose a relationship").max(50),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+0-9()\-\s]+$/, "Digits and + ( ) - only"),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  priority: z.coerce.number().int().min(1).max(99),
  is_primary: z.boolean(),
});

function ContactsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<EmergencyContact | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPrimary, setIsPrimary] = useState(false);
  const [relationship, setRelationship] = useState<string>("Friend");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: () => listContacts(user!.id),
    enabled: Boolean(user?.id),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["contacts"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const save = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const payload = {
        name: values.name,
        relationship: values.relationship,
        phone: values.phone,
        email: values.email ? values.email : null,
        priority: values.priority,
        is_primary: values.is_primary,
      };
      return editing
        ? updateContact(user!.id, editing.id, payload)
        : createContact(user!.id, payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Contact updated." : "Contact added.");
      setOpen(false);
      setEditing(null);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => deleteContact(id),
    onSuccess: () => {
      toast.success("Contact removed.");
      setRemoving(null);
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openForm = (contact: EmergencyContact | null) => {
    setEditing(contact);
    setErrors({});
    setIsPrimary(contact?.is_primary ?? contacts.length === 0);
    setRelationship(contact?.relationship ?? "Friend");
    setOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = schema.safeParse({
      name: String(form.get("name") ?? ""),
      relationship,
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      priority: String(form.get("priority") ?? "1"),
      is_primary: isPrimary,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    save.mutate(parsed.data);
  };

  return (
    <>
      <PageHeader
        title="Emergency contacts"
        description="These people are notified the moment you raise an SOS."
        action={
          <Button onClick={() => openForm(null)}>
            <Plus size={18} /> Add contact
          </Button>
        }
      />

      {isLoading ? null : contacts.length === 0 ? (
        <EmptyState
          icon={UsersThree}
          title="No emergency contacts"
          description="Add at least one trusted person so PHOENIX can reach them during an emergency."
          action={<Button onClick={() => openForm(null)}>Add your first contact</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="gap-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                  </div>
                  {contact.is_primary ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-1 text-[11px] font-semibold text-primary">
                      <Star size={12} weight="fill" /> Primary
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm">{contact.phone}</p>
                {contact.email ? (
                  <p className="truncate text-sm text-muted-foreground">{contact.email}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">Priority {contact.priority}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openForm(contact)}>
                    <PencilSimple size={16} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRemoving(contact)}>
                    <Trash size={16} /> Remove
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit contact" : "Add emergency contact"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input name="name" defaultValue={editing?.name ?? ""} maxLength={100} />
              {errors["name"] ? <p className="text-xs text-destructive">{errors["name"]}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label>Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input name="phone" type="tel" defaultValue={editing?.phone ?? ""} maxLength={20} />
                {errors["phone"] ? <p className="text-xs text-destructive">{errors["phone"]}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Input
                  name="priority"
                  type="number"
                  min={1}
                  max={99}
                  defaultValue={editing?.priority ?? contacts.length + 1}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email (optional)</Label>
              <Input name="email" type="email" defaultValue={editing?.email ?? ""} maxLength={255} />
              {errors["email"] ? <p className="text-xs text-destructive">{errors["email"]}</p> : null}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Primary contact</p>
                <p className="text-xs text-muted-foreground">Notified first in an emergency.</p>
              </div>
              <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {editing ? "Save changes" : "Add contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(removing)} onOpenChange={(value) => !value && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will no longer be notified when you raise an emergency alert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep contact</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removing && remove.mutate(removing.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
