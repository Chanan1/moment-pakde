import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: Request, props: RouteParams) {
  const { slug } = await props.params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().replace(/^#/, "");
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limit = 12;

  const supabase = await createClient();

  // 1. Cari ID tag
  const { data: tag } = await supabase
    .from("tags")
    .select("id")
    .eq("slug", cleanSlug)
    .single();

  if (!tag) {
    return NextResponse.json(
      { ok: false, error: "NOT_FOUND", message: "Tag tidak ditemukan" },
      { status: 404 }
    );
  }

  // 2. Ambil moment IDs untuk tag ini
  const { data: momentTagRows } = await supabase
    .from("moment_tags")
    .select("moment_id")
    .eq("tag_id", tag.id);

  const momentIds = (momentTagRows || []).map((row) => row.moment_id);

  if (momentIds.length === 0) {
    return NextResponse.json(
      { ok: true, data: { items: [], nextCursor: null } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=59",
        },
      }
    );
  }

  // 3. Query moments
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
    .in("id", momentIds)
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
