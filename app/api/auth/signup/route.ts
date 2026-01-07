import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  hashPassword,
  setAuthCookie,
  isEmailExists,
  isNicknameExists,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname } = body;

    // 유효성 검사
    if (!email || !password || !nickname) {
      return NextResponse.json(
        { success: false, error: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    // 비밀번호 검사 (8자 이상, 영문/숫자 조합)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          error: "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.",
        },
        { status: 400 }
      );
    }

    // 닉네임 검사 (2~12자, 한글/영문/숫자)
    const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,12}$/;
    if (!nicknameRegex.test(nickname)) {
      return NextResponse.json(
        {
          success: false,
          error: "닉네임은 2~12자, 한글/영문/숫자만 가능합니다.",
        },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    if (await isEmailExists(email)) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 이메일입니다." },
        { status: 409 }
      );
    }

    // 닉네임 중복 확인
    if (await isNicknameExists(nickname)) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 닉네임입니다." },
        { status: 409 }
      );
    }

    // 비밀번호 해시
    const passwordHash = await hashPassword(password);

    // 사용자 생성
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        nickname,
        password_hash: passwordHash,
      })
      .select("id, email, nickname")
      .single();

    if (error || !user) {
      console.error("User creation error:", error);
      return NextResponse.json(
        { success: false, error: "회원가입에 실패했습니다." },
        { status: 500 }
      );
    }

    // 자동 로그인 (쿠키 설정)
    await setAuthCookie({
      userId: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
