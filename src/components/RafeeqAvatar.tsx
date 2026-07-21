interface RafeeqAvatarProps {
  className?: string;
}

export function RafeeqAvatar({ className }: RafeeqAvatarProps) {
  return (
    <svg
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      aria-label="Rafeeq"
    >
      {/* ── DISHDASHA BODY ── */}
      <path d="M 6 120 L 4 104 Q 18 94 50 92 Q 82 94 96 104 L 94 120Z" fill="#FAFAFA" />
      {/* Collar centre seam */}
      <path d="M 50 92 L 50 104" stroke="#E4E4E4" strokeWidth="0.7" />
      {/* Tassel */}
      <circle cx="50" cy="104" r="2" fill="#D4AF37" />
      <line x1="50" y1="106" x2="50" y2="111" stroke="#B89030" strokeWidth="1.2" strokeLinecap="round" />

      {/* ── NECK ── */}
      <path d="M 43 90 Q 43 97 50 98 Q 57 97 57 90 L 55 82 Q 50 80 50 80 Q 50 80 45 82Z" fill="#C07848" />

      {/* ── HEAD ── */}
      <ellipse cx="50" cy="62" rx="23" ry="27" fill="#C8804E" />

      {/* ── EARS ── */}
      <path d="M 27 60 Q 23 65 25 71 Q 28 75 32 72 Q 34 66 31 60Z" fill="#BF7242" />
      <path d="M 28.5 61 Q 26 66 28 70 Q 30 72 31.5 70 Q 32.5 66 30 61Z" fill="#A86030" />
      <path d="M 73 60 Q 77 65 75 71 Q 72 75 68 72 Q 66 66 69 60Z" fill="#BF7242" />
      <path d="M 71.5 61 Q 74 66 72 70 Q 70 72 68.5 70 Q 67.5 66 70 61Z" fill="#A86030" />

      {/* ── MUSSAR (wrapped head cloth) ── */}
      {/* Outer cloth — warm white */}
      <path
        d="M 27 59 Q 26 33 50 28 Q 74 33 73 59
           Q 67 48 50 45 Q 33 48 27 59Z"
        fill="#F4F0E6"
      />
      {/* Inner layer / fold depth */}
      <path
        d="M 27 59 Q 28 40 50 36 Q 72 40 73 59
           Q 68 51 50 48 Q 32 51 27 59Z"
        fill="#EAE5D8"
      />
      {/* Side drape left */}
      <path d="M 27 59 Q 22 64 23 73 Q 27 71 29 65 Q 30 61 27 59Z" fill="#E5E0D2" />
      {/* Side drape right */}
      <path d="M 73 59 Q 78 64 77 73 Q 73 71 71 65 Q 70 61 73 59Z" fill="#E5E0D2" />

      {/* ── MUSSAR EMBROIDERY ── */}
      {/* Gold border band along bottom edge */}
      <path
        d="M 27 59 Q 34 48 50 45 Q 66 48 73 59"
        fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round"
      />
      {/* Second inner gold line */}
      <path
        d="M 29 55 Q 36 44 50 41 Q 64 44 71 55"
        fill="none" stroke="#C8A030" strokeWidth="0.8" opacity="0.5" strokeLinecap="round"
      />

      {/* Teal floral – left cluster */}
      <circle cx="36" cy="47" r="2.4" fill="#3D9188" />
      <circle cx="36" cy="47" r="1.1" fill="#62B5AB" />
      <ellipse cx="33.3" cy="44.8" rx="1.6" ry="0.9" fill="#3D9188" transform="rotate(-25 33.3 44.8)" />
      <ellipse cx="38.7" cy="44.8" rx="1.6" ry="0.9" fill="#3D9188" transform="rotate(25 38.7 44.8)" />
      <ellipse cx="33.6" cy="49.3" rx="1.6" ry="0.9" fill="#3D9188" transform="rotate(15 33.6 49.3)" />
      <ellipse cx="38.4" cy="49.3" rx="1.6" ry="0.9" fill="#3D9188" transform="rotate(-15 38.4 49.3)" />
      {/* Gold dot near left */}
      <circle cx="41" cy="43.5" r="1.5" fill="#D4AF37" />
      <circle cx="41" cy="43.5" r="0.65" fill="#F2CC50" />

      {/* Gold floral – centre (larger, star-like) */}
      <circle cx="50" cy="36.5" r="2.8" fill="#D4AF37" />
      <circle cx="50" cy="36.5" r="1.3" fill="#F2CC50" />
      {/* 6 teal petals */}
      <ellipse cx="50" cy="33.2" rx="1" ry="1.8" fill="#3D9188" />
      <ellipse cx="52.9" cy="34.2" rx="1" ry="1.8" fill="#3D9188" transform="rotate(60 52.9 34.2)" />
      <ellipse cx="52.9" cy="38.8" rx="1" ry="1.8" fill="#3D9188" transform="rotate(120 52.9 38.8)" />
      <ellipse cx="50" cy="39.8" rx="1" ry="1.8" fill="#3D9188" />
      <ellipse cx="47.1" cy="38.8" rx="1" ry="1.8" fill="#3D9188" transform="rotate(60 47.1 38.8)" />
      <ellipse cx="47.1" cy="34.2" rx="1" ry="1.8" fill="#3D9188" transform="rotate(120 47.1 34.2)" />

      {/* Teal floral – right cluster */}
      <circle cx="64" cy="47" r="2.4" fill="#3D9188" />
      <circle cx="64" cy="47" r="1.1" fill="#62B5AB" />
      <ellipse cx="61.3" cy="44.8" rx="1.6" ry="0.9" fill="#3D9188" transform="rotate(25 61.3 44.8)" />
      <ellipse cx="66.7" cy="44.8" rx="1.6" ry="0.9" fill="#3D9188" transform="rotate(-25 66.7 44.8)" />
      <ellipse cx="61.6" cy="49.3" rx="1.6" ry="0.9" fill="#3D9188" transform="rotate(-15 61.6 49.3)" />
      <ellipse cx="66.4" cy="49.3" rx="1.6" ry="0.9" fill="#3D9188" transform="rotate(15 66.4 49.3)" />
      {/* Gold dot near right */}
      <circle cx="59" cy="43.5" r="1.5" fill="#D4AF37" />
      <circle cx="59" cy="43.5" r="0.65" fill="#F2CC50" />

      {/* Scattered small accent dots */}
      <circle cx="44" cy="34" r="0.9" fill="#D4AF37" />
      <circle cx="56" cy="34" r="0.9" fill="#D4AF37" />
      <circle cx="46.5" cy="31" r="0.7" fill="#3D9188" />
      <circle cx="53.5" cy="31" r="0.7" fill="#3D9188" />

      {/* ── FACE FEATURES ── */}

      {/* Eyebrows – dark, full, slightly arched */}
      <path d="M 32 54 Q 38 50.5 44.5 52" fill="none" stroke="#1A0C06" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M 55.5 52 Q 62 50.5 68 54" fill="none" stroke="#1A0C06" strokeWidth="2.2" strokeLinecap="round" />

      {/* Left eye */}
      <ellipse cx="38.5" cy="58.5" rx="5.8" ry="4.2" fill="white" />
      <ellipse cx="38.5" cy="59" rx="3.9" ry="3.7" fill="#3C200E" />
      <ellipse cx="38.5" cy="59" rx="2.7" ry="2.7" fill="#100600" />
      <circle cx="40.2" cy="57.5" r="1.4" fill="white" opacity="0.9" />
      {/* Upper eyelid line */}
      <path d="M 32.7 56.5 Q 38.5 53 44.3 56.5" fill="none" stroke="#1A0C06" strokeWidth="1" opacity="0.6" />

      {/* Right eye */}
      <ellipse cx="61.5" cy="58.5" rx="5.8" ry="4.2" fill="white" />
      <ellipse cx="61.5" cy="59" rx="3.9" ry="3.7" fill="#3C200E" />
      <ellipse cx="61.5" cy="59" rx="2.7" ry="2.7" fill="#100600" />
      <circle cx="63.2" cy="57.5" r="1.4" fill="white" opacity="0.9" />
      {/* Upper eyelid line */}
      <path d="M 55.7 56.5 Q 61.5 53 67.3 56.5" fill="none" stroke="#1A0C06" strokeWidth="1" opacity="0.6" />

      {/* Nose */}
      <path d="M 50 64 L 48 71.5 Q 47 73.5 49.5 74 L 50.5 74 Q 53 73.5 52 71.5Z"
            fill="none" stroke="#9C5C28" strokeWidth="0.9" opacity="0.65" />
      <ellipse cx="47" cy="72.5" rx="2.6" ry="1.9" fill="#A85E28" opacity="0.4" />
      <ellipse cx="53" cy="72.5" rx="2.6" ry="1.9" fill="#A85E28" opacity="0.4" />

      {/* Lips */}
      <path d="M 43.5 76.5 Q 46.8 74.5 50 75.5 Q 53.2 74.5 56.5 76.5
               Q 53.2 78 50 77.5 Q 46.8 78 43.5 76.5Z" fill="#923A22" />
      <path d="M 43.5 76.5 Q 50 81.5 56.5 76.5
               Q 53.5 79.5 50 80 Q 46.5 79.5 43.5 76.5Z" fill="#AE5030" />
      <path d="M 44.5 76.8 Q 50 78.5 55.5 76.8"
            fill="none" stroke="#702818" strokeWidth="0.7" strokeLinecap="round" />

      {/* Slight cheek warmth */}
      <ellipse cx="37" cy="67" rx="5.5" ry="4.5" fill="#D88048" opacity="0.18" />
      <ellipse cx="63" cy="67" rx="5.5" ry="4.5" fill="#D88048" opacity="0.18" />

      {/* ── BEARD (short, trimmed) ── */}
      {/* Left jaw beard */}
      <path
        d="M 28 65 Q 27 72 28.5 78 Q 31 84 38 87 Q 44 89 50 89
           Q 40 88.5 35 85 Q 30 80 29 74 Q 27.5 68 28 65Z"
        fill="#1A0C06"
      />
      {/* Right jaw beard */}
      <path
        d="M 72 65 Q 73 72 71.5 78 Q 69 84 62 87 Q 56 89 50 89
           Q 60 88.5 65 85 Q 70 80 71 74 Q 72.5 68 72 65Z"
        fill="#1A0C06"
      />
      {/* Chin patch */}
      <ellipse cx="50" cy="86.5" rx="12" ry="5.5" fill="#1A0C06" />
      {/* Cheek blend — very thin fade near ear */}
      <path d="M 29 65 Q 30 61 33 59 Q 34 63 33 68 Q 31 67 29 65Z" fill="#1A0C06" opacity="0.55" />
      <path d="M 71 65 Q 70 61 67 59 Q 66 63 67 68 Q 69 67 71 65Z" fill="#1A0C06" opacity="0.55" />
      {/* Mustache */}
      <path
        d="M 43.5 75.5 Q 46.8 73.5 50 74.5 Q 53.2 73.5 56.5 75.5
           Q 53.5 74 50 74.5 Q 46.5 74 43.5 75.5Z"
        fill="#1A0C06"
      />
    </svg>
  );
}
