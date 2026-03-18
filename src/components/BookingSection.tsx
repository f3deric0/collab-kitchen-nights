import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BookingSection = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample busy dates (will be replaced by Google Calendar integration)
  const busyDates = [
    new Date(2026, 2, 20),
    new Date(2026, 2, 22),
    new Date(2026, 2, 25),
    new Date(2026, 2, 28),
  ];

  const isBusy = (day: Date) =>
    busyDates.some(
      (d) =>
        d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth() &&
        d.getFullYear() === day.getFullYear()
    ) || day < new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !name || !email || !participants) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    setIsSubmitting(true);
    // Simulated submission — will be replaced by Google Calendar API
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Richiesta inviata! Ti contatteremo presto per confermare.");
    setName("");
    setEmail("");
    setParticipants("");
    setNotes("");
    setDate(undefined);
    setIsSubmitting(false);
  };

  return (
    <section id="booking" className="py-24 sm:py-32 px-6 bg-primary">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground text-center mb-4"
        >
          Prenota la tua Collab
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-body text-primary-foreground/70 text-center mb-14 max-w-xl mx-auto"
        >
          Scegli una data libera, dicci chi sei e cosa vorresti cucinare.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid lg:grid-cols-2 gap-10 items-start"
        >
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={isBusy}
              className={cn(
                "p-4 pointer-events-auto rounded-xl bg-primary-foreground/5 border border-primary-foreground/10"
              )}
              classNames={{
                day_selected: "bg-accent text-accent-foreground hover:bg-accent",
                day_today: "bg-secondary/30 text-primary-foreground",
                day: "text-primary-foreground/80 hover:bg-primary-foreground/10 font-body",
                head_cell: "text-primary-foreground/50 font-body text-xs",
                caption: "font-display text-primary-foreground font-semibold",
                nav_button: "text-primary-foreground/60 hover:text-primary-foreground",
              }}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-primary-foreground/80 font-body text-sm mb-1.5 block">
                Nome *
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Il tuo nome"
                className="bg-primary-foreground/5 border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/30 font-body"
              />
            </div>
            <div>
              <Label className="text-primary-foreground/80 font-body text-sm mb-1.5 block">
                Email *
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="la-tua@email.com"
                className="bg-primary-foreground/5 border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/30 font-body"
              />
            </div>
            <div>
              <Label className="text-primary-foreground/80 font-body text-sm mb-1.5 block">
                Partecipanti *
              </Label>
              <Input
                type="number"
                min={2}
                max={10}
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                placeholder="Quanti sarete?"
                className="bg-primary-foreground/5 border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/30 font-body"
              />
            </div>
            <div>
              <Label className="text-primary-foreground/80 font-body text-sm mb-1.5 block">
                Idee per la cena
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Pasta alla carbonara? Curry thai? Dicci tutto..."
                rows={3}
                className="bg-primary-foreground/5 border-primary-foreground/15 text-primary-foreground placeholder:text-primary-foreground/30 font-body resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent text-accent-foreground font-body font-semibold text-base py-3.5 rounded-full hover:scale-[1.02] transition-transform duration-300 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? "Invio in corso..." : "Richiedi Collab"}
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default BookingSection;
