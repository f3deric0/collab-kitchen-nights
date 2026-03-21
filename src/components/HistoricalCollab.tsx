import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Star, Users, Trophy, X, Crown, ChefHat, Medal, Flame } from "lucide-react";
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

// ── Calcolo ranking persona ──────────────────────────────────────
// Score = (numero collab × 10) + (media rating × 20) + (volte capo × 5)
type PersonRank = {
  name: string;
  collabCount: number;
  chiefCount: number;
  avgRating: number | null;
  score: number;
  collabs: {
    id: string;
    title: string;
    date: string;
    rating: number | null;
    emoji: string | null;
    isChief: boolean;
    teammates: string[];
  }[];
};

const computeRankings = (history: CollabHistory[]): PersonRank[] => {
  const map = new Map<string, PersonRank>();

  for (const h of history) {
    const names = h.participants_names ?? [];
    for (const name of names) {
      if (!name.trim()) continue;
      if (!map.has(name)) {
        map.set(name, { name, collabCount: 0, chiefCount: 0, avgRating: null, score: 0, collabs: [] });
      }
      const p = map.get(name)!;
      const isChief = names[0] === name;
      p.collabCount++;
      if (isChief) p.chiefCount++;
      p.collabs.push({
        id: h.id,
        title: h.title,
        date: h.collab_date,
        rating: h.rating,
        emoji: h.emoji,
        isChief,
        teammates: names.filter(n => n !== name),
      });
    }
  }

  // Calcola avgRating e score
  for (const [, p] of map) {
    const rated = p.collabs.filter(c => c.rating !== null);
    p.avgRating = rated.length > 0
      ? rated.reduce((s, c) => s + (c.rating ?? 0), 0) / rated.length
      : null;
    p.score = (p.collabCount * 10) + ((p.avgRating ?? 0) * 20) + (p.chiefCount * 5);
    p.collabs.sort((a, b) => b.date.localeCompare(a.date));
  }

  return Array.from(map.values()).sort((a, b) => b.score - a.score);
};

