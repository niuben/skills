import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { ChangeEvent, DragEvent as ReactDragEvent, FormEvent } from "react";
import { publishArtifact } from "../api";
import type { ArtifactKind } from "../types";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ArtifactKind>("skills");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState(buildDefaultVersion);
  const [tagsInput, setTagsInput] = useState("");
  const [textPayload, setTextPayload] = useState("");
  const [files, setFiles] = useState<PublishFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);
  const dragDepthRef = useRef(0);

  const tags = useMemo(
    () => tagsInput.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tagsInput],
  );

  const totalFiles = files.length;

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        return;
      }

      const clipboardData = event.clipboardData;
      if (!clipboardData) return;

      // Collect files from clipboard (some browsers expose them via items)
      const fromFiles = Array.from(clipboardData.files || []);
      const fromItems = Array.from(clipboardData.items || [])
        .filter((item) => item.kind === "file" || (item.type && item.getAsFile))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));

      const mergedFiles = [...fromFiles];
      for (const file of fromItems) {
        const duplicated = mergedFiles.some(
          (existing) => existing.name === file.name && existing.size === file.size && existing.type === file.type,
        );
        if (!duplicated) mergedFiles.push(file);
      }

      if (mergedFiles.length) {
        event.preventDefault();
        appendFiles(createEntriesFromFiles(mergedFiles, "clipboard"));
        setStatus(t("publish.status.clipboard_imported"));
        return;
      }

      // Fallback: if clipboard has textual content, allow quick-paste as a text file
      const text = clipboardData.getData("text");
      if (text && text.trim()) {
        event.preventDefault();
        appendFiles([
          {
            id: `clipboard-text-${Date.now()}`,
            name: slugifyName(name || "clipboard"),
            sizeLabel: formatBytes(new Blob([text]).size),
            source: "clipboard",
            kind: "text",
            preview: text.slice(0, 120),
            file: undefined,
          },
        ]);
        setStatus(t("publish.status.clipboard_imported"));
        return;
      }

      setStatus(t("publish.status.clipboard_empty"));
    }

    // Prevent browser from opening dropped files outside the dropzone.
    function blockWindowFileDrop(event: DragEvent) {
      const types = Array.from(event.dataTransfer?.types || []);
      if (!types.includes("Files")) return;
      event.preventDefault();
    }

    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", blockWindowFileDrop);
    window.addEventListener("drop", blockWindowFileDrop);

    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", blockWindowFileDrop);
      window.removeEventListener("drop", blockWindowFileDrop);
    };
  }, [t]);

  function appendFiles(nextFiles: PublishFile[]) {
    setFiles((current) => {
      const existing = new Set(current.map((item) => `${item.name}-${item.sizeLabel}-${item.source}`));
      const deduped = nextFiles.filter((item) => !existing.has(`${item.name}-${item.sizeLabel}-${item.source}`));
      return [...current, ...deduped];
    });
  }

  function createEntriesFromFiles(fileList: File[], source: PublishFile["source"]): PublishFile[] {
    return fileList.map((file) => ({
      id: `${file.name}-${file.lastModified}-${source}`,
      file,
      name: file.name,
      sizeLabel: formatBytes(file.size),
      source,
      kind: "file",
      preview: file.type === "application/zip" || file.name.endsWith(".zip") ? "ZIP" : undefined,
    }));
  }

  function createEntriesFromFileList(fileList: FileList, source: PublishFile["source"]): PublishFile[] {
    return createEntriesFromFiles(Array.from(fileList), source);
  }

  function onInputFiles(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.files?.length) return;
    appendFiles(createEntriesFromFileList(event.target.files, "upload"));
    event.target.value = "";
    setStatus(t('publish.status.added_local'));
  }

  function onDrop(event: ReactDragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    const filesList = event.dataTransfer?.files;
    if (!filesList || !filesList.length) {
      setStatus(t('publish.status.clipboard_empty'));
      return;
    }
    appendFiles(createEntriesFromFileList(filesList, "drop"));
    setStatus(t('publish.status.dropped'));
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

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nameValid = name.trim() !== "";
    const descValid = description.trim() !== "";
    const hasFiles = files.length > 0;
    const hasText = textPayload.trim() !== "";
    const hasPayload = hasFiles || hasText;

    if (!nameValid) {
      setStatus(t('publish.error.name_required'));
      return;
    }
    if (!descValid) {
      setStatus(t('publish.error.desc_required'));
      return;
    }
    if (!hasPayload) {
      setStatus(t('publish.error.payload_required'));
      return;
    }

    const preferredFile = files.find((f) => f.name.endsWith(".zip") || f.name.endsWith(".tgz")) ?? files[0];
    const payload = preferredFile?.file ?? new Blob([textPayload], { type: "text/plain" });
    const payloadName = preferredFile?.name ?? `${slugifyName(name)}.txt`;

    try {
      setIsSubmitting(true);
      setStatus(t('publish.status.submitting'));
      const username = (typeof window !== 'undefined' ? localStorage.getItem('username') : null)?.trim();
      if (!username) {
        setStatus(t('publish.error.login_required', '请先登录后再发布'));
        return;
      }
      const record = await publishArtifact({
        manifest: {
          kind,
          name: name.trim(),
          version: version.trim(),
          description: description.trim(),
          tags,
          readme: textPayload.trim() || undefined,
          author_name: username,
        },
        payload,
        payloadName,
      });

      setStatus(t('publish.status.success', { id: record.id }));
      setShowSuccessModal(true);
    } catch (err) {
      setStatus(t('publish.status.failed', { message: (err as Error).message }));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="publish-shell">
      {/* ...existing code... */}
      <section className="publish-hero">
        <div className="container">
              <span className="hero-eyebrow">{t('publish.eyebrow')}</span>
              <h1 className="publish-title">{t('publish.title')}</h1>
              <p className="publish-subtitle">{t('publish.subtitle')}</p>
        </div>
      </section>

      <section className="section publish-section">
        <div className="container publish-form-wrapper">
          <form className="publish-form-card" onSubmit={submit}>
            {/* ...existing code... */}
            <div className="publish-form-grid">
              {/* ...existing code... */}
              <label className="field field-span-2">
                <span className="field-label">{t('publish.field.name')} <span className="field-required">*</span></span>
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('publish.placeholder.name', 'e.g. team/email-summarizer')} />
              </label>
              {/* ...existing code... */}
              <label className="field">
                <span className="field-label">{t('publish.field.kind')}</span>
                <select value={kind} onChange={(event) => setKind(event.target.value as ArtifactKind)}>
                  {KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`publish.kind.${option.value}`, option.label)}
                    </option>
                  ))}
                </select>
              </label>
              {/* ...existing code... */}
              <label className="field">
                <span className="field-label">{t('publish.field.version')}</span>
                <input value={version} onChange={(event) => setVersion(event.target.value)} />
              </label>
              {/* ...existing code... */}
              <label className="field field-span-2">
                <span className="field-label">{t('publish.field.description')} <span className="field-required">*</span></span>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={t('publish.placeholder.description')}
                />
              </label>
              {/* ...existing code... */}
              <label className="field field-span-2">
                <span className="field-label">{t('publish.field.tags')}</span>
                <input
                  value={tagsInput}
                  onChange={(event) => setTagsInput(event.target.value)}
                  placeholder={t('publish.placeholder.tags')}
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
            {/* ...existing code... */}
            <div className="upload-block">
              {/* ...existing code... */}
              <div className="upload-head">
                <div>
                  <h2>{t('publish.upload_title')} <span className="field-required">*</span></h2>
                  <p>{t('publish.upload_instructions')}</p>
                </div>
              </div>
              {/* ...existing code... */}
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
              {/* ...existing code... */}
              <input
                ref={fileInputRef}
                className="sr-only"
                type="file"
                multiple
                accept=".zip,.md,.txt,.json,.yaml,.yml,.tgz,.tar.gz"
                onChange={onInputFiles}
              />
              {/* ...existing code... */}
              <div
                ref={dropzoneRef}
                className={`dropzone${isDragging ? " is-dragging" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={(event: ReactDragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  if (!event.dataTransfer.types.includes("Files")) return;
                  dragDepthRef.current += 1;
                  setIsDragging(true);
                }}
                onDragOver={(event: ReactDragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
                  if (!isDragging && event.dataTransfer?.types.includes("Files")) {
                    setIsDragging(true);
                  }
                }}
                onDragLeave={(event: ReactDragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
                  if (dragDepthRef.current === 0) {
                    setIsDragging(false);
                  }
                }}
                onDrop={onDrop}
              >
                <div className="dropzone-icon">⇪</div>
                <div className="dropzone-title">{t('publish.drop_title')}</div>
                <div className="dropzone-subtitle">{t('publish.drop_subtitle')}</div>
              </div>
              {/* ...existing code... */}
              <div className="text-upload-panel">
                <div className="text-upload-head">
                  <h3>{t('publish.text_title')}</h3>
                  <button className="btn btn-primary" type="button" onClick={addTextPayload}>
                    {t('publish.text_add')}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={textPayload}
                  onChange={(event) => setTextPayload(event.target.value)}
                  placeholder={t('publish.placeholder.text')}
                />
              </div>
            </div>
            {/* ...existing code... */}
            <div className="publish-footer-row">
              <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('publish.status.submitting') : t('publish.action.submit')}
              </button>
              <button className="btn" type="button" onClick={() => setVersion(buildDefaultVersion())}>
                {t('publish.action.reset_version')}
              </button>
            </div>
            {/* ...existing code... */}
            {status ? <div className="publish-status">{status}</div> : null}
          </form>
        </div>
      </section>
      {/* 情感化发布成功弹窗 */}
      {showSuccessModal && (
        <div className="modal-backdrop" style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.35)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="modal-content" style={{background:'#fff',borderRadius:16,padding:40,minWidth:320,maxWidth:400,boxShadow:'0 8px 32px rgba(0,0,0,0.18)',textAlign:'center',animation:'pop-in 0.3s'}}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{marginBottom:8}}>{t('publish.modal.success_title')}</h2>
            <p style={{color:'#666',marginBottom:24}}>{t('publish.modal.success_body')}</p>
            <button
              className="btn btn-primary"
              style={{padding:'10px 32px',fontSize:18,borderRadius:8}}
              onClick={() => navigate("/me")}
            >
              {t('publish.modal.go_to_profile')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}