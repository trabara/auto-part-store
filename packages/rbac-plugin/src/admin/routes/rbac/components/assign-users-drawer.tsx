import { zodResolver } from "@hookform/resolvers/zod";
import { AdminUserListResponse } from "@medusajs/framework/types";
import { z } from "@medusajs/framework/zod";
import { Button, Drawer, Heading, Hint, toast } from "@medusajs/ui";
import DataTable from "@repo/dashboard/components/data-table";
import { sdk } from "@repo/dashboard/lib/sdk";
import { PageQueryParams, PageResponse } from "@repo/dashboard/types/query";
import { zodQueryResolve } from "@repo/dashboard/utils/zod";
import { useMutation } from "@tanstack/react-query";
import { memo } from "react";
import { Controller, useForm } from "react-hook-form";
import { AssignUsersInput, AssignUsersSchema, UserSchema } from '../../../../modules/rbac-v2/schema';

type User = z.infer<typeof UserSchema>

const fetchUsers = async (signal: AbortSignal, params?: PageQueryParams) => {
    return sdk.client.fetch<AdminUserListResponse>("/admin/users", {
        method: "GET",
        signal,
        query: {
            ...(params || {}),
            fields: zodQueryResolve(UserSchema),
        },
    })
        .then((res) => ({
            data: res.users.map((user) => ({
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
            })),
            metadata: {
                count: res.count,
                skip: res.offset,
                take: res.limit,
            }
        }) as PageResponse<User>)
}

const assignUsersToRole = (roleId: string, input: AssignUsersInput) => {
    return sdk.client.fetch(`/admin/rbac/v2/roles/${roleId}/assign`, {
        method: "POST",
        body: input,
    })
}

interface AssignUsersDrawerProps {
    roleId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onValueChange?: (users: User[]) => void;
}

const UsersDatTable = memo((props: any) => {
    return (
        <DataTable
            name="users"
            // fields={{
            //     id: {
            //         hideLabel: true
            //     }
            // }}
            schema={UserSchema}
            queryFn={fetchUsers}
            {...props}
        />
    )
})

function AssignUsersDrawer({ roleId, open, onOpenChange, onValueChange }: AssignUsersDrawerProps) {

    const form = useForm({
        resolver: zodResolver(AssignUsersSchema),
        defaultValues: { users: [] }
    })

    const mutation = useMutation({
        mutationFn: (input: AssignUsersInput) => assignUsersToRole(roleId, input),
        onSuccess: () => {
            toast.success("Users assigned successfully")
        },
        onError: () => {
            toast.error("Failed to assign users")
        }
    })


    const onSubmit = form.handleSubmit(async (data) => {
        await mutation.mutateAsync(data)
    }, (errors) => {
        console.log("Form validation error", errors)
        toast.error("Please select at least one user")
    })

    console.log("Selected users", form.watch("users"))
    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <Drawer.Content asChild>
                <form onSubmit={onSubmit}>
                    <Drawer.Header>
                        <Drawer.Title>
                            <Heading level="h2">Assign Users</Heading>
                            <Hint>Select users to assign to the role</Hint>
                        </Drawer.Title>
                    </Drawer.Header>
                    <Drawer.Body className="!px-0 !py-0">
                        <Controller
                            control={form.control}
                            name="users"
                            render={({ field }) => {
                                return <UsersDatTable
                                    onRowSelectChange={field.onChange}
                                />
                            }}
                        />

                    </Drawer.Body>
                    <Drawer.Footer>
                        <Drawer.Close asChild>
                            <Button variant="secondary">Close</Button>
                        </Drawer.Close>
                        <Button type="submit">
                            Assign
                        </Button>
                    </Drawer.Footer>
                </form>
            </Drawer.Content>
        </Drawer>
    )
}

export default memo(AssignUsersDrawer)
