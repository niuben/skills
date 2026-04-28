import type { FastifyInstance } from "fastify";
import type { ArtifactKind, ArtifactManifest } from "@skillos/core";
import { validateManifest } from "@skillos/core";
import type { PublishService, SearchService } from "@skillos/services";
import type { FileStorage } from "@skillos/storage";
import type { ArtifactRepository } from "@skillos/storage";

export interface ArtifactRouteDeps {
  publishService: PublishService;
  searchService: SearchService;
  storage: FileStorage;
  repository: ArtifactRepository;
}

export function registerArtifactRoutes(app: FastifyInstance, deps: ArtifactRouteDeps): void {
  // List / search
  app.get<{
    Querystring: { kind?: ArtifactKind; q?: string; limit?: string; offset?: string };
  }>("/api/artifacts", async (req) => {
    const { kind, q, limit, offset } = req.query;
    const items = deps.searchService.list({
      kind,
      text: q,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    return { total: items.length, items };
  });

  // Versions list
  app.get<{ Params: { kind: ArtifactKind; name: string } }>(
    "/api/artifacts/:kind/:name/versions",
    async (req, reply) => {
      const versions = deps.repository.findVersions(req.params.kind, req.params.name);
      if (versions.length === 0) return reply.code(404).send({ error: "not_found" });
      return versions;
    }
  );

  // Get one
  app.get<{ Params: { id: string } }>("/api/artifacts/:id", async (req, reply) => {
    const record = deps.repository.findById(req.params.id);
    if (!record) return reply.code(404).send({ error: "not_found" });
    return record;
  });

  // Download payload
  app.get<{ Params: { id: string } }>("/api/artifacts/:id/download", async (req, reply) => {
    const record = deps.repository.findById(req.params.id);
    if (!record) return reply.code(404).send({ error: "not_found" });
    if (!(await deps.storage.has(record.storagePath))) {
      return reply.code(404).send({ error: "blob_missing" });
    }
    const buf = await deps.storage.get(record.storagePath);
    reply.header("content-type", "application/octet-stream");
    reply.header("x-skillos-content-hash", record.contentHash);
    return reply.send(buf);
  });

  // Publish (multipart: manifest + payload)
  app.post("/api/artifacts", async (req, reply) => {
    let manifest: ArtifactManifest | null = null;
    let payload: Buffer | null = null;

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type === "field" && part.fieldname === "manifest") {
        try {
          manifest = validateManifest(JSON.parse(String(part.value))) as ArtifactManifest;
        } catch (err) {
          return reply.code(400).send({ error: "invalid_manifest", message: (err as Error).message });
        }
      } else if (part.type === "file" && part.fieldname === "payload") {
        payload = await part.toBuffer();
      }
    }

    if (!manifest || !payload) {
      return reply.code(400).send({ error: "missing_fields" });
    }

    const record = await deps.publishService.publish({ manifest, payload });
    return reply.code(201).send(record);
  });
}
