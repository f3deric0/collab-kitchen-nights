import { useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import { Clock3, Sparkles, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const dailySlot = "21:00";

const BookingSection = () => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekStart = useMemo(() => {
    const today = new Date();
    const nextWeekBase = addDays(today, weekOffset * 7);
    return startOfWeek(nextWeekBase, { weekStartsOn: 1 });
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );

  const slotsForDay = (day: Date) => {
    const today = startOfWeek(new Date(), { weekStartsOn: 1 });
    return [
      {
        time: dailySlot,
        available: day >= today,
      },
    ];
  };

  const activeDay = selectedDay ?? weekDays[0];
  const availableSlots = slotsForDay(activeDay);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedDay || !selectedSlot || !name || !email || !participants) {
      toast.error("Scegli il giorno delle 21:00 e compila i campi obbligatori.");
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    toast.success("Richiesta inviata per le 21:00! Ti ricontattiamo per la conferma finale.");
    setSelectedDay(null);
    setSelectedSlot(null);
    setName("");
    setEmail("");
    setParticipants("");
    setNotes("");
    setIsSubmitting(false);
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
            Un solo slot al giorno: <span className="text-accent">sempre alle 21:00</span>.
          </h2>
          <p className="mt-5 font-body text-base leading-relaxed text-primary-foreground/72 sm:text-lg">
            Selezioni il giorno, scegli lo slot fisso delle 21:00 e invii la richiesta in pochi secondi.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
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
                  {format(weekDays[0], "d MMM", { locale: it })} — {format(weekDays[6], "d MMM", { locale: it })}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((current) => Math.max(0, current - 1))}
                  className="rounded-full border border-primary-foreground/15 px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 disabled:opacity-40"
                  disabled={weekOffset === 0}
                >
                  Prec.
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((current) => current + 1)}
                  className="rounded-full border border-primary-foreground/15 px-4 py-2 font-body text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10"
                >
                  Succ.
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
              {weekDays.map((day) => {
                const isActive = isSameDay(activeDay, day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day);
                      setSelectedSlot(dailySlot);
                    }}
                    className={`rounded-[1.6rem] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-accent bg-accent text-accent-foreground shadow-lg"
                        : "border-primary-foreground/10 bg-primary-foreground/[0.03] text-primary-foreground hover:bg-primary-foreground/[0.08]"
                    }`}
                  >
                    <p className={`font-body text-xs uppercase tracking-[0.18em] ${isActive ? "text-accent-foreground/80" : "text-primary-foreground/50"}`}>
                      {format(day, "EEE", { locale: it })}
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold">{format(day, "d", { locale: it })}</p>
                    <p className={`mt-3 font-body text-xs ${isActive ? "text-accent-foreground/85" : "text-primary-foreground/65"}`}>
                      Slot unico: 21:00
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[1.7rem] border border-primary-foreground/10 bg-primary-foreground/[0.03] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.18em] text-primary-foreground/45">Slot disponibile</p>
                  <h4 className="mt-1 font-display text-2xl font-bold text-primary-foreground">
                    {format(activeDay, "EEEE d MMMM", { locale: it })}
                  </h4>
                </div>
                <div className="rounded-full bg-primary-foreground/10 px-3 py-2 font-body text-xs font-semibold text-primary-foreground/80">
                  Solo un orario
                </div>
              </div>

              <div className="grid gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`flex items-center justify-between rounded-[1.2rem] border px-4 py-4 font-body text-sm font-semibold transition ${
                      selectedSlot === slot.time
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-primary-foreground/10 bg-background text-foreground hover:-translate-y-0.5 hover:border-accent/60"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 text-base">
                      <Clock3 className="h-4 w-4" />
                      {slot.time}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em]">available</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-primary-foreground/10 bg-primary-foreground/[0.04] p-6 shadow-[0_24px_80px_hsl(var(--foreground)/0.16)] backdrop-blur-sm"
          >
            <div className="mb-6 rounded-[1.5rem] border border-accent/20 bg-accent/10 p-4 text-accent-foreground">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-accent" />
                <div>
                  <p className="font-body text-xs uppercase tracking-[0.2em] text-primary-foreground/55">Selezione attiva</p>
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
                <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">Nome *</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Il tuo nome" className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35" />
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">Email *</Label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="la-tua@email.com" className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35" />
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">Partecipanti *</Label>
                <Input type="number" min={2} max={10} value={participants} onChange={(event) => setParticipants(event.target.value)} placeholder="Quanti sarete?" className="border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35" />
              </div>
              <div>
                <Label className="mb-1.5 block font-body text-sm text-primary-foreground/80">Idee per la cena</Label>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Carbonara battle? Curry night? Dimmi il mood." className="resize-none border-primary-foreground/15 bg-primary-foreground/[0.04] font-body text-primary-foreground placeholder:text-primary-foreground/35" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-[1.4rem] border border-primary-foreground/10 bg-primary-foreground/[0.03] px-4 py-3">
              <span className="inline-flex items-center gap-2 font-body text-sm text-primary-foreground/72">
                <Users className="h-4 w-4" />
                Prenotazione serale fissa
              </span>
              <span className="font-body text-xs uppercase tracking-[0.18em] text-primary-foreground/45">21:00 daily</span>
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
