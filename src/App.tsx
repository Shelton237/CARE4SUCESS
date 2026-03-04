import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ROUTE_PATHS } from "@/lib/index";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Niveaux from "@/pages/Niveaux";
import Professeurs from "@/pages/Professeurs";
import Contact from "@/pages/Contact";
import NotFound from "./pages/not-found/Index";
import Login from "@/pages/auth/Login";
import AdminLayout from "@/pages/admin/AdminLayout";
import TeacherLayout from "@/pages/teacher/TeacherLayout";
import ParentLayout from "@/pages/parent/ParentLayout";
import AdvisorLayout from "@/pages/advisor/AdvisorLayout";
import StudentLayout from "@/pages/student/StudentLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <MotionConfig reducedMotion="user">
        <Toaster />
        <Sonner />
        <HashRouter>
          <AuthProvider>
            <Routes>
              {/* Public pages — each with its own Layout (navbar + footer) */}
              <Route path={ROUTE_PATHS.HOME} element={<Layout><Home /></Layout>} />
              <Route path={ROUTE_PATHS.SERVICES} element={<Layout><Services /></Layout>} />
              <Route path={ROUTE_PATHS.NIVEAUX} element={<Layout><Niveaux /></Layout>} />
              <Route path={ROUTE_PATHS.PROFESSEURS} element={<Layout><Professeurs /></Layout>} />
              <Route path={ROUTE_PATHS.CONTACT} element={<Layout><Contact /></Layout>} />

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

              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </AuthProvider>
        </HashRouter>
      </MotionConfig>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;