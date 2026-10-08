export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "moderator" | "admin";
export type MomentStatus = "published" | "hidden" | "removed";
export type MomentEmoji = "love" | "haha" | "sad" | "fire" | "pray";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: UserRole;
          is_banned: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: UserRole;
          is_banned?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: UserRole;
          is_banned?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      moments: {
        Row: {
          id: string;
          user_id: string;
          caption: string;
          moment_date: string;
          location: string | null;
          status: MomentStatus;
          reaction_count: number;
          comment_count: number;
          report_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          caption?: string;
          moment_date?: string;
          location?: string | null;
          status?: MomentStatus;
          reaction_count?: number;
          comment_count?: number;
          report_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          caption?: string;
          moment_date?: string;
          location?: string | null;
          status?: MomentStatus;
          reaction_count?: number;
          comment_count?: number;
          report_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      moment_photos: {
        Row: {
          id: string;
          moment_id: string;
          storage_path: string;
          width: number;
          height: number;
          blurhash: string | null;
          alt_text: string | null;
          position: number;
        };
        Insert: {
          id?: string;
          moment_id: string;
          storage_path: string;
          width: number;
          height: number;
          blurhash?: string | null;
          alt_text?: string | null;
          position: number;
        };
        Update: {
          id?: string;
          moment_id?: string;
          storage_path?: string;
          width?: number;
          height?: number;
          blurhash?: string | null;
          alt_text?: string | null;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "moment_photos_moment_id_fkey";
            columns: ["moment_id"];
            isOneToOne: false;
            referencedRelation: "moments";
            referencedColumns: ["id"];
          }
        ];
      };
      tags: {
        Row: {
          id: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      moment_tags: {
        Row: {
          moment_id: string;
          tag_id: string;
        };
        Insert: {
          moment_id: string;
          tag_id: string;
        };
        Update: {
          moment_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moment_tags_moment_id_fkey";
            columns: ["moment_id"];
            isOneToOne: false;
            referencedRelation: "moments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moment_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          }
        ];
      };
      moment_reactions: {
        Row: {
          moment_id: string;
          user_id: string;
          emoji: MomentEmoji;
          created_at: string;
        };
        Insert: {
          moment_id: string;
          user_id: string;
          emoji: MomentEmoji;
          created_at?: string;
        };
        Update: {
          moment_id?: string;
          user_id?: string;
          emoji?: MomentEmoji;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moment_reactions_moment_id_fkey";
            columns: ["moment_id"];
            isOneToOne: false;
            referencedRelation: "moments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          moment_id: string;
          user_id: string;
          body: string;
          status: MomentStatus;
          report_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          moment_id: string;
          user_id: string;
          body: string;
          status?: MomentStatus;
          report_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          moment_id?: string;
          user_id?: string;
          body?: string;
          status?: MomentStatus;
          report_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_moment_id_fkey";
            columns: ["moment_id"];
            isOneToOne: false;
            referencedRelation: "moments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      confessions: {
        Row: {
          id: string;
          short_id: string;
          body: string;
          recipient: string | null;
          category: string;
          status: "pending" | "published" | "hidden" | "removed";
          removal_reason: string | null;
          sender_hash: string;
          secret_code_hash: string | null;
          auto_flags: string[];
          reviewed_at: string | null;
          reaction_count: number;
          report_count: number;
          created_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          short_id: string;
          body: string;
          recipient?: string | null;
          category: string;
          status?: "pending" | "published" | "hidden" | "removed";
          removal_reason?: string | null;
          sender_hash: string;
          secret_code_hash?: string | null;
          auto_flags?: string[];
          reviewed_at?: string | null;
          reaction_count?: number;
          report_count?: number;
          created_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          short_id?: string;
          body?: string;
          recipient?: string | null;
          category?: string;
          status?: "pending" | "published" | "hidden" | "removed";
          removal_reason?: string | null;
          sender_hash?: string;
          secret_code_hash?: string | null;
          auto_flags?: string[];
          reviewed_at?: string | null;
          reaction_count?: number;
          report_count?: number;
          created_at?: string;
          published_at?: string | null;
        };
        Relationships: [];
      };
      confession_reactions: {
        Row: {
          confession_id: string;
          device_hash: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          confession_id: string;
          device_hash: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          confession_id?: string;
          device_hash?: string;
          emoji?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "confession_reactions_confession_id_fkey";
            columns: ["confession_id"];
            isOneToOne: false;
            referencedRelation: "confessions";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          target_type: "moment" | "comment" | "confession" | "reply";
          target_id: string;
          reason: "spam" | "bullying" | "doxxing" | "company" | "sexual" | "other";
          note: string | null;
          reporter_key: string;
          status: "open" | "resolved" | "dismissed";
          created_at: string;
        };
        Insert: {
          id?: string;
          target_type: "moment" | "comment" | "confession" | "reply";
          target_id: string;
          reason: "spam" | "bullying" | "doxxing" | "company" | "sexual" | "other";
          note?: string | null;
          reporter_key: string;
          status?: "open" | "resolved" | "dismissed";
          created_at?: string;
        };
        Update: {
          id?: string;
          target_type?: "moment" | "comment" | "confession" | "reply";
          target_id?: string;
          reason?: "spam" | "bullying" | "doxxing" | "company" | "sexual" | "other";
          note?: string | null;
          reporter_key?: string;
          status?: "open" | "resolved" | "dismissed";
          created_at?: string;
        };
        Relationships: [];
      };
      blocked_senders: {
        Row: {
          sender_hash: string;
          reason: string | null;
          blocked_by: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          sender_hash: string;
          reason?: string | null;
          blocked_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          sender_hash?: string;
          reason?: string | null;
          blocked_by?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
        };
        Insert: {
          key: string;
          value: Json;
        };
        Update: {
          key?: string;
          value?: Json;
        };
        Relationships: [];
      };
      moderation_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: "review" | "publish" | "hide" | "restore" | "remove" | "ban" | "block" | "dismiss" | "settings";
          target_type: "confession" | "moment" | "comment" | "reply" | "user" | "sender" | "settings";
          target_id: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: "review" | "publish" | "hide" | "restore" | "remove" | "ban" | "block" | "dismiss" | "settings";
          target_type: "confession" | "moment" | "comment" | "reply" | "user" | "sender" | "settings";
          target_id: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: "review" | "publish" | "hide" | "restore" | "remove" | "ban" | "block" | "dismiss" | "settings";
          target_type?: "confession" | "moment" | "comment" | "reply" | "user" | "sender" | "settings";
          target_id?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moderation_logs_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      public_confessions: {
        Row: {
          id: string;
          short_id: string;
          body: string;
          recipient: string | null;
          category: string;
          reaction_count: number;
          report_count: number;
          created_at: string;
          published_at: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
