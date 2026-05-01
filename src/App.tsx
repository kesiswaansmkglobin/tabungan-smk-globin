import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PerformanceMonitor } from "@/utils/monitoring";
import { initializeTheme } from "@/utils/theme";
import { InstallPWA } from "@/components/InstallPWA";
import { StudentAuthProvider } from "@/hooks/useStudentAuth";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import StudentIndex from "./pages/StudentIndex";
import Verifikasi from "./pages/Verifikasi";
import DiagramPage from "./pages/DiagramPage";
import UserGuide from "./components/UserGuide";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

initializeTheme();

if (import.meta.env.PROD) {
  setInterval(() => {
    PerformanceMonitor.logSlowOperations();
    PerformanceMonitor.trackMemoryUsage();
  }, 30000);
}

// Runtime preflight: log actionable install commands if a critical dep is missing
if (import.meta.env.DEV) {
  import("@/utils/preflight").then(({ runPreflight }) => {
    runPreflight().then((issues) => {
      if (issues.length > 0) {
        console.group("%c⚠ Preflight: missing modules", "color:#f59e0b;font-weight:bold");
        issues.forEach((i) => {
          console.error(`✗ ${i.module}\n  → ${i.installCmd}\n  (${i.reason})`);
        });
        console.groupEnd();
      }
    });
  });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPWA />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Index />} />
          <Route path="/student" element={<StudentAuthProvider><StudentIndex /></StudentAuthProvider>} />
          <Route path="/verifikasi" element={<Verifikasi />} />
          <Route path="/panduan" element={<UserGuide />} />
          <Route path="/diagram" element={<DiagramPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
