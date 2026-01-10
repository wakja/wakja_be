# 왁자 API 명세서

> Base URL: `http://localhost:3001` (개발) / `https://your-api.vercel.app` (배포)

## 공통 사항

### 요청 헤더

```
Content-Type: application/json
```

### 인증

- 쿠키 기반 JWT 인증 사용
- 프론트엔드에서 `credentials: 'include'` 필수

```typescript
// fetch 사용 시
fetch("/api/posts", {
  credentials: "include",
});

// axios 사용 시
axios.defaults.withCredentials = true;
```

### 응답 형식

**성공**

```json
{
  "success": true,
  "data": { ... }
}
```

**실패**

```json
{
  "success": false,
  "error": "에러 메시지"
}
```

---

## 1. 인증 API

### 1.1 회원가입

```
POST /api/auth/signup
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "왁자지껄"
}
```

| 필드     | 타입   | 필수 | 설명                            |
| -------- | ------ | ---- | ------------------------------- |
| email    | string | O    | 이메일 (형식 검증)              |
| password | string | O    | 비밀번호 (8자 이상, 영문+숫자)  |
| nickname | string | O    | 닉네임 (2~12자, 한글/영문/숫자) |

**Response (201)**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "nickname": "왁자지껄"
  }
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 400 | 모든 필드를 입력해주세요 |
| 400 | 올바른 이메일 형식이 아닙니다 |
| 400 | 비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다 |
| 400 | 닉네임은 2~12자, 한글/영문/숫자만 가능합니다 |
| 409 | 이미 사용 중인 이메일입니다 |
| 409 | 이미 사용 중인 닉네임입니다 |

---

### 1.2 로그인

```
POST /api/auth/login
```

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "nickname": "왁자지껄"
  }
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 400 | 이메일과 비밀번호를 입력해주세요 |
| 401 | 이메일 또는 비밀번호가 일치하지 않습니다 |

---

### 1.3 로그아웃

```
POST /api/auth/logout
```

**Response (200)**

```json
{
  "success": true,
  "message": "로그아웃되었습니다."
}
```

---

### 1.4 현재 사용자 정보

```
GET /api/auth/me
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "nickname": "왁자지껄"
  }
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 401 | 로그인이 필요합니다 |

---

## 2. 게시글 API

### 2.1 게시글 목록 조회

```
GET /api/posts
```

**Query Parameters**
| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| page | number | 1 | 페이지 번호 |
| per_page | number | 20 | 페이지당 개수 |
| search | string | "" | 검색어 (제목+본문) |

**예시**

```
GET /api/posts?page=1&per_page=20&search=안녕
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "첫 번째 글",
        "author": "왁자지껄",
        "created_at": "2025-01-07T10:30:00Z",
        "views": 42,
        "like_count": 5,
        "comment_count": 3
      }
    ],
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  }
}
```

---

### 2.2 게시글 상세 조회

```
GET /api/posts/:id
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "첫 번째 글",
    "content_md": "# 제목\n\n본문 내용입니다.",
    "author": "왁자지껄",
    "author_id": "uuid-string",
    "created_at": "2025-01-07T10:30:00Z",
    "views": 43,
    "like_count": 5,
    "is_owner": true,
    "has_liked": false
  }
}
```

| 필드       | 설명                              |
| ---------- | --------------------------------- |
| content_md | 마크다운 원문 (프론트에서 렌더링) |
| is_owner   | 현재 사용자가 작성자인지 여부     |
| has_liked  | 현재 사용자가 좋아요 했는지 여부  |

**Errors**
| 상태 | 메시지 |
|------|--------|
| 400 | 잘못된 게시글 ID입니다 |
| 404 | 게시글을 찾을 수 없습니다 |

---

### 2.3 게시글 작성

```
POST /api/posts
```

> 인증 필요

**Request Body**

```json
{
  "title": "제목 (선택)",
  "content_md": "# 본문\n\n마크다운 내용"
}
```

| 필드       | 타입   | 필수 | 설명              |
| ---------- | ------ | ---- | ----------------- |
| title      | string | X    | 제목 (최대 200자) |
| content_md | string | O    | 본문 (마크다운)   |

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "제목",
    "content_md": "# 본문\n\n마크다운 내용",
    "created_at": "2025-01-07T10:30:00Z"
  }
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 400 | 내용을 입력해주세요 |
| 400 | 제목은 200자 이내로 입력해주세요 |
| 401 | 로그인이 필요합니다 |

---

### 2.4 게시글 수정

```
PUT /api/posts/:id
```

> 인증 필요, 작성자만 가능

**Request Body**

```json
{
  "title": "수정된 제목",
  "content_md": "수정된 본문"
}
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "수정된 제목",
    "content_md": "수정된 본문",
    "updated_at": "2025-01-07T11:00:00Z"
  }
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 401 | 로그인이 필요합니다 |
| 403 | 수정 권한이 없습니다 |
| 404 | 게시글을 찾을 수 없습니다 |

---

### 2.5 게시글 삭제

```
DELETE /api/posts/:id
```

> 인증 필요, 작성자만 가능

**Response (200)**

