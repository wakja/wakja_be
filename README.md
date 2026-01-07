# 왁자 백엔드 API

Next.js API Routes + Supabase 기반 백엔드

## 기술 스택

- Next.js 16 (App Router)
- Supabase (PostgreSQL + Storage)
- TypeScript
- jose (JWT)
- bcryptjs (비밀번호 해시)

## 설정 방법

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Project Settings > API에서 다음 정보 확인:
   - Project URL
   - anon public key
   - service_role key

### 2. 데이터베이스 스키마 설정

Supabase 대시보드 > SQL Editor에서 다음 파일들을 순서대로 실행:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_storage_bucket.sql`

### 3. Storage 버킷 확인

Supabase 대시보드 > Storage에서 `post-images` 버킷이 생성되었는지 확인

### 4. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일 수정:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-at-least-32-characters
FRONTEND_URL=http://localhost:3000
```

### 5. 로컬 실행

```bash
pnpm install
pnpm dev
```

서버가 `http://localhost:3001`에서 실행됩니다.

## Vercel 배포

### 1. Vercel에 프로젝트 연결

```bash
vercel
```

### 2. 환경 변수 설정

Vercel 대시보드 > Settings > Environment Variables에서 다음 변수 추가:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `FRONTEND_URL` (프론트엔드 Vercel URL)

### 3. 배포

```bash
vercel --prod
```

## API 엔드포인트

### 인증

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 |
| POST | /api/auth/logout | 로그아웃 |
| GET | /api/auth/me | 현재 사용자 정보 |

### 게시글

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/posts | 게시글 목록 (페이지네이션, 검색) |
| POST | /api/posts | 게시글 작성 |
| GET | /api/posts/[id] | 게시글 상세 |
| PUT | /api/posts/[id] | 게시글 수정 |
| DELETE | /api/posts/[id] | 게시글 삭제 |
| POST | /api/posts/[id]/like | 좋아요 토글 |

### 댓글

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/posts/[id]/comments | 댓글 목록 |
| POST | /api/posts/[id]/comments | 댓글 작성 |
| PUT | /api/comments/[id] | 댓글 수정 |
| DELETE | /api/comments/[id] | 댓글 삭제 |

### 기타

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | /api/upload | 이미지 업로드 |
| POST | /api/feedback | 피드백 제출 |

## API 응답 형식

```json
{
  "success": true,
  "data": { ... }
}
```

에러 응답:

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

## 프론트엔드 연동

프론트엔드에서 API 호출 시 credentials를 포함해야 합니다:

```typescript
fetch('http://localhost:3001/api/auth/me', {
  credentials: 'include',
})
```

또는 axios 사용 시:

```typescript
axios.defaults.withCredentials = true;
```
