import { useMemo, useRef, useState, useEffect } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import type { ArtifactKind } from "../types";

type PublishFile = {
  id: string;
  file?: File;
  name: string;
  sizeLabel: string;
  source: "upload" | "drop" | "clipboard" | "text";
  kind: "file" | "text";
  preview?: string;
};

const KIND_OPTIONS: { value: ArtifactKind; label: string }[] = [
  { value: "skills", label: "Skills" },
  { value: "prompt", label: "Prompt" },
  { value: "agent", label: "Agent" },
];

const SUGGEST_TAGS = ["internal", "team", "workflow", "automation", "review", "template"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function buildDefaultVersion(): string {
  const now = new Date();
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function slugifyName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return "snippet.txt";
  return `${normalized
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || "snippet"}.txt`;
}

export function PublishPage() {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ArtifactKind>("skills");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(buildDefaultVersion);
  const [tagsInput, setTagsInput] = useState("");
  const [textPayload, setTextPayload] = useState("");
  const [files, setFiles] = useState<PublishFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);

  const tags = useMemo(
    () => tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  );

  const totalFiles = files.length;

  useEffect(() => {
    // 监听全局 Ctrl+V 事件
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "v") {
        event.preventDefault();
        onPasteFromClipboard();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    // 让 dropzone 本身可点击
    const zone = dropzoneRef.current;
    if (!zone) return;
    zone.addEventListener("click", () => fileInputRef.current?.click());
    return () => zone.removeEventListener("click", () => fileInputRef.current?.click());
  }, []);

  function appendFiles(nextFiles: PublishFile[]) {
    setFiles((current) => {
      const existing = new Set(current.map((item) => `${item.name}-${item.sizeLabel}-${item.source}`));
      const deduped = nextFiles.filter((item) => !existing.has(`${item.name}-${item.sizeLabel}-${item.source}`));
      return [...current, ...deduped];
    });
  }

  function createEntriesFromFileList(fileList: FileList, source: PublishFile["source"]): PublishFile[] {
    return Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.lastModified}-${source}`,
      file,
      name: file.name,
      sizeLabel: formatBytes(file.size),
      source,
      kind: "file",
      preview: file.type === "application/zip" || file.name.endsWith(".zip") ? "ZIP 包" : undefined,
    }));
  }

  function onInputFiles(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    appendFiles(createEntriesFromFileList(event.target.files, "upload"));
    event.target.value = "";
    setStatus("已添加本地文件，可继续追加更多文件或 ZIP 包。");
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!event.dataTransfer.files?.length) return;
    appendFiles(createEntriesFromFileList(event.dataTransfer.files, "drop"));
    setStatus("已接收拖拽文件。");
  }

  async function onPasteFromClipboard() {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const pastedFiles: PublishFile[] = [];

      for (const item of clipboardItems) {
        for (const type of item.types) {
          const blob = await item.getType(type);
          const ext = type === "application/zip" ? "zip" : type.startsWith("text/") ? "txt" : "bin";
          pastedFiles.push({
            id: `${type}-${blob.size}-${Date.now()}`,
            file: new File([blob], `clipboard-${Date.now()}.${ext}`, { type: blob.type }),
            name: `clipboard-${Date.now()}.${ext}`,
            sizeLabel: formatBytes(blob.size),
            source: "clipboard",
            kind: "file",
            preview: type.startsWith("image/") ? "剪切板文件" : type,
          });
        }
      }

      if (pastedFiles.length === 0) {
        setStatus("剪切板中没有可导入的文件内容。");
        return;
      }

      appendFiles(pastedFiles);
      setStatus("已从剪切板导入内容。");
    } catch {
      setStatus("当前浏览器环境不允许直接读取剪切板，请使用拖拽或文本域粘贴。");
    }
  }

  function addTextPayload() {
    const trimmed = textPayload.trim();
    if (!trimmed) {
      setStatus("文本域为空，未添加内容。");
      return;
    }

    appendFiles([
      {
        id: `text-${Date.now()}`,
        name: slugifyName(name || "artifact-payload"),
        sizeLabel: formatBytes(new Blob([trimmed]).size),
        source: "text",
        kind: "text",
        preview: trimmed.slice(0, 120),
      },
    ]);
    setStatus("已将文本域内容加入待发布文件列表。");
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((item) => item.id !== id));
  }

  function fillTag(tag: string) {
    const current = new Set(tags);
    current.add(tag);
    setTagsInput(Array.from(current).join(", "));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nameValid = name.trim() !== "";
    const descValid = description.trim() !== "";
    const hasFiles = files.length > 0;
    const hasText = textPayload.trim() !== "";
    const hasPayload = hasFiles || hasText;

    if (!nameValid) {
      setStatus("❌ 名称不能为空");
      return;
    }
    if (!descValid) {
      setStatus("❌ 描述不能为空");
      return;
    }
    if (!hasPayload) {
      setStatus("❌ 请上传文件或粘贴文本内容");
      return;
    }

    setStatus(`✓ 已准备发布 ${name}，共 ${totalFiles} 个上传条目。当前页面为前端流程展示，尚未接入后端发布接口。`);
  }

  return (
    <div className="publish-shell">
      <section className="publish-hero">
        <div className="container">
          <span className="hero-eyebrow">发布制品</span>
          <h1 className="publish-title">将能力包发布至中心</h1>
          <p className="publish-subtitle">
            整理 Skills、Prompts 与 Agents 的元数据、版本和载荷文件，交付发布流水线。
          </p>
        </div>
      </section>

      <section className="section publish-section">
        <div className="container publish-form-wrapper">
          <form className="publish-form-card" onSubmit={submit}>
            <div className="publish-form-grid">
              <label className="field field-span-2">
                <span className="field-label">名称 <span className="field-required">*</span></span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：team/email-summarizer" />
              </label>

              <label className="field">
                <span className="field-label">类型</span>
                <select value={kind} onChange={(event) => setKind(event.target.value as ArtifactKind)}>
                  {KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">版本</span>
                <input value={version} onChange={(event) => setVersion(event.target.value)} />
              </label>

              <label className="field field-span-2">
                <span className="field-label">描述 <span className="field-required">*</span></span>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="概述能力用途、适用场景、依赖约束和建议使用方式。"
                />
              </label>

              <label className="field field-span-2">
                <span className="field-label">标签</span>
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder="以逗号分隔，例如：internal, review, automation"
                />
                <div className="publish-tag-suggestions">
                  {SUGGEST_TAGS.map((tag) => (
                    <button key={tag} className="hero-tag" type="button" onClick={() => fillTag(tag)}>
                      #{tag}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="upload-block">
              <div className="upload-head">
                <div>
                  <h2>上传或文本内容 <span className="field-required">*</span></h2>
                  <p>拖拽文件、点击选择或按 <kbd>Ctrl+V</kbd> 粘贴，支持多文件与 ZIP 包。</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="publish-file-preview-list">
                  <div className="publish-file-list-head">
                    <span className="aside-label">已上传文件</span>
                    <span className="list-count">{totalFiles} 个条目</span>
                  </div>
                  {files.map((item) => (
                    <div key={item.id} className="publish-file-item">
                      <div>
                        <div className="publish-file-name">{item.name}</div>
                        <div className="publish-file-meta">
                          <span>{item.sizeLabel}</span>
                          <span>{item.source}</span>
                          <span>{item.kind === "text" ? "文本" : "文件"}</span>
                        </div>
                        {item.preview ? <div className="publish-file-preview">{item.preview}</div> : null}
                      </div>
                      <button className="publish-file-remove" type="button" onClick={() => removeFile(item.id)}>
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                multiple
                accept=".zip,.md,.txt,.json,.yaml,.yml,.tgz,.tar.gz"
                onChange={onInputFiles}
              />

              <div
                ref={dropzoneRef}
                className={`dropzone${isDragging ? " is-dragging" : ""}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={onDrop}
              >
                <div className="dropzone-icon">⇪</div>
                <div className="dropzone-title">拖动文件到这里</div>
                <div className="dropzone-subtitle">或点击选择、按 Ctrl+V 粘贴</div>
              </div>

              <div className="text-upload-panel">
                <div className="text-upload-head">
                  <h3>文本内容</h3>
                  <button className="btn btn-primary" type="button" onClick={addTextPayload}>
                    添加为文件
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={textPayload}
                  onChange={(event) => setTextPayload(event.target.value)}
                  placeholder="粘贴 YAML、JSON、README 或其他纯文本内容。"
                />
              </div>
            </div>

            <div className="publish-footer-row">
              <button className="btn btn-primary" type="submit">
                提交发布
              </button>
              <button className="btn" type="button" onClick={() => setVersion(buildDefaultVersion())}>
                重置版本号
              </button>
            </div>

            {status ? <div className="publish-status">{status}</div> : null}
          </form>
        </div>
      </section>
    </div>
  );
}