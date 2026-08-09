import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { removeImage, storeImage } from "@/lib/media-storage";
import { Media } from "@/models/media";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const formData = await request.formData();
  const image = formData.get("image");
  const altText = String(formData.get("altText") ?? "").trim().slice(0, 180);
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Select an image to upload." }, { status: 400 });
  }

  let stored: Awaited<ReturnType<typeof storeImage>> | null = null;
  try {
    stored = await storeImage(image);
    await connectToDatabase();
    const media = await Media.create({
      owner: user.id,
      kind: "image",
      storedName: stored.storedName,
      originalName: image.name.slice(0, 255) || "image",
      mimeType: stored.mimeType,
      size: stored.size,
      altText,
    });

    return NextResponse.json({
      id: media._id.toString(),
      url: `/media/${media._id.toString()}`,
      altText: media.altText,
    });
  } catch (error) {
    if (stored) await removeImage(stored.storedName).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Image upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
