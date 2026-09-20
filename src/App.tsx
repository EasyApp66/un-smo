import { useEffect, useState, lazy, Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Unlock from "./pages/Unlock";
import UpdateBanner from "./components/UpdateBanner";

const LegalRoute = lazy(() => import("./pages/LegalRoute"));
const LegalCheck = lazy(() => import("./pages/LegalCheck"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Support = lazy(() => import("./pages/Support"));

const LEGAL_SLUGS = ['impressum', 'datenschutz', 'agb', 'gesundheitshinweis'];

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
  const path = usePath().replace(/\/+$/, '');
  const slug = path.replace(/^\//, '');
  const isPublicInfoPage = slug === 'privacy-policy' || slug === 'support';

  const screen = slug === 'privacy-policy' ? (
    <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
      <PrivacyPolicy />
    </Suspense>
  ) : slug === 'support' ? (
    <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
      <Support />
    </Suspense>
  ) : LEGAL_SLUGS.includes(slug) ? (
    <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
      <LegalRoute slug={slug} />
    </Suspense>
  ) : slug === 'rechtliches-check' ? (
    <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
      <LegalCheck />
    </Suspense>
  ) : slug === 'unlock' ? (
    <Unlock />
  ) : (
    <Index />
  );

  return (
    <TooltipProvider>
      <Sonner />
      {!isPublicInfoPage && <UpdateBanner />}
      {screen}
    </TooltipProvider>
  );
};

export default App;
