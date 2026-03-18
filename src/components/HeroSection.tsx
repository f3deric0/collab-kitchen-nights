import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import heroImage from "@/assets/hero-collab-dinner.jpg";

const HeroSection = () => {
  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Cena condivisa in una cucina moderna con amici che ridono attorno al tavolo"
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "var(--hero-gradient)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-primary-foreground sm:text-7xl lg:text-8xl"
        >
          Collab @<br />
          <span className="text-gradient">Milestone Lombos</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mb-10 max-w-2xl font-body text-lg leading-relaxed text-primary-foreground/80 sm:text-xl"
        >
          Una cena bella da vedere, facile da organizzare e ancora meglio da condividere. Tu scegli il giorno, il sito fa venire fame.
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

