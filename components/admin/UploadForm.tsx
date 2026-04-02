'use client';

import { useRef, useState } from 'react';
import SparkMD5 from 'spark-md5';
import type { PhotoCategory } from '@/lib/types';

interface UploadFormProps {
  onUploadComplete: () => void;
}

interface UploadItem {
  name: string;
  progress: number;
  done: boolean;
  error?: string;
  status?: string;
}

interface UploadBatch {
  id: number;
  items: UploadItem[];
  collapsed: boolean;
}

const MAX_UPLOAD_SIZE = 9.5 * 1024 * 1024;
const MAX_DIMENSION = 4096;

/** Compress an image using Canvas API to fit under MAX_UPLOAD_SIZE. */
async function compressImage(file: File): Promise<Blob> {
  if (file.size <= MAX_UPLOAD_SIZE) return file;
  const img = await loadImage(file);
  let { naturalWidth: w, naturalHeight: h } = img;
  if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);
  for (const q of [0.92, 0.85, 0.78, 0.70, 0.60]) {
    const blob = await canvasToBlob(canvas, 'image/jpeg', q);
    if (blob.size <= MAX_UPLOAD_SIZE) return blob;
  }
  canvas.width = Math.round(w * 0.5);
  canvas.height = Math.round(h * 0.5);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvasToBlob(canvas, 'image/jpeg', 0.85);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('无法解析此图片格式')); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), type, quality));
}

/** Compute MD5 hash of a file (matches Cloudinary etag). */
function computeMD5(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const spark = new SparkMD5.ArrayBuffer();
      spark.append(reader.result as ArrayBuffer);
      resolve(spark.end());
    };
    reader.onerror = () => reject(new Error('无法读取文件'));
    reader.readAsArrayBuffer(file);
  });
}

