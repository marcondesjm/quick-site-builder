import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function ScrollDownIndicator() {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide indicator after user scrolls down 100px
      if (window.scrollY > 100) {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-hide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            animate={{ y: [0, 5, 0] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <span className="text-sm font-medium">Role para ver mais</span>
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{ 
                duration: 0.8, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
          <motion.div
            className="flex flex-col items-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <ChevronDown className="w-5 h-5 text-primary" />
            <ChevronDown className="w-5 h-5 text-primary/60 -mt-3" />
            <ChevronDown className="w-5 h-5 text-primary/30 -mt-3" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