const StarRow = ({ rating, size = "sm" }: { rating: number | null; size?: "sm" | "md" }) => {
  if (!rating) return <span className="font-body text-xs text-muted-foreground/60">Nessun rating</span>;
  const h = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${h} ${s <= Math.round(rating) ? "fill-accent text-accent" : "text-muted-foreground/20"}`} />
      ))}
    </div>
  );
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-body text-xs font-bold text-muted-foreground">#{rank}</span>;
};

const HistoricalCollab = () => {
  const [history, setHistory] = useState<CollabHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState<PersonRank | null>(null);

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

  const rankings = useMemo(() => computeRankings(history), [history]);

  if (!loading && history.length === 0) return null;

  return (
    <>
      <section id="storia" className="bg-background px-6 py-24 sm:py-28">
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
              Le serate già fatte
            </div>
            <h2 className="font-display text-4xl font-extrabold text-foreground sm:text-5xl">
              Chi cucina di più, <span className="text-secondary">vince</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
              Il ranking si aggiorna ad ogni collab confermata. Clicca su un nome per vedere la sua storia.
            </p>
          </motion.div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-[1.75rem] border border-border bg-muted/40" />)}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">

              {/* ── Ranking sidebar ── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="rounded-[2rem] border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Medal className="h-4 w-4 text-accent" />
                  <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-accent">Classifica cuochi</p>
                </div>
                <div className="space-y-2">
                  {rankings.map((person, idx) => (
                    <motion.button
                      key={person.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedPerson(person)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
                    >
                      {/* Rank badge */}
                      <RankBadge rank={idx + 1} />

                      {/* Nome */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-body text-sm font-bold text-foreground truncate">{person.name}</p>
                          {person.chiefCount > 0 && (
                            <Crown className="h-3 w-3 shrink-0 text-accent" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="font-body text-[11px] text-muted-foreground">
                            🍳 {person.collabCount} {person.collabCount === 1 ? "serata" : "serate"}
                          </span>
                          {person.avgRating && (
                            <span className="inline-flex items-center gap-0.5 font-body text-[11px] text-muted-foreground">
                              <Star className="h-3 w-3 fill-accent text-accent" />
                              {person.avgRating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-accent" />
                          <span className="font-display text-lg font-bold text-foreground">{Math.round(person.score)}</span>
                        </div>
                        <p className="font-body text-[10px] text-muted-foreground">punti</p>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Legenda score */}
                <div className="mt-4 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
                  <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-1">Come si calcola il punteggio</p>
                  <div className="space-y-0.5 font-body text-[11px] text-muted-foreground">
                    <p>🍳 Ogni serata = <span className="font-semibold text-foreground">+10 pt</span></p>
                    <p>👑 Ogni volta capo collab = <span className="font-semibold text-foreground">+5 pt</span></p>
                    <p>⭐ Media rating × 20 = <span className="font-semibold text-foreground">fino a +100 pt</span></p>
                  </div>
                </div>
              </motion.div>

              {/* ── Cards collab ── */}
              <div className="space-y-4">
                {history.map((item, i) => {
                  const names = item.participants_names ?? [];
                  const chief = names[0] ?? null;
                  const others = names.slice(1);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm"
                    >
                      {/* Sfondo emoji */}
                      <div className="pointer-events-none absolute right-4 top-4 text-6xl opacity-[0.07] select-none">{item.emoji ?? "🍳"}</div>

                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji ?? "🍳"}</span>
                          <div>
                            <h3 className="font-display text-lg font-bold text-foreground">{item.title}</h3>
                            <p className="font-body text-xs text-muted-foreground">
                              {format(new Date(item.collab_date + "T00:00:00"), "d MMMM yyyy", { locale: it })}
                            </p>
                          </div>
                        </div>
                        {item.rating && (
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <StarRow rating={item.rating} />
                            <span className="font-body text-[10px] text-muted-foreground">{item.rating}/5</span>
                          </div>
                        )}
                      </div>

                      {item.description && (
                        <p className="mb-3 font-body text-sm leading-relaxed text-muted-foreground italic line-clamp-1">
                          "{item.description}"
                        </p>
                      )}

                      {/* Partecipanti cliccabili */}
                      {names.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mr-1">Chi c'era:</span>
                          {chief && (
                            <button
                              onClick={() => {
                                const rank = rankings.find(r => r.name === chief);
                                if (rank) setSelectedPerson(rank);
                              }}
                              className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-body text-xs font-bold text-accent transition hover:bg-accent hover:text-accent-foreground"
                            >
                              <Crown className="h-3 w-3" />{chief}
                            </button>
                          )}
                          {others.map(name => (
                            <button
                              key={name}
                              onClick={() => {
                                const rank = rankings.find(r => r.name === name);
                                if (rank) setSelectedPerson(rank);
                              }}
                              className="rounded-full border border-border bg-muted/60 px-2.5 py-1 font-body text-xs font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
                            >
                              {name}
                            </button>
                          ))}
                          <span className="ml-auto font-body text-[11px] text-muted-foreground">
                            <Users className="mr-0.5 inline h-3 w-3" />{item.participants}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Popup persona ── */}
      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setSelectedPerson(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Header popup */}
              <div className="mb-5 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-2xl shrink-0">
                    <ChefHat className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-accent mb-0.5">Profilo cuoco</p>
                    <h3 className="font-display text-2xl font-bold text-foreground">{selectedPerson.name}</h3>
                    {/* Stats rapide */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 font-body text-xs font-semibold text-foreground">
                        🍳 {selectedPerson.collabCount} {selectedPerson.collabCount === 1 ? "serata" : "serate"}
                      </span>
                      {selectedPerson.chiefCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-2.5 py-1 font-body text-xs font-bold text-yellow-600">
                          <Crown className="h-3 w-3" />{selectedPerson.chiefCount}× capo collab
                        </span>
                      )}
                      {selectedPerson.avgRating && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-body text-xs font-bold text-accent">
                          <Star className="h-3 w-3 fill-accent" />{selectedPerson.avgRating.toFixed(1)} media
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedPerson(null)}
                  className="rounded-full p-2 text-muted-foreground transition hover:bg-muted shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Punteggio totale */}
              <div className="mb-4 shrink-0 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-body text-xs text-muted-foreground">Punteggio totale</p>
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-5 w-5 text-accent" />
                    <p className="font-display text-3xl font-extrabold text-foreground">{Math.round(selectedPerson.score)}</p>
                    <span className="font-body text-sm text-muted-foreground">punti</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-body text-xs text-muted-foreground">Posizione</p>
                  <div className="mt-0.5 flex justify-end">
                    <RankBadge rank={rankings.findIndex(r => r.name === selectedPerson.name) + 1} />
                  </div>
                </div>
              </div>

              {/* Lista collab */}
              <div className="overflow-y-auto space-y-2 flex-1">
                <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2">Tutte le serate</p>
                {selectedPerson.collabs.map((c, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <span className="text-lg shrink-0">{c.emoji ?? "🍳"}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-body text-sm font-semibold text-foreground">{c.title}</p>
                            {c.isChief && (
                              <span className="inline-flex items-center gap-0.5 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-body text-[10px] font-bold text-accent">
                                <Crown className="h-2.5 w-2.5" /> capo
                              </span>
                            )}
                          </div>
                          <p className="font-body text-xs text-muted-foreground mt-0.5">
                            {format(new Date(c.date + "T00:00:00"), "d MMM yyyy", { locale: it })}
                          </p>
                          {c.teammates.length > 0 && (
                            <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                              con: {c.teammates.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {c.rating ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <StarRow rating={c.rating} size="sm" />
                            <span className="font-body text-[10px] text-muted-foreground">{c.rating}/5</span>
                          </div>
                        ) : (
                          <span className="font-body text-[10px] text-muted-foreground/50">no rating</span>
                        )}
                      </div>
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
