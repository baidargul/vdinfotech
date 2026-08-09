import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { removeImage, storeDownload } from "@/lib/media-storage";
import { Media } from "@/models/media";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().slice(0, 100) || "";
  const postId = url.searchParams.get("postId") || "";
  const postAccess = Types.ObjectId.isValid(postId)
    ? [{ post: null }, { post: postId }]
    : [{ post: null }];

  await connectToDatabase();
  const files = await Media.find({
    owner: user.id,
    kind: "download",
    $or: postAccess,
    ...(query ? { originalName: { $regex: escapeRegex(query), $options: "i" } } : {}),
  }).sort({ createdAt: -1 }).limit(20).lean().exec();

  return NextResponse.json({ files: files.map((file) => ({
    id: file._id.toString(),
    name: file.originalName,
    url: `/download/${file._id.toString()}`,
    size: file.size,
    mimeType: file.mimeType,
  })) });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Select a file to upload." }, { status: 400 });

  let stored: Awaited<ReturnType<typeof storeDownload>> | null = null;
  try {
    stored = await storeDownload(file);
    await connectToDatabase();
    const media = await Media.create({
      owner: user.id,
      kind: "download",
      storedName: stored.storedName,
      originalName: file.name.slice(0, 255) || "download",
      mimeType: stored.mimeType,
      size: stored.size,
    });
    return NextResponse.json({
      id: media._id.toString(), name: media.originalName,
      url: `/download/${media._id.toString()}`, size: media.size,
      mimeType: media.mimeType,
    });
  } catch (error) {
    if (stored) await removeImage(stored.storedName).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : "File upload failed." }, { status: 400 });
  }
}
