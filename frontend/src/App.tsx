import React, { useEffect } from 'react';
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
import { UnitDashboardPage } from '@pages/UnitDashboardPage';
import { ChatPage } from '@pages/ChatPage';
import { GuidePage } from '@pages/GuidePage';
import { NoticeBoardPage } from '@pages/NoticeBoardPage';
import { FAQPage } from '@pages/FAQPage';
import { NoticeBoardAdminPage } from '@pages/NoticeBoardAdminPage';
import { FAQAdminPage } from '@pages/FAQAdminPage';
import { ResourceAdminPage } from '@pages/ResourceAdminPage';
import { ReportsPage } from '@pages/ReportsPage';
import { AchievementsPage } from '@pages/AchievementsPage';
import { TrainingAdminPage } from '@pages/TrainingAdminPage';
import { SimulatorAdminPage } from '@pages/SimulatorAdminPage';
import { AIChatPage } from '@pages/AIChatPage';
import { SlangDictionaryPage } from '@pages/SlangDictionaryPage';
import { SlangAdminPage } from '@pages/SlangAdminPage';
import { VisualGearPage } from '@pages/VisualGearPage';
import { Navigate } from 'react-router-dom';
import { authService, api } from '@services/api';
import { useAuthStore } from '@stores/index';
import '@styles/index.css';

// Simple 404 component
const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-[#050505] relative overflow-hidden font-mono">
    <style>{`
      @keyframes roam {
        0% { transform: translate(0, 0); }
        20% { transform: translate(30vw, -15vh); }
        40% { transform: translate(-25vw, 25vh); }
        60% { transform: translate(15vw, 35vh); }
        80% { transform: translate(-30vw, -10vh); }
        100% { transform: translate(0, 0); }
      }
      .animate-roam { animation: roam 12s ease-in-out infinite; }
      .radar-sweep { background: conic-gradient(from 0deg, transparent 70%, rgba(220, 38, 38, 0.3) 100%); }
    `}</style>
    
    {/* Tactical Grid Overlay */}
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
    
    {/* Radar Background */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] border border-[#222] rounded-full opacity-30 pointer-events-none">
      <div className="absolute inset-0 radar-sweep rounded-full animate-spin" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#333]"></div>
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-[#333]"></div>
      <div className="absolute inset-1/4 border border-[#333] rounded-full"></div>
      <div className="absolute inset-[37.5%] border border-[#222] rounded-full border-dashed"></div>
    </div>

    {/* Searching Crosshair (Sniper scope looking for target) */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 animate-roam">
      <div className="w-32 h-32 md:w-40 md:h-40 border-2 border-red-500/50 rounded-full relative flex items-center justify-center">
        <div className="absolute top-1/2 -left-4 w-8 h-[2px] bg-red-500/80 -translate-y-1/2"></div>
        <div className="absolute top-1/2 -right-4 w-8 h-[2px] bg-red-500/80 -translate-y-1/2"></div>
        <div className="absolute -top-4 left-1/2 w-[2px] h-8 bg-red-500/80 -translate-x-1/2"></div>
        <div className="absolute -bottom-4 left-1/2 w-[2px] h-8 bg-red-500/80 -translate-x-1/2"></div>
        <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red] animate-ping"></div>
      </div>
    </div>

    {/* 404 Content */}
    <div className="relative z-10 p-8 sm:p-12 bg-[#0a0a0a]/90 border border-[#333] shadow-[8px_8px_0_0_#111] max-w-md w-full mx-4 backdrop-blur-md animate-fade-in-up">
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--ab3-gold)]"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--ab3-gold)]"></div>

      <div className="text-center mb-6">
        <h1 className="text-7xl sm:text-8xl font-heading font-black text-white tracking-widest drop-shadow-lg mb-2">
          4<span className="text-[var(--ab3-gold)] animate-pulse">0</span>4
        </h1>
        <div className="inline-block px-3 py-1 bg-red-900/30 border border-red-900 text-red-500 text-[10px] font-bold uppercase tracking-widest">
          [ ТАРГЕТ ВТРАЧЕНО ]
        </div>
      </div>

      <p className="text-sm text-gray-400 mb-8 leading-relaxed border-l-2 border-[#333] pl-4 text-justify">
        Сектор чистий. Запитувану координату (як і ворога) не виявлено. Можливо, сторінка змінила дислокацію або була знищена ворожим РЕБ.
      </p>

      <button
        onClick={() => window.location.href = '/'}
        className="w-full bg-[#111] border border-[#333] text-white hover:text-black hover:bg-[var(--ab3-gold)] hover:border-[var(--ab3-gold)] font-bold uppercase tracking-widest px-6 py-4 transition-all shadow-[4px_4px_0_0_#050505] hover:shadow-[4px_4px_0_0_var(--ab3-gold)] flex items-center justify-center gap-3"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        ПОВЕРНУТИСЯ НА БАЗУ
      </button>
    </div>
  </div>
);

