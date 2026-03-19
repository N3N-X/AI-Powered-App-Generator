import { cn } from "@/lib/utils";

interface RuxLogoProps {
  className?: string;
  showText?: boolean;
  showBackground?: boolean;
}

export function RuxLogo({
  className,
  showText = false,
  showBackground = true,
}: RuxLogoProps) {
  if (showText) {
    // Horizontal logo with text for navbar - no background, larger icon
    return (
      <svg
        viewBox="0 0 320 80"
        className={cn("", className)}
        aria-label="Rulxy Logo"
      >
        <defs>
          <linearGradient id="logoGradH" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="accentGradH" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <filter id="glowH">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring - centered at 40, 40 */}
        <circle
          cx="40"
          cy="40"
          r="32"
          fill="none"
          stroke="url(#logoGradH)"
          strokeWidth="1.5"
          opacity="0.3"
        />

        {/* Hexagonal shape */}
        <path
          d="M 40 10 L 66 25 L 66 55 L 40 70 L 14 55 L 14 25 Z"
          fill="none"
          stroke="url(#logoGradH)"
          strokeWidth="1.2"
          strokeLinejoin="round"
          opacity="0.5"
        />

        {/* Inner hexagon fill */}
        <path
          d="M 40 16 L 61 28 L 61 52 L 40 64 L 19 52 L 19 28 Z"
          fill="url(#logoGradH)"
          opacity="0.15"
        />

        {/* Core diamond */}
        <path
          d="M 40 26 L 54 40 L 40 54 L 26 40 Z"
          fill="url(#logoGradH)"
          opacity="0.9"
          filter="url(#glowH)"
        />

        {/* Connection lines */}
        <line
          x1="40"
          y1="26"
          x2="40"
          y2="10"
          stroke="url(#accentGradH)"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <line
          x1="54"
          y1="40"
          x2="66"
          y2="40"
          stroke="url(#accentGradH)"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <line
          x1="26"
          y1="40"
          x2="14"
          y2="40"
          stroke="url(#accentGradH)"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <line
          x1="40"
          y1="54"
          x2="40"
          y2="70"
          stroke="url(#accentGradH)"
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Node dots */}
        <circle cx="40" cy="10" r="3.5" fill="#A855F7" filter="url(#glowH)" />
        <circle cx="66" cy="40" r="3.5" fill="#C084FC" filter="url(#glowH)" />
        <circle cx="14" cy="40" r="3.5" fill="#C084FC" filter="url(#glowH)" />
        <circle cx="40" cy="70" r="3.5" fill="#EC4899" filter="url(#glowH)" />

        {/* Corner accent dots */}
        <circle cx="61" cy="28" r="2.5" fill="#A855F7" opacity="0.7" />
        <circle cx="61" cy="52" r="2.5" fill="#C084FC" opacity="0.7" />
        <circle cx="19" cy="28" r="2.5" fill="#C084FC" opacity="0.7" />
        <circle cx="19" cy="52" r="2.5" fill="#A855F7" opacity="0.7" />

        {/* Rulxy wordmark - adaptive text color */}
        <text
          x="195"
          y="52"
          textAnchor="middle"
          fontFamily="'SF Pro Display', 'Segoe UI', 'Helvetica Neue', sans-serif"
          fontSize="36"
          fontWeight="700"
          letterSpacing="4"
          className="fill-gray-600 dark:fill-slate-300"
        >
          Rulxy
        </text>

        {/* Accent underline */}
        <line
          x1="100"
          y1="62"
          x2="290"
          y2="62"
          stroke="url(#accentGradH)"
          strokeWidth="1.5"
          opacity="0.4"
        />
      </svg>
    );
  }

  // Square icon for favicon/small use - keeps background
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("", className)}
      aria-label="Rulxy Logo"
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      {showBackground && <rect width="64" height="64" rx="10" fill="#0D0D12" />}

      {/* Outer ring */}
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke="url(#logoGrad)"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* Hexagonal shape */}
      <path
        d="M 32 10 L 51 21 L 51 43 L 32 54 L 13 43 L 13 21 Z"
        fill="none"
        stroke="url(#logoGrad)"
        strokeWidth="0.8"
        strokeLinejoin="round"
        opacity="0.5"
      />

      {/* Inner hexagon fill */}
      <path
        d="M 32 14 L 47 23 L 47 41 L 32 50 L 17 41 L 17 23 Z"
        fill="url(#logoGrad)"
        opacity="0.15"
      />

      {/* Core diamond */}
      <path
        d="M 32 22 L 42 32 L 32 42 L 22 32 Z"
        fill="url(#logoGrad)"
        opacity="0.9"
        filter="url(#glow)"
      />

      {/* Connection lines */}
      <line
        x1="32"
        y1="22"
        x2="32"
        y2="10"
        stroke="url(#accentGrad)"
        strokeWidth="1"
        opacity="0.6"
      />
      <line
        x1="42"
        y1="32"
        x2="51"
        y2="32"
        stroke="url(#accentGrad)"
        strokeWidth="1"
        opacity="0.6"
      />
      <line
        x1="22"
        y1="32"
        x2="13"
        y2="32"
        stroke="url(#accentGrad)"
        strokeWidth="1"
        opacity="0.6"
      />
      <line
        x1="32"
        y1="42"
        x2="32"
        y2="54"
        stroke="url(#accentGrad)"
        strokeWidth="1"
        opacity="0.6"
      />

      {/* Node dots */}
      <circle cx="32" cy="10" r="2.5" fill="#A855F7" filter="url(#glow)" />
      <circle cx="51" cy="32" r="2.5" fill="#C084FC" filter="url(#glow)" />
      <circle cx="13" cy="32" r="2.5" fill="#C084FC" filter="url(#glow)" />
      <circle cx="32" cy="54" r="2.5" fill="#EC4899" filter="url(#glow)" />

      {/* Corner accent dots */}
      <circle cx="47" cy="23" r="1.5" fill="#A855F7" opacity="0.7" />
      <circle cx="47" cy="41" r="1.5" fill="#C084FC" opacity="0.7" />
      <circle cx="17" cy="23" r="1.5" fill="#C084FC" opacity="0.7" />
      <circle cx="17" cy="41" r="1.5" fill="#A855F7" opacity="0.7" />
    </svg>
  );
}
