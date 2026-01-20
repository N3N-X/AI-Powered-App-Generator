import { ImageResponse } from "next/og";

// Image metadata
export const alt = "RUX - AI-Powered App Builder";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(139, 92, 246, 0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(99, 102, 241, 0.15) 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        }}
      >
        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "80px",
            zIndex: 1,
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              fontSize: 120,
              marginBottom: 40,
            }}
          >
            🚀
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              background: "linear-gradient(to right, #a78bfa, #818cf8)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}
          >
            RUX
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 36,
              color: "#e2e8f0",
              marginBottom: 30,
              fontWeight: 600,
            }}
          >
            AI-Powered App Builder
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 24,
              color: "#94a3b8",
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            Build mobile & web apps with AI • Generate production-ready code
            instantly
          </div>

          {/* Stats/Features */}
          <div
            style={{
              display: "flex",
              marginTop: 50,
              gap: 60,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#a78bfa",
                }}
              >
                React Native
              </div>
              <div style={{ fontSize: 18, color: "#64748b" }}>
                Mobile Apps
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#818cf8",
                }}
              >
                Expo
              </div>
              <div style={{ fontSize: 18, color: "#64748b" }}>
                iOS & Android
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#a78bfa",
                }}
              >
                Web Apps
              </div>
              <div style={{ fontSize: 18, color: "#64748b" }}>
                React & Next.js
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#64748b",
          }}
        >
          rux.sh
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
