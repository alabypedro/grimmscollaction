export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative">
        <svg width="36" height="40" viewBox="0 0 36 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="hex-grad" x1="0" y1="0" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C026D3" />
              <stop offset="1" stopColor="#6B0BBF" />
            </linearGradient>
            <linearGradient id="hex-stroke" x1="0" y1="0" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E879F9" />
              <stop offset="1" stopColor="#8B00FF" />
            </linearGradient>
          </defs>
          <path d="M18 1.5L33.5 10.5V29.5L18 38.5L2.5 29.5V10.5L18 1.5Z" fill="url(#hex-grad)" stroke="url(#hex-stroke)" strokeWidth="1.5" />
          <path d="M18 11L25 15V25L18 29L11 25V15L18 11Z" fill="#0A0A0A" stroke="#E879F9" strokeWidth="0.8" />
          <text x="18" y="23" textAnchor="middle" fill="#E879F9" fontSize="9" fontWeight="900" fontFamily="Inter, sans-serif">G</text>
        </svg>
        <div className="absolute inset-0 blur-md bg-primary/30 -z-10" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[10px] tracking-[0.3em] text-muted-foreground font-medium">GRIMM'S</span>
        <span className="text-sm tracking-[0.25em] font-bold text-foreground">COLLECTION</span>
      </div>
    </div>
  );
}