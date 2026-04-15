import { NextResponse } from "next/server";
import { getBookingsJSON, deleteBooking } from "@/lib/db";

export const dynamic = "force-dynamic";

// Auth kontrolü helper
function checkAuth(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(":");

  return username === "yasir" && password === "admin";
}

function unauthorizedResponse() {
  return new NextResponse("Yetkilendirme gerekli", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin Panel"' },
  });
}

export async function GET(request) {
  if (!checkAuth(request)) return unauthorizedResponse();

  try {
    const bookings = await getBookingsJSON();
    return NextResponse.json({ bookings, toplam: bookings.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Randevular yüklenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!checkAuth(request)) return unauthorizedResponse();

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
  } catch (error) {
    return NextResponse.json(
      { error: "Randevu silinirken hata oluştu." },
      { status: 500 }
    );
  }
}
