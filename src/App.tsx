import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Cases from "./pages/Cases";
import Exhibits from "./pages/Exhibits";
import Analytics from "./pages/Analytics";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import Team from "./pages/Team";
import Reports from "./pages/Reports";
import EvidenceQueue from "./pages/EvidenceQueue";
import ChainOfCustodyPage from "./pages/ChainOfCustodyPage";
import SearchPage from "./pages/Search";
import Workbench from "./pages/Workbench";
import DataSources from "./pages/DataSources";
import AIAssistantPage from "./pages/AIAssistant";
import Operations from "./pages/Operations";

// Create QueryClient outside component to avoid re-creation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const AppRoutes = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={
        user ? <Navigate to="/" replace /> : <Auth />
      } />
      <Route path="/" element={
        user ? <Index /> : <Navigate to="/auth" replace />
      } />
      <Route path="/cases" element={
        user ? <Cases /> : <Navigate to="/auth" replace />
      } />
      <Route path="/exhibits" element={
        user ? <Exhibits /> : <Navigate to="/auth" replace />
      } />
      <Route path="/analytics" element={
        user ? <Analytics /> : <Navigate to="/auth" replace />
      } />
      <Route path="/users" element={
        user ? <Users /> : <Navigate to="/auth" replace />
      } />
      <Route path="/settings" element={
        user ? <Settings /> : <Navigate to="/auth" replace />
      } />
      <Route path="/security" element={
        user ? <Security /> : <Navigate to="/auth" replace />
      } />
      <Route path="/team" element={
        user ? <Team /> : <Navigate to="/auth" replace />
      } />
      <Route path="/reports" element={
        user ? <Reports /> : <Navigate to="/auth" replace />
      } />
      <Route path="/evidence-queue" element={
        user ? <EvidenceQueue /> : <Navigate to="/auth" replace />
      } />
      <Route path="/chain-of-custody" element={
        user ? <ChainOfCustodyPage /> : <Navigate to="/auth" replace />
      } />
      <Route path="/search" element={
        user ? <SearchPage /> : <Navigate to="/auth" replace />
      } />
      <Route path="/workbench" element={
        user ? <Workbench /> : <Navigate to="/auth" replace />
      } />
      <Route path="/data-sources" element={
        user ? <DataSources /> : <Navigate to="/auth" replace />
      } />
      <Route path="/ai-assistant" element={
        user ? <AIAssistantPage /> : <Navigate to="/auth" replace />
      } />
      <Route path="/operations" element={
        user ? <Operations /> : <Navigate to="/auth" replace />
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <TooltipProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </TooltipProvider>
  );
};

export default App;
