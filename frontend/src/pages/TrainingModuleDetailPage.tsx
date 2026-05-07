import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@services/api';

export const TrainingModuleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [moduleData, setModuleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readProgress, setReadProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (id) {
      loadModule();
      checkProgress();
    }
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 100;
      setReadProgress(Math.min(100, Math.max(0, progress)));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  const loadModule = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/training/modules/${id}`);
      const fullData = res.data.data || res.data;
      
      let contentBlocks = [];
      let rawContent = '';

      if (typeof fullData.content === 'object' && fullData.content !== null) {
        if (fullData.content.blocks) {
          contentBlocks = fullData.content.blocks;
        } else {
          rawContent = fullData.content.text || JSON.stringify(fullData.content);
        }
      } else {
        rawContent = fullData.content || '';
        try {
          const parsed = JSON.parse(rawContent);
          if (parsed.blocks) {
            contentBlocks = parsed.blocks;
          } else if (parsed.text) {
            rawContent = parsed.text;
          }
        } catch {
          // Keep rawContent as is
        }
      }

      setModuleData({ ...fullData, contentBlocks, rawContent });
    } catch {
      setError('Не вдалося завантажити модуль. Можливо, він був видалений.');
    } finally {
      setLoading(false);
    }
  };

  const checkProgress = async () => {
    try {
      const res = await api.get(`/training/modules/${id}/check-progress?_t=${Date.now()}`);
      if (res.data && res.data.completed) {
        setIsCompleted(true);
      }
    } catch (e) {
      console.warn('Failed to check module progress', e);
    }
  };

  const markAsCompleted = async () => {
    try {
      setIsCompleted(true);
      await api.post('/achievements/save-module', { moduleId: id });
      // Відправляємо запит на старий маршрут для сумісності
      api.post(`/training/modules/${id}/complete`).catch(() => {});
    } catch (e) {
      console.warn('Progress tracking update:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <svg className="animate-spin w-12 h-12 mb-4 text-[var(--ab3-gold)]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
        <p className="text-[var(--text-muted)] font-mono tracking-widest uppercase">Дешифрування даних...</p>
      </div>
    );
  }

  if (error || !moduleData) {
    return (
      <div className="p-16 text-center border border-red-500/30 bg-red-500/5">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-heading font-bold text-red-500 mb-3">ПОМИЛКА ДОСТУПУ</h3>
        <p className="text-red-200 mb-6">{error}</p>
        <button onClick={() => navigate('/training')} className="btn btn-primary">Повернутися до бібліотеки</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up pb-24">
      {/* Fixed Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-[#111] z-[100]">
        <div className="h-full bg-[var(--ab3-gold)] transition-all duration-300" style={{ width: `${readProgress}%`, boxShadow: '0 0 10px var(--ab3-gold)' }} />
      </div>

      <button onClick={() => navigate('/training')} className="mb-6 text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors">
        ← Повернутися до модулів
      </button>

      {/* Hero Section */}
      <div className="p-8 md:p-12 border border-[#333] bg-[#0a0a0a] relative overflow-hidden mb-10 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--ab3-gold)] opacity-5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex gap-3 mb-6 relative z-10">
          <span className="badge badge-gold uppercase font-mono tracking-widest text-xs px-3 py-1.5">{moduleData.category}</span>
          <span className="badge uppercase font-mono tracking-widest text-xs px-3 py-1.5" style={{ background: '#111', color: 'var(--text-muted)', border: '1px solid #333' }}>⏱ {moduleData.durationMinutes} хв</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-heading font-black text-white uppercase tracking-widest mb-6 leading-tight relative z-10" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
          {moduleData.title}
        </h1>
        
        <p className="text-lg text-gray-400 max-w-3xl leading-relaxed relative z-10 border-l-2 border-[var(--ab3-gold)] pl-4">
          {moduleData.description}
        </p>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Table of Contents (Sidebar) */}
        {Array.isArray(moduleData.contentBlocks) && moduleData.contentBlocks.some((b: any) => b.type === 'header') && (
          <div className="lg:w-1/4 order-2 lg:order-1">
            <div className="sticky top-28 p-6 bg-[#0a0a0a] border border-[#333] hidden lg:block shadow-lg">
              <h3 className="text-sm font-heading font-black uppercase tracking-widest mb-4 text-[var(--text-muted)] border-b border-[#333] pb-3">Зміст курсу</h3>
              <nav className="space-y-4">
                {moduleData.contentBlocks.map((block: any, idx: number) => {
                  if (block.type === 'header') {
                    return (
                      <button 
                        key={idx}
                        onClick={() => document.getElementById(`block-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="block w-full text-left text-sm font-medium text-gray-400 hover:text-[var(--ab3-gold)] transition-colors line-clamp-2 border-l-2 border-transparent hover:border-[var(--ab3-gold)] pl-3"
                      >
                        {block.content}
                      </button>
                    );
                  }
                  return null;
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Content Blocks */}
        <div className={`order-1 lg:order-2 ${Array.isArray(moduleData.contentBlocks) && moduleData.contentBlocks.some((b: any) => b.type === 'header') ? 'lg:w-3/4' : 'w-full max-w-4xl mx-auto'}`}>
          {Array.isArray(moduleData.contentBlocks) && moduleData.contentBlocks.length > 0 ? (
            moduleData.contentBlocks.map((block: any, idx: number) => {
              switch (block.type) {
                case 'header':
                  return (
                    <h2 id={`block-${idx}`} key={idx} className="text-2xl md:text-3xl font-black uppercase tracking-widest text-[var(--ab3-gold)] mt-12 mb-6 flex items-center gap-3 scroll-mt-24">
                      <span className="w-2 h-8 bg-[var(--ab3-gold)] inline-block shadow-[0_0_10px_var(--ab3-gold)]"></span>
                      {block.content}
                    </h2>
                  );
                case 'warning':
                  return (
                    <div key={idx} className="border-l-4 border-red-500 bg-red-900/10 p-6 mb-8 relative overflow-hidden shadow-lg">
                      <div className="absolute -top-4 -right-4 p-2 opacity-5 text-8xl pointer-events-none">⚠️</div>
                      <h4 className="text-red-500 font-bold mb-2 uppercase tracking-widest text-sm">Критична інформація</h4>
                      <p className="text-red-200 relative z-10 text-lg leading-relaxed whitespace-pre-wrap">{block.content}</p>
                    </div>
                  );
                case 'info':
                  return (
                    <div key={idx} className="border-l-4 border-blue-500 bg-blue-900/10 p-6 mb-8 relative overflow-hidden shadow-lg">
                      <div className="absolute -top-4 -right-4 p-2 opacity-5 text-8xl pointer-events-none">ℹ️</div>
                      <h4 className="text-blue-500 font-bold mb-2 uppercase tracking-widest text-sm">Довідка</h4>
                      <p className="text-blue-200 relative z-10 text-lg leading-relaxed whitespace-pre-wrap">{block.content}</p>
                    </div>
                  );
                case 'image':
                  return (
                    <div key={idx} className="mb-8 p-1 bg-[#111] border border-[#333] shadow-xl relative">
                      <img src={block.content} alt="Ілюстрація до курсу" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity" />
                    </div>
                  );
                case 'video':
                let videoUrl = block.content || '';
                // Автоматично конвертуємо звичайні посилання (watch?v=...) у формат для вбудовування (embed)
                const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                if (ytMatch && ytMatch[1]) {
                  videoUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
                }
                
                  return (
                    <div key={idx} className="mb-10 p-1 bg-[#111] border border-[#333] shadow-2xl relative group">
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-white font-mono text-[10px] uppercase tracking-widest z-10 border border-[#333]">Відеоінструкція</div>
                      <div className="aspect-video w-full bg-black relative">
                      <iframe src={videoUrl} className="absolute inset-0 w-full h-full" frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                      </div>
                    </div>
                  );
                case 'text':
                default:
                  return (
                    <div key={idx} className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8 font-medium whitespace-pre-wrap" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                      {block.content}
                    </div>
                  );
              }
            })
          ) : (
            // Fallback для старих текстових модулів (маркдаун)
            <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap font-medium">
              {moduleData.rawContent}
            </div>
          )}
        </div>
      </div>

      {/* Completion Action */}
      <div className="max-w-4xl mx-auto mt-16 pt-8 border-t border-[#333]">
        {isCompleted ? (
          <div className="p-8 border border-green-500/50 bg-green-500/10 text-center animate-scale-in shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-black text-green-400 uppercase tracking-widest mb-2">МОДУЛЬ ЗАСВОЄНО</h3>
            <p className="text-green-200/70">Інформація успішно збережена у ваш профіль досягнень.</p>
            <button onClick={() => navigate('/training')} className="mt-6 btn border border-green-500 text-green-400 hover:bg-green-500/20">
              Повернутися до бібліотеки
            </button>
          </div>
        ) : (
          <button 
            onClick={markAsCompleted} 
            className="w-full py-6 bg-[var(--ab3-gold)] text-black font-black text-xl md:text-2xl uppercase tracking-widest hover:bg-yellow-400 transition-all duration-300 shadow-[0_0_30px_rgba(201,162,39,0.3)] hover:shadow-[0_0_50px_rgba(201,162,39,0.5)] transform hover:-translate-y-1"
          >
            ВІДМІТИТИ ЯК ЗАСВОЄНЕ
          </button>
        )}
      </div>
    </div>
  );
};
