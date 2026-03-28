import { defineLink } from "@medusajs/framework/utils";
import UserModule from "@medusajs/medusa/user";
import RbacModule from "../modules/rbac";

export default defineLink(
    {
        linkable: UserModule.linkable.user,
        isList: false,
        deleteCascade: true,
    },
    {
        linkable: RbacModule.linkable.rbacMember,
        isList: false,
    }
);
