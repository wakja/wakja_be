import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";

// GET /api/posts - 게시글 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "20");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * perPage;

    // 기본 쿼리
    let query = supabaseAdmin
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
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // 검색어가 있으면 필터링
    if (search) {
      query = query.or(`title.ilike.%${search}%,content_md.ilike.%${search}%`);
    }

    // 페이지네이션
    query = query.range(offset, offset + perPage - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Posts fetch error:", error);
      return NextResponse.json(
        { success: false, error: "게시글을 불러오는데 실패했습니다." },
        { status: 500 }
      );
    }

    // 각 게시글의 댓글 수 조회
    const postIds = posts?.map((p) => p.id) || [];
    const { data: commentCounts } = await supabaseAdmin
      .from("comments")
      .select("post_id")
      .in("post_id", postIds);

    const commentCountMap: Record<number, number> = {};
    commentCounts?.forEach((c) => {
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
    });

    // 응답 형식 변환
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = posts?.map((post: any) => ({
      id: post.id,
      title: post.title,
      author: post.users?.nickname || "알 수 없음",
      created_at: post.created_at,
      views: post.views,
      like_count: post.like_count,
      comment_count: commentCountMap[post.id] || 0,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error("Posts list error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST /api/posts - 게시글 작성
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다." },
        { status: 401 }
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

    // 게시글 생성
    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .insert({
        title: title || null,
        content_md,
        author_id: user.userId,
      })
      .select("id, title, content_md, created_at")
      .single();

    if (error || !post) {
      console.error("Post creation error:", error);
      return NextResponse.json(
        { success: false, error: "게시글 작성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: post.id,
        title: post.title,
        content_md: post.content_md,
        created_at: post.created_at,
      },
    });
  } catch (error) {
    console.error("Post create error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
