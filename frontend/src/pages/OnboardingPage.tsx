import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/index';
import { api } from '@services/api';

type OnboardingStep = 'welcome' | 'profile' | 'roadmap' | 'complete';

interface ProfileAnswers {
  militaryExperience: 'none' | 'conscript' | 'contract' | 'officer';
  education: string;
  specialization: string;
  physicalFitness: number;
  concerns: string[];
  skills: string[];
  preferredLearning: 'visual' | 'audio' | 'practical' | 'mixed';
  mentorPreference: boolean;
  nightShiftExperience: boolean;
}

interface LearningTrajectory {
  trajectory: string[];
  estimatedDuration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  roadmap: Array<{ week: number; title: string; modules: string[]; goals: string[]; milestones: string[] }>;
  personalRecommendations: string[];
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trajectory, setTrajectory] = useState<LearningTrajectory | null>(null);

  const [answers, setAnswers] = useState<ProfileAnswers>({
    militaryExperience: 'none',
    education: '',
    specialization: '',
    physicalFitness: 3,
    concerns: [],
    skills: [],
    preferredLearning: 'mixed',
    mentorPreference: false,
    nightShiftExperience: false,
  });

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const handleProfileChange = (field: keyof ProfileAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const toggleConcern = (concern: string) => {
    setAnswers(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter(c => c !== concern)
        : [...prev.concerns, concern]
    }));
  };

  const toggleSkill = (skill: string) => {
    setAnswers(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const generateTrajectory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/onboarding/generate-trajectory', { profileAnswers: answers });
      const data = response.data.data || response.data;
      setTrajectory(data);
      setStep('roadmap');
    } catch (error: any) {
      console.error('Error generating trajectory:', error);
      setError(error.response?.data?.error || 'Помилка при генеруванні дорожньої карти');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/onboarding/complete', {
        profileAnswers: answers,
        trajectory,
      });
      setStep('complete');
      setTimeout(() => navigate('/'), 3000);
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.response?.data?.error || 'Помилка при завершенні');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 6rem)', background: 'var(--bg-primary)' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bg-grid-pattern opacity-30 absolute inset-0" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px]" style={{ background: 'radial-gradient(circle, rgba(201, 162, 39, 0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px]" style={{ background: 'radial-gradient(circle, rgba(74, 93, 35, 0.1) 0%, transparent 70%)' }} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-5 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div>
        </div>
      )}

      {/* Skip Button */}
      {step !== 'complete' && (
        <div className="flex justify-center mt-8 mb-4 animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <button
            onClick={() => navigate('/')}
            className="btn"
            style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px 28px', fontSize: '14px' }}
          >
            ✕ Пропустити
          </button>
        </div>
      )}

      {/* Welcome Step */}
      {step === 'welcome' && (
        <div className="flex items-center justify-center py-12 relative z-10">
          <div className="max-w-2xl w-full text-center animate-fade-in-up">
            <div
              className="inline-flex items-center justify-center w-28 h-28 rounded-3xl mb-8 animate-float"
              style={{ background: 'var(--gradient-gold)', boxShadow: '0 8px 50px rgba(201, 162, 39, 0.3)' }}
            >
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#080808"/></svg>
            </div>
            <h1 className="text-5xl font-heading font-black text-gradient-gold mb-4 animate-glow-pulse" style={{ letterSpacing: '3px', lineHeight: '1.1' }}>
              ЛАСКАВО ПРОСИМО!
            </h1>
            <p className="text-xl mb-2" style={{ color: 'var(--text-secondary)', fontSize: '20px' }}>
              {user?.firstName ? `${user.firstName},` : ''} новобранець!
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              Персоналізований план адаптації для вас
            </p>

            <div
              className="p-8 rounded-2xl my-8 animate-fade-in-up"
              style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-subtle)', animationDelay: '0.15s', animationFillMode: 'both' }}
            >
              <p className="mb-4" style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.7' }}>
                Цей модуль розробить для вас індивідуальну <strong style={{ color: 'var(--ab3-gold)' }}>дорожню карту </strong>
                адаптації на перші тижні служби. Ми врахуємо ваш досвід, навички та
                особисті потреби для оптимального результату.
              </p>
              <p style={{ color: 'var(--ab3-gold)', fontSize: '14px', fontWeight: 600 }}>⚡ Займе ~5 хвилин</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { icon: '📊', title: 'Аналіз', desc: 'Оцінимо ваш рівень' },
                { icon: '🗺️', title: 'Дорожня карта', desc: 'Будуємо траєкторію' },
                { icon: '🎯', title: 'Персоналізація', desc: 'Налаштовуємо під вас' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl animate-scale-in"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: `${0.2 + i * 0.1}s`, animationFillMode: 'both' }}
                >
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('profile')}
              className="btn btn-primary w-full py-5 text-lg"
            >
              Розпочати опитування →
            </button>
          </div>
        </div>
      )}

      {/* Profile Step */}
      {step === 'profile' && (
        <div className="py-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 animate-fade-in-up">
              <h2 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>
                📋 Ваш профіль
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Розкажіть про себе, щоб ми краще вас зрозуміли</p>
              <div className="w-full rounded-full h-2 mt-4" style={{ background: 'var(--ab3-gray-800)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ background: 'var(--gradient-gold)', width: '20%' }} />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-5 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                <div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div>
              </div>
            )}

            <div className="space-y-4">
              {/* Military Experience */}
              <div className="p-6 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: '0.05s', animationFillMode: 'both' }}>
                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>📜 Військовий досвід</label>
                <select
                  value={answers.militaryExperience}
                  onChange={(e) => handleProfileChange('militaryExperience', e.target.value)}
                  className="input"
                >
                  <option value="none">Це моя перша служба</option>
                  <option value="conscript">Служив раніше (строкова служба)</option>
                  <option value="contract">Контрактник</option>
                  <option value="officer">Офіцер</option>
                </select>
              </div>

              {/* Education */}
              <div className="p-6 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}>
                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>🎓 Цивільна освіта</label>
                <input
                  type="text"
                  placeholder="Напр: Інженер IT, Медик, Логіст"
                  value={answers.education}
                  onChange={(e) => handleProfileChange('education', e.target.value)}
                  className="input"
                />
              </div>

              {/* Specialization */}
              <div className="p-6 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: '0.15s', animationFillMode: 'both' }}>
                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>🎯 Військова спеціалізація</label>
                <input
                  type="text"
                  placeholder="Напр: Піхотинець, Механік, Зв'язківець"
                  value={answers.specialization}
                  onChange={(e) => handleProfileChange('specialization', e.target.value)}
                  className="input"
                />
              </div>

              {/* Physical Fitness */}
              <div className="p-6 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: '0.2s', animationFillMode: 'both' }}>
                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>💪 Фізична форма</label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => handleProfileChange('physicalFitness', level)}
                      className="flex-1 py-3 rounded-xl font-bold text-lg transition-all duration-300"
                      style={{
                        background: answers.physicalFitness === level ? 'var(--gradient-gold)' : 'var(--bg-glass)',
                        color: answers.physicalFitness === level ? 'var(--ab3-black)' : 'var(--text-muted)',
                        border: `1px solid ${answers.physicalFitness === level ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                        boxShadow: answers.physicalFitness === level ? '0 4px 20px rgba(201, 162, 39, 0.3)' : 'none',
                      }}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concerns */}
              <div className="p-6 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: '0.25s', animationFillMode: 'both' }}>
                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>😰 Ваші потреби</label>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Виберіть усе актуальне</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Психологічна підготовка',
                    'Спеціальна фізична підготовка',
                    'Військова медицина',
                    'Тактична підготовка',
                    'Мінна безпека',
                    'Виживання в польових умовах'
                  ].map(concern => (
                    <button
                      key={concern}
                      onClick={() => toggleConcern(concern)}
                      className="p-3 rounded-xl text-sm font-semibold transition-all duration-300"
                      style={{
                        background: answers.concerns.includes(concern) ? 'rgba(201, 162, 39, 0.15)' : 'var(--bg-glass)',
                        color: answers.concerns.includes(concern) ? 'var(--ab3-gold-light)' : 'var(--text-muted)',
                        border: `1px solid ${answers.concerns.includes(concern) ? 'rgba(201, 162, 39, 0.3)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      {answers.concerns.includes(concern) ? '✅ ' : ''}{concern}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="p-6 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: '0.3s', animationFillMode: 'both' }}>
                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>⭐ Ваші навички</label>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Що ви вже вмієте</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'IT та електроніка',
                    'Медицина',
                    'Лідерство',
                    'Англійська мова',
                    'Топографія',
                    'Механіка'
                  ].map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className="p-3 rounded-xl text-sm font-semibold transition-all duration-300"
                      style={{
                        background: answers.skills.includes(skill) ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-glass)',
                        color: answers.skills.includes(skill) ? '#4ade80' : 'var(--text-muted)',
                        border: `1px solid ${answers.skills.includes(skill) ? 'rgba(34, 197, 94, 0.3)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      {answers.skills.includes(skill) ? '✅ ' : ''}{skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning Preference */}
              <div className="p-6 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: '0.35s', animationFillMode: 'both' }}>
                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>🎓 Як вам краще вчитися?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'visual' as const, label: 'Відео', icon: '🎬' },
                    { value: 'audio' as const, label: 'Аудіо', icon: '🎧' },
                    { value: 'practical' as const, label: 'Практика', icon: '🔨' },
                    { value: 'mixed' as const, label: 'Змішано', icon: '🎯' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleProfileChange('preferredLearning', option.value)}
                      className="p-4 rounded-xl font-semibold transition-all duration-300"
                      style={{
                        background: answers.preferredLearning === option.value ? 'var(--gradient-gold)' : 'var(--bg-glass)',
                        color: answers.preferredLearning === option.value ? 'var(--ab3-black)' : 'var(--text-muted)',
                        border: `1px solid ${answers.preferredLearning === option.value ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
                {[
                  { key: 'mentorPreference' as const, label: 'Я хочу ментора для персональної підтримки' },
                  { key: 'nightShiftExperience' as const, label: 'У мене є досвід роботи в нічні змінах' },
                ].map(item => (
                  <label
                    key={item.key}
                    className="flex items-center gap-4 cursor-pointer p-5 rounded-2xl transition-all duration-300"
                    style={{
                      background: (answers as any)[item.key] ? 'rgba(201, 162, 39, 0.08)' : 'var(--bg-card)',
                      border: `1px solid ${(answers as any)[item.key] ? 'rgba(201, 162, 39, 0.2)' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(answers as any)[item.key]}
                      onChange={() => handleProfileChange(item.key, !(answers as any)[item.key])}
                      className="w-5 h-5"
                      style={{ accentColor: 'var(--ab3-gold)' }}
                    />
                    <span style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.5' }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep('welcome')}
                className="btn flex-1"
                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '14px 24px', fontSize: '14px' }}
              >
                ← Назад
              </button>
              <button
                onClick={generateTrajectory}
                disabled={loading}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: '14px 24px', fontSize: '14px' }}
              >
                {loading ? (
                  <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>Генерую...</>
                ) : 'Генерувати дорожню карту →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roadmap Step */}
      {step === 'roadmap' && trajectory && (
        <div className="py-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 animate-fade-in-up">
              <h2 className="text-4xl font-heading font-black text-gradient-gold mb-3">🗺️ Дорожня карта</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
                Ваш персоналізований план адаптації на {trajectory.estimatedDuration} днів
              </p>
              <div className="w-full rounded-full h-3 mt-4" style={{ background: 'var(--ab3-gray-800)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ background: 'var(--gradient-gold)', width: '30%' }} />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-5 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                <div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Складність', value: trajectory.difficulty === 'easy' ? '🟢 Легко' : trajectory.difficulty === 'medium' ? '🟡 Середній' : '🔴 Складний', color: '#c9a227' },
                { label: 'Модулів', value: `${trajectory.trajectory.length} 📚`, color: '#ef4444' },
                { label: 'Тривалість', value: `${trajectory.estimatedDuration} днів ⏰`, color: '#f59e0b' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl animate-scale-in"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
                >
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Trajectory */}
            <div className="p-6 rounded-2xl mb-8 animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: '0.3s', animationFillMode: 'both' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Ваша траєкторія навчання</h3>
              <div className="space-y-3">
                {trajectory.trajectory.map((module, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'var(--gradient-gold)', color: 'var(--ab3-black)' }}>
                      {idx + 1}
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{module}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Roadmap */}
            <div className="space-y-4 mb-8">
              {trajectory.roadmap.map((week) => (
                <div key={week.week} className="p-6 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationDelay: `${0.35 + week.week * 0.05}s`, animationFillMode: 'both' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg" style={{ background: 'var(--gradient-gold)', color: 'var(--ab3-black)' }}>
                        {week.week}
                      </div>
                      <span className="text-sm font-bold" style={{ color: 'var(--ab3-gold)' }}>Тиждень</span>
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{week.title}</h3>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--ab3-gold)' }}>📚 Модулі</h4>
                      <ul className="space-y-1">
                        {week.modules.map((mod, idx) => (
                          <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>• {mod}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--ab3-gold)' }}>🎯 Цілі</h4>
                      <ul className="space-y-1">
                        {week.goals.map((goal, idx) => (
                          <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>✓ {goal}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--ab3-gold)' }}>🏆 Віхи</h4>
                      <ul className="space-y-1">
                        {week.milestones.map((milestone, idx) => (
                          <li key={idx} className="text-sm" style={{ color: 'var(--text-secondary)' }}>★ {milestone}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="p-6 rounded-2xl mb-8 animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderLeft: '4px solid var(--ab3-gold)', animationDelay: '0.5s', animationFillMode: 'both' }}>
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--ab3-gold)' }}>💡 Особисті рекомендації</h3>
              <ul className="space-y-2">
                {trajectory.personalRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span style={{ color: 'var(--ab3-gold)' }}>→</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-4 mb-12">
              <button
                onClick={() => setStep('profile')}
                className="btn flex-1"
                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '14px 24px', fontSize: '14px' }}
              >
                ← Редагувати профіль
              </button>
              <button
                onClick={completeOnboarding}
                disabled={loading}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ padding: '14px 24px', fontSize: '14px' }}
              >
                {loading ? '⏳ Завершую...' : 'Почати адаптацію! 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === 'complete' && (
        <div className="flex items-center justify-center py-12 relative z-10">
          <div className="max-w-xl w-full text-center animate-scale-in">
            <div className="text-8xl mb-6 animate-bounce">✅</div>
            <h1 className="text-5xl font-heading font-black text-gradient-gold mb-4 animate-glow-pulse">
              УСПІШНО!
            </h1>
            <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>
              Дорожня карта створена спеціально для вас.
            </p>
            <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
              Перенаправлення на головну...
            </p>

            <div className="p-8 rounded-2xl mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Що далі?</h2>
              <ul className="text-left space-y-3">
                {[
                  { icon: '✨', text: 'Розпочніть перший модуль навчання' },
                  { icon: '📅', text: 'Перегляньте свій розпорядок' },
                  { icon: '👥', text: 'Знайдіть свого ментора' },
                  { icon: '💪', text: 'Слідкуйте за прогресом' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => navigate('/')}
              className="btn btn-primary w-full py-5 text-lg"
            >
              Перейти на головну →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
