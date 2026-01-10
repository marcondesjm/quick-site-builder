import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem("cookieConsent");
    if (!hasAccepted) {
      // Show banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl p-4 md:p-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">
                  🍪 Usamos cookies
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                  Para melhorar a navegação e analisar o uso do site. 
                  Ao continuar, você concorda com nossa{" "}
                  <a 
                    href="/politica-cookies" 
                    className="text-primary hover:underline font-medium"
                  >
                    Política de Cookies
                  </a>.
                </p>
                
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    onClick={handleAccept}
                    size="sm"
                    className="flex-1 md:flex-none text-xs md:text-sm"
                  >
                    Aceitar
                  </Button>
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    size="sm"
                    className="flex-1 md:flex-none text-xs md:text-sm"
                  >
                    Recusar
                  </Button>
                </div>
              </div>

              <button
                onClick={handleDecline}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
