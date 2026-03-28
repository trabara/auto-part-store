import { z } from "@medusajs/framework/zod";
import { PageResponse, QueryFn } from "./query";

export type StepConfig<TSchema extends z.AnyZodObject> = {
    description?: string;
    header?: boolean;
    icon: React.ReactNode;
    id: string
    label: string;
    schema: TSchema;
}

export type ActionConfig<T> = {
    name: string;
    fields?: T
}

export type ListConfig<T extends { id: string }, Response extends PageResponse<T>> = ActionConfig<T> & {
    fetcher: QueryFn<T, Response>;
    schema: z.AnyZodObject;
}

export type CreateConfig<T extends { id: string }> = ActionConfig<T> & {
    fetcher: (data: any) => Promise<any>;
    schema?: z.AnyZodObject;
    steps: StepConfig<z.AnyZodObject>[];
}

export type UpdateConfig<T extends { id: string }> = ActionConfig<T> & {
    fetcher: (data: any) => Promise<any>;
    schema: z.AnyZodObject;
}

export type DeleteConfig<T extends { id: string }> = ActionConfig<T> & {
    fetcher: (data: any) => Promise<any>;
}

export type CrudConfig<T extends { id: string }, Response extends PageResponse<T>> = {
    list: ListConfig<T, Response>;
    create: CreateConfig<T>;
    update: UpdateConfig<T>;
}
