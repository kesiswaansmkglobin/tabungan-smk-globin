import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Shield, User, Wallet, School, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Verifikasi = () => {
  const [searchParams] = useSearchParams();
  
  const nis = searchParams.get("nis");
  const nama = searchParams.get("nama");
  const saldo = searchParams.get("saldo");
  const sekolah = searchParams.get("sekolah");
  const cetak = searchParams.get("cetak");
  
  const formatCurrency = (amount: string | null): string => {
    if (!amount) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(parseInt(amount));
  };
  
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  
  // Check if we have valid data
  const hasValidData = nis && nama && saldo && sekolah;
  
  if (!hasValidData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-500/30 bg-slate-900/90 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Data Tidak Valid</h1>
            <p className="text-slate-400">
              QR Code tidak mengandung data verifikasi yang valid. Silakan scan ulang QR Code pada buku tabungan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-emerald-500/30 bg-slate-900/90 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Premium Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-center relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mb-2">
              <Shield className="w-3 h-3 mr-1" />
              Terverifikasi
            </Badge>
            <h1 className="text-xl font-bold text-white">Buku Tabungan Asli</h1>
          </div>
        </div>
        
        <CardContent className="p-6 space-y-5">
          {/* School Info */}
          <div className="text-center pb-4 border-b border-slate-700">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
              <School className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wider">Institusi</span>
            </div>
            <h2 className="text-lg font-bold text-white">{sekolah}</h2>
          </div>
          
          {/* Student Info Card */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-slate-400 text-xs uppercase tracking-wider">Pemilik Rekening</p>
                <h3 className="text-white font-bold text-lg leading-tight">{nama}</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">No. Rekening</p>
                <p className="text-white font-mono font-semibold">{nis}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Status</p>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Aktif
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Balance Display */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-5 border border-emerald-500/30 text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wider">Saldo Saat Cetak</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(saldo)}</p>
          </div>
          
          {/* Print Date */}
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Calendar className="w-4 h-4" />
            <span>Dicetak: {formatDate(cetak)}</span>
          </div>
          
          {/* Verification Note */}
          <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
            <p className="text-amber-200 text-xs text-center leading-relaxed">
              <strong>Catatan:</strong> Halaman ini memverifikasi keaslian buku tabungan yang dicetak. 
              Saldo yang ditampilkan adalah saldo pada saat pencetakan, bukan saldo terkini.
            </p>
          </div>
        </CardContent>
        
        {/* Footer */}
        <div className="bg-slate-800/50 px-6 py-4 text-center border-t border-slate-700">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Sistem Tabungan Sekolah
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Verifikasi;
