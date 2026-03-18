-- Create recipes table for editable public recipe ideas
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Facile',
  time_label TEXT NOT NULL DEFAULT '20 min',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active recipes"
ON public.recipes
FOR SELECT
TO public
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert recipes"
ON public.recipes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update recipes"
ON public.recipes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete recipes"
ON public.recipes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_recipes_updated_at ON public.recipes;
CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS recipes_display_order_idx ON public.recipes (display_order);
CREATE INDEX IF NOT EXISTS recipes_active_order_idx ON public.recipes (is_active, display_order);

INSERT INTO public.recipes (title, description, difficulty, time_label, display_order)
SELECT *
FROM (VALUES
  ('Pasta alla Carbonara', 'Il classico romano: guanciale croccante, uova, pecorino e pepe. Semplicità perfetta.', 'Facile', '25 min', 0),
  ('Thai Green Curry', 'Latte di cocco, pasta di curry verde, verdure di stagione e riso basmati.', 'Media', '35 min', 1),
  ('Tacos al Pastor', 'Tortillas calde, carne marinata, cipolla, coriandolo e lime. Festa messicana.', 'Media', '40 min', 2),
  ('Risotto ai Funghi', 'Riso carnaroli mantecato con porcini, parmigiano e un filo d''olio al tartufo.', 'Media', '30 min', 3),
  ('Hummus & Pita Board', 'Hummus cremoso, pita calda, verdure crude e feta sbriciolata. Perfetto per condividere.', 'Facile', '20 min', 4),
  ('Stir-Fry Noodles', 'Noodles saltati con verdure croccanti, salsa di soia, zenzero e sesamo tostato.', 'Facile', '20 min', 5)
) AS seed(title, description, difficulty, time_label, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.recipes);