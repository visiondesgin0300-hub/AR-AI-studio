interface RafeeqAvatarProps {
  className?: string;
}

export function RafeeqAvatar({ className }: RafeeqAvatarProps) {
  return (
    <svg
      viewBox="0 0 100 115"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      aria-label="Rafeeq"
    >
      <defs>
        <radialGradient id="rq-head" cx="40%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#005E8A" />
          <stop offset="100%" stopColor="#002438" />
        </radialGradient>
        <radialGradient id="rq-body" cx="40%" cy="22%" r="72%">
          <stop offset="0%"   stopColor="#004D72" />
          <stop offset="100%" stopColor="#001E30" />
        </radialGradient>
        <radialGradient id="rq-eye" cx="30%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#B0F6FF" />
          <stop offset="40%"  stopColor="#00D8F4" />
          <stop offset="100%" stopColor="#009AB8" />
        </radialGradient>
        <radialGradient id="rq-orb" cx="33%" cy="33%" r="67%">
          <stop offset="0%"   stopColor="#FFE878" />
          <stop offset="60%"  stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9A7018" />
        </radialGradient>
      </defs>

      {/* ── BODY ── */}
      <rect x="18" y="66" width="64" height="47" rx="18" fill="url(#rq-body)" />
      <rect x="18" y="66" width="64" height="22" rx="18" fill="white" opacity="0.07" />
      <ellipse cx="50" cy="111" rx="28" ry="5" fill="#000D14" opacity="0.3" />

      {/* Corner rivets */}
      <circle cx="25" cy="73" r="2.8" fill="#002438" stroke="#00567A" strokeWidth="1" />
      <circle cx="75" cy="73" r="2.8" fill="#002438" stroke="#00567A" strokeWidth="1" />
      <circle cx="25" cy="106" r="2.8" fill="#002438" stroke="#00567A" strokeWidth="1" />
      <circle cx="75" cy="106" r="2.8" fill="#002438" stroke="#00567A" strokeWidth="1" />

      {/* ── CHEST PANEL ── */}
      <rect x="30" y="74" width="40" height="30" rx="9" fill="#001624" />
      <rect x="30" y="74" width="40" height="12" rx="9" fill="white" opacity="0.04" />

      {/* Open book icon on chest */}
      <rect x="35" y="79" width="11" height="14" rx="2" fill="#D4AF37" />
      <rect x="36.5" y="79" width="9.5" height="14" rx="1.5" fill="#C09828" />
      <rect x="46" y="79" width="11" height="14" rx="2" fill="#F0F0EA" />
      <line x1="48.2" y1="80" x2="48.2" y2="92" stroke="#D0C8C0" strokeWidth="0.6" />
      <line x1="50.8" y1="80" x2="50.8" y2="92" stroke="#D0C8C0" strokeWidth="0.6" />
      <line x1="53.4" y1="80" x2="53.4" y2="92" stroke="#D0C8C0" strokeWidth="0.6" />
      <rect x="45.5" y="79" width="1" height="14" rx="0.5" fill="#8A6010" />

      {/* AR scan line */}
      <line x1="31" y1="99" x2="69" y2="99" stroke="#00D8FF" strokeWidth="0.8" opacity="0.7" />
      <circle cx="31" cy="99" r="1.4" fill="#00D8FF" opacity="0.9" />
      <circle cx="69" cy="99" r="1.4" fill="#00D8FF" opacity="0.9" />
      <line x1="40" y1="97.5" x2="40" y2="100.5" stroke="#00D8FF" strokeWidth="0.5" opacity="0.5" />
      <line x1="50" y1="97.5" x2="50" y2="100.5" stroke="#00D8FF" strokeWidth="0.5" opacity="0.5" />
      <line x1="60" y1="97.5" x2="60" y2="100.5" stroke="#00D8FF" strokeWidth="0.5" opacity="0.5" />

      {/* ── NECK ── */}
      <rect x="42" y="58" width="16" height="10" rx="5" fill="#002438" />
      <line x1="46" y1="60.5" x2="46" y2="65.5" stroke="#003A55" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="50" y1="60.5" x2="50" y2="65.5" stroke="#003A55" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="54" y1="60.5" x2="54" y2="65.5" stroke="#003A55" strokeWidth="1.8" strokeLinecap="round" />

      {/* ── HEAD ── */}
      <rect x="14" y="14" width="72" height="46" rx="18" fill="url(#rq-head)" />
      <rect x="14" y="14" width="72" height="22" rx="18" fill="white" opacity="0.09" />
      <rect x="14" y="20" width="5" height="32" rx="2.5" fill="white" opacity="0.05" />
      <rect x="81" y="20" width="5" height="32" rx="2.5" fill="white" opacity="0.05" />

      {/* Head corner rivets */}
      <circle cx="21" cy="21" r="3" fill="#002438" stroke="#00567A" strokeWidth="1" />
      <circle cx="79" cy="21" r="3" fill="#002438" stroke="#00567A" strokeWidth="1" />
      <circle cx="21" cy="53" r="3" fill="#002438" stroke="#00567A" strokeWidth="1" />
      <circle cx="79" cy="53" r="3" fill="#002438" stroke="#00567A" strokeWidth="1" />

      {/* ── ANTENNA ── */}
      <line x1="50" y1="14" x2="50" y2="5" stroke="#B8901C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="14" r="3.5" fill="#003A55" />
      <circle cx="50" cy="14" r="2"   fill="#D4AF37" />
      <circle cx="50" cy="4"  r="5.5" fill="url(#rq-orb)" />
      <circle cx="50" cy="4"  r="3.2" fill="#F0CC50" />
      <circle cx="50" cy="4"  r="1.6" fill="#FFEEAA" />
      <circle cx="51.8" cy="2.4" r="1.2" fill="white" opacity="0.7" />

      {/* ── SIDE EAR PANELS ── */}
      <rect x="6"  y="26" width="9" height="22" rx="4.5" fill="#002A3E" stroke="#003A55" strokeWidth="0.8" />
      <line x1="9"  y1="31" x2="12" y2="31" stroke="#005070" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="35" x2="12" y2="35" stroke="#005070" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="39" x2="12" y2="39" stroke="#005070" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="43" x2="12" y2="43" stroke="#005070" strokeWidth="1.5" strokeLinecap="round" />

      <rect x="85" y="26" width="9" height="22" rx="4.5" fill="#002A3E" stroke="#003A55" strokeWidth="0.8" />
      <line x1="88" y1="31" x2="91" y2="31" stroke="#005070" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="88" y1="35" x2="91" y2="35" stroke="#005070" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="88" y1="39" x2="91" y2="39" stroke="#005070" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="88" y1="43" x2="91" y2="43" stroke="#005070" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── FACE SCREEN PANEL ── */}
      <rect x="20" y="19" width="60" height="38" rx="12" fill="#000E1C" />
      <rect x="21" y="20" width="58" height="15" rx="11" fill="white" opacity="0.04" />

      {/* Status LED */}
      <circle cx="50" cy="22" r="2.5" fill="#00FF88" />
      <circle cx="50" cy="22" r="1.3" fill="#AAFFD8" />

      {/* ── LEFT EYE SCREEN ── */}
      <rect x="23" y="26" width="22" height="18" rx="7" fill="#000A14" />
      <rect x="24" y="27" width="20" height="8"  rx="6" fill="white" opacity="0.03" />
      <circle cx="34" cy="35" r="7.5" fill="#003A55" opacity="0.5" />
      <circle cx="34" cy="35" r="6.5" fill="url(#rq-eye)" />
      <circle cx="34" cy="35" r="3.8" fill="#001828" />
      <circle cx="34" cy="35" r="2.2" fill="#002E44" />
      <ellipse cx="36.5" cy="32.5" rx="2.4" ry="1.9" fill="white" opacity="0.92" />
      <circle  cx="31.8" cy="37.2" r="1"   fill="white" opacity="0.45" />
      <line x1="24" y1="35" x2="44" y2="35" stroke="#00F0FF" strokeWidth="0.5" opacity="0.3" />

      {/* ── RIGHT EYE SCREEN ── */}
      <rect x="55" y="26" width="22" height="18" rx="7" fill="#000A14" />
      <rect x="56" y="27" width="20" height="8"  rx="6" fill="white" opacity="0.03" />
      <circle cx="66" cy="35" r="7.5" fill="#003A55" opacity="0.5" />
      <circle cx="66" cy="35" r="6.5" fill="url(#rq-eye)" />
      <circle cx="66" cy="35" r="3.8" fill="#001828" />
      <circle cx="66" cy="35" r="2.2" fill="#002E44" />
      <ellipse cx="68.5" cy="32.5" rx="2.4" ry="1.9" fill="white" opacity="0.92" />
      <circle  cx="63.8" cy="37.2" r="1"   fill="white" opacity="0.45" />
      <line x1="56" y1="35" x2="76" y2="35" stroke="#00F0FF" strokeWidth="0.5" opacity="0.3" />

      {/* ── CLOSED SMILE — smooth glowing arc, no dots ── */}
      {/* Soft outer glow */}
      <path
        d="M 33 49 Q 50 61 67 49"
        fill="none" stroke="#00D8FF" strokeWidth="5.5" strokeLinecap="round" opacity="0.18"
      />
      {/* Mid glow */}
      <path
        d="M 33 49 Q 50 61 67 49"
        fill="none" stroke="#00D8FF" strokeWidth="3.5" strokeLinecap="round" opacity="0.35"
      />
      {/* Bright core line */}
      <path
        d="M 33 49 Q 50 61 67 49"
        fill="none" stroke="#00F0FF" strokeWidth="2" strokeLinecap="round"
      />
    </svg>
  );
}
