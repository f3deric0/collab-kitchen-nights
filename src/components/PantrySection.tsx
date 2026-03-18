import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import AdminEntryButton from "@/components/AdminEntryButton";
import {
  DEFAULT_PANTRY,
  fetchPublicPantry,
  pantryCategoryClasses,
  pantryCategoryLabels,
} from "@/lib/publicContent";

const PantrySection = () => {
  const { data: pantryItems = DEFAULT_PANTRY } = useQuery({
    queryKey: ["public-pantry"],
    queryFn: fetchPublicPantry,
  });

  return (
    <section id="pantry" className="bg-muted/50 px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center font-display text-4xl font-bold text-foreground sm:text-5xl"
          >
            La mia <span className="text-secondary">Dispensa</span>
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
          Ingredienti sempre disponibili nella cucina. Puoi contare su questi come base di partenza per la tua Collab.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-3 sm:grid-cols-2"
        >
          {pantryItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-shadow hover:shadow-sm"
            >
              <span className="font-body text-sm text-foreground">{item.name}</span>
              <span
                className={`rounded-full border px-3 py-1 font-body text-xs font-medium ${pantryCategoryClasses[item.category]}`}
              >
                {pantryCategoryLabels[item.category]}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PantrySection;