export default function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [categories, setCategories] = useState<PhotoCategory[]>(['personal']);
  const [isDragging, setIsDragging] = useState(false);
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const batchIdRef = useRef(0);

  function isImageFile(file: File): boolean {
    if (file.type.startsWith('image/')) return true;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return ['jpg', 'jpeg', 'jpe', 'jfif', 'png', 'webp', 'heic', 'heif', 'tiff', 'tif', 'bmp', 'gif', 'avif', 'raw', 'cr2', 'nef', 'arw', 'dng'].includes(ext);
  }

  function toggleCategory(cat: PhotoCategory) {
    setCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length <= 1) return prev; // must keep at least one
        return prev.filter((c) => c !== cat);
      }
      return [...prev, cat];
    });
  }

  function updateBatchItem(batchId: number, itemIdx: number, patch: Partial<UploadItem>) {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === batchId
          ? { ...b, items: b.items.map((item, i) => (i === itemIdx ? { ...item, ...patch } : item)) }
          : b,
      ),
    );
  }

  function toggleBatchCollapse(batchId: number) {
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, collapsed: !b.collapsed } : b)));
  }

  function xhrUpload(
    form: FormData,
    url: string,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(e.loaded, e.total);
        };
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          let errMsg = `上传失败 (${xhr.status})`;
          try {
            const body = JSON.parse(xhr.responseText);
            if (body?.error?.message) errMsg = body.error.message;
          } catch { /* ignore */ }
          reject(new Error(errMsg));
        }
      };
      xhr.onerror = () => reject(new Error('网络错误，请检查连接'));
      xhr.open('POST', url);
      xhr.send(form);
    });
  }

  async function uploadFiles(files: FileList | File[]) {
    const fileArr = Array.from(files).filter(isImageFile);
    if (fileArr.length === 0) { alert('没有可识别的图片文件'); return; }

    setBusy(true);

    // Collapse all previous batches
    setBatches((prev) => prev.map((b) => ({ ...b, collapsed: true })));

    // Create new batch
    const batchId = ++batchIdRef.current;
    const items: UploadItem[] = fileArr.map((f) => ({
      name: f.name,
      progress: 0,
      done: false,
      status: '准备中…',
    }));
    setBatches((prev) => [...prev, { id: batchId, items, collapsed: false }]);

    // ── Phase 1: Check ALL duplicates by content hash (MD5/etag) ──
    const isDuplicate: boolean[] = [];
    const fileHashes: string[] = [];
    for (let i = 0; i < fileArr.length; i++) {
      updateBatchItem(batchId, i, { status: '计算文件指纹…' });
      try {
        const md5 = await computeMD5(fileArr[i]);
        fileHashes.push(md5);
        updateBatchItem(batchId, i, { status: '检测重复…' });
        const res = await fetch(`/api/upload?etag=${encodeURIComponent(md5)}`);
        if (res.ok) {
          const { exists } = await res.json();
          if (exists) {
            updateBatchItem(batchId, i, { error: '相同内容已存在，跳过', status: undefined });
            isDuplicate.push(true);
            continue;
          }
        }
      } catch { fileHashes.push(''); /* treat as non-duplicate */ }
      isDuplicate.push(false);
    }

    // ── Phase 2: Upload non-duplicates ──
    for (let i = 0; i < fileArr.length; i++) {
      if (isDuplicate[i]) continue;
      const file = fileArr[i];

      try {
        // Compress if oversized
        let uploadBlob: Blob = file;
        if (file.size > MAX_UPLOAD_SIZE) {
          updateBatchItem(batchId, i, { status: '压缩中…' });
          uploadBlob = await compressImage(file);
        }

        // Get signed params
        updateBatchItem(batchId, i, { status: '获取凭证…' });
        const paramRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories, filename: file.name }),
        });
        if (!paramRes.ok) {
          updateBatchItem(batchId, i, { error: '获取上传凭证失败', status: undefined });
          continue;
        }
        const params = await paramRes.json();

        // Build form
        const form = new FormData();
        form.append('file', uploadBlob, file.name);
        form.append('api_key', params.apiKey);
        form.append('timestamp', String(params.timestamp));
        form.append('signature', params.signature);
        form.append('folder', params.folder);
        form.append('tags', params.tags);
        if (params.context) form.append('context', params.context);

        // Upload
        updateBatchItem(batchId, i, { status: '上传中…', progress: 0 });
        const uploadUrl = `https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`;
        await xhrUpload(form, uploadUrl, (loaded, total) => {
          updateBatchItem(batchId, i, { progress: Math.round((loaded / total) * 100) });
        });
        updateBatchItem(batchId, i, { progress: 100, done: true, status: undefined });
      } catch (err) {
        const message = err instanceof Error ? err.message : '上传失败';
        updateBatchItem(batchId, i, { error: message, status: undefined });
      }
    }

    setBusy(false);
    onUploadComplete();
  }

  return (
    <div className="space-y-4">
      {/* Category selector — checkboxes */}
      <div className="flex gap-4">
        {([['commercial', '工作样片'], ['personal', '样片']] as [PhotoCategory, string][]).map(([cat, label]) => (
          <label key={cat} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={categories.includes(cat)}
              onChange={() => toggleCategory(cat)}
              className="accent-gray-900"
            />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
        } ${isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'}`}
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!busy && e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.jpe,.jfif,.png,.webp,.heic,.heif,.tiff,.tif,.bmp,.gif,.avif,.raw,.cr2,.nef,.arw,.dng"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files && !busy) uploadFiles(e.target.files); e.target.value = ''; }}
        />
        <p className="text-sm text-gray-500">拖拽照片到此处，或点击选择文件</p>
        <p className="text-xs text-gray-400 mt-1">支持 JPEG、PNG、WebP、HEIC 等格式，自动检测重复内容，大图自动压缩</p>
      </div>

      {/* Upload batches */}
      {batches.length > 0 && (
        <div className="space-y-3">
          {batches.map((batch) => {
            const doneCount = batch.items.filter((i) => i.done).length;
            const errCount = batch.items.filter((i) => i.error).length;

            if (batch.collapsed) {
              return (
                <button
                  key={batch.id}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                  onClick={() => toggleBatchCollapse(batch.id)}
                >
                  <span>
                    导入记录：{batch.items.length}张
                    {doneCount > 0 && <span className="text-green-600 ml-1">{doneCount}成功</span>}
                    {errCount > 0 && <span className="text-red-500 ml-1">{errCount}跳过</span>}
                  </span>
                  <span className="text-gray-400">展开 ▾</span>
                </button>
              );
            }

            return (
              <div key={batch.id} className="space-y-2">
                {/* Collapse button for finished batches (not the currently running one) */}
                {!busy && batch.id === batches[batches.length - 1]?.id && batches.length > 1 && (
                  <button
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => toggleBatchCollapse(batch.id)}
                  >
                    收起 ▴
                  </button>
                )}
                {batch.items.map((u, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 flex-1 truncate">{u.name}</span>
                    {u.error ? (
                      <span className="text-xs text-red-500 shrink-0">{u.error}</span>
                    ) : u.done ? (
                      <span className="text-xs text-green-600 shrink-0">✓ 完成</span>
                    ) : u.status ? (
                      <span className="text-xs text-gray-400 shrink-0">{u.status}</span>
                    ) : (
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0">
                        <div className="h-full bg-gray-900 transition-all" style={{ width: `${u.progress}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
