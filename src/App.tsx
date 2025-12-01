import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MaintenancePopup } from "@/components/Maintenance/MaintenancePopup";
import { MaintenanceBlocker } from "@/components/Maintenance/MaintenanceBlocker";
import { NoticePopup } from "@/components/Home/NoticePopup";
import { WinterSnow } from "@/components/Theme/WinterSnow";
import { useWinterTheme } from "@/hooks/useWinterTheme";
import Index from "./pages/Index";
import Mods from "./pages/Mods";

import Courses from "./pages/Courses";
import Games from "./pages/Games";
import Admin from "./pages/Admin";
import RequestMod from "./pages/RequestMod";
import Contact from "./pages/Contact";
import DownloadCallback from "./pages/DownloadCallback";
import VerificationSuccess from "./pages/VerificationSuccess";
import NotFound from "./pages/NotFound";
import LiveChat from "./pages/LiveChat";
import BlueTickPurchase from "./pages/BlueTickPurchase";

const queryClient = new QueryClient();

const AppContent = () => {
  const { winterThemeEnabled } = useWinterTheme();

  return (
    <>
      {winterThemeEnabled && <WinterSnow />}
      <MaintenanceBlocker>
        <MaintenancePopup />
        <NoticePopup />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mods" element={<Mods />} />
          <Route path="/mod" element={<Mods />} />
          <Route path="/games" element={<Games />} />
          
          <Route path="/courses" element={<Courses />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/request-mod" element={<RequestMod />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/download-callback" element={<DownloadCallback />} />
          <Route path="/verification-success" element={<VerificationSuccess />} />
          <Route path="/live-chat" element={<LiveChat />} />
          <Route path="/buy-bluetick" element={<BlueTickPurchase />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MaintenanceBlocker>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppContent />
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
