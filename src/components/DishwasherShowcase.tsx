import { useMemo } from "react";
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";

const DishwasherShowcase = () => {
  const { scrollYProgress } = useScroll();

  const rotateXBase = useTransform(scrollYProgress, [0, 1], [10, -8]);
  const rotateYBase = useTransform(scrollYProgress, [0, 1], [-14, 14]);
  const floatY = useTransform(scrollYProgress, [0, 1], [0, -18]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateXCombined = useTransform([rotateXBase, mouseY], (values) => {
    const [base, mouse] = values as [number, number];
    return base + mouse;
  });

  const rotateYCombined = useTransform([rotateYBase, mouseX], (values) => {
    const [base, mouse] = values as [number, number];
    return base + mouse;
  });

  const rotateX = useSpring(rotateXCombined, {
    stiffness: 130,
    damping: 18,
    mass: 0.6,
  });

  const rotateY = useSpring(rotateYCombined, {
    stiffness: 130,
    damping: 18,
    mass: 0.6,
  });

  const translateY = useSpring(floatY, {
    stiffness: 100,
    damping: 18,
  });

  const sheenX = useTransform(mouseX, [-14, 14], [35, 65]);
  const sheenY = useTransform(mouseY, [-12, 12], [25, 75]);
  const sheen = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, hsl(var(--primary-foreground) / 0.7), transparent 34%)`;

  const rackPlates = useMemo(() => Array.from({ length: 4 }), []);
  const waterLines = useMemo(() => Array.from({ length: 5 }), []);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 28;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -24;
    mouseX.set(x);
    mouseY.set(y);
  };

  const resetTilt = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section className="relative overflow-hidden bg-background px-6 py-24 sm:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--accent)/0.12),transparent_38%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-xl">
          <p className="mb-4 font-body text-sm uppercase tracking-[0.28em] text-muted-foreground">
            Finale con personalità
          </p>
          <h2 className="mb-5 font-display text-4xl font-extrabold leading-none text-foreground sm:text-6xl">
            L’unica vera admin qui è la lavastoviglie.
          </h2>
          <p className="mb-6 font-body text-lg leading-relaxed text-muted-foreground">
            Passaci sopra col mouse o scorri la pagina: si muove lei, ma giudica comunque chi lascia i piatti "in ammollo" per tre giorni.
          </p>
          <div className="inline-flex rounded-full border border-border bg-card px-4 py-2 font-body text-sm text-foreground shadow-[0_14px_40px_hsl(var(--foreground)/0.08)]">
            Battuta inclusa, detersivo no.
          </div>
        </div>

        <div className="flex justify-center lg:justify-end [perspective:1600px]">
          <motion.div
            onMouseMove={handleMove}
            onMouseLeave={resetTilt}
            style={{ rotateX, rotateY, y: translateY, transformStyle: "preserve-3d" }}
            className="relative h-[360px] w-[320px] cursor-pointer select-none sm:h-[420px] sm:w-[380px]"
          >
            <motion.div
              aria-hidden="true"
              style={{ transform: "translateZ(-60px)", y: useTransform(scrollYProgress, [0, 1], [10, 32]) }}
              className="absolute left-6 right-6 top-12 h-[82%] rounded-[50%] bg-[radial-gradient(circle,hsl(var(--accent)/0.24),transparent_62%)] blur-3xl"
            />

            <div
              style={{ transform: "translateZ(0px)", transformStyle: "preserve-3d" }}
              className="dishwasher-shell absolute inset-0 rounded-[2.25rem] border border-border bg-card p-4 shadow-[0_28px_80px_hsl(var(--foreground)/0.18)]"
            >
              <div className="absolute inset-x-5 top-4 flex items-center justify-between rounded-full border border-border bg-muted/70 px-4 py-2 backdrop-blur-sm">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-secondary/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/80" />
                </div>
                <div className="font-body text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  eco rinse
                </div>
              </div>

              <div
                style={{ transform: "translateZ(26px)" }}
                className="absolute inset-x-5 bottom-5 top-16 overflow-hidden rounded-[1.75rem] border border-border bg-[linear-gradient(180deg,hsl(var(--primary)/0.05),hsl(var(--muted)/0.9))]"
              >
                <motion.div aria-hidden="true" className="absolute inset-0 opacity-70" style={{ background: sheen }} />

                <div className="absolute inset-x-5 top-5 h-24 rounded-[1.5rem] border border-border bg-background/70 shadow-inner">
                  <div className="mx-auto mt-4 h-3 w-24 rounded-full bg-muted" />
                  <div className="mx-auto mt-4 flex w-[78%] justify-between">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} className="h-10 w-3 rounded-full bg-muted" />
                    ))}
                  </div>
                </div>

                <div className="absolute inset-x-6 bottom-8 top-36 rounded-[1.5rem] border border-border bg-card/80 px-4 py-5 shadow-inner">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-body text-xs uppercase tracking-[0.22em] text-muted-foreground">
                        carico attuale
                      </p>
                      <p className="font-display text-2xl font-bold text-foreground">Piatti in revisione</p>
                    </div>
                    <div className="rounded-full bg-accent px-3 py-1 font-body text-xs font-semibold text-accent-foreground">
                      98% pulito
                    </div>
                  </div>

                  <div className="relative mt-8 h-28 rounded-[1.25rem] border border-border bg-muted/70">
                    <div className="absolute inset-x-3 bottom-5 h-3 rounded-full bg-border" />
                    <div className="absolute inset-x-6 bottom-8 flex justify-between">
                      {rackPlates.map((_, index) => (
                        <div
                          key={index}
                          className="h-16 w-12 rounded-t-[999px] rounded-b-[1rem] border border-border bg-background shadow-sm"
                          style={{ transform: `translateY(${(index % 2) * 6}px)` }}
                        />
                      ))}
                    </div>
                    <motion.div
                      animate={{ rotate: [0, 180] }}
                      transition={{ repeat: Infinity, duration: 3.4, ease: "linear" }}
                      className="absolute left-1/2 top-2 h-12 w-12 -translate-x-1/2"
                    >
                      <span className="absolute left-1/2 top-0 h-12 w-1 -translate-x-1/2 rounded-full bg-secondary" />
                      <span className="absolute left-0 top-1/2 h-1 w-12 -translate-y-1/2 rounded-full bg-secondary" />
                    </motion.div>
                    {waterLines.map((_, index) => (
                      <motion.span
                        key={index}
                        animate={{ opacity: [0.15, 0.8, 0.15], y: [0, -6, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: index * 0.18, ease: "easeInOut" }}
                        className="absolute h-8 w-px rounded-full bg-accent/60"
                        style={{ left: `${18 + index * 16}%`, top: "58%" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DishwasherShowcase;
