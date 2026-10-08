import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = 12;

  const supabase = await createClient();

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
      profiles:user_id (
        username,
        display_name,
        avatar_url
      ),
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
      // Abaikan cursor jika format tidak valid
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
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=59",
      },
    }
  );
}
