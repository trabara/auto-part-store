/**
 * Unit tests for updateMediasStep invoke and compensation logic.
 *
 * We test the exported handler functions directly (invokeUpdateMedias /
 * compensateUpdateMedias) so no Medusa workflow runtime is needed.
 */

import { invokeUpdateMedias, compensateUpdateMedias } from "../update-medias";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService() {
  return {
    list: jest.fn(),
    update: jest.fn(),
  };
}

function buildContainer(service: ReturnType<typeof makeService>) {
  return {
    resolve: (key: string) => {
      if (key === ENTITY_MEDIA_MODULE) return service;
      throw new Error(`Unknown module: ${key}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("invokeUpdateMedias", () => {
  afterEach(() => jest.clearAllMocks());

  it("snapshots previous data and applies updates", async () => {
    const service = makeService();
    const prevData = [{ id: "media_1", type: "image" as const }];
    const updated = [{ id: "media_1", type: "thumbnail" as const }];
    service.list.mockResolvedValue(prevData);
    service.update.mockResolvedValue(updated);

    const result = await invokeUpdateMedias(
      { updates: [{ id: "media_1", type: "thumbnail" }] },
      buildContainer(service),
    );

    expect(service.list).toHaveBeenCalledWith({ id: ["media_1"] });
    expect(service.update).toHaveBeenCalledWith([
      { id: "media_1", type: "thumbnail" },
    ]);
    expect(result.output).toEqual(updated);
    expect(result.compensation).toEqual(prevData);
  });

  it("handles multiple updates at once", async () => {
    const service = makeService();
    const prevData = [
      { id: "media_1", type: "image" as const },
      { id: "media_2", type: "thumbnail" as const },
    ];
    service.list.mockResolvedValue(prevData);
    service.update.mockResolvedValue([]);

    await invokeUpdateMedias(
      {
        updates: [
          { id: "media_1", type: "thumbnail" },
          { id: "media_2", type: "image" },
        ],
      },
      buildContainer(service),
    );

    expect(service.list).toHaveBeenCalledWith({
      id: ["media_1", "media_2"],
    });
    expect(service.update).toHaveBeenCalledWith([
      { id: "media_1", type: "thumbnail" },
      { id: "media_2", type: "image" },
    ]);
  });

  it("works with an empty updates array", async () => {
    const service = makeService();
    service.list.mockResolvedValue([]);
    service.update.mockResolvedValue([]);

    const result = await invokeUpdateMedias(
      { updates: [] },
      buildContainer(service),
    );

    expect(result.compensation).toEqual([]);
  });
});

describe("compensateUpdateMedias", () => {
  afterEach(() => jest.clearAllMocks());

  it("reverts all updated records to their previous types", async () => {
    const service = makeService();
    service.update.mockResolvedValue([]);

    await compensateUpdateMedias(
      [
        { id: "media_1", type: "image" },
        { id: "media_2", type: "thumbnail" },
      ],
      buildContainer(service),
    );

    expect(service.update).toHaveBeenCalledWith([
      { id: "media_1", type: "image" },
      { id: "media_2", type: "thumbnail" },
    ]);
  });

  it("is a no-op when compensation data is undefined", async () => {
    const service = makeService();

    await compensateUpdateMedias(undefined, buildContainer(service));

    expect(service.update).not.toHaveBeenCalled();
  });

  it("is a no-op when compensation data is an empty array", async () => {
    const service = makeService();

    await compensateUpdateMedias([], buildContainer(service));

    expect(service.update).not.toHaveBeenCalled();
  });
});
