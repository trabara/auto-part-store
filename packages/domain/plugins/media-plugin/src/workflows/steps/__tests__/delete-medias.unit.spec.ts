/**
 * Unit tests for deleteMediasStep invoke and compensation logic.
 *
 * We test the exported handler functions directly (invokeDeleteMedias /
 * compensateDeleteMedias) so no Medusa workflow runtime is needed.
 */

import { invokeDeleteMedias, compensateDeleteMedias } from "../delete-medias";
import { ENTITY_MEDIA_MODULE } from "@repo/domain-modules/media";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeService() {
  return {
    list: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
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

const savedMedia = {
  id: "media_1",
  entity_id: "prod_1",
  type: "image" as const,
  url: "https://example.com/img.jpg",
  file_id: "file_1",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("invokeDeleteMedias", () => {
  afterEach(() => jest.clearAllMocks());

  it("fetches records, deletes them, and returns success with deleted IDs", async () => {
    const service = makeService();
    service.list.mockResolvedValue([savedMedia]);
    service.delete.mockResolvedValue(undefined);

    const result = await invokeDeleteMedias(
      { ids: ["media_1"] },
      buildContainer(service),
    );

    expect(service.list).toHaveBeenCalledWith({ id: ["media_1"] });
    expect(service.delete).toHaveBeenCalledWith(["media_1"]);
    expect(result.output).toEqual({ success: true, deleted: ["media_1"] });
    expect(result.compensation).toEqual([savedMedia]);
  });

  it("handles multiple IDs", async () => {
    const service = makeService();
    const medias = [
      savedMedia,
      { ...savedMedia, id: "media_2", file_id: "file_2" },
    ];
    service.list.mockResolvedValue(medias);
    service.delete.mockResolvedValue(undefined);

    const result = await invokeDeleteMedias(
      { ids: ["media_1", "media_2"] },
      buildContainer(service),
    );

    expect(result.output).toEqual({
      success: true,
      deleted: ["media_1", "media_2"],
    });
    expect(result.compensation).toHaveLength(2);
  });
});

describe("compensateDeleteMedias", () => {
  afterEach(() => jest.clearAllMocks());

  it("re-creates all deleted records with their original data", async () => {
    const service = makeService();
    service.create.mockResolvedValue([savedMedia]);

    await compensateDeleteMedias([savedMedia], buildContainer(service));

    expect(service.create).toHaveBeenCalledWith([
      {
        id: savedMedia.id,
        entity_id: savedMedia.entity_id,
        type: savedMedia.type,
        url: savedMedia.url,
        file_id: savedMedia.file_id,
      },
    ]);
  });

  it("is a no-op when compensation data is undefined", async () => {
    const service = makeService();

    await compensateDeleteMedias(undefined, buildContainer(service));

    expect(service.create).not.toHaveBeenCalled();
  });

  it("is a no-op when compensation data is an empty array", async () => {
    const service = makeService();

    await compensateDeleteMedias([], buildContainer(service));

    expect(service.create).not.toHaveBeenCalled();
  });
});
