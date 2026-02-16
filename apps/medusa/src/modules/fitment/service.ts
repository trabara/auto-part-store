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
      const makeName = dto.model.make.name;
      let make = makeCache.get(makeName);

      if (!make) {
        [make] = await this.fitmentMakeRepository_.find(
          {
            where: { name: makeName },
          },
          sharedContext,
        );

        if (!make) {
          [make] = await this.fitmentMakeRepository_.create(
            [{ name: makeName }],
            sharedContext,
          );
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
}

export default FitmentModuleService;
