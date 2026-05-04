import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { AUTHZ_MODULE, AuthzModuleService } from "@repo/domain-modules/authz";
import { BaseController } from "@trabara/common";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
} from "@trabara/core/validations";

export class CategoryController extends BaseController {


  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      const { data, metadata } = await query.graph({
        entity: "authz_category",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.success({ data, metadata });
    }, "Categories retrieved successfully");
  }

  async getById(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      const category = await service.retrieveAuthzCategory(id, {
        relations: ["permissions"],
      });

      this.success({ category });
    }, "Category retrieved successfully");
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const validated = CreateCategorySchema.parse(this.req.validatedBody);

      const [category] = await service.createPermissionCategories([validated]);

      this.created({ category });
    }, "Category created successfully");
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const { id } = this.req.params;

      const validated = UpdateCategorySchema.omit({ permissions: true }).parse(this.req.validatedBody);
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);

      const [category] = await service.updateAuthzCategories([{ id, ...validated }]);

      this.success({ category });
    }, "Category updated successfully");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      await service.deleteAuthzCategories([id]);

      this.noContent();
    }, "Category deleted successfully");
  }
}
