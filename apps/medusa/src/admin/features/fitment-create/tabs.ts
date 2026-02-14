import { CreateEngineSchema, CreateFitmentInput, CreateFitmentSchema, CreateMakeSchema, CreateModelSchema, EngineSchema } from "../../../modules/fitment/schema";
import EngineTab from "./tabs/engine";
import GeneralTab from "./tabs/general";
import MakeTab from "./tabs/make";
import ModelTab from "./tabs/model";

const TABS = {
    general: {
        label: "General",
        validate: (data: CreateFitmentInput) => CreateFitmentSchema.omit({ model: true, engine: true }).parse(data),
        accessor: undefined,
        error: "Please fill all the general details and ensure years are valid",
        Component: GeneralTab,
    },
    make: {
        label: "Make",
        validate: (data: CreateFitmentInput) => CreateMakeSchema.omit({ id: true }).parse(data.model.make),
        accessor: "model.make.name",
        error: "Make name is required",
        Component: MakeTab,
    },
    model: {
        label: "Model",
        validate: (data: CreateFitmentInput) => CreateModelSchema.omit({ make: true }).parse(data.model),
        accessor: "model.name",
        error: "Model name is required",
        Component: ModelTab,
    },
    engine: {
        label: "Engine",
        validate: (data: CreateFitmentInput) => CreateEngineSchema.omit({ id: true }).parse(data.engine),
        accessor: "engine",
        error: "Engine details are required and size must be a valid number",
        Component: EngineTab
    }
}

export type Tabs = keyof typeof TABS


export default TABS