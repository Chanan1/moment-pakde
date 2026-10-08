import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, props: RouteParams) {
  const { id } = await props.params;

  const adminClient = createAdminClient();
  const { data: moment } = await adminClient
    .from("moments")
    .select(
      `
      id,
      caption,
      moment_date,
      location,
      profiles:user_id (
        username,
        display_name
      )
    `
    )
    .eq("id", id)
    .single();

  if (!moment) {
    return new Response("Momen tidak ditemukan", { status: 404 });
  }

  const author = Array.isArray(moment.profiles)
    ? moment.profiles[0]
    : moment.profiles;

  const authorName = author?.display_name || `@${author?.username || "magang"}`;
  const captionText =
    moment.caption.length > 200
      ? `${moment.caption.slice(0, 200)}...`
      : moment.caption;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0C0A09",
          color: "#F5F5F4",
          padding: "60px 70px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                backgroundColor: "#F97316",
                color: "#FFFFFF",
                padding: "6px 18px",
                borderRadius: 20,
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              MOMENT PAKDE
            </div>
            <div style={{ fontSize: 18, color: "#A8A29E" }}>
              Momen MagangHub
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#78716C",
            }}
          >
            oleh {authorName}
          </div>
        </div>

        {/* Content Box */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            backgroundColor: "#1C1917",
            border: "1px solid #292524",
            borderRadius: 24,
            padding: "40px",
          }}
        >
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#F5F5F4",
            }}
          >
            &ldquo;{captionText}&rdquo;
          </div>
          {moment.location && (
            <div
              style={{
                fontSize: 18,
                color: "#FB923C",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📍 {moment.location}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 16,
            color: "#78716C",
          }}
        >
          <div>Dibuat untuk seru-seruan komunitas MagangHub.</div>
          <div style={{ color: "#F97316", fontWeight: 600 }}>momentpakde.id</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
