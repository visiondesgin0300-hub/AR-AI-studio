interface RafeeqAvatarProps {
  className?: string;
}

export function RafeeqAvatar({ className }: RafeeqAvatarProps) {
  return (
    <svg
      viewBox="0 0 100 112"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      aria-label="Rafeeq"
    >
      {/* Dishdasha (white robe body) */}
      <rect x="20" y="82" width="60" height="34" rx="14" fill="#F6F6F6" />
      {/* Collar V-neck */}
      <path d="M37 85 L50 73 L63 85 L58 83 L50 89 L42 83Z" fill="white" stroke="#E2E2E2" strokeWidth="0.6" />

      {/* Neck */}
      <rect x="44" y="64" width="12" height="22" rx="5" fill="#C8844A" />

      {/* Head */}
      <circle cx="50" cy="46" r="25" fill="#D4924E" />

      {/* Kuma – traditional Omani embroidered cap */}
      {/* Main cap dome */}
      <path
        d="M27 44 Q28 21 50 18 Q72 21 73 44 Q62 37 50 35 Q38 37 27 44Z"
        fill="#2D6E4E"
      />
      {/* Central star embroidery */}
      <path
        d="M50 22 L51.8 27 L57 27 L52.9 30.2 L54.5 35.2 L50 32 L45.5 35.2 L47.1 30.2 L43 27 L48.2 27Z"
        fill="#D4AF37"
        opacity="0.9"
      />
      {/* Side accent dots */}
      <circle cx="39" cy="28" r="2" fill="#D4AF37" opacity="0.75" />
      <circle cx="61" cy="28" r="2" fill="#D4AF37" opacity="0.75" />
      <circle cx="33" cy="36" r="1.6" fill="#C8A96E" opacity="0.65" />
      <circle cx="67" cy="36" r="1.6" fill="#C8A96E" opacity="0.65" />
      {/* Cap lower trim band */}
      <path
        d="M27 44 Q38 39.5 50 39 Q62 39.5 73 44 Q62 42 50 41.5 Q38 42 27 44Z"
        fill="#1F5239"
      />
      {/* Trim dots */}
      <circle cx="37" cy="42" r="1.1" fill="#D4AF37" opacity="0.65" />
      <circle cx="50" cy="41.5" r="1.1" fill="#D4AF37" opacity="0.65" />
      <circle cx="63" cy="42" r="1.1" fill="#D4AF37" opacity="0.65" />

      {/* Ears */}
      <circle cx="25" cy="47" r="5.5" fill="#C8844A" />
      <circle cx="75" cy="47" r="5.5" fill="#C8844A" />
      <circle cx="25" cy="47" r="3.5" fill="#B8724A" />
      <circle cx="75" cy="47" r="3.5" fill="#B8724A" />

      {/* Eyes */}
      <circle cx="41" cy="48" r="4.2" fill="#1A0A00" />
      <circle cx="59" cy="48" r="4.2" fill="#1A0A00" />
      {/* Iris highlight */}
      <circle cx="42.8" cy="46.3" r="1.6" fill="white" />
      <circle cx="60.8" cy="46.3" r="1.6" fill="white" />

      {/* Eyebrows */}
      <path d="M36 42 Q41 39 46 42" stroke="#5C3317" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M54 42 Q59 39 64 42" stroke="#5C3317" strokeWidth="2.3" strokeLinecap="round" />

      {/* Nose */}
      <path d="M48 54 Q50 57 52 54" stroke="#B8724A" strokeWidth="1.8" strokeLinecap="round" />

      {/* Warm smile */}
      <path d="M42 59.5 Q50 65.5 58 59.5" stroke="#7A3D12" strokeWidth="2.3" fill="none" strokeLinecap="round" />

      {/* Cheek blush */}
      <circle cx="36" cy="55" r="7" fill="#E8923A" opacity="0.11" />
      <circle cx="64" cy="55" r="7" fill="#E8923A" opacity="0.11" />

      {/* Gold AI star badge on chest */}
      <circle cx="50" cy="92" r="6.5" fill="#D4AF37" />
      <path
        d="M50 87.5 L51.4 90.8 L55 90.8 L52.3 92.9 L53.5 96.5 L50 94.2 L46.5 96.5 L47.7 92.9 L45 90.8 L48.6 90.8Z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  );
}
