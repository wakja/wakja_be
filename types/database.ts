export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          nickname: string;
          password_hash: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          nickname: string;
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nickname?: string;
          password_hash?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: number;
          title: string | null;
          content_md: string;
          author_id: string;
          views: number;
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title?: string | null;
          content_md: string;
          author_id: string;
          views?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string | null;
          content_md?: string;
          author_id?: string;
          views?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: number;
          post_id: number;
          author_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          post_id: number;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          post_id?: number;
          author_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      likes: {
        Row: {
          id: number;
          post_id: number;
          user_identifier: string; // 로그인 유저: user_id, 비로그인: 쿠키 기반 식별자
          created_at: string;
        };
        Insert: {
          id?: number;
          post_id: number;
          user_identifier: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          post_id?: number;
          user_identifier?: string;
          created_at?: string;
        };
      };
      post_views: {
        Row: {
          id: number;
          post_id: number;
          user_identifier: string;
          last_viewed_at: string;
        };
        Insert: {
          id?: number;
          post_id: number;
          user_identifier: string;
          last_viewed_at?: string;
        };
        Update: {
          id?: number;
          post_id?: number;
          user_identifier?: string;
          last_viewed_at?: string;
        };
      };
      feedbacks: {
        Row: {
          id: number;
          type: "bug" | "suggestion" | "other";
          content: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          type: "bug" | "suggestion" | "other";
          content: string;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          type?: "bug" | "suggestion" | "other";
          content?: string;
          user_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      feedback_type: "bug" | "suggestion" | "other";
    };
  };
}

// API 응답 타입
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// 게시글 목록 아이템 타입
export interface PostListItem {
  id: number;
  title: string | null;
  author: string;
  created_at: string;
  views: number;
  like_count: number;
  comment_count: number;
}

// 게시글 상세 타입
export interface PostDetail {
  id: number;
  title: string | null;
  content_md: string;
  author: string;
  author_id: string;
  created_at: string;
  views: number;
  like_count: number;
  is_owner: boolean;
  has_liked: boolean;
}

// 댓글 타입
export interface Comment {
  id: number;
  author: string;
  content: string;
  created_at: string;
  is_owner: boolean;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
