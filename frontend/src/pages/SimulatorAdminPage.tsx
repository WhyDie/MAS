import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface Simulator {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: string;
  category: string;
  estimatedMinutes: number;
  isActive: boolean;
  sortOrder: number;
  quizContent?: any;
  scenarioFlow?: any;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface ScenarioNode {
  id: string;
  text: string;
  choices: { text: string; score: number; nextNode: string }[];
}

const typeLabels: Record<string, string> = {
  scenario: '🎯 Сценарій',
  quiz: '❓ Вікторина',
  combat_drill: '⚔️ Бойова підготовка',
  survival: '🏕️ Виживання',
  communication: '📡 Комунікація'
};
const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: 'Легкий', color: '#22c55e' },
  normal: { label: 'Середній', color: '#3b82f6' },
  hard: { label: 'Складний', color: '#f59e0b' },
  extreme: { label: 'Екстремальний', color: '#ef4444' }
};

const emptySimulator: Omit<Simulator, 'id' | 'sortOrder'> = {
  title: '', description: '', type: 'quiz', difficulty: 'normal',
  category: 'Тактика', estimatedMinutes: 15, isActive: true,
  quizContent: null, scenarioFlow: null
};

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

const defaultQuizQuestions: Record<string, Array<{ question: string; options: string[]; correctAnswer: number }>> = {
  scenario: [
    { question: 'Перший крок за протоколом MARCH?', options: ['Airway', 'Massive Hemorrhage', 'Respiration', 'Circulation'], correctAnswer: 1 },
    { question: 'Куди накладати турнікет?', options: ['На рану', '5-7 см вище рани', 'Нижче рани', 'Без різниці'], correctAnswer: 1 },
    { question: 'Як перевірити прохідність дихальних шляхів?', options: ['Підняти підборіддя, відхилити голову', 'Струсити за плече', 'Покричати', 'Дати води'], correctAnswer: 0 },
  ],
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

const DraggableList: React.FC<{
  items: Array<{ id: string }>;
  onReorder: (ids: string[]) => void;
  renderItem: (item: { id: string }, index: number, isDragging: boolean, isOver: boolean, handlers: {
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
  }) => React.ReactNode;
}> = ({ items, onReorder, renderItem }) => {
  const dragOverRef = React.useRef<number | null>(null);
  const dragSourceRef = React.useRef<number | null>(null);
  const [, forceUpdate] = React.useState(0);

  const handleDragStart = (i: number) => { dragSourceRef.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragOverRef.current !== i) { dragOverRef.current = i; forceUpdate(n => n + 1); }
  };
  const handleDrop = () => {
    const from = dragSourceRef.current, to = dragOverRef.current;
    if (from === null || to === null || from === to) { dragSourceRef.current = null; dragOverRef.current = null; return; }
    const newItems = [...items];
    const [dragged] = newItems.splice(from, 1);
    newItems.splice(to, 0, dragged);
    dragSourceRef.current = null; dragOverRef.current = null;
    onReorder(newItems.map(i => i.id));
  };

  return <>
    {items.map((item, index) => {
      const isDragging = dragSourceRef.current === index;
      const isOver = dragOverRef.current === index;
      return renderItem(item, index, isDragging, isOver, {
        onDragStart: () => handleDragStart(index),
        onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
        onDrop: handleDrop,
      });
    })}
  </>;
};

