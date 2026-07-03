export function AppAmbientBackground() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[#080808]"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 60% 50% at 10% 10%, rgba(255,255,255,0.055) 0%, transparent 65%),
            radial-gradient(ellipse 45% 50% at 92% 85%, rgba(255,255,255,0.035) 0%, transparent 60%)
          `,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />
    </>
  );
}
