import { motion } from "framer-motion";
import { Clock, ChefHat } from "lucide-react";

const recipes = [
  {
    title: "Pasta alla Carbonara",
    description: "Il classico romano: guanciale croccante, uova, pecorino e pepe. Semplicità perfetta.",
    time: "25 min",
    difficulty: "Facile",
  },
  {
    title: "Thai Green Curry",
    description: "Latte di cocco, pasta di curry verde, verdure di stagione e riso basmati.",
    time: "35 min",
    difficulty: "Media",
  },
  {
    title: "Tacos al Pastor",
    description: "Tortillas calde, carne marinata, cipolla, coriandolo e lime. Festa messicana.",
    time: "40 min",
    difficulty: "Media",
  },
  {
    title: "Risotto ai Funghi",
    description: "Riso carnaroli mantecato con porcini, parmigiano e un filo d'olio al tartufo.",
    time: "30 min",
    difficulty: "Media",
  },
  {
    title: "Hummus & Pita Board",
    description: "Hummus cremoso, pita calda, verdure crude e feta sbriciolata. Perfetto per condividere.",
    time: "20 min",
    difficulty: "Facile",
  },
  {
    title: "Stir-Fry Noodles",
    description: "Noodles saltati con verdure croccanti, salsa di soia, zenzero e sesamo tostato.",
    time: "20 min",
    difficulty: "Facile",
  },
];

const difficultyColor: Record<string, string> = {
  Facile: "bg-green-500/15 text-green-700",
  Media: "bg-accent/15 text-accent",
  Difficile: "bg-destructive/15 text-destructive",
};

const RecipesSection = () => {
  return (
    <section id="recipes" className="py-24 sm:py-32 px-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl sm:text-5xl font-bold text-foreground text-center mb-4"
        >
          Ricette & <span className="text-secondary">Idee</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-body text-muted-foreground text-center mb-14 max-w-xl mx-auto"
        >
          Ispirazione rapida per la tua prossima Collab. Non servono istruzioni
          dettagliate, basta la scintilla giusta.
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, i) => (
            <motion.div
              key={recipe.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group rounded-xl border border-border bg-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`font-body text-xs font-semibold px-3 py-1 rounded-full ${difficultyColor[recipe.difficulty]}`}
                >
                  {recipe.difficulty}
                </span>
                <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {recipe.time}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-secondary transition-colors">
                {recipe.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {recipe.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecipesSection;
