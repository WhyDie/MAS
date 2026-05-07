import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

interface FAQ {
  id: string;
  category: string;
  q: string;
  a: string;
}

const categories = ['Всі', 'Документи', 'Фінанси', 'Медицина', 'Побут', 'Екіпірування'];

export const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Всі');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/faq');
        setFaqs(res.data.data || res.data || []);
      } catch (error) {
        console.error("Failed to fetch FAQs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFAQs();
  }, []);

  const filteredFaqs = faqs.filter(faq => {
    const matchesCat = selectedCategory === 'Всі' || faq.category === selectedCategory;
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const canManage = user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="animate-fade-in-up overflow-x-hidden">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', lineHeight: '1.2' }}>
              ЧАСТІ ЗАПИТАННЯ (FAQ)
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              // ШВИДКІ ВІДПОВІДІ НА ПОШИРЕНІ ПИТАННЯ //
            </p>
          </div>
          {canManage && (
            <button onClick={() => navigate('/faq-admin')} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>⚙️ Управління</button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="flex flex-col gap-4 mb-4">
          <input
            type="text"
            placeholder="🔍 Пошук відповіді (наприклад: 'відпустка' або 'рапорт')..."
            className="input w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn w-full flex items-center justify-center text-center"
              style={{ 
                background: selectedCategory === cat ? 'var(--gradient-gold)' : 'transparent', 
                color: selectedCategory === cat ? 'var(--ab3-black)' : 'var(--text-muted)', 
                border: `1px solid ${selectedCategory === cat ? 'var(--ab3-gold)' : '#333'}`, 
                padding: '8px 14px', 
                fontSize: '12px' 
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
            <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
            <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
          </div>
        ) :
        filteredFaqs.length === 0 ? (
          <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Відповідей не знайдено</h3>
            <p style={{ color: 'var(--text-muted)' }}>Спробуйте змінити критерії пошуку</p>
          </div>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isExpanded = expandedId === faq.id;
            return (
              <div 
                key={faq.id} 
                className="bg-[#0a0a0a] border border-[#333] transition-all duration-300 animate-fade-in-up overflow-hidden" 
                style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both', borderLeft: isExpanded ? '3px solid var(--ab3-gold)' : '3px solid transparent' }}
              >
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                  className="w-full text-left p-4 sm:p-5 flex justify-between items-center gap-4 hover:bg-[#111] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-1 bg-[#111] border border-[#333] text-[var(--ab3-gold)] mb-2 inline-block">{faq.category}</span>
                    <h3 className="text-md font-heading font-bold text-white">{faq.q}</h3>
                  </div>
                  <span className="text-2xl text-[var(--ab3-gold)] transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                </button>
                
                <div className={`transition-all duration-300 px-4 sm:px-5 ${isExpanded ? 'max-h-96 pb-4 sm:pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-sm leading-relaxed text-gray-300 pt-3 border-t border-[#222]">💡 {faq.a}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};