import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
export default function onMedusaDeletion({ event, container }: SubscriberArgs<{
    id: string | string[];
}>): Promise<void>;
export declare const config: SubscriberConfig;
