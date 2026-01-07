import { SignJWT, jwtVerify } from "jose";
import { hash, compare } from "bcryptjs";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);
const TOKEN_NAME = "wakja_token";
const TOKEN_EXPIRY = "7d"; // 7일

export interface JWTPayload {
  userId: string;
  email: string;
  nickname: string;
}

// 비밀번호 해시
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

// 비밀번호 검증
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// JWT 토큰 생성
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

// JWT 토큰 검증
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

// 쿠키에서 현재 사용자 가져오기
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// 로그인 - 쿠키 설정
export async function setAuthCookie(payload: JWTPayload): Promise<string> {
  const token = await createToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7일
    path: "/",
  });
  return token;
}

// 로그아웃 - 쿠키 삭제
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

// 사용자 식별자 가져오기 (로그인 유저 ID 또는 익명 식별자)
export async function getUserIdentifier(): Promise<string> {
  const user = await getCurrentUser();
  if (user) {
    return `user:${user.userId}`;
  }

  // 비로그인 사용자는 쿠키 기반 식별자 사용
  const cookieStore = await cookies();
  let visitorId = cookieStore.get("wakja_visitor")?.value;

  if (!visitorId) {
    visitorId = `anon:${crypto.randomUUID()}`;
    cookieStore.set("wakja_visitor", visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1년
      path: "/",
    });
  }

  return visitorId;
}

// 이메일 중복 확인
export async function isEmailExists(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();
  return !!data;
}

// 닉네임 중복 확인
export async function isNicknameExists(nickname: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("nickname", nickname)
    .single();
  return !!data;
}
