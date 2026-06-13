import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingService } from '@services/api';

interface QuestionOption {
  value: string;
  label: string;
  icon: string;
}

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  options: QuestionOption[];
}

interface Trajectory {
  trajectory: string[];
  estimatedDuration: number;
  difficulty: string;
  roadmap: {
    week: number;
    title: string;
    modules: string[];
    goals: string[];
    milestones: string[];
  }[];
  personalRecommendations: string[];
}

interface OnboardingStatus {
  isCompleted: boolean;
  progress?: {
    week: number;
    completedModules: number;
    totalModules: number;
    score: number;
  };
  trajectory?: Trajectory;
  profileAnswers?: Record<string, any>;
}

const STORAGE_KEY = 'onboardingState';

const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: 'experience',
    title: 'Який ваш попередній військовий досвід?',
    subtitle: 'Це допоможе персоналізувати перший план адаптації.',
    options: [
      { value: 'none', label: 'Без досвіду (Цивільний)', icon: '👔' },
      { value: 'conscript', label: 'Призовник / строкова служба', icon: '🪖' },
      { value: 'contract', label: 'Контрактник', icon: '🔰' },
      { value: 'officer', label: 'Офіцер / професіонал', icon: '🎖️' }
    ]
  },
  {
    id: 'education',
    title: 'Яка у вас освіта або попередня підготовка?',
    options: [
      { value: 'school', label: 'Загальна середня', icon: '🎓' },
      { value: 'vocational', label: 'Професійне училище', icon: '🏫' },
      { value: 'university', label: 'Вища освіта', icon: '🏛️' },
      { value: 'other', label: 'Інше / спеціальна підготовка', icon: '🧩' }
    ]
  },
  {
    id: 'specialization',
    title: 'Яка ваша роль або спеціальність?',
    options: [
      { value: 'піхота', label: 'Піхота / Штурмова група', icon: '🎯' },
      { value: 'медик', label: 'Бойовий медик', icon: '🏥' },
      { value: 'дрон', label: 'Оператор БПЛА', icon: '🚁' },
      { value: 'технік', label: 'Техніка / Логістика', icon: '🔧' },
      { value: 'зв’язківець', label: 'Зв’язок / Розвідка', icon: '📡' },
      { value: 'інше', label: 'Інше / ще не визначено', icon: '❓' }
    ]
  },
  {
    id: 'physicalFitness',
    title: 'Як би ви оцінили вашу фізичну форму?',
    subtitle: '1 = початківець, 5 = дуже добре.',
    options: [
      { value: '1', label: '1 — потребує часу', icon: '🐢' },
      { value: '2', label: '2 — є резерв', icon: '🏃' },
      { value: '3', label: '3 — середній рівень', icon: '⚡' },
      { value: '4', label: '4 — хороша форма', icon: '🏋️' },
      { value: '5', label: '5 — готовий до складних задач', icon: '💥' }
    ]
  },
  {
    id: 'concerns',
    title: 'Що для вас зараз найважливіше?',
    subtitle: 'Оберіть основну причину, чому ви тут.',
    options: [
      { value: 'Військова медицина', label: 'Тактична медицина', icon: '🏥' },
      { value: 'Спеціальна фізична підготовка', label: 'Фізична підготовка', icon: '💪' },
      { value: 'Мінна безпека', label: 'Мінна безпека', icon: '🧨' },
      { value: 'Виживання в крайніх умовах', label: 'Виживання', icon: '🌲' },
      { value: 'Психологічна підготовка', label: 'Психологічна стійкість', icon: '🧠' }
    ]
  },
  {
    id: 'skills',
    title: 'Які з навичок ви хочете розвинути перш за все?',
    options: [
      { value: 'Військова медицина', label: 'Медицина', icon: '🏥' },
      { value: 'Зброя', label: 'Зброя', icon: '🔫' },
      { value: 'Комунікація', label: 'Комунікація', icon: '📡' },
      { value: 'Лідерство', label: 'Лідерство', icon: '🤝' },
      { value: 'Виживання', label: 'Виживання', icon: '🪵' }
    ]
  },
  {
    id: 'preferredLearning',
    title: 'Як вам краще засвоюється інформація?',
    options: [
      { value: 'visual', label: 'Відео / інфографіка', icon: '🎬' },
      { value: 'audio', label: 'Аудіо / інструкції', icon: '🎧' },
      { value: 'practical', label: 'Практика / симуляції', icon: '🔨' },
      { value: 'mixed', label: 'Комбінація форматів', icon: '🧩' }
    ]
  },
  {
    id: 'mentorPreference',
    title: 'Чи хотіли б ви отримати наставника?',
    options: [
      { value: 'yes', label: 'Так, наставник потрібен', icon: '🤝' },
      { value: 'no', label: 'Поки що хочу самостійно', icon: '🚶' }
    ]
  },
  {
    id: 'nightShiftExperience',
    title: 'Чи маєте досвід нічних змін?',
    options: [
      { value: 'yes', label: 'Так, був/була на нічних постах', icon: '🌙' },
      { value: 'no', label: 'Ні, ще не працював/ла вночі', icon: '☀️' }
    ]
  }
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedTrajectory, setGeneratedTrajectory] = useState<Trajectory | null>(null);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showFullRoadmap, setShowFullRoadmap] = useState(false);

  useEffect(() => {
    loadSavedState();
    fetchOnboardingStatus();
  }, []);

  useEffect(() => {
    persistState();
  }, [currentStep, answers, generatedTrajectory]);

  const loadSavedState = () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        currentStep?: number;
        answers?: Record<string, string>;
        generatedTrajectory?: Trajectory;
      };
      if (parsed.answers) setAnswers(parsed.answers);
      if (typeof parsed.currentStep === 'number') setCurrentStep(Math.min(Math.max(0, parsed.currentStep), ONBOARDING_QUESTIONS.length - 1));
      if (parsed.generatedTrajectory) {
        let traj = parsed.generatedTrajectory;
        if (typeof traj === 'string') { try { traj = JSON.parse(traj); } catch(e){} }
        setGeneratedTrajectory(traj);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const persistState = () => {
    const payload = {
      currentStep,
      answers,
      generatedTrajectory
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const clearSavedState = () => {
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const fetchOnboardingStatus = async () => {
    try {
      const response = await onboardingService.getStatus();
      let payload = response.data?.data;
      if (payload) {
        if (typeof payload.trajectory === 'string') { try { payload.trajectory = JSON.parse(payload.trajectory); } catch(e) {} }
        if (typeof payload.generatedTrajectory === 'string') { try { payload.generatedTrajectory = JSON.parse(payload.generatedTrajectory); } catch(e) {} }
        if (typeof payload.progress === 'string') { try { payload.progress = JSON.parse(payload.progress); } catch(e) {} }
        if (typeof payload.profileAnswers === 'string') { try { payload.profileAnswers = JSON.parse(payload.profileAnswers); } catch(e) {} }
        setStatus(payload);
      }
    } catch (error) {
      console.warn('Failed to load onboarding status', error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapProfileAnswers = () => ({
    militaryExperience: answers.experience || 'none',
    education: answers.education || 'Не вказано',
    specialization: answers.specialization || 'інше',
    physicalFitness: Number(answers.physicalFitness || '3'),
    concerns: answers.concerns ? [answers.concerns] : [],
    skills: answers.skills ? [answers.skills] : [],
    preferredLearning: (answers.preferredLearning as 'visual' | 'audio' | 'practical' | 'mixed') || 'mixed',
    mentorPreference: answers.mentorPreference === 'yes',
    nightShiftExperience: answers.nightShiftExperience === 'yes'
  });

  const handleOption = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setMessage(null);
  };

  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const goNext = () => {
    const question = ONBOARDING_QUESTIONS[currentStep];
    if (!answers[question.id]) {
      setMessage('Оберіть варіант, щоб продовжити.');
      return;
    }

    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    submitAnswers();
  };

  const submitAnswers = async () => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const profileAnswers = mapProfileAnswers();
      const response = await onboardingService.generateTrajectory(profileAnswers);
      let trajectory = response.data?.data;
      if (typeof trajectory === 'string') { try { trajectory = JSON.parse(trajectory); } catch(e) {} }
      if (!trajectory) {
        throw new Error('Не вдалося отримати план адаптації');
      }
      setGeneratedTrajectory(trajectory);
    } catch (error) {
      console.error(error);
      setMessage('Сталася помилка при створенні плану. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeOnboarding = async () => {
    if (!generatedTrajectory) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const profileAnswers = mapProfileAnswers();
      await onboardingService.completeOnboarding(profileAnswers, generatedTrajectory);
      setStatus({
        isCompleted: true,
        trajectory: generatedTrajectory,
        profileAnswers,
        progress: {
          week: 1,
          completedModules: 0,
          totalModules: 0,
          score: 0
        }
      });
      clearSavedState();
    } catch (error) {
      console.error(error);
      setMessage('Не вдалося зберегти онбординг. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const restartOnboarding = () => {
    clearSavedState();
    setAnswers({});
    setCurrentStep(0);
    setGeneratedTrajectory(null);
    setStatus(null);
    setMessage(null);
  };

  const formatDifficulty = (diff: string) => {
    if (!diff) return '';
    const lowerDiff = diff.toLowerCase();
    if (lowerDiff === 'easy' || lowerDiff === 'легко' || lowerDiff === 'beginner') return 'Легкий';
    if (lowerDiff === 'medium' || lowerDiff === 'нормально' || lowerDiff === 'normal' || lowerDiff === 'intermediate') return 'Середній';
    if (lowerDiff === 'hard' || lowerDiff === 'складно' || lowerDiff === 'advanced') return 'Складний';
    if (lowerDiff === 'extreme') return 'Екстремальний';
    return diff;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4" />
          <p className="text-gray-400 uppercase tracking-widest text-xs">Завантаження даних онбордингу...</p>
        </div>
      </div>
    );
  }

  if (status?.isCompleted && !generatedTrajectory) {
    return (
      <div className="max-w-4xl mx-auto py-10 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl md:text-4xl font-heading font-black uppercase tracking-widest mb-3 text-white">
            Онбординг завершено
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Ви вже сформували свій адаптаційний план і можете повертатися сюди для перегляду рекомендацій або почати виконання завдань негайно.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="p-6 bg-[#111] border border-[#333] rounded-lg">
            <h2 className="text-lg font-bold text-white mb-3">Прогрес</h2>
            <p className="text-sm text-gray-400">Тиждень: {status.progress?.week || 1} / 4</p>
            <p className="text-sm text-gray-400">Модулі завершено: {status.progress?.completedModules || 0} / {status.progress?.totalModules || 0}</p>
            <p className="text-sm text-gray-400">Оцінка: {status.progress?.score || 0}%</p>
          </div>
          <div className="p-6 bg-[#111] border border-[#333] rounded-lg">
            <h2 className="text-lg font-bold text-white mb-3">Ваш план</h2>
            <p className="text-sm text-gray-400">Переглянути рекомендації, модулі та трек адаптації.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <button onClick={() => navigate('/training')} className="btn btn-primary uppercase tracking-widest text-xs font-bold px-6 py-3">
            Почати навчання
          </button>
          <button onClick={() => navigate('/mentorship')} className="btn btn-secondary uppercase tracking-widest text-xs font-bold px-6 py-3">
            Знайти ментора
          </button>
          <button onClick={() => { setGeneratedTrajectory((status.trajectory || (status as any).generatedTrajectory) as any); setShowFullRoadmap(true); }} className="btn btn-outline uppercase tracking-widest text-xs font-bold px-6 py-3">
            Переглянути план
          </button>
          <button onClick={restartOnboarding} className="btn btn-outline uppercase tracking-widest text-xs font-bold px-6 py-3">
            Перезапустити онбординг
          </button>
        </div>
      </div>
    );
  }

  if (generatedTrajectory) {
    const trajectoryList = Array.isArray(generatedTrajectory.trajectory) ? generatedTrajectory.trajectory : [];
    const roadmapList = Array.isArray(generatedTrajectory.roadmap) ? generatedTrajectory.roadmap : [];
    const recommendationsList = Array.isArray(generatedTrajectory.personalRecommendations) ? generatedTrajectory.personalRecommendations : [];

    return (
      <div className="max-w-5xl mx-auto pb-12 animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl md:text-4xl font-heading font-black uppercase tracking-widest mb-4 text-white">
            Ваш персональний план адаптації
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Цей план побудовано на ваших відповідах. Виконуйте крок за кроком і повертайтеся сюди, щоб оновлювати прогрес.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 mb-8">
          <div className="p-6 bg-[#111] border border-[#333] rounded-xl">
            <h2 className="text-sm uppercase tracking-widest text-[var(--ab3-gold)] mb-3">Мета</h2>
            <p className="text-white font-bold text-xl">{generatedTrajectory.estimatedDuration || 0} днів</p>
            <p className="text-gray-400 text-sm mt-2">Орієнтовний час для адаптації.</p>
          </div>
          <div className="p-6 bg-[#111] border border-[#333] rounded-xl">
            <h2 className="text-sm uppercase tracking-widest text-[var(--ab3-gold)] mb-3">Рівень</h2>
            <p className="text-white font-bold text-xl capitalize">{formatDifficulty(generatedTrajectory.difficulty || '')}</p>
            <p className="text-gray-400 text-sm mt-2">Складність першого етапу.</p>
          </div>
          <div className="p-6 bg-[#111] border border-[#333] rounded-xl">
            <h2 className="text-sm uppercase tracking-widest text-[var(--ab3-gold)] mb-3">Модулів</h2>
            <p className="text-white font-bold text-xl">{trajectoryList.length}</p>
            <p className="text-gray-400 text-sm mt-2">Короткий перелік рекомендованих модулів.</p>
          </div>
        </div>

          <div className="grid gap-4 lg:grid-cols-2 mb-8">
          <div className="p-6 bg-[#111] border border-[#333] rounded-xl">
            <h2 className="text-lg font-bold text-white mb-4">Перші кроки</h2>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-400">Огляд перших тижнів</div>
              <button
                onClick={() => setShowFullRoadmap(prev => !prev)}
                className="text-xs text-[var(--ab3-gold)] uppercase tracking-widest font-semibold"
              >
                {showFullRoadmap ? 'Сховати повний план' : 'Переглянути повний план'}
              </button>
            </div>
            <div className="space-y-4">
              {(
                showFullRoadmap ? roadmapList : roadmapList.slice(0, 2)
              ).map((week, wIdx) => (
                <div key={week.week || wIdx} className="p-4 bg-[#0b0b0b] rounded-lg border border-[#222]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-[var(--ab3-gold)] uppercase tracking-widest">Тиждень {week.week || wIdx + 1}</span>
                    <span className="text-sm text-gray-400">{week.title || 'Етап'}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">Модулі:</p>
                  <ul className="list-disc list-inside text-sm text-gray-300 mb-2">
                    {(Array.isArray(week.modules) ? week.modules : []).map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500">Цілі: {(Array.isArray(week.goals) ? week.goals : []).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-[#111] border border-[#333] rounded-xl">
            <h2 className="text-lg font-bold text-white mb-4">Рекомендації</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              {recommendationsList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1 text-[var(--ab3-gold)]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-[#2b1212] border border-[#661111] text-sm text-pink-300">
            {message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={completeOnboarding}
            disabled={isSubmitting}
            className="btn btn-primary uppercase tracking-widest text-xs font-bold px-6 py-3 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Збереження...' : 'Зберегти та завершити'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/training')}
            className="btn btn-secondary uppercase tracking-widest text-xs font-bold px-6 py-3 w-full sm:w-auto"
          >
            Почати навчання
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-outline uppercase tracking-widest text-xs font-bold px-6 py-3 w-full sm:w-auto"
          >
            На головну
          </button>
        </div>
      </div>
    );
  }

  const question = ONBOARDING_QUESTIONS[currentStep] || ONBOARDING_QUESTIONS[0];
  if (!question) return null;

  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100;
  const selectedValue = answers[question.id] || '';

  return (
    <div className="max-w-3xl mx-auto pt-8 pb-12 animate-fade-in-up">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Персональний онбординг</p>
        <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">Почнімо вашу адаптацію</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">Відповідайте чесно — це дозволить сформувати найбільш корисний план. Ви можете повернутися на будь-якому кроці.</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-end mb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-gray-500">Крок {currentStep + 1} з {ONBOARDING_QUESTIONS.length}</span>
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--ab3-gold)]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-[#111] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--ab3-gold)] transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="p-8 md:p-10 bg-[#0a0a0a] border border-[#333] shadow-2xl rounded-3xl min-h-[520px] flex flex-col justify-between gap-8">
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-black text-white mb-3">{question.title}</h2>
            {question.subtitle && <p className="text-gray-500 font-mono text-sm">{question.subtitle}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {question.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleOption(question.id, option.value)}
                className={`p-5 bg-[#111] border transition duration-200 rounded-2xl text-left flex items-center gap-4 ${selectedValue === option.value ? 'border-[var(--ab3-gold)] shadow-[0_0_20px_rgba(201,162,39,0.18)]' : 'border-[#222] hover:border-gray-500'}`}
              >
                <span className="text-3xl">{option.icon}</span>
                <span className={`text-lg font-bold ${selectedValue === option.value ? 'text-[var(--ab3-gold)]' : 'text-gray-300'}`}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-pink-700 bg-[#2b1212] p-4 text-sm text-pink-200">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between items-center">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 0}
            className="btn btn-secondary w-full sm:w-auto uppercase tracking-widest text-xs font-bold px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Назад
          </button>

          <button
            type="button"
            onClick={goNext}
            disabled={!selectedValue || isSubmitting}
            className="btn btn-primary w-full sm:w-auto uppercase tracking-widest text-xs font-bold px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep < ONBOARDING_QUESTIONS.length - 1 ? 'Далі' : isSubmitting ? 'Створюємо план...' : 'Завершити'}
          </button>
        </div>
      </div>
    </div>
  );
};