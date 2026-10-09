import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppProviders } from "@/providers/AppProviders";
import { AppRoutes } from "@/routes/AppRoutes";
import ErrorBoundary from "@/components/ErrorBoundary";
import Seo from "@/components/Seo";
import { PublicLanguageProvider } from "@/i18n/PublicLanguageContext";

const App = () => (
  <ErrorBoundary>
    <AppProviders>
      <Toaster />
      <Sonner />
      <HelmetProvider>
        <BrowserRouter>
          <PublicLanguageProvider>
            <Seo />
            <AppRoutes />
          </PublicLanguageProvider>
        </BrowserRouter>
      </HelmetProvider>
    </AppProviders>
  </ErrorBoundary>
);

export default App;
