import { NextResponse } from "next/server";
import { bookSlot } from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const { slotId, studentName, parentName, phone } = body;

    if (!slotId || !studentName || !parentName || !phone) {
      return NextResponse.json(
        { error: "Tüm alanları doldurunuz." },
        { status: 400 }
      );
    }

    const result = await bookSlot(slotId, { studentName, parentName, phone });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, message: "Randevu alındı!" });
  } catch (error) {
    return NextResponse.json(
      { error: "Randevu alınırken hata oluştu." },
      { status: 500 }
    );
  }
}
