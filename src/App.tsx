import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PerformanceMonitor } from "@/utils/monitoring";
import Index from "./pages/Index";
import StudentIndex from "./pages/StudentIndex";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize performance monitoring
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    PerformanceMonitor.logSlowOperations();
    PerformanceMonitor.trackMemoryUsage();
  }, 30000); // Log every 30 seconds in production
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/student" element={<StudentIndex />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
