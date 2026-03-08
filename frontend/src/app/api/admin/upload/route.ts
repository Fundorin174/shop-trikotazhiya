/**
 * POST /api/admin/upload — загрузка изображений в Medusa
 *
 * Принимает multipart/form-data с файлами (поле "files")
 * Возвращает массив URL загруженных файлов
 */

import { NextRequest, NextResponse } from "next/server";

const MEDUSA_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

export async function POST(request: NextRequest) {
  const token = request.headers.get("x-admin-token");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Не переданы файлы для загрузки" },
        { status: 400 }
      );
    }

    // Пересылаем файлы в Medusa Admin API
    const medusaForm = new FormData();
    for (const file of files) {
      medusaForm.append("files", file);
    }

    const res = await fetch(`${MEDUSA_URL}/admin/uploads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: medusaForm,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(
        `Medusa POST /admin/uploads → ${res.status}: ${text.substring(0, 300)}`
      );
    }

    const data = JSON.parse(text);
    // Medusa v2 возвращает { files: [{ id, url }] }
    const urls: string[] = (data.files ?? []).map(
      (f: { url: string }) => f.url
    );

    return NextResponse.json({ success: true, urls });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
