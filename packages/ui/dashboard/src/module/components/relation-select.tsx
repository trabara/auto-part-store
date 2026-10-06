import { ChevronUpDown, MagnifyingGlass } from "@medusajs/icons";
import { clx, Input, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { entityLabel, type EntityDef } from "@repo/framework/entity";
import { useEffect, useRef, useState } from "react";
import { useSdk } from "../../common/context";

export type RelationSelectProps = {
  /** Collection URL of the target entity (see `entityUrl`). */
  url: string;
  /** Target entity: options are labelled with its `label`. */
  entity: EntityDef<any, any, any>;
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  /** Offer an empty choice (nullable relations). */
  clearable?: boolean;
  /** Options loaded per search. */
  limit?: number;
};

type Option = { value: string; label: string };

/**
 * Records of a list response: `data` for framework routes, the first array
 * property for Medusa's (`{ variants: [...], count }`).
 */
function listOf(response: Record<string, unknown>): Record<string, any>[] {
  if (Array.isArray(response.data)) return response.data;
  const list = Object.values(response).find(Array.isArray);
  return (list as Record<string, any>[] | undefined) ?? [];
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

/**
 * Picks a related record by id: a searchable list (server-side `q`, so any
 * catalog size works), labelled by the target entity's label.
 */
export function RelationSelect({
  url,
  entity,
  value,
  onChange,
  placeholder,
  clearable = false,
  limit = 20,
}: RelationSelectProps) {
  const sdk = useSdk();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const q = useDebounced(search.trim(), 250);
  const fields = [...new Set(["id", ...entity.label.fields])].join(",");

  const fetchOptions = async (query: Record<string, unknown>, signal?: AbortSignal): Promise<Option[]> => {
    const response = await sdk.client.fetch<Record<string, unknown>>(url, { signal, query: { fields, ...query } });
    return listOf(response).map((item) => ({ value: String(item.id), label: entityLabel(entity, item) }));
  };

  const { data: options = [], isFetching } = useQuery({
    queryKey: [url, "relation-select", fields, q, limit],
    enabled: open,
    queryFn: ({ signal }) => fetchOptions({ limit, ...(q ? { q } : {}) }, signal),
  });

  // The selected record may be outside the current results: load its label.
  const { data: selected } = useQuery({
    queryKey: [url, "relation-select-value", fields, value],
    enabled: !!value,
    queryFn: ({ signal }) => fetchOptions({ id: value, limit: 1 }, signal).then((r) => r[0] ?? null),
  });

  const choices: (Option | null)[] = clearable ? [null, ...options] : options;

  useEffect(() => setActive(0), [q, open]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const choose = (option: Option | null) => {
    onChange?.(option ? option.value : null);
    setOpen(false);
    setSearch("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, choices.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (choices.length) choose(choices[active] ?? null);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const label = value ? (selected?.label ?? "…") : null;

  return (
    <div ref={root} className="relative w-full">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={clx(
          "bg-ui-bg-field shadow-borders-base txt-compact-small flex h-8 w-full items-center justify-between gap-x-2 rounded-md px-2 text-left outline-none",
          "hover:bg-ui-bg-field-hover focus-visible:shadow-borders-interactive-with-active",
        )}
      >
        <span className={clx("truncate", !label && "text-ui-fg-muted")}>{label ?? placeholder ?? "Select"}</span>
        <ChevronUpDown className="text-ui-fg-muted shrink-0" />
      </button>

      {open && (
        <div
          className="bg-ui-bg-component shadow-elevation-flyout absolute left-0 right-0 rounded-lg p-1"
          style={{ top: "calc(100% + 4px)", zIndex: 60 }}
        >
          <div className="relative p-1">
            <Input
              autoFocus
              size="small"
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <MagnifyingGlass className="text-ui-fg-muted absolute right-3 top-1/2 -translate-y-1/2" style={{ display: search ? "none" : undefined }} />
          </div>
          <div role="listbox" className="overflow-y-auto" style={{ maxHeight: 240 }}>
            {choices.map((option, i) => (
              <button
                key={option?.value ?? "__none__"}
                type="button"
                role="option"
                aria-selected={(option?.value ?? null) === (value ?? null)}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(option)}
                className={clx(
                  "txt-compact-small flex w-full items-center rounded-md px-2 py-1.5 text-left",
                  i === active ? "bg-ui-bg-component-hover" : "",
                  (option?.value ?? null) === (value ?? null) && "font-medium",
                )}
              >
                {option ? option.label : <span className="text-ui-fg-muted">— None</span>}
              </button>
            ))}
            {!isFetching && options.length === 0 && (
              <Text size="small" className="text-ui-fg-subtle px-2 py-1.5">
                {q ? `No results for "${q}"` : "Nothing to choose yet"}
              </Text>
            )}
            {isFetching && options.length === 0 && (
              <Text size="small" className="text-ui-fg-subtle px-2 py-1.5">Loading…</Text>
            )}
          </div>
          {options.length >= limit && (
            <Text size="xsmall" className="text-ui-fg-muted px-2 pb-1 pt-1.5">
              Showing the first {limit}: type to narrow.
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
