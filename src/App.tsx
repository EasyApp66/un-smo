import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import UpdateBanner from "./components/UpdateBanner";

const App = () => (
  <TooltipProvider>
    <Sonner />
    <UpdateBanner />
    <Index />
  </TooltipProvider>
);

export default App;
