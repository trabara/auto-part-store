import { clx, Text } from "@medusajs/ui";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

type StatCardProps = {
    label: string;
    value: number | undefined;
    isLoading: boolean;
    icon?: React.ReactNode;
    to?: string;
};

export default function StatCard({ label, value, isLoading, icon, to }: StatCardProps) {
    const content = (
        <div className="flex justify-between items-center px-6 py-4">
            <Text
                leading="compact"
                weight="plus"
                className={clx("text-ui-fg-subtle items-center flex", { "hover:underline": to })}
            >
                {icon && <span className="ml-2">{icon}</span>}
                {label}
                {to && <ExternalLink size={15} className="inline-block ml-1" />}
            </Text>
            {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-ui-bg-component" />
            ) : (
                <Text size="xlarge" weight="plus" className="text-ui-fg-base">
                    {value ?? 0}
                </Text>
            )}
        </div>
    );

    if (to) {
        return <Link to={to}>{content}</Link>;
    }

    return content;

}