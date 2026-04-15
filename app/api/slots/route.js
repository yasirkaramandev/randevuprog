import { NextResponse } from "next/server";
import { getAllSlots } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const slots = await getAllSlots();
    return NextResponse.json({ slots });
  } catch (error) {
    return NextResponse.json(
      { error: "Oturumlar yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}
