export function GoldWaves({ className = "" }: { className?: string }) {
  return (
    <svg className={`gold-waves ${className}`} viewBox="0 0 1440 380" fill="none" aria-hidden="true" focusable="false">
      {[0, 18, 42, 76, 116].map((offset) => (
        <path key={offset} d={`M-80 ${290 + offset} C280 ${-100 + offset} 750 ${490 + offset} 1520 ${40 + offset}`} />
      ))}
    </svg>
  );
}
