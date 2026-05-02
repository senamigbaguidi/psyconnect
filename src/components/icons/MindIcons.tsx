import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 24): Partial<SVGProps<SVGSVGElement>> => ({
  width: size,
  height: size,
  viewBox: "0 0 32 32",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

/** Brain — interconnected hemispheres with neural node */
export function BrainGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M11 7c-3 0-5 2.2-5 5 0 1.4.6 2.6 1.5 3.4-.9.9-1.5 2.1-1.5 3.5 0 2.8 2.2 5 5 5 .8 0 1.5-.2 2.2-.5V7.5c-.7-.3-1.4-.5-2.2-.5Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M21 7c3 0 5 2.2 5 5 0 1.4-.6 2.6-1.5 3.4.9.9 1.5 2.1 1.5 3.5 0 2.8-2.2 5-5 5-.8 0-1.5-.2-2.2-.5V7.5c.7-.3 1.4-.5 2.2-.5Z" stroke="currentColor" strokeWidth="1.6"/>
      <circle cx="16" cy="16" r="1.6" fill="currentColor"/>
      <path d="M11 12h3M18 12h3M11 20h3M18 20h3" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
    </svg>
  );
}

/** Wave — calming breath / sound wave */
export function WaveGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M2 16c2.5-5 5-5 7 0s4.5 5 7 0 4.5-5 7 0 4.5 5 7 0" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M2 22c2.5-3 5-3 7 0s4.5 3 7 0 4.5-3 7 0 4.5 3 7 0" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
    </svg>
  );
}

/** Neuron — central node with synaptic branches */
export function NeuronGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="16" cy="16" r="3" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M16 13V6M16 19v7M13 16H6M19 16h7M11 11l-4-4M21 11l4-4M11 21l-4 4M21 21l4 4" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="6" cy="6" r="1.2" fill="currentColor"/>
      <circle cx="26" cy="6" r="1.2" fill="currentColor"/>
      <circle cx="6" cy="26" r="1.2" fill="currentColor"/>
      <circle cx="26" cy="26" r="1.2" fill="currentColor"/>
    </svg>
  );
}

/** Bloom — five-petal flower for growth & well-being */
export function BloomGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="16"
          cy="9"
          rx="3.5"
          ry="6"
          stroke="currentColor"
          strokeWidth="1.5"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="2" fill="currentColor"/>
    </svg>
  );
}

/** Shield with heart — confidential & caring */
export function ShieldHeartGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M16 4 5 8v8c0 6 4.5 10.5 11 12 6.5-1.5 11-6 11-12V8L16 4Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M16 21c-2.5-1.6-4.5-3.4-4.5-5.4 0-1.5 1.2-2.6 2.5-2.6.8 0 1.6.4 2 1.1.4-.7 1.2-1.1 2-1.1 1.3 0 2.5 1.1 2.5 2.6 0 2-2 3.8-4.5 5.4Z" fill="currentColor"/>
    </svg>
  );
}

/** Conversation bubble pair */
export function DialogueGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 8a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-3l-4 4v-4H7a3 3 0 0 1-3-3V8Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M14 22a3 3 0 0 0 3 3h6l3 3v-3h1a3 3 0 0 0 3-3v-4a3 3 0 0 0-3-3h-3" stroke="currentColor" strokeWidth="1.4" opacity="0.6"/>
    </svg>
  );
}

/** Sun-rise — hope & new beginnings */
export function SunriseGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="16" cy="20" r="5" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3 26h26" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M16 8v3M7 12l2 2M25 12l-2 2M3 20h2M27 20h2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

/** Pulse — vital signal */
export function PulseGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M2 16h6l3-8 5 16 4-12 3 4h7" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

/** Lotus — serenity, mindfulness */
export function LotusGlyph({ size = 24, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M16 6c-2 4-2 8 0 14 2-6 2-10 0-14Z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 20c-4-2-7-5-9-9 4-1 7 1 9 4M16 20c4-2 7-5 9-9-4-1-7 1-9 4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 22c4 3 8 4 12 4s8-1 12-4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

/** Logo glyph — animated breathing circle for PsyConnect */
export function PsyConnectMark({ size = 32, ...rest }: IconProps) {
  return (
    <svg {...base(size)} {...rest} viewBox="0 0 40 40">
      <defs>
        <linearGradient id="psy-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.268 0.082 287.55)" />
          <stop offset="55%" stopColor="oklch(0.822 0.068 289.476)" />
          <stop offset="100%" stopColor="oklch(0.787 0.095 309.547)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="16" fill="url(#psy-grad)" opacity="0.18" />
      <circle cx="20" cy="20" r="11" fill="url(#psy-grad)" opacity="0.35" />
      <circle cx="20" cy="20" r="6" fill="url(#psy-grad)" />
      <circle cx="20" cy="20" r="2.2" fill="white" />
    </svg>
  );
}