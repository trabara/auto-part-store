/**
 * Unit tests for createMediasStep invoke and compensation logic.
 *
 * We test the exported handler functions directly (invokeCreateMedias /
 * compensateCreateMedias) so no Medusa workflow runtime is needed.
 */

import { invokeCreateMedias, compensateCreateMedias } from "../create-medias";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService() {
  return {
    createMedias: jest.fn(),
    deleteMedias: jest.fn(),
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

const baseMedia = {
  entity_id: "prod_1",
  url: "https://example.com/img.jpg",
  file_id: "file_1",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("invokeCreateMedias", () => {
  afterEach(() => jest.clearAllMocks());

  it("creates medias and returns them with compensation IDs", async () => {
    const service = makeService();
    const created = [{ id: "media_1", ...baseMedia, type: "image" as const }];
    service.createMedias.mockResolvedValue(created);

    const result = await invokeCreateMedias(
      { medias: [{ ...baseMedia, type: "image" }] },
      buildContainer(service),
    );

    expect(service.createMedias).toHaveBeenCalledWith([
      { ...baseMedia, type: "image" },
    ]);
    expect(result.output).toEqual(created);
    expect(result.compensation).toEqual(["media_1"]);
  });

  it("creates a single thumbnail per entity without error", async () => {
    const service = makeService();
    const created = [
      { id: "media_2", ...baseMedia, type: "thumbnail" as const },
    ];
    service.createMedias.mockResolvedValue(created);

    const result = await invokeCreateMedias(
      { medias: [{ ...baseMedia, type: "thumbnail" }] },
      buildContainer(service),
    );

    expect(result.output).toEqual(created);
  });

  it("throws MedusaError when more than one thumbnail for the same entity", async () => {
    const service = makeService();

    await expect(
      invokeCreateMedias(
        {
          medias: [
            { ...baseMedia, type: "thumbnail" },
            { ...baseMedia, type: "thumbnail" },
          ],
        },
        buildContainer(service),
      ),
    ).rejects.toThrow("Only one thumbnail is allowed per entity");

    expect(service.createMedias).not.toHaveBeenCalled();
  });

  it("allows multiple thumbnails as long as they belong to different entities", async () => {
    const service = makeService();
    const created = [
      {
        id: "media_3",
        entity_id: "prod_1",
        type: "thumbnail" as const,
        url: "a",
        file_id: "f1",
      },
      {
        id: "media_4",
        entity_id: "prod_2",
        type: "thumbnail" as const,
        url: "b",
        file_id: "f2",
      },
    ];
    service.createMedias.mockResolvedValue(created);

    const result = await invokeCreateMedias(
      {
        medias: [
          { entity_id: "prod_1", type: "thumbnail", url: "a", file_id: "f1" },
          { entity_id: "prod_2", type: "thumbnail", url: "b", file_id: "f2" },
        ],
      },
      buildContainer(service),
    );

    expect(result.output).toEqual(created);
    expect(result.compensation).toEqual(["media_3", "media_4"]);
  });
});

describe("compensateCreateMedias", () => {
  afterEach(() => jest.clearAllMocks());

  it("deletes all created media IDs", async () => {
    const service = makeService();
    service.deleteMedias.mockResolvedValue(undefined);

    await compensateCreateMedias(
      ["media_1", "media_2"],
      buildContainer(service),
    );

    expect(service.deleteMedias).toHaveBeenCalledWith(["media_1", "media_2"]);
  });

  it("is a no-op when compensation data is undefined", async () => {
    const service = makeService();

    await compensateCreateMedias(undefined, buildContainer(service));

    expect(service.deleteMedias).not.toHaveBeenCalled();
  });

  it("is a no-op when compensation data is an empty array", async () => {
    const service = makeService();

    await compensateCreateMedias([], buildContainer(service));

    expect(service.deleteMedias).not.toHaveBeenCalled();
  });
});
