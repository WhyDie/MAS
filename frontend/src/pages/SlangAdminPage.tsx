import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

export const SlangAdminPage: React.FC = () => {
  const [terms, setTerms] = useState<any[]>([]);
  const [form, setForm] = useState({ id: '', term: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { loadTerms(); }, []);

  const loadTerms = async () => {
    try {
      const res = await api.get('/slang');
      setTerms(res.data?.data || []);
    } catch (e) {}
  };

  const saveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) await api.put(`/slang/${form.id}`, form);
      else await api.post('/slang', form);
      setForm({ id: '', term: '', description: '' });
      setIsEditing(false);
      loadTerms();
    } catch (e) { alert('Помилка збереження'); }
  };

  const editTerm = (t: any) => { setForm(t); setIsEditing(true); window.scrollTo(0,0); };
  const deleteTerm = async (id: string) => {
    if(!window.confirm('Видалити термін?')) return;
    await api.delete(`/slang/${id}`);
    loadTerms();
  };

  return (
    <div className="animate-fade-in-up max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest text-[var(--ab3-gold)]">РЕДАКТОР СЛОВНИКА</h1>
        <p className="font-mono text-xs uppercase text-gray-500">// УПРАВЛІННЯ ВІЙСЬКОВИМ СЛЕНГОМ //</p>
      </div>

      <form onSubmit={saveTerm} className="p-6 bg-[#0a0a0a] border border-[#333] mb-8 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4">{isEditing ? 'Редагувати' : 'Додати новий термін'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-mono text-gray-500 mb-2">Термін/Абревіатура</label>
            <input value={form.term} onChange={e=>setForm({...form, term: e.target.value})} className="input w-full" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-mono text-gray-500 mb-2">Опис (Розшифровка)</label>
            <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} className="input w-full" rows={2} required />
          </div>
        </div>
        <div className="flex gap-4">
          <button type="submit" className="bg-[var(--ab3-gold)] text-black font-bold uppercase tracking-widest px-6 py-2">{isEditing ? 'ЗБЕРЕГТИ' : 'ДОДАТИ'}</button>
          {isEditing && <button type="button" onClick={()=>{setIsEditing(false); setForm({id:'',term:'',description:''})}} className="bg-[#222] text-white px-6 py-2 font-bold uppercase">СКАСУВАТИ</button>}
        </div>
      </form>

      <div className="bg-[#050505] border border-[#333]">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#111] border-b border-[#333] text-xs font-mono text-gray-500 uppercase tracking-widest">
              <th className="p-4">Термін</th>
              <th className="p-4">Опис</th>
              <th className="p-4 text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {terms.map(t => (
              <tr key={t.id} className="border-b border-[#111] hover:bg-[#111]">
                <td className="p-4 font-bold text-[var(--ab3-gold)]">{t.term}</td>
                <td className="p-4 text-sm text-gray-400">{t.description}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button onClick={()=>editTerm(t)} className="text-blue-500 hover:text-blue-400 font-mono text-xs">РЕД</button>
                  <button onClick={()=>deleteTerm(t.id)} className="text-red-500 hover:text-red-400 font-mono text-xs">ВИД</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};