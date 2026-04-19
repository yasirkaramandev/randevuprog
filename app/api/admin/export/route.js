import { NextResponse } from "next/server";
import { buildAdminWorkbook } from "@/lib/xlsx";
import { getBookingsJSON } from "@/lib/db";
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
    const bookings = await getBookingsJSON();
    const workbook = buildAdminWorkbook(bookings);

    return new NextResponse(workbook, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="randevular.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Excel dosyasi olusturulurken hata olustu." },
      { status: 500 }
    );
  }
}
