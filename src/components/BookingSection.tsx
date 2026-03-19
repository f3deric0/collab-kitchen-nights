import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3, Sparkles, Users, ArrowRight, ArrowLeft, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const dailySlot = "21:00";

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

async function sendConfirmationEmail(params: {
  to_name: string; to_email: string; date: string; participants: string; notes: string;
}) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: params,
    }),
  });
  if (!res.ok) throw new Error(`EmailJS error: ${await res.text()}`);
}

const BookingSection = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(dailySlot);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2
  const [step, setStep] = useState<1 | 2>(1);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [missingItem, setMissingItem] = useState("");
  const [publishMissing, setPublishMissing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set());
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set());
  const [confirmedDates, setConfirmedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAvailability = async () => {
      const today = new Date().toISOString().split("T")[0];
      const c = supabase as any;
      const [busyRes, bookRes] = await Promise.all([
        c.from("busy_days").select("date"),
        c.from("booking_requests").select("requested_date,status").gte("requested_date", today),
      ]);
      if (busyRes.data) setBusyDates(new Set(busyRes.data.map((d: any) => d.date)));
      if (bookRes.data) {
        const pending = new Set<string>();
        const confirmed = new Set<string>();
        for (const b of bookRes.data) {
          if (b.status === "pending") pending.add(b.requested_date);
          if (b.status === "confirmed") confirmed.add(b.requested_date);
        }
        setPendingDates(pending);
        setConfirmedDates(confirmed);
      }
    };
    void fetchAvailability();
  }, []);

  const today = startOfDay(new Date());
  const weekStart = useMemo(() => startOfWeek(addDays(today, weekOffset * 7), { weekStartsOn: 1 }), [today, weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    if (startOfDay(day) < today) return "past";
    if (busyDates.has(dateStr)) return "busy";
    if (confirmedDates.has(dateStr)) return "confirmed";
    if (pendingDates.has(dateStr)) return "pending";
    return "free";
  };

  const isDayAvailable = (day: Date) => { const s = getDayStatus(day); return s === "free" || s === "pending"; };
  const firstAvailableDay = useMemo(() => weekDays.find(isDayAvailable) ?? weekDays[0], [weekDays, busyDates, confirmedDates]);
  const activeDay = selectedDay && isDayAvailable(selectedDay) ? selectedDay : firstAvailableDay;

  const getDayClasses = (day: Date) => {
    const status = getDayStatus(day);
    const isActive = isSameDay(activeDay, day);
    if (status === "past") return "cursor-not-allowed border-primary-foreground/10 bg-primary-foreground/[0.02] text-primary-foreground/35 opacity-55";
    if (status === "busy") return "cursor-not-allowed border-red-500/30 bg-red-500/10 text-primary-foreground/40 opacity-70";
    if (status === "confirmed") return "cursor-not-allowed border-green-500/30 bg-green-500/10 text-primary-foreground/40 opacity-70";
    if (isActive) return "border-accent bg-accent text-accent-foreground shadow-lg";
    if (status === "pending") return "border-yellow-400/40 bg-yellow-400/10 text-primary-foreground hover:bg-yellow-400/20 cursor-pointer";
    return "border-primary-foreground/10 bg-primary-foreground/[0.03] text-primary-foreground hover:bg-primary-foreground/[0.08]";
  };

  const getDayLabel = (day: Date) => {
    const s = getDayStatus(day);
    if (s === "past") return "Passato";
    if (s === "busy") return "Non disponibile";
    if (s === "confirmed") return "Già confermato";
    if (s === "pending") return "⏳ In attesa";
    return "21:00 · libero";
  };

  const numParticipants = parseInt(participants, 10) || 0;
  useEffect(() => {
    setParticipantNames(prev => {
      const arr = [...prev];
      while (arr.length < numParticipants) arr.push("");
      return arr.slice(0, numParticipants);
    });
  }, [numParticipants]);

  const handleGoStep2 = () => {
    if (!selectedDay || !selectedSlot || !name || !email || !participants) {
      toast.error("Compila tutti i campi obbligatori prima di continuare.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const dateStr = format(selectedDay!, "yyyy-MM-dd");
      const dateLabel = format(selectedDay!, "EEEE d MMMM yyyy", { locale: it });
      const notesParts = [
        notes || null,
        participantNames.filter(Boolean).length > 0 ? `Partecipanti: ${participantNames.filter(Boolean).join(", ")}` : null,
        missingItem && publishMissing ? `manca ${missingItem}` : null,
        missingItem && !publishMissing ? `serve: ${missingItem}` : null,
      ].filter(Boolean);
      const fullNotes = notesParts.join(" — ") || null;

      const { error: dbError } = await (supabase as any).from("booking_requests").insert({
        name, email,
        participants: parseInt(participants, 10),
        requested_date: dateStr,
        requested_time: selectedSlot,
        notes: fullNotes,
        status: "pending",
      });
      if (dbError) throw dbError;

      setPendingDates(prev => new Set([...prev, dateStr]));

      if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
        await sendConfirmationEmail({ to_name: name, to_email: email, date: `${dateLabel} alle ${selectedSlot}`, participants, notes: fullNotes ?? "–" }).catch(console.warn);
      }

      toast.success(
        publishMissing && missingItem
          ? `Richiesta inviata! La tua collab è in bacheca con "manca ${missingItem}" 🍳`
          : `Sei in lista d'attesa per il ${format(selectedDay!, "d MMM", { locale: it })} alle 21:00!`,
        { duration: 7000 }
      );

      setSelectedDay(null); setSelectedSlot(dailySlot);
      setName(""); setEmail(""); setParticipants(""); setNotes("");
      setParticipantNames([]); setMissingItem(""); setPublishMissing(false); setStep(1);
    } catch (err) {
      console.error(err);
      toast.error("Errore nell'invio. Controlla la connessione e riprova.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slotAvailable = isDayAvailable(activeDay);

  return (
    <section id="booking" className="bg-primary px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-4 font-body text-sm uppercase tracking-[0.3em] text-primary-foreground/55">Planner settimanale</p>
          <h2 className="font-display text-4xl font-extrabold text-primary-foreground sm:text-6xl">
            Un solo slot disponibile al giorno: <span className="text-accent">21:00</span>.
          </h2>
          <p className="mt-5 font-body text-base leading-relaxed text-primary-foreground/72 sm:text-lg">
            Scegli il giorno — la tua prenotazione va in lista d'attesa finché Chicco la conferma.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 font-body text-xs text-primary-foreground/60">
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border border-primary-foreground/20 bg-primary-foreground/5" /> Libero</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border border-yellow-400/40 bg-yellow-400/20" /> In attesa</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border border-green-500/30 bg-green-500/15" /> Confermato</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border border-red-500/30 bg-red-500/10" /> Non disponibile</span>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          {/* Calendario */}
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="overflow-hidden rounded-[2rem] border border-primary-foreground/10 bg-primary-foreground/[0.04] p-4 shadow-[0_24px_80px_hsl(var(--foreground)/0.16)] backdrop-blur-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.22em] text-primary-foreground/45">Settimana attiva</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-primary-foreground">
                  {format(weekDays[0], "d MMM", { locale: it })} — {format(weekDays[6], "d MMM", { locale: it })}
                </h3>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setWeekOffset(c => Math.max(0, c - 1))} disabled={weekOffset === 0}
                  className="rounded-full border border-primary-foreground/15 px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 disabled:opacity-40">Prec.</button>
                <button type="button" onClick={() => setWeekOffset(c => c + 1)}
                  className="rounded-full border border-primary-foreground/15 px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10">Succ.</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              {weekDays.map(day => {
                const status = getDayStatus(day);
                const isDisabled = status === "past" || status === "busy" || status === "confirmed";
                return (
                  <button key={day.toISOString()} type="button" disabled={isDisabled}
                    onClick={() => { if (!isDisabled) { setSelectedDay(day); setSelectedSlot(dailySlot); setStep(1); } }}
                    className={`rounded-[1.6rem] border px-4 py-4 text-left transition ${getDayClasses(day)}`}>
                    <p className={`font-body text-xs uppercase tracking-[0.18em] ${isSameDay(activeDay, day) && !isDisabled ? "text-accent-foreground/80" : "text-inherit"}`}>
                      {format(day, "EEE", { locale: it })}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold">{format(day, "d", { locale: it })}</p>
                    <p className="mt-3 font-body text-[11px] leading-tight">{getDayLabel(day)}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 rounded-[1.7rem] border border-primary-foreground/10 bg-primary-foreground/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-primary-foreground/45">Orario disponibile</p>
                  <h4 className="mt-1 font-display text-2xl font-bold text-primary-foreground">{format(activeDay, "EEEE d MMMM", { locale: it })}</h4>
                </div>
                <div className="rounded-full bg-primary-foreground/10 px-3 py-2 font-body text-xs font-semibold text-primary-foreground/80">1 slot al giorno</div>
              </div>
              <button type="button" disabled={!slotAvailable} onClick={() => setSelectedSlot(dailySlot)}
                className={`flex w-full items-center justify-between rounded-[1.2rem] border px-4 py-4 font-body text-sm font-semibold transition ${
                  !slotAvailable ? "cursor-not-allowed border-primary-foreground/10 bg-primary-foreground/[0.03] text-primary-foreground/40"
                  : selectedSlot === dailySlot ? "border-accent bg-accent text-accent-foreground"
                  : "border-primary-foreground/10 bg-background text-foreground hover:-translate-y-0.5 hover:border-accent/60"}`}>
                <span className="inline-flex items-center gap-2 text-base"><Clock3 className="h-4 w-4" />{dailySlot}</span>
                <span className="text-[11px] uppercase tracking-[0.16em]">{slotAvailable ? "slot fisso" : "non disponibile"}</span>
              </button>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-[2rem] border border-primary-foreground/10 bg-primary-foreground/[0.04] p-6 shadow-[0_24px_80px_hsl(var(--foreground)/0.16)] backdrop-blur-sm">

            {/* Step indicator */}
            <div className="mb-5 flex items-center gap-2">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full font-body text-xs font-bold transition ${step === s ? "bg-accent text-accent-foreground" : step > s ? "bg-accent/30 text-accent" : "bg-primary-foreground/10 text-primary-foreground/40"}`}>{s}</div>
                  <span className={`font-body text-xs font-semibold transition ${step === s ? "text-primary-foreground" : "text-primary-foreground/40"}`}>{s === 1 ? "Dati base" : "Dettagli"}</span>
                  {s < 2 && <div className="h-px w-5 bg-primary-foreground/15" />}
                </div>
              ))}
            </div>

            {/* Data */}
            <div className="mb-5 rounded-[1.5rem] border border-accent/20 bg-accent/10 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.2em] text-primary-foreground/55">Selezione attiva</p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary-foreground">
                    {selectedDay && selectedSlot ? `${format(selectedDay, "EEE d MMM", { locale: it })} · ${selectedSlot}` : "Scegli il giorno delle 21:00"}
                  </p>
                  {selectedDay && getDayStatus(selectedDay) === "pending" && (
                    <p className="mt-1 font-body text-xs font-semibold text-yellow-400">⏳ Ci sono già richieste in attesa</p>
                  )}
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-4">
                  <div>
                    <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">Nome *</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Il tuo nome"
                      className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">Email * <span className="text-xs normal-case tracking-normal text-primary-foreground/45">(riceverai la conferma)</span></Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="la-tua@email.com"
                      className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">Partecipanti *</Label>
                    <Input type="number" min={1} max={10} value={participants} onChange={e => setParticipants(e.target.value)} placeholder="Quanti sarete?"
                      className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">Idee per la cena</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                      placeholder="Carbonara battle? Curry night? Dimmi il mood."
                      className="resize-none border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35" />
                  </div>
                  <button type="button" onClick={handleGoStep2}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-body text-base font-semibold text-accent-foreground shadow-lg transition hover:scale-[1.02]">
                    Continua <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
                  {numParticipants > 0 && (
                    <div>
                      <Label className="mb-3 block font-body text-sm font-semibold text-primary-foreground/80">
                        <Users className="mr-1.5 inline h-4 w-4" /> Chi viene? ({numParticipants} {numParticipants === 1 ? "persona" : "persone"})
                      </Label>
                      <div className="space-y-2">
                        {participantNames.map((pName, idx) => (
                          <Input key={idx} value={pName}
                            onChange={e => setParticipantNames(arr => arr.map((v, i) => i === idx ? e.target.value : v))}
                            placeholder={idx === 0 ? `${name || "Tu"} (organizzatore)` : `Persona ${idx + 1}`}
                            className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-sm text-primary-foreground placeholder:text-primary-foreground/30" />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-[1.5rem] border border-primary-foreground/10 bg-primary-foreground/[0.03] p-4">
                    <Label className="mb-3 block font-body text-sm font-semibold text-primary-foreground/80">
                      <ShoppingBag className="mr-1.5 inline h-4 w-4 text-orange-400" /> Manca qualcosa o qualcuno?
                    </Label>
                    <Input value={missingItem} onChange={e => setMissingItem(e.target.value)}
                      placeholder="Es: guanciale, vino bianco, un quarto cuoco…"
                      className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-sm text-primary-foreground placeholder:text-primary-foreground/30" />
                    {missingItem && (
                      <motion.label initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-accent/20 bg-accent/8 p-3">
                        <input type="checkbox" checked={publishMissing} onChange={e => setPublishMissing(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded accent-[hsl(var(--accent))]" />
                        <div>
                          <p className="font-body text-sm font-semibold text-primary-foreground">Pubblica nella bacheca Collab aperte</p>
                          <p className="font-body text-xs text-primary-foreground/50">Gli altri residenti vedranno che manca "{missingItem}" e potranno unirsi</p>
                        </div>
                      </motion.label>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex items-center gap-2 rounded-full border border-primary-foreground/20 px-5 py-3 font-body text-sm font-semibold text-primary-foreground/70 transition hover:bg-primary-foreground/10">
                      <ArrowLeft className="h-4 w-4" /> Indietro
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent py-3 font-body text-base font-semibold text-accent-foreground shadow-lg transition hover:scale-[1.02] disabled:opacity-50">
                      {isSubmitting ? "Invio…" : "Richiedi le 21:00 🍳"}
                    </button>
                  </div>
                  <p className="text-center font-body text-xs text-primary-foreground/40">
                    La prenotazione va in attesa finché Chicco non la conferma.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
