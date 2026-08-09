import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { removeImage } from "@/lib/media-storage";
import { Media } from "@/models/media";

export async function DELETE(request: Request, context: RouteContext<"/api/media/[id]">) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { id } = await context.params;
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 });
  }

  await connectToDatabase();
  const media = await Media.findOne({ _id: id, owner: user.id }).exec();
  if (!media) return NextResponse.json({ error: "Media not found." }, { status: 404 });
  if (media.post) {
    return NextResponse.json({ error: "Attached media must be removed from the post first." }, { status: 409 });
  }

  await removeImage(media.storedName);
  await media.deleteOne();
  return NextResponse.json({ success: true });
}
