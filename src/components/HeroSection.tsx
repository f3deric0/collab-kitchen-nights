import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import heroImage from "@/assets/hero-dinner.jpg";

const HeroSection = () => {
  const scrollToBooking = () => {
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Cena condivisa nella cucina comune"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsla(222, 56%, 11%, 0.55) 0%, hsla(222, 56%, 11%, 0.85) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-display text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-primary-foreground leading-[0.95] mb-6"
        >
          Collab @<br />
          <span className="text-gradient">Milestone Lombos</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-body text-lg sm:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Unisci ingredienti, talento e buona compagnia. Ogni sera, la cucina
          comune diventa il palcoscenico di una cena indimenticabile.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <button
            onClick={scrollToBooking}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-body font-semibold text-lg px-8 py-4 rounded-full hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
          >
            Prenota una Collab
          </button>
        </motion.div>
      </div>

      {/* Location badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="flex items-center gap-2 bg-primary/60 backdrop-blur-md text-primary-foreground/90 font-body text-sm px-5 py-2.5 rounded-full border border-primary-foreground/10">
          <MapPin className="w-4 h-4 text-secondary" />
          Milestone Carcavelos Lombos – Carcavelos, Portugal
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
