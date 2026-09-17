import { useEffect, useState } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Unlock from "./pages/Unlock";
import UpdateBanner from "./components/UpdateBanner";

const usePath = () => {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onChange);
    return () => window.removeEventListener('popstate', onChange);
  }, []);
  return path;
};

const App = () => {
  const path = usePath();
  return (
    <TooltipProvider>
      <Sonner />
      <UpdateBanner />
      {path.replace(/\/+$/, '') === '/unlock' ? <Unlock /> : <Index />}
    </TooltipProvider>
  );
};

export default App;
