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

// Стартовий сценарій (якщо адміністратор ще не створив власний)
const defaultScenarioFlow = {
  nodes: [
    {
      id: 'node_1',
      text: 'УВАГА: Ваш підрозділ потрапив під раптовий мінометний обстріл. Двоє бійців отримали поранення. Навколо пил та хаос. Ваші дії?',
      choices: [
        { text: 'Негайно кинутися під вогнем надавати допомогу пораненим', score: 0, nextNode: 'node_fail_1' },
        { text: 'Знайти укриття, доповісти командиру та наказати пораненим накласти собі турнікети', score: 20, nextNode: 'node_2' }
      ]
    },
    {
      id: 'node_fail_1',
      text: 'ФАТАЛЬНА ПОМИЛКА: Ви побігли під обстрілом і самі отримали осколкове поранення. Тепер медикам треба рятувати трьох. Ви стали тягарем для підрозділу.',
      choices: [{ text: 'Завершити симуляцію', score: 0, nextNode: '' }]
    },
    {
      id: 'node_2',
      text: 'ОЦІНКА СИТУАЦІЇ: Обстріл тимчасово припинився. Ви підбігли до поранених. Один має масивну кровотечу з ноги, інший контужений і кричить. Що робите спочатку?',
      choices: [
        { text: 'Допомагаю контуженому прийти до тями, щоб він замовк', score: 0, nextNode: 'node_fail_2' },
        { text: 'Накладаю турнікет бійцю з артеріальною кровотечею (MARCH)', score: 30, nextNode: 'node_win' }
      ]
    },
    {
      id: 'node_fail_2',
      text: 'ВТРАТА БОЙЦЯ: Поки ви заспокоювали контуженого, інший боєць втратив критичну кількість крові та загинув. Неправильно розставлені пріоритети.',
      choices: [{ text: 'Завершити симуляцію', score: 0, nextNode: '' }]
    },
    {
      id: 'node_win',
      text: 'МІСІЯ ВИКОНАНА: Кровотеча зупинена. Ви врятували життя побратиму, організували жовту зону і успішно передали його евакуаційній групі (MEDEVAC).',
      choices: [{ text: 'Завершити місію', score: 50, nextNode: '' }]
    }
  ]
};

