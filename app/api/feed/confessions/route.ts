import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const category = searchParams.get("category");
  const limit = 12;

  const supabase = await createClient();

  // Wajib membaca dari public_confessions untuk menjamin sender_hash tidak bocor
  let query = supabase
    .from("public_confessions")
    .select(
      `
      id,
      short_id,
      body,
      recipient,
      category,
      reaction_count,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (category && category !== "semua") {
    query = query.eq("category", category);
  }

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