// Компонент-обгортка для захисту адмінських маршрутів за ролями
const RequireRole = ({ children, roles }: { children: React.ReactNode, roles: string[] }) => {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const { user, token, setUser } = useAuthStore();

  useEffect(() => {
    if (token) {
      authService
        .validateToken()
        .then((response) => {
          const data = response.data?.data || response.data;
          if (data?.user) {
            // Одразу підтягуємо розширений профіль (з підписом), щоб він не зникав після F5
            api.get('/users/profile-extended').then(extRes => {
              setUser({ ...data.user, ...extRes.data?.data });
            }).catch(() => {
              setUser(data.user);
            });
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
          /* Тактичне світіння та розширення тексту меню */
          text-shadow: 0 0 12px rgba(201, 162, 39, 0.6), 0 0 24px rgba(201, 162, 39, 0.2) !important;
          color: #fff !important;
          letter-spacing: 0.2em !important;
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
        
        /* 6. Глітч ефект для заголовків (Brutal Glitch) */
        .glitch-hover:hover {
          animation: brutalGlitch 0.3s infinite;
        }
        @keyframes brutalGlitch {
          0% { text-shadow: 3px 0 red, -3px 0 cyan; transform: translate(-1px, 1px); }
          50% { text-shadow: -3px 0 red, 3px 0 cyan; transform: translate(1px, -1px); }
          100% { text-shadow: none; transform: translate(0); }
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
                  <Route path="/unit-guide-admin" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><UnitGuideAdminPage /></RequireRole>} />
                  <Route path="/notice-board" element={<NoticeBoardPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/notice-board-admin" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><NoticeBoardAdminPage /></RequireRole>} />
                  <Route path="/faq-admin" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><FAQAdminPage /></RequireRole>} />
                  <Route path="/ai-chat" element={<AIChatPage />} />
                  <Route path="/guide" element={<GuidePage />} />
                  <Route path="/guide-admin" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><ResourceAdminPage /></RequireRole>} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/training" element={<TrainingPage />} />
                  <Route path="/training/:id" element={<TrainingModuleDetailPage />} />
                  <Route path="/training-admin" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><TrainingAdminPage /></RequireRole>} />
                  <Route path="/training-simulators" element={<TrainingSimulatorPage />} />
                  <Route path="/simulator-admin" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><SimulatorAdminPage /></RequireRole>} />
                  <Route path="/schedule" element={<SchedulePage />} />
                  <Route path="/schedule-admin" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><ScheduleAdminPage /></RequireRole>} />
                  <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                  <Route path="/slang" element={<SlangDictionaryPage />} />
                  <Route path="/slang-admin" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><SlangAdminPage /></RequireRole>} />
                  <Route path="/equipment" element={<EquipmentPage />} />
                  <Route path="/visual-gear" element={<VisualGearPage />} />
                  <Route path="/psychological-support" element={<PsychologicalSupportPage />} />
                  <Route path="/mentorship" element={<MentorshipPage />} />
                  <Route path="/unit-dashboard" element={<UnitDashboardPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/achievements" element={<AchievementsPage />} />
                  <Route path="/commander-dashboard" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><CommanderDashboardPage /></RequireRole>} />
                  <Route path="/mentor-dashboard" element={<RequireRole roles={['mentor', 'commander', 'admin', 'superadmin']}><MentorDashboardPage /></RequireRole>} />
                  <Route path="/psychologist-dashboard" element={<RequireRole roles={['psychologist', 'commander', 'admin', 'superadmin']}><PsychologistDashboardPage /></RequireRole>} />
                  <Route path="/invite-codes" element={<RequireRole roles={['commander', 'admin', 'superadmin']}><InviteCodesPage /></RequireRole>} />
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
