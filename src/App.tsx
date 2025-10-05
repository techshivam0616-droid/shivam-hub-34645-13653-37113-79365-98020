import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MaintenancePopup } from "@/components/Maintenance/MaintenancePopup";
import { MaintenanceBlocker } from "@/components/Maintenance/MaintenanceBlocker";
import Index from "./pages/Index";
import Mods from "./pages/Mods";
import Movies from "./pages/Movies";
import Courses from "./pages/Courses";
import Admin from "./pages/Admin";
import RequestMod from "./pages/RequestMod";
import Contact from "./pages/Contact";
import DownloadCallback from "./pages/DownloadCallback";
import NotFound from "./pages/NotFound";
import LiveChat from "./pages/LiveChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MaintenanceBlocker>
            <MaintenancePopup />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/mods" element={<Mods />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/request-mod" element={<RequestMod />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/download-callback" element={<DownloadCallback />} />
              <Route path="/live-chat" element={<LiveChat />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MaintenanceBlocker>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
