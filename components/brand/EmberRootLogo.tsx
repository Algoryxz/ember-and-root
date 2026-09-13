import React from 'react';

interface MarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  variant?: 'copper' | 'light' | 'mono';
}

export function EmberRootMark({
  size = 24,
  className = '',
  variant = 'copper',
  ...props
}: MarkProps) {
  const strokeColor =
    variant === 'light' ? '#141713' : variant === 'mono' ? 'currentColor' : '#E98A4B';
  const coreColor =
    variant === 'light' ? '#735E4B' : variant === 'mono' ? 'currentColor' : '#FFD38A';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {/* Main taproot plunging down-left with organic curve */}
      <path
        d="M72 26 C 62 40, 44 55, 24 74"
        stroke={strokeColor}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Lateral rooting shoot branching down-right */}
      <path
        d="M50 48 C 58 56, 66 65, 76 74"
        stroke={strokeColor}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Central anchoring capillary shoot */}
      <path
        d="M42 56 C 42 66, 44 77, 48 86"
        stroke={strokeColor}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Delicate root spur */}
      <path
        d="M34 62 C 30 68, 28 72, 22 76"
        stroke={strokeColor}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* Origin Ember: Glowing seed pod / almond spark at top origin */}
      <path
        d="M72 10 C 80 18, 80 24, 72 32 C 64 24, 64 18, 72 10 Z"
        fill={strokeColor}
      />
      <circle cx="72" cy="21" r="3.5" fill={coreColor} />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'copper' | 'light' | 'mono';
  showCredo?: boolean;
}

export function EmberRootLogo({
  size = 24,
  className = '',
  variant = 'copper',
  showCredo = false,
}: LogoProps) {
  const textColor =
    variant === 'light' ? 'text-[#141713]' : variant === 'mono' ? 'text-current' : 'text-[#F0E7D3]';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <EmberRootMark size={size} variant={variant} />
      <div className="flex flex-col">
        <span
          className={`font-['Fraunces'] font-semibold tracking-[0.08em] uppercase ${textColor}`}
          style={{ fontSize: `${Math.max(14, Math.round(size * 0.75))}px`, lineHeight: 1.1 }}
        >
          Ember &amp; Root
        </span>
        {showCredo && (
          <span className="font-['Fraunces'] italic text-xs text-[#B9BEAC] tracking-normal mt-0.5">
            What you do becomes who you are.
          </span>
        )}
      </div>
    </div>
  );
}
