import { MedusaContainer } from "@medusajs/framework/types";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import jwt from "jsonwebtoken";
import {
  createTestMedia,
  createTestMediaBatch,
} from "../fixtures/media-seeders";

jest.setTimeout(30000);

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("/admin/medias/:entity_id/images", () => {
      const headers: Record<string, string> = {};
      let container: MedusaContainer;
      const entityId = "prod_test_01";
      let userCounter = 0;

      beforeEach(async () => {
        container = getContainer();
        const authModuleService = container.resolve("auth");
        const userModuleService = container.resolve("user");

        const email = `media-test-${++userCounter}@test.com`;

        const user = await userModuleService.createUsers({
          email,
        });

        const authIdentity = await authModuleService.createAuthIdentities({
          provider_identities: [
            {
              provider: "emailpass",
              entity_id: email,
              provider_metadata: {
                password: process.env.JWT_SECRET || "test",
              },
            },
          ],
          app_metadata: {
            user_id: user.id,
          },
        });

        const token = jwt.sign(
          {
            actor_id: user.id,
            actor_type: "user",
            auth_identity_id: authIdentity.id,
          },
          process.env.JWT_SECRET || "test",
          { expiresIn: "1d" },
        );

        headers["Authorization"] = `Bearer ${token}`;
      });

      // -----------------------------------------------------------------------
      // Auth guard
      // -----------------------------------------------------------------------

      it("should return 401 if no authorization header", async () => {
        await expect(
          api.get(`/admin/medias/${entityId}/images`),
        ).rejects.toMatchObject({ response: { status: 401 } });
      });

      // -----------------------------------------------------------------------
      // GET /admin/medias/:entity_id/images
      // -----------------------------------------------------------------------

      describe("GET /admin/medias/:entity_id/images", () => {
        it("should return an empty list when no media exists for the entity", async () => {
          const res = await api.get(`/admin/medias/${entityId}/images`, {
            headers,
          });

          expect(res.status).toBe(200);
          expect(res.data.medias).toEqual([]);
        });

        it("should return medias belonging to the specified entity", async () => {
          await createTestMediaBatch(container, entityId, 2);
          // Create a media for a different entity — should NOT appear
          await createTestMedia(container, "other_entity");

          const res = await api.get(`/admin/medias/${entityId}/images`, {
            headers,
          });

          expect(res.status).toBe(200);
          expect(res.data.medias).toHaveLength(2);
          res.data.medias.forEach((m: any) => {
            expect(m.entity_id).toBe(entityId);
          });
        });

        it("should return medias with all expected fields", async () => {
          await createTestMedia(container, entityId, {
            type: "image",
            url: "https://example.com/photo.jpg",
            file_id: "file_abc",
          });

          const res = await api.get(`/admin/medias/${entityId}/images`, {
            headers,
          });

          expect(res.status).toBe(200);
          const [media] = res.data.medias;
          expect(media).toMatchObject({
            entity_id: entityId,
            type: "image",
            url: "https://example.com/photo.jpg",
            file_id: "file_abc",
          });
          expect(media.id).toBeDefined();
        });
      });

      // -----------------------------------------------------------------------
      // POST /admin/medias/:entity_id/images  (createBatch)
      // -----------------------------------------------------------------------

      describe("POST /admin/medias/:entity_id/images", () => {
        it("should return 401 without auth", async () => {
          await expect(
            api.post(`/admin/medias/${entityId}/images`, {
              files: [
                { type: "image", url: "https://x.com/img.jpg", file_id: "f1" },
              ],
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it("should return 400 when files array is empty", async () => {
          await expect(
            api.post(
              `/admin/medias/${entityId}/images`,
              { files: [] },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 400 when required fields are missing", async () => {
          await expect(
            api.post(
              `/admin/medias/${entityId}/images`,
              // missing `type` on the image object
              { files: [{ url: "https://x.com/img.jpg", file_id: "f1" }] },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should create image media and return 200", async () => {
          const res = await api.post(
            `/admin/medias/${entityId}/images`,
            {
              files: [
                {
                  type: "image",
                  url: "https://example.com/img1.jpg",
                  file_id: "file_img1",
                },
                {
                  type: "image",
                  url: "https://example.com/img2.jpg",
                  file_id: "file_img2",
                },
              ],
            },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.medias).toHaveLength(2);
          res.data.medias.forEach((m: any) => {
            expect(m.entity_id).toBe(entityId);
            expect(m.type).toBe("image");
          });
        });

        it("should create a thumbnail and demote existing thumbnail to image", async () => {
          // Seed an existing thumbnail directly (bypasses workflow file deletion)
          const existing = await createTestMedia(container, entityId, {
            type: "thumbnail",
            url: "https://example.com/old-thumb.jpg",
            file_id: "file_old_thumb",
          });

          const res = await api.post(
            `/admin/medias/${entityId}/images`,
            {
              files: [
                {
                  type: "thumbnail",
                  url: "https://example.com/new-thumb.jpg",
                  file_id: "file_new_thumb",
                },
              ],
            },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.medias).toHaveLength(1);
          expect(res.data.medias[0].type).toBe("thumbnail");

          // Old thumbnail must now be an "image"
          const listRes = await api.get(`/admin/medias/${entityId}/images`, {
            headers,
          });
          const oldMedia = listRes.data.medias.find(
            (m: any) => m.id === existing.id,
          );
          expect(oldMedia?.type).toBe("image");
        });
      });

      // -----------------------------------------------------------------------
      // POST /admin/medias/:entity_id/images/batch  (updateBatch)
      // -----------------------------------------------------------------------

      describe("POST /admin/medias/:entity_id/images/batch", () => {
        it("should return 401 without auth", async () => {
          await expect(
            api.post(`/admin/medias/${entityId}/images/batch`, {
              updates: [{ id: "media_x", type: "image" }],
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it("should return 400 when updates array is empty", async () => {
          await expect(
            api.post(
              `/admin/medias/${entityId}/images/batch`,
              { updates: [] },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should return 400 when type is invalid", async () => {
          await expect(
            api.post(
              `/admin/medias/${entityId}/images/batch`,
              { updates: [{ id: "media_x", type: "video" }] },
              { headers },
            ),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should update media type and return 200", async () => {
          const media = await createTestMedia(container, entityId, {
            type: "image",
          });

          const res = await api.post(
            `/admin/medias/${entityId}/images/batch`,
            { updates: [{ id: media.id, type: "thumbnail" }] },
            { headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.medias).toHaveLength(1);
          expect(res.data.medias[0].id).toBe(media.id);
          expect(res.data.medias[0].type).toBe("thumbnail");
        });

        it("should promote to thumbnail and demote previous thumbnail", async () => {
          const thumbnail = await createTestMedia(container, entityId, {
            type: "thumbnail",
          });
          const image = await createTestMedia(container, entityId, {
            type: "image",
          });

          const res = await api.post(
            `/admin/medias/${entityId}/images/batch`,
            { updates: [{ id: image.id, type: "thumbnail" }] },
            { headers },
          );

          expect(res.status).toBe(200);

          // Old thumbnail must now be an "image"
          const listRes = await api.get(`/admin/medias/${entityId}/images`, {
            headers,
          });
          const oldThumb = listRes.data.medias.find(
            (m: any) => m.id === thumbnail.id,
          );
          expect(oldThumb?.type).toBe("image");
        });
      });

      // -----------------------------------------------------------------------
      // DELETE /admin/medias/:entity_id/images/batch  (deleteBatch)
      // -----------------------------------------------------------------------

      describe("DELETE /admin/medias/:entity_id/images/batch", () => {
        it("should return 401 without auth", async () => {
          await expect(
            api.delete(`/admin/medias/${entityId}/images/batch`, {
              data: { ids: ["media_x"] },
            }),
          ).rejects.toMatchObject({ response: { status: 401 } });
        });

        it("should return 400 when ids array is empty", async () => {
          await expect(
            api.delete(`/admin/medias/${entityId}/images/batch`, {
              data: { ids: [] },
              headers,
            }),
          ).rejects.toMatchObject({ response: { status: 400 } });
        });

        it("should delete media records and return the deleted IDs", async () => {
          const [m1, m2] = await createTestMediaBatch(container, entityId, 2);

          const res = await api.delete(
            `/admin/medias/${entityId}/images/batch`,
            { data: { ids: [m1.id, m2.id] }, headers },
          );

          expect(res.status).toBe(200);
          expect(res.data.deleted).toEqual(
            expect.arrayContaining([m1.id, m2.id]),
          );

          // Verify records are gone
          const listRes = await api.get(`/admin/medias/${entityId}/images`, {
            headers,
          });
          const remainingIds = listRes.data.medias.map((m: any) => m.id);
          expect(remainingIds).not.toContain(m1.id);
          expect(remainingIds).not.toContain(m2.id);
        });

        it("should only delete specified records, leaving others intact", async () => {
          const [toDelete, toKeep] = await createTestMediaBatch(
            container,
            entityId,
            2,
          );

          await api.delete(`/admin/medias/${entityId}/images/batch`, {
            data: { ids: [toDelete.id] },
            headers,
          });

          const listRes = await api.get(`/admin/medias/${entityId}/images`, {
            headers,
          });
          const ids = listRes.data.medias.map((m: any) => m.id);
          expect(ids).not.toContain(toDelete.id);
          expect(ids).toContain(toKeep.id);
        });
      });
    });
  },
});
