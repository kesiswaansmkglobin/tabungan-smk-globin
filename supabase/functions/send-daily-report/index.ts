import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClassBalance {
  namaKelas: string;
  totalSaldo: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FONNTE_API_KEY = Deno.env.get("FONNTE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!FONNTE_API_KEY) {
      throw new Error("FONNTE_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials are not configured");
    }

    // Create Supabase client with service role key for full access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if this is a cron job call (has cron_check param)
    const url = new URL(req.url);
    const isCronCheck = url.searchParams.get("cron_check") === "true";

    // Get notification settings from database
    const { data: notificationSettings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError) {
      console.error("Error fetching notification settings:", settingsError);
      throw new Error("Failed to fetch notification settings");
    }

    // If this is a cron check, verify if we should send now
    if (isCronCheck) {
      if (!notificationSettings.whatsapp_enabled) {
        console.log("WhatsApp notifications are disabled");
        return new Response(
          JSON.stringify({ success: true, message: "Notifications disabled, skipping" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if current hour matches scheduled hour (WIB timezone)
      const now = new Date();
      const indonesiaOffset = 7 * 60;
      const utcOffset = now.getTimezoneOffset();
      const indonesiaTime = new Date(now.getTime() + (indonesiaOffset + utcOffset) * 60000);
      const currentHour = indonesiaTime.getHours();
      
      const scheduledTime = notificationSettings.whatsapp_send_time;
      const scheduledHour = parseInt(scheduledTime.split(":")[0], 10);

      if (currentHour !== scheduledHour) {
        console.log(`Not time to send. Current hour: ${currentHour}, Scheduled hour: ${scheduledHour}`);
        return new Response(
          JSON.stringify({ success: true, message: "Not scheduled time, skipping" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Get admin WhatsApp number from database settings or fallback to env
    let adminWhatsAppNumber = notificationSettings.admin_whatsapp_number;
    if (!adminWhatsAppNumber) {
      adminWhatsAppNumber = Deno.env.get("ADMIN_WHATSAPP_NUMBER");
    }

    if (!adminWhatsAppNumber) {
      throw new Error("Admin WhatsApp number is not configured");
    }

    // Get today's date in YYYY-MM-DD format (Indonesia timezone: UTC+7)
    const now = new Date();
    const indonesiaOffset = 7 * 60;
    const utcOffset = now.getTimezoneOffset();
    const indonesiaTime = new Date(now.getTime() + (indonesiaOffset + utcOffset) * 60000);
    const today = indonesiaTime.toISOString().split('T')[0];

    console.log(`Generating daily report for: ${today}`);

    // 1. Get today's transactions
    const { data: todayTransactions, error: transError } = await supabase
      .from("transactions")
      .select("jenis, jumlah")
      .eq("tanggal", today);

    if (transError) {
      console.error("Error fetching transactions:", transError);
      throw transError;
    }

    // Calculate today's totals
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    for (const trans of todayTransactions || []) {
      const jenis = trans.jenis?.toLowerCase();
      if (jenis === "setor") {
        totalPemasukan += trans.jumlah;
      } else if (jenis === "tarik") {
        totalPengeluaran += trans.jumlah;
      }
    }

    // 2. Get all classes
    const { data: classes, error: classError } = await supabase
      .from("classes")
      .select("id, nama_kelas")
      .order("nama_kelas");

    if (classError) {
      console.error("Error fetching classes:", classError);
      throw classError;
    }

    // 3. Get all students with their balances and class info
    const { data: students, error: studentError } = await supabase
      .from("students")
      .select("saldo, kelas_id");

    if (studentError) {
      console.error("Error fetching students:", studentError);
      throw studentError;
    }

    // Calculate balance per class
    const classBalances: ClassBalance[] = [];
    let totalSaldoKeseluruhan = 0;

    for (const cls of classes || []) {
      const classStudents = (students || []).filter(s => s.kelas_id === cls.id);
      const classTotalSaldo = classStudents.reduce((sum, s) => sum + (s.saldo || 0), 0);
      
      classBalances.push({
        namaKelas: cls.nama_kelas,
        totalSaldo: classTotalSaldo
      });
      
      totalSaldoKeseluruhan += classTotalSaldo;
    }

    // Format currency
    const formatRupiah = (amount: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };

    // Format date for display
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };

    // Build WhatsApp message
    let message = `📊 *LAPORAN HARIAN TABUNGAN*\n`;
    message += `📅 ${formatDate(today)}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `💰 *TRANSAKSI HARI INI*\n`;
    message += `✅ Pemasukan: ${formatRupiah(totalPemasukan)}\n`;
    message += `❌ Pengeluaran: ${formatRupiah(totalPengeluaran)}\n`;
    message += `📈 Net: ${formatRupiah(totalPemasukan - totalPengeluaran)}\n\n`;
    
    message += `🏫 *SALDO PER KELAS*\n`;
    for (const cb of classBalances) {
      message += `• ${cb.namaKelas}: ${formatRupiah(cb.totalSaldo)}\n`;
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━\n`;
    message += `💵 *TOTAL SALDO KESELURUHAN*\n`;
    message += `${formatRupiah(totalSaldoKeseluruhan)}\n`;
    message += `━━━━━━━━━━━━━━━━━━`;

    console.log("Message to send:", message);
    console.log("Sending to:", adminWhatsAppNumber);

    // Send WhatsApp message via Fonnte API
    const formData = new FormData();
    formData.append("target", adminWhatsAppNumber);
    formData.append("message", message);
    formData.append("countryCode", "62");

    const fonntResponse = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": FONNTE_API_KEY
      },
      body: formData
    });

    const fonntResult = await fonntResponse.json();
    console.log("Fonnte API response:", fonntResult);

    if (!fonntResponse.ok || fonntResult.status === false) {
      throw new Error(`Fonnte API error: ${JSON.stringify(fonntResult)}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Daily report sent successfully",
        data: {
          date: today,
          totalPemasukan,
          totalPengeluaran,
          classBalances,
          totalSaldoKeseluruhan,
          fonntResult
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );

  } catch (error) {
    console.error("Error in send-daily-report:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
});
