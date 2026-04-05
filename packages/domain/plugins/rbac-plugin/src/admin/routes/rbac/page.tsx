import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Heading, Text } from "@medusajs/ui";
import { sdk } from "@repo/admin/lib/sdk";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import StatCard from "./components/stat-card";

type StatsResponse = {
  stats: {
    roles: number;
    permissions: number;
    categories: number;
    members: number;
    policies: number;
  };
};

const fetchStats = (signal: AbortSignal) =>
  sdk.client
    .fetch<StatsResponse>("/admin/rbac/v2/stats", {
      method: "GET",
      signal,
    })
    .then((res) => res.stats)
    .catch(() => null);


export default function RbacStatsPage() {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["rbac-stats"],
    queryFn: ({ signal }) => fetchStats(signal),
  });

  return (
    <div className="flex flex-col gap-y-4 p-6">
      <div className="flex flex-col gap-y-1">
        <Heading level="h1">{t("nav.rbac")}</Heading>
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          {t("rbac.stats.subtitle")}
        </Text>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label={t("rbac.stats.roles")}
          value={stats?.roles}
          isLoading={isLoading}
        />
        <StatCard
          label={t("rbac.stats.permissions")}
          value={stats?.permissions}
          isLoading={isLoading}
        />
        <StatCard
          label={t("rbac.stats.categories")}
          value={stats?.categories}
          isLoading={isLoading}
        />
        <StatCard
          label={t("rbac.stats.members")}
          value={stats?.members}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

export const handle = {
  breadcrumb: () => "RBAC",
};

export const config = defineRouteConfig({
  label: "nav.rbac",
  translationNs: "translation",
});
