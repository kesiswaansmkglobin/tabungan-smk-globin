
-- Gamification Tiers table
CREATE TABLE public.gamification_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_saldo integer NOT NULL DEFAULT 0,
  badge_icon text DEFAULT 'trophy',
  badge_color text DEFAULT '#CD7F32',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tiers" ON public.gamification_tiers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Anyone can read tiers" ON public.gamification_tiers FOR SELECT USING (true);

-- Gamification Quests table
CREATE TABLE public.gamification_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  quest_type text NOT NULL DEFAULT 'deposit_count',
  target_value integer NOT NULL DEFAULT 1,
  reward_xp integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  icon text DEFAULT 'target',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quests" ON public.gamification_quests FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Anyone can read active quests" ON public.gamification_quests FOR SELECT USING (true);

-- Insert default tiers
INSERT INTO public.gamification_tiers (name, min_saldo, badge_icon, badge_color, sort_order) VALUES
  ('Bronze', 0, 'shield', '#CD7F32', 1),
  ('Silver', 50000, 'shield', '#C0C0C0', 2),
  ('Gold', 200000, 'crown', '#FFD700', 3),
  ('Platinum', 500000, 'gem', '#E5E4E2', 4);

-- Insert default quests
INSERT INTO public.gamification_quests (title, description, quest_type, target_value, reward_xp, icon) VALUES
  ('Setoran Pertama', 'Lakukan setoran pertama kamu', 'first_deposit', 1, 10, 'star'),
  ('Penabung Rutin', 'Setor 3 kali dalam bulan ini', 'monthly_deposit_count', 3, 50, 'target'),
  ('Raih Silver', 'Capai saldo Rp 50.000', 'reach_balance', 50000, 100, 'trophy'),
  ('Raih Gold', 'Capai saldo Rp 200.000', 'reach_balance', 200000, 200, 'crown');

-- Triggers for updated_at
CREATE TRIGGER update_gamification_tiers_updated_at BEFORE UPDATE ON public.gamification_tiers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_gamification_quests_updated_at BEFORE UPDATE ON public.gamification_quests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
