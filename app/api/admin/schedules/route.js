import { NextResponse } from "next/server";
import { addSchedule, deleteSchedule } from "@/lib/db";
import {
  isAuthorizedRequest,
  unauthorizedResponse,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isAuthorizedRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const { dateKey, start, end } = await request.json();
    const result = await addSchedule({ dateKey, start, end });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Program eklendi ve slotlar oluşturuldu.",
    });
  } catch {
    return NextResponse.json(
      { error: "Program eklenirken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!isAuthorizedRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const { scheduleId } = await request.json();

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Program ID gerekli." },
        { status: 400 }
      );
    }

    const result = await deleteSchedule(scheduleId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Program silindi.",
    });
  } catch {
    return NextResponse.json(
      { error: "Program silinirken hata oluştu." },
      { status: 500 }
    );
  }
}
