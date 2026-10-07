// "Review" on a research task's page: what its last run found (created,
// filled, contradictions, likely duplicates, dropped claims), the finding or
// proposal waiting for a person, the pages read and the cost; Approve applies
// the proposal (or the finding's fix), Reject closes it with feedback that
// the next run receives.
import { Button, Container, Heading, Text, Textarea, toast } from "@medusajs/ui";
import { useSdk } from "@repo/dashboard/common";
import { useLabels } from "@repo/dashboard/module";
import { useState } from "react";
import { useStewardTexts } from "./use-steward-texts";

const TASKS = "/admin/vehicle-catalog/tasks";

function List({ title, items }: { title: string; items?: unknown[] }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-col gap-1 px-6 py-3">
      <Text size="small" leading="compact" weight="plus">
        {title} ({items.length})
      </Text>
      <ul className="list-disc ps-5">
        {items.slice(0, 50).map((item, i) => (
          <li key={i}>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {typeof item === "string" ? item : JSON.stringify(item)}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewSection({ record, refresh }: { record: Record<string, any>; refresh: () => void }) {
  const text = useStewardTexts();
  const labels = useLabels();
  const sdk = useSdk();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const report = (record.report ?? {}) as Record<string, any>;
  const finding = record.finding as { severity: string; message: string; fix?: { kind: string; data?: object } | null } | null;
  const proposal = record.proposal as Record<string, any> | null;
  const cost = record.cost as { usd?: number; credits?: number; steps?: number; model?: string } | null;
  const created = report.created ? Object.entries(report.created).filter(([, n]) => (n as number) > 0).map(([k, n]) => `${k}: ${n}`) : [];

  const act = async (action: "approve" | "reject") => {
    setBusy(true);
    try {
      await sdk.client.fetch(`${TASKS}/${record.id}/${action}`, {
        method: "POST",
        body: action === "reject" ? { feedback: feedback || undefined } : {},
      });
      toast.success(text("review", action === "approve" ? "approved" : "rejected"));
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{text("review", "title")}</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {labels.value("CatalogTask" as any, "status", record.status)}
          {report.reason ? ` · ${report.reason}` : ""}
        </Text>
      </div>
      {finding && (
        <div className="flex flex-col gap-1 px-6 py-3">
          <Text size="small" leading="compact" weight="plus">
            {text("review", "finding")} ({finding.severity})
          </Text>
          <Text size="small">{finding.message}</Text>
          {finding.fix && (
            <Text size="small" className="text-ui-fg-subtle">
              {text("review", "fix")}: {finding.fix.kind === "merge" ? text("review", "merge") : JSON.stringify(finding.fix.data)}
            </Text>
          )}
        </div>
      )}
      <List title={text("review", "created")} items={created} />
      <List title={text("review", "updated")} items={[...(report.updated ?? []), ...(report.corrected ?? [])]} />
      <List title={text("review", "corrections")} items={report.review} />
      <List title={text("review", "differences")} items={report.differences} />
      <List title={text("review", "warnings")} items={report.warnings} />
      <List title={text("review", "problems")} items={report.problems} />
      <List title={text("review", "unsupported")} items={report.unsupported} />
      {report.notes && (
        <div className="px-6 py-3">
          <Text size="small" leading="compact" weight="plus">
            {text("review", "notes")}
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {report.notes}
          </Text>
        </div>
      )}
      {(record.sources ?? []).length > 0 && (
        <div className="flex flex-col gap-1 px-6 py-3">
          <Text size="small" leading="compact" weight="plus">
            {text("review", "sources")}
          </Text>
          {(record.sources as string[]).map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="text-ui-fg-interactive txt-small truncate hover:underline">
              {url}
            </a>
          ))}
        </div>
      )}
      {cost && (cost.usd || cost.credits || cost.model) ? (
        <div className="px-6 py-3">
          <Text size="small" className="text-ui-fg-subtle">
            {text("review", "cost")}: ${(cost.usd ?? 0).toFixed(4)} · {cost.credits ?? 0} credits{cost.model ? ` · ${cost.model}` : ""}
          </Text>
        </div>
      ) : null}
      {record.status === "REVIEW" && (finding?.fix || proposal) && (
        <div className="flex flex-col gap-3 px-6 py-4">
          <Textarea placeholder={text("review", "feedback")} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="small" variant="secondary" disabled={busy} onClick={() => act("reject")}>
              {text("review", "reject")}
            </Button>
            <Button size="small" disabled={busy} onClick={() => act("approve")}>
              {text("review", "approve")}
            </Button>
          </div>
        </div>
      )}
      {record.status === "REVIEW" && !finding?.fix && !proposal && (
        <div className="flex justify-end gap-2 px-6 py-4">
          <Button size="small" variant="secondary" disabled={busy} onClick={() => act("reject")}>
            {text("review", "reject")}
          </Button>
        </div>
      )}
    </Container>
  );
}
