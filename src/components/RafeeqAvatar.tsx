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
        {/* Red-white checkered pattern for ghutra */}
        <pattern id="rc-ghutra" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#F5ECEC" />
          <rect x="0" y="0" width="2.5" height="2.5" fill="#C42C2C" opacity="0.82" />
          <rect x="2.5" y="2.5" width="2.5" height="2.5" fill="#C42C2C" opacity="0.82" />
        </pattern>
        {/* Softer diagonal lines for ghutra texture */}
        <pattern id="rc-ghutra2" x="0" y="0" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#EEE4E4" />
          <rect x="0" y="0" width="2.5" height="2.5" fill="#B82828" opacity="0.7" />
          <rect x="2.5" y="2.5" width="2.5" height="2.5" fill="#B82828" opacity="0.7" />
        </pattern>
      </defs>

      {/* ── DISHDASHA ── */}
      <path
        d="M 5 115 L 4 100 Q 15 90 50 88 Q 85 90 96 100 L 95 115Z"
        fill="#FAFAFA" stroke="#E8E8E8" strokeWidth="0.5"
      />
      {/* Collar */}
      <path d="M 50 88 L 50 102" stroke="#DCDCDC" strokeWidth="0.8" />
      {/* Gold buttons */}
      <circle cx="50" cy="97" r="1.7" fill="#D4AF37" />
      <circle cx="50" cy="103" r="1.7" fill="#D4AF37" />
      {/* Subtle chest shadow */}
      <ellipse cx="50" cy="100" rx="14" ry="7" fill="#D0C8C0" opacity="0.1" />

      {/* ── NECK ── */}
      <path
        d="M 43 87 Q 43 96 50 97 Q 57 96 57 87 L 55 80 L 50 78 L 45 80Z"
        fill="#D08C56"
      />
      {/* Neck shadow */}
      <path d="M 44 87 Q 46 93 50 94 Q 44 92 43 87Z" fill="#B87040" opacity="0.3" />

      {/* ── HEAD ── */}
      <ellipse cx="50" cy="60" rx="23" ry="26" fill="#D89060" />
      {/* Face shading/depth */}
      <ellipse cx="50" cy="65" rx="18" ry="20" fill="#E09868" opacity="0.4" />
      {/* Forehead highlight */}
      <ellipse cx="50" cy="50" rx="10" ry="7" fill="#EAA870" opacity="0.3" />

      {/* ── EARS ── */}
      <path d="M 27 58 Q 23 63 25 70 Q 28 74 32 71 Q 34 65 30 58Z" fill="#C88250" />
      <path d="M 28.5 59 Q 26 64 27.5 69 Q 29.5 71 31 69 Q 32 65 30 59Z" fill="#B07040" />
      <path d="M 73 58 Q 77 63 75 70 Q 72 74 68 71 Q 66 65 70 58Z" fill="#C88250" />
      <path d="M 71.5 59 Q 74 64 72.5 69 Q 70.5 71 69 69 Q 68 65 70 59Z" fill="#B07040" />

      {/* ── GHUTRA / KEFFIYEH ── */}
      {/* Inner white layer — forehead band */}
      <path
        d="M 27 57 Q 27 36 50 31 Q 73 36 73 57
           Q 66 46 50 43 Q 34 46 27 57Z"
        fill="#F8F3EE"
      />
      {/* White inner top cap */}
      <path
        d="M 30 50 Q 32 32 50 28 Q 68 32 70 50
           Q 63 40 50 38 Q 37 40 30 50Z"
        fill="#F0EAE0"
      />

      {/* Main outer ghutra — checkered */}
      <path
        d="M 26 57 Q 25 28 50 23 Q 75 28 74 57
           Q 67 43 50 40 Q 33 43 26 57Z"
        fill="url(#rc-ghutra)"
      />

      {/* Left drape going down shoulder (distinctive ghutra style) */}
      <path
        d="M 26 57 Q 20 64 17 78 Q 15 90 18 100
           Q 24 88 28 74 Q 30 64 26 57Z"
        fill="url(#rc-ghutra2)"
      />
      {/* Left drape fold edge */}
      <path
        d="M 26 57 Q 20 64 17 78 Q 15 90 18 100"
        fill="none" stroke="#D8CECE" strokeWidth="0.8" opacity="0.6"
      />

      {/* Right shorter drape */}
      <path
        d="M 74 57 Q 80 63 82 74 Q 80 76 76 72 Q 75 65 74 57Z"
        fill="url(#rc-ghutra2)"
      />

      {/* Ghutra fold crease (where cloth wraps over) */}
      <path
        d="M 27 57 Q 34 47 50 44 Q 66 47 73 57"
        fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.7"
      />
      <path
        d="M 27 57 Q 34 47 50 44 Q 66 47 73 57"
        fill="none" stroke="#D0C0C0" strokeWidth="0.6" strokeLinecap="round" opacity="0.5"
      />
      {/* Second fold line */}
      <path
        d="M 28 53 Q 35 44 50 41 Q 65 44 72 53"
        fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.4"
      />

      {/* ── FACE FEATURES ── */}

      {/* Eyebrows — clean, confident arches */}
      <path
        d="M 31 52 Q 38 48.5 45 51"
        fill="none" stroke="#1E1008" strokeWidth="2.4" strokeLinecap="round"
      />
      <path
        d="M 55 51 Q 62 48.5 69 52"
        fill="none" stroke="#1E1008" strokeWidth="2.4" strokeLinecap="round"
      />

      {/* Left eye — large, expressive, cartoon style */}
      <ellipse cx="38" cy="59" rx="6.8" ry="5.2" fill="white" />
      <ellipse cx="38" cy="59.5" rx="4.8" ry="4.5" fill="#2C1408" />
      <ellipse cx="38" cy="59.5" rx="3.4" ry="3.4" fill="#0C0400" />
      {/* Large shine */}
      <circle cx="40" cy="57.5" r="2.2" fill="white" opacity="0.95" />
      {/* Small secondary shine */}
      <circle cx="36.5" cy="61" r="0.9" fill="white" opacity="0.55" />
      {/* Eyelid line */}
      <path d="M 31 57 Q 38 53 45 57" fill="none" stroke="#1E1008" strokeWidth="1.2" opacity="0.75" />
      {/* Lower lid subtle */}
      <path d="M 31.5 61.5 Q 38 64.5 44.5 61.5" fill="none" stroke="#2C1408" strokeWidth="0.6" opacity="0.3" />
      {/* Eyelashes top */}
      <path d="M 31.5 57.2 L 30.5 55.8" stroke="#1E1008" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 44.5 57.2 L 45.5 55.8" stroke="#1E1008" strokeWidth="0.8" strokeLinecap="round" />

      {/* Right eye */}
      <ellipse cx="62" cy="59" rx="6.8" ry="5.2" fill="white" />
      <ellipse cx="62" cy="59.5" rx="4.8" ry="4.5" fill="#2C1408" />
      <ellipse cx="62" cy="59.5" rx="3.4" ry="3.4" fill="#0C0400" />
      <circle cx="64" cy="57.5" r="2.2" fill="white" opacity="0.95" />
      <circle cx="60.5" cy="61" r="0.9" fill="white" opacity="0.55" />
      <path d="M 55 57 Q 62 53 69 57" fill="none" stroke="#1E1008" strokeWidth="1.2" opacity="0.75" />
      <path d="M 55.5 61.5 Q 62 64.5 68.5 61.5" fill="none" stroke="#2C1408" strokeWidth="0.6" opacity="0.3" />
      <path d="M 55.5 57.2 L 54.5 55.8" stroke="#1E1008" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 68.5 57.2 L 69.5 55.8" stroke="#1E1008" strokeWidth="0.8" strokeLinecap="round" />

      {/* Nose — simple, stylized */}
      <path
        d="M 50 65 Q 48 70.5 47 72.5 Q 49 73.5 50 73.2 Q 51 73.5 53 72.5 Q 52 70.5 50 65Z"
        fill="none" stroke="#B06830" strokeWidth="0.9" opacity="0.55"
      />
      <ellipse cx="47" cy="72" rx="2.8" ry="2" fill="#B06830" opacity="0.28" />
      <ellipse cx="53" cy="72" rx="2.8" ry="2" fill="#B06830" opacity="0.28" />

      {/* ── BIG CHEERFUL SMILE ── */}
      {/* Mouth cavity */}
      <path d="M 40.5 77.5 Q 50 87 59.5 77.5 Q 55 84 50 84.5 Q 45 84 40.5 77.5Z" fill="#7A2010" />
      {/* Teeth */}
      <path d="M 41.5 78.5 Q 50 83.5 58.5 78.5 Q 55 81 50 81.5 Q 45 81 41.5 78.5Z" fill="white" />
      {/* Tooth divider */}
      <line x1="50" y1="78.5" x2="50" y2="81.5" stroke="#E8E0D8" strokeWidth="0.5" />
      {/* Upper lip */}
      <path
        d="M 40.5 77.5 Q 45 75 50 76 Q 55 75 59.5 77.5 Q 55.5 76.5 50 77 Q 44.5 76.5 40.5 77.5Z"
        fill="#A84030"
      />
      {/* Smile crease dimples */}
      <circle cx="39" cy="77" r="1.8" fill="#C07840" opacity="0.35" />
      <circle cx="61" cy="77" r="1.8" fill="#C07840" opacity="0.35" />

      {/* ── CHEEK GLOW (cartoon warmth) ── */}
      <ellipse cx="34.5" cy="70" rx="7" ry="5" fill="#E86050" opacity="0.18" />
      <ellipse cx="65.5" cy="70" rx="7" ry="5" fill="#E86050" opacity="0.18" />

      {/* Chin definition (clean-shaven) */}
      <path d="M 38 82 Q 50 86 62 82 Q 55 85 50 85.5 Q 45 85 38 82Z" fill="#C07A48" opacity="0.3" />
    </svg>
  );
}
