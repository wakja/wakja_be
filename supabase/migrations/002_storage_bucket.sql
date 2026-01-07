-- Supabase Storage 버킷 생성
-- 참고: 이 쿼리는 Supabase 대시보드의 SQL Editor에서 실행하거나,
-- Storage 섹션에서 직접 버킷을 생성하세요.

-- 버킷 생성 (public 설정)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 공개 읽기 정책 (모든 사용자가 이미지 조회 가능)
CREATE POLICY "Public read access for post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- 인증된 사용자 업로드 정책
-- 참고: 이 프로젝트는 자체 JWT를 사용하므로 API 레벨에서 인증 처리
-- Supabase Auth를 사용하지 않으면 서비스 롤 키로 업로드
CREATE POLICY "Authenticated upload for post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images');

-- 삭제 정책 (선택적)
CREATE POLICY "Delete access for post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images');
