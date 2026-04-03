import { defineLink } from "@medusajs/framework/utils";
import UserModule from '@medusajs/user';
import AuthzModule from "../modules/authz";

export default defineLink(
    UserModule.linkable.user,
    {
        ...AuthzModule.linkable.authzMember,
        primaryKey: "user_id",
        label: "user"
    },
)