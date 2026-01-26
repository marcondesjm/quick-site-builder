import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import BoxControl from "./pages/BoxControl";
import NotFound from "./pages/NotFound";
import VisitorCall from "./pages/VisitorCall";
import QRCodePage from "./pages/QRCodePage";
import NFCDoorbellPage from "./pages/NFCDoorbellPage";
import MotoViiPage from "./pages/MotoViiPage";
import CarViiPage from "./pages/CarViiPage";
import Install from "./pages/Install";
import Plans from "./pages/Plans";
import CookiePolicy from "./pages/CookiePolicy";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import WhatsAppButton from "./components/WhatsAppButton";
import { CookieConsent } from "./components/CookieConsent";
import { AppStatusChecker } from "./components/AppStatusChecker";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redireciona para /auth preservando a rota original para redirect posterior
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

// Component to conditionally show WhatsApp button (hide on visitor call page)
function ConditionalWhatsAppButton() {
  const location = useLocation();
  const isVisitorCallPage = location.pathname.startsWith('/call/');
  
  if (isVisitorCallPage) {
    return null;
  }
  
  return <WhatsAppButton />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CookieConsent />
          <BrowserRouter>
            <AppStatusChecker />
            <ConditionalWhatsAppButton />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/planos" element={<Plans />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/install" element={<Install />} />
              <Route path="/politica-cookies" element={<CookiePolicy />} />
              <Route path="/termos" element={<TermosDeUso />} />
              <Route path="/privacidade" element={<PoliticaPrivacidade />} />
              <Route path="/call/:roomName" element={<VisitorCall />} />
              <Route path="/qrcode" element={
                <ProtectedRoute>
                  <QRCodePage />
                </ProtectedRoute>
              } />
              <Route path="/qrcode/:propertyId" element={
                <ProtectedRoute>
                  <QRCodePage />
                </ProtectedRoute>
              } />
              <Route path="/nfc" element={
                <ProtectedRoute>
                  <NFCDoorbellPage />
                </ProtectedRoute>
              } />
              <Route path="/nfc/:propertyId" element={
                <ProtectedRoute>
                  <NFCDoorbellPage />
                </ProtectedRoute>
              } />
              <Route path="/motovii" element={
                <ProtectedRoute>
                  <MotoViiPage />
                </ProtectedRoute>
              } />
              <Route path="/motovii/:propertyId" element={
                <ProtectedRoute>
                  <MotoViiPage />
                </ProtectedRoute>
              } />
              <Route path="/carvii" element={
                <ProtectedRoute>
                  <CarViiPage />
                </ProtectedRoute>
              } />
              <Route path="/carvii/:propertyId" element={
                <ProtectedRoute>
                  <CarViiPage />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/box-control" element={
                <ProtectedRoute>
                  <BoxControl />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
