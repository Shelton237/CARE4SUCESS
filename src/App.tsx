import { lazy, Suspense } from "react";
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

// Lazy loading des pages secondaires et des backoffices pour optimiser les performances (FCP/LCP)
const Services = lazy(() => import("@/pages/Services"));
const Niveaux = lazy(() => import("@/pages/Niveaux"));
const Professeurs = lazy(() => import("@/pages/Professeurs"));
const AnnuaireCoachs = lazy(() => import("@/pages/AnnuaireCoachs"));
const CoursDeLangues = lazy(() => import("@/pages/CoursDeLangues"));
const LanguesLanding = lazy(() => import("@/pages/LanguesLanding"));
const PublicTeacherProfile = lazy(() => import("@/pages/PublicTeacherProfile"));
const GroupClassCheckout = lazy(() => import("@/pages/GroupClassCheckout"));
const DevenirProfesseur = lazy(() => import("@/pages/DevenirProfesseur"));
const CommentCaMarche = lazy(() => import("@/pages/CommentCaMarche"));
const Faq = lazy(() => import("@/pages/Faq"));
const Competences = lazy(() => import("@/pages/Competences"));
const Contact = lazy(() => import("@/pages/Contact"));
const EvaluationGratuite = lazy(() => import("@/pages/EvaluationGratuite"));
const Inscription = lazy(() => import("@/pages/Inscription"));
const About = lazy(() => import("@/pages/About"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const NotFound = lazy(() => import("./pages/not-found/Index"));
const Login = lazy(() => import("@/pages/auth/Login"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const AdminLayout = lazy(() => import("@/pages/admin/AdminLayout"));
const TeacherLayout = lazy(() => import("@/pages/teacher/TeacherLayout"));
const ParentLayout = lazy(() => import("@/pages/parent/ParentLayout"));
const AdvisorLayout = lazy(() => import("@/pages/advisor/AdvisorLayout"));
const StudentLayout = lazy(() => import("@/pages/student/StudentLayout"));
const TutorLayout = lazy(() => import("@/pages/tutor/TutorLayout"));
const VirtualClassroom = lazy(() => import("@/pages/common/VirtualClassroom"));
const AccountProfile = lazy(() => import("@/pages/common/AccountProfile"));
const Notifications = lazy(() => import("@/pages/common/Notifications"));

const PageLoading = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-[#0D2D5A]/20 border-t-[#0D2D5A] rounded-full animate-spin" />
  </div>
);

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
            <Suspense fallback={<PageLoading />}>
              <Routes>
              {/* Public pages — each with its own Layout (navbar + footer) */}
              <Route path={ROUTE_PATHS.HOME} element={<Layout><Home /></Layout>} />
              <Route path={ROUTE_PATHS.SERVICES} element={<Layout><Services /></Layout>} />
              <Route path={ROUTE_PATHS.NIVEAUX} element={<Layout><Niveaux /></Layout>} />
              <Route path={ROUTE_PATHS.PROFESSEURS} element={<Layout><Professeurs /></Layout>} />
              <Route path={ROUTE_PATHS.ANNUAIRE_COACHS} element={<Layout><AnnuaireCoachs /></Layout>} />
              <Route path={ROUTE_PATHS.COURS_DE_LANGUES} element={<Layout><LanguesLanding /></Layout>} />
              <Route path={ROUTE_PATHS.COACHS_LANGUES} element={<Layout><CoursDeLangues /></Layout>} />
              <Route path="/professeurs/:id" element={<Layout><PublicTeacherProfile /></Layout>} />
              <Route path="/cours-groupe/:id" element={<Layout><GroupClassCheckout /></Layout>} />
              <Route path={ROUTE_PATHS.DEVENIR_PROFESSEUR} element={<Layout><DevenirProfesseur /></Layout>} />
              <Route path={ROUTE_PATHS.COMMENT_CA_MARCHE} element={<Layout><CommentCaMarche /></Layout>} />
              <Route path={ROUTE_PATHS.FAQ} element={<Layout><Faq /></Layout>} />
              <Route path={ROUTE_PATHS.COMPETENCES} element={<Layout><Competences /></Layout>} />
              <Route path="/recrutement" element={<Layout><DevenirProfesseur /></Layout>} />
              <Route path={ROUTE_PATHS.CONTACT} element={<Layout><Contact /></Layout>} />
              <Route path={ROUTE_PATHS.EVALUATION_GRATUITE} element={<Layout><EvaluationGratuite /></Layout>} />
              <Route path="/inscription" element={<Layout><Inscription /></Layout>} />
              <Route path={ROUTE_PATHS.A_PROPOS} element={<Layout><About /></Layout>} />
              <Route path={ROUTE_PATHS.POLITIQUE_CONFIDENTIALITE} element={<Layout><PrivacyPolicy /></Layout>} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />

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
              {/* Pas de ProtectedRoute : accessible sans compte via le lien
                  partagé "Copier le lien" (le sessionId sert d'unique clé
                  d'accès, comme un lien Google Meet). */}
              <Route path="/virtual-class/:sessionId" element={<VirtualClassroom />} />
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
            </Suspense>
          </AuthProvider>
        </Router>
      </MotionConfig>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
