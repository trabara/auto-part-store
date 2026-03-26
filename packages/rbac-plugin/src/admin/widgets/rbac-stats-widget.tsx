import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Badge, Container, Heading, Hint } from "@medusajs/ui";
import { FolderTree, Key, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function RbacWidget() {
    return (
        <Container className="divide-y p-0">
            <div className="px-6 py-4 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
                <div>
                    <Heading level="h1">Role-Based Access Control</Heading>
                    <Hint className="text-ui-fg-subtle mt-1">
                        Manage roles, permissions, and access control for your admin
                        users.
                    </Hint>
                </div>
            </div>

            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-32">
                <Link
                    to="/settings/users/roles"
                >
                    <div className="flex items-center justify-between">

                        <div className="flex items-center gap-3">
                            <Users size={24} />
                            <div>
                                <Heading level="h2">Roles</Heading>
                                <Hint>
                                    Manage user roles
                                </Hint>
                            </div>
                        </div>
                        <Badge>0</Badge>
                    </div>

                </Link>

                <Link
                    to="/settings/users/permissions"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Key size={24} />
                            <div>
                                <Heading level="h2">Permissions</Heading>
                                <Hint>
                                    View and manage permissions
                                </Hint>
                            </div>
                        </div>
                        <Badge>0</Badge>
                    </div>

                </Link>

                <Link
                    to="/settings/users/categories"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FolderTree size={24} />
                            <div>
                                <Heading level="h2">Categories</Heading>
                                <Hint>
                                    Organize permissions
                                </Hint>
                            </div>
                        </div>
                        <Badge>0</Badge>
                    </div>
                </Link>
            </div>

        </Container>
    );
}

export const config = defineWidgetConfig({
    zone: "user.list.after",
})