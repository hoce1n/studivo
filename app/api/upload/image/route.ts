"use server";

import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/server";
import { prisma } from "@/lib/db";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  // Auth — must be a scoped tenant admin
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "احراز هویت الزامی است." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, studyhallId: true },
  });

  if (!user?.studyhallId || user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی غیر مجاز." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "فایلی ارسال نشده است." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "فقط فایل‌های JPEG، PNG و WebP مجاز هستند." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "حجم فایل نمی‌تواند بیشتر از ۵ مگابایت باشد." },
      { status: 400 }
    );
  }

  // Scope the path to the studyhall so blobs are organised per-venue
  const ext = file.name.split(".").pop() ?? "jpg";
  const pathname = `venues/${user.studyhallId}/${Date.now()}.${ext}`;

  const blob = await put(pathname, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
