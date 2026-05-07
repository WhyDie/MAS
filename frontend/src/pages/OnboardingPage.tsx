import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/index';
import { api } from '@services/api';

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  options: { value: string; label: string; icon: string }[];
}

interface ActionTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  buttonText: string;
}

const ONBOARDING_QUESTIONS: Question[] = [
  {
    id: 'experience',
    title: 'Який ваш попередній військовий досвід?',
    options: [
      { value: 'none', label: 'Без досвіду (Цивільний)', icon: '👔' },
      { value: 'basic', label: 'Пройшов БЗВП (Базову підготовку)', icon: '🔰' },
      { value: 'combat', label: 'Є реальний бойовий досвід', icon: '⚔️' }
    ]
  },
  {
    id: 'role',
    title: 'Яка ваша військова спеціальність (або планована)?',
    options: [
      { value: 'infantry', label: 'Піхота / Штурмовик', icon: '🎯' },
      { value: 'medic', label: 'Бойовий медик', icon: '🏥' },
      { value: 'drone', label: 'Оператор БПЛА', icon: '🚁' },
      { value: 'support', label: 'Забезпечення / Логістика', icon: '📦' },
      { value: 'other', label: 'Інше / Ще не визначено', icon: '❓' }
    ]
  },
  {
    id: 'skills_med',
    title: 'Як ви оцінюєте свої навички з Тактичної медицини (TCCC/MARCH)?',
    options: [
      { value: 'low', label: 'Потребую навчання з нуля', icon: '🔴' },
      { value: 'medium', label: 'Знаю базу, потрібна практика', icon: '🟡' },
      { value: 'high', label: 'Впевнено володію алгоритмами', icon: '🟢' }
    ]
  },
  {
    id: 'skills_weapon',
    title: 'Як ви оцінюєте свої навички поводження зі зброєю?',
    options: [
      { value: 'low', label: 'Мало досвіду, невпевнено', icon: '🔴' },
      { value: 'medium', label: 'Базові навички (розбирання, стрільба)', icon: '🟡' },
      { value: 'high', label: 'Досвідчений стрілець', icon: '🟢' }
    ]
  },
  {
    id: 'concerns',
    title: 'Що вас найбільше турбує на даному етапі служби?',
    subtitle: '(Оберіть ваш головний пріоритет)',
    options: [
      { value: 'gear', label: 'Екіпірування та речове забезпечення', icon: '🪖' },
      { value: 'stress', label: 'Психологічне навантаження та стрес', icon: '🧠' },
      { value: 'rules', label: 'Бюрократія, статути, написання рапортів', icon: '📄' },
      { value: 'team', label: 'Влиття в новий колектив, відносини', icon: '🤝' }
    ]
  }
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<ActionTask[]>([]);

  const handleSelectOption = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    
    // Автоматичний перехід до наступного питання із затримкою для плавності
    setTimeout(() => {
      if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        processResults();
      }
    }, 400);
  };

  const processResults = () => {
    setIsGenerating(true);
    
    // Аналіз відповідей та генерація плану
    setTimeout(() => {
      const plan: ActionTask[] = [];
      
      // Базове завдання для всіх
      plan.push({
        id: 'guide',
        title: 'Вивчити інфраструктуру підрозділу',
        description: 'Ознайомтеся з довідником частини, щоб знати, де знаходяться ключові обʼєкти та командування.',
        icon: '🏢',
        path: '/unit-guide',
        buttonText: 'Відкрити довідник'
      });

      // Медицина
      if (answers.skills_med === 'low' || answers.skills_med === 'medium') {
        plan.push({
          id: 'med_training',
          title: 'Пройти курс Тактичної Медицини',
          description: 'Ваші навички з такмеду потребують покращення. Вивчіть алгоритм MARCH, це рятує життя.',
          icon: '🏥',
          path: '/training',
          buttonText: 'Почати навчання'
        });
      }

      // Зброя
      if (answers.skills_weapon === 'low') {
        plan.push({
          id: 'wpn_training',
          title: 'Основи вогневої підготовки',
          description: 'Ознайомтеся з правилами безпеки (ТБ) та інструкціями поводження зі штатною зброєю.',
          icon: '🔫',
          path: '/training',
          buttonText: 'Перейти до модулів'
        });
      }

      // Досвід та колектив
      if (answers.experience === 'none' || answers.concerns === 'team') {
        plan.push({
          id: 'mentor',
          title: 'Запит на Наставництво',
          description: 'Оскільки ви тільки адаптуєтесь, рекомендуємо знайти досвідченого ментора у вашому підрозділі.',
          icon: '🤝',
          path: '/mentorship',
          buttonText: 'Знайти ментора'
        });
      }

      // Побоювання: Екіпірування
      if (answers.concerns === 'gear') {
        plan.push({
          id: 'gear',
          title: 'Перевірити екіпірування',
          description: 'Перегляньте базові списки спорядження та дізнайтеся, що видає держава, а що потрібно докупити.',
          icon: '🪖',
          path: '/equipment',
          buttonText: 'Моє екіпірування'
        });
      }

      // Побоювання: Бюрократія
      if (answers.concerns === 'rules') {
        plan.push({
          id: 'reports',
          title: 'Ознайомитись з документацією',
          description: 'Тут ви знайдете автоматизовані шаблони для написання рапортів на відпустку, лікування та інші потреби.',
          icon: '📄',
          path: '/reports',
          buttonText: 'Генератор рапортів'
        });
      }

      // Побоювання: Стрес
      if (answers.concerns === 'stress') {
        plan.push({
          id: 'psy',
          title: 'Психологічна безпека',
          description: 'Не тримайте все в собі. Ознайомтеся з матеріалами щодо бойового стресу або зверніться до спеціаліста (це анонімно).',
          icon: '🧠',
          path: '/psychological-support',
          buttonText: 'Перейти до підтримки'
        });
      }

      setGeneratedPlan(plan);
      setIsGenerating(false);
      
      // Відправляємо сигнал на бекенд (опціонально), що користувач пройшов онбординг
      api.put('/users/profile-extended', { onboardingCompleted: true }).catch(() => {});
      
    }, 2500); // 2.5 секунди анімації "Генерації"
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-[#333] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[var(--ab3-gold)] border-r-[var(--ab3-gold)] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚙️</div>
        </div>
        <h2 className="text-2xl font-heading font-black uppercase tracking-widest mb-4 text-[var(--ab3-gold)] glitch-hover">
          АНАЛІЗ ПРОФІЛЮ...
        </h2>
        <p className="font-mono text-sm text-gray-500 uppercase tracking-widest text-center max-w-md">
          Обробка ввідних даних...<br/>
          Формування індивідуального плану адаптації...<br/>
          Підбір навчальних матеріалів...
        </p>
      </div>
    );
  }

  if (generatedPlan.length > 0) {
    return (
      <div className="animate-fade-in-up max-w-4xl mx-auto pb-12">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl md:text-4xl font-heading font-black uppercase tracking-widest mb-4 text-white">
            ВАШ ПЛАН АДАПТАЦІЇ
          </h1>
          <p className="text-lg text-gray-400">
            Згідно з вашим досвідом та пріоритетами, ми сформували для вас список першочергових дій.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {generatedPlan.map((task, idx) => (
            <div key={task.id} className="p-6 bg-[#0a0a0a] border border-[#333] hover:border-[var(--ab3-gold)] transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-6 animate-fade-in-up" style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}>
              <div className="w-16 h-16 rounded-none bg-[#111] border border-[#222] flex items-center justify-center text-3xl flex-shrink-0">
                {task.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{task.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{task.description}</p>
              </div>
              <button onClick={() => navigate(task.path)} className="btn btn-primary w-full sm:w-auto flex-shrink-0 whitespace-nowrap uppercase tracking-widest text-xs font-bold px-6 py-3">
                {task.buttonText} →
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button onClick={() => navigate('/')} className="text-sm font-mono text-gray-500 hover:text-white uppercase tracking-widest underline underline-offset-4 transition-colors">
            Завершити онбординг та перейти на Головну
          </button>
        </div>
      </div>
    );
  }

  const question = ONBOARDING_QUESTIONS[currentStep];
  const progress = ((currentStep) / ONBOARDING_QUESTIONS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto pt-8 animate-fade-in-up">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex justify-between items-end mb-3">
          <span className="text-xs font-mono uppercase tracking-widest text-gray-500">Крок {currentStep + 1} з {ONBOARDING_QUESTIONS.length}</span>
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--ab3-gold)]">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 w-full bg-[#111] relative overflow-hidden">
          <div className="absolute top-0 left-0 h-full bg-[var(--ab3-gold)] transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-8 md:p-10 bg-[#0a0a0a] border border-[#333] shadow-2xl relative min-h-[400px] flex flex-col justify-center">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-heading font-black text-white leading-tight mb-2">{question.title}</h2>
          {question.subtitle && <p className="text-gray-500 font-mono text-sm">{question.subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelectOption(question.id, opt.value)}
              className={`p-5 text-left bg-[#111] border transition-all duration-200 flex items-center gap-4 group ${answers[question.id] === opt.value ? 'border-[var(--ab3-gold)] shadow-[0_0_15px_rgba(201,162,39,0.2)]' : 'border-[#222] hover:border-gray-500'}`}
            >
              <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{opt.icon}</span>
              <span className={`text-lg font-bold ${answers[question.id] === opt.value ? 'text-[var(--ab3-gold)]' : 'text-gray-300 group-hover:text-white'}`}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};