import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import {
  LogOut, User, Wallet, RefreshCw, TrendingUp, TrendingDown,
  Star, Trophy, Shield, Crown, Target, CheckCircle2, Lock,
  ArrowUpRight, ArrowDownRight, Sparkles, Zap, Gift, Medal, Gem, Award,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface Transaction {
  id: string;
  jumlah: number;
  saldo_setelah: number;
  tanggal: string;
  jenis: string;
  keterangan: string | null;
  admin: string;
  created_at: string;
}

// Icon resolver
const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy, target: Target, shield: Shield, crown: Crown,
  gem: Gem, star: Star, medal: Medal, zap: Zap, award: Award, gift: Gift,
};
const resolveIcon = (name: string): React.ElementType => iconMap[name] || Trophy;

// --- TIER SYSTEM ---
interface Tier {
  name: string;
  icon: React.ElementType;
  minBalance: number;
  maxBalance: number;
  color: string;
  bg: string;
  border: string;
  glow: string;
  badgeColor: string;
}

// Fallback tiers if DB is empty
const DEFAULT_TIERS: Tier[] = [
  { name: "Bronze", icon: Shield, minBalance: 0, maxBalance: 50000, color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-300 dark:border-amber-700", glow: "shadow-amber-200/50 dark:shadow-amber-800/30", badgeColor: "#CD7F32" },
  { name: "Silver", icon: Star, minBalance: 50000, maxBalance: 200000, color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-300 dark:border-slate-600", glow: "shadow-slate-200/50 dark:shadow-slate-700/30", badgeColor: "#C0C0C0" },
  { name: "Gold", icon: Crown, minBalance: 200000, maxBalance: 500000, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-400 dark:border-yellow-600", glow: "shadow-yellow-200/60 dark:shadow-yellow-700/30", badgeColor: "#FFD700" },
  { name: "Platinum", icon: Trophy, minBalance: 500000, maxBalance: Infinity, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-400 dark:border-purple-600", glow: "shadow-purple-200/60 dark:shadow-purple-700/30", badgeColor: "#E5E4E2" },
];

const buildTiersFromDB = (dbTiers: any[]): Tier[] => {
  if (!dbTiers.length) return DEFAULT_TIERS;
  const sorted = [...dbTiers].sort((a, b) => a.sort_order - b.sort_order);
  return sorted.map((t, i) => {
    const next = sorted[i + 1];
    return {
      name: t.name,
      icon: resolveIcon(t.badge_icon),
      minBalance: t.min_saldo,
      maxBalance: next ? next.min_saldo : Infinity,
      color: `text-[${t.badge_color}]`,
      badgeColor: t.badge_color,
      bg: "bg-muted",
      border: "border-border",
      glow: "",
    };
  });
};

const getTier = (balance: number, tiers: Tier[]): Tier => {
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (balance >= tiers[i].minBalance) return tiers[i];
  }
  return tiers[0];
};

const getXP = (balance: number) => Math.floor(balance / 1000);

const getTierProgress = (balance: number, tier: Tier): number => {
  if (tier.maxBalance === Infinity) return 100;
  const range = tier.maxBalance - tier.minBalance;
  const progress = ((balance - tier.minBalance) / range) * 100;
  return Math.min(Math.max(progress, 0), 100);
};

// --- QUESTS ---
interface Quest {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  check: (transactions: Transaction[], balance: number) => boolean;
  reward: string;
}

const buildQuestsFromDB = (dbQuests: any[]): Quest[] => {
  if (!dbQuests.length) return DEFAULT_QUESTS;
  return dbQuests.filter(q => q.is_active).map(q => ({
    id: q.id,
    title: q.title,
    description: q.description,
    icon: resolveIcon(q.icon),
    reward: `+${q.reward_xp} XP`,
    check: (transactions: Transaction[], balance: number): boolean => {
      switch (q.quest_type) {
        case 'first_deposit':
          return transactions.some(tx => tx.jenis?.toLowerCase() === 'setor');
        case 'monthly_deposit_count': {
          const now = new Date();
          const thisMonth = transactions.filter(tx => {
            const d = new Date(tx.tanggal);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && tx.jenis?.toLowerCase() === 'setor';
          });
          return thisMonth.length >= q.target_value;
        }
        case 'reach_balance':
          return balance >= q.target_value;
        case 'total_deposits':
          return transactions.filter(tx => tx.jenis?.toLowerCase() === 'setor').length >= q.target_value;
        default:
          return false;
      }
    },
  }));
};

const DEFAULT_QUESTS: Quest[] = [
  { id: "first_deposit", title: "Langkah Pertama", description: "Lakukan setoran pertama", icon: Zap, check: (t) => t.some(tx => tx.jenis?.toLowerCase() === 'setor'), reward: "+10 XP" },
  { id: "save_3_month", title: "Penabung Rutin", description: "Setor 3 kali bulan ini", icon: Target, check: (t) => {
    const now = new Date();
    return t.filter(tx => { const d = new Date(tx.tanggal); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && tx.jenis?.toLowerCase() === 'setor'; }).length >= 3;
  }, reward: "+30 XP" },
  { id: "reach_silver", title: "Naik Peringkat!", description: "Capai Silver Tier (Rp 50.000)", icon: Star, check: (_, b) => b >= 50000, reward: "Silver Badge" },
  { id: "reach_gold", title: "Emas Berkilau", description: "Capai Gold Tier (Rp 200.000)", icon: Crown, check: (_, b) => b >= 200000, reward: "Gold Badge" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const safeFormatDate = (dateInput: string) => {
  if (!dateInput) return '-';
  const d = new Date(`${dateInput}T00:00:00`);
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Animated counter
const AnimatedNumber = ({ value, prefix = "" }: { value: number; prefix?: string }) => {
  const [displayed, setDisplayed] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    prevValue.current = value;
  }, [value]);

  return <span>{prefix}{displayed.toLocaleString('id-ID')}</span>;
};

// --- CONFETTI ---
const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][i % 6],
    size: 6 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, top: -10, width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: 720 }}
          transition={{ duration: 2 + Math.random(), delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
};

// --- Welcome Modal ---
const WelcomeModal = ({ student, recentDeposit, onClose }: { student: { nama: string; saldo: number }; recentDeposit: Transaction | null; onClose: () => void }) => (
  <motion.div
    className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="bg-card rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl border border-border"
      initial={{ scale: 0.8, y: 30 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.8, y: 30 }}
      onClick={e => e.stopPropagation()}
    >
      <motion.div
        initial={{ rotate: -10, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
      >
        <Sparkles className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
      </motion.div>
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {recentDeposit ? "Kerja Bagus! 🎉" : `Hai, ${student.nama}!`}
      </h2>
      <p className="text-muted-foreground mb-4">
        {recentDeposit
          ? `Saldomu bertambah ${formatCurrency(recentDeposit.jumlah)}!`
          : "Selamat datang kembali di portal tabunganmu."}
      </p>
      <div className="text-3xl font-bold text-primary mb-6">
        {formatCurrency(student.saldo)}
      </div>
      <Button onClick={onClose} className="w-full" size="lg">
        <Zap className="h-4 w-4 mr-2" />
        Lanjutkan
      </Button>
    </motion.div>
  </motion.div>
);

export default React.memo(function StudentDashboard() {
  const { student, sessionToken, logout, refreshStudentInfo } = useStudentAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const welcomeShown = useRef(false);
  const fetchedRef = useRef(false);
  const [gameTiers, setGameTiers] = useState<Tier[]>(DEFAULT_TIERS);
  const [gameQuests, setGameQuests] = useState<Quest[]>(DEFAULT_QUESTS);

  // Fetch gamification settings from DB
  useEffect(() => {
    const fetchGamification = async () => {
      const [tiersRes, questsRes] = await Promise.all([
        supabase.from("gamification_tiers").select("*").order("sort_order"),
        supabase.from("gamification_quests").select("*").order("created_at"),
      ]);
      if (tiersRes.data?.length) setGameTiers(buildTiersFromDB(tiersRes.data));
      if (questsRes.data?.length) setGameQuests(buildQuestsFromDB(questsRes.data));
    };
    fetchGamification();
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const { data, error } = await supabase.rpc('get_student_transactions_secure', { token: sessionToken });
      if (error) {
        if (error.message?.includes('Session tidak valid')) {
          await logout();
          toast({ title: "Sesi Berakhir", description: "Silakan login kembali", variant: "destructive" });
        }
        return;
      }
      setTransactions(data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionToken, logout]);

  // Initial load - only once
  useEffect(() => {
    if (fetchedRef.current || !sessionToken) return;
    fetchedRef.current = true;
    fetchTransactions();
    refreshStudentInfo();
  }, [sessionToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show welcome after data loads
  useEffect(() => {
    if (!loading && student && !welcomeShown.current && transactions !== undefined) {
      welcomeShown.current = true;
      setShowWelcome(true);
      // Check if recent deposit warrants confetti
      if (transactions.length > 0) {
        const latest = transactions[0];
        const latestDate = new Date(latest.created_at);
        const hoursSince = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24 && latest.jenis?.toLowerCase() === 'setor') {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      }
    }
  }, [loading, student, transactions]);

  // Realtime
  useEffect(() => {
    if (!student?.id) return;
    const channel = supabase
      .channel(`student-tx-${student.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `student_id=eq.${student.id}` }, () => {
        fetchTransactions();
        refreshStudentInfo();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [student?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tier = useMemo(() => student ? getTier(student.saldo, gameTiers) : gameTiers[0], [student?.saldo, gameTiers]);
  const xp = useMemo(() => student ? getXP(student.saldo) : 0, [student?.saldo]);
  const tierProgress = useMemo(() => student ? getTierProgress(student.saldo, tier) : 0, [student?.saldo, tier]);
  const recentDeposit = useMemo(() => {
    if (!transactions.length) return null;
    const latest = transactions[0];
    const hoursSince = (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);
    return hoursSince < 24 && latest.jenis?.toLowerCase() === 'setor' ? latest : null;
  }, [transactions]);

  const stats = useMemo(() => {
    if (!transactions.length) return null;
    const totalSetor = transactions.filter(t => t.jenis?.toLowerCase() === 'setor').reduce((s, t) => s + (Number(t.jumlah) || 0), 0);
    const totalTarik = transactions.filter(t => t.jenis?.toLowerCase() === 'tarik').reduce((s, t) => s + (Number(t.jumlah) || 0), 0);
    return { totalSetor, totalTarik, count: transactions.length };
  }, [transactions]);

  const completedQuests = useMemo(() =>
    QUESTS.filter(q => q.check(transactions, student?.saldo || 0)),
    [transactions, student?.saldo]
  );

  if (!student) return null;

  const TierIcon = tier.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <Confetti show={showConfetti} />
      <AnimatePresence>
        {showWelcome && (
          <WelcomeModal student={student} recentDeposit={recentDeposit} onClose={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        className="bg-card/80 backdrop-blur-md shadow-sm border-b border-border sticky top-0 z-30"
        initial={{ y: -60 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className={`w-11 h-11 rounded-full ${tier.bg} ${tier.border} border-2 flex items-center justify-center shadow-md ${tier.glow}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <TierIcon className={`h-5 w-5 ${tier.color}`} />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{student.nama}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">NIS: {student.nis}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tier.name}</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => { fetchTransactions(); refreshStudentInfo(); }} variant="ghost" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={logout} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-1" /> Keluar
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Hero: Saldo + XP + Tier */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={`overflow-hidden border-2 ${tier.border} ${tier.glow} shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium mb-1">Saldo Tabungan</p>
                  <div className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
                    <AnimatedNumber value={student.saldo} prefix="Rp " />
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-foreground">{xp} XP</span>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${tier.bg}`}>
                      <TierIcon className={`h-3.5 w-3.5 ${tier.color}`} />
                      <span className={`text-xs font-bold ${tier.color}`}>{tier.name}</span>
                    </div>
                  </div>
                </div>
                <div className="md:w-48">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{tier.name}</span>
                    {tier.maxBalance !== Infinity && <span>{TIERS[TIERS.indexOf(tier) + 1]?.name || "Max"}</span>}
                  </div>
                  <Progress value={tierProgress} className="h-3" />
                  {tier.maxBalance !== Infinity && (
                    <p className="text-[11px] text-muted-foreground mt-1 text-right">
                      {formatCurrency(tier.maxBalance - student.saldo)} lagi untuk naik tier
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total Setor</span>
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalSetor)}</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total Tarik</span>
                </div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(stats.totalTarik)}</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 md:col-span-1 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Total Transaksi</span>
                </div>
                <p className="text-lg font-bold text-foreground">{stats.count} kali</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quest Board */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                Misi Menabung
                <Badge variant="secondary" className="ml-auto">{completedQuests.length}/{QUESTS.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {QUESTS.map((quest) => {
                  const completed = quest.check(transactions, student.saldo);
                  const QuestIcon = quest.icon;
                  return (
                    <motion.div
                      key={quest.id}
                      className={`relative rounded-xl p-4 border-2 transition-all cursor-default ${
                        completed
                          ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                          : 'border-border bg-muted/30 opacity-70'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${completed ? 'bg-green-100 dark:bg-green-900/40' : 'bg-muted'}`}>
                          {completed
                            ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            : <QuestIcon className="h-5 w-5 text-muted-foreground" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${completed ? 'text-green-700 dark:text-green-300' : 'text-foreground'}`}>
                            {quest.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{quest.description}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <Sparkles className={`h-3 w-3 ${completed ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                            <span className={`text-[11px] font-medium ${completed ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'}`}>
                              {quest.reward}
                            </span>
                          </div>
                        </div>
                        {!completed && <Lock className="h-4 w-4 text-muted-foreground/50 absolute top-3 right-3" />}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5 text-primary" />
                Riwayat Transaksi
                {transactions.length > 0 && (
                  <Badge variant="outline" className="ml-auto">{transactions.length} transaksi</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <Skeleton className="w-3 h-3 rounded-full mt-1.5" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Belum ada transaksi</p>
                  <p className="text-xs text-muted-foreground mt-1">Mulai menabung untuk mendapatkan XP!</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-border" />
                  <div className="space-y-1">
                    {transactions.slice(0, 30).map((tx, idx) => {
                      const isSetor = tx.jenis?.toLowerCase() === 'setor';
                      const isExpanded = expandedTx === tx.id;
                      return (
                        <motion.div
                          key={tx.id}
                          className="relative pl-7 group cursor-pointer"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                        >
                          {/* Timeline dot */}
                          <div className={`absolute left-0 top-3 w-[15px] h-[15px] rounded-full border-2 z-10 transition-all ${
                            isSetor
                              ? 'bg-green-500 border-green-300 dark:border-green-700'
                              : 'bg-red-500 border-red-300 dark:border-red-700'
                          } ${isExpanded ? 'scale-125' : 'group-hover:scale-110'}`} />

                          <motion.div
                            className={`rounded-xl p-3 transition-all border ${
                              isExpanded ? 'bg-muted/60 border-border shadow-sm' : 'bg-transparent border-transparent hover:bg-muted/40'
                            }`}
                            layout
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isSetor
                                  ? <ArrowUpRight className="h-4 w-4 text-green-500" />
                                  : <ArrowDownRight className="h-4 w-4 text-red-500" />
                                }
                                <span className={`text-sm font-semibold ${isSetor ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {isSetor ? '+' : '-'}{formatCurrency(tx.jumlah)}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">{safeFormatDate(tx.tanggal)}</span>
                            </div>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="pt-2 mt-2 border-t border-border space-y-1">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">Saldo Setelah</span>
                                      <span className="font-medium text-foreground">{formatCurrency(tx.saldo_setelah)}</span>
                                    </div>
                                    {tx.keterangan && (
                                      <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Keterangan</span>
                                        <span className="text-foreground">{tx.keterangan}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">Diproses oleh</span>
                                      <span className="text-foreground">{tx.admin}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                    {transactions.length > 30 && (
                      <p className="text-center text-xs text-muted-foreground py-3">
                        Menampilkan 30 dari {transactions.length} transaksi
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
});
