import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ChefHat, Plus, Users, ShoppingBag, ArrowRight, Sparkles, X, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type CollabProposal = {
  id: string;
  name: string;
  requested_date: string;
  requested_time: string | null;
  participants: number;
  notes: string | null;
};

const COLLAB_IDEAS = [
  { emoji: "🍝", idea: "Pasta battle", desc: "Ognuno porta la sua ricetta preferita" },
  { emoji: "🌮", idea: "Taco night", desc: "Guacamole, tortillas e tutto il resto" },
  { emoji: "🍣", idea: "Sushi roll", desc: "Chi sa arrotolare insegna gli altri" },
  { emoji: "🥘", idea: "Curry collettivo", desc: "Spezie da tutto il mondo" },
  { emoji: "🍕", idea: "Pizza in casa", desc: "Impasto a mano, farciture libere" },
  { emoji: "🥗", idea: "Bowl fest", desc: "Buddha bowl con ingredienti condivisi" },
];

const CollabBoard = () => {
  const [proposals, setProposals] = useState<CollabProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set());
  const [confirmedDates, setConfirmedDates] = useState<Set<string>>(new Set());

  const [showProposeForm, setShowProposeForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joiningCollab, setJoiningCollab] = useState<CollabProposal | null>(null);

  // Propose form
  const [propName, setPropName] = useState("");
  const [propEmail, setPropEmail] = useState("");
  const [propDate, setPropDate] = useState("");
  const [propIdea, setPropIdea] = useState("");
  const [propMissing, setPropMissing] = useState("");
  const [propSubmitting, setPropSubmitting] = useState(false);
  const [dateError, setDateError] = useState("");

  // Join form
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinBrings, setJoinBrings] = useState("");
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const c = supabase as any;
    const [proposalsRes, busyRes, bookRes] = await Promise.all([
      c.from("booking_requests")
        .select("id,name,requested_date,requested_time,participants,notes,status")
        .eq("status", "pending")
        .gte("requested_date", today)
        .not("notes", "ilike", "JOIN REQUEST%")
        .order("requested_date", { ascending: true })
        .limit(10),
      c.from("busy_days").select("date"),
      c.from("booking_requests").select("requested_date,status").eq("status", "confirmed").gte("requested_date", today),
    ]);
    setProposals(proposalsRes.data ?? []);
    setBusyDates(new Set((busyRes.data ?? []).map((d: any) => d.date)));
    setConfirmedDates(new Set((bookRes.data ?? []).map((b: any) => b.requested_date)));
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, []);

  // Quando l'utente cambia la data nel form proposta, valida subito
  const handleDateChange = (date: string) => {
    setPropDate(date);
    setDateError("");
    if (!date) return;
    if (busyDates.has(date)) {
      setDateError("❌ Chicco è impegnato quel giorno — scegli un'altra data.");
    } else if (confirmedDates.has(date)) {
      setDateError("❌ C'è già una collab confermata quel giorno — scegli un'altra data.");
    }
  };

  const getMissing = (notes: string | null) => {
    if (!notes) return null;
    const patterns = [/manca[no]?\s+([^,.!?—]+)/i, /serve\s+([^,.!?—]+)/i, /cerco\s+([^,.!?—]+)/i];
    for (const p of patterns) { const m = notes.match(p); if (m) return m[1].trim(); }
    return null;
  };

  const getIdea = (notes: string | null) => {
    if (!notes) return null;
    const cleaned = notes.replace(/manca[no]?\s+[^,.!?—]+/gi, "").replace(/JOIN REQUEST[^)]+\)/gi, "").replace(/Partecipanti:[^—]+/gi, "").trim().replace(/^—\s*/, "").replace(/\s*—\s*$/, "");
    return cleaned.split(/[.!?]/)[0].trim() || null;
  };

  const handlePropose = async () => {
    if (!propName || !propEmail || !propDate) { toast.error("Inserisci nome, email e data."); return; }
    if (busyDates.has(propDate)) { toast.error("Chicco è impegnato quel giorno. Scegli un'altra data."); return; }
    if (confirmedDates.has(propDate)) { toast.error("C'è già una collab confermata quel giorno."); return; }

    setPropSubmitting(true);
    try {
      const notes = [propIdea, propMissing ? `manca ${propMissing}` : ""].filter(Boolean).join(" — ");
      const { error } = await (supabase as any).from("booking_requests").insert({
        name: propName, email: propEmail,
        participants: 1,
        requested_date: propDate,
        requested_time: "21:00",
        notes: notes || null,
        status: "pending",
      });
      if (error) throw error;
      toast.success("Collab proposta! Apparirà subito nella bacheca 🍳");
      setShowProposeForm(false);
      setPropName(""); setPropEmail(""); setPropDate(""); setPropIdea(""); setPropMissing(""); setDateError("");
      await fetchData();
    } catch (e) {
      toast.error("Errore nell'invio. Riprova.");
    } finally {
      setPropSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!joinName || !joinEmail || !joiningCollab) { toast.error("Inserisci nome ed email."); return; }
    setJoinSubmitting(true);
    try {
      const notes = `JOIN REQUEST — si unisce alla collab di ${joiningCollab.name} (ref: ${joiningCollab.id})${joinBrings ? ` — porta: ${joinBrings}` : ""}`;
      const { error } = await (supabase as any).from("booking_requests").insert({
        name: joinName, email: joinEmail,
        participants: 1,
        requested_date: joiningCollab.requested_date,
        requested_time: joiningCollab.requested_time ?? "21:00",
        notes, status: "pending",
      });
      if (error) throw error;
      toast.success("Richiesta inviata! Chicco vi metterà in contatto 🎉");
      setShowJoinForm(false); setJoiningCollab(null);
      setJoinName(""); setJoinEmail(""); setJoinBrings("");
    } catch (e) {
      toast.error("Errore nell'invio. Riprova.");
    } finally {
      setJoinSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const inputClass = "w-full rounded-xl border border-input bg-background px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <>
      <section id="collab-board" className="bg-background px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/8 px-4 py-2 font-body text-xs font-bold uppercase tracking-[0.28em] text-accent">
              <Sparkles className="h-3.5 w-3.5" /> Collab aperte
            </div>
            <h2 className="font-display text-4xl font-extrabold text-foreground sm:text-5xl">
              Unisciti a una <span className="text-secondary">serata</span>.
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-body text-base leading-relaxed text-muted-foreground">
              Qualcuno ha già un'idea ma gli manca un ingrediente o un compagno di cucina. Unisciti, oppure proponi la tua collab.
            </p>
          </motion.div>

          {/* Idee rapide */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-8 overflow-x-auto">
            <div className="flex gap-3 pb-2">
              <span className="shrink-0 self-center font-body text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">Idee per la prossima settimana →</span>
              {COLLAB_IDEAS.map(idea => (
                <button key={idea.idea}
                  onClick={() => { setPropIdea(`${idea.idea} — ${idea.desc}`); setShowProposeForm(true); }}
                  className="shrink-0 rounded-2xl border border-border bg-card px-4 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md">
                  <span className="text-lg">{idea.emoji}</span>
                  <p className="mt-1 font-body text-xs font-semibold text-foreground">{idea.idea}</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Proposals */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map(i => <div key={i} className="h-40 animate-pulse rounded-[1.75rem] border border-border bg-muted/40" />)}
            </div>
          ) : proposals.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-[2rem] border border-dashed border-border bg-muted/20 px-8 py-16 text-center">
              <ChefHat className="mx-auto mb-4 h-10 w-10 text-muted-foreground/30" />
              <p className="font-display text-xl font-bold text-foreground">Nessuna collab aperta</p>
              <p className="mt-2 font-body text-sm text-muted-foreground">Sii il primo a proporre una serata!</p>
            </motion.div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {proposals.map((p, i) => {
                const missing = getMissing(p.notes);
                const idea = getIdea(p.notes);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                    <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-xl">🍳</div>
                        <div>
                          <p className="font-body text-sm font-bold text-foreground">{p.name}</p>
                          <p className="font-body text-xs text-muted-foreground">propone una collab</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-border bg-muted/60 px-3 py-1 font-body text-xs font-semibold text-foreground">
                        📅 {format(new Date(p.requested_date + "T00:00:00"), "d MMM", { locale: it })}
                      </span>
                    </div>
                    {idea && <p className="mb-3 font-body text-sm italic text-muted-foreground line-clamp-2">"{idea}"</p>}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 font-body text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> {p.participants} {p.participants === 1 ? "persona" : "persone"}
                      </span>
                      {missing && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-400/10 px-2.5 py-1 font-body text-xs font-semibold text-orange-600">
                          <ShoppingBag className="h-3 w-3" /> manca: {missing}
                        </span>
                      )}
                    </div>
                    <button onClick={() => { setJoiningCollab(p); setShowJoinForm(true); }}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-accent/10 py-2.5 font-body text-sm font-bold text-accent transition hover:bg-accent hover:text-accent-foreground">
                      <Heart className="h-4 w-4" /> Unisciti <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* CTA proponi */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8 flex justify-center">
            <button onClick={() => setShowProposeForm(true)}
              className="inline-flex items-center gap-2.5 rounded-full border-2 border-dashed border-accent/40 bg-accent/5 px-6 py-3 font-body text-sm font-bold text-accent transition hover:border-accent hover:bg-accent/10">
              <Plus className="h-4 w-4" /> Proponi la tua collab
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Modal: Proponi ── */}
      <AnimatePresence>
        {showProposeForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 backdrop-blur-sm overflow-y-auto py-8"
            onClick={e => { if (e.target === e.currentTarget) setShowProposeForm(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="mb-1 font-body text-xs font-bold uppercase tracking-[0.24em] text-accent">Nuova proposta</p>
                  <h3 className="font-display text-2xl font-bold text-foreground">Proponi una collab</h3>
                  <p className="mt-1 font-body text-sm text-muted-foreground">Descrivi la tua idea — gli altri potranno unirti.</p>
                </div>
                <button onClick={() => setShowProposeForm(false)} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block font-body text-xs font-semibold text-foreground">Il tuo nome *</label>
                    <input value={propName} onChange={e => setPropName(e.target.value)} placeholder="Federico" className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block font-body text-xs font-semibold text-foreground">Data *</label>
                    <input type="date" value={propDate} min={todayStr} onChange={e => handleDateChange(e.target.value)}
                      className={`${inputClass} ${dateError ? "border-red-400 focus:ring-red-400/40" : ""}`} />
                    {dateError && <p className="mt-1 font-body text-xs text-red-500">{dateError}</p>}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-xs font-semibold text-foreground">Email *</label>
                  <input type="email" value={propEmail} onChange={e => setPropEmail(e.target.value)} placeholder="tua@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-xs font-semibold text-foreground">La tua idea 💡</label>
                  <textarea value={propIdea} onChange={e => setPropIdea(e.target.value)} rows={2}
                    placeholder="Es: Pasta battle, ognuno porta la sua ricetta preferita…"
                    className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-xs font-semibold text-foreground">
                    <ShoppingBag className="mr-1 inline h-3.5 w-3.5 text-orange-500" /> Manca qualcosa? (opzionale)
                  </label>
                  <input value={propMissing} onChange={e => setPropMissing(e.target.value)}
                    placeholder="Es: guanciale, pasta fresca, vino bianco…" className={inputClass} />
                  <p className="mt-1 font-body text-xs text-muted-foreground">Apparirà come badge — gli altri possono offrirsi di portarlo</p>
                </div>
              </div>

              <button onClick={handlePropose} disabled={propSubmitting || !!dateError || !propDate}
                className="mt-5 w-full rounded-full bg-accent py-3 font-body text-sm font-bold text-accent-foreground shadow-md transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100">
                {propSubmitting ? "Pubblicazione…" : "Pubblica la tua collab 🍳"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal: Unisciti ── */}
      <AnimatePresence>
        {showJoinForm && joiningCollab && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) { setShowJoinForm(false); setJoiningCollab(null); } }}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-[2rem] border border-border bg-card p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="mb-1 font-body text-xs font-bold uppercase tracking-[0.24em] text-accent">Unisciti</p>
                  <h3 className="font-display text-2xl font-bold text-foreground">Collab di {joiningCollab.name}</h3>
                  <p className="mt-1 font-body text-sm text-muted-foreground">
                    {format(new Date(joiningCollab.requested_date + "T00:00:00"), "EEEE d MMMM", { locale: it })} · {joiningCollab.requested_time ?? "21:00"}
                  </p>
                </div>
                <button onClick={() => { setShowJoinForm(false); setJoiningCollab(null); }} className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>

              {getMissing(joiningCollab.notes) && (
                <div className="mb-4 rounded-[1.2rem] border border-orange-400/30 bg-orange-400/8 px-4 py-3">
                  <p className="font-body text-sm">
                    <span className="font-semibold">🛒 Porta con te:</span>{" "}
                    <span className="font-bold text-orange-600">{getMissing(joiningCollab.notes)}</span>
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block font-body text-xs font-semibold text-foreground">Il tuo nome *</label>
                  <input value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Il tuo nome" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-xs font-semibold text-foreground">Email *</label>
                  <input type="email" value={joinEmail} onChange={e => setJoinEmail(e.target.value)} placeholder="tua@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block font-body text-xs font-semibold text-foreground">
                    <ShoppingBag className="mr-1 inline h-3.5 w-3.5 text-accent" /> Cosa porti? (opzionale)
                  </label>
                  <input value={joinBrings} onChange={e => setJoinBrings(e.target.value)} placeholder="Es: guanciale, vino, dessert…" className={inputClass} />
                </div>
              </div>

              <button onClick={handleJoin} disabled={joinSubmitting}
                className="mt-5 w-full rounded-full bg-accent py-3 font-body text-sm font-bold text-accent-foreground shadow-md transition hover:scale-[1.02] disabled:opacity-50">
                {joinSubmitting ? "Invio…" : "Manda richiesta di join 🙌"}
              </button>
              <p className="mt-3 text-center font-body text-xs text-muted-foreground">Chicco riceverà la tua richiesta e vi mette in contatto.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CollabBoard;
