import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { loadImage } from "@/lib/media-storage";
import { Media } from "@/models/media";

export async function GET(_request: Request, context: RouteContext<"/media/[id]">) {
  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) return new Response("Not found", { status: 404 });

  try {
    await connectToDatabase();
    const media = await Media.findOne({
      _id: id,
      $or: [{ kind: "image" }, { kind: { $exists: false } }],
    }).select("storedName mimeType").lean().exec();
    if (!media) return new Response("Not found", { status: 404 });

    const body = await loadImage(media.storedName);
    return new Response(body, {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
