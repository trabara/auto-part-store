// Drawer to edit a fitment's conditions: loads the tree, edits it with a live
// summary, validates against the vehicle catalog and saves it as a whole.
import { Button, Container, Drawer, Heading, Text, toast } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { localizedText } from "@repo/framework/core";
import { useSdk } from "@repo/dashboard/common";
import { useLabels } from "@repo/dashboard/module";
import { getEntityUrl } from "@repo/framework/entity";
import {
  hasConditions,
  summarizeConditions,
  validateTree,
  type ConditionGroupInput,
} from "@repo/module-fitment/conditions";
import { Fitment } from "@repo/module-fitment/entities";
import { emptyTree, GroupEditor } from "./condition-editor";
import { useConditionTexts } from "./use-condition-texts";

/** `/admin/fitments/fitment/:id/conditions` (the fitment API's own path). */
const conditionsUrl = (fitmentId: string) => `${getEntityUrl(Fitment.name)}/${fitmentId}/conditions`;

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
  const texts = useConditionTexts();
  const labels = useLabels();
  const [tree, setTree] = useState<ConditionGroupInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setErrors([]);
    sdk.client
      .fetch<ConditionsResponse>(conditionsUrl(fitmentId))
      .then((r) => setTree(r.tree))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [open, fitmentId, sdk]);

  const save = async (next: ConditionGroupInput | null) => {
    const problems = next ? validateTree(next, texts) : [];
    setErrors(problems);
    if (problems.length) return;
    setSaving(true);
    try {
      const saved = await sdk.client.fetch<ConditionsResponse>(conditionsUrl(fitmentId), {
        method: "PUT",
        body: { tree: hasConditions(next) ? next : null },
      });
      toast.success(texts.text("drawer", saved.summary ? "saved" : "removed"));
      onSaved?.(saved.summary);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? texts.text("drawer", "saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const summary = summarizeConditions(tree, texts);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {/* Wider than Medusa's default drawer: rows hold field, operator and value(s). */}
      <Drawer.Content style={{ maxWidth: 760, width: "100%" }}>
        <Drawer.Header>
          <Drawer.Title asChild>
            <Heading level="h2">{texts.text("drawer", "title")}</Heading>
          </Drawer.Title>
          <Text size="small" className="text-ui-fg-subtle">
            {texts.text("drawer", "description")}
          </Text>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          {loading ? (
            <Text size="small" className="text-ui-fg-subtle">{labels.ui("loading")}</Text>
          ) : tree ? (
            <GroupEditor group={tree} onChange={setTree} />
          ) : (
            <Container className="flex flex-col items-start gap-y-3">
              <Text size="small" className="text-ui-fg-subtle">
                {texts.text("drawer", "none")}
              </Text>
              <Button size="small" variant="secondary" type="button" onClick={() => setTree(emptyTree())}>
                {texts.text("drawer", "addFirst")}
              </Button>
            </Container>
          )}
          {tree && (
            <div className="bg-ui-bg-subtle rounded-lg px-3 py-2">
              <Text size="xsmall" className="text-ui-fg-muted">{texts.text("drawer", "summary")}</Text>
              <Text size="small">{summary ?? texts.text("drawer", "noConditions")}</Text>
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
              {texts.text("drawer", "removeAll")}
            </Button>
          )}
          <Button variant="secondary" size="small" type="button" onClick={() => onOpenChange(false)}>
            {labels.action("cancel")}
          </Button>
          <Button size="small" type="button" isLoading={saving} onClick={() => save(tree)}>
            {labels.action("save")}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
}

/**
 * "Conditions" panel for the fitment detail page. The summary is rebuilt from
 * the tree in the user's language (the stored one is English).
 */
export function ConditionsSection({ record, refresh }: { record: Record<string, any>; refresh: () => void }) {
  const sdk = useSdk();
  const texts = useConditionTexts();
  const labels = useLabels();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<ConditionGroupInput | null | undefined>(undefined);
  useEffect(() => {
    sdk.client
      .fetch<ConditionsResponse>(conditionsUrl(record.id))
      .then((r) => setTree(r.tree))
      .catch(() => setTree(undefined));
  }, [sdk, record.id, record.conditions_summary]);
  const summary = tree === undefined ? localizedText(record.conditions_summary, i18n.language) : summarizeConditions(tree, texts);
  return (
    <Container className="flex items-start justify-between gap-x-4 px-6 py-4">
      <div className="flex flex-col gap-y-1">
        <Heading level="h2">{texts.text("section", "title")}</Heading>
        <Text size="small" className={summary ? "" : "text-ui-fg-subtle"}>
          {summary ?? texts.text("section", "none")}
        </Text>
      </div>
      <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
        {labels.action("edit")}
      </Button>
      <ConditionsDrawer fitmentId={record.id} open={open} onOpenChange={setOpen} onSaved={refresh} />
    </Container>
  );
}
