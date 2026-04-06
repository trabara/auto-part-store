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
    listMedias: jest.fn(),
    updateMedias: jest.fn(),
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
    service.listMedias.mockResolvedValue(prevData);
    service.updateMedias.mockResolvedValue(updated);

    const result = await invokeUpdateMedias(
      { updates: [{ id: "media_1", type: "thumbnail" }] },
      buildContainer(service),
    );

    expect(service.listMedias).toHaveBeenCalledWith({ id: ["media_1"] });
    expect(service.updateMedias).toHaveBeenCalledWith([
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
    service.listMedias.mockResolvedValue(prevData);
    service.updateMedias.mockResolvedValue([]);

    await invokeUpdateMedias(
      {
        updates: [
          { id: "media_1", type: "thumbnail" },
          { id: "media_2", type: "image" },
        ],
      },
      buildContainer(service),
    );

    expect(service.listMedias).toHaveBeenCalledWith({
      id: ["media_1", "media_2"],
    });
    expect(service.updateMedias).toHaveBeenCalledWith([
      { id: "media_1", type: "thumbnail" },
      { id: "media_2", type: "image" },
    ]);
  });

  it("works with an empty updates array", async () => {
    const service = makeService();
    service.listMedias.mockResolvedValue([]);
    service.updateMedias.mockResolvedValue([]);

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
    service.updateMedias.mockResolvedValue([]);

    await compensateUpdateMedias(
      [
        { id: "media_1", type: "image" },
        { id: "media_2", type: "thumbnail" },
      ],
      buildContainer(service),
    );

    expect(service.updateMedias).toHaveBeenCalledWith([
      { id: "media_1", type: "image" },
      { id: "media_2", type: "thumbnail" },
    ]);
  });

  it("is a no-op when compensation data is undefined", async () => {
    const service = makeService();

    await compensateUpdateMedias(undefined, buildContainer(service));

    expect(service.updateMedias).not.toHaveBeenCalled();
  });

  it("is a no-op when compensation data is an empty array", async () => {
    const service = makeService();

    await compensateUpdateMedias([], buildContainer(service));

    expect(service.updateMedias).not.toHaveBeenCalled();
  });
});
