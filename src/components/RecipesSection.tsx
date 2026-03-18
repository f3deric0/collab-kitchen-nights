import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AdminEntryButton from "@/components/AdminEntryButton";
import {
  DEFAULT_RECIPES,
  fetchPublicRecipes,
  recipeDifficultyClasses,
} from "@/lib/publicContent";
import { Clock } from "lucide-react";

const RecipesSection = () => {
  const { data: recipes = DEFAULT_RECIPES } = useQuery({
    queryKey: ["public-recipes"],
    queryFn: fetchPublicRecipes,
  });

  return (
    <section id="recipes" className="bg-background px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center font-display text-4xl font-bold text-foreground sm:text-5xl"
          >
            Ricette & <span className="text-secondary">Idee</span>
          </motion.h2>
          <AdminEntryButton />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mb-14 max-w-xl text-center font-body text-muted-foreground"
        >
          Ispirazione rapida per la tua prossima Collab. Non servono istruzioni dettagliate, basta la scintilla giusta.
        </motion.p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 flex items-center gap-2">
                <span className={`rounded-full border px-3 py-1 font-body text-xs font-semibold ${recipeDifficultyClasses[recipe.difficulty] ?? recipeDifficultyClasses.Facile}`}>
                  {recipe.difficulty}
                </span>
                <span className="flex items-center gap-1 font-body text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {recipe.time_label}
                </span>
              </div>
              <h3 className="mb-2 font-display text-lg font-bold text-foreground transition-colors group-hover:text-secondary">
                {recipe.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">{recipe.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecipesSection;
