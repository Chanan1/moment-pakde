import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{
    shortId: string;
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  naksir: "Naksir",
  terima_kasih: "Terima Kasih",
  curhat: "Curhat",
  minta_maaf: "Minta Maaf",
  unek_unek: "Unek-unek",
  lainnya: "Lainnya",
};

export async function GET(request: Request, props: RouteParams) {
  const { shortId } = await props.params;
  const { searchParams } = new URL(request.url);
  const isStory = searchParams.get("format") === "story";

  const adminClient = createAdminClient();
  const { data: confession } = await adminClient
    .from("public_confessions")
    .select("short_id, body, category, recipient, created_at")
    .eq("short_id", shortId.toLowerCase())
    .single();

  if (!confession) {
    return new Response("Confess tidak ditemukan", { status: 404 });
  }

  const categoryLabel = CATEGORY_LABELS[confession.category] || confession.category;
  const bodyText =
    confession.body.length > (isStory ? 450 : 250)
      ? `${confession.body.slice(0, isStory ? 450 : 250)}...`
      : confession.body;

  // Format Story Instagram (1080 x 1920)
  if (isStory) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0C0A09",
            color: "#F5F5F4",
            padding: "100px 70px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#F97316",
                color: "#FFFFFF",
                padding: "10px 28px",
                borderRadius: 50,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "0.05em",
              }}
            >
              MOMENT PAKDE
            </div>
            <div
              style={{
                fontSize: 22,
                color: "#A8A29E",
                letterSpacing: "0.02em",
              }}
            >
              Komunitas MagangHub
            </div>
          </div>

          {/* Card Body */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              backgroundColor: "#1C1917",
              border: "2px solid #292524",
              borderRadius: 40,
              padding: "60px 50px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              gap: 32,
            }}
          >
            {/* Meta */}
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
                  backgroundColor: "#292524",
                  padding: "8px 22px",
                  borderRadius: 30,
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#FB923C",
                }}
              >
                {categoryLabel}
              </div>
              <div
                style={{
                  fontSize: 20,
                  color: "#78716C",
                  fontFamily: "monospace",
                }}
              >
                #{confession.short_id}
              </div>
            </div>

            {/* Recipient jika ada */}
            {confession.recipient && (
              <div
                style={{
                  fontSize: 24,
                  color: "#D6D3D1",
                  fontStyle: "italic",
                }}
              >
                Untuk: @{confession.recipient}
              </div>
            )}

            {/* Isi Confess */}
            <div
              style={{
                fontSize: 34,
                lineHeight: 1.5,
                color: "#F5F5F4",
                fontWeight: 500,
              }}
            >
              &ldquo;{bodyText}&rdquo;
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 22,
                color: "#78716C",
              }}
            >
              Kirim confess anonimmu di:
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#F97316",
              }}
            >
              momentpakde.id
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
      }
    );
  }

  // Format Standar Open Graph (1200 x 630)
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
        {/* Top Bar */}
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
              Confess Anonim &bull; {categoryLabel}
            </div>
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#78716C",
              fontFamily: "monospace",
            }}
          >
            #{confession.short_id}
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
          {confession.recipient && (
            <div style={{ fontSize: 20, color: "#D6D3D1", fontStyle: "italic" }}>
              Untuk: @{confession.recipient}
            </div>
          )}
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#F5F5F4",
            }}
          >
            &ldquo;{bodyText}&rdquo;
          </div>
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
