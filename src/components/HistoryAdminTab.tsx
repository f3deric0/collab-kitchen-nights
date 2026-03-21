import { useEffect, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Star, Plus, Trash2, Save, Sparkles, CalendarX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const EMOJIS = ["🍝", "🍕", "🌮", "🍣", "🥘", "🥗", "🍳", "🍜", "🫕", "🥩"];

const StarPicker = ({ value, onChange }: { value: number | null; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)}
        className="transition hover:scale-110">
        <Star className={`h-6 w-6 ${s <= (value ?? 0) ? "fill-accent text-accent" : "text-muted-foreground/30 hover:text-accent/60"}`} />
      </button>
    ))}
    {value && <button type="button" onClick={() => onChange(0)} className="ml-2 font-body text-xs text-muted-foreground hover:text-destructive">reset</button>}
  </div>
);

export const HistoryAdminTab = () => {
  const [items, setItems] = useState<CollabHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleanupCount, setCleanupCount] = useState<number | null>(null);

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newParticipants, setNewParticipants] = useState("2");
  const [newRating, setNewRating] = useState<number | null>(null);
  const [newEmoji, setNewEmoji] = useState("🍳");

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("collab_history")
      .select("*")
      .order("collab_date", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const saveRating = async (id: string, rating: number | null) => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("collab_history")
        .update({ rating: rating || null })
        .eq("id", id);
      if (error) throw error;
      setItems(prev => prev.map(x => x.id === id ? { ...x, rating: rating || null } : x));
      toast.success("Rating salvato ⭐");
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  const deleteItem = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("collab_history").delete().eq("id", id);
      if (error) throw error;
      setItems(prev => prev.filter(x => x.id !== id));
      toast.success("Eliminato.");
    } catch { toast.error("Errore."); }
    finally { setSaving(false); }
  };

  const addItem = async () => {
    if (!newTitle || !newDate) { toast.error("Titolo e data obbligatori."); return; }
    setSaving(true);
    try {
      const { data, error } = await (supabase as any)
        .from("collab_history")
        .insert({
          title: newTitle,
          description: newDesc || null,
          collab_date: newDate,
          participants: parseInt(newParticipants) || 2,
          rating: newRating || null,
          emoji: newEmoji,
        })
        .select("*")
        .single();
      if (error) throw error;
      setItems(prev => [data, ...prev]);
      setNewTitle(""); setNewDesc(""); setNewDate(""); setNewParticipants("2"); setNewRating(null); setNewEmoji("🍳");
      toast.success("Collab aggiunta allo storico! 🍳");
    } catch { toast.error("Errore nel salvataggio."); }
    finally { setSaving(false); }
  };

  // Elimina proposte scadute (booking_requests pending con data passata)
  const cleanupExpired = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: expired } = await (supabase as any)
        .from("booking_requests")
        .select("id")
        .eq("status", "pending")
        .lt("requested_date", today);

      if (!expired || expired.length === 0) {
        toast.info("Nessuna proposta scaduta da eliminare.");
        setCleanupCount(0);
        return;
      }

      const ids = expired.map((x: any) => x.id);
      const { error } = await (supabase as any)
        .from("booking_requests")
        .delete()
        .in("id", ids);

      if (error) throw error;
      setCleanupCount(ids.length);
      toast.success(`${ids.length} proposta/e scaduta/e eliminate! 🗑️`);
    } catch { toast.error("Errore nel cleanup."); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">

      {/* Cleanup proposte scadute */}
      <section className="rounded-[2rem] border border-border bg-card p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Pulizia proposte scadute</h2>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              Elimina automaticamente tutte le prenotazioni "pending" con data già passata.
            </p>
          </div>
          <CalendarX className="mt-1 h-5 w-5 text-accent shrink-0" />
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={cleanupExpired} disabled={saving} variant="destructive" className="rounded-full font-body font-semibold">
            <Trash2 className="h-4 w-4" /> Elimina proposte scadute
          </Button>
          {cleanupCount !== null && (
            <p className="font-body text-sm text-muted-foreground">
              {cleanupCount === 0 ? "Nessuna proposta scaduta trovata." : `${cleanupCount} eliminate con successo.`}
            </p>
          )}
        </div>
      </section>

      {/* Aggiungi collab allo storico */}
      <section className="rounded-[2rem] border border-border bg-card p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Aggiungi</p>
            <h2 className="font-display text-2xl font-bold">Nuova collab nello storico</h2>
          </div>
          <Sparkles className="mt-1 h-5 w-5 text-accent" />
        </div>
        <div className="rounded-[1.5rem] border border-border bg-muted/40 p-4 space-y-3">
          {/* Emoji picker */}
          <div>
            <label className="mb-2 block font-body text-xs font-semibold text-muted-foreground">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setNewEmoji(e)}
                  className={`text-xl rounded-lg p-1.5 transition ${newEmoji === e ? "bg-accent/20 ring-2 ring-accent" : "hover:bg-muted"}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Nome della collab (es: Carbonara Battle)" />
            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrizione breve…" className="min-h-[70px] resize-none" />
            <Input type="number" min={1} max={20} value={newParticipants} onChange={e => setNewParticipants(e.target.value)} placeholder="Partecipanti" />
          </div>

          <div>
            <label className="mb-2 block font-body text-xs font-semibold text-muted-foreground">Rating</label>
            <StarPicker value={newRating} onChange={v => setNewRating(v || null)} />
          </div>

          <Button onClick={addItem} disabled={saving} className="rounded-full font-body font-semibold">
            <Plus className="h-4 w-4" /> Aggiungi allo storico
          </Button>
        </div>
      </section>

      {/* Lista storico */}
      <section className="rounded-[2rem] border border-border bg-card p-6">
        <h2 className="font-display text-2xl font-bold mb-5">
          Storico collab ({items.length})
        </h2>
        {loading ? (
          <p className="font-body text-sm text-muted-foreground">Caricamento…</p>
        ) : items.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">Nessuna collab nello storico ancora.</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="mb-3 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji ?? "🍳"}</span>
                    <div>
                      <p className="font-body text-sm font-bold text-foreground">{item.title}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        {format(new Date(item.collab_date + "T00:00:00"), "d MMMM yyyy", { locale: it })} · {item.participants} persone
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => deleteItem(item.id)} disabled={saving} variant="destructive" size="sm" className="rounded-full font-body text-xs">
                    <Trash2 className="h-3 w-3" /> Elimina
                  </Button>
                </div>

                {item.description && (
                  <p className="mb-3 font-body text-xs text-muted-foreground italic">"{item.description}"</p>
                )}

                <div className="flex items-center gap-3">
                  <span className="font-body text-xs text-muted-foreground">Rating:</span>
                  <StarPicker
                    value={item.rating}
                    onChange={v => saveRating(item.id, v || null)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HistoryAdminTab;
