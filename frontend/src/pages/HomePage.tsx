import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/index';
import { api } from '@services/api';

// --- Компонент для плавної анімації при прогортанні ---
const ScrollReveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-[1000ms] ease-out transform ${isVisible ? 'opacity-100 translate-y-0 scale-100 filter-none' : 'opacity-0 translate-y-20 scale-95 blur-[4px]'}`} 
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const RadarAnimation = () => (
  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] opacity-30 pointer-events-none hidden lg:block overflow-hidden z-0">
    <div className="absolute inset-0 border border-[var(--ab3-gold)] rounded-full opacity-20"></div>
    <div className="absolute inset-12 border border-[var(--ab3-gold)] rounded-full opacity-30 border-dashed"></div>
    <div className="absolute inset-32 border border-[var(--ab3-gold)] rounded-full opacity-20"></div>
    <div className="absolute inset-48 border border-[var(--ab3-gold)] rounded-full opacity-40 border-dotted"></div>
    <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(201,162,39,0.25) 100%)', animation: 'spin 4s linear infinite' }}></div>
    <div className="absolute top-1/2 left-1/2 w-full h-[1px] bg-[var(--ab3-gold)] opacity-20 -translate-y-1/2"></div>
    <div className="absolute top-1/2 left-1/2 h-full w-[1px] bg-[var(--ab3-gold)] opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
    <div className="absolute top-[30%] left-[30%] w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_red] animate-ping"></div>
    <div className="absolute bottom-[40%] right-[25%] w-2 h-2 bg-green-500 rounded-full shadow-[0_0_15px_green] animate-pulse" style={{ animationDelay: '1s' }}></div>
  </div>
);

const COMBAT_RANKS = [
  { xp: 150000, title: 'Вальхалла (Вічність)', icon: '🌌', color: '#a855f7' },
  { xp: 100000, title: 'Абсолют (Бог Війни)', icon: '👑', color: '#a855f7' },
  { xp: 80000, title: 'Легенда (Ейнхерій)', icon: '⚡️', color: '#ef4444' },
  { xp: 60000, title: 'Напівбог', icon: '🌟', color: '#f59e0b' },
  { xp: 50000, title: 'Син Одіна', icon: '👁️', color: '#3b82f6' },
  { xp: 45000, title: 'Вісник Вальгалли', icon: '🦅', color: '#f59e0b' },
  { xp: 40000, title: 'Рунний Майстер', icon: '🪨', color: '#3b82f6' },
  { xp: 36000, title: 'Драконоборець', icon: '🐉', color: '#ef4444' },
  { xp: 32000, title: 'Титан', icon: '🌋', color: '#ef4444' },
  { xp: 28000, title: 'Колос', icon: '🗿', color: '#64748b' },
  { xp: 25000, title: 'Громовержець', icon: '🌩️', color: '#3b82f6' },
  { xp: 22000, title: 'Повелитель бур', icon: '🌪️', color: '#f59e0b' },
  { xp: 19000, title: 'Володар сталі', icon: '⚔️', color: '#94a3b8' },
  { xp: 16000, title: 'Конунг', icon: '👑', color: '#ef4444' },
  { xp: 14000, title: 'Ярл (Еліта)', icon: '🐺', color: '#f59e0b' },
  { xp: 12000, title: 'Лорд', icon: '🏰', color: '#3b82f6' },
  { xp: 10000, title: 'Мисливець на демонів', icon: '🔥', color: '#ef4444' },
  { xp: 9000, title: 'Вбивця орків', icon: '👹', color: '#22c55e' },
  { xp: 8000, title: 'Тінь', icon: '🥷', color: '#64748b' },
  { xp: 7000, title: 'Привид', icon: '👻', color: '#cbd5e1' },
  { xp: 6200, title: 'Месник', icon: '🗡️', color: '#ef4444' },
  { xp: 5500, title: 'Герой', icon: '🦸', color: '#f59e0b' },
  { xp: 4800, title: 'Отаман', icon: '🐎', color: '#ef4444' },
  { xp: 4200, title: 'Воєвода', icon: '🚩', color: '#3b82f6' },
  { xp: 3700, title: 'Сотник', icon: '💯', color: '#22c55e' },
  { xp: 3200, title: 'Спартанець', icon: '🛡️', color: '#ef4444' },
  { xp: 2800, title: 'Гладіатор', icon: '🏟️', color: '#f59e0b' },
  { xp: 2400, title: 'Паладин', icon: '✨', color: '#3b82f6' },
  { xp: 2100, title: 'Лицар', icon: '🏇', color: '#94a3b8' },
  { xp: 1800, title: 'Центуріон', icon: '🦅', color: '#ef4444' },
  { xp: 1500, title: 'Гвардієць', icon: '💂', color: '#3b82f6' },
  { xp: 1300, title: 'Ветеран', icon: '🎖️', color: '#f59e0b' },
  { xp: 1100, title: 'Захисник', icon: '🛡️', color: '#22c55e' },
  { xp: 950, title: 'Каратель', icon: '⛓️', color: '#ef4444' },
  { xp: 800, title: 'Руйнівник', icon: '💥', color: '#f59e0b' },
  { xp: 700, title: 'Берсерк (Штурмовик)', icon: '🪓', color: '#ef4444' },
  { xp: 600, title: 'Рейнджер', icon: '🌲', color: '#22c55e' },
  { xp: 500, title: 'Мисливець', icon: '🏹', color: '#f59e0b' },
  { xp: 420, title: 'Розвідник', icon: '🔭', color: '#3b82f6' },
  { xp: 350, title: 'Слідопит', icon: '🐾', color: '#22c55e' },
  { xp: 290, title: 'Воїн клану', icon: '🤝', color: '#f59e0b' },
  { xp: 240, title: 'Хірдман (Загартований)', icon: '🪓', color: '#3b82f6' },
  { xp: 190, title: 'Сокирник', icon: '🪓', color: '#94a3b8' },
  { xp: 150, title: 'Списник', icon: '🔱', color: '#64748b' },
  { xp: 110, title: 'Мечник', icon: '🗡️', color: '#cbd5e1' },
  { xp: 80, title: 'Щитоносець', icon: '🛡️', color: '#3b82f6' },
  { xp: 50, title: 'Стражник', icon: '👁️', color: '#22c55e' },
  { xp: 25, title: 'Ополченець', icon: '🌾', color: '#f59e0b' },
  { xp: 10, title: 'Рекрут', icon: '📝', color: '#94a3b8' },
  { xp: 0, title: 'Дренг (Необстріляний)', icon: '🔰', color: '#6b7280' },
];

const getRankInfo = (currentXp: number) => {
  for (let i = 0; i < COMBAT_RANKS.length; i++) {
    if (currentXp >= COMBAT_RANKS[i].xp) {
      const rank = COMBAT_RANKS[i];
      const nextRank = i > 0 ? COMBAT_RANKS[i - 1] : null;
      let progress = 100;
      let nextXp = null;

      if (nextRank) {
        const range = nextRank.xp - rank.xp;
        const earned = currentXp - rank.xp;
        progress = (earned / range) * 100;
        nextXp = nextRank.xp;
      }

      return { ...rank, next: nextXp, progress: Math.min(100, Math.max(0, progress)) };
    }
  }
  return { ...COMBAT_RANKS[COMBAT_RANKS.length - 1], next: 10, progress: 0 };
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [metrics, setMetrics] = useState({
    unread: 0,
    xp: 0,
    avgScore: 0,
    nextEvent: null as any,
    daysServed: 0,
    serviceStartDate: null as string | null,
    contractEndDate: null as string | null,
    weaponName: null as string | null,
    weaponNumber: null as string | null,
    fullName: '',
    unitName: null as string | null,
  });
  const [, setLoading] = useState(true);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);

  useEffect(() => {
    console.log("%c ТАКТИЧНУ СИСТЕМУ АКТИВОВАНО ", "background: #0a0a0a; color: #c9a227; font-size: 20px; font-weight: bold; border: 1px solid #c9a227;");
    console.log("%c Слава Україні! Якщо ти це читаєш — ти справжній кібер-боєць. ", "color: #4ade80; font-size: 14px;");

    const loadMetrics = async () => {
      try {
        const [notifRes, statRes, schedRes, tasksRes, extUserRes, unitRes] = await Promise.all([
          api.get('/notifications').catch(() => ({ data: { data: [] } })),
          api.get(`/achievements/stats?_t=${Date.now()}`).catch(() => ({ data: { data: { xp: 0, simAverageScore: 0 } } })),
          api.get(`/schedule/events?startDate=${new Date().toISOString().split('T')[0]}&endDate=${new Date(Date.now() + 86400000).toISOString().split('T')[0]}`).catch(() => ({ data: { data: [] } })),
          api.get('/units/my/active-duties').catch(() => ({ data: { data: [] } })),
          api.get('/users/me-extended').catch(() => ({ data: { data: null } })),
          api.get('/units/my').catch(() => ({ data: { data: null } }))
        ]);
        
        const notifs = notifRes.data?.data || notifRes.data || [];
        const unread = notifs.filter((n: any) => !n.isRead).length;
        
        const xp = statRes.data?.data?.xp || statRes.data?.xp || 0;
        const avgScore = statRes.data?.data?.simAverageScore || statRes.data?.simAverageScore || 0;
        
        const events = schedRes.data?.data || schedRes.data || [];
        const now = new Date();
        const upcoming = events.filter((e: any) => new Date(e.startTime) > now).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setActiveTasks(tasksRes.data?.data || []);
        const extUser = extUserRes.data?.data || user;
        
        setMetrics({ 
          unread, 
          xp, 
          avgScore, 
          nextEvent: upcoming[0] || null,
          daysServed: statRes.data?.data?.daysServed || 0,
          serviceStartDate: statRes.data?.data?.serviceStartDate || null,
          contractEndDate: statRes.data?.data?.contractEndDate || null,
          weaponName: extUser?.weaponName || null,
          weaponNumber: extUser?.weaponNumber || null,
          fullName: `${extUser?.lastName || ''} ${extUser?.firstName || ''} ${extUser?.middleName || ''}`.trim(),
          unitName: unitRes.data?.data?.name || null,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  const rank = getRankInfo(metrics.xp);

  // Розрахунок прогресу контракту
  let contractProgress = 0;
  let daysTotal = 0;
  if (metrics.serviceStartDate && metrics.contractEndDate) {
    const start = new Date(metrics.serviceStartDate).getTime();
    const end = new Date(metrics.contractEndDate).getTime();
    const now = new Date().getTime();
    
    if (end > start) {
      daysTotal = Math.floor((end - start) / (1000 * 60 * 60 * 24));
      const passed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      contractProgress = Math.min(100, Math.max(0, (passed / daysTotal) * 100));
    }
  }

  const modulesInfo = [
    {
      id: 'onboarding',
      title: 'Система Адаптації та Онбординг',
      sysName: 'SYS.MOD.ADAPT',
      desc: [
        'Розумний алгоритм введення новоприбулих бійців у посаду. Система починає з глибокого інтерактивного профілювання: аналізує ваш попередній досвід (від цивільного до бойового), військову спеціальність та поточні побоювання.',
        'На основі цих даних генерується індивідуальний покроковий план дій. Він виключає зайву інформацію та фокусує увагу лише на тому, що необхідно саме вам для швидкої, безпечної та ефективної інтеграції в підрозділ.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="3"/></svg>,
      path: '/onboarding',
      features: ['ДИНАМІЧНЕ ПРОФІЛЮВАННЯ', 'ІНДИВІДУАЛЬНА ТРАЄКТОРІЯ', 'ВЕРИФІКАЦІЯ НАВИЧОК', 'ВИЗНАЧЕННЯ ПРІОРИТЕТІВ'],
      specs: ['АЛГОРИТМ: АДАПТИВНИЙ', 'РЕЖИМ: ОФЛАЙН', 'БАЗА: ЗАСЕКРЕЧЕНО']
    },
    {
      id: 'guide',
      title: 'Довідник Частини',
      sysName: 'SYS.MOD.NAV',
      desc: [
        'Повна цифрова мапа вашого підрозділу в кишені. Більше не потрібно блукати в пошуках потрібного кабінету чи стройової частини. Модуль містить інтерактивну інфраструктуру: штаб, казарми, склади РАВ/речового забезпечення, медичний пункт та їдальню.',
        'Крім того, тут зібрано повний алгоритм дій по прибуттю (отримання зброї, постановка на забезпечення), а також прямі та захищені контакти ключового персоналу командування.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M3 21V7l9-4 9 4v14"/><path d="M9 21v-7h6v7"/><path d="M12 10h.01"/></svg>,
      path: '/unit-guide',
      features: ['ТОЧНІ ЛОКАЦІЇ ОБ\'ЄКТІВ', 'КОНТАКТИ КОМАНДУВАННЯ', 'АЛГОРИТМИ РЕЄСТРАЦІЇ', 'ОРГАНІЗАЦІЙНА СТРУКТУРА'],
      specs: ['НАВІГАЦІЯ: АКТИВНА', 'КАРТИ: ЗАВАНТАЖЕНО', 'ОНОВЛЕННЯ: АВТОМАТИЧНЕ']
    },
    {
      id: 'schedule',
      title: 'Розпорядок та Події',
      sysName: 'SYS.MOD.SYNC',
      desc: [
        'Живий бойовий розклад підрозділу. Централізоване управління розкладом, яке дозволяє штабу миттєво доводити зміни до всього особового складу.',
        'Ви завжди знатимете точний час шикувань, заступання в наряди, початку навчальних тривог чи прийомів їжі. Модуль інтегрований із системою Push-сповіщень, яка миттєво інформує про екстрені зміни графіку.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16h6M12 13v6"/></svg>,
      path: '/schedule',
      features: ['СИНХРОНІЗАЦІЯ ЗІ ШТАБОМ', 'БОЙОВІ ЧЕРГУВАННЯ', 'ДИНАМІЧНИЙ РОЗКЛАД', 'ЕКСТРЕНІ СПОВІЩЕННЯ'],
      specs: ['ТАЙМ-МЕНЕДЖМЕНТ: СТРОГИЙ', 'АЛЕРТИ: PUSH', 'СИНХРОНІЗАЦІЯ: REAL-TIME']
    },
    {
      id: 'chat',
      title: 'Захищений E2E Чат Підрозділу',
      sysName: 'SYS.MOD.COMMS',
      desc: [
        'Військовий месенджер найвищого рівня безпеки. Усі ваші повідомлення шифруються безпосередньо на вашому пристрої за алгоритмом AES-256-GCM. Сервер працює лише як транзитний вузол і фізично не має ключів для розшифровки тексту.',
        'Модуль підтримує систему каналів: Загальний (флуд) для побратимів, Інформаційний (тільки для доведення наказів командиром) та Особисті повідомлення (DM) з будь-яким бійцем.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg>,
      path: '/chat',
      features: ['АЛГОРИТМ AES-256-GCM', 'КАНАЛИ КОМАНДУВАННЯ', 'ЗАХИЩЕНИЙ ПОШУК', 'НУЛЬОВИЙ ДОСТУП СЕРВЕРА'],
      specs: ['КЛЮЧІ: КЛІЄНТСЬКІ', 'ЗЛОМ: НЕМОЖЛИВО', 'КРИПТОГРАФІЯ: ВІЙСЬКОВА']
    },
    {
      id: 'training',
      title: 'Теоретична База',
      sysName: 'SYS.MOD.INTEL',
      desc: [
        'Масштабна академія військової справи у вашому смартфоні, яка працює навіть БЕЗ інтернету. Курси розроблені на основі стандартів НАТО та бойового досвіду ЗСУ.',
        'Вивчайте протоколи тактичної медицини (TCCC / MARCH-PAWS), вогневу підготовку (ТБ, усунення затримок АК/AR), орієнтування на місцевості (азимути, система MGRS, робота з компасом) та правила радіоелектронної безпеки (РЕБ).'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
      path: '/training',
      features: ['ТАКТИЧНА МЕДИЦИНА (TCCC)', 'ВОГНЕВА ПІДГОТОВКА', 'ВІЙСЬКОВА ТОПОГРАФІЯ', 'РАДІОЕЛЕКТРОННА БОРОТЬБА'],
      specs: ['СТАНДАРТИ: НАТО/ЗСУ', 'ФОРМАТ: ІНТЕРАКТИВ', 'ДОСТУП: 100% ОФЛАЙН']
    },
    {
      id: 'kb',
      title: 'База Знань та FAQ',
      sysName: 'SYS.MOD.DATA',
      desc: [
        'Швидка пошукова система військової мудрості та нормативно-правової бази. Відповіді на найболючіші питання військовослужбовців зібрані в одному місці.',
        'Детальні роз\'яснення щодо грошового забезпечення (бойові, премії, ОГЗ), правил оформлення відпусток, проходження ВЛК, соціальних гарантій та порад з фронтового побуту. База постійно оновлюється командуванням.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
      path: '/knowledge-base',
      features: ['НОРМАТИВНО-ПРАВОВІ АКТИ', 'РОЗ\'ЯСНЕННЯ ВИПЛАТ', 'ГЛОБАЛЬНИЙ ПОШУК', 'АЛГОРИТМИ ВИЖИВАННЯ'],
      specs: ['БАЗА: ПРОІНДЕКСОВАНА', 'ДЖЕРЕЛА: МОУ/ГШ', 'ПОШУК: МИТТЄВИЙ']
    },
    {
      id: 'simulators',
      title: 'Бойові Симулятори',
      sysName: 'SYS.MOD.SIM',
      desc: [
        'Жорстка гейміфікована перевірка знань у стресових умовах. Симулятори використовують механіки текстових RPG-квестів з розгалуженим сюжетом.',
        'Ви приймаєте рішення під обстрілом або під час евакуації пораненого. Впроваджено механіки жорсткого таймера (на прийняття рішення є лічені секунди) та систему "пермадез" (одна фатальна помилка призводить до загибелі персонажа та провалу місії).'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M16 10h.01M16 14h.01M14 12h.01M18 12h.01"/></svg>,
      path: '/training-simulators',
      features: ['СТРЕСОВІ ТАЙМЕРИ', 'ГІЛКУВАННЯ СЮЖЕТУ', 'МЕХАНІКА "ПЕРМАДЕЗ"', 'ЖОРСТКА АНАЛІТИКА'],
      specs: ['ТИП: ТЕКСТОВІ RPG', 'КОНТРОЛЬ ПОМИЛОК: СУВОРИЙ', 'СЦЕНАРІЇ: БОЙОВІ']
    },
    {
      id: 'achievements',
      title: 'Бойові Ранги та Досягнення',
      sysName: 'SYS.MOD.RANK',
      desc: [
        'Потужна система мотивації, побудована на геймдизайні військової тематики. Система налічує 50 унікальних звань — від "Необстріляного Дренга" до "Легендарного Ейнхерія" та "Бога Війни".',
        'Отримуйте досвід (XP) за успішне проходження симуляторів, навчання та адаптацію. Відкривайте бойові відзнаки за 100% точність у місіях, взаємодію з психологом чи роботу з ментором.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M12 15l-8-4.5V4h16v6.5z"/><path d="M12 15v9"/><path d="M8 20h8"/><circle cx="12" cy="7" r="3"/></svg>,
      path: '/achievements',
      features: ['50 БОЙОВИХ ЗВАНЬ', 'НАКОПИЧЕННЯ ДОСВІДУ (XP)', 'УНІКАЛЬНІ ВІДЗНАКИ', 'ГЛОБАЛЬНИЙ РЕЙТИНГ'],
      specs: ['ГЕЙМІФІКАЦІЯ: АКТИВНА', 'ПРОГРЕСІЯ: НЕЛІНІЙНА', 'МОТИВАЦІЯ: МАКСИМАЛЬНА']
    },
    {
      id: 'equip',
      title: 'Екіпірування',
      sysName: 'SYS.MOD.GEAR',
      desc: [
        'Ваш особистий цифровий інвентар майна. Чіткий контроль того, що вам вже видала держава, а що необхідно докупити за власні кошти чи через волонтерів.',
        'Модуль містить готові чеклісти (рекомендації) для збору рюкзака залежно від типу місії (штурм, оборона позиції, медик, марш-кидок). Ніколи більше не забувайте критично важливе спорядження перед виїздом.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M16 4h-8l-2 16h12z"/><path d="M8 4V2h8v2"/><path d="M10 12h4M10 16h4"/></svg>,
      path: '/equipment',
      features: ['ІНВЕНТАРИЗАЦІЯ МАЙНА', 'ПРОТОКОЛИ МІСІЙ', 'КОНТРОЛЬ ЗАКУПІВЕЛЬ', 'АНАЛІЗ ЗАБЕЗПЕЧЕННЯ'],
      specs: ['МАСА: РОЗРАХУНОК', 'ЧЕКЛІСТИ: ДИНАМІЧНІ', 'СТАН: МОНІТОРИНГ']
    },
    {
      id: 'reports',
      title: 'Військова Документація',
      sysName: 'SYS.MOD.DOCS',
      desc: [
        'Кінець паперовій бюрократії та переписуванню рапортів по 10 разів через кому. Автоматизований генератор миттєво створює юридично правильні документи згідно з Наказом №140 МОУ.',
        'Система автоматично підставляє ваші дані, звання, ПІБ командира та номер частини. Включає шаблони для відпусток (усі види), направлень на ВЛК/шпиталь, отримання виплат, довідок УБД та прийняття/здавання посади. Експорт в PDF або DOCX.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
      path: '/reports',
      features: ['ЕКСПОРТ DOCX/PDF', 'АВТОЗАПОВНЕННЯ ДАНИХ', 'ВСІ ТИПИ ЗВЕРНЕНЬ', 'ЮРИДИЧНА ТОЧНІСТЬ'],
      specs: ['СТАНДАРТ: НАКАЗ №140', 'БЮРОКРАТІЯ: МІНІМІЗОВАНА', 'ГЕНЕРАЦІЯ: <1 СЕК']
    },
    {
      id: 'support',
      title: 'Менторство і Психолог',
      sysName: 'SYS.MOD.MED',
      desc: [
        'Надійний тил вашого ментального здоров\'я та професійного зростання. Система дозволяє створити анонімний або відкритий запит до військового психолога з визначенням рівня критичності стану.',
        'Модуль менторства з\'єднує новоприбулих бійців з досвідченими ветеранами підрозділу (за відповідною спеціальністю), створюючи ефективну систему передачі бойового досвіду з рук в руки.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8M8 12h8"/></svg>,
      path: '/mentorship',
      features: ['АНОНІМНІСТЬ 100%', 'ТРЕКІНГ НАСТРОЮ', 'ВНУТРІШНІ МЕНТОРИ', 'ЕКСКАЛАЦІЯ ЗАПИТІВ'],
      specs: ['КОНФІДЕНЦІЙНІСТЬ: ГАРАНТОВАНА', 'ПСИХОЛОГ: НА ЗВ\'ЯЗКУ', 'СТАТУС: В ТИЛУ']
    },
    {
      id: 'commander',
      title: 'Штаб та Панель Командира',
      sysName: 'SYS.MOD.HQ',
      desc: [
        'Тактичний дашборд для командування підрозділом. Командир бачить детальну статистику бойової готовності особового складу в реальному часі.',
        'Система агрегує дані про успішність проходження бійцями симуляторів, їхній середній бал, рівень психологічної загрози (критичні запити) та загальний склад підрозділу. Також реалізовано управління рекрутингом (запити на переведення).'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2"/></svg>,
      path: '/commander-dashboard',
      features: ['СХЕМА ПІДРОЗДІЛУ', 'АНАЛІЗ БОЄЗДАТНОСТІ', 'УПРАВЛІННЯ СКЛАДОМ', 'ТРЕКІНГ УСПІШНОСТІ'],
      specs: ['РІВЕНЬ ДОСТУПУ: ОФІЦЕРСЬКИЙ', 'АНАЛІТИКА: ЗВЕДЕНА', 'КОНТРОЛЬ: АБСОЛЮТНИЙ']
    },
    {
      id: 'ai',
      title: 'AI Помічник',
      sysName: 'SYS.MOD.AI',
      desc: [
        'Ваш особистий цифровий сержант, побудований на базі передового штучного інтелекту. AI натренований на військовій базі знань, тактичній медицині та статутах ЗСУ.',
        'Він здатний миттєво відповісти на запитання щодо алгоритму MARCH, підказати правильну формулювання для нестандартного рапорту, розшифрувати військову абревіатуру або допомогти знайти потрібний розділ у системі.'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>,
      path: '/ai-chat',
      features: ['НАВЧАЛЬНА МОДЕЛЬ ЗСУ', 'МИТТЄВІ ВІДПОВІДІ', 'ГЕНЕРАЦІЯ ТЕКСТІВ', 'АЛГОРИТМІЧНІ ПІДКАЗКИ'],
      specs: ['ЯДРО: НЕЙРОМЕРЕЖА', 'БАЗА: СТАТУТИ/МЕДИЦИНА', 'ПОМИЛКОВІСТЬ: <1%']
    },
    {
      id: 'offline',
      title: 'Offline-First Архітектура',
      sysName: 'SYS.MOD.CORE',
      desc: [
        'Система спроєктована для умов повної відсутності зв\'язку. Після першого завантаження (кешування) ви отримуєте доступ до всіх навчальних матеріалів, довідників та алгоритмів навіть у найглухішому окопі.',
        'Будь-які ваші дії (проходження симуляторів, запити на психолога, зміна настрою) зберігаються в локальній базі даних вашого пристрою (IndexedDB) і будуть автоматично та непомітно відправлені на сервер при першій появі інтернету (Starlink/Мобільний зв\'язок).'
      ],
      svgIcon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/><path d="M3 3l18 18"/></svg>,
      path: '/',
      features: ['PWA АПЛІКАЦІЯ', 'ЛОКАЛЬНА БАЗА (DEXIE)', 'СТІЙКІСТЬ ДО РЕБ', 'АВТОСИНХРОНІЗАЦІЯ'],
      specs: ['МЕРЕЖА: ВІД\'ЄДНАНА', 'ЗБЕРЕЖЕННЯ: INDEXED_DB', 'ТРАФІК: МІНІМІЗОВАНИЙ']
    }
  ];

  return (
    <div className="overflow-x-hidden bg-[#050505] min-h-screen">
      {/* Локальні стилі для плавних анімацій на головній */}
      <style>{`
        @keyframes smoothFadeUp {
          0% { opacity: 0; transform: translateY(20px); filter: blur(2px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .smooth-enter {
          animation: smoothFadeUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          opacity: 0;
        }
        @keyframes terminalBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor-blink {
          display: inline-block;
          width: 12px;
          height: 1.1em;
          background-color: var(--ab3-gold);
          animation: terminalBlink 1s step-end infinite;
          vertical-align: bottom;
          margin-left: 8px;
        }
        @keyframes terminalScan {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        .animate-scan {
          animation: terminalScan 4s linear infinite;
        }
        @keyframes spinSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spinSlowReverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 15s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spinSlowReverse 20s linear infinite;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>

      {/* ===== 1. HERO SECTION (100VH) ===== */}
      <div className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center py-6 px-4 sm:px-8 border-b border-[#222]">

        {/* Банер Активних Нарядів та Робіт */}
        {activeTasks.length > 0 && (
          <div className="max-w-6xl mx-auto w-full mb-6 relative z-20 animate-fade-in-down">
            {activeTasks.map(task => (
              <div key={task.id} className={`p-4 border-l-4 mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-lg ${task.type === 'work' ? 'bg-yellow-950/30 border-yellow-500' : 'bg-red-950/30 border-red-500'}`}>
                <div>
                  <h3 className={`font-heading font-black uppercase tracking-widest text-lg ${task.type === 'work' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {task.type === 'work' ? '🛠️ ВАС ПРИЗНАЧЕНО НА РОБОТИ' : '⚠️ ВАС ПРИЗНАЧЕНО В НАРЯД'}
                  </h3>
                  <p className="text-white font-bold mt-1 uppercase tracking-widest">{task.title}</p>
                  <p className="text-gray-400 font-mono text-xs mt-1">ЧАС ВИКОНАННЯ: {task.timeRange || 'НЕ ВКАЗАНО'}</p>
                </div>
                <div className="mt-3 sm:mt-0 px-4 py-2 bg-black/50 border border-[#333] font-mono text-[10px] text-gray-300 uppercase tracking-widest">
                  СТАТУС: АКТИВНО
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          
          <div className="relative bg-[#050505]/95 backdrop-blur-2xl border border-[#222] p-6 md:p-8 lg:p-10 shadow-[8px_8px_0_0_#0a0a0a] overflow-hidden group transition-all duration-700 hover:border-[#333]">
            <RadarAnimation />
            
            {/* Grid Overlay for tactical feel */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            {/* Beautiful Tactical Corners */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[var(--ab3-gold)] opacity-50 z-20 transition-all duration-500 group-hover:w-16 group-hover:h-16 group-hover:opacity-100" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[var(--ab3-gold)] opacity-50 z-20 transition-all duration-500 group-hover:w-16 group-hover:h-16 group-hover:opacity-100" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[var(--ab3-gold)] opacity-50 z-20 transition-all duration-500 group-hover:w-16 group-hover:h-16 group-hover:opacity-100" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[var(--ab3-gold)] opacity-50 z-20 transition-all duration-500 group-hover:w-16 group-hover:h-16 group-hover:opacity-100" />

            <div className="relative z-10">
            <div className="inline-block mb-6 px-4 py-1.5 border border-[#333] bg-[#0a0a0a] smooth-enter shadow-inner">
              <span className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-[var(--ab3-gold)] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--ab3-gold)] rounded-full animate-pulse"></span>
                [ СТАТУС: ОНЛАЙН ] БАЗА ДАНИХ АКТИВНА
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-black uppercase tracking-widest text-white mb-6 leading-[1.1] smooth-enter delay-100 drop-shadow-lg">
              СИСТЕМА<br />
              АДАПТАЦІЇ<br />
              <span className="text-[var(--ab3-gold)] relative inline-block mt-1 transition-colors duration-500 group-hover:text-yellow-400">
                БІЙЦЯ<span className="cursor-blink"></span>
                <div className="absolute inset-0 bg-[var(--ab3-gold)] blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>
              </span>
            </h1>
            
            <div className="max-w-2xl mb-8 smooth-enter delay-200">
              <p className="text-sm md:text-base text-gray-400 leading-relaxed font-mono border-l-2 border-[var(--ab3-gold)] pl-4 py-2 bg-gradient-to-r from-[#111] to-transparent">
                <span className="text-[var(--ab3-gold)] mr-2">&gt;</span> Інтерактивний комплекс бойової підготовки.<br/>
                <span className="text-[var(--ab3-gold)] mr-2">&gt;</span> Координація, адаптація та зв'язок у реальному часі.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 smooth-enter delay-300">
              <button onClick={() => navigate('/training')} className="bg-[var(--ab3-gold)] text-black font-mono font-bold uppercase tracking-widest px-8 py-3.5 text-xs hover:bg-yellow-400 shadow-[0_0_15px_rgba(201,162,39,0.2)] hover:shadow-[0_0_25px_rgba(201,162,39,0.4)] transition-all hover:-translate-y-0.5">
                ІНІЦІАЛІЗАЦІЯ НАВЧАННЯ
              </button>
              <button onClick={() => navigate('/unit-guide')} className="bg-[#0a0a0a] border border-[#333] text-gray-400 hover:border-gray-500 hover:text-white uppercase tracking-widest font-mono font-bold px-8 py-3.5 text-xs transition-all shadow-inner hover:bg-[#111]">
                ДОВІДНИК БАЗИ
              </button>
            </div>

            {/* Real Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-[#222] smooth-enter delay-400 relative">
              
              <div className="p-4 bg-[#0a0a0a] border border-[#222] hover:border-[var(--ab3-gold)] transition-colors group shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--ab3-gold)] opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity"></div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-2 flex items-center justify-between">
                  <span>Кваліфікація</span> <span className="text-[var(--ab3-gold)] opacity-0 group-hover:opacity-100 transition-opacity">&gt;&gt;</span>
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl filter drop-shadow-md grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{rank.icon}</span>
                  <div>
                    <p className="font-heading font-black text-white text-sm leading-tight uppercase tracking-widest" style={{ color: rank.color }}>{rank.title}</p>
                    <p className="text-[9px] font-mono text-gray-500 mt-0.5">{metrics.xp} XP <span className="opacity-50">/ {rank.next ? rank.next : 'MAX'}</span></p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0a0a0a] border border-[#222] hover:border-blue-500 transition-colors group shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity"></div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-2 flex items-center justify-between">
                  <span>Наступна Подія</span> <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">&gt;&gt;</span>
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl filter drop-shadow-md opacity-50 group-hover:opacity-100 transition-all">📅</span>
                  <div className="flex-1 min-w-0">
                    {metrics.nextEvent ? (
                      <>
                        <p className="font-bold text-white text-xs truncate uppercase tracking-widest">{metrics.nextEvent.title}</p>
                        <p className="text-[9px] font-mono text-blue-400 mt-1 inline-block border border-blue-900/50 bg-blue-900/20 px-1.5 py-0.5">{new Date(metrics.nextEvent.startTime).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</p>
                      </>
                    ) : (
                      <p className="font-bold text-gray-600 text-xs uppercase tracking-widest font-mono">ОЧІКУВАННЯ</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#0a0a0a] border border-[#222] hover:border-green-500 transition-colors group shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-500 opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity"></div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-2 flex items-center justify-between">
                  <span>Бойова Точність</span> <span className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">&gt;&gt;</span>
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl filter drop-shadow-md opacity-50 group-hover:opacity-100 transition-all">🎯</span>
                  <div>
                    <p className="font-heading font-black text-2xl leading-none text-green-400 tracking-widest">{metrics.avgScore}%</p>
                    <p className="text-[9px] font-mono text-gray-500 mt-1.5 uppercase tracking-widest">Ефективність</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 bg-[#0a0a0a] border transition-colors group shadow-inner relative overflow-hidden ${metrics.unread > 0 ? 'border-red-500/50 hover:border-red-500' : 'border-[#222] hover:border-gray-500'}`}>
                <div className={`absolute top-0 right-0 w-16 h-16 opacity-0 rounded-full blur-xl transition-opacity ${metrics.unread > 0 ? 'bg-red-500 group-hover:opacity-10' : 'bg-gray-500 group-hover:opacity-10'}`}></div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-2 flex items-center justify-between">
                  <span>Радіоперехоплення</span> <span className={`${metrics.unread > 0 ? 'text-red-500' : 'text-gray-500'} opacity-0 group-hover:opacity-100 transition-opacity`}>&gt;&gt;</span>
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className={`text-3xl filter drop-shadow-md transition-all ${metrics.unread > 0 ? 'text-red-500' : 'text-gray-600 grayscale'}`}>✉️</span>
                    {metrics.unread > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-[#0a0a0a]"></span>}
                  </div>
                  <div>
                    <p className={`font-heading font-black text-2xl leading-none tracking-widest ${metrics.unread > 0 ? 'text-red-500' : 'text-gray-600'}`}>{metrics.unread}</p>
                    <p className={`text-[9px] font-mono mt-1.5 uppercase tracking-widest ${metrics.unread > 0 ? 'text-red-400' : 'text-gray-600'}`}>{metrics.unread > 0 ? 'Непрочитано' : 'Ефір Чистий'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          
          {/* TACTICAL ID CARD / DMB */}
          <div className="mt-4 bg-[#0a0a0a] border border-[#333] shadow-[8px_8px_0_0_#050505] relative overflow-hidden group smooth-enter delay-500">
            {/* Decor */}
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), repeating-linear-gradient(45deg, #000 25%, #111 25%, #111 75%, #000 75%, #000)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }}></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--ab3-gold)] to-transparent opacity-50"></div>
            <div className="absolute -left-10 top-1/2 w-20 h-32 bg-[var(--ab3-gold)] blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>

            <div className="relative z-10 p-6">
              <div className="flex flex-col lg:flex-row gap-8 justify-between">
                
                {/* Left Side: Identity */}
                <div className="flex gap-6 items-start">
                  <div className="w-20 h-24 bg-[#111] border-2 border-[#333] p-1 flex-shrink-0 relative">
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    {((user as any)?.profilePictureUrl) ? (
                      <img src={(user as any).profilePictureUrl} className="w-full h-full object-cover grayscale contrast-125" alt="ID" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">👤</div>
                    )}
                  </div>
                  <div className="font-mono">
                    <div className="text-[10px] text-[var(--ab3-gold)] tracking-[0.3em] mb-1 uppercase">UKR ARMED FORCES // ID CARD</div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest leading-none mb-1">
                      {metrics.fullName || `${user?.lastName || ''} ${user?.firstName || ''}`.trim()}
                    </h3>
                    <p className="text-sm text-gray-400 tracking-widest uppercase mb-4">{(user as any)?.callsign ? `"${(user as any).callsign}"` : ''} | {user?.rank || 'ЗВАННЯ НЕ ВСТАНОВЛЕНО'}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[10px] text-gray-500 tracking-widest uppercase">
                      <p>ID: <span className="text-gray-300">{user?.id?.split('-')[0]}</span></p>
                      <p>ПІДРОЗДІЛ: <span className="text-[var(--ab3-gold)] font-bold">{metrics.unitName || 'ПОЗА ШТАТОМ'}</span></p>
                      <p>ПОСАДА: <span className="text-gray-300">{user?.position || 'НЕМАЄ'}</span></p>
                      <p>ЗБРОЯ: <span className="text-gray-300">{metrics.weaponName || 'НЕ ЗАКРІПЛЕНО'} {metrics.weaponNumber ? `#${metrics.weaponNumber}` : ''}</span></p>
                      <p className="md:col-span-2">СТАТУС: <span className="text-green-500 font-bold bg-green-900/20 px-2 py-0.5 border border-green-900">В СТРОЮ</span></p>
                    </div>
                  </div>
                </div>

                {/* Right Side: DMB Progress */}
                <div className="flex-1 lg:max-w-md flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#333] pt-6 lg:pt-0 lg:pl-8">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-[10px] font-mono text-[var(--ab3-gold)] tracking-widest uppercase">ТРИВАЛІСТЬ СЛУЖБИ</p>
                      <p className="text-3xl font-heading font-black text-white tracking-wider">{metrics.daysServed} <span className="text-sm text-gray-500">ДНІВ</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-gray-500 tracking-widest uppercase">ПРОГРЕС</p>
                      <p className="text-xl font-mono font-bold text-[var(--ab3-gold)]">{metrics.contractEndDate ? `${Math.floor(contractProgress)}%` : '∞'}</p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-black border border-[#333] p-0.5 relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNDBsNDAtNDBIMzBMMCAzMHYxMHptMjAgMGwyMC0yMEgzMEwwIDIwdjEweiIgZmlsbD0iIzIyMiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-20 pointer-events-none"></div>
                    <div className="h-full bg-[var(--ab3-gold)] shadow-[0_0_10px_rgba(201,162,39,0.5)] transition-all duration-1000 relative overflow-hidden" style={{ width: `${contractProgress}%` }}>
                       <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] font-mono text-gray-600 tracking-widest uppercase">
                    <span>{metrics.serviceStartDate ? new Date(metrics.serviceStartDate).toLocaleDateString('uk-UA') : 'ПОЧАТОК'}</span>
                    <span>{metrics.contractEndDate ? new Date(metrics.contractEndDate).toLocaleDateString('uk-UA') : 'ДЕМБЕЛЬ'}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
            </div>

      {/* ===== 2. ДОКТРИНА / МІСІЯ ===== */}
      <div className="py-24 border-b border-[#222] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-[#111] to-transparent pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="w-full md:w-1/3">
                <div className="inline-block px-3 py-1 border border-[var(--ab3-gold)] bg-[#111] mb-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-[var(--ab3-gold)]">
                    [ ОПЕРАТИВНА ДОКТРИНА ]
                  </span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-heading font-black text-white uppercase tracking-widest leading-tight">
                  ХАОС ПЕРШИХ ДНІВ — НАШ ГОЛОВНИЙ ВОРОГ.
                </h2>
              </div>
              <div className="w-full md:w-2/3 space-y-6">
                <p className="text-lg md:text-xl text-gray-400 font-sans leading-relaxed text-justify border-l-2 border-[#333] pl-6">
                  Брак бойового досвіду, паперова бюрократія та застарілі методи передачі наказів більше не працюють в умовах сучасної високоінтенсивної війни. Час, витрачений на пошук інформації чи очікування інструкцій, вимірюється не хвилинами, а життями.
                </p>
                <p className="text-lg md:text-xl text-gray-400 font-sans leading-relaxed text-justify border-l-2 border-[var(--ab3-gold)] pl-6">
                  Ця система розроблена військовими для військових. Її мета — <strong className="text-white">забезпечити безшовну та миттєву адаптацію</strong> новоприбулих бійців. Від інтерактивного навчання алгоритму MARCH до шифрованого чату підрозділу та генерації рапортів за 1 секунду. Ми перетворюємо непідготовлений підрозділ на єдиний, злагоджений та смертоносний механізм.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ===== 3. АРХІТЕКТУРА СИСТЕМИ (BENTO GRID) ===== */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-8">
        <ScrollReveal>
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-widest text-white mb-4">
              МОДУЛІ ТА СИСТЕМИ
            </h2>
            <p className="font-mono text-sm text-gray-500 uppercase tracking-widest">
              // ПОВНИЙ КОНТРОЛЬ НАД ЖИТТЄВИМ ЦИКЛОМ ВІЙСЬКОВОСЛУЖБОВЦЯ //
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulesInfo.map((mod, idx) => (
            <ScrollReveal key={mod.id} delay={idx * 50}>
              <div onClick={() => navigate(mod.path)} className="h-full p-6 bg-[#0a0a0a] border border-[#222] hover:border-[var(--ab3-gold)] hover:shadow-[0_0_30px_rgba(201,162,39,0.1)] transition-all duration-300 group cursor-pointer flex flex-col relative overflow-hidden">
                {/* Hover Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ab3-gold)] opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-black border border-[#333] group-hover:border-[var(--ab3-gold)] text-gray-400 group-hover:text-[var(--ab3-gold)] transition-colors flex items-center justify-center filter drop-shadow-md">
                    {React.cloneElement(mod.svgIcon as React.ReactElement, { className: "w-6 h-6" })}
                  </div>
                  <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest px-2 py-1 bg-[#111] border border-[#222]">
                    {mod.sysName}
                  </span>
                </div>

                <h3 className="text-xl font-heading font-black uppercase tracking-widest text-white mb-3 group-hover:text-[var(--ab3-gold)] transition-colors">
                  {mod.title}
                </h3>
                
                <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1 text-justify">
                  {mod.desc[0]}
                </p>

                <div className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {mod.features.slice(0, 3).map((feat, i) => (
                      <span key={i} className="text-[9px] font-mono text-gray-400 bg-[#111] border border-[#222] px-2 py-1 uppercase tracking-widest truncate max-w-full">
                        {feat}
                      </span>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-[#222] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-gray-500 group-hover:text-white transition-colors uppercase tracking-widest">
                      Ініціалізація
                    </span>
                    <span className="text-[var(--ab3-gold)] font-mono transform translate-x-0 group-hover:translate-x-2 transition-transform">
                      &gt;&gt;
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* ===== 4. ТЕХНІЧНА ПЕРЕВАГА (SECURITY) ===== */}
      <div className="py-24 bg-black border-y border-[#222] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
              <div>
                <div className="text-4xl text-blue-500 mb-4 flex justify-center md:justify-start">
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                </div>
                <h3 className="text-lg font-heading font-black text-white uppercase tracking-widest mb-3">E2E Шифрування</h3>
                <p className="text-sm text-gray-500 font-mono leading-relaxed">Всі переговори підрозділу захищені військовим стандартом AES-256-GCM. Ключі генеруються виключно на пристроях бійців.</p>
              </div>
              <div>
                <div className="text-4xl text-[var(--ab3-gold)] mb-4 flex justify-center md:justify-start">
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"/><path d="M3 3l18 18"/></svg>
                </div>
                <h3 className="text-lg font-heading font-black text-white uppercase tracking-widest mb-3">Офлайн Автономність</h3>
                <p className="text-sm text-gray-500 font-mono leading-relaxed">Під впливом ворожого РЕБ система продовжує працювати на базі локальної IndexedDB. Синхронізація відбувається автоматично при появі мережі.</p>
              </div>
              <div>
                <div className="text-4xl text-green-500 mb-4 flex justify-center md:justify-start">
                  <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 className="text-lg font-heading font-black text-white uppercase tracking-widest mb-3">Децентралізація</h3>
                <p className="text-sm text-gray-500 font-mono leading-relaxed">Відсутність єдиної точки відмови. Кожен підрозділ має свій ізольований простір, власні ключі доступу та незалежну ієрархію управління.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ===== 5. ФУТЕР (СЛАВА УКРАЇНІ) ===== */}
      <div className="pt-32 pb-16 relative overflow-hidden bg-[#050505] flex flex-col items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--ab3-gold)] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
        
        <ScrollReveal>
          {/* SYSTEM SHIELD SVG */}
          <svg viewBox="0 0 24 24" fill="none" className="w-24 h-24 mx-auto text-[var(--ab3-gold)] mb-10 drop-shadow-[0_0_20px_rgba(201,162,39,0.4)] transition-transform duration-1000 hover:scale-105">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="currentColor"/>
          </svg>
          
          <div className="text-center space-y-4 relative z-10">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              СЛАВА УКРАЇНІ
            </h2>
            <h3 className="text-2xl md:text-4xl font-black uppercase tracking-[0.3em] text-[var(--ab3-gold)]">
              ГЕРОЯМ СЛАВА
            </h3>
          </div>
        </ScrollReveal>

        <div className="mt-32 w-full max-w-6xl border-t border-[#222] pt-8 flex flex-col md:flex-row justify-between items-center px-4 sm:px-8 text-[10px] font-mono text-gray-600 uppercase tracking-widest relative z-10">
          <p>MILITARY ADAPTATION SYSTEM © 2026</p>
          <p className="mt-4 md:mt-0 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> ALL SYSTEMS NOMINAL
          </p>
        </div>
      </div>
    </div>
  );
};