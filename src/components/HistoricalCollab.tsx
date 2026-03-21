import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Star, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CollabHistory = {
  id: string;
  title: string;
  description: string | null;
  collab_date: string;
  participants: number;
  rating: number | null;
  emoji: string | null;
};

const StarRating = ({ rating }: { rating: number | null }) => {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
};

const HistoricalCollab = () => {
  const [history, setHistory] = useState<CollabHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from("collab_history")
        .select("*")
        .order("collab_date", { ascending: false });
      setHistory(data ?? []);
      setLoading(false);
    };
    void fetch();
  }, []);

  if (!loading && history.length === 0) return null;

  return (
    <section id="storia" className="bg-muted/30 px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/8 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.28em] text-secondary">
            <Trophy className="h-3.5 w-3.5" />
            Historical Collab
          </div>
          <h2 className="font-display text-4xl font-extrabold text-foreground sm:text-5xl">
            Le serate <span className="text-secondary">già fatte</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
            Un archivio delle collab passate — con i voti di chi c'era.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 animate-pulse rounded-[1.75rem] border border-border bg-muted/40" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Sfondo decorativo */}
                <div className="pointer-events-none absolute right-3 top-3 text-5xl opacity-10 select-none">
                  {item.emoji ?? "🍳"}
                </div>

                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="text-2xl">{item.emoji ?? "🍳"}</span>
                  <span className="rounded-full border border-border bg-muted/60 px-3 py-1 font-body text-xs font-semibold text-muted-foreground">
                    {format(new Date(item.collab_date + "T00:00:00"), "d MMM yyyy", { locale: it })}
                  </span>
                </div>

                <h3 className="mb-1 font-display text-lg font-bold text-foreground">{item.title}</h3>

                {item.description && (
                  <p className="mb-3 font-body text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 font-body text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {item.participants} persone
                  </span>
                  <StarRating rating={item.rating} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HistoricalCollab;
