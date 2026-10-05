import type { RouteTemplates } from "@repo/framework/admin";
import { TemplateCreate } from "./create";
import { TemplateDetail } from "./details";
import { TemplateEdit } from "./edit";
import { TemplateList } from "./list";

declare module "@repo/framework/core" {
  interface TemplateRegistry {
    list: true;
    create: true;
    detail: true;
    edit: true;
  }
}

/** Templates for features made with `module.crud(entity)`. */
export const crudTemplates = {
  list: TemplateList,
  create: TemplateCreate,
  detail: TemplateDetail,
  edit: TemplateEdit,
} satisfies RouteTemplates;

export { TemplateCreate, TemplateDetail, TemplateEdit, TemplateList };
