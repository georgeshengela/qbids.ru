import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Home from "@/pages/home";
import Auctions from "@/pages/auctions";
import Admin from "@/pages/admin";
import AdminUsers from "@/pages/admin-users";
import AdminFinishedAuctions from "@/pages/admin-finished-auctions";
import AdminSettings from "@/pages/admin-settings";
import Login from "@/pages/login";
import AuctionDetail from "@/pages/auction-detail";
import BidHistory from "@/pages/bid-history";
import HowItWorks from "@/pages/how-it-works";
import Profile from "@/pages/profile";
import Support from "@/pages/support";
import AuctionRules from "@/pages/auction-rules";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import WelcomePreview from "@/pages/welcome-preview";
import NotFound from "@/pages/not-found";
import { Footer } from "@/components/footer";
import { ScrollToTop } from "@/components/scroll-to-top";
import { useAnalytics } from "@/hooks/use-analytics";
import { useEffect } from "react";
import { initGA } from "./lib/analytics";
import { WelcomeModal } from "@/components/welcome-modal";
import { CookieBanner } from "@/components/cookie-banner";

function Router() {
  // Track page views when routes change
  useAnalytics();
  const { user, showWelcomeModal, setShowWelcomeModal } = useAuth();
  

  
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auctions" component={Auctions} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/finished-auctions" component={AdminFinishedAuctions} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/login" component={Login} />
        <Route path="/auction/:slug" component={AuctionDetail} />
        <Route path="/bid-history" component={BidHistory} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/profile" component={Profile} />
        <Route path="/support" component={Support} />
        <Route path="/auction-rules" component={AuctionRules} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/welcome-preview" component={WelcomePreview} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
      
      {/* Welcome Modal for new users */}
      {user && showWelcomeModal && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => {
            console.log('Closing welcome modal');
            setShowWelcomeModal(false);
          }}
          username={user.username}
        />
      )}
      
      {/* Cookie Banner for first-time visitors */}
      <CookieBanner />
      
      {/* Debug info */}
      {console.log('App render - user:', user?.username, 'showWelcomeModal:', showWelcomeModal)}
      

    </>
  );
}

function App() {
  // Initialize Google Analytics when app loads
  useEffect(() => {
    // Verify required environment variable is present
    if (!import.meta.env.VITE_GA_MEASUREMENT_ID) {
      console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    } else {
      initGA();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
