import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { loadStoredFile } from "@/lib/media-storage";
import { publicPostFilter } from "@/lib/blog";
import { Media } from "@/models/media";
import { Post } from "@/models/post";

function contentDisposition(filename: string) {
  const safeAscii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\\r\n]/g, "_") || "download";
  const encoded = encodeURIComponent(filename).replace(/['()]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(_request: Request, context: RouteContext<"/download/[id]">) {
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) return new Response("Not found", { status: 404 });
  try {
    await connectToDatabase();
    const file = await Media.findOne({ _id: id, kind: "download" }).lean().exec();
    if (!file) return new Response("Not found", { status: 404 });

    const publicPost = file.post
      ? await Post.exists({ _id: file.post, mediaIds: file._id, ...publicPostFilter() })
      : null;
    if (!publicPost) {
      const user = await getCurrentUser();
      if (!user || file.owner.toString() !== user.id) return new Response("Not found", { status: 404 });
    }

    const body = await loadStoredFile(file.storedName);
    return new Response(body, { headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": contentDisposition(file.originalName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch { return new Response("Not found", { status: 404 }); }
}
