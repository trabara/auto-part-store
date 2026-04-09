import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text } from "@medusajs/ui";
import { sdk } from "@repo/admin/lib/sdk";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import StatCard from "../components/stat-card";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

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


export default function StatsWidget() {
    const { t } = useTranslation();

    const { data: stats, isLoading } = useQuery({
        queryKey: ["rbac-stats"],
        queryFn: ({ signal }) => fetchStats(signal),
    });

    return (
        <Container className="divide-y p-0">
            <div className="px-6 py-4 flex flex-col gap-y-1">
                <Heading level="h1">{t("nav.rbac")}</Heading>
                <Text size="small" leading="compact" className="text-ui-fg-subtle">
                    {t("rbac.stats.subtitle")}
                </Text>
            </div>

            <div className="flex flex-col divide-y">
                <StatCard
                    to="/settings/users/rbac/roles"
                    label={t("rbac.stats.roles")}
                    value={stats?.roles}
                    isLoading={isLoading}
                />
                <StatCard
                    to="/settings/users/rbac/permissions"
                    label={t("rbac.stats.permissions")}
                    value={stats?.permissions}
                    isLoading={isLoading}
                />
                <StatCard
                    to="/settings/users/rbac/categories"
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
        </Container>
    );
}

export const config = defineWidgetConfig({
    zone: "user.list.after",
});