// Базові питання для вікторин
const quizQuestions: Record<string, Array<{ question: string; options: string[]; correctAnswer: number }>> = {
  quiz: [
    { question: 'Який калібр автомата АК-74?', options: ['5.45 мм', '7.62 мм', '9 мм', '5.56 мм'], correctAnswer: 0 },
    { question: 'Максимальна дальність АК-74?', options: ['500 м', '1000 м', '3000 м', '100 м'], correctAnswer: 2 },
    { question: 'Скільки частин при неповному розбиранні АК-74?', options: ['3', '5', '7', '10'], correctAnswer: 1 },
  ],
  combat_drill: [
    { question: 'Що робити при вогневому контакті?', options: ['Відповісти вогнем, шукати укриття', 'Бігти вперед', 'Здатися', 'Кричати'], correctAnswer: 0 },
    { question: 'Дистанція для ефективного вогню з АК-74?', options: ['100-300 м', '50-100 м', '500-700 м', '1 км'], correctAnswer: 0 },
    { question: 'Як подати сигнал для евакуації?', options: ['Рація, дим, сигнал', 'Махати руками', 'Голосно кричати', 'Нічого не робити'], correctAnswer: 0 },
  ],
  survival: [
    { question: 'Як знайти воду в польових умовах?', options: ['Збір конденсату, копати', 'Пити з калюж', 'Чекати дощ', 'Нічого не пити'], correctAnswer: 0 },
    { question: 'Як розвести вогонь без сірників?', options: ['Кресало, лінза, тертя', 'Чекати', 'Неможливо', 'Дмухати'], correctAnswer: 0 },
    { question: 'Найкраще укриття в полі?', options: ['Окоп, природні заглиблення', 'Відкрите поле', 'Верхівка дерева', 'Під одиночним деревом'], correctAnswer: 0 },
  ],
  communication: [
    { question: 'Що таке позивний?', options: ['Умовне імʼя для радіопереговорів', 'Номер телефону', 'Адреса', 'Пароль'], correctAnswer: 0 },
    { question: 'Як повідомити координати?', options: ['За картою, GPS, азимут', 'Навмання', "По телефону", 'Не повідомляти'], correctAnswer: 0 },
    { question: 'Що робити при перешкодах?', options: ['Змінити частоту, скоротити передачу', 'Кричати голосніше', 'Вимкнути радіо', 'Чекати'], correctAnswer: 0 },
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
  const [questions, setQuestions] = useState<Array<{ question: string; options: string[]; correctAnswer: number }>>([]);
  
  // Advanced Mechanics States
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  const [scenarioNodes, setScenarioNodes] = useState<any[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);

  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'browse') fetchSimulators();
    else if (activeTab === 'stats') fetchUserStats();
  }, [activeTab, selectedType, selectedDifficulty]);

  const fetchSimulators = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '200' };
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
      const response = await api.get('/achievements/stats');
      setUserStats(response.data.data || response.data);
      setError('');
    } catch (err) {
      setError('Не вдалося завантажити статистику');
    } finally { setLoading(false); }
  };

  const handleStartSimulator = useCallback((simulator: TrainingSimulator) => {
    setCurrentSimulator(simulator);
    setScore(0);
    setAnswered(null);
    setIsComplete(false);
    setActiveTab('play');
    setError('');

    if (simulator.type === 'scenario') {
      let sFlow = simulator.scenarioFlow;
      if (sFlow === '[object Object]') sFlow = null;
      while (typeof sFlow === 'string') { try { sFlow = JSON.parse(sFlow); } catch(e) { break; } }
      if (!sFlow || !sFlow.nodes || sFlow.nodes.length === 0) sFlow = defaultScenarioFlow;
      setScenarioNodes(sFlow.nodes);
      setCurrentNodeId(sFlow.nodes[0].id);
    } else {
      let qContent = simulator.quizContent;
      if (qContent === '[object Object]') qContent = null;
      while (typeof qContent === 'string') { try { qContent = JSON.parse(qContent); } catch(e) { break; } }
      let simQuestions = (qContent && Array.isArray(qContent.questions) && qContent.questions.length > 0)
        ? qContent.questions : quizQuestions[simulator.type] || quizQuestions.quiz;
      
      setQuestions(simQuestions);
      setCurrentQuestion(0);
      
      // Init Special Mechanics
      if (simulator.type === 'combat_drill') setTimeLeft(10); // 10 секунд на постріл/рішення
      if (simulator.type === 'survival') setLives(3); // 3 життя на виживання
    }
  }, []);

  // Ефект таймера для Бойової підготовки
  useEffect(() => {
    if (activeTab === 'play' && currentSimulator?.type === 'combat_drill' && answered === null && !isComplete) {
      if (timeLeft === 0) {
        handleAnswer(-1); // -1 = Час вийшов (Автоматичний провал питання)
      } else if (timeLeft !== null && timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [timeLeft, activeTab, currentSimulator, answered, isComplete]);

  const saveResult = (finalScore: number, maxScore: number) => {
    if (currentSimulator) {
      api.post(`/training-simulators/${currentSimulator.id}/finish`, { score: finalScore, total: maxScore }).catch(() => {});
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (answered !== null) return;
    setAnswered(answerIndex);

    if (answerIndex === -1) {
      // Час вийшов у бойовій підготовці
      if (currentSimulator?.type === 'survival') setLives(l => Math.max(0, l - 1));
      return;
    }

    const isCorrect = answerIndex === questions[currentQuestion]?.correctAnswer;
    if (isCorrect) setScore(s => s + 1);
    else {
      // Якщо це виживання - віднімаємо життя
      if (currentSimulator?.type === 'survival') setLives(l => Math.max(0, l - 1));
    }
  };

  const handleScenarioChoice = (choice: any) => {
    const newScore = score + (choice.score || 0);
    setScore(newScore);
    if (choice.nextNode) {
      setCurrentNodeId(choice.nextNode);
    } else {
      setIsComplete(true);
      saveResult(newScore, 100); // Для сценаріїв передаємо накопичений бал
    }
  };

  const handleNextQuestion = () => {
    if (currentSimulator?.type === 'survival' && lives <= 0) {
      // Пермадез у виживанні
      setIsComplete(true);
      saveResult(score, questions.length);
      return;
    }

    if (currentQuestion + 1 >= questions.length) {
      setIsComplete(true);
      saveResult(score, questions.length);
    } else {
      setCurrentQuestion(q => q + 1);
      setAnswered(null);
      if (currentSimulator?.type === 'combat_drill') setTimeLeft(10); // Скидаємо таймер
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
      let pct = 0;
      let passed = false;
      
      if (currentSimulator.type === 'scenario') {
        pct = Math.min(100, score); // У сценаріях бали накопичуються
        passed = pct >= 50;
      } else if (currentSimulator.type === 'survival' && lives <= 0) {
        pct = Math.round((score / questions.length) * 100);
        passed = false; // Смерть = завжди провал
      } else {
        pct = Math.round((score / questions.length) * 100);
        passed = pct >= 60;
      }

      return (
        <div className="animate-fade-in-up">
          <div className="p-8 rounded-none text-center bg-[#0a0a0a] border border-[#333]">
            <div className="text-7xl mb-6">
              {currentSimulator.type === 'survival' && lives <= 0 ? '☠️' : passed ? '🎉' : '📚'}
            </div>
            <h2 className="text-3xl font-heading font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {currentSimulator.type === 'survival' && lives <= 0 ? 'ВИ НЕ ВИЖИЛИ' : passed ? 'Вітаємо!' : 'Спробуйте ще раз'}
            </h2>
            <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
              {currentSimulator.type === 'survival' && lives <= 0 ? 'Критична помилка призвела до фатальних наслідків.' : `Симулятор "${currentSimulator.title}" завершено`}
            </p>
            <div className="flex justify-center gap-8 mb-8">
              <div>
                <p className="text-5xl font-black" style={{ color: passed ? '#22c55e' : '#f59e0b' }}>{pct}%</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Результат</p>
              </div>
              {currentSimulator.type !== 'scenario' && (
                <div>
                  <p className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>{score}/{questions.length}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Правильних</p>
                </div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <button onClick={() => handleStartSimulator(currentSimulator)} className="btn btn-primary rounded-none uppercase tracking-widest font-bold" style={{ padding: '14px 28px', fontSize: '14px' }}>🔄 Пройти ще раз</button>
              <button onClick={handleBackToBrowse} className="btn rounded-none uppercase tracking-widest font-bold" style={{ background: '#111', border: '1px solid #333', color: 'var(--text-muted)', padding: '14px 28px', fontSize: '14px' }}>← До бібліотеки</button>
            </div>
          </div>
        </div>
      );
    }

    // --- РЕНДЕР СЦЕНАРІЮ ---
    if (currentSimulator.type === 'scenario') {
      const node = scenarioNodes.find(n => n.id === currentNodeId);
      if (!node) return null;

      return (
        <div className="animate-fade-in-up">
          <div className="mb-6">
            <button onClick={handleBackToBrowse} className="text-xs font-mono uppercase tracking-widest hover:text-white" style={{ color: 'var(--text-muted)' }}>← Перервати місію</button>
          </div>
          <div className="p-8 sm:p-12 rounded-none bg-[#0a0a0a] border border-[#333] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#222]">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="text-xl font-heading font-black uppercase tracking-widest text-[var(--ab3-gold)]">{currentSimulator.title}</h2>
                <p className="text-xs font-mono mt-1 text-gray-500">ПОТОЧНИЙ БАЛ: <span className="text-white">{score}</span></p>
              </div>
            </div>
            <div className="mb-10">
              <p className="text-lg md:text-xl font-medium text-white leading-relaxed" style={{ textShadow: '0 2px 10px rgba(255,255,255,0.1)' }}>
                {node.text}
              </p>
            </div>
            <div className="space-y-3">
              {node.choices.map((choice: any, idx: number) => (
                <button key={idx} onClick={() => handleScenarioChoice(choice)} className="w-full text-left p-5 rounded-none bg-[#111] border border-[#333] hover:border-[var(--ab3-gold)] hover:bg-[#1a1a1a] transition-all duration-300 group">
                  <span className="text-[var(--ab3-gold)] font-mono mr-3 opacity-50 group-hover:opacity-100">[{idx + 1}]</span>
                  <span className="text-gray-300 group-hover:text-white">{choice.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // --- РЕНДЕР ВІКТОРИНИ / БОЙОВОЇ ПІДГОТОВКИ / ВИЖИВАННЯ / КОМУНІКАЦІЇ ---
    const q = questions[currentQuestion];
    if (!q) return null;

    return (
      <div className="animate-fade-in-up">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <button onClick={handleBackToBrowse} className="text-xs font-mono uppercase tracking-widest hover:text-white" style={{ color: 'var(--text-muted)' }}>← НАЗАД</button>
            <span className="text-xs font-mono font-bold" style={{ color: 'var(--ab3-gold)' }}>{currentQuestion + 1}/{questions.length}</span>
          </div>
          <div className="w-full rounded-none h-2 bg-[#222]">
            <div className="h-full rounded-none transition-all duration-500" style={{ background: 'var(--ab3-gold)', width: `${((currentQuestion + 1) / questions.length) * 100}%` }} />
          </div>
        </div>

        {/* Спеціальні UI механіки */}
        <div className="flex justify-between items-end mb-4">
          <div className="flex gap-2">
            <span className="badge rounded-none font-mono uppercase tracking-widest bg-[#111] border border-[#333] text-gray-400">
              {typeLabels[currentSimulator.type]}
            </span>
          </div>
          
          {/* Механіка Виживання (Сердечка) */}
          {currentSimulator.type === 'survival' && (
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <span key={i} className="text-2xl drop-shadow-lg transition-all duration-500" style={{ filter: i >= lives ? 'grayscale(1) opacity(0.2)' : 'none', transform: i >= lives ? 'scale(0.8)' : 'scale(1)' }}>❤️</span>
              ))}
            </div>
          )}
        </div>

        <div className={`p-8 rounded-none bg-[#0a0a0a] border border-[#333] relative overflow-hidden ${currentSimulator.type === 'combat_drill' && timeLeft !== null && timeLeft <= 3 ? 'animate-pulse border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' : ''}`}>
          
          {/* Механіка Бойової підготовки (Таймер) */}
          {currentSimulator.type === 'combat_drill' && timeLeft !== null && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#222]">
              <div className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${(timeLeft / 10) * 100}%` }} />
            </div>
          )}

          <div className="mb-8">
            {/* Механіка Комунікації (Радіо перешкоди) */}
            {currentSimulator.type === 'communication' ? (
              <div className="p-4 bg-[#050505] border border-[#222] mb-6 relative">
                <div className="absolute top-1 left-2 text-[8px] text-green-500/50 font-mono animate-pulse">RADIO COMMS ESTABLISHED...</div>
                <p className="text-lg font-mono font-bold mt-2 text-green-400 uppercase tracking-wider" style={{ textShadow: '0 0 5px rgba(74, 222, 128, 0.5)' }}>
                  <span className="opacity-50 mr-2">RX&gt;</span> {q.question}
                </p>
              </div>
            ) : (
              <p className="text-lg md:text-xl font-bold mb-6 text-white leading-relaxed">{q.question}</p>
            )}

            <div className="space-y-3">
              {q.options.map((option, idx) => {
                let bg = '#111', border = '#333', color = 'var(--text-secondary)';
                if (answered !== null) {
                  if (idx === q.correctAnswer) { bg = 'rgba(34, 197, 94, 0.1)'; border = '#22c55e'; color = '#4ade80'; }
                  else if ((idx === answered || answered === -1) && idx !== q.correctAnswer) { bg = 'rgba(239, 68, 68, 0.1)'; border = '#ef4444'; color = '#f87171'; }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered !== null}
                    className={`w-full text-left p-4 rounded-none transition-all duration-300 ${answered === null ? 'hover:border-[var(--ab3-gold)] hover:bg-[#1a1a1a]' : 'disabled:cursor-default'}`}
                    style={{ background: bg, border: `1px solid ${border}`, color }}
                  >
                    <span className={`font-bold mr-3 ${currentSimulator.type === 'communication' ? 'text-green-500/50 font-mono' : ''}`}>[{String.fromCharCode(65 + idx)}]</span> 
                    <span className={currentSimulator.type === 'communication' ? 'font-mono uppercase text-green-400' : ''}>{option}</span>
                    {answered !== null && idx === q.correctAnswer && <span className="ml-3">✅</span>}
                    {(answered === idx || answered === -1) && idx !== q.correctAnswer && <span className="ml-3">❌</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {answered !== null && (
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: answered === q.correctAnswer ? '#4ade80' : '#f87171' }}>
                {answered === q.correctAnswer ? '✅ Правильно!' : answered === -1 ? '⏱ ЧАС ВИЙШОВ!' : '❌ Неправильно'}
              </p>
              <button onClick={handleNextQuestion} className="btn btn-primary rounded-none uppercase tracking-widest font-bold" style={{ padding: '12px 28px', fontSize: '14px' }}>
                {currentSimulator.type === 'survival' && lives <= 0 ? 'Результат →' : currentQuestion + 1 >= questions.length ? 'Результат →' : 'Наступне →'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== STATS TAB =====
  if (activeTab === 'stats') {
    const attempts = userStats?.simAttempts || 0;
    const perfect = userStats?.perfectSims || 0;
    const avgScore = userStats?.simAverageScore || 0;
    // Формула бойової готовності: 70% залежить від оцінок, 30% від кількості тренувань
    const readiness = Math.round((avgScore * 0.7) + (Math.min(attempts, 10) * 3));
    const circumference = 2 * Math.PI * 50; // для SVG кола
    const strokeDashoffset = circumference - (readiness / 100) * circumference;

    return (
      <div className="animate-fade-in-up">
        <div className="mb-8">
          <button onClick={handleBackToBrowse} className="mb-6 text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors">
            ← Повернутися до бібліотеки
          </button>
          <h2 className="text-xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>ОСОБИСТА ЕФЕКТИВНІСТЬ</h2>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">// АНАЛІЗ БОЙОВОЇ ПІДГОТОВКИ //</p>
        </div>
        {loading ? (
          <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
            <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
            <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
          </div>
        ) : userStats ? (
          <div className="space-y-6">
            {/* Головний індикатор */}
            <div className="p-8 rounded-none bg-[#0a0a0a] border border-[#333] relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <div className="absolute right-0 top-0 w-64 h-64 bg-[var(--ab3-gold)] opacity-5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="relative flex items-center justify-center w-40 h-40 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#222" strokeWidth="8" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={readiness >= 80 ? '#22c55e' : readiness >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" style={{ filter: `drop-shadow(0 0 8px ${readiness >= 80 ? '#22c55e' : readiness >= 50 ? '#f59e0b' : '#ef4444'})` }} />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black" style={{ color: readiness >= 80 ? '#22c55e' : readiness >= 50 ? '#f59e0b' : '#ef4444' }}>{readiness}%</span>
                    <span className="text-[8px] font-mono uppercase tracking-widest text-gray-400 mt-1">Готовність</span>
                  </div>
                </div>
                
                <div className="flex-1 w-full text-center md:text-left">
                  <h3 className="text-2xl font-heading font-black text-white uppercase tracking-widest mb-2">Бойовий потенціал</h3>
                  <p className="text-gray-400 leading-relaxed mb-4 text-sm">Оцінка базується на середньому балі успішності та кількості пройдених симуляцій. {readiness >= 80 ? 'Ви демонструєте відмінну підготовку та готові до виконання складних завдань.' : readiness >= 50 ? 'Ваші навички на середньому рівні. Рекомендуємо пройти більше тренувань.' : 'Критично низький рівень. Негайно розпочніть навчання.'}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <span className="px-3 py-1 bg-[#111] border border-[#333] text-xs font-mono text-gray-300">Місій: {attempts}</span>
                    <span className="px-3 py-1 bg-[#111] border border-[#333] text-xs font-mono text-gray-300">Точність: {avgScore}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Додаткові картки */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333] border-l-4 border-l-blue-500 hover:-translate-y-1 transition-transform"><div className="text-4xl mb-4 opacity-80">🎮</div><h4 className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-1">Проведено симуляцій</h4><p className="text-3xl font-black text-white">{attempts}</p></div>
              <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333] border-l-4 border-l-green-500 hover:-translate-y-1 transition-transform"><div className="text-4xl mb-4 opacity-80">🎯</div><h4 className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-1">Бездоганні місії (100%)</h4><p className="text-3xl font-black text-green-400">{perfect}</p></div>
              <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333] border-l-4 border-l-yellow-500 hover:-translate-y-1 transition-transform"><div className="text-4xl mb-4 opacity-80">📈</div><h4 className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-1">Середня успішність</h4><p className="text-3xl font-black text-yellow-400">{avgScore}%</p></div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <h3 className="text-xl font-heading font-bold mb-3 text-white">Немає бойового досвіду</h3>
            <p className="text-gray-500 text-sm">Пройдіть хоча б один симулятор, щоб розблокувати аналітику.</p>
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
            <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3 glitch-hover cursor-default transition-all duration-300" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
              БОЙОВІ СИМУЛЯТОРИ
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              // ІНТЕРАКТИВНІ СЦЕНАРІЇ ТА ЗАВДАННЯ //
            </p>
          </div>
          {(user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin') && (
            <button onClick={() => navigate('/simulator-admin')} className="btn btn-primary rounded-none uppercase tracking-widest font-bold" style={{ padding: '10px 20px', fontSize: '13px' }}>⚙️ Управління</button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-3 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); }}
              className="btn w-full flex items-center justify-center text-center rounded-none uppercase tracking-widest font-bold" style={{
                background: activeTab === tab.id ? 'var(--gradient-gold)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                padding: '10px 18px', fontSize: '13px',
              }}>
              <span className="mr-2">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
            <h3 className="font-mono text-xs font-bold mb-3 uppercase tracking-widest" style={{ color: 'var(--ab3-gold)' }}>[ ФІЛЬТРИ ]</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button onClick={() => setSelectedType('')} className="btn w-full flex items-center justify-center text-center rounded-none uppercase tracking-widest font-bold" style={{
                background: !selectedType ? 'var(--gradient-gold)' : 'transparent',
                color: !selectedType ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${!selectedType ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                padding: '8px 14px', fontSize: '12px',
              }}>Усі типи</button>
              {Object.entries(typeLabels).map(([key, label]) => (
                <button key={key} onClick={() => setSelectedType(key)} className="btn w-full flex items-center justify-center text-center rounded-none uppercase tracking-widest font-bold" style={{
                  background: selectedType === key ? 'var(--gradient-gold)' : 'transparent',
                  color: selectedType === key ? 'var(--ab3-black)' : 'var(--text-muted)',
                  border: `1px solid ${selectedType === key ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                  padding: '8px 14px', fontSize: '12px',
                }}>{label}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {Object.entries(difficultyConfig).map(([key, cfg]) => (
                <button key={key} onClick={() => setSelectedDifficulty(selectedDifficulty === key ? '' : key)} className="btn w-full flex items-center justify-center text-center rounded-none uppercase tracking-widest font-bold" style={{
                  background: selectedDifficulty === key ? cfg.color : 'transparent',
                  color: selectedDifficulty === key ? 'white' : cfg.color,
                  border: `1px solid ${selectedDifficulty === key ? cfg.color : `${cfg.color}40`}`,
                  padding: '8px 14px', fontSize: '12px',
                }}>{cfg.label}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
              <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
            </div>
          ) : simulators.length === 0 ? (
            <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Симуляторів не знайдено</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Спробуйте змінити фільтри</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {simulators.map((sim, index) => {
                const diff = difficultyConfig[sim.difficulty] || { label: sim.difficulty, color: '#6b7280' };
                return (
                  <div key={sim.id} className="military-card h-full flex flex-col rounded-none p-6 animate-fade-in-up bg-[#0a0a0a] border border-[#333] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--ab3-gold)]" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
                    <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="badge rounded-none font-mono uppercase tracking-widest bg-[#111] border border-[var(--ab3-gold)] text-[var(--ab3-gold)] text-[10px]">{typeLabels[sim.type] || sim.type}</span>
                        <span className="badge rounded-none font-mono uppercase tracking-widest" style={{ background: `${diff.color}15`, color: diff.color, border: `1px solid ${diff.color}`, fontSize: '10px' }}>{diff.label}</span>
                      </div>
                      <h3 className="text-lg font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>{sim.title}</h3>
                      <p className="font-mono text-xs mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{sim.description}</p>
                    </div>
                    <div className="mt-auto w-full grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-[#222]">
                      <div className="text-center p-2 rounded-none bg-[#111] border border-[#222]">
                        <p className="text-lg font-bold" style={{ color: '#fbbf24', fontSize: '16px' }}>⏱ {sim.estimatedMinutes}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>хвилин</p>
                      </div>
                      <div className="text-center p-2 rounded-none bg-[#111] border border-[#222]">
                        <p className="text-lg font-bold" style={{ color: '#4ade80', fontSize: '16px' }}>{sim.averageScore}%</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>сер. бал</p>
                      </div>
                      <div className="text-center p-2 rounded-none bg-[#111] border border-[#222]">
                        <p className="text-lg font-bold" style={{ color: '#60a5fa', fontSize: '16px' }}>{sim.completionCount}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>пройдено</p>
                      </div>
                    </div>
                    <button onClick={() => handleStartSimulator(sim)} className="mt-2 btn btn-primary rounded-none uppercase tracking-widest font-bold w-full" style={{ padding: '12px 18px', fontSize: '13px' }}>▶️ Розпочати</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
  );
};
