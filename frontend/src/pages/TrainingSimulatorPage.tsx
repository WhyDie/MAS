import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

interface TrainingSimulator {
  id: string;
  title: string;
  description: string;
  type: 'scenario' | 'quiz' | 'combat_drill' | 'survival' | 'communication';
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  category: string;
  estimatedMinutes: number;
  averageScore: number;
  completionCount: number;
  tags?: string[];
  scenarioFlow?: any;
  quizContent?: any;
}

const typeLabels: Record<string, string> = {
  scenario: 'Сценарій',
  quiz: 'Вікторина',
  combat_drill: 'Бойова підготовка',
  survival: 'Виживання',
  communication: 'Комунікація',
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: 'Легкий', color: '#22c55e' },
  normal: { label: 'Середній', color: '#3b82f6' },
  hard: { label: 'Складний', color: '#f59e0b' },
  extreme: { label: 'Екстремальний', color: '#ef4444' },
};

// Built-in quiz questions for each simulator type
const quizQuestions: Record<string, Array<{ question: string; options: string[]; correct: number }>> = {
  scenario: [
    { question: 'Перший крок за протоколом MARCH?', options: ['Airway', 'Massive Hemorrhage', 'Respiration', 'Circulation'], correct: 1 },
    { question: 'Куди накладати турнікет?', options: ['На рану', '5-7 см вище рани', 'Нижче рани', 'Без різниці'], correct: 1 },
    { question: 'Як перевірити прохідність дихальних шляхів?', options: ['Підняти підборіддя, відхилити голову', 'Струсити за плече', 'Покричати', 'Дати води'], correct: 0 },
  ],
  quiz: [
    { question: 'Який калібр автомата АК-74?', options: ['5.45 мм', '7.62 мм', '9 мм', '5.56 мм'], correct: 0 },
    { question: 'Максимальна дальність АК-74?', options: ['500 м', '1000 м', '3000 м', '100 м'], correct: 2 },
    { question: 'Скільки частин при неповному розбиранні АК-74?', options: ['3', '5', '7', '10'], correct: 1 },
  ],
  combat_drill: [
    { question: 'Що робити при вогневому контакті?', options: ['Відповісти вогнем, шукати укриття', 'Бігти вперед', 'Здатися', 'Кричати'], correct: 0 },
    { question: 'Дистанція для ефективного вогню з АК-74?', options: ['100-300 м', '50-100 м', '500-700 м', '1 км'], correct: 0 },
    { question: 'Як подати сигнал для евакуації?', options: ['Рація, дим, сигнал', 'Махати руками', 'Голосно кричати', 'Нічого не робити'], correct: 0 },
  ],
  survival: [
    { question: 'Як знайти воду в польових умовах?', options: ['Збір конденсату, копати', 'Пити з калюж', 'Чекати дощ', 'Нічого не пити'], correct: 0 },
    { question: 'Як розвести вогонь без сірників?', options: ['Кресало, лінза, тертя', 'Чекати', 'Неможливо', 'Дмухати'], correct: 0 },
    { question: 'Найкраще укриття в полі?', options: ['Окоп, природні заглиблення', 'Відкрите поле', 'Верхівка дерева', 'Під одиночним деревом'], correct: 0 },
  ],
  communication: [
    { question: 'Що таке позивний?', options: ['Умовне імʼя для радіопереговорів', 'Номер телефону', 'Адреса', 'Пароль'], correct: 0 },
    { question: 'Як повідомити координати?', options: ['За картою, GPS, азимут', 'Навмання', "По телефону", 'Не повідомляти'], correct: 0 },
    { question: 'Що робити при перешкодах?', options: ['Змінити частоту, скоротити передачу', 'Кричати голосніше', 'Вимкнути радіо', 'Чекати'], correct: 0 },
  ],
};

