import React, { useEffect, Suspense } from "react";
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
import { FeedbackPopup } from "@/components/Feedback/FeedbackPopup";
import { NotificationPrompt } from "@/components/Notifications/NotificationPrompt";
import { useWinterTheme } from "@/hooks/useWinterTheme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Mods from "./pages/Mods";
import Courses from "./pages/Courses";
import Games from "./pages/Games";
import Assets from "./pages/Assets";
import Bundles from "./pages/Bundles";
import Admin from "./pages/Admin";
import RequestMod from "./pages/RequestMod";
import Contact from "./pages/Contact";
import DownloadCallback from "./pages/DownloadCallback";
import VerificationSuccess from "./pages/VerificationSuccess";
import NotFound from "./pages/NotFound";
import LiveChat from "./pages/LiveChat";
import KingBadgePurchase from "./pages/KingBadgePurchase";
import Social from "./pages/Social";
import ItemDetails from "./pages/ItemDetails";
import Leaderboard from "./pages/Leaderboard";
import TechAI from "./pages/TechAI";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import TermsConditions from "./pages/TermsConditions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { winterThemeEnabled } = useWinterTheme();

  return (
    <>
      {winterThemeEnabled && <WinterSnow />}
      <MaintenanceBlocker>
        <MaintenancePopup />
        <NoticePopup />
        <FeedbackPopup />
        <NotificationPrompt />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/mods" element={<Mods />} />
            <Route path="/mod" element={<Mods />} />
            <Route path="/games" element={<Games />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/bundles" element={<Bundles />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/request-mod" element={<RequestMod />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/download-callback" element={<DownloadCallback />} />
            <Route path="/verification-success" element={<VerificationSuccess />} />
            <Route path="/live-chat" element={<LiveChat />} />
            <Route path="/buy-king-badge" element={<KingBadgePurchase />} />
            <Route path="/social" element={<Social />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/tech-ai" element={<TechAI />} />
            <Route path="/item/:type/:id" element={<ItemDetails />} />
            {/* Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </MaintenanceBlocker>
    </>
  );
};

const App = () => {
  // Global error handler to prevent crashes
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
      event.preventDefault();
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
