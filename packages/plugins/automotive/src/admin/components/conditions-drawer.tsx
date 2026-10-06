// Drawer to edit a fitment's conditions: loads the tree, edits it with a live
// summary, validates against the vehicle catalog and saves it as a whole.
import { Button, Container, Drawer, Heading, Text, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useSdk } from "@repo/dashboard/common";
import {
  hasConditions,
  summarizeConditions,
  validateTree,
  type ConditionGroupInput,
} from "../../modules/fitment/conditions";
import { emptyTree, GroupEditor } from "./condition-editor";

type ConditionsResponse = { tree: ConditionGroupInput | null; summary: string | null };

export function ConditionsDrawer({
  fitmentId,
  open,
  onOpenChange,
  onSaved,
}: {
  fitmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (summary: string | null) => void;
}) {
  const sdk = useSdk();
  const [tree, setTree] = useState<ConditionGroupInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setErrors([]);
    sdk.client
      .fetch<ConditionsResponse>(`/admin/fitment-conditions/${fitmentId}`)
      .then((r) => setTree(r.tree))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [open, fitmentId, sdk]);

  const save = async (next: ConditionGroupInput | null) => {
    const problems = next ? validateTree(next) : [];
    setErrors(problems);
    if (problems.length) return;
    setSaving(true);
    try {
      const saved = await sdk.client.fetch<ConditionsResponse>(`/admin/fitment-conditions/${fitmentId}`, {
        method: "PUT",
        body: { tree: hasConditions(next) ? next : null },
      });
      toast.success(saved.summary ? "Conditions saved" : "Conditions removed");
      onSaved?.(saved.summary);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save conditions");
    } finally {
      setSaving(false);
    }
  };

  const summary = summarizeConditions(tree);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* Wider than Medusa's default drawer: rows hold field, operator and value(s). */}
      <Drawer.Content style={{ maxWidth: 760, width: "100%" }}>
        <Drawer.Header>
          <Drawer.Title asChild>
            <Heading level="h2">Fitment conditions</Heading>
          </Drawer.Title>
          <Text size="small" className="text-ui-fg-subtle">
            Narrow which configurations of the vehicle this part fits (e.g. front-wheel drive only).
          </Text>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          {loading ? (
            <Text size="small" className="text-ui-fg-subtle">Loading…</Text>
          ) : tree ? (
            <GroupEditor group={tree} onChange={setTree} />
          ) : (
            <Container className="flex flex-col items-start gap-y-3">
              <Text size="small" className="text-ui-fg-subtle">
                No conditions: the part fits every configuration of the vehicle.
              </Text>
              <Button size="small" variant="secondary" type="button" onClick={() => setTree(emptyTree())}>
                Add a condition
              </Button>
            </Container>
          )}
          {tree && (
            <div className="bg-ui-bg-subtle rounded-lg px-3 py-2">
              <Text size="xsmall" className="text-ui-fg-muted">Summary</Text>
              <Text size="small">{summary ?? "No conditions"}</Text>
            </div>
          )}
          {errors.length > 0 && (
            <ul className="text-ui-fg-error txt-compact-small list-disc pl-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          {tree && (
            <Button variant="transparent" size="small" type="button" className="mr-auto" onClick={() => setTree(null)}>
              Remove all
            </Button>
          )}
          <Button variant="secondary" size="small" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="small" type="button" isLoading={saving} onClick={() => save(tree)}>
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

/** "Conditions" panel for the fitment detail page. */
export function ConditionsSection({ record, refresh }: { record: Record<string, any>; refresh: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Container className="flex items-start justify-between gap-x-4 px-6 py-4">
      <div className="flex flex-col gap-y-1">
        <Heading level="h2">Conditions</Heading>
        <Text size="small" className={record.conditions_summary ? "" : "text-ui-fg-subtle"}>
          {record.conditions_summary ?? "None: fits every configuration of the vehicle."}
        </Text>
      </div>
      <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <ConditionsDrawer fitmentId={record.id} open={open} onOpenChange={setOpen} onSaved={refresh} />
    </Container>
  );
}
