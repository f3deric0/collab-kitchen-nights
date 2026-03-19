import { useEffect, useRef } from "react";

/**
 * CookingCursor — sostituisce il cursore di default con una padella animata
 * che ruota leggermente mentre si muove.
 */
const CookingCursor = () => {
  const cursorRef  = useRef<HTMLDivElement>(null);
  const posRef     = useRef({ x: -100, y: -100 });
  const smoothRef  = useRef({ x: -100, y: -100 });
  const rafRef     = useRef<number>(0);
  const rotRef     = useRef(0);
  const lastXRef   = useRef(0);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", move);

    const loop = () => {
      const pos    = posRef.current;
      const smooth = smoothRef.current;

      // Lerp verso la posizione reale
      smooth.x += (pos.x - smooth.x) * 0.18;
      smooth.y += (pos.y - smooth.y) * 0.18;

      // Rotazione basata sulla velocità orizzontale
      const dx   = smooth.x - lastXRef.current;
      lastXRef.current = smooth.x;
      rotRef.current  += dx * 0.35;
      rotRef.current  *= 0.88; // smorzamento

      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate(${smooth.x}px, ${smooth.y}px) rotate(${rotRef.current}deg)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Nascondi il cursore nativo */}
      <style>{`
        *, *::before, *::after { cursor: none !important; }
        a, button, [role="button"], input, textarea, select, label {
          cursor: none !important;
        }
      `}</style>

      {/* Cursore custom */}
      <div
        ref={cursorRef}
        style={{
          position:  "fixed",
          top:       0,
          left:      0,
          zIndex:    99999,
          pointerEvents: "none",
          fontSize:  "1.6rem",
          lineHeight: 1,
          userSelect: "none",
          marginLeft: "-12px",
          marginTop:  "-12px",
          willChange: "transform",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
          transition: "font-size 0.15s ease",
        }}
      >
        🍳
      </div>
    </>
  );
};

export default CookingCursor;
