import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@components/Layout';
import { LoginForm } from '@components/LoginForm';
import { HomePage } from '@pages/HomePage';
import { RegisterPage } from '@pages/RegisterPage';
import { OnboardingPage } from '@pages/OnboardingPage';
import { TrainingPage } from '@pages/TrainingPage';
import { TrainingModuleDetailPage } from '@pages/TrainingModuleDetailPage';
import { TrainingSimulatorPage } from '@pages/TrainingSimulatorPage';
import { SchedulePage } from '@pages/SchedulePage';
import { ScheduleAdminPage } from '@pages/ScheduleAdminPage';
import { KnowledgeBasePage } from '@pages/KnowledgeBasePage';
import { EquipmentPage } from '@pages/EquipmentPage';
import { PsychologicalSupportPage } from '@pages/PsychologicalSupportPage';
import { MentorshipPage } from '@pages/MentorshipPage';
import { CommanderDashboardPage } from '@pages/CommanderDashboardPage';
import { InviteCodesPage } from '@pages/InviteCodesPage';
import { ProfilePage } from '@pages/ProfilePage';
import { UnitGuidePage } from '@pages/UnitGuidePage';
import { UnitGuideAdminPage } from '@pages/UnitGuideAdminPage';
import { MentorDashboardPage } from '@pages/MentorDashboardPage';
import { PsychologistDashboardPage } from '@pages/PsychologistDashboardPage';
import { GuidePage } from '@pages/GuidePage';
import { NoticeBoardPage } from '@pages/NoticeBoardPage';
import { FAQPage } from '@pages/FAQPage';
import { ResourceAdminPage } from '@pages/ResourceAdminPage';
import { ReportsPage } from '@pages/ReportsPage';
import { AchievementsPage } from '@pages/AchievementsPage';
import { TrainingAdminPage } from '@pages/TrainingAdminPage';
import { SimulatorAdminPage } from '@pages/SimulatorAdminPage';
import { AIChatPage } from '@pages/AIChatPage';
import { Navigate } from 'react-router-dom';
import { authService } from '@services/api';
import { useAuthStore } from '@stores/index';
import '@styles/index.css';

// Simple 404 component
const NotFoundPage = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center">
      <div className="text-8xl mb-4">🛡</div>
      <h1 className="text-4xl font-black mb-2" style={{ color: 'var(--ab3-gold)' }}>404</h1>
      <p className="text-lg mb-6" style={{ color: 'var(--text-muted)' }}>Сторінку не знайдено</p>
      <button
        onClick={() => window.location.href = '/'}
        className="btn btn-primary"
      >
        🏠 На головну
      </button>
    </div>
  </div>
);

function App() {
  const { user, token, setUser } = useAuthStore();

  useEffect(() => {
    if (token) {
      authService
        .validateToken()
        .then((response) => {
          const data = response.data?.data || response.data;
          if (data?.user) {
            setUser(data.user);
          }
        })
        .catch(() => {
          // Якщо токен недійсний, перехід на /login відбудеться через інтерцептор
        });
    }
  }, [token, setUser]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Публічні сторінки */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Захищені сторінки */}
        <Route
          path="/*"
          element={
            user ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/unit-guide" element={<UnitGuidePage />} />
                  <Route path="/unit-guide-admin" element={<UnitGuideAdminPage />} />
                  <Route path="/notice-board" element={<NoticeBoardPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/ai-chat" element={<AIChatPage />} />
                  <Route path="/guide" element={<GuidePage />} />
                  <Route path="/guide-admin" element={<ResourceAdminPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/training" element={<TrainingPage />} />
                  <Route path="/training/:id" element={<TrainingModuleDetailPage />} />
                  <Route path="/training-admin" element={<TrainingAdminPage />} />
                  <Route path="/training-simulators" element={<TrainingSimulatorPage />} />
                  <Route path="/simulator-admin" element={<SimulatorAdminPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/schedule-admin" element={<ScheduleAdminPage />} />
                  <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                  <Route path="/equipment" element={<EquipmentPage />} />
                  <Route path="/psychological-support" element={<PsychologicalSupportPage />} />
                  <Route path="/mentorship" element={<MentorshipPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/commander-dashboard" element={<CommanderDashboardPage />} />
                  <Route path="/mentor-dashboard" element={<MentorDashboardPage />} />
                  <Route path="/psychologist-dashboard" element={<PsychologistDashboardPage />} />
                  <Route path="/invite-codes" element={<InviteCodesPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