export const SimulatorAdminPage: React.FC = () => {
  const [simulators, setSimulators] = useState<Simulator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSim, setEditingSim] = useState<Simulator | null>(null);
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [editorType, setEditorType] = useState<'quiz' | 'scenario' | 'questions'>('quiz');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizPassingScore, setQuizPassingScore] = useState(60);
  const [scenarioNodes, setScenarioNodes] = useState<ScenarioNode[]>([]);
  const [form, setForm] = useState(emptySimulator);

  useEffect(() => { loadSimulators(); }, []);

  const loadSimulators = async () => {
    try {
      setLoading(true);
      const res = await api.get('/training-simulators?limit=200');
      const data = res.data.data?.simulators || res.data?.simulators || res.data || [];
      const list = Array.isArray(data) ? data : (data.data || []);
      const sorted = list.sort((a: any, b: any) => {
        return (typeof a.sortOrder === 'number' ? a.sortOrder : 999) - (typeof b.sortOrder === 'number' ? b.sortOrder : 999);
      });
      setSimulators(sorted);
    } catch { setError('Не вдалося завантажити симулятори'); }
    finally { setLoading(false); }
  };

  const handleReorder = async (ids: string[]) => {
    try {
      await api.put('/training-simulators/reorder', { ids });
      setSuccess('Порядок оновлено');
      loadSimulators();
    } catch { setError('Не вдалося змінити порядок'); }
  };

  const openForm = async (sim?: Simulator) => {
    if (sim) {
      setEditingSim(sim);
      try {
        const res = await api.get(`/training-simulators/${sim.id}`);
        const full = res.data.data || res.data;
          
          let qContent = full.quizContent;
          if (qContent === '[object Object]') qContent = null;
          while (typeof qContent === 'string') {
            try { qContent = JSON.parse(qContent); } catch(e) { break; }
          }
          let sFlow = full.scenarioFlow;
          if (sFlow === '[object Object]') sFlow = null;
          while (typeof sFlow === 'string') {
            try { sFlow = JSON.parse(sFlow); } catch(e) { break; }
          }
          
        setForm({
          title: full.title, description: full.description, type: full.type,
          difficulty: full.difficulty, category: full.category,
          estimatedMinutes: full.estimatedMinutes, isActive: full.isActive,
            quizContent: qContent || null,
            scenarioFlow: sFlow || null,
        });
      } catch {
        setForm({ title: sim.title, description: sim.description, type: sim.type, difficulty: sim.difficulty, category: sim.category, estimatedMinutes: sim.estimatedMinutes, isActive: sim.isActive, quizContent: null, scenarioFlow: null });
      }
    } else {
      setEditingSim(null);
      setForm(emptySimulator);
    }
    setShowForm(true);
    setError(''); setSuccess('');
  };

  const openContentEditor = async (sim: Simulator) => {
    let full = sim;
    try {
      const res = await api.get(`/training-simulators/${sim.id}`);
      full = res.data.data || res.data || sim;
    } catch {
      console.warn('Using list data for editor fallback');
    }

    let qContent = full.quizContent;
    if (qContent === '[object Object]') qContent = null;
    while (typeof qContent === 'string') {
      try { qContent = JSON.parse(qContent); } catch(e) { break; }
    }
    let sFlow = full.scenarioFlow;
    if (sFlow === '[object Object]') sFlow = null;
    while (typeof sFlow === 'string') {
      try { sFlow = JSON.parse(sFlow); } catch(e) { break; }
    }

    if (sim.type === 'scenario') {
      setEditorType('scenario');
      if (sFlow && sFlow.nodes && Array.isArray(sFlow.nodes) && sFlow.nodes.length > 0) {
        setScenarioNodes(sFlow.nodes);
      } else {
        setScenarioNodes(JSON.parse(JSON.stringify(defaultScenarioFlow.nodes)));
      }
    } else {
      setEditorType('questions');
      if (qContent && qContent.questions && Array.isArray(qContent.questions) && qContent.questions.length > 0) {
        const mappedQuestions = qContent.questions.map((q: any) => ({
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
          correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : (q.correct !== undefined ? q.correct : 0)
        }));
        setQuizQuestions(mappedQuestions);
        setQuizPassingScore(qContent.passingScore || 60);
      } else {
        const defaults = defaultQuizQuestions[sim.type] || defaultQuizQuestions.quiz;
        setQuizQuestions(JSON.parse(JSON.stringify(defaults)));
        setQuizPassingScore(60);
      }
    }
    setEditingSim(sim);
    setShowContentEditor(true);
    setError(''); setSuccess('');
  };

  const saveSimulator = async () => {
    if (!form.title.trim()) { setError('Назва обовʼязкова'); return; }
    try {
      setLoading(true);
      const data: any = { ...form };
      if (data.quizContent && typeof data.quizContent === 'object') data.quizContent = JSON.stringify(data.quizContent);
      if (data.scenarioFlow && typeof data.scenarioFlow === 'object') data.scenarioFlow = JSON.stringify(data.scenarioFlow);
      if (editingSim) {
        await api.put(`/training-simulators/${editingSim.id}`, data);
        setSuccess('Симулятор оновлено');
      } else {
        await api.post('/training-simulators', data);
        setSuccess('Симулятор додано');
      }
      setShowForm(false);
      loadSimulators();
    } catch (err: any) { setError(err.response?.data?.error || err.message || 'Помилка'); }
    finally { setLoading(false); }
  };

  const saveContent = async () => {
    if (!editingSim) return;
    try {
      setLoading(true);
      const data: any = { ...editingSim };
      if (editorType === 'questions') {
        if (quizQuestions.length === 0) { setError('Додайте хоча б одне запитання'); setLoading(false); return; }
        data.quizContent = JSON.stringify({ questions: quizQuestions, passingScore: quizPassingScore, maxScore: 100 });
      } else if (editorType === 'scenario') {
        if (scenarioNodes.length === 0) { setError('Додайте хоча б один вузол сценарію'); setLoading(false); return; }
        data.scenarioFlow = JSON.stringify({ nodes: scenarioNodes, maxScore: 100, passingScore: 60 });
      }
      await api.put(`/training-simulators/${editingSim.id}`, data);
      setSuccess(`Вміст успішно збережено`);
      setShowContentEditor(false);
      loadSimulators();
    } catch (err: any) { setError(err.response?.data?.error || err.message || 'Помилка'); }
    finally { setLoading(false); }
  };

  // Question handlers
  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };
  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQ = [...quizQuestions];
    newQ[index] = { ...newQ[index], [field]: value };
    setQuizQuestions(newQ);
  };
  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQ = [...quizQuestions];
    const newOptions = [...newQ[qIndex].options];
    newOptions[oIndex] = value;
    newQ[qIndex] = { ...newQ[qIndex], options: newOptions };
    setQuizQuestions(newQ);
  };
  const deleteQuestion = (index: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  // Scenario handlers
  const addScenarioNode = () => {
    const id = `node_${Date.now()}`;
    setScenarioNodes([...scenarioNodes, { id, text: '', choices: [{ text: '', score: 0, nextNode: '' }, { text: '', score: 0, nextNode: '' }] }]);
  };
  const updateNodeText = (index: number, text: string) => {
    const newN = [...scenarioNodes];
    newN[index] = { ...newN[index], text };
    setScenarioNodes(newN);
  };
  const updateChoice = (nIndex: number, cIndex: number, field: string, value: any) => {
    const newN = [...scenarioNodes];
    const newChoices = [...(newN[nIndex].choices || [])];
    newChoices[cIndex] = { ...newChoices[cIndex], [field]: value };
    newN[nIndex] = { ...newN[nIndex], choices: newChoices };
    setScenarioNodes(newN);
  };
  const addChoice = (nIndex: number) => {
    const newN = [...scenarioNodes];
    const newChoices = [...(newN[nIndex].choices || []), { text: '', score: 0, nextNode: '' }];
    newN[nIndex] = { ...newN[nIndex], choices: newChoices };
    setScenarioNodes(newN);
  };
  const deleteChoice = (nIndex: number, cIndex: number) => {
    const newN = [...scenarioNodes];
    const newChoices = (newN[nIndex].choices || []).filter((_, i) => i !== cIndex);
    newN[nIndex] = { ...newN[nIndex], choices: newChoices };
    setScenarioNodes(newN);
  };
  const deleteNode = (index: number) => {
    setScenarioNodes(scenarioNodes.filter((_, i) => i !== index));
  };

  const deleteSimulator = async (id: string) => {
    if (!confirm('Видалити цей симулятор?')) return;
    try {
      await api.delete(`/training-simulators/${id}`);
      setSuccess('Симулятор видалено');
      loadSimulators();
    } catch { setError('Не вдалося видалити'); }
  };

  const dragIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ cursor: 'grab', color: 'var(--text-faint)', flexShrink: 0 }}>
      <circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/>
      <circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/>
    </svg>
  );

  const editorTitle = editingSim ? `📝 Налаштування: ${typeLabels[editingSim.type]?.replace(/[^а-яА-ЯіІїЇєЄґҐ\s]/g, '').trim() || editingSim.type}` : 'Редактор';

  const getButtonLabel = (type: string) => {
    if (type === 'scenario') return '🎭 Сценарій';
    if (type === 'quiz') return '❓ Вікторина';
    if (type === 'combat_drill') return '⚔️ Тренування';
    if (type === 'survival') return '🏕️ Виживання';
    if (type === 'communication') return '📡 Зв\'язок';
    return '📝 Вміст';
  };

  // ===== CONTENT EDITOR (Quiz/Scenario) =====
  if (showContentEditor && editingSim) {
    return (
      <div className="animate-fade-in-up">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>{editorTitle}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
              {editingSim.title} — {editorType === 'scenario' ? `${scenarioNodes.length} вузлів` : `${quizQuestions.length} питань`}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowContentEditor(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '10px 20px' }}>← Назад</button>
            <button onClick={saveContent} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '10px 20px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
            <span>⚠️ {error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
            <span>✅ {success}</span>
          </div>
        )}

        {/* QUIZ / QUESTIONS EDITOR */}
        {editorType === 'questions' && (
          <>
            <div className="p-6 rounded-none mb-6 bg-[#0a0a0a] border border-[#333]">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>⚙️ Налаштування тесту</h3>
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Прохідний бал:</label>
                <input type="number" value={quizPassingScore} onChange={e => setQuizPassingScore(parseInt(e.target.value) || 60)} className="input" style={{ width: '100px', padding: '8px 12px' }} min="0" max="100" />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>%</span>
              </div>
            </div>

            <div className="space-y-6">
              {quizQuestions.map((q, qi) => (
                <div key={qi} className="p-6 rounded-none bg-[#0a0a0a] border border-[#333]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--ab3-gold)' }}>📝 Питання {qi + 1}</h3>
                    <button onClick={() => deleteQuestion(qi)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 14px', fontSize: '12px' }}>🗑</button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Запитання</label>
                    <input className="input" value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} placeholder="Введіть запитання..." />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Варіанти відповідей</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-3">
                          <input type="radio" checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, 'correctAnswer', oi)} style={{ accentColor: '#22c55e', width: '18px', height: '18px' }} title="Правильна відповідь" />
                          <input className="input" value={opt} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={`Варіант ${oi + 1}`} style={{ padding: '8px 12px' }} />
                          {q.correctAnswer === oi && <span className="text-xs font-bold" style={{ color: '#22c55e' }}>✅</span>}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>☑ Відмітьте правильну відповідь</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addQuestion} className="btn btn-primary w-full mt-6" style={{ padding: '14px 24px', fontSize: '15px' }}>➕ Додати запитання</button>
          </>
        )}

        {/* SCENARIO EDITOR */}
        {editorType === 'scenario' && (
          <>
            <div className="space-y-6">
              {scenarioNodes.map((node, ni) => (
                <div key={node.id} className="p-6 rounded-none bg-[#0a0a0a] border border-[#333]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold" style={{ color: 'var(--ab3-gold)' }}>🎭 Вузол {ni + 1}</h3>
                    <button onClick={() => deleteNode(ni)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 14px', fontSize: '12px' }}>🗑</button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Текст сценарію</label>
                    <textarea className="input" rows={3} value={node.text || ''} onChange={e => updateNodeText(ni, e.target.value)} placeholder="Опис ситуації..." />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Варіанти вибору</label>
                    {(node.choices || []).map((choice, ci) => (
                      <div key={ci} className="mb-3 p-4 rounded-none bg-[#111] border border-[#333]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Вибір {ci + 1}</span>
                          {(node.choices || []).length > 1 && (
                            <button onClick={() => deleteChoice(ni, ci)} className="text-xs" style={{ color: '#f87171' }}>✕ Видалити</button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Текст вибору</label>
                            <input className="input" value={choice.text || ''} onChange={e => updateChoice(ni, ci, 'text', e.target.value)} placeholder="Текст..." style={{ padding: '8px 12px' }} />
                          </div>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Бали</label>
                            <input type="number" className="input" value={choice.score || 0} onChange={e => updateChoice(ni, ci, 'score', parseInt(e.target.value) || 0)} style={{ padding: '8px 12px' }} />
                          </div>
                          <div>
                            <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Наступний вузол (ID)</label>
                            <select className="input" value={choice.nextNode || ''} onChange={e => updateChoice(ni, ci, 'nextNode', e.target.value)} style={{ padding: '8px 12px' }}>
                              <option value="">— Кінець —</option>
                              {scenarioNodes.map((sn, si) => (
                                <option key={sn.id} value={sn.id}>Вузол {si + 1}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => addChoice(ni)} className="text-sm font-semibold mt-2" style={{ color: 'var(--ab3-gold)' }}>+ Додати вибір</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addScenarioNode} className="btn btn-primary w-full mt-6" style={{ padding: '14px 24px', fontSize: '15px' }}>➕ Додати вузол сценарію</button>
          </>
        )}
      </div>
    );
  }

  // ===== MAIN PAGE =====
  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>УПРАВЛІННЯ СИМУЛЯТОРАМИ</h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>// РЕДАКТОР СИМУЛЯТОРІВ //</p>
      </div>

      {error && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <span>⚠️ {error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
          <span>✅ {success}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>СИМУЛЯТОРИ</h2>
        <button onClick={() => openForm()} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати симулятор</button>
      </div>

      {showForm && (
        <div className="p-6 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]">
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingSim ? '✏️ Редагування' : '➕ Новий симулятор'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Назва *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Назва симулятора" /></div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Тип</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Складність</label>
              <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>{Object.entries(difficultyConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            </div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Тривалість (хв)</label><input type="number" className="input" value={form.estimatedMinutes} onChange={e => setForm({ ...form, estimatedMinutes: parseInt(e.target.value) || 0 })} min="1" /></div>
          </div>
          <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Опис</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Опис симулятора..." /></div>
          <div className="flex gap-3">
            <button onClick={saveSimulator} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
            <button onClick={() => setShowForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
          </div>
        </div>
      )}

      {loading && !showForm ? (
        <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
          <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <DraggableList items={simulators} onReorder={handleReorder}
            renderItem={(item, _index, isDragging, isOver, h) => {
              const s = item as Simulator;
              const diff = difficultyConfig[s.difficulty] || { label: s.difficulty, color: '#6b7280' };
              const qCount = s.quizContent?.questions?.length || 0;
              const nodeCount = s.scenarioFlow?.nodes?.length || 0;
              const contentCount = qCount || nodeCount;

              return (
                <div key={s.id} draggable onDragStart={h.onDragStart} onDragOver={h.onDragOver} onDrop={h.onDrop}
                  className="military-card rounded-none bg-[#0a0a0a] border border-[#333] p-5 flex items-center gap-4 transition-all duration-300"
                  style={{ cursor: 'grab', opacity: isDragging ? 0.4 : 1, transform: isOver ? 'translateY(8px)' : 'none', boxShadow: isOver ? '0 -4px 0 0 var(--ab3-gold)' : 'none', borderLeft: `4px solid ${diff.color}` }}>
                  <div className="flex-shrink-0">{dragIcon}</div>
                  <span className="text-2xl flex-shrink-0">{s.type === 'scenario' ? '🎯' : s.type === 'quiz' ? '❓' : s.type === 'combat_drill' ? '⚔️' : s.type === 'survival' ? '🏕️' : '📡'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{s.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className="badge" style={{ background: `${diff.color}20`, color: diff.color, border: `1px solid ${diff.color}40`, fontSize: '10px' }}>{diff.label}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>⏱ {s.estimatedMinutes} хв</span>
                      {contentCount > 0 && <span className="text-xs" style={{ color: '#60a5fa', fontSize: '11px' }}>📝 {contentCount} елементів</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openContentEditor(s)} className="btn" style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '6px 12px', fontSize: '11px' }}>
                      {getButtonLabel(s.type)}
                    </button>
                    <button onClick={() => openForm(s)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                    <button onClick={() => deleteSimulator(s.id)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}
    </div>
  );
};
