import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser, getUserIdentifier } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id] - 게시글 상세 조회
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

    // 게시글 조회
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select(
        `
        id,
        title,
        content_md,
        views,
        like_count,
        created_at,
        author_id,
        users!inner(nickname)
      `
      )
      .eq("id", postId)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const postData = post as any;

    // 현재 사용자 정보
    const currentUser = await getCurrentUser();
    const userIdentifier = await getUserIdentifier();

    // 좋아요 여부 확인
    const { data: likeData } = await supabaseAdmin
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_identifier", userIdentifier)
      .single();

    // 조회수 증가 로직 (6시간 쿨다운)
    const { data: viewRecord } = await supabaseAdmin
      .from("post_views")
      .select("last_viewed_at")
      .eq("post_id", postId)
      .eq("user_identifier", userIdentifier)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const viewData = viewRecord as any;
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const shouldIncreaseView =
      !viewData || viewData.last_viewed_at < sixHoursAgo;

    if (shouldIncreaseView) {
      // 조회수 증가
      await supabaseAdmin
        .from("posts")
        .update({ views: postData.views + 1 })
        .eq("id", postId);

      // 조회 기록 upsert
      await supabaseAdmin.from("post_views").upsert(
        {
          post_id: postId,
          user_identifier: userIdentifier,
          last_viewed_at: new Date().toISOString(),
        },
        { onConflict: "post_id,user_identifier" }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: postData.id,
        title: postData.title,
        content_md: postData.content_md,
        author: postData.users?.nickname || "알 수 없음",
        author_id: postData.author_id,
        created_at: postData.created_at,
        views: shouldIncreaseView ? postData.views + 1 : postData.views,
        like_count: postData.like_count,
        is_owner: currentUser?.userId === postData.author_id,
        has_liked: !!likeData,
      },
    });
  } catch (error) {
    console.error("Post detail error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - 게시글 수정
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
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: "잘못된 게시글 ID입니다." },
        { status: 400 }
      );
    }

    // 게시글 존재 및 소유권 확인
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (existingPost.author_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content_md } = body;

    // 유효성 검사
    if (!content_md || content_md.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "내용을 입력해주세요." },
        { status: 400 }
      );
    }

    if (title && title.length > 200) {
      return NextResponse.json(
        { success: false, error: "제목은 200자 이내로 입력해주세요." },
        { status: 400 }
      );
    }

    // 게시글 수정
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .update({
        title: title || null,
        content_md,
      })
      .eq("id", postId)
      .select("id, title, content_md, updated_at")
      .single();

    if (error || !post) {
      console.error("Post update error:", error);
      return NextResponse.json(
        { success: false, error: "게시글 수정에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Post update error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - 게시글 삭제
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
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: "잘못된 게시글 ID입니다." },
        { status: 400 }
      );
    }

    // 게시글 존재 및 소유권 확인
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (existingPost.author_id !== user.userId) {
      return NextResponse.json(
        { success: false, error: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    // 게시글 삭제 (연관 댓글, 좋아요, 조회수는 CASCADE로 자동 삭제)
    const { error } = await supabaseAdmin
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      console.error("Post delete error:", error);
      return NextResponse.json(
        { success: false, error: "게시글 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "게시글이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Post delete error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
