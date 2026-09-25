import { useId } from "react";
import { cn } from "@/utils/cn";

type View = "front" | "back";

export function PhoneMockup({
  color = "#242527",
  view = "back",
  className,
  glow = "#c4c4c4",
}: {
  color?: string;
  view?: View;
  className?: string;
  glow?: string;
}) {
  const raw = useId();
  const uid = raw.replace(/[:]/g, "");

  const frameId = `f-${uid}`;
  const glossId = `g-${uid}`;
  const bumpId = `b-${uid}`;
  const lensId = `l-${uid}`;
  const screenId = `s-${uid}`;
  const ringId = `r-${uid}`;

  return (
    <svg
      viewBox="0 0 260 520"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={`iPhone ${view === "front" ? "frente" : "dorso"}`}
    >
      <defs>
        <linearGradient id={frameId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#85888b" />
          <stop offset="0.5" stopColor="#292b2d" />
          <stop offset="1" stopColor="#171819" />
        </linearGradient>
        <linearGradient id={glossId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={bumpId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#343638" />
          <stop offset="1" stopColor="#171819" />
        </linearGradient>
        <radialGradient id={lensId} cx="0.38" cy="0.34" r="0.85">
          <stop offset="0" stopColor="#343638" />
          <stop offset="0.5" stopColor="#08090a" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
        <radialGradient id={screenId} cx="0.5" cy="0.32" r="0.95">
          <stop offset="0" stopColor="#242527" />
          <stop offset="0.45" stopColor="#171819" />
          <stop offset="1" stopColor="#0d0d0d" />
        </radialGradient>
        <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e2e3e5" />
          <stop offset="0.5" stopColor="#777a7e" />
          <stop offset="1" stopColor="#242527" />
        </linearGradient>
        <filter id={`sh-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="20"
            floodColor="#000000"
            floodOpacity="0.55"
          />
        </filter>
      </defs>

      {/* Body / frame */}
      <g filter={`url(#sh-${uid})`}>
        <rect x="14" y="10" width="232" height="500" rx="46" fill={`url(#${frameId})`} />
      </g>

      {view === "back" ? (
        <>
          {/* Back glass */}
          <rect x="22" y="18" width="216" height="484" rx="40" fill={color} />
          <rect x="22" y="18" width="216" height="484" rx="40" fill={`url(#${glossId})`} />

          {/* Camera bump */}
          <g>
            <rect
              x="42"
              y="40"
              width="104"
              height="104"
              rx="30"
              fill="#0d0d0d"
              opacity="0.6"
              transform="translate(0,4)"
            />
            <rect x="42" y="38" width="104" height="104" rx="30" fill={`url(#${bumpId})`} />
            <rect
              x="42"
              y="38"
              width="104"
              height="104"
              rx="30"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />

            {/* Lenses */}
            {[
              [70, 66],
              [118, 66],
              [94, 114],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="23" fill={`url(#${ringId})`} />
                <circle cx={cx} cy={cy} r="19" fill="#08090a" />
                <circle cx={cx} cy={cy} r="16" fill={`url(#${lensId})`} />
                <circle
                  cx={cx - 5}
                  cy={cy - 6}
                  r="3.4"
                  fill={glow}
                  opacity="0.5"
                />
                <circle cx={cx + 4} cy={cy + 5} r="2" fill="#171819" opacity="0.8" />
              </g>
            ))}

            {/* Flash + sensor */}
            <circle cx="132" cy="100" r="9" fill="#202123" />
            <circle cx="132" cy="100" r="5.5" fill="#f5f5f5" opacity="0.9" />
            <circle cx="132" cy="76" r="6.5" fill="#0d0d0d" />
          </g>
        </>
      ) : (
        <>
          {/* Screen */}
          <rect x="26" y="22" width="208" height="476" rx="38" fill={`url(#${screenId})`} />
          <rect x="26" y="22" width="208" height="476" rx="38" fill={`url(#${glossId})`} opacity="0.5" />
          {/* Dynamic Island */}
          <rect x="104" y="40" width="52" height="16" rx="8" fill="#000000" />
          <circle cx="146" cy="48" r="3" fill="#171819" />
          {/* Home indicator */}
          <rect x="110" y="482" width="40" height="5" rx="2.5" fill="rgba(255,255,255,0.28)" />
        </>
      )}

      {/* Frame sheen */}
      <rect
        x="14"
        y="10"
        width="232"
        height="500"
        rx="46"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.5"
      />
      <rect
        x="22"
        y="18"
        width="216"
        height="484"
        rx="40"
        fill="none"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
      />
    </svg>
  );
}