export const TrainingSimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'browse' | 'stats' | 'play'>('browse');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [simulators, setSimulators] = useState<TrainingSimulator[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  const [currentSimulator, setCurrentSimulator] = useState<TrainingSimulator | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [questions, setQuestions] = useState<Array<{ question: string; options: string[]; correct: number }>>([]);

  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'browse') fetchSimulators();
    else if (activeTab === 'stats') fetchUserStats();
  }, [activeTab, selectedType, selectedDifficulty]);

  const fetchSimulators = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedType) params.type = selectedType;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      const response = await api.get('/training-simulators', { params });
      const data = response.data.data?.simulators || response.data.simulators || [];
      setSimulators(data);
      setError('');
    } catch (err) {
      setError('Не вдалося завантажити симулятори');
    } finally { setLoading(false); }
  };

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/training-simulators/my-stats');
      setUserStats(response.data.data || response.data);
      setError('');
    } catch (err) {
      setError('Не вдалося завантажити статистику');
    } finally { setLoading(false); }
  };

  const handleStartSimulator = useCallback((simulator: TrainingSimulator) => {
    setCurrentSimulator(simulator);
    const simQuestions = quizQuestions[simulator.type] || quizQuestions.quiz;
    setQuestions(simQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setAnswered(null);
    setIsComplete(false);
    setActiveTab('play');
    setError('');
  }, []);

  const handleAnswer = (answerIndex: number) => {
    if (answered !== null) return;
    setAnswered(answerIndex);
    const isCorrect = answerIndex === questions[currentQuestion].correct;
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNextQuestion = () => {
    if (currentQuestion + 1 >= questions.length) {
      setIsComplete(true);
      // Save result to backend
      if (currentSimulator) {
        api.post(`/training-simulators/${currentSimulator.id}/start`).catch(() => {});
      }
    } else {
      setCurrentQuestion(q => q + 1);
      setAnswered(null);
    }
  };

  const handleBackToBrowse = () => {
    setCurrentSimulator(null);
    setIsComplete(false);
    setActiveTab('browse');
  };

  const tabs = [
    { id: 'browse' as const, label: 'Бібліотека', icon: '📚' },
    { id: 'stats' as const, label: 'Статистика', icon: '📊' },
  ];

  // ===== PLAYING TAB =====
  if (activeTab === 'play' && currentSimulator) {
    const diff = difficultyConfig[currentSimulator.difficulty] || { label: currentSimulator.difficulty, color: '#6b7280' };

    if (isComplete) {
      const pct = Math.round((score / questions.length) * 100);
      const passed = pct >= 60;
      return (
        <div className="animate-fade-in-up">
          <div className="p-8 rounded-2xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
            <div className="text-7xl mb-6">{passed ? '🎉' : '📚'}</div>
            <h2 className="text-3xl font-heading font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {passed ? 'Вітаємо!' : 'Спробуйте ще раз'}
            </h2>
            <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
              Симулятор "{currentSimulator.title}" завершено
            </p>
            <div className="flex justify-center gap-8 mb-8">
              <div>
                <p className="text-5xl font-black" style={{ color: passed ? '#22c55e' : '#f59e0b' }}>{pct}%</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Результат</p>
              </div>
              <div>
                <p className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>{score}/{questions.length}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Правильних</p>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={() => handleStartSimulator(currentSimulator)} className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '14px' }}>🔄 Пройти ще раз</button>
              <button onClick={handleBackToBrowse} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '14px 28px', fontSize: '14px' }}>← До бібліотеки</button>
            </div>
          </div>
        </div>
      );
    }

    const q = questions[currentQuestion];
    if (!q) return null;

    return (
      <div className="animate-fade-in-up">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <button onClick={handleBackToBrowse} className="text-sm" style={{ color: 'var(--text-muted)' }}>← Назад</button>
            <span className="text-sm font-bold" style={{ color: 'var(--ab3-gold)' }}>{currentQuestion + 1}/{questions.length}</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'var(--ab3-gray-800)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ background: 'var(--gradient-gold)', width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">{currentSimulator.type === 'scenario' ? '🎯' : currentSimulator.type === 'quiz' ? '❓' : currentSimulator.type === 'combat_drill' ? '⚔️' : currentSimulator.type === 'survival' ? '🏕️' : '📡'}</span>
            <div>
              <h2 className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{currentSimulator.title}</h2>
              <span className="badge" style={{ background: `${diff.color}20`, color: diff.color, border: `1px solid ${diff.color}40`, fontSize: '11px' }}>{diff.label}</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-lg font-semibold mb-6" style={{ color: 'var(--text-primary)', fontSize: '18px', lineHeight: '1.5' }}>{q.question}</p>
            <div className="space-y-3">
              {q.options.map((option, idx) => {
                let bg = 'var(--bg-glass)', border = 'var(--border-subtle)', color = 'var(--text-secondary)';
                if (answered !== null) {
                  if (idx === q.correct) { bg = 'rgba(34, 197, 94, 0.15)'; border = 'rgba(34, 197, 94, 0.4)'; color = '#4ade80'; }
                  else if (idx === answered && idx !== q.correct) { bg = 'rgba(239, 68, 68, 0.15)'; border = 'rgba(239, 68, 68, 0.4)'; color = '#f87171'; }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered !== null}
                    className="w-full text-left p-4 rounded-xl transition-all duration-300 disabled:cursor-default"
                    style={{ background: bg, border: `1px solid ${border}`, color }}
                  >
                    <span className="font-bold mr-3">{String.fromCharCode(65 + idx)}.</span> {option}
                    {answered !== null && idx === q.correct && <span className="ml-3">✅</span>}
                    {answered === idx && idx !== q.correct && <span className="ml-3">❌</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {answered !== null && (
            <div className="flex justify-between items-center">
              <p className="text-sm" style={{ color: answered === q.correct ? '#4ade80' : '#f87171' }}>
                {answered === q.correct ? '✅ Правильно!' : '❌ Неправильно'}
              </p>
              <button onClick={handleNextQuestion} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '14px' }}>
                {currentQuestion + 1 >= questions.length ? 'Результат →' : 'Наступне →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== STATS TAB =====
  if (activeTab === 'stats') {
    return (
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>📊 Ваша статистика</h2>
        </div>
        {loading ? (
          <div className="p-16 text-center rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
            <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
            <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
          </div>
        ) : userStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Всього спроб', value: userStats.totalAttempts || 0, icon: '🎯', color: '#c9a227' },
              { label: 'Завершено', value: userStats.completedAttempts || 0, icon: '✅', color: '#22c55e' },
              { label: 'Середній бал', value: `${userStats.averageScore || 0}%`, icon: '📈', color: '#3b82f6' },
              { label: 'Час навчання', value: `${Math.round((userStats.totalTimeSpent || 0) / 60)} хв`, icon: '⏱', color: '#f59e0b' },
            ].map((stat, i) => (
              <div key={i} className="glass-card p-6 animate-scale-in" style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{stat.icon}</span>
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{stat.label}</p>
                    <p className="text-3xl font-heading font-black" style={{ color: stat.color, fontSize: '28px', lineHeight: '1.1' }}>{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Статистики немає</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Пройдіть хоча б один симулятор</p>
          </div>
        )}
      </div>
    );
  }

  // ===== BROWSE TAB =====
  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
              🎮 Бойові Симулятори
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
              Інтерактивні сценарії, вікторини та завдання для розвитку навичок
            </p>
          </div>
          {(user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin') && (
            <button onClick={() => navigate('/simulator-admin')} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>⚙️ Управління</button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-3 rounded-2xl mb-8 animate-fade-in-up" style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); }}
              className="btn" style={{
                background: activeTab === tab.id ? 'var(--gradient-gold)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                padding: '10px 18px', fontSize: '13px',
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-5 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 rounded-2xl mb-8 animate-fade-in-up" style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.15s', animationFillMode: 'both' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--ab3-gold)', fontSize: '13px', letterSpacing: '0.5px' }}>Фільтри</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedType('')} className="btn" style={{
            background: !selectedType ? 'var(--gradient-gold)' : 'transparent',
            color: !selectedType ? 'var(--ab3-black)' : 'var(--text-muted)',
            border: `1px solid ${!selectedType ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
            padding: '8px 14px', fontSize: '12px',
          }}>Усі типи</button>
          {Object.entries(typeLabels).map(([key, label]) => (
            <button key={key} onClick={() => setSelectedType(key)} className="btn" style={{
              background: selectedType === key ? 'var(--gradient-gold)' : 'transparent',
              color: selectedType === key ? 'var(--ab3-black)' : 'var(--text-muted)',
              border: `1px solid ${selectedType === key ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
              padding: '8px 14px', fontSize: '12px',
            }}>{label}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(difficultyConfig).map(([key, cfg]) => (
            <button key={key} onClick={() => setSelectedDifficulty(selectedDifficulty === key ? '' : key)} className="btn" style={{
              background: selectedDifficulty === key ? cfg.color : 'transparent',
              color: selectedDifficulty === key ? 'white' : cfg.color,
              border: `1px solid ${selectedDifficulty === key ? cfg.color : `${cfg.color}40`}`,
              padding: '8px 14px', fontSize: '12px',
            }}>{cfg.label}</button>
          ))}
        </div>
      </div>

      {/* Simulators Grid */}
      {loading ? (
        <div className="p-16 text-center rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
          <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
        </div>
      ) : simulators.length === 0 ? (
        <div className="p-16 text-center rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Симуляторів не знайдено</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Спробуйте змінити фільтри</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {simulators.map((sim, index) => {
            const diff = difficultyConfig[sim.difficulty] || { label: sim.difficulty, color: '#6b7280' };
            return (
              <div key={sim.id} className="military-card p-6 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-gold">{typeLabels[sim.type] || sim.type}</span>
                  <span className="badge" style={{ background: `${diff.color}20`, color: diff.color, border: `1px solid ${diff.color}40`, fontSize: '11px' }}>{diff.label}</span>
                </div>
                <h3 className="text-lg font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>{sim.title}</h3>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{sim.description}</p>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
                    <p className="text-lg font-bold" style={{ color: '#fbbf24', fontSize: '16px' }}>⏱ {sim.estimatedMinutes}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>хвилин</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
                    <p className="text-lg font-bold" style={{ color: '#4ade80', fontSize: '16px' }}>{sim.averageScore}%</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>сер. бал</p>
                  </div>
                  <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-glass)' }}>
                    <p className="text-lg font-bold" style={{ color: '#60a5fa', fontSize: '16px' }}>{sim.completionCount}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>пройдено</p>
                  </div>
                </div>
                <button onClick={() => handleStartSimulator(sim)} className="btn btn-primary w-full" style={{ padding: '12px 18px', fontSize: '13px' }}>▶️ Розпочати</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
