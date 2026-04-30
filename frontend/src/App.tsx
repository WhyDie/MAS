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
      <style>{`
        /* === REFINED TACTICAL MILITARY UI === */
        
        /* 1. Чиста механічна анімація появи (без розмиття, чітка фіксація) */
        @keyframes brutalSnap {
          0% { transform: translateY(10px); opacity: 0; }
          60% { transform: translateY(-1px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .animate-fade-in-up, .animate-scale-in, .animate-slide-down {
          animation: brutalSnap 0.25s cubic-bezier(0.0, 0.9, 0.1, 1) both !important;
        }

        /* 2. Брутальні жорсткі тіні (Solid Shadows) - зменшено зсув для комфорту */
        .btn, .military-card, .input {
          transition: transform 0.05s step-end, box-shadow 0.05s step-end, border-color 0.05s step-end !important;
        }
        
        .btn:hover, .military-card:hover {
          transform: translate(-2px, -2px) !important;
          box-shadow: 3px 3px 0px var(--ab3-gold) !important;
          border-color: var(--ab3-gold) !important;
          z-index: 10;
        }
        
        .btn:active, .military-card:active {
          transform: translate(1px, 1px) !important;
          box-shadow: 1px 1px 0px var(--ab3-gold) !important;
        }
        
        .input:focus {
          transform: translate(-2px, -2px) !important;
          box-shadow: 3px 3px 0px var(--ab3-gold) !important;
          border-color: var(--ab3-gold) !important;
          outline: none !important;
        }

        /* 3. Цифрове завантаження (Flicker) для заголовків */
        @keyframes digitalFade {
          0% { opacity: 0; filter: contrast(3); text-shadow: 3px 0 0 red, -3px 0 0 cyan; }
          20% { opacity: 1; filter: contrast(1); text-shadow: none; }
          40% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 1; }
        }
        h1.font-black {
          animation: digitalFade 0.3s step-end both !important;
        }
        
        aside nav button:hover span.font-heading {
          /* Статичний хроматичний зсув замість епілептичного глітчу */
          text-shadow: 1px 0px 0px rgba(255, 0, 0, 0.8), -1px 0px 0px rgba(0, 255, 255, 0.8) !important;
          color: #fff !important;
          letter-spacing: 0.15em !important;
        }

        /* 4. Ефект військового терміналу (Сканлайни - пом'якшено) */
        body::after {
          content: " ";
          display: block;
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04));
          z-index: 9999;
          background-size: 100% 2px, 3px 100%;
          pointer-events: none;
          opacity: 0.06;
        }

        /* 5. Жорстка пульсація для SOS (механічний блим) */
        @keyframes brutalBlink {
          0%, 49% { background: #ef4444; color: #fff; border-color: #ef4444; }
          50%, 100% { background: #0a0a0a; color: #ef4444; border-color: #ef4444; }
        }
        .animate-pulse-glow {
          animation: brutalBlink 0.6s step-end infinite !important;
        }
      `}</style>
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
