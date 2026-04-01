import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { BaseController } from "@repo/common";
import {
  AUTHZ_MODULE,
  AuthzModuleService,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "../../modules/authz";

export class CategoryController extends BaseController {
  constructor(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
    super(req, res);
  }

  async get(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      try {
        const category = await service.retrieveAuthzCategory(id, {
          relations: ["permissions"],
        });

        this.success({ category }, 200);
      } catch (e) {
        this.notFound("Category not found");
      }
    });
  }

  async list(): Promise<void> {
    await this.execute(async () => {
      const query = this.req.scope.resolve(ContainerRegistrationKeys.QUERY);

      const { data, metadata } = await query.graph({
        entity: "authz_category",
        ...this.req.queryConfig,
        ...this.req.filterableFields,
      });

      this.success({ data, metadata });
    });
  }

  async create(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const validated = CreateCategorySchema.parse(this.req.validatedBody);

      const category = await service.createPermissionCategory(validated);

      this.created({ category });
    }, "Create category");
  }

  async update(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;
      const validated = UpdateCategorySchema.parse(this.req.validatedBody);

      const updateData: Record<string, any> = { id };
      if (validated.name !== undefined) {
        updateData.name = validated.name;
      }
      if (validated.description !== undefined) {
        updateData.description = validated.description;
      }

      const [category] = await service.updateAuthzCategories([updateData]);

      this.success({ category }, 200);
    }, "Update category");
  }

  async delete(): Promise<void> {
    await this.execute(async () => {
      const service = this.req.scope.resolve<AuthzModuleService>(AUTHZ_MODULE);
      const { id } = this.req.params;

      await service.deleteAuthzCategories([id]);

      this.success({ success: true }, 204);
    }, "Delete category");
  }
}
