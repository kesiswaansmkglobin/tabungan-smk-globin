import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Trophy, Target, Shield, Crown, Gem, Star, Medal, Zap, Award } from "lucide-react";

// Icon map for display
const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy, target: Target, shield: Shield, crown: Crown,
  gem: Gem, star: Star, medal: Medal, zap: Zap, award: Award,
};
const iconOptions = Object.keys(iconMap);

interface Tier {
  id: string;
  name: string;
  min_saldo: number;
  badge_icon: string;
  badge_color: string;
  sort_order: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  target_value: number;
  reward_xp: number;
  is_active: boolean;
  icon: string;
}

const questTypeLabels: Record<string, string> = {
  first_deposit: "Setoran Pertama",
  monthly_deposit_count: "Jumlah Setor Bulanan",
  reach_balance: "Capai Saldo",
  total_deposits: "Total Setoran",
};

const GamifikasiSettings = () => {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  // Tier dialog
  const [tierDialog, setTierDialog] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [tierForm, setTierForm] = useState({ name: "", min_saldo: 0, badge_icon: "shield", badge_color: "#CD7F32", sort_order: 0 });

  // Quest dialog
  const [questDialog, setQuestDialog] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [questForm, setQuestForm] = useState({ title: "", description: "", quest_type: "first_deposit", target_value: 1, reward_xp: 10, is_active: true, icon: "target" });

  const [deleteDialog, setDeleteDialog] = useState<{ type: "tier" | "quest"; id: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tiersRes, questsRes] = await Promise.all([
      supabase.from("gamification_tiers").select("*").order("sort_order"),
      supabase.from("gamification_quests").select("*").order("created_at"),
    ]);
    if (tiersRes.data) setTiers(tiersRes.data as Tier[]);
    if (questsRes.data) setQuests(questsRes.data as Quest[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Tier CRUD ---
  const openTierDialog = (tier?: Tier) => {
    if (tier) {
      setEditingTier(tier);
      setTierForm({ name: tier.name, min_saldo: tier.min_saldo, badge_icon: tier.badge_icon, badge_color: tier.badge_color, sort_order: tier.sort_order });
    } else {
      setEditingTier(null);
      setTierForm({ name: "", min_saldo: 0, badge_icon: "shield", badge_color: "#CD7F32", sort_order: tiers.length + 1 });
    }
    setTierDialog(true);
  };

  const saveTier = async () => {
    if (!tierForm.name.trim()) { toast({ title: "Error", description: "Nama tier wajib diisi", variant: "destructive" }); return; }
    if (editingTier) {
      const { error } = await supabase.from("gamification_tiers").update(tierForm).eq("id", editingTier.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Berhasil", description: `Tier "${tierForm.name}" diperbarui` });
    } else {
      const { error } = await supabase.from("gamification_tiers").insert(tierForm);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Berhasil", description: `Tier "${tierForm.name}" ditambahkan` });
    }
    setTierDialog(false);
    fetchData();
  };

  // --- Quest CRUD ---
  const openQuestDialog = (quest?: Quest) => {
    if (quest) {
      setEditingQuest(quest);
      setQuestForm({ title: quest.title, description: quest.description, quest_type: quest.quest_type, target_value: quest.target_value, reward_xp: quest.reward_xp, is_active: quest.is_active, icon: quest.icon });
    } else {
      setEditingQuest(null);
      setQuestForm({ title: "", description: "", quest_type: "first_deposit", target_value: 1, reward_xp: 10, is_active: true, icon: "target" });
    }
    setQuestDialog(true);
  };

  const saveQuest = async () => {
    if (!questForm.title.trim()) { toast({ title: "Error", description: "Judul misi wajib diisi", variant: "destructive" }); return; }
    if (editingQuest) {
      const { error } = await supabase.from("gamification_quests").update(questForm).eq("id", editingQuest.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Berhasil", description: `Misi "${questForm.title}" diperbarui` });
    } else {
      const { error } = await supabase.from("gamification_quests").insert(questForm);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Berhasil", description: `Misi "${questForm.title}" ditambahkan` });
    }
    setQuestDialog(false);
    fetchData();
  };

  const toggleQuestActive = async (quest: Quest) => {
    await supabase.from("gamification_quests").update({ is_active: !quest.is_active }).eq("id", quest.id);
    fetchData();
    toast({ title: quest.is_active ? "Misi Dinonaktifkan" : "Misi Diaktifkan" });
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    const table = deleteDialog.type === "tier" ? "gamification_tiers" : "gamification_quests";
    await supabase.from(table).delete().eq("id", deleteDialog.id);
    setDeleteDialog(null);
    fetchData();
    toast({ title: "Berhasil", description: "Data berhasil dihapus" });
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

  const renderIcon = (iconName: string, color?: string) => {
    const Icon = iconMap[iconName] || Trophy;
    return <Icon className="h-5 w-5" style={color ? { color } : undefined} />;
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Gamifikasi</h1>
        <p className="text-muted-foreground">Kelola tingkatan (tier) dan misi menabung untuk portal siswa</p>
      </div>

      <Tabs defaultValue="tiers">
        <TabsList>
          <TabsTrigger value="tiers"><Trophy className="h-4 w-4 mr-1.5" />Tingkatan</TabsTrigger>
          <TabsTrigger value="quests"><Target className="h-4 w-4 mr-1.5" />Misi Menabung</TabsTrigger>
        </TabsList>

        {/* TIERS TAB */}
        <TabsContent value="tiers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tingkatan / Level</CardTitle>
                <CardDescription>Tentukan tier berdasarkan minimum saldo siswa</CardDescription>
              </div>
              <Button onClick={() => openTierDialog()} size="sm"><Plus className="h-4 w-4 mr-1" />Tambah Tier</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Urutan</TableHead>
                    <TableHead>Badge</TableHead>
                    <TableHead>Nama Tier</TableHead>
                    <TableHead>Min. Saldo</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiers.map((tier) => (
                    <TableRow key={tier.id}>
                      <TableCell>{tier.sort_order}</TableCell>
                      <TableCell>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: tier.badge_color + "20", border: `2px solid ${tier.badge_color}` }}>
                          {renderIcon(tier.badge_icon, tier.badge_color)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tier.name}</TableCell>
                      <TableCell>{formatCurrency(tier.min_saldo)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openTierDialog(tier)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteDialog({ type: "tier", id: tier.id })}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUESTS TAB */}
        <TabsContent value="quests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Misi Menabung</CardTitle>
                <CardDescription>Buat tantangan menabung untuk memotivasi siswa</CardDescription>
              </div>
              <Button onClick={() => openQuestDialog()} size="sm"><Plus className="h-4 w-4 mr-1" />Tambah Misi</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quests.map((quest) => (
                    <TableRow key={quest.id}>
                      <TableCell>{renderIcon(quest.icon)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quest.title}</p>
                          <p className="text-xs text-muted-foreground">{quest.description}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{questTypeLabels[quest.quest_type] || quest.quest_type}</Badge></TableCell>
                      <TableCell>{quest.quest_type === "reach_balance" ? formatCurrency(quest.target_value) : quest.target_value}</TableCell>
                      <TableCell><Badge>{quest.reward_xp} XP</Badge></TableCell>
                      <TableCell>
                        <Switch checked={quest.is_active} onCheckedChange={() => toggleQuestActive(quest)} />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openQuestDialog(quest)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteDialog({ type: "quest", id: quest.id })}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* TIER DIALOG */}
      <Dialog open={tierDialog} onOpenChange={setTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTier ? "Edit Tier" : "Tambah Tier Baru"}</DialogTitle>
            <DialogDescription>Tentukan nama, saldo minimum, dan badge untuk tier ini</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nama Tier</Label><Input value={tierForm.name} onChange={e => setTierForm(f => ({ ...f, name: e.target.value }))} placeholder="Contoh: Diamond" /></div>
            <div><Label>Minimum Saldo (Rp)</Label><Input type="number" value={tierForm.min_saldo} onChange={e => setTierForm(f => ({ ...f, min_saldo: parseInt(e.target.value) || 0 }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon Badge</Label>
                <Select value={tierForm.badge_icon} onValueChange={v => setTierForm(f => ({ ...f, badge_icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(ic => (
                      <SelectItem key={ic} value={ic}>
                        <span className="flex items-center gap-2">{renderIcon(ic)} {ic}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Warna Badge</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={tierForm.badge_color} onChange={e => setTierForm(f => ({ ...f, badge_color: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border-0" />
                  <Input value={tierForm.badge_color} onChange={e => setTierForm(f => ({ ...f, badge_color: e.target.value }))} className="flex-1" />
                </div>
              </div>
            </div>
            <div><Label>Urutan</Label><Input type="number" value={tierForm.sort_order} onChange={e => setTierForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialog(false)}>Batal</Button>
            <Button onClick={saveTier}>{editingTier ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUEST DIALOG */}
      <Dialog open={questDialog} onOpenChange={setQuestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingQuest ? "Edit Misi" : "Tambah Misi Baru"}</DialogTitle>
            <DialogDescription>Buat tantangan menabung untuk siswa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Judul Misi</Label><Input value={questForm.title} onChange={e => setQuestForm(f => ({ ...f, title: e.target.value }))} placeholder="Contoh: Nabung Rutin" /></div>
            <div><Label>Deskripsi</Label><Input value={questForm.description} onChange={e => setQuestForm(f => ({ ...f, description: e.target.value }))} placeholder="Contoh: Setor 5 kali dalam bulan ini" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipe Misi</Label>
                <Select value={questForm.quest_type} onValueChange={v => setQuestForm(f => ({ ...f, quest_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(questTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icon</Label>
                <Select value={questForm.icon} onValueChange={v => setQuestForm(f => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(ic => (
                      <SelectItem key={ic} value={ic}>
                        <span className="flex items-center gap-2">{renderIcon(ic)} {ic}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Target Value</Label><Input type="number" value={questForm.target_value} onChange={e => setQuestForm(f => ({ ...f, target_value: parseInt(e.target.value) || 1 }))} /></div>
              <div><Label>Reward XP</Label><Input type="number" value={questForm.reward_xp} onChange={e => setQuestForm(f => ({ ...f, reward_xp: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={questForm.is_active} onCheckedChange={v => setQuestForm(f => ({ ...f, is_active: v }))} />
              <Label>Misi Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestDialog(false)}>Batal</Button>
            <Button onClick={saveQuest}>{editingQuest ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus {deleteDialog?.type === "tier" ? "tier" : "misi"} ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GamifikasiSettings;
