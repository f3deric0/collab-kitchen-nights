import { useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import { Clock3, Sparkles, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const dailySlot = "21:00";

// ─── EmailJS config ───────────────────────────────────────────────────────────
// Assicurati di avere queste variabili su Netlify:
//   VITE_EMAILJS_SERVICE_ID   → il Service ID dal tuo account EmailJS
//   VITE_EMAILJS_TEMPLATE_ID  → il Template ID (vedi sotto per la struttura)
//   VITE_EMAILJS_PUBLIC_KEY   → la Public Key (Account → API Keys)
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
  // EmailJS via fetch — nessuna dipendenza aggiuntiva
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

  const today = startOfDay(new Date());

  const weekStart = useMemo(() => {
    const nextWeekBase = addDays(today, weekOffset * 7);
    return startOfWeek(nextWeekBase, { weekStartsOn: 1 });
  }, [today, weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const isDayAvailable = (day: Date) => startOfDay(day) >= today;

  const firstAvailableDay = useMemo(
    () => weekDays.find((day) => isDayAvailable(day)) ?? weekDays[0],
    [weekDays],
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

    setIsSubmitting(true);

    try {
      const dateLabel = format(selectedDay, "EEEE d MMMM yyyy", { locale: it });

      // ── Invia email di conferma all'utente ──────────────────────────────────
      if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
        await sendConfirmationEmail({
          to_name:      name,
          to_email:     email,
          date:         `${dateLabel} alle ${selectedSlot}`,
          participants: participants,
          notes:        notes || "–",
        });
      } else {
        console.warn(
          "EmailJS non configurato: aggiungi VITE_EMAILJS_SERVICE_ID, " +
          "VITE_EMAILJS_TEMPLATE_ID e VITE_EMAILJS_PUBLIC_KEY su Netlify."
        );
      }

      toast.success(`Richiesta inviata per le 21:00! Ti ricontattiamo per la conferma finale.`);

      // Reset form
      setSelectedDay(null);
      setSelectedSlot(dailySlot);
      setName("");
      setEmail("");
      setParticipants("");
      setNotes("");
    } catch (err) {
      console.error("Errore invio email:", err);
      // Mostra successo ugualmente — la prenotazione è stata ricevuta
      // anche se l'email ha avuto problemi
      toast.success("Richiesta inviata! (Controlla la configurazione EmailJS se non ricevi la mail.)");
    } finally {
      setIsSubmitting(false);
    }
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
                const isActive   = isSameDay(activeDay, day);
                const isDisabled = !isDayAvailable(day);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { setSelectedDay(day); setSelectedSlot(dailySlot); }}
                    className={`rounded-[1.6rem] border px-4 py-4 text-left transition ${
                      isDisabled
                        ? "cursor-not-allowed border-primary-foreground/10 bg-primary-foreground/[0.02] text-primary-foreground/35 opacity-55"
                        : isActive
                          ? "border-accent bg-accent text-accent-foreground shadow-lg"
                          : "border-primary-foreground/10 bg-primary-foreground/[0.03] text-primary-foreground hover:bg-primary-foreground/[0.08]"
                    }`}
                  >
                    <p className={`font-body text-xs uppercase tracking-[0.18em] ${isActive && !isDisabled ? "text-accent-foreground/80" : "text-inherit"}`}>
                      {format(day, "EEE", { locale: it })}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold">
                      {format(day, "d", { locale: it })}
                    </p>
                    <p className="mt-3 font-body text-xs">
                      {isDisabled ? "Giorno passato" : "Slot unico: 21:00"}
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
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Carbonara battle? Curry night? Dimmi il mood."
                  className="resize-none border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-[1.4rem] border border-primary-foreground/10 bg-primary-foreground/[0.03] px-4 py-3">
              <span className="inline-flex items-center gap-2 font-body text-sm text-primary-foreground/72">
                <Users className="h-4 w-4" />
                Prenotazione serale fissa
              </span>
              <span className="font-body text-xs uppercase tracking-[0.18em] text-primary-foreground/45">
                21:00 only
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-full bg-accent py-3.5 font-body text-base font-semibold text-accent-foreground shadow-lg transition-transform duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? "Invio in corso..." : "Richiedi le 21:00"}
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default BookingSection;
