import React, { useState } from 'react';

interface FAQ {
  id: number;
  category: string;
  q: string;
  a: string;
}

const FAQ_DATA: FAQ[] = [
  { id: 1, category: 'Документи', q: 'Що робити, якщо загубив військовий квиток або посвідчення?', a: 'Негайно доповісти безпосередньому командиру та написати пояснювальну записку. Далі звернутися до стройової частини для запуску процедури відновлення документів. Не приховуйте факт втрати!' },
  { id: 2, category: 'Документи', q: 'Як отримати довідку про проходження служби (додаток 5)?', a: 'Зверніться з відповідним рапортом до безпосереднього командира. Після його погодження рапорт передається до стройової частини, яка готує довідку протягом 3-5 робочих днів.' },
  { id: 3, category: 'Фінанси', q: 'Коли та як виплачується грошове забезпечення?', a: 'Грошове забезпечення виплачується щомісяця на вашу банківську картку. Зарплата виплачується до 20 числа поточного місяця за попередній місяць служби.' },
  { id: 4, category: 'Фінанси', q: 'Як оформити матеріальну допомогу?', a: 'Рапорт на матеріальну допомогу (на вирішення соціально-побутових питань або на оздоровлення) подається безпосередньому командиру за встановленим зразком раз на рік.' },
  { id: 5, category: 'Медицина', q: 'Як отримати медичну допомогу?', a: 'Зверніться до бойового медика свого взводу чи санітарного інструктора роти. У разі погіршення стану - до медичного пункту частини (1 поверх казарми). При невідкладних станах терміново доповісти черговому.' },
  { id: 6, category: 'Медицина', q: 'Як отримати направлення на ВЛК?', a: 'Направлення на військово-лікарську комісію (ВЛК) видається командиром частини на підставі вашого рапорту та висновку начальника медичної служби частини.' },
  { id: 7, category: 'Побут', q: 'Як отримати звільнення за межі частини?', a: 'Звільнення надається командиром підрозділу у вільний від несення служби та занять час. Необхідно завчасно попередити командира та отримати звільнювальну записку. Для строковиків існують окремі ліміти.' },
  { id: 8, category: 'Побут', q: 'Чи можу я користуватися смартфоном?', a: 'Користування смартфонами дозволено у визначений час (зазвичай після 18:00) та в дозволених місцях. Заборонено знімати об\'єкти інфраструктури, техніку та особовий склад без дозволу. Під час несення служби на посту телефон здається.' },
  { id: 9, category: 'Екіпірування', q: 'Як замінити пошкоджену форму?', a: 'Зіпсована під час виконання службових обов\'язків форма підлягає заміні. Необхідно подати рапорт на списання, прикріпити пошкоджену річ та після затвердження рапорту отримати нову на речовому складі.' },
];

const categories = ['Всі', 'Документи', 'Фінанси', 'Медицина', 'Побут', 'Екіпірування'];

export const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Всі');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredFaqs = FAQ_DATA.filter(faq => {
    const matchesCat = selectedCategory === 'Всі' || faq.category === selectedCategory;
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
          ЧАСТІ ЗАПИТАННЯ (FAQ)
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          // ШВИДКІ ВІДПОВІДІ НА ПОШИРЕНІ ПИТАННЯ //
        </p>
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
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn"
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
        {filteredFaqs.length === 0 ? (
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
                  className="w-full text-left p-5 flex justify-between items-center gap-4 hover:bg-[#111] transition-colors"
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-1 bg-[#111] border border-[#333] text-[var(--ab3-gold)] mb-2 inline-block">{faq.category}</span>
                    <h3 className="text-md font-heading font-bold text-white pr-4">{faq.q}</h3>
                  </div>
                  <span className="text-2xl text-[var(--ab3-gold)] transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
                </button>
                
                <div className={`transition-all duration-300 px-5 ${isExpanded ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
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