```json
{
  "success": true,
  "message": "게시글이 삭제되었습니다."
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 401 | 로그인이 필요합니다 |
| 403 | 삭제 권한이 없습니다 |
| 404 | 게시글을 찾을 수 없습니다 |

---

### 2.6 좋아요 (지껄) 토글

```
POST /api/posts/:id/like
```

> 비로그인도 가능 (쿠키 기반 식별)

**Response (200)**

```json
{
  "success": true,
  "data": {
    "liked": true,
    "like_count": 6
  }
}
```

| 필드       | 설명                                    |
| ---------- | --------------------------------------- |
| liked      | true면 좋아요 추가, false면 좋아요 취소 |
| like_count | 현재 총 좋아요 수                       |

---

## 3. 댓글 API

### 3.1 댓글 목록 조회

```
GET /api/posts/:id/comments
```

**Response (200)**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "author": "왁자지껄",
      "content": "좋은 글이네요!",
      "created_at": "2025-01-07T10:35:00Z",
      "is_owner": true
    },
    {
      "id": 2,
      "author": "지껄왁자",
      "content": "동의합니다",
      "created_at": "2025-01-07T10:40:00Z",
      "is_owner": false
    }
  ]
}
```

---

### 3.2 댓글 작성

```
POST /api/posts/:id/comments
```

> 인증 필요

**Request Body**

```json
{
  "content": "댓글 내용입니다."
}
```

| 필드    | 타입   | 필수 | 설명                    |
| ------- | ------ | ---- | ----------------------- |
| content | string | O    | 댓글 내용 (최대 1000자) |

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": 3,
    "author": "왁자지껄",
    "content": "댓글 내용입니다.",
    "created_at": "2025-01-07T11:00:00Z",
    "is_owner": true
  }
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 400 | 댓글 내용을 입력해주세요 |
| 400 | 댓글은 1000자 이내로 입력해주세요 |
| 401 | 로그인이 필요합니다 |
| 404 | 게시글을 찾을 수 없습니다 |

---

### 3.3 댓글 수정

```
PUT /api/comments/:id
```

> 인증 필요, 작성자만 가능

**Request Body**

```json
{
  "content": "수정된 댓글"
}
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "수정된 댓글",
    "updated_at": "2025-01-07T11:10:00Z"
  }
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 401 | 로그인이 필요합니다 |
| 403 | 수정 권한이 없습니다 |
| 404 | 댓글을 찾을 수 없습니다 |

---

### 3.4 댓글 삭제

```
DELETE /api/comments/:id
```

> 인증 필요, 작성자만 가능

**Response (200)**

```json
{
  "success": true,
  "message": "댓글이 삭제되었습니다."
}
```

---

## 4. 이미지 업로드 API

### 4.1 이미지 업로드

```
POST /api/upload
```

> 인증 필요

**Request**

- Content-Type: `multipart/form-data`

| 필드 | 타입 | 필수 | 설명        |
| ---- | ---- | ---- | ----------- |
| file | File | O    | 이미지 파일 |

**허용 형식**: jpg, png, gif, webp
**최대 크기**: 5MB

**예시 (JavaScript)**

```javascript
const formData = new FormData();
formData.append("file", file);

const response = await fetch("/api/upload", {
  method: "POST",
  credentials: "include",
  body: formData,
});
```

**Response (200)**

```json
{
  "success": true,
  "data": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/post-images/uuid/1234567890-abc123.png",
    "fileName": "uuid/1234567890-abc123.png"
  }
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 400 | 파일이 없습니다 |
| 400 | 허용되지 않는 파일 형식입니다 |
| 400 | 파일 크기는 5MB 이하만 가능합니다 |
| 401 | 로그인이 필요합니다 |

**마크다운 삽입 예시**

```javascript
const imageUrl = response.data.url;
const markdown = `![](${imageUrl})`;
// 에디터에 삽입
```

---

## 5. 피드백 API

### 5.1 피드백 제출

```
POST /api/feedback
```

> 비로그인도 가능

**Request Body**

```json
{
  "type": "bug",
  "content": "피드백 내용입니다."
}
```

| 필드    | 타입   | 필수 | 설명                               |
| ------- | ------ | ---- | ---------------------------------- |
| type    | string | O    | 유형: `bug`, `suggestion`, `other` |
| content | string | O    | 내용 (최대 2000자)                 |

**Response (200)**

```json
{
  "success": true,
  "message": "피드백이 제출되었습니다. 감사합니다!"
}
```

**Errors**
| 상태 | 메시지 |
|------|--------|
| 400 | 피드백 유형을 선택해주세요 |
| 400 | 피드백 내용을 입력해주세요 |
| 400 | 피드백은 2000자 이내로 입력해주세요 |

---

## 프론트엔드 연동 예시

### API 클라이언트 설정

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function api<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  return response.json();
}

// 사용 예시
const { data, error } = await api<Post>("/api/posts/1");
```

### 인증 상태 관리

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  nickname: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>("/api/auth/me")
      .then((res) => {
        if (res.success) setUser(res.data!);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.success) setUser(res.data!);
    return res;
  };

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return { user, loading, login, logout };
}
```

---

## 특이사항

### 조회수 증가 로직

- 같은 사용자(쿠키 기반)가 같은 글을 다시 열면:
  - 마지막 조회 후 **6시간 이내**: 조회수 증가 안 함
  - **6시간 초과**: 조회수 +1

### 좋아요 제한

- 세션/쿠키 기준 1인 1회 제한
- 같은 글에 다시 클릭하면 좋아요 취소 (토글)

### 이미지 업로드

- 게시글당 최대 2개 제한은 **프론트엔드에서 처리**
- 백엔드는 개별 파일 업로드만 담당
