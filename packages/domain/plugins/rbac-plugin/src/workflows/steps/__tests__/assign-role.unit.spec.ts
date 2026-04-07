/**
 * Unit tests for assignRoleStep invoke and compensation logic.
 *
 * We test the exported handler functions directly (invokeAssignRole /
 * compensateAssignRole) so no Medusa workflow runtime is needed.
 */

import { invokeAssignRole, compensateAssignRole } from "../assign-role";
import { AUTHZ_MODULE } from "@repo/domain-modules/authz";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService() {
  return {
    members: {
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    assignRbacUsers: jest.fn(),
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

describe("invokeAssignRole", () => {
  afterEach(() => jest.clearAllMocks());

  it("snapshots null previousMember when user has no existing membership", async () => {
    const service = makeService();
    service.members.list.mockResolvedValue([]);
    service.assignRbacUsers.mockResolvedValue(undefined);

    const result = await invokeAssignRole(
      { roleId: "role_1", userId: "user_1" },
      buildContainer(service),
    );

    expect(service.members.list).toHaveBeenCalledWith({ user_id: "user_1" });
    expect(service.assignRbacUsers).toHaveBeenCalledWith("role_1", {
      userIds: ["user_1"],
    });

    expect(result.output).toEqual({ roleId: "role_1" });
    expect(result.compensation).toEqual({
      userId: "user_1",
      previousMemberId: null,
      previousRoleId: null,
    });
  });

  it("snapshots the existing membership when the user already has a role", async () => {
    const service = makeService();
    service.members.list.mockResolvedValue([
      { id: "mem_1", role_id: "role_old" },
    ]);
    service.assignRbacUsers.mockResolvedValue(undefined);

    const result = await invokeAssignRole(
      { roleId: "role_new", userId: "user_1" },
      buildContainer(service),
    );

    expect(result.compensation).toEqual({
      userId: "user_1",
      previousMemberId: "mem_1",
      previousRoleId: "role_old",
    });
  });
});

describe("compensateAssignRole", () => {
  afterEach(() => jest.clearAllMocks());

  it("restores the original role when the user had a previous assignment", async () => {
    const service = makeService();
    service.members.update.mockResolvedValue([]);

    await compensateAssignRole(
      {
        userId: "user_1",
        previousMemberId: "mem_1",
        previousRoleId: "role_old",
      },
      buildContainer(service),
    );

    expect(service.members.update).toHaveBeenCalledWith([
      { id: "mem_1", role_id: "role_old" },
    ]);
    expect(service.members.delete).not.toHaveBeenCalled();
  });

  it("deletes the created member when the user had no prior role", async () => {
    const service = makeService();
    service.members.list.mockResolvedValue([{ id: "mem_created" }]);
    service.members.delete.mockResolvedValue(undefined);

    await compensateAssignRole(
      { userId: "user_1", previousMemberId: null, previousRoleId: null },
      buildContainer(service),
    );

    expect(service.members.list).toHaveBeenCalledWith({ user_id: "user_1" });
    expect(service.members.delete).toHaveBeenCalledWith({
      id: "mem_created",
    });
    expect(service.members.update).not.toHaveBeenCalled();
  });

  it("does nothing when the created member is already gone", async () => {
    const service = makeService();
    service.members.list.mockResolvedValue([]);

    await compensateAssignRole(
      { userId: "user_1", previousMemberId: null, previousRoleId: null },
      buildContainer(service),
    );

    expect(service.members.delete).not.toHaveBeenCalled();
    expect(service.members.update).not.toHaveBeenCalled();
  });

  it("is a no-op when compensation data is undefined", async () => {
    const service = makeService();

    await compensateAssignRole(undefined, buildContainer(service));

    expect(service.members.update).not.toHaveBeenCalled();
    expect(service.members.delete).not.toHaveBeenCalled();
    expect(service.members.list).not.toHaveBeenCalled();
  });
});
