import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getUserIdentifier } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/posts/[id]/like - 좋아요 토글
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
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
      .select("id, like_count")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: "게시글을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const userIdentifier = await getUserIdentifier();

    // 기존 좋아요 확인
    const { data: existingLike } = await supabaseAdmin
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_identifier", userIdentifier)
      .single();

    if (existingLike) {
      // 이미 좋아요 했으면 취소
      await supabaseAdmin.from("likes").delete().eq("id", existingLike.id);

      return NextResponse.json({
        success: true,
        data: {
          liked: false,
          like_count: post.like_count - 1,
        },
      });
    } else {
      // 좋아요 추가
      const { error: likeError } = await supabaseAdmin.from("likes").insert({
        post_id: postId,
        user_identifier: userIdentifier,
      });

      if (likeError) {
        console.error("Like insert error:", likeError);
        return NextResponse.json(
          { success: false, error: "좋아요 처리에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          liked: true,
          like_count: post.like_count + 1,
        },
      });
    }
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
