// Precise automotive part SVG icons — navy outlines, no fill

export function ConrodIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="36" cy="36" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="36" cy="36" r="4" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M17.5 17.5L27 27" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <path d="M15 15L29 29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M10 10.5h4M10 13.5h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}

export function CrankshaftIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="4" cy="24" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="44" cy="24" r="3" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="7" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="12" y="20" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="16" y1="24" x2="18" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18" y1="24" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="14" y="9" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="22" y1="12" x2="26" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="26" y="20" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="26" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="28" y1="24" x2="28" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="24" y="33" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="32" y1="36" x2="36" y2="36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="36" y="20" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="40" y1="24" x2="41" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function PistonIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="12" y="18" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="23" x2="36" y2="23" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="12" y1="27" x2="36" y2="27" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="12" y1="31" x2="36" y2="31" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="16" y="14" width="16" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <line x1="24" y1="38" x2="24" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="44" x2="28" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="24" cy="42" r="2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

export function CamshaftIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <line x1="4" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="11" cy="24" rx="2.5" ry="6" stroke="currentColor" strokeWidth="1.3"/>
      <ellipse cx="20" cy="24" rx="2.5" ry="7.5" stroke="currentColor" strokeWidth="1.3"/>
      <ellipse cx="29" cy="24" rx="2.5" ry="6" stroke="currentColor" strokeWidth="1.3"/>
      <ellipse cx="38" cy="24" rx="2.5" ry="7.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="4" cy="24" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="44" cy="24" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

export function TurboIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="22" cy="24" r="14" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="22" cy="24" r="5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M22 10 C16 10 10 16 10 24" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M22 38 C28 38 34 32 34 24" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M10 24 C10 16 16 10 22 10 L22 15 C19 15 15 18 15 24Z" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M34 24 C34 32 28 38 22 38 L22 33 C25 33 29 30 29 24Z" stroke="currentColor" strokeWidth="1" fill="none"/>
      <line x1="36" y1="20" x2="44" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="36" y1="28" x2="44" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="40" y="13" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="40" y="28" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}

export function BrakeDiscIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="24" cy="24" r="3" stroke="currentColor" strokeWidth="1.3"/>
      {[0,60,120,180,240,300].map(a => {
        const r1 = 10, r2 = 18;
        const rad = a * Math.PI / 180;
        const x1 = 24 + r1*Math.cos(rad), y1 = 24 + r1*Math.sin(rad);
        const x2 = 24 + r2*Math.cos(rad), y2 = 24 + r2*Math.sin(rad);
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>;
      })}
      {[30,90,150,210,270,330].map(a => {
        const rad = a * Math.PI / 180;
        const cx = 24 + 15*Math.cos(rad), cy = 24 + 15*Math.sin(rad);
        return <circle key={a} cx={cx} cy={cy} r="1.5" stroke="currentColor" strokeWidth="1"/>;
      })}
    </svg>
  );
}

export function TimingBeltIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="36" cy="34" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="36" cy="34" r="3" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 20 Q4 36 30 40" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M22 6 Q40 4 42 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={8 + i*3} y={5} width="2" height="3" rx="0.5" stroke="currentColor" strokeWidth="1" transform={`rotate(${i * 8} 14 14)`}/>
      ))}
    </svg>
  );
}

export function AlternatorIcon({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="9" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M24 6 L26 18 L24 15 L22 18 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M42 24 L30 22 L33 24 L30 26 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M24 42 L22 30 L24 33 L26 30 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M6 24 L18 26 L15 24 L18 22 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="24" cy="24" r="4" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  );
}
