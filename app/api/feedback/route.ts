import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

// POST /api/feedback - 피드백 제출
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content } = body;

    // 유효성 검사
    if (!type || !["bug", "suggestion", "other"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "피드백 유형을 선택해주세요." },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "피드백 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: "피드백은 2000자 이내로 입력해주세요." },
        { status: 400 }
      );
    }

    // 로그인 사용자 확인 (선택)
    const user = await getCurrentUser();

    // 피드백 저장
    const { error } = await supabaseAdmin.from("feedbacks").insert({
      type,
      content: content.trim(),
      user_id: user?.userId || null,
    });

    if (error) {
      console.error("Feedback creation error:", error);
      return NextResponse.json(
        { success: false, error: "피드백 제출에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "피드백이 제출되었습니다. 감사합니다!",
    });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
