import { motion } from "framer-motion";

type Ingredient = {
  name: string;
  tag: "Base" | "Spezie" | "Fresco" | "Condimento" | "Altro";
};

// This will be replaced by a database-driven list with admin panel
const pantryItems: Ingredient[] = [
  { name: "Pasta (spaghetti, penne)", tag: "Base" },
  { name: "Riso basmati", tag: "Base" },
  { name: "Olio extravergine d'oliva", tag: "Condimento" },
  { name: "Sale e pepe", tag: "Spezie" },
  { name: "Aglio", tag: "Fresco" },
  { name: "Cipolla", tag: "Fresco" },
  { name: "Peperoncino", tag: "Spezie" },
  { name: "Curcuma", tag: "Spezie" },
  { name: "Salsa di soia", tag: "Condimento" },
  { name: "Latte di cocco", tag: "Base" },
  { name: "Pomodori pelati", tag: "Base" },
  { name: "Parmigiano Reggiano", tag: "Fresco" },
  { name: "Limoni", tag: "Fresco" },
  { name: "Aceto balsamico", tag: "Condimento" },
  { name: "Farina 00", tag: "Base" },
  { name: "Curry in polvere", tag: "Spezie" },
];

const tagColors: Record<string, string> = {
  Base: "bg-primary/10 text-primary border-primary/20",
  Spezie: "bg-secondary/15 text-secondary border-secondary/20",
  Fresco: "bg-green-500/10 text-green-700 border-green-500/20",
  Condimento: "bg-accent/10 text-accent border-accent/20",
  Altro: "bg-muted text-muted-foreground border-border",
};

const PantrySection = () => {
  return (
    <section id="pantry" className="py-24 sm:py-32 px-6 bg-muted/50">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl sm:text-5xl font-bold text-foreground text-center mb-4"
        >
          La mia <span className="text-secondary">Dispensa</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-body text-muted-foreground text-center mb-14 max-w-xl mx-auto"
        >
          Ingredienti sempre disponibili nella cucina. Puoi contare su questi
          come base di partenza per la tua Collab.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid sm:grid-cols-2 gap-3"
        >
          {pantryItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between py-3 px-4 rounded-lg bg-card border border-border hover:shadow-sm transition-shadow"
            >
              <span className="font-body text-sm text-foreground">
                {item.name}
              </span>
              <span
                className={`font-body text-xs font-medium px-3 py-1 rounded-full border ${tagColors[item.tag]}`}
              >
                {item.tag}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PantrySection;
