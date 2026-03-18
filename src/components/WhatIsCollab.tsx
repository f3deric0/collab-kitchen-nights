import { motion } from "framer-motion";
import { CalendarDays, ShoppingBag, UtensilsCrossed } from "lucide-react";

const steps = [
  {
    icon: CalendarDays,
    title: "Scegli una data",
    description: "Trova una sera libera e prenota la tua Collab in pochi click.",
  },
  {
    icon: ShoppingBag,
    title: "Porta i tuoi ingredienti",
    description: "Ognuno contribuisce con quello che ha: la magia è nel mix.",
  },
  {
    icon: UtensilsCrossed,
    title: "Cuciniamo e mangiamo insieme",
    description: "Si cucina fianco a fianco e si condivide il risultato a tavola.",
  },
];

const WhatIsCollab = () => {
  return (
    <section id="what" className="py-24 sm:py-32 px-6 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6"
        >
          Cos'è la <span className="text-secondary">Collab</span>?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-body text-lg text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed"
        >
          Un'esperienza sociale tra residenti del Milestone: ingredienti condivisi,
          capacità culinarie diverse e la cucina comune come punto d'incontro.
          Nessuno chef stellato, solo buona compagnia.
        </motion.p>

        {/* Timeline */}
        <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mb-5">
                <step.icon className="w-7 h-7 text-secondary" />
              </div>
              <div className="text-sm font-body font-semibold text-secondary mb-2 tracking-wide uppercase">
                Step {i + 1}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="font-body text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatIsCollab;
