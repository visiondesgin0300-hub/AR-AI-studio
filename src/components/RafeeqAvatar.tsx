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
        <radialGradient id="rq-brain" cx="40%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#FFD8E8" />
          <stop offset="50%"  stopColor="#FFB3C6" />
          <stop offset="100%" stopColor="#F07898" />
        </radialGradient>
        <radialGradient id="rq-iris" cx="30%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#5588EE" />
          <stop offset="100%" stopColor="#1133AA" />
        </radialGradient>
      </defs>

      {/* ── LEGS ── */}
      <path
        d="M 36,69 C 33,74 31,81 31,88 C 31,92 33,94 37,94
           C 41,94 43,92 43,88 C 43,81 41,74 40,69Z"
        fill="#FFB3C6"
      />
      <ellipse cx="37" cy="95" rx="8" ry="3.8" fill="#F090B0" />

      <path
        d="M 59,69 C 58,74 56,81 56,88 C 56,92 58,94 62,94
           C 66,94 68,92 68,88 C 68,81 66,74 64,69Z"
        fill="#FFB3C6"
      />
      <ellipse cx="62" cy="95" rx="8" ry="3.8" fill="#F090B0" />

      {/* ── ARMS ── */}
      {/* Left arm — slightly raised outward */}
      <path
        d="M 19,51 C 14,54 10,59 9,65 C 8,69 10,72 13,72
           C 16,72 18,70 19,66 C 20,61 23,57 26,54Z"
        fill="#FFB3C6"
      />
      <circle cx="11" cy="73" r="5.5" fill="#F090B0" />

      {/* Right arm */}
      <path
        d="M 78,51 C 83,54 87,59 88,65 C 89,69 87,72 84,72
           C 81,72 79,70 78,66 C 77,61 74,57 71,54Z"
        fill="#FFB3C6"
      />
      <circle cx="86" cy="73" r="5.5" fill="#F090B0" />

      {/* ── BRAIN DROP SHADOW ── */}
      <path
        d="M 35,70 C 28,70 19,66 16,58 C 13,50 15,41 19,33
           C 21,29 24,25 27,22 C 29,20 31,20 33,20
           C 34,19 36,17 39,15 C 41,14 44,14 46,15
           C 47,14 49,12 51,12 C 53,12 55,14 57,15
           C 59,15 62,14 65,15 C 67,16 70,18 73,22
           C 75,25 77,29 79,34 C 81,39 82,46 81,53
           C 80,59 77,64 73,67 C 68,70 62,71 55,71
           C 48,71 41,70 35,70Z"
        fill="#E06888"
        opacity="0.28"
        transform="translate(2.5,4)"
      />

      {/* ── BRAIN MAIN BODY ── */}
      {/* Bumpy brain path — 5 pronounced bumps on top, 2 side bumps */}
      <path
        d="
          M 32,67
          C 25,67 17,62 15,54
          C 13,47 15,39 19,32
          C 20,29 22,27 24,25
          C 22,23 21,20 23,18
          C 25,16 28,16 30,18
          C 31,17 33,15 36,14
          C 38,13 40,13 42,15
          C 43,13 46,11 49,11
          C 52,11 55,13 56,15
          C 58,13 61,13 63,14
          C 65,15 67,16 69,18
          C 71,16 74,16 76,18
          C 78,20 78,23 76,25
          C 78,27 80,30 81,34
          C 83,39 83,46 81,53
          C 79,60 75,65 68,68
          C 62,70 56,70 50,70
          C 44,70 38,68 32,67Z
        "
        fill="url(#rq-brain)"
      />

      {/* ── BRAIN FOLD / CREASE LINES ── */}
      {/* Central vertical crease */}
      <path
        d="M 49,14 C 49,24 49,36 49,50"
        stroke="#F090A8" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"
      />
      {/* Left lobe arc */}
      <path
        d="M 28,26 C 30,36 30,46 28,57"
        stroke="#F090A8" strokeWidth="1.1" strokeLinecap="round" opacity="0.4"
      />
      {/* Right lobe arc */}
      <path
        d="M 70,26 C 68,36 68,46 70,57"
        stroke="#F090A8" strokeWidth="1.1" strokeLinecap="round" opacity="0.4"
      />
      {/* Small left inner arc */}
      <path
        d="M 20,44 C 23,50 25,56 24,63"
        stroke="#F090A8" strokeWidth="0.9" strokeLinecap="round" opacity="0.3"
      />

      {/* ── EYES ── */}
      {/* Left eye */}
      <circle cx="37" cy="44" r="12"   fill="white" />
      <circle cx="37" cy="44" r="12"   fill="none" stroke="#E06080" strokeWidth="1.8" />
      <circle cx="37" cy="44.5" r="8.5" fill="url(#rq-iris)" />
      <circle cx="37" cy="44.5" r="5.5" fill="#08102A" />
      <ellipse cx="40.5" cy="40.5" rx="4" ry="3.2" fill="white" opacity="0.95" />
      <circle cx="34"   cy="48"   r="1.8" fill="white" opacity="0.5" />

      {/* Right eye */}
      <circle cx="63" cy="44" r="12"   fill="white" />
      <circle cx="63" cy="44" r="12"   fill="none" stroke="#E06080" strokeWidth="1.8" />
      <circle cx="63" cy="44.5" r="8.5" fill="url(#rq-iris)" />
      <circle cx="63" cy="44.5" r="5.5" fill="#08102A" />
      <ellipse cx="66.5" cy="40.5" rx="4" ry="3.2" fill="white" opacity="0.95" />
      <circle cx="60"   cy="48"   r="1.8" fill="white" opacity="0.5" />

      {/* ── BIG HAPPY SMILE ── */}
      {/* Mouth cavity */}
      <path
        d="M 37,58 Q 50,70 63,58 Q 56,66 50,67 Q 44,66 37,58Z"
        fill="#CC2244"
      />
      {/* Teeth */}
      <path
        d="M 38.5,59.5 Q 50,69 61.5,59.5 Q 55,66 50,66.5 Q 45,66 38.5,59.5Z"
        fill="white"
      />
      {/* Tooth divider */}
      <line x1="50" y1="59.5" x2="50" y2="66.5" stroke="#F0D8E0" strokeWidth="0.8" />
      {/* Upper lip arc */}
      <path
        d="M 37,58 Q 50,63 63,58"
        fill="none" stroke="#AA1838" strokeWidth="1.8" strokeLinecap="round"
      />

      {/* ── CHEEK BLUSH ── */}
      <ellipse cx="23" cy="55" rx="7.5" ry="4.5" fill="#FF4466" opacity="0.18" />
      <ellipse cx="77" cy="55" rx="7.5" ry="4.5" fill="#FF4466" opacity="0.18" />

      {/* ── SPARKLE (optional accent — top right of brain) ── */}
      <path d="M 77,20 L 78,17 L 79,20 L 82,21 L 79,22 L 78,25 L 77,22 L 74,21Z"
            fill="#FFD700" opacity="0.9" />
      <path d="M 82,14 L 82.8,12 L 83.6,14 L 85.6,14.8 L 83.6,15.6 L 82.8,17.6 L 82,15.6 L 80,14.8Z"
            fill="#FFD700" opacity="0.7" transform="scale(0.7) translate(35,8)" />
    </svg>
  );
}
