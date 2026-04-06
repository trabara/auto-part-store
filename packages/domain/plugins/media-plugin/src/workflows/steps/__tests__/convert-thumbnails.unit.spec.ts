/**
 * Unit tests for convertEntityThumbnailsStep invoke and compensation logic.
 *
 * We test the exported handler functions directly (invokeConvertEntityThumbnails /
 * compensateConvertEntityThumbnails) so no Medusa workflow runtime is needed.
 */

import {
  invokeConvertEntityThumbnails,
  compensateConvertEntityThumbnails,
} from "../convert-thumbnails";
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

describe("invokeConvertEntityThumbnails", () => {
  afterEach(() => jest.clearAllMocks());

  it("converts existing thumbnails to 'image' and returns them with compensation IDs", async () => {
    const service = makeService();
    const existingThumbnails = [
      { id: "media_1", entity_id: "prod_1", type: "thumbnail" as const },
      { id: "media_2", entity_id: "prod_2", type: "thumbnail" as const },
    ];
    service.listMedias.mockResolvedValue(existingThumbnails);
    service.updateMedias.mockResolvedValue([]);

    const result = await invokeConvertEntityThumbnails(
      { entity_ids: ["prod_1", "prod_2"] },
      buildContainer(service),
    );

    expect(service.listMedias).toHaveBeenCalledWith({
      type: "thumbnail",
      entity_id: ["prod_1", "prod_2"],
    });
    expect(service.updateMedias).toHaveBeenCalledWith([
      { id: "media_1", type: "image" },
      { id: "media_2", type: "image" },
    ]);
    expect(result.output).toEqual(existingThumbnails);
    expect(result.compensation).toEqual(["media_1", "media_2"]);
  });

  it("returns empty arrays and skips update when no thumbnails exist", async () => {
    const service = makeService();
    service.listMedias.mockResolvedValue([]);

    const result = await invokeConvertEntityThumbnails(
      { entity_ids: ["prod_1"] },
      buildContainer(service),
    );

    expect(service.updateMedias).not.toHaveBeenCalled();
    expect(result.output).toEqual([]);
    expect(result.compensation).toEqual([]);
  });
});

describe("compensateConvertEntityThumbnails", () => {
  afterEach(() => jest.clearAllMocks());

  it("reverts all converted media IDs back to 'thumbnail'", async () => {
    const service = makeService();
    service.updateMedias.mockResolvedValue([]);

    await compensateConvertEntityThumbnails(
      ["media_1", "media_2"],
      buildContainer(service),
    );

    expect(service.updateMedias).toHaveBeenCalledWith([
      { id: "media_1", type: "thumbnail" },
      { id: "media_2", type: "thumbnail" },
    ]);
  });

  it("is a no-op when compensation data is undefined", async () => {
    const service = makeService();

    await compensateConvertEntityThumbnails(undefined, buildContainer(service));

    expect(service.updateMedias).not.toHaveBeenCalled();
  });

  it("is a no-op when compensation data is an empty array", async () => {
    const service = makeService();

    await compensateConvertEntityThumbnails([], buildContainer(service));

    expect(service.updateMedias).not.toHaveBeenCalled();
  });
});
