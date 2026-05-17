import type { ArtifactKind, ArtifactRecord } from "@taoai/skill-core";
import type {
  PublishRequest,
  RegistryClientOptions,
  SearchQuery,
  SearchResult,
} from "./types.js";

export class RegistryClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: RegistryClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { ...extra };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  private url(p: string): string {
    return `${this.baseUrl}${p.startsWith("/") ? p : "/" + p}`;
  }

  async ping(): Promise<{ ok: boolean }> {
    const res = await this.fetchImpl(this.url("/healthz"));
    return { ok: res.ok };
  }

  async search(query: SearchQuery = {}): Promise<SearchResult> {
    const params = new URLSearchParams();
    if (query.kind) params.set("kind", query.kind);
    if (query.text) params.set("q", query.text);
    if (query.username) params.set("username", query.username);
    if (query.limit != null) params.set("limit", String(query.limit));
    if (query.offset != null) params.set("offset", String(query.offset));
    const res = await this.fetchImpl(this.url(`/api/artifacts?${params}`), {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`search failed: ${res.status} ${res.statusText}`);
    return (await res.json()) as SearchResult;
  }

  async getMetadata(id: string): Promise<ArtifactRecord> {
    const res = await this.fetchImpl(this.url(`/api/artifacts/${encodeURIComponent(id)}`), {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(`metadata failed: ${res.status}`);
    return (await res.json()) as ArtifactRecord;
  }

  async download(id: string): Promise<Buffer> {
    const res = await this.fetchImpl(
      this.url(`/api/artifacts/${encodeURIComponent(id)}/download`),
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  async publish(req: PublishRequest): Promise<ArtifactRecord> {
    const form = new FormData();
    form.append("manifest", JSON.stringify(req.manifest));
    form.append(
      "payload",
      new Blob([req.payload], { type: "application/octet-stream" }),
      `${req.manifest.name}-${req.manifest.version}.tgz`
    );
    const res = await this.fetchImpl(this.url(`/api/artifacts`), {
      method: "POST",
      headers: this.headers(),
      body: form,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`publish failed: ${res.status} ${text}`);
    }
    return (await res.json()) as ArtifactRecord;
  }

  async listVersions(kind: ArtifactKind, name: string): Promise<ArtifactRecord[]> {
    const res = await this.fetchImpl(
      this.url(`/api/artifacts/${kind}/${encodeURIComponent(name)}/versions`),
      { headers: this.headers() }
    );
    if (!res.ok) throw new Error(`list versions failed: ${res.status}`);
    return (await res.json()) as ArtifactRecord[];
  }
}
