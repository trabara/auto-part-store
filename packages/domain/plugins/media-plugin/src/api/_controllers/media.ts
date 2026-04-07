import { BaseController } from "@trabara/common";
import { UpdateMediasInput } from "@trabara/core/dtos";
import {
  createMediasWorkflow,
  deleteMediasWorkflow,
  updateMediasWorkflow,
} from "../../workflows";
import { CreateMediasSchema } from "@trabara/core/validations";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";
import type { MediaModuleService } from "@repo/domain-modules/media";

/**
 * Media Controller
 *
 * Handles all media-related HTTP requests.
 * Following SRP: Single responsibility is handling media HTTP requests.
 * Following DIP: Depends on abstraction (BaseController) not implementation.
 */
export class MediaController extends BaseController {
  public async list(): Promise<void> {
    await this.execute(async () => {
      const { entity_id } = this.req.params;
      const mediaService =
        this.req.scope.resolve<MediaModuleService>(ENTITY_MEDIA_MODULE);

      const medias = await mediaService.list({ entity_id });

      this.success({ medias });
    }, "Media list retrieved successfully");
  }

  public async createBatch(): Promise<void> {
    await this.execute(async () => {
      const { entity_id } = this.req.params;
      const { files } = CreateMediasSchema.parse(this.req.validatedBody);

      // Add entity_id to each file
      const entity_files = files.map((file) => ({
        ...file,
        entity_id: entity_id,
      }));

      const { result } = await createMediasWorkflow(this.req.scope).run({
        input: {
          medias: entity_files,
        },
      });
      this.success({ medias: result });
    }, "Media created successfully");
  }

  public async updateBatch(): Promise<void> {
    await this.execute(async () => {
      this.logger.info("Updating media for entity", {
        entity: this.req.params.entity,
        entity_id: this.req.params.id,
      });

      const { updates } = this.req.validatedBody as UpdateMediasInput;

      const { result } = await updateMediasWorkflow(this.req.scope).run({
        input: { updates },
      });

      this.success({ medias: result });
    }, "Media updated successfully");
  }

  public deleteBatch(): Promise<void> {
    return this.execute(async () => {
      const { ids } = this.req.validatedBody as { ids: string[] };

      await deleteMediasWorkflow(this.req.scope).run({
        input: { ids },
      });

      this.success({ deleted: ids });
    }, "Media deleted successfully");
  }
}
