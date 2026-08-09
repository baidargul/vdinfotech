import "server-only";

import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { fileTypeFromBuffer } from "file-type";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_DOWNLOAD_SIZE = 20 * 1024 * 1024;

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

const downloadTypes = {
  pdf: {
    mimeType: "application/pdf",
    detected: ["application/pdf"],
    declared: ["application/pdf"],
  },
  docx: {
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    detected: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    declared: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  xlsx: {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    detected: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    declared: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  },
  pptx: {
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    detected: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    declared: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  },
  zip: {
    mimeType: "application/zip",
    detected: ["application/zip"],
    declared: ["application/zip", "application/x-zip-compressed"],
  },
  txt: {
    mimeType: "text/plain",
    detected: [],
    declared: ["text/plain"],
  },
  csv: {
    mimeType: "text/csv",
    detected: [],
    declared: ["text/csv", "application/csv", "application/vnd.ms-excel", "text/plain"],
  },
} as const;

type DownloadExtension = keyof typeof downloadTypes;

function uploadDirectory() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.BLOG_UPLOAD_DIR || path.join(process.cwd(), "storage", "blog"));
}

function resolveStoredFile(storedName: string) {
  if (!/^[a-f0-9-]+\.(jpg|png|webp|gif|pdf|docx|xlsx|pptx|txt|csv|zip)$/.test(storedName)) {
    throw new Error("Invalid stored media name.");
  }

  const directory = uploadDirectory();
  const target = path.resolve(directory, storedName);
  if (path.dirname(target) !== directory) throw new Error("Invalid media path.");
  return target;
}

function originalExtension(filename: string) {
  return path.extname(filename).slice(1).toLowerCase();
}

function isSafeText(buffer: Buffer) {
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

export async function storeImage(file: File) {
  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be between 1 byte and 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const extension = detected ? allowedTypes.get(detected.mime) : undefined;
  if (!detected || !extension || file.type !== detected.mime) {
    throw new Error("Only valid JPEG, PNG, WebP, or GIF images are allowed.");
  }

  const storedName = `${randomUUID()}.${extension}`;
  await mkdir(uploadDirectory(), { recursive: true });
  await writeFile(resolveStoredFile(storedName), buffer, { flag: "wx" });

  return { storedName, mimeType: detected.mime, size: buffer.byteLength };
}

export async function storeDownload(file: File) {
  if (file.size === 0 || file.size > MAX_DOWNLOAD_SIZE) {
    throw new Error("File must be between 1 byte and 20 MB.");
  }

  const extension = originalExtension(file.name) as DownloadExtension;
  const rules = downloadTypes[extension];
  if (!rules || !(rules.declared as readonly string[]).includes(file.type)) {
    throw new Error("Only PDF, DOCX, XLSX, PPTX, TXT, CSV, or ZIP files are allowed.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const isText = extension === "txt" || extension === "csv";
  const validContent = isText
    ? !detected && isSafeText(buffer)
    : Boolean(detected && (rules.detected as readonly string[]).includes(detected.mime));
  if (!validContent) {
    throw new Error("The file contents do not match its extension.");
  }

  const storedName = `${randomUUID()}.${extension}`;
  await mkdir(uploadDirectory(), { recursive: true });
  await writeFile(resolveStoredFile(storedName), buffer, { flag: "wx" });

  return { storedName, mimeType: rules.mimeType, size: buffer.byteLength };
}

export async function loadImage(storedName: string) {
  return readFile(/*turbopackIgnore: true*/ resolveStoredFile(storedName));
}

export async function loadStoredFile(storedName: string) {
  return readFile(/*turbopackIgnore: true*/ resolveStoredFile(storedName));
}

export async function removeImage(storedName: string) {
  try {
    await unlink(resolveStoredFile(storedName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
