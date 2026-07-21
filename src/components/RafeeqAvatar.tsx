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
        <radialGradient id="rc-skin" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#EAA870" />
          <stop offset="100%" stopColor="#C87840" />
        </radialGradient>
        <radialGradient id="rc-iris-l" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#4A2C10" />
          <stop offset="100%" stopColor="#1A0800" />
        </radialGradient>
        <radialGradient id="rc-iris-r" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#4A2C10" />
          <stop offset="100%" stopColor="#1A0800" />
        </radialGradient>
        <radialGradient id="rc-kuma" cx="50%" cy="60%" r="70%">
          <stop offset="0%" stopColor="#226644" />
          <stop offset="100%" stopColor="#0F3D28" />
        </radialGradient>
      </defs>

      {/* ── DISHDASHA ── */}
      <path
        d="M 2 115 L 2 102 Q 16 91 50 89 Q 84 91 98 102 L 98 115Z"
        fill="#F8F8F8"
      />
      {/* Collar shadow */}
      <path
        d="M 38 90 Q 50 95 62 90 Q 56 93 50 93.5 Q 44 93 38 90Z"
        fill="#D8D0C8" opacity="0.4"
      />
      {/* Centre seam */}
      <path d="M 50 89 L 50 106" stroke="#E0D8D0" strokeWidth="0.7" />
      {/* Gold button */}
      <circle cx="50" cy="99" r="2.2" fill="#D4AF37" />
      <circle cx="50" cy="99" r="1.1" fill="#F0CC50" />

      {/* ── NECK ── */}
      <path
        d="M 42 88 Q 42 97 50 98.5 Q 58 97 58 88 L 56 80 L 50 78 L 44 80Z"
        fill="url(#rc-skin)"
      />
      <path
        d="M 43 88 Q 45 95 50 96 Q 43 94 42 88Z"
        fill="#B87040" opacity="0.25"
      />

      {/* ── HEAD ── */}
      <ellipse cx="50" cy="59" rx="24" ry="28" fill="url(#rc-skin)" />
      {/* Cheek depth */}
      <ellipse cx="34" cy="68" rx="8" ry="7" fill="#D48C50" opacity="0.2" />
      <ellipse cx="66" cy="68" rx="8" ry="7" fill="#D48C50" opacity="0.2" />
      {/* Forehead light */}
      <ellipse cx="50" cy="46" rx="11" ry="8" fill="#F0B078" opacity="0.35" />

      {/* ── EARS ── */}
      <path d="M 26 57 Q 22 62 24 69 Q 27 74 31 70 Q 34 64 30 57Z" fill="#C88048" />
      <path d="M 27.5 58.5 Q 25 63 26.5 68 Q 28.5 70.5 30 68 Q 31 64 29 58.5Z" fill="#A86030" />
      <path d="M 74 57 Q 78 62 76 69 Q 73 74 69 70 Q 66 64 70 57Z" fill="#C88048" />
      <path d="M 72.5 58.5 Q 75 63 73.5 68 Q 71.5 70.5 70 68 Q 69 64 71 58.5Z" fill="#A86030" />

      {/* ══════════════════════════════════════
          KUMA CAP — the signature Omani element
          ══════════════════════════════════════ */}

      {/* Cap dome */}
      <path
        d="M 27 53 Q 26 28 50 23 Q 74 28 73 53
           Q 64 42 50 40 Q 36 42 27 53Z"
        fill="url(#rc-kuma)"
      />
      {/* Cap base band */}
      <path
        d="M 27 53 Q 36 44 50 42 Q 64 44 73 53
           Q 64 50 50 49 Q 36 50 27 53Z"
        fill="#0C3020"
      />

      {/* ── KUMA EMBROIDERY (gold geometric) ── */}

      {/* Central 8-pointed star */}
      <path
        d="M50,27 L50.96,29.69 L53.54,28.46 L52.31,31.04
           L55,32 L52.31,32.96 L53.54,35.54 L50.96,34.31
           L50,37 L49.04,34.31 L46.46,35.54 L47.69,32.96
           L45,32 L47.69,31.04 L46.46,28.46 L49.04,29.69Z"
        fill="#D4AF37"
      />
      <circle cx="50" cy="32" r="2" fill="#F0CC50" />
      <circle cx="50" cy="32" r="0.9" fill="#FFEAA0" />

      {/* Diamond lattice band (left side) */}
      <path d="M 34 43 L 37 40.5 L 40 43 L 37 45.5Z" fill="#D4AF37" opacity="0.9" />
      <path d="M 34 43 L 37 40.5 L 40 43 L 37 45.5Z" fill="none" stroke="#F0CC50" strokeWidth="0.4" />
      <circle cx="37" cy="43" r="0.7" fill="#FFEAA0" />

      <path d="M 41 41.5 L 44 39 L 47 41.5 L 44 44Z" fill="#D4AF37" opacity="0.9" />
      <circle cx="44" cy="41.5" r="0.7" fill="#FFEAA0" />

      <path d="M 53 41.5 L 56 39 L 59 41.5 L 56 44Z" fill="#D4AF37" opacity="0.9" />
      <circle cx="56" cy="41.5" r="0.7" fill="#FFEAA0" />

      <path d="M 60 43 L 63 40.5 L 66 43 L 63 45.5Z" fill="#D4AF37" opacity="0.9" />
      <path d="M 60 43 L 63 40.5 L 66 43 L 63 45.5Z" fill="none" stroke="#F0CC50" strokeWidth="0.4" />
      <circle cx="63" cy="43" r="0.7" fill="#FFEAA0" />

      {/* Small corner accent dots */}
      <circle cx="30" cy="46" r="1.1" fill="#D4AF37" opacity="0.75" />
      <circle cx="70" cy="46" r="1.1" fill="#D4AF37" opacity="0.75" />
      <circle cx="50" cy="42" r="1.1" fill="#D4AF37" opacity="0.75" />

      {/* Gold trim ring at base of cap */}
      <path
        d="M 28 52 Q 36 46 50 44.5 Q 64 46 72 52"
        fill="none" stroke="#D4AF37" strokeWidth="1.6" strokeLinecap="round"
      />
      <path
        d="M 27.5 53.5 Q 36 47.5 50 46 Q 64 47.5 72.5 53.5"
        fill="none" stroke="#A88820" strokeWidth="0.7" strokeLinecap="round" opacity="0.6"
      />

      {/* ── FACE FEATURES ── */}

      {/* Eyebrows — confident, clean arch */}
      <path
        d="M 31.5 51 Q 38 47.5 44.5 50"
        fill="none" stroke="#1E1008" strokeWidth="2.5" strokeLinecap="round"
      />
      <path
        d="M 55.5 50 Q 62 47.5 68.5 51"
        fill="none" stroke="#1E1008" strokeWidth="2.5" strokeLinecap="round"
      />
      {/* Eyebrow depth */}
      <path
        d="M 31.5 51 Q 38 48 44.5 50.5"
        fill="none" stroke="#4A2C10" strokeWidth="1" strokeLinecap="round" opacity="0.4"
      />

      {/* Left eye */}
      <ellipse cx="38" cy="59" rx="6.5" ry="5" fill="white" />
      {/* Iris */}
      <ellipse cx="38" cy="59.4" rx="4.5" ry="4.3" fill="url(#rc-iris-l)" />
      {/* Pupil */}
      <ellipse cx="38" cy="59.4" rx="2.8" ry="2.8" fill="#0C0400" />
      {/* Main shine — large */}
      <ellipse cx="40" cy="57.5" rx="2" ry="1.7" fill="white" opacity="0.95" />
      {/* Small secondary shine */}
      <circle cx="36.2" cy="61" r="0.85" fill="white" opacity="0.5" />
      {/* Upper eyelid */}
      <path d="M 31.5 57 Q 38 52.5 44.5 57" fill="none" stroke="#1A0C06" strokeWidth="1.3" opacity="0.8" />
      {/* Lower lash */}
      <path d="M 32 61.5 Q 38 64 44 61.5" fill="none" stroke="#2C1408" strokeWidth="0.6" opacity="0.25" />

      {/* Right eye */}
      <ellipse cx="62" cy="59" rx="6.5" ry="5" fill="white" />
      <ellipse cx="62" cy="59.4" rx="4.5" ry="4.3" fill="url(#rc-iris-r)" />
      <ellipse cx="62" cy="59.4" rx="2.8" ry="2.8" fill="#0C0400" />
      <ellipse cx="64" cy="57.5" rx="2" ry="1.7" fill="white" opacity="0.95" />
      <circle cx="60.2" cy="61" r="0.85" fill="white" opacity="0.5" />
      <path d="M 55.5 57 Q 62 52.5 68.5 57" fill="none" stroke="#1A0C06" strokeWidth="1.3" opacity="0.8" />
      <path d="M 56 61.5 Q 62 64 68 61.5" fill="none" stroke="#2C1408" strokeWidth="0.6" opacity="0.25" />

      {/* Nose — refined, natural */}
      <path
        d="M 50 65 Q 48 70 47 72.5 Q 49 73.8 50 73.5 Q 51 73.8 53 72.5 Q 52 70 50 65Z"
        fill="none" stroke="#A86030" strokeWidth="0.9" strokeLinecap="round" opacity="0.55"
      />
      <ellipse cx="47" cy="72" rx="2.6" ry="1.9" fill="#B07038" opacity="0.28" />
      <ellipse cx="53" cy="72" rx="2.6" ry="1.9" fill="#B07038" opacity="0.28" />

      {/* ── WARM, CONFIDENT SMILE ── */}
      {/* Mouth shadow */}
      <path
        d="M 41.5 77 Q 50 83 58.5 77 Q 54.5 81 50 81.5 Q 45.5 81 41.5 77Z"
        fill="#7A2A12"
      />
      {/* Teeth */}
      <path
        d="M 42.5 77.8 Q 50 82 57.5 77.8 Q 54 80.5 50 81 Q 46 80.5 42.5 77.8Z"
        fill="#FAFAF8"
      />
      {/* Tooth line */}
      <line x1="50" y1="77.8" x2="50" y2="81" stroke="#E4DED8" strokeWidth="0.5" />
      {/* Upper lip */}
      <path
        d="M 41.5 77 Q 45.5 74.8 50 75.8 Q 54.5 74.8 58.5 77
           Q 55 76 50 76.5 Q 45 76 41.5 77Z"
        fill="#A84030"
      />
      {/* Lower lip highlight */}
      <path
        d="M 43.5 78.5 Q 50 81 56.5 78.5 Q 53 80.5 50 81 Q 47 80.5 43.5 78.5Z"
        fill="#C86050" opacity="0.3"
      />
      {/* Dimples */}
      <circle cx="39.5" cy="77.5" r="2" fill="#C07840" opacity="0.3" />
      <circle cx="60.5" cy="77.5" r="2" fill="#C07840" opacity="0.3" />

      {/* Cheek warmth */}
      <ellipse cx="33" cy="69" rx="7.5" ry="5.5" fill="#E06040" opacity="0.14" />
      <ellipse cx="67" cy="69" rx="7.5" ry="5.5" fill="#E06040" opacity="0.14" />

      {/* Chin shadow */}
      <path
        d="M 39 82 Q 50 87 61 82 Q 55 85.5 50 86 Q 45 85.5 39 82Z"
        fill="#B07840" opacity="0.28"
      />
    </svg>
  );
}
