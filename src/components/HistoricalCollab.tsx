import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Star, Users, Trophy, X, Crown, ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type CollabHistory = {
  id: string;
  title: string;
  description: string | null;
  collab_date: string;
  participants: number;
  rating: number | null;
  emoji: string | null;
  participants_names: string[] | null;
};

type PersonStats = {
  name: string;
  collabs: { title: string; date: string; rating: number | null; emoji: string | null; isChief: boolean }[];
};

const StarRow = ({ rating }: { rating: number | null }) => {
  if (!rating) return <span className="font-body text-xs text-muted-foreground">Nessun rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-accent text-accent" : "text-muted-foreground/20"}`} />
      ))}
    </div>
  );
};

const HistoricalCollab = () => {
  const [history, setHistory] = useState<CollabHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [personPopup, setPersonPopup] = useState<PersonStats | null>(null);

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

  // Calcola statistiche di una persona attraverso tutte le collab
  const getPersonStats = (name: string): PersonStats => {
    const collabs = history
      .filter(h => h.participants_names && h.participants_names.includes(name))
      .map(h => ({
        title: h.title,
        date: h.collab_date,
        rating: h.rating,
        emoji: h.emoji,
        isChief: h.participants_names?.[0] === name,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
    return { name, collabs };
  };

  const handleNameClick = (name: string) => {
    setPersonPopup(getPersonStats(name));
  };

  const avgRating = (collabs: PersonStats["collabs"]) => {
    const rated = collabs.filter(c => c.rating);
    if (!rated.length) return null;
    return (rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length).toFixed(1);
  };

  return (
    <>
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
              Un archivio delle collab passate. Clicca su un nome per vedere la sua storia.
            </p>
          </motion.div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[1,2,3].map(i => <div key={i} className="h-52 animate-pulse rounded-[1.75rem] border border-border bg-muted/40" />)}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((item, i) => {
                const names = item.participants_names ?? [];
                const chief = names[0] ?? null;
                const others = names.slice(1);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* Sfondo decorativo */}
                    <div className="pointer-events-none absolute right-3 top-3 text-5xl opacity-8 select-none">{item.emoji ?? "🍳"}</div>

                    {/* Header card */}
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <span className="text-2xl">{item.emoji ?? "🍳"}</span>
                      <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 font-body text-[11px] font-semibold text-muted-foreground">
                        {format(new Date(item.collab_date + "T00:00:00"), "d MMM yyyy", { locale: it })}
                      </span>
                    </div>

                    <h3 className="mb-1 font-display text-lg font-bold text-foreground">{item.title}</h3>

                    {item.description && (
                      <p className="mb-3 font-body text-sm leading-relaxed text-muted-foreground line-clamp-2 italic">
                        "{item.description}"
                      </p>
                    )}

                    {/* Rating */}
                    <div className="mb-3">
                      <StarRow rating={item.rating} />
                    </div>

                    {/* Partecipanti */}
                    {names.length > 0 && (
                      <div className="border-t border-border pt-3">
                        <p className="mb-2 font-body text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                          <Users className="mr-1 inline h-3 w-3" /> Chi c'era
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {/* Capo collab */}
                          {chief && (
                            <button
                              onClick={() => handleNameClick(chief)}
                              className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-body text-xs font-bold text-accent transition hover:bg-accent hover:text-accent-foreground"
                            >
                              <Crown className="h-3 w-3" />
                              {chief}
                            </button>
                          )}
                          {/* Altri partecipanti */}
                          {others.map(name => (
                            <button
                              key={name}
                              onClick={() => handleNameClick(name)}
                              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 font-body text-xs font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Popup persona */}
      <AnimatePresence>
        {personPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setPersonPopup(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              {/* Header popup */}
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-xl">
                      <ChefHat className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-accent">Profilo cuoco</p>
                      <h3 className="font-display text-2xl font-bold text-foreground">{personPopup.name}</h3>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <span className="rounded-full border border-border bg-muted/60 px-3 py-1 font-body text-xs font-semibold text-foreground">
                      🍳 {personPopup.collabs.length} {personPopup.collabs.length === 1 ? "serata" : "serate"}
                    </span>
                    {avgRating(personPopup.collabs) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-body text-xs font-bold text-accent">
                        <Star className="h-3 w-3 fill-accent" />
                        {avgRating(personPopup.collabs)} media
                      </span>
                    )}
                    {personPopup.collabs.some(c => c.isChief) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 font-body text-xs font-bold text-yellow-600">
                        <Crown className="h-3 w-3" />
                        {personPopup.collabs.filter(c => c.isChief).length}x capo collab
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setPersonPopup(null)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Lista collab */}
              <div className="space-y-2">
                {personPopup.collabs.map((c, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{c.emoji ?? "🍳"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-body text-sm font-semibold text-foreground truncate">{c.title}</p>
                          {c.isChief && <Crown className="h-3 w-3 shrink-0 text-accent" />}
                        </div>
                        <p className="font-body text-xs text-muted-foreground">
                          {format(new Date(c.date + "T00:00:00"), "d MMM yyyy", { locale: it })}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StarRow rating={c.rating} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HistoricalCollab;
