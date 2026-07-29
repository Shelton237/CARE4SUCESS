import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { MotionConfig } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ROUTE_PATHS } from "@/lib/index";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Niveaux from "@/pages/Niveaux";
import Professeurs from "@/pages/Professeurs";
import PublicTeacherProfile from "@/pages/PublicTeacherProfile";
import DevenirProfesseur from "@/pages/DevenirProfesseur";
import Contact from "@/pages/Contact";
import Inscription from "@/pages/Inscription";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import NotFound from "./pages/not-found/Index";
import Login from "@/pages/auth/Login";
import AdminLayout from "@/pages/admin/AdminLayout";
import TeacherLayout from "@/pages/teacher/TeacherLayout";
import ParentLayout from "@/pages/parent/ParentLayout";
import AdvisorLayout from "@/pages/advisor/AdvisorLayout";
import StudentLayout from "@/pages/student/StudentLayout";
import TutorLayout from "@/pages/tutor/TutorLayout";
import VirtualClassroom from "@/pages/common/VirtualClassroom";
import AccountProfile from "@/pages/common/AccountProfile";
import Notifications from "@/pages/common/Notifications";

const queryClient = new QueryClient();

// Le web est servi par Apache avec un fallback SPA (toute URL inconnue
// renvoie index.html), donc BrowserRouter donne des URLs propres sans "/#".
// L'app native (Capacitor) charge dist/ en local sans serveur pour faire ce
// fallback : elle doit rester en HashRouter (cf. src/lib/capacitor-push.ts
// qui navigue via window.location.hash sur clic de notification).
const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MotionConfig reducedMotion="user">
        <Toaster />
        <Sonner />
        <Router>
          <AuthProvider>
            <Routes>
              {/* Public pages — each with its own Layout (navbar + footer) */}
              <Route path={ROUTE_PATHS.HOME} element={<Layout><Home /></Layout>} />
              <Route path={ROUTE_PATHS.SERVICES} element={<Layout><Services /></Layout>} />
              <Route path={ROUTE_PATHS.NIVEAUX} element={<Layout><Niveaux /></Layout>} />
              <Route path={ROUTE_PATHS.PROFESSEURS} element={<Layout><Professeurs /></Layout>} />
              <Route path="/professeurs/:id" element={<Layout><PublicTeacherProfile /></Layout>} />
              <Route path={ROUTE_PATHS.DEVENIR_PROFESSEUR} element={<Layout><DevenirProfesseur /></Layout>} />
              <Route path="/recrutement" element={<Layout><DevenirProfesseur /></Layout>} />
              <Route path={ROUTE_PATHS.CONTACT} element={<Layout><Contact /></Layout>} />
              <Route path="/inscription" element={<Layout><Inscription /></Layout>} />
              <Route path={ROUTE_PATHS.A_PROPOS} element={<Layout><About /></Layout>} />
              <Route path={ROUTE_PATHS.TARIFS} element={<Layout><Pricing /></Layout>} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />

              {/* Backoffice — protected routes, each with its own layout */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute role="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/*"
                element={
                  <ProtectedRoute role="teacher">
                    <TeacherLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent/*"
                element={
                  <ProtectedRoute role="parent">
                    <ParentLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advisor/*"
                element={
                  <ProtectedRoute role="advisor">
                    <AdvisorLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/*"
                element={
                  <ProtectedRoute role="student">
                    <StudentLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tutor/*"
                element={
                  <ProtectedRoute role="tutor">
                    <TutorLayout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/virtual-class/:sessionId"
                element={
                  <ProtectedRoute>
                    <VirtualClassroom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </AuthProvider>
        </Router>
      </MotionConfig>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
