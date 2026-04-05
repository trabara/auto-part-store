import { Container, Text } from "@medusajs/ui";

type StatCardProps = {
    label: string;
    value: number | undefined;
    isLoading: boolean;
};

export default function StatCard({ label, value, isLoading }: StatCardProps) {
    return (
        <Container className="flex flex-col gap-y-2 p-6">
            <Text
                size="large"
                leading="compact"
                weight="plus"
                className="text-ui-fg-subtle"
            >
                {label}
            </Text>
            {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-ui-bg-component" />
            ) : (
                <Text size="xlarge" weight="plus" className="text-ui-fg-base">
                    {value ?? 0}
                </Text>
            )}
        </Container>
    );
}