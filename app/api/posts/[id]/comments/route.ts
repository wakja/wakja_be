import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id]/comments - 댓글 목록 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: "잘못된 게시글 ID입니다." },
        { status: 400 }
      );
    }

    const currentUser = await getCurrentUser();

    // 댓글 목록 조회
    const { data: comments, error } = await supabaseAdmin
      .from("comments")
      .select(
        `
        id,
        content,
        created_at,
        author_id,
        users!inner(nickname)
      `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Comments fetch error:", error);
      return NextResponse.json(
        { success: false, error: "댓글을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 응답 형식 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = comments?.map((comment: any) => ({
      id: comment.id,
      author: comment.users?.nickname || "알 수 없음",
      content: comment.content,
      created_at: comment.created_at,
      is_owner: currentUser?.userId === comment.author_id,
    }));

    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Comments list error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/posts/[id]/comments - 댓글 작성
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: "잘못된 게시글 ID입니다." },
        { status: 400 }
      );
    }

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabaseAdmin
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
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

    // 댓글 생성
    const { data: comment, error } = await supabaseAdmin
      .from("comments")
      .insert({
        post_id: postId,
        author_id: user.userId,
        content: content.trim(),
      })
      .select("id, content, created_at")
      .single();

    if (error || !comment) {
      console.error("Comment creation error:", error);
      return NextResponse.json(
        { success: false, error: "댓글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: comment.id,
        author: user.nickname,
        content: comment.content,
        created_at: comment.created_at,
        is_owner: true,
      },
    });
  } catch (error) {
    console.error("Comment create error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
