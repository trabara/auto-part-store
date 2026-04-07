/**
 * Unit tests for updateRolePoliciesStep invoke and compensation logic.
 *
 * We test the exported handler functions directly (invokeUpdateRolePolicies /
 * compensateUpdateRolePolicies) so no Medusa workflow runtime is needed.
 */

import {
  invokeUpdateRolePolicies,
  compensateUpdateRolePolicies,
} from "../update-role-policies";
import { AUTHZ_MODULE } from "@repo/domain-modules/authz";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService() {
  return {
    policies: {
      list: jest.fn(),
    },
    updateRolePolicies: jest.fn(),
  };
}

function buildContainer(service: ReturnType<typeof makeService>) {
  return {
    resolve: (key: string) => {
      if (key === AUTHZ_MODULE) return service;
      throw new Error(`Unknown module: ${key}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("invokeUpdateRolePolicies", () => {
  afterEach(() => jest.clearAllMocks());

  it("snapshots existing policies and replaces them with the new set", async () => {
    const service = makeService();
    service.policies.list.mockResolvedValue([
      { id: "pol_1", permission_id: "perm_old_1" },
      { id: "pol_2", permission_id: "perm_old_2" },
    ]);
    service.updateRolePolicies.mockResolvedValue(undefined);

    const result = await invokeUpdateRolePolicies(
      { roleId: "role_1", permissionIds: ["perm_new_1", "perm_new_2"] },
      buildContainer(service),
    );

    expect(service.policies.list).toHaveBeenCalledWith({ role_id: "role_1" });
    expect(service.updateRolePolicies).toHaveBeenCalledWith("role_1", [
      "perm_new_1",
      "perm_new_2",
    ]);

    expect(result.output).toEqual({ roleId: "role_1" });
    expect(result.compensation).toEqual({
      roleId: "role_1",
      previousPermissionIds: ["perm_old_1", "perm_old_2"],
    });
  });

  it("works correctly when the role has no existing policies", async () => {
    const service = makeService();
    service.policies.list.mockResolvedValue([]);
    service.updateRolePolicies.mockResolvedValue(undefined);

    const result = await invokeUpdateRolePolicies(
      { roleId: "role_1", permissionIds: ["perm_1"] },
      buildContainer(service),
    );

    expect(result.compensation).toEqual({
      roleId: "role_1",
      previousPermissionIds: [],
    });
  });

  it("passes an empty permissionIds array when clearing all policies", async () => {
    const service = makeService();
    service.policies.list.mockResolvedValue([
      { id: "pol_1", permission_id: "perm_1" },
    ]);
    service.updateRolePolicies.mockResolvedValue(undefined);

    await invokeUpdateRolePolicies(
      { roleId: "role_1", permissionIds: [] },
      buildContainer(service),
    );

    expect(service.updateRolePolicies).toHaveBeenCalledWith("role_1", []);
  });
});

describe("compensateUpdateRolePolicies", () => {
  afterEach(() => jest.clearAllMocks());

  it("restores the previous permission set on the role", async () => {
    const service = makeService();
    service.updateRolePolicies.mockResolvedValue(undefined);

    await compensateUpdateRolePolicies(
      { roleId: "role_1", previousPermissionIds: ["perm_old_1", "perm_old_2"] },
      buildContainer(service),
    );

    expect(service.updateRolePolicies).toHaveBeenCalledWith("role_1", [
      "perm_old_1",
      "perm_old_2",
    ]);
  });

  it("restores an empty permission set when the role previously had none", async () => {
    const service = makeService();
    service.updateRolePolicies.mockResolvedValue(undefined);

    await compensateUpdateRolePolicies(
      { roleId: "role_1", previousPermissionIds: [] },
      buildContainer(service),
    );

    expect(service.updateRolePolicies).toHaveBeenCalledWith("role_1", []);
  });

  it("is a no-op when compensation data is undefined", async () => {
    const service = makeService();

    await compensateUpdateRolePolicies(undefined, buildContainer(service));

    expect(service.updateRolePolicies).not.toHaveBeenCalled();
  });
});
