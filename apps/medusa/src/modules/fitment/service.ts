import { InferTypeOf, DAL, Context } from "@medusajs/framework/types";
import {
  InjectManager,
  InjectTransactionManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils";
import { EntityManager } from "@medusajs/framework/mikro-orm/knex";
import * as Models from "./models";
import { CreateFitmentInput, UpdateFitmentInput } from "./schema";

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

class FitmentModuleService extends MedusaService(Models) {
  protected fitmentMakeRepository_: DAL.RepositoryService<FitmentMake>;
  protected fitmentModelRepository_: DAL.RepositoryService<FitmentModel>;
  protected fitmentEngineRepository_: DAL.RepositoryService<FitmentEngine>;
  protected fitmentRepository_: DAL.RepositoryService<Fitment>;

  constructor({
    fitmentMakeRepository,
    fitmentModelRepository,
    fitmentEngineRepository,
    fitmentRepository,
  }: InjectedDependencies) {
    super(...arguments);
    this.fitmentMakeRepository_ = fitmentMakeRepository;
    this.fitmentModelRepository_ = fitmentModelRepository;
    this.fitmentEngineRepository_ = fitmentEngineRepository;
    this.fitmentRepository_ = fitmentRepository;
  }

  @InjectManager()
  public async createFullFitments(
    dtos: CreateFitmentInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    return await this.createFullFitments_(dtos, sharedContext);
  }

  @InjectTransactionManager()
  protected async createFullFitments_(
    dtos: CreateFitmentInput[],
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    // Cache for makes, models, and engines to avoid duplicate lookups/creates
    const makeCache = new Map<string, FitmentMake>();
    const modelCache = new Map<string, FitmentModel>();
    const engineCache = new Map<string, FitmentEngine>();

    const fitments: Fitment[] = [];

    for (const dto of dtos) {
      // Find or create engine (with cache)
      const engineKey = `${dto.engine.fuel}:${dto.engine.type}:${dto.engine.size}:${dto.engine.tech || ""}`;
      let engine = engineCache.get(engineKey);

      if (!engine) {
        [engine] = await this.fitmentEngineRepository_.find(
          {
            where: {
              fuel: dto.engine.fuel,
              type: dto.engine.type,
              size: dto.engine.size,
              tech: dto.engine.tech as undefined,
            },
          },
          sharedContext,
        );

        if (!engine) {
          [engine] = await this.fitmentEngineRepository_.create(
            [dto.engine],
            sharedContext,
          );
        }
        engineCache.set(engineKey, engine!);
      }

      // Find or create make (with cache)
      // Handle both make_id and nested make formats
      let makeName: string;
      let makeId: string | undefined;

      if ("make" in dto.model && dto.model.make) {
        // Nested make format
        makeName = dto.model.make.name;
      } else if ("make_id" in dto.model && dto.model.make_id) {
        // make_id format - fetch the make to get its name
        const [existingMake] = await this.fitmentMakeRepository_.find(
          { where: { id: dto.model.make_id } },
          sharedContext,
        );
        if (!existingMake) {
          throw new Error(`Make with id ${dto.model.make_id} not found`);
        }
        makeName = existingMake.name;
        makeId = dto.model.make_id;
      } else {
        throw new Error("Either make or make_id must be provided in model");
      }

      let make = makeCache.get(makeName);

      if (!make) {
        if (makeId) {
          // If we already have the makeId, just use it
          [make] = await this.fitmentMakeRepository_.find(
            { where: { id: makeId } },
            sharedContext,
          );
        } else {
          // Find or create by name
          [make] = await this.fitmentMakeRepository_.find(
            { where: { name: makeName } },
            sharedContext,
          );

          if (!make) {
            [make] = await this.fitmentMakeRepository_.create(
              [{ name: makeName }],
              sharedContext,
            );
          }
        }
        makeCache.set(makeName, make!);
      }

      // Find or create model (with cache)
      const modelKey = `${make!.id}:${dto.model.name}`;
      let model = modelCache.get(modelKey);

      if (!model) {
        [model] = await this.fitmentModelRepository_.find(
          {
            where: { name: dto.model.name, make_id: make!.id },
          },
          sharedContext,
        );

        if (!model) {
          [model] = await this.fitmentModelRepository_.create(
            [{ name: dto.model.name, make_id: make!.id }],
            sharedContext,
          );
        }
        modelCache.set(modelKey, model!);
      }

      // Find or create fitment
      const fitmentData = {
        model_id: model!.id,
        engine_id: engine!.id,
        body_style: dto.body_style,
        drive: dto.drive,
        transmission: dto.transmission,
        year_start: dto.year_start,
        year_end: dto.year_end,
      };

      let [fitment] = await this.fitmentRepository_.find(
        {
          where: fitmentData,
        },
        sharedContext,
      );

      if (!fitment) {
        [fitment] = await this.fitmentRepository_.create(
          [fitmentData],
          sharedContext,
        );
      }

      fitments.push(fitment);
    }

    return fitments;
  }

  @InjectManager()
  public async createFullFitment(
    dto: CreateFitmentInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    const [fitment] = await this.createFullFitments_([dto], sharedContext);
    return fitment;
  }

  @InjectManager()
  public async updateFullFitment(
    data: UpdateFitmentInput,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    // Use the inherited updateFitments method from MedusaService base class
    // It expects an array, so we wrap the single update in an array
    const updated = await this.updateFitments([data], sharedContext);
    return updated[0];
  }

  @InjectManager()
  public async createModelFromInput(
    dto: CreateFitmentInput | any,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    return await this.createModelFromInput_(dto, sharedContext);
  }

  @InjectTransactionManager()
  protected async createModelFromInput_(
    dto: CreateFitmentInput | any,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    // Check if it's the make_id format or nested make format
    if ("make_id" in dto && dto.make_id) {
      // Format 1: Reference by make_id
      const [model] = await this.fitmentModelRepository_.create(
        [{ name: dto.name, make_id: dto.make_id }],
        sharedContext,
      );
      return model;
    } else if ("make" in dto && dto.make) {
      // Format 2: Nested make object - find or create make first
      const makeName = dto.make.name;
      let [make] = await this.fitmentMakeRepository_.find(
        { where: { name: makeName } },
        sharedContext,
      );

      if (!make) {
        [make] = await this.fitmentMakeRepository_.create(
          [{ name: makeName }],
          sharedContext,
        );
      }

      // Then create the model
      const [model] = await this.fitmentModelRepository_.create(
        [{ name: dto.name, make_id: make!.id }],
        sharedContext,
      );
      return model;
    }

    throw new Error("Either make_id or make must be provided");
  }

  @InjectManager()
  public async deleteMakeWithCascade(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    return await this.deleteMakeWithCascade_(id, sharedContext);
  }

  @InjectTransactionManager()
  protected async deleteMakeWithCascade_(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    // Find all models for this make
    const models = await this.fitmentModelRepository_.find(
      { where: { make_id: id } },
      sharedContext,
    );

    // For each model, delete all fitments
    for (const model of models) {
      await this.deleteModelWithCascade_(model.id, sharedContext);
    }

    // Delete the make
    await this.deleteFitmentMakes([id], sharedContext);
  }

  @InjectManager()
  public async deleteModelWithCascade(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    return await this.deleteModelWithCascade_(id, sharedContext);
  }

  @InjectTransactionManager()
  protected async deleteModelWithCascade_(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    // Find all fitments for this model
    const fitments = await this.fitmentRepository_.find(
      { where: { model_id: id } },
      sharedContext,
    );

    // Delete all fitments
    if (fitments.length > 0) {
      await this.deleteFitments(
        fitments.map((f) => f.id),
        sharedContext,
      );
    }

    // Delete the model
    await this.deleteFitmentModels([id], sharedContext);
  }

  @InjectManager()
  public async deleteEngineWithCascade(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    return await this.deleteEngineWithCascade_(id, sharedContext);
  }

  @InjectTransactionManager()
  protected async deleteEngineWithCascade_(
    id: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
  ) {
    // Find all fitments for this engine
    const fitments = await this.fitmentRepository_.find(
      { where: { engine_id: id } },
      sharedContext,
    );

    // Delete all fitments
    if (fitments.length > 0) {
      await this.deleteFitments(
        fitments.map((f) => f.id),
        sharedContext,
      );
    }

    // Delete the engine
    await this.deleteFitmentEngines([id], sharedContext);
  }
}

export default FitmentModuleService;
