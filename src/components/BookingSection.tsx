import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import { Clock3, Sparkles, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const dailySlot = "21:00";

// ─── EmailJS config ───────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

async function sendConfirmationEmail(params: {
  to_name: string;
  to_email: string;
  date: string;
  participants: string;
  notes: string;
}) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id:     EMAILJS_PUBLIC_KEY,
      template_params: params,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EmailJS error: ${text}`);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const BookingSection = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(dailySlot);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Giorni occupati e prenotazioni pending da Supabase
  const [busyDates, setBusyDates] = useState<Set<string>>(new Set());
  const [pendingDates, setPendingDates] = useState<Set<string>>(new Set());
  const [confirmedDates, setConfirmedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAvailability = async () => {
      const today = new Date().toISOString().split("T")[0];
      const c = supabase as any;
      const [busyRes, bookRes] = await Promise.all([
        c.from("busy_days").select("date"),
        c.from("booking_requests")
          .select("requested_date,status")
          .gte("requested_date", today),
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

  const weekStart = useMemo(() => {
    const nextWeekBase = addDays(today, weekOffset * 7);
    return startOfWeek(nextWeekBase, { weekStartsOn: 1 });
  }, [today, weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const isPast = startOfDay(day) < today;
    if (isPast) return "past";
    if (busyDates.has(dateStr)) return "busy";
    if (confirmedDates.has(dateStr)) return "confirmed";
    if (pendingDates.has(dateStr)) return "pending";
    return "free";
  };

  const isDayAvailable = (day: Date) => {
    const status = getDayStatus(day);
    return status === "free" || status === "pending";
  };

  const firstAvailableDay = useMemo(
    () => weekDays.find((day) => isDayAvailable(day)) ?? weekDays[0],
    [weekDays, busyDates, confirmedDates],
  );

  const slotsForDay = (day: Date) => [
    { time: dailySlot, available: isDayAvailable(day) },
  ];

  const activeDay = selectedDay && isDayAvailable(selectedDay) ? selectedDay : firstAvailableDay;
  const availableSlots = slotsForDay(activeDay);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedDay || !selectedSlot || !name || !email || !participants) {
      toast.error("Scegli il giorno delle 21:00 e compila i campi obbligatori.");
      return;
    }

    const dateStr = format(selectedDay, "yyyy-MM-dd");
    const status = getDayStatus(selectedDay);
    if (status === "busy") {
      toast.error("Questo giorno non è disponibile.");
      return;
    }
    if (status === "confirmed") {
      toast.error("Questo giorno è già confermato per un'altra collab.");
      return;
    }

    setIsSubmitting(true);

    try {
      const dateLabel = format(selectedDay, "EEEE d MMMM yyyy", { locale: it });

      // ── Salva su Supabase con status "pending" ──────────────────────────────
      const { error: dbError } = await (supabase as any)
        .from("booking_requests")
        .insert({
          name,
          email,
          participants: parseInt(participants, 10),
          requested_date: dateStr,
          requested_time: selectedSlot,
          notes: notes || null,
          status: "pending",
        });

      if (dbError) throw dbError;

      // Aggiorna stato locale
      setPendingDates((prev) => new Set([...prev, dateStr]));

      // ── Invia email di conferma ──────────────────────────────────────────────
      if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
        await sendConfirmationEmail({
          to_name:      name,
          to_email:     email,
          date:         `${dateLabel} alle ${selectedSlot}`,
          participants: participants,
          notes:        notes || "–",
        });
      }

      toast.success(
        `Richiesta inviata! Sei in lista d'attesa per le 21:00 del ${format(selectedDay, "d MMM", { locale: it })}. Ti ricontatteremo presto.`,
        { duration: 6000 }
      );

      // Reset form
      setSelectedDay(null);
      setSelectedSlot(dailySlot);
      setName("");
      setEmail("");
      setParticipants("");
      setNotes("");
    } catch (err) {
      console.error("Errore:", err);
      toast.error("Qualcosa è andato storto. Riprova tra poco.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Badge colore per ogni stato giorno
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
    const status = getDayStatus(day);
    if (status === "past") return "Giorno passato";
    if (status === "busy") return "Non disponibile";
    if (status === "confirmed") return "Già confermato";
    if (status === "pending") return "In attesa · 21:00";
    return "Slot unico: 21:00";
  };

  return (
    <section id="booking" className="bg-primary px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="mb-4 font-body text-sm uppercase tracking-[0.3em] text-primary-foreground/55">
            Planner settimanale
          </p>
          <h2 className="font-display text-4xl font-extrabold text-primary-foreground sm:text-6xl">
            Un solo slot disponibile al giorno: <span className="text-accent">21:00</span>.
          </h2>
          <p className="mt-5 font-body text-base leading-relaxed text-primary-foreground/72 sm:text-lg">
            Scegli solo il giorno: l'orario è fisso, sempre alle 21:00, una richiesta per sera.
          </p>
          {/* Legenda */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 font-body text-xs text-primary-foreground/60">
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border border-primary-foreground/20 bg-primary-foreground/5"/>&nbsp;Libero</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border border-yellow-400/40 bg-yellow-400/20"/>&nbsp;In attesa</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border border-green-500/30 bg-green-500/15"/>&nbsp;Confermato</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm border border-red-500/30 bg-red-500/10"/>&nbsp;Non disponibile</span>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          {/* ── Calendario settimanale ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="overflow-hidden rounded-[2rem] border border-primary-foreground/10 bg-primary-foreground/[0.04] p-4 shadow-[0_24px_80px_hsl(var(--foreground)/0.16)] backdrop-blur-sm sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-body text-xs uppercase tracking-[0.22em] text-primary-foreground/45">
                  Settimana attiva
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-primary-foreground">
                  {format(weekDays[0], "d MMM", { locale: it })} —{" "}
                  {format(weekDays[6], "d MMM", { locale: it })}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((c) => Math.max(0, c - 1))}
                  disabled={weekOffset === 0}
                  className="rounded-full border border-primary-foreground/15 px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 disabled:opacity-40"
                >
                  Prec.
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((c) => c + 1)}
                  className="rounded-full border border-primary-foreground/15 px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10"
                >
                  Succ.
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              {weekDays.map((day) => {
                const status = getDayStatus(day);
                const isDisabled = status === "past" || status === "busy" || status === "confirmed";
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { if (!isDisabled) { setSelectedDay(day); setSelectedSlot(dailySlot); } }}
                    className={`rounded-[1.6rem] border px-4 py-4 text-left transition ${getDayClasses(day)}`}
                  >
                    <p className={`font-body text-xs uppercase tracking-[0.18em] ${isSameDay(activeDay, day) && !isDisabled ? "text-accent-foreground/80" : "text-inherit"}`}>
                      {format(day, "EEE", { locale: it })}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold">
                      {format(day, "d", { locale: it })}
                    </p>
                    <p className="mt-3 font-body text-xs">
                      {getDayLabel(day)}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[1.7rem] border border-primary-foreground/10 bg-primary-foreground/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-primary-foreground/45">
                    Orario disponibile
                  </p>
                  <h4 className="mt-1 font-display text-2xl font-bold text-primary-foreground">
                    {format(activeDay, "EEEE d MMMM", { locale: it })}
                  </h4>
                </div>
                <div className="rounded-full bg-primary-foreground/10 px-3 py-2 font-body text-xs font-semibold text-primary-foreground/80">
                  1 slot al giorno
                </div>
              </div>

              <div className="grid gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`flex items-center justify-between rounded-[1.2rem] border px-4 py-4 font-body text-sm font-semibold transition ${
                      !slot.available
                        ? "cursor-not-allowed border-primary-foreground/10 bg-primary-foreground/[0.03] text-primary-foreground/40"
                        : selectedSlot === slot.time
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-primary-foreground/10 bg-background text-foreground hover:-translate-y-0.5 hover:border-accent/60"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-base">
                      <Clock3 className="h-4 w-4" />
                      {slot.time}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em]">
                      {slot.available ? "slot fisso" : "non disponibile"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Form ──────────────────────────────────────────────────────────── */}
          <motion.form
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-primary-foreground/10 bg-primary-foreground/[0.04] p-6 shadow-[0_24px_80px_hsl(var(--foreground)/0.16)] backdrop-blur-sm"
          >
            {/* Data selezionata */}
            <div className="mb-6 rounded-[1.5rem] border border-accent/20 bg-accent/10 p-4 text-accent-foreground">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.2em] text-primary-foreground/55">
                    Selezione attiva
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary-foreground">
                    {selectedDay && selectedSlot
                      ? `${format(selectedDay, "EEE d MMM", { locale: it })} · ${selectedSlot}`
                      : "Scegli il giorno delle 21:00"}
                  </p>
                  {selectedDay && getDayStatus(selectedDay) === "pending" && (
                    <p className="mt-1 font-body text-xs text-yellow-400 font-semibold">
                      ⏳ Ci sono già richieste in attesa per questo giorno
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">
                  Nome *
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome"
                  className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35"
                />
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">
                  Email * <span className="text-primary-foreground/45 text-xs normal-case tracking-normal">(riceverai la conferma qui)</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="la-tua@email.com"
                  className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35"
                />
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">
                  Partecipanti *
                </Label>
                <Input
                  type="number"
                  min={2}
                  max={10}
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Quanti sarete?"
                  className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35"
                />
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">
                  Idee per la cena
                  <span className="ml-1 text-primary-foreground/45 text-xs normal-case tracking-normal">(scrivi "manca X" se ti serve un ingrediente!)</span>
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder='Es: "Carbonara battle? Curry night? manca la guanciale…"'
                  className="resize-none border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-[1.4rem] border border-primary-foreground/10 bg-primary-foreground/[0.03] px-4 py-3">
              <span className="inline-flex items-center gap-2 font-body text-sm text-primary-foreground/72">
                <Users className="h-4 w-4" />
                La tua richiesta va in lista d'attesa
              </span>
              <span className="font-body text-xs uppercase tracking-[0.18em] text-primary-foreground/45">
                pending
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-full bg-accent py-3.5 font-body text-base font-semibold text-accent-foreground shadow-lg transition-transform duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? "Invio in corso..." : "Richiedi le 21:00 🍳"}
            </button>
            <p className="mt-3 text-center font-body text-xs text-primary-foreground/40">
              La prenotazione è in attesa finché Chicco non la conferma.
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
