// Domain wiring (vehicle → fitment): fitment conditions test vehicle fields.
// Registers the catalog with the fitment module when Medusa loads the hooks.
import { registerVehicleConditions } from "../../conditions/vehicle-attributes";

registerVehicleConditions();
