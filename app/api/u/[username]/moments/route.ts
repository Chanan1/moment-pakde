import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{
    username: string;
  }>;
}

export async function GET(request: Request, props: RouteParams) {
  const { username } = await props.params;
  const cleanUsername = decodeURIComponent(username).replace(/^@/, "");
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = 12;

  const supabase = await createClient();

  // 1. Cari user_id dari username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", cleanUsername)
    .single();

  if (!profile) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND", message: "Pengguna tidak ditemukan" },
      { status: 404 }
    );
  }

  // 2. Query moment milik user
  let query = supabase
    .from("moments")
    .select(
      `
      id,
      caption,
      moment_date,
      location,
      reaction_count,
      comment_count,
      created_at,
      moment_photos (
        id,
        storage_path,
        width,
        height,
        alt_text,
        position
      ),
      moment_tags (
        tags:tag_id (
          slug
        )
      )
    `
    )
    .eq("user_id", profile.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    try {
      const decoded = Buffer.from(cursor, "base64").toString("utf-8");
      const [createdAt] = decoded.split("|");
      if (createdAt) {
        query = query.lt("created_at", createdAt);
      }
    } catch {
      // Abaikan jika format cursor tidak valid
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: "INTERNAL", message: error.message },
      { status: 500 }
    );
  }

  const items = data ?? [];
  const hasMore = items.length > limit;
  const slicedItems = hasMore ? items.slice(0, limit) : items;

  let nextCursor: string | null = null;
  if (hasMore && slicedItems.length > 0) {
    const lastItem = slicedItems[slicedItems.length - 1];
    nextCursor = Buffer.from(
      `${lastItem.created_at}|${lastItem.id}`
    ).toString("base64");
  }

  return NextResponse.json(
    { ok: true, data: { items: slicedItems, nextCursor } },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=59",
      },
    }
  );
}
