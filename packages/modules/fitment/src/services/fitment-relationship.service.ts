import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import { Context, DAL, InferTypeOf } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
} from "@medusajs/framework/utils";
import * as Models from "../models";
import {
  CreateEngineInput,
  CreateModelInput
} from "../schema";
import { IFitmentRelationshipService } from "./interfaces/fitment-relationship.interface";

type FitmentMake = InferTypeOf<typeof Models.FitmentMake>;
type FitmentModel = InferTypeOf<typeof Models.FitmentModel>;
type FitmentEngine = InferTypeOf<typeof Models.FitmentEngine>;
type Fitment = InferTypeOf<typeof Models.Fitment>;

type InjectedDependencies = {
  fitmentMakeRepository: DAL.RepositoryService<FitmentMake>;
  fitmentModelRepository: DAL.RepositoryService<FitmentModel>;
  fitmentEngineRepository: DAL.RepositoryService<FitmentEngine>;
  fitmentRepository: DAL.RepositoryService<Fitment>;
};

/**
 * Service responsible for managing relationships between fitment entities
 * (Makes, Models, Engines, Fitments)
 *
 * Responsibilities (SRP):
 * - Find or create related entities
 * - Handle entity caching during batch operations
 * - Support multiple input formats (nested vs. ID references)
 */
export class FitmentRelationshipService implements IFitmentRelationshipService {
  protected fitmentMakeRepository_: DAL.RepositoryService<FitmentMake>;
  protected fitmentModelRepository_: DAL.RepositoryService<FitmentModel>;
  protected fitmentEngineRepository_: DAL.RepositoryService<FitmentEngine>;
  protected fitmentRepository_: DAL.RepositoryService<Fitment>;

  constructor(dependencies: InjectedDependencies) {
    this.fitmentMakeRepository_ = dependencies.fitmentMakeRepository;
    this.fitmentModelRepository_ = dependencies.fitmentModelRepository;
    this.fitmentEngineRepository_ = dependencies.fitmentEngineRepository;
    this.fitmentRepository_ = dependencies.fitmentRepository;
  }

  @InjectManager()
  public async findOrCreateMake(
    name: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentMake> {
    return await this.findOrCreateMake_(name, sharedContext);
  }

  @InjectTransactionManager()
  protected async findOrCreateMake_(
    name: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentMake> {
    const [existingMake] = await this.fitmentMakeRepository_.find(
      { where: { name } },
      sharedContext,
    );

    if (existingMake) {
      return existingMake;
    }

    const [newMake] = await this.fitmentMakeRepository_.create(
      [{ name }],
      sharedContext,
    );

    return newMake;
  }

  @InjectManager()
  public async findOrCreateModel(
    name: string,
    makeId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    return await this.findOrCreateModel_(name, makeId, sharedContext);
  }

  @InjectTransactionManager()
  protected async findOrCreateModel_(
    name: string,
    makeId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    const [existingModel] = await this.fitmentModelRepository_.find(
      { where: { name, make_id: makeId } },
      sharedContext,
    );

    if (existingModel) {
      return existingModel;
    }

    const [newModel] = await this.fitmentModelRepository_.create(
      [{ name, make_id: makeId }],
      sharedContext,
    );

    return newModel;
  }

  @InjectManager()
  public async findOrCreateEngine(
    data: CreateEngineInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentEngine> {
    return await this.findOrCreateEngine_(data, sharedContext);
  }

  @InjectTransactionManager()
  protected async findOrCreateEngine_(
    data: CreateEngineInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentEngine> {
    const [existingEngine] = await this.fitmentEngineRepository_.find(
      {
        where: {
          fuel: data.fuel,
          type: data.type,
          size: data.size,
          tech: data.tech as undefined,
        },
      },
      sharedContext,
    );

    if (existingEngine) {
      return existingEngine;
    }

    const [newEngine] = await this.fitmentEngineRepository_.create(
      [data],
      sharedContext,
    );

    return newEngine;
  }

  /**
   * Create or find fitment entity
   */
  // private async createOrFindFitment(
  //   dto: CreateFitmentInput,
  //   model: FitmentModel,
  //   engine: FitmentEngine,
  //   sharedContext?: Context<EntityManager>,
  // ): Promise<Fitment> {
  //   const fitmentData: any = {
  //     model_id: model.id,
  //     engine_id: engine.id,
  //     body_style: dto.body_style,
  //     drive: dto.drive,
  //     transmission: dto.transmission,
  //     year_start: dto.year_start,
  //   };

  //   if (dto.year_end !== undefined) {
  //     fitmentData.year_end = dto.year_end;
  //   }

  //   let [fitment] = await this.fitmentRepository_.find(
  //     { where: fitmentData },
  //     sharedContext,
  //   );

  //   if (!fitment) {
  //     [fitment] = await this.fitmentRepository_.create(
  //       [fitmentData],
  //       sharedContext,
  //     );
  //   }

  //   return fitment;
  // }

  @InjectManager()
  public async createModelFromInput(
    dto: CreateModelInput | any,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    return await this.createModelFromInput_(dto, sharedContext);
  }

  @InjectTransactionManager()
  protected async createModelFromInput_(
    dto: CreateModelInput | any,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ): Promise<FitmentModel> {
    // Format 1: Reference by make_id
    if ("make_id" in dto && dto.make_id) {
      const [model] = await this.fitmentModelRepository_.create(
        [{ name: dto.name, make_id: dto.make_id }],
        sharedContext,
      );
      return model;
    }

    // Format 2: Nested make object
    if ("make" in dto && dto.make) {
      const make = await this.findOrCreateMake_(dto.make.name, sharedContext);

      const [model] = await this.fitmentModelRepository_.create(
        [{ name: dto.name, make_id: make.id }],
        sharedContext,
      );
      return model;
    }

    throw new Error("Either make_id or make must be provided");
  }
}
