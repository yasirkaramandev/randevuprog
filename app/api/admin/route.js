import { NextResponse } from "next/server";
import {
  deleteBooking,
  getBookingsJSON,
  getScheduleSummariesForAdmin,
} from "@/lib/db";
import {
  isAuthorizedRequest,
  unauthorizedResponse,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAuthorizedRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const [bookings, schedules] = await Promise.all([
      getBookingsJSON(),
      getScheduleSummariesForAdmin(),
    ]);

    return NextResponse.json({
      bookings,
      toplam: bookings.length,
      schedules,
    });
  } catch {
    return NextResponse.json(
      { error: "Randevular yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!isAuthorizedRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const { slotId } = await request.json();

    if (!slotId) {
      return NextResponse.json(
        { error: "Slot ID gerekli." },
        { status: 400 }
      );
    }

    const result = await deleteBooking(slotId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Randevu silindi." });
  } catch {
    return NextResponse.json(
      { error: "Randevu silinirken hata oluştu." },
      { status: 500 }
    );
  }
}
