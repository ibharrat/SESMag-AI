import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "../../../lib/prisma"; 

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "user");
    fs.mkdirSync(uploadDir, { recursive: true });

    const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const doc = await prisma.document.create({
      data: {
        filename: safeName,
        content: "", 
        type: "user_submission",
      },
    });

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      filename: safeName,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: "Upload failed", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
