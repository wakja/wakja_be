export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>왁자 API Server</h1>
      <p>API 엔드포인트:</p>
      <ul>
        <li>POST /api/auth/signup - 회원가입</li>
        <li>POST /api/auth/login - 로그인</li>
        <li>POST /api/auth/logout - 로그아웃</li>
        <li>GET /api/auth/me - 현재 사용자 정보</li>
        <li>GET /api/posts - 게시글 목록</li>
        <li>GET /api/posts/[id] - 게시글 상세</li>
        <li>POST /api/posts - 게시글 작성</li>
        <li>PUT /api/posts/[id] - 게시글 수정</li>
        <li>DELETE /api/posts/[id] - 게시글 삭제</li>
        <li>POST /api/posts/[id]/like - 좋아요</li>
        <li>GET /api/posts/[id]/comments - 댓글 목록</li>
        <li>POST /api/posts/[id]/comments - 댓글 작성</li>
        <li>PUT /api/comments/[id] - 댓글 수정</li>
        <li>DELETE /api/comments/[id] - 댓글 삭제</li>
        <li>POST /api/upload - 이미지 업로드</li>
        <li>POST /api/feedback - 피드백 제출</li>
      </ul>
    </main>
  );
}
