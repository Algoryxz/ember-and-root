import React from 'react';

interface CopperHaloVisualProps {
  className?: string;
  size?: number;
  isEquipped?: boolean;
}

/**
 * Authored visual representation of the Copper Halo relic.
 * Replaces temporary emoji/unicode placeholders with an artisan, hand-hammered botanical folio artifact.
 */
export const CopperHaloVisual: React.FC<CopperHaloVisualProps> = ({
  className = '',
  size = 240,
  isEquipped = false,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic copper outer rim gradient */}
          <radialGradient id="copperRimGradient" cx="50%" cy="50%" r="50%">
            <stop offset="65%" stopColor="#8A3D1E" />
            <stop offset="82%" stopColor="#D97D54" />
            <stop offset="92%" stopColor="#F5A874" />
            <stop offset="97%" stopColor="#C26A3E" />
            <stop offset="100%" stopColor="#5E230E" />
          </radialGradient>

          {/* Inner bevel metallic gradient */}
          <linearGradient id="copperBevel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD38A" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#D97D54" />
            <stop offset="50%" stopColor="#8A3D1E" />
            <stop offset="75%" stopColor="#F5A874" />
            <stop offset="100%" stopColor="#3D180B" />
          </linearGradient>

          {/* Core ember warmth aura */}
          <radialGradient id="haloCoreAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={isEquipped ? '#FFD38A' : '#E98A4B'} stopOpacity={isEquipped ? '0.35' : '0.15'} />
            <stop offset="50%" stopColor="#E98A4B" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#141713" stopOpacity="0" />
          </radialGradient>

          {/* Outer luminous halo aura */}
          <filter id="haloGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer ambient glow if equipped */}
        {isEquipped && (
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="#E98A4B"
            strokeWidth="2"
            strokeOpacity="0.4"
            filter="url(#haloGlow)"
          />
        )}

        {/* Ambient warmth basin */}
        <circle cx="100" cy="100" r="75" fill="url(#haloCoreAura)" />

        {/* Specimen Mounting Pins / Field Cabinet Brackets */}
        <g stroke="#2A332A" strokeWidth="1.5" opacity="0.6">
          <line x1="100" y1="6" x2="100" y2="20" />
          <line x1="100" y1="180" x2="100" y2="194" />
          <line x1="6" y1="100" x2="20" y2="100" />
          <line x1="180" y1="100" x2="194" y2="100" />
        </g>

        {/* Specimen Mounting Prongs */}
        <circle cx="100" cy="18" r="2.5" fill="#3D473A" stroke="#1D231D" />
        <circle cx="100" cy="182" r="2.5" fill="#3D473A" stroke="#1D231D" />
        <circle cx="18" cy="100" r="2.5" fill="#3D473A" stroke="#1D231D" />
        <circle cx="182" cy="100" r="2.5" fill="#3D473A" stroke="#1D231D" />

        {/* Outer Halo Rim (Hammered Band) */}
        <circle
          cx="100"
          cy="100"
          r="74"
          fill="none"
          stroke="url(#copperRimGradient)"
          strokeWidth="14"
        />

        {/* Inner Highlight Ring */}
        <circle
          cx="100"
          cy="100"
          r="67.5"
          fill="none"
          stroke="url(#copperBevel)"
          strokeWidth="1.5"
          strokeOpacity="0.9"
        />

        {/* Outer Bevel Highlight */}
        <circle
          cx="100"
          cy="100"
          r="80.5"
          fill="none"
          stroke="#471A0B"
          strokeWidth="1"
        />

        {/* Hammered Faceting Texture Marks */}
        <g stroke="#F5A874" strokeWidth="1" strokeLinecap="round" opacity="0.45">
          <line x1="94" y1="28" x2="99" y2="27" />
          <line x1="120" y1="33" x2="124" y2="36" />
          <line x1="145" y1="48" x2="149" y2="52" />
          <line x1="165" y1="73" x2="168" y2="78" />
          <line x1="172" y1="103" x2="171" y2="108" />
          <line x1="164" y1="130" x2="160" y2="135" />
          <line x1="143" y1="154" x2="139" y2="158" />
          <line x1="116" y1="170" x2="111" y2="172" />
          <line x1="86" y1="171" x2="82" y2="169" />
          <line x1="58" y1="156" x2="55" y2="152" />
          <line x1="37" y1="131" x2="35" y2="126" />
          <line x1="28" y1="98" x2="29" y2="93" />
          <line x1="35" y1="67" x2="38" y2="63" />
          <line x1="56" y1="45" x2="61" y2="42" />
        </g>

        {/* Deep Shadow Hammer Marks */}
        <g stroke="#260C03" strokeWidth="1.2" strokeLinecap="round" opacity="0.65">
          <line x1="106" y1="27" x2="111" y2="28" />
          <line x1="134" y1="40" x2="137" y2="44" />
          <line x1="156" y1="60" x2="159" y2="65" />
          <line x1="171" y1="89" x2="172" y2="95" />
          <line x1="169" y1="119" x2="167" y2="124" />
          <line x1="154" y1="144" x2="150" y2="149" />
          <line x1="129" y1="164" x2="124" y2="167" />
          <line x1="100" y1="173" x2="95" y2="173" />
          <line x1="72" y1="165" x2="67" y2="161" />
          <line x1="46" y1="145" x2="43" y2="140" />
          <line x1="30" y1="114" x2="30" y2="108" />
          <line x1="30" y1="82" x2="32" y2="77" />
          <line x1="45" y1="54" x2="49" y2="50" />
          <line x1="74" y1="35" x2="79" y2="33" />
        </g>

        {/* Inscribed Botanical Rune Notches (12 Cardinal Radians) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 100 100)`}>
            <circle cx="100" cy="33.5" r="1.5" fill="#FFD38A" opacity="0.85" />
            <line x1="100" y1="37" x2="100" y2="40" stroke="#FFD38A" strokeWidth="1" opacity="0.6" />
          </g>
        ))}

        {/* Central Luminous Flame Aperture */}
        <circle
          cx="100"
          cy="100"
          r="48"
          fill="#141713"
          stroke="#2A332A"
          strokeWidth="1.5"
        />

        {/* Inner Hearth Reflection Core */}
        <circle
          cx="100"
          cy="100"
          r="36"
          fill="none"
          stroke="#E98A4B"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity={isEquipped ? '0.7' : '0.35'}
        />

        <circle
          cx="100"
          cy="100"
          r="12"
          fill={isEquipped ? '#FFD38A' : '#E98A4B'}
          opacity={isEquipped ? '0.85' : '0.4'}
          filter="url(#haloGlow)"
        />
      </svg>
    </div>
  );
};
