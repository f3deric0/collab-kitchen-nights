import { motion } from "framer-motion";
import { MapPin, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-collab-editorial.jpg";

const HeroSection = () => {
  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Tavola apparecchiata per una cena collaborativa in una cucina moderna"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--primary)/0.18),hsl(var(--primary)/0.88))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--accent)/0.16),transparent_42%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary/35 px-4 py-2 font-body text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/88 backdrop-blur-md"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          Dinner collab · ogni sera
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-primary-foreground sm:text-7xl lg:text-8xl"
        >
          Collab con Chicco<br />
          <span className="text-gradient">@ Milestone Lombos</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mb-10 max-w-2xl font-body text-lg leading-relaxed text-primary-foreground/82 sm:text-xl"
        >
          Una tavola più bella, una cucina piena di luce e un solo obiettivo: trasformare ogni sera in una cena condivisa da ricordare.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <button
            onClick={scrollToBooking}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-body text-lg font-semibold text-accent-foreground shadow-lg transition-transform duration-300 hover:scale-105 hover:shadow-xl"
          >
            Prenota una Collab
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex items-center gap-2 rounded-full border border-primary-foreground/10 bg-primary/60 px-5 py-2.5 font-body text-sm text-primary-foreground/90 backdrop-blur-md">
          <MapPin className="h-4 w-4 text-secondary" />
          Milestone Carcavelos Lombos – Carcavelos, Portugal
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
