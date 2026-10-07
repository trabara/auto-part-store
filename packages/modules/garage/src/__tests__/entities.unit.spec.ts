import { garageAdmin } from "../admin";
import { CustomerVehicle, garageEntities } from "../contract";
import { garageRoutes } from "../server/http";

describe("garage module", () => {
  it("validates customer_vehicle input", () => {
    const base = { customer_id: "cus_1", vehicle_id: "veh_1", nickname: null, vin: null, registration: null };
    expect(CustomerVehicle.dto.create.parse({ ...base, vin: "wvwzzz1kzaw000001" }).vin).toBe("WVWZZZ1KZAW000001");
    expect(() => CustomerVehicle.dto.create.parse({ ...base, vin: "IOQ123" })).toThrow();
    expect(() => CustomerVehicle.dto.create.parse({ ...base, vehicle_id: undefined })).toThrow();
  });

  it("links the vehicle catalog by column, not a foreign key", () => {
    expect(CustomerVehicle.relations.vehicle).toMatchObject({ kind: "link" });
    expect(CustomerVehicle.relations.customer).toMatchObject({ kind: "link" });
  });

  it("serves the same entities in the admin and the API, at /garage", () => {
    expect(garageEntities.path).toBe("garage");
    const features = Object.values(garageAdmin.features).map((f) => f.entity.name).sort();
    expect(features).toEqual(garageRoutes.entities.map((e) => e.name).sort());
  });
});
