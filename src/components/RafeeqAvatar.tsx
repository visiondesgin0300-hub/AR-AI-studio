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
      <defs>
        <radialGradient id="rq-head" cx="38%" cy="28%" r="72%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="50%"  stopColor="#D8EEFF" />
          <stop offset="100%" stopColor="#A8CCEE" />
        </radialGradient>
        <radialGradient id="rq-body" cx="38%" cy="22%" r="72%">
          <stop offset="0%"   stopColor="#EEF6FF" />
          <stop offset="50%"  stopColor="#C8DFFA" />
          <stop offset="100%" stopColor="#9ABDE8" />
        </radialGradient>
        <radialGradient id="rq-eye" cx="30%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#80D8FF" />
          <stop offset="40%"  stopColor="#29B6F6" />
          <stop offset="100%" stopColor="#0288D1" />
        </radialGradient>
        <radialGradient id="rq-orb" cx="33%" cy="33%" r="67%">
          <stop offset="0%"   stopColor="#FFE878" />
          <stop offset="60%"  stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9A7018" />
        </radialGradient>
      </defs>

      {/* ── ARMS (behind body) ── */}
      {/* Left arm - curves inward to hold book */}
      <path
        d="M 18,80 C 10,80 8,86 8,95 C 8,104 12,108 20,108
           L 22,106 C 16,104 13,100 13,93 C 13,86 15,82 20,82Z"
        fill="#C8E0F5" stroke="#90BBE0" strokeWidth="0.8"
      />
      <circle cx="18" cy="80" r="4.5" fill="#D5ECF8" stroke="#90BBE0" strokeWidth="0.8" />
      <circle cx="19" cy="107" r="4" fill="#BEDBF0" stroke="#90BBE0" strokeWidth="0.8" />

      {/* Right arm - mirrors left */}
      <path
        d="M 82,80 C 90,80 92,86 92,95 C 92,104 88,108 80,108
           L 78,106 C 84,104 87,100 87,93 C 87,86 85,82 80,82Z"
        fill="#C8E0F5" stroke="#90BBE0" strokeWidth="0.8"
      />
      <circle cx="82" cy="80" r="4.5" fill="#D5ECF8" stroke="#90BBE0" strokeWidth="0.8" />
      <circle cx="81" cy="107" r="4" fill="#BEDBF0" stroke="#90BBE0" strokeWidth="0.8" />

      {/* ── BODY ── */}
      <rect x="18" y="66" width="64" height="47" rx="18" fill="url(#rq-body)" stroke="#B0CCEE" strokeWidth="1" />
      <rect x="18" y="66" width="64" height="22" rx="18" fill="white" opacity="0.35" />
      <ellipse cx="50" cy="111" rx="28" ry="5" fill="#8AAAC8" opacity="0.2" />

      {/* Corner rivets */}
      <circle cx="25" cy="73" r="2.8" fill="#C0D8F0" stroke="#7AAAD0" strokeWidth="1" />
      <circle cx="75" cy="73" r="2.8" fill="#C0D8F0" stroke="#7AAAD0" strokeWidth="1" />
      <circle cx="25" cy="106" r="2.8" fill="#C0D8F0" stroke="#7AAAD0" strokeWidth="1" />
      <circle cx="75" cy="106" r="2.8" fill="#C0D8F0" stroke="#7AAAD0" strokeWidth="1" />

      {/* Chest indicator light */}
      <rect x="44" y="72" width="12" height="6" rx="3" fill="#D0E8FA" stroke="#90BBE0" strokeWidth="0.6" />
      <rect x="46" y="73.5" width="8" height="3" rx="1.5" fill="#29B6F6" opacity="0.5" />

      {/* ── OPEN BOOK (held in front of body) ── */}
      {/* Book shadow */}
      <ellipse cx="50" cy="117" rx="27" ry="3.5" fill="#7A9ABE" opacity="0.2" />

      {/* Book spine / binding */}
      <rect x="47.5" y="88" width="5" height="27" rx="2.5" fill="#1565C0" />

      {/* Left page (cream, slightly fanned) */}
      <path d="M 21,91 Q 36,89 47.5,88 L 47.5,115 Q 36,115 21,115Z" fill="#FAFAF4" />
      {/* Left page subtle gradient */}
      <path d="M 21,91 Q 36,89 47.5,88 L 47.5,115 Q 36,115 21,115Z" fill="#E8F0F8" opacity="0.3" />

      {/* Right page */}
      <path d="M 52.5,88 Q 64,89 79,91 L 79,115 Q 64,115 52.5,115Z" fill="#F8F8F2" />

      {/* Left page lines (text simulation) */}
      <line x1="26" y1="94"  x2="46" y2="93"  stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="26" y1="97"  x2="46" y2="96"  stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="26" y1="100" x2="46" y2="99"  stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="26" y1="103" x2="46" y2="102" stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="26" y1="106" x2="46" y2="105" stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="26" y1="109" x2="46" y2="108" stroke="#C8C8C0" strokeWidth="0.7" />

      {/* Right page lines */}
      <line x1="54" y1="93"  x2="74" y2="94"  stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="54" y1="96"  x2="74" y2="97"  stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="54" y1="99"  x2="74" y2="100" stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="54" y1="102" x2="74" y2="103" stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="54" y1="105" x2="74" y2="106" stroke="#C8C8C0" strokeWidth="0.7" />
      <line x1="54" y1="108" x2="74" y2="109" stroke="#C8C8C0" strokeWidth="0.7" />

      {/* Book outer border */}
      <path d="M 21,91 Q 36,89 47.5,88 L 47.5,115 Q 36,115 21,115Z"
            fill="none" stroke="#4A80C0" strokeWidth="0.8" />
      <path d="M 52.5,88 Q 64,89 79,91 L 79,115 Q 64,115 52.5,115Z"
            fill="none" stroke="#4A80C0" strokeWidth="0.8" />

      {/* ── NECK ── */}
      <rect x="42" y="58" width="16" height="10" rx="5" fill="#C0D8F0" stroke="#90B8E0" strokeWidth="0.8" />
      <line x1="46" y1="60.5" x2="46" y2="65.5" stroke="#90B0D8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="50" y1="60.5" x2="50" y2="65.5" stroke="#90B0D8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="54" y1="60.5" x2="54" y2="65.5" stroke="#90B0D8" strokeWidth="1.8" strokeLinecap="round" />

      {/* ── HEAD ── */}
      <rect x="14" y="14" width="72" height="46" rx="18" fill="url(#rq-head)" stroke="#B0CCEE" strokeWidth="1" />
      <rect x="14" y="14" width="72" height="22" rx="18" fill="white" opacity="0.45" />
      <rect x="14" y="20" width="5"  height="32" rx="2.5" fill="white" opacity="0.3" />
      <rect x="81" y="20" width="5"  height="32" rx="2.5" fill="white" opacity="0.3" />

      {/* Head corner rivets */}
      <circle cx="21" cy="21" r="3" fill="#D0E8F8" stroke="#80AACC" strokeWidth="1" />
      <circle cx="79" cy="21" r="3" fill="#D0E8F8" stroke="#80AACC" strokeWidth="1" />
      <circle cx="21" cy="53" r="3" fill="#D0E8F8" stroke="#80AACC" strokeWidth="1" />
      <circle cx="79" cy="53" r="3" fill="#D0E8F8" stroke="#80AACC" strokeWidth="1" />

      {/* ── ANTENNA ── */}
      <line x1="50" y1="14" x2="50" y2="5" stroke="#B8901C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="14" r="3.5" fill="#C0D8F0" />
      <circle cx="50" cy="14" r="2"   fill="#D4AF37" />
      <circle cx="50" cy="4"  r="5.5" fill="url(#rq-orb)" />
      <circle cx="50" cy="4"  r="3.2" fill="#F0CC50" />
      <circle cx="50" cy="4"  r="1.6" fill="#FFEEAA" />
      <circle cx="51.8" cy="2.4" r="1.2" fill="white" opacity="0.7" />

      {/* ── SIDE EAR PANELS ── */}
      <rect x="6"  y="26" width="9" height="22" rx="4.5" fill="#D0E8F8" stroke="#90BBE0" strokeWidth="0.8" />
      <line x1="9"  y1="31" x2="12" y2="31" stroke="#70A8D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="35" x2="12" y2="35" stroke="#70A8D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="39" x2="12" y2="39" stroke="#70A8D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9"  y1="43" x2="12" y2="43" stroke="#70A8D0" strokeWidth="1.5" strokeLinecap="round" />

      <rect x="85" y="26" width="9" height="22" rx="4.5" fill="#D0E8F8" stroke="#90BBE0" strokeWidth="0.8" />
      <line x1="88" y1="31" x2="91" y2="31" stroke="#70A8D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="88" y1="35" x2="91" y2="35" stroke="#70A8D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="88" y1="39" x2="91" y2="39" stroke="#70A8D0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="88" y1="43" x2="91" y2="43" stroke="#70A8D0" strokeWidth="1.5" strokeLinecap="round" />

      {/* ── FACE SCREEN PANEL ── */}
      <rect x="20" y="19" width="60" height="38" rx="12" fill="#EAF4FF" stroke="#A8CCEE" strokeWidth="0.8" />
      <rect x="21" y="20" width="58" height="15" rx="11" fill="white" opacity="0.55" />

      {/* Status LED */}
      <circle cx="50" cy="22" r="2.5" fill="#00DD77" />
      <circle cx="50" cy="22" r="1.3" fill="#AAFFCC" />

      {/* ── LEFT EYE ── */}
      <rect x="23" y="26" width="22" height="18" rx="7" fill="white" stroke="#C0DCFA" strokeWidth="0.8" />
      <circle cx="34" cy="35" r="7.5" fill="#D8EFFF" />
      <circle cx="34" cy="35" r="6.5" fill="url(#rq-eye)" />
      <circle cx="34" cy="35" r="3.8" fill="#0D2A50" />
      <circle cx="34" cy="35" r="2.2" fill="#1A3A6A" />
      <ellipse cx="36.5" cy="32.5" rx="2.4" ry="1.9" fill="white" opacity="0.95" />
      <circle  cx="31.8" cy="37.2" r="1"   fill="white" opacity="0.5" />

      {/* ── RIGHT EYE ── */}
      <rect x="55" y="26" width="22" height="18" rx="7" fill="white" stroke="#C0DCFA" strokeWidth="0.8" />
      <circle cx="66" cy="35" r="7.5" fill="#D8EFFF" />
      <circle cx="66" cy="35" r="6.5" fill="url(#rq-eye)" />
      <circle cx="66" cy="35" r="3.8" fill="#0D2A50" />
      <circle cx="66" cy="35" r="2.2" fill="#1A3A6A" />
      <ellipse cx="68.5" cy="32.5" rx="2.4" ry="1.9" fill="white" opacity="0.95" />
      <circle  cx="63.8" cy="37.2" r="1"   fill="white" opacity="0.5" />

      {/* ── GLASSES (gold frames over eyes) ── */}
      {/* Left glass frame */}
      <rect x="21" y="24" width="26" height="22" rx="8"
            fill="none" stroke="#D4AF37" strokeWidth="2.5" />
      {/* Right glass frame */}
      <rect x="53" y="24" width="26" height="22" rx="8"
            fill="none" stroke="#D4AF37" strokeWidth="2.5" />
      {/* Bridge (nose piece) */}
      <path d="M 47,34 Q 50,31 53,34"
            fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      {/* Left temple */}
      <path d="M 21,32 Q 16,31 14,29"
            fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      {/* Right temple */}
      <path d="M 79,32 Q 84,31 86,29"
            fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      {/* Gold hinge dots */}
      <circle cx="21" cy="32" r="1.8" fill="#D4AF37" />
      <circle cx="79" cy="32" r="1.8" fill="#D4AF37" />

      {/* ── CLOSED SMILE ── */}
      <path d="M 33 49 Q 50 61 67 49"
            fill="none" stroke="#29B6F6" strokeWidth="5.5" strokeLinecap="round" opacity="0.15" />
      <path d="M 33 49 Q 50 61 67 49"
            fill="none" stroke="#0288D1" strokeWidth="3.5" strokeLinecap="round" opacity="0.3" />
      <path d="M 33 49 Q 50 61 67 49"
            fill="none" stroke="#0277BD" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
