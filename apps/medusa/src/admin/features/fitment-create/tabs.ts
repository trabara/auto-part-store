import {
  CreateEngineSchema,
  CreateFitmentInput,
  CreateFitmentSchema,
  CreateMakeSchema,
  CreateModelValidationSchema,
} from "../../../modules/fitment/schema";
import { z } from "@medusajs/framework/zod";
import EngineTab from "./tabs/engine";
import GeneralTab from "./tabs/general";
import MakeTab from "./tabs/make";
import ModelTab from "./tabs/model";

const TABS = {
  general: {
    label: "General",
    validate: (data: CreateFitmentInput) =>
      CreateFitmentSchema.omit({ model: true, engine: true }).parse(data),
    accessor: undefined,
    error: "Please fill all the general details and ensure years are valid",
    Component: GeneralTab,
  },
  make: {
    label: "Make",
    validate: (data: CreateFitmentInput) => {
      // Handle both make formats
      const model = data.model as any;
      if (model.make) {
        return CreateMakeSchema.omit({ id: true }).parse(model.make);
      } else if (model.make_id) {
        return true; // make_id is valid
      }
      throw new Error("Either make or make_id must be provided");
    },
    accessor: "model.make.name",
    error: "Make name is required",
    Component: MakeTab,
  },
  model: {
    label: "Model",
    validate: (data: CreateFitmentInput) => {
      const model = data.model as any;
      // Validate based on which format is used
      if (model.make) {
        return CreateModelValidationSchema.parse(data.model);
      } else if (model.make_id) {
        return z.object({ name: z.string(), make_id: z.string() }).parse(model);
      }
      throw new Error("Invalid model format");
    },
    accessor: "model.name",
    error: "Model name is required",
    Component: ModelTab,
  },
  engine: {
    label: "Engine",
    validate: (data: CreateFitmentInput) =>
      CreateEngineSchema.omit({ id: true }).parse(data.engine),
    accessor: "engine",
    error: "Engine details are required and size must be a valid number",
    Component: EngineTab,
  },
};

export type Tabs = keyof typeof TABS;

export default TABS;
