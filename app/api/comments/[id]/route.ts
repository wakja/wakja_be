import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/comments/[id] - 댓글 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, error: "잘못된 댓글 ID입니다." },
        { status: 400 }
      );
    }

    // 댓글 존재 및 소유권 확인
    const { data: existingComment, error: fetchError } = await supabaseAdmin
      .from("comments")
      .select("author_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { success: false, error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (existingComment.author_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    // 유효성 검사
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "댓글 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { success: false, error: "댓글은 1000자 이내로 입력해주세요." },
        { status: 400 }
      );
    }

    // 댓글 수정
    const { data: comment, error } = await supabaseAdmin
      .from("comments")
      .update({ content: content.trim() })
      .eq("id", commentId)
      .select("id, content, updated_at")
      .single();

    if (error || !comment) {
      console.error("Comment update error:", error);
      return NextResponse.json(
        { success: false, error: "댓글 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error("Comment update error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[id] - 댓글 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, error: "잘못된 댓글 ID입니다." },
        { status: 400 }
      );
    }

    // 댓글 존재 및 소유권 확인
    const { data: existingComment, error: fetchError } = await supabaseAdmin
      .from("comments")
      .select("author_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json(
        { success: false, error: "댓글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (existingComment.author_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 댓글 삭제
    const { error } = await supabaseAdmin
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Comment delete error:", error);
      return NextResponse.json(
        { success: false, error: "댓글 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "댓글이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Comment delete error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
