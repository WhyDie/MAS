import React, { useState, useRef } from 'react';
import { useAuthStore } from '@stores/index';

export const ReportsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [reportType, setReportType] = useState('vacation_annual');
  const [docCategory, setDocCategory] = useState<'report' | 'explanation' | 'medical'>('report');
  const [commanderRank, setCommanderRank] = useState('полковнику');
  const [commanderName, setCommanderName] = useState('КОВАЛЕНКУ О.В.');
  const [unitName, setUnitName] = useState('А0000');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reason, setReason] = useState('');
  const [medDetails, setMedDetails] = useState({ time: '', mechanism: 'Осколкове', tourniquetTime: '', meds: '', injuries: '' });
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    if (printContents) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = `
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background: white; }
          .report-doc, .report-doc * { color: #000000 !important; }
        </style>
        <div class="report-doc" style="width: 210mm; min-height: 297mm; padding: 20mm 10mm 20mm 30mm; margin: 0 auto; background: white; box-sizing: border-box;">
          ${printContents}
        </div>
      `;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Відновлюємо React після перезапису DOM
    }
  };

  const handleDownloadDocx = () => {
    const printContents = printRef.current?.innerHTML;
    if (!printContents) return;
    
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Військовий документ</title><style>body { font-family: 'Times New Roman', Times, serif; font-size: 14pt; line-height: 1.5; padding: 20mm 10mm 20mm 30mm; color: #000000; } .report-doc, .report-doc * { color: #000000 !important; }</style></head><body><div class='report-doc'>";
    const footer = "</div></body></html>";
    const sourceHTML = header + printContents + footer;
    
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = docCategory === 'report' ? 'Raport.doc' : 'Poyasnennya.doc';
    fileDownload.click();
    document.body.removeChild(fileDownload);
  };

  const today = new Date().toLocaleDateString('uk-UA');
  const userName = user?.lastName ? `${user.lastName.toUpperCase()} ${(user.firstName || '')[0]}.` : 'ВІЙСЬКОВОСЛУЖБОВЕЦЬ';
  const userRank = user?.rank || 'Солдат';
  const userPos = user?.position || 'Стрілець';

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3 text-[var(--text-primary)]" style={{ fontSize: '32px' }}>
          РАПОРТИ ТА ЗВІТИ
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
          // ГЕНЕРАЦІЯ ОФІЦІЙНИХ ДОКУМЕНТІВ //
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма налаштування (не друкується) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-[#0a0a0a] border border-[#333]">
            <h3 className="text-lg font-bold mb-4 text-[var(--ab3-gold)]">⚙️ Параметри рапорту</h3>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2 text-gray-400">Категорія документа</label>
              <select className="input" value={docCategory} onChange={(e) => setDocCategory(e.target.value as any)}>
                <option value="report">Рапорт (Звернення/Клопотання)</option>
                <option value="explanation">Пояснення (За фактом розслідування)</option>
                <option value="medical">Медична документація (Форма 100)</option>
              </select>
            </div>
            
            {docCategory === 'report' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2 text-gray-400">Тип рапорту</label>
              <select className="input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <optgroup label="Відпустки">
                  <option value="vacation_annual">На щорічну основну відпустку</option>
                  <option value="vacation_family">За сімейними обставинами</option>
                  <option value="vacation_health">На відпустку для лікування</option>
                </optgroup>
                <optgroup label="Виплати та Фінанси">
                  <option value="payment_material">На матеріальну допомогу (соц-побут)</option>
                  <option value="payment_health">На грошову допомогу (оздоровлення)</option>
                  <option value="payment_reward">На виплату винагороди / премії</option>
                </optgroup>
                <optgroup label="Довідки та Витяги">
                  <option value="cert_form5">Про видачу довідки Ф-5 (УБД)</option>
                  <option value="cert_financial">Про видачу довідки про доходи</option>
                  <option value="extract_order">Про видачу витягу з наказу</option>
                </optgroup>
                <optgroup label="Здоров'я та ВЛК">
                  <option value="health_vlk">На направлення на ВЛК</option>
                  <option value="health_hospital">На направлення у шпиталь</option>
                </optgroup>
                <optgroup label="Служба та Посада">
                  <option value="duty_accept">Про приймання справ та посади</option>
                  <option value="duty_transfer">Про здавання справ та посади</option>
                  <option value="duty_tvo">Про вступ у ТВО посади</option>
                  <option value="duty_relocate">Про переміщення на інше місце служби</option>
                </optgroup>
                <optgroup label="Звільнення">
                  <option value="dismissal_health">На звільнення за станом здоров'я</option>
                  <option value="dismissal_family">На звільнення за сімейними обставинами</option>
                </optgroup>
                <optgroup label="Інше">
                  <option value="custom">Вільна форма</option>
                </optgroup>
              </select>
            </div>
            )}

            {docCategory !== 'medical' && <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-2 text-gray-400">Номер в/ч командира</label>
                <input className="input" value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="А0000" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">Звання (кому)</label>
                <input className="input" value={commanderRank} onChange={(e) => setCommanderRank(e.target.value)} placeholder="полковнику" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 text-gray-400">ПІБ (кому)</label>
                <input className="input" value={commanderName} onChange={(e) => setCommanderName(e.target.value)} placeholder="КОВАЛЕНКУ О.В." />
              </div>
            </div>}

            {docCategory === 'report' && reportType.startsWith('vacation') && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">З дати</label>
                  <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 text-gray-400">По дату</label>
                  <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-semibold mb-2 text-gray-400">
                {docCategory === 'explanation' ? 'Текст пояснення' : 'Додаткова інформація / Підстава'}
              </label>
              <textarea className="input" rows={5} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={docCategory === 'explanation' ? "По суті заданих мені питань можу пояснити наступне..." : "Введіть необхідні деталі (обставини, номери документів, скарги тощо)..."} />
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleDownloadDocx} className="btn w-full text-white font-bold uppercase tracking-widest" style={{ background: '#2563eb', border: '1px solid #1d4ed8' }}>
                📄 Завантажити як DOCX
              </button>
              <button onClick={handlePrint} className="btn w-full bg-[var(--ab3-gold)] text-black font-bold uppercase tracking-widest hover:bg-yellow-400">
                🖨️ Друк / PDF
              </button>
            </div>
          </div>
        </div>

        {/* Блок попереднього перегляду (ЦЕ буде друкуватися) */}
        <div className="lg:col-span-2 overflow-x-auto pb-4">
          <div className="bg-white shadow-2xl mx-auto relative" style={{ width: '210mm', minHeight: '297mm', transformOrigin: 'top left' }}>
            <style>{`
              .report-doc, .report-doc * {
                color: #000000 !important;
              }
            `}</style>
            
            <div ref={printRef} className="report-doc" style={{ 
              fontFamily: '"Times New Roman", Times, serif', 
              fontSize: '14pt', 
              lineHeight: '1.5',
              padding: '20mm 10mm 20mm 30mm',
              boxSizing: 'border-box',
              width: '100%',
              minHeight: '100%'
            }}>
                {docCategory !== 'medical' ? (
                <>
              {/* Шапка */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginBottom: '40px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '50%', border: 'none' }}></td>
                    <td style={{ width: '50%', border: 'none', textAlign: 'left', verticalAlign: 'top', padding: 0 }}>
                      <div style={{ marginBottom: '10px' }}>
                        Командиру військової частини {unitName}<br />
                        {commanderRank} {commanderName}
                      </div>
                      <div>
                        від {userPos}<br />
                        {userRank.toLowerCase()}<br />
                        {userName}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Назва */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', fontSize: '14pt' }}>
                {docCategory === 'report' ? 'Рапорт' : 'Пояснення'}
              </div>

              {/* Текст */}
              <div style={{ textAlign: 'justify', textIndent: '1.25cm', marginBottom: '60px' }}>
                {docCategory === 'report' ? (
                  <>
                    {reportType === 'vacation_annual' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання перед вищим командуванням про надання мені щорічної основної відпустки за поточний рік {dateFrom && dateTo ? `з ${new Date(dateFrom).toLocaleDateString('uk-UA')} по ${new Date(dateTo).toLocaleDateString('uk-UA')}` : 'з "___" ______ 20__ року по "___" ______ 20__ року'}.
                        {reason && ` Місце проведення відпустки: ${reason}.`}
                      </p>
                    )}
                    {reportType === 'vacation_family' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання перед вищим командуванням про надання мені відпустки за сімейними обставинами {dateFrom && dateTo ? `з ${new Date(dateFrom).toLocaleDateString('uk-UA')} по ${new Date(dateTo).toLocaleDateString('uk-UA')}` : 'терміном на 10 діб'}. 
                        Підстава: {reason || '________________________________________________'}.
                      </p>
                    )}
                    {reportType === 'vacation_health' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання перед вищим командуванням про надання мені відпустки для лікування у зв'язку з хворобою згідно з довідкою ВЛК {dateFrom && dateTo ? `з ${new Date(dateFrom).toLocaleDateString('uk-UA')} по ${new Date(dateTo).toLocaleDateString('uk-UA')}` : 'терміном на 30 діб'}. 
                        Додаток: {reason || 'довідка ВЛК №___ від ___'}.
                      </p>
                    )}
                    {reportType === 'payment_material' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання щодо виплати мені матеріальної допомоги для вирішення соціально-побутових питань за поточний рік у зв'язку з {reason || 'складним матеріальним становищем'}.
                      </p>
                    )}
                    {reportType === 'payment_health' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання щодо виплати мені грошової допомоги на оздоровлення за поточний рік у розмірі місячного грошового забезпечення. {reason && ` ${reason}`}
                      </p>
                    )}
                    {reportType === 'payment_reward' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання щодо виплати мені додаткової винагороди за {reason || 'безпосередню участь у бойових діях / виконання бойових завдань'}.
                      </p>
                    )}
                    {reportType === 'cert_form5' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання щодо видачі мені довідки про безпосередню участь у бойових діях (Форма 5) для подальшого оформлення статусу учасника бойових дій. Період участі: {reason || 'з ___ по ___'}.
                      </p>
                    )}
                    {reportType === 'cert_financial' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу видати мені довідку про розмір мого грошового забезпечення за {reason || 'останні 6 місяців'} для пред'явлення за місцем вимоги.
                      </p>
                    )}
                    {reportType === 'extract_order' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу видати мені витяг з наказу командира військової частини щодо {reason || 'мого призначення на посаду / зарахування до списків частини'}.
                      </p>
                    )}
                    {reportType === 'health_vlk' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Доповідаю, що у зв'язку з погіршенням стану здоров'я, прошу Вашого клопотання про направлення мене на медичний огляд військово-лікарською комісією (ВЛК) для визначення ступеня придатності до військової служби. 
                        Скарги: {reason || '________________________________________________'}.
                      </p>
                    )}
                    {reportType === 'health_hospital' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Доповідаю, що у зв'язку з гострим захворюванням, прошу Вашого клопотання про направлення мене до найближчого військового лікувального закладу для госпіталізації. 
                        Скарги: {reason || '________________________________________________'}.
                      </p>
                    )}
                    {reportType === 'duty_accept' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Доповідаю, що я, {userRank.toLowerCase()} {userName}, посаду {userPos} прийняв і приступив до виконання службових обов'язків. {reason && ` ${reason}`}
                      </p>
                    )}
                    {reportType === 'duty_transfer' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Доповідаю, що я, {userRank.toLowerCase()} {userName}, посаду {userPos} здав. {reason && ` ${reason}`}
                      </p>
                    )}
                    {reportType === 'duty_tvo' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Доповідаю, що я, {userRank.toLowerCase()} {userName}, приступив до тимчасового виконання обов'язків за посадою {reason || '___________________'}.
                      </p>
                    )}
                    {reportType === 'duty_relocate' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання перед вищим командуванням про переміщення мене до нового місця служби у {reason || 'військову частину А____ на посаду ____'}. Додаток: відношення командира в/ч.
                      </p>
                    )}
                    {reportType === 'dismissal_health' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання перед вищим командуванням про звільнення мене з військової служби у запас за станом здоров'я на підставі висновку ВЛК. 
                        Додаток: {reason || 'свідоцтво про хворобу №___ від ___'}.
                      </p>
                    )}
                    {reportType === 'dismissal_family' && (
                      <p style={{ margin: '0 0 10px 0' }}>
                        Прошу Вашого клопотання перед вищим командуванням про звільнення мене з військової служби у запас через сімейні обставини, а саме: {reason || '___________________'}. 
                        Додатки: нотаріально завірені копії підтверджуючих документів.
                      </p>
                    )}
                    {reportType === 'custom' && (
                      <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap' }}>{reason || 'Прошу Вас... (заповніть поле "Причина" зліва)'}</p>
                    )}
                  </>
                ) : (
                  <p style={{ margin: '0 0 10px 0', whiteSpace: 'pre-wrap' }}>
                    По суті заданих мені питань можу пояснити наступне. {reason || '__________________________________________________________________________________________________________________'}
                  </p>
                )}
              </div>

              {/* Підпис */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '40%', border: 'none', textAlign: 'left', verticalAlign: 'bottom', padding: 0 }}>
                      {userPos}
                    </td>
                    <td style={{ width: '20%', border: 'none', textAlign: 'center', verticalAlign: 'bottom', padding: 0 }}>
                      
                    </td>
                    <td style={{ width: '40%', border: 'none', textAlign: 'right', verticalAlign: 'bottom', padding: 0 }}>
                      {today}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: 'none', textAlign: 'left', verticalAlign: 'top', paddingTop: '15px', paddingBottom: 0 }}>
                      {userRank.toLowerCase()}
                    </td>
                    <td style={{ border: 'none', textAlign: 'center', verticalAlign: 'bottom', paddingTop: '15px', paddingBottom: 0, position: 'relative' }}>
                      {((user as any)?.signature) ? (
                        <img src={(user as any).signature} alt="Підпис" style={{ maxHeight: '40px', display: 'inline-block', marginBottom: '-10px' }} />
                      ) : (
                        '________________'
                      )}
                    </td>
                    <td style={{ border: 'none', textAlign: 'right', verticalAlign: 'bottom', paddingTop: '15px', paddingBottom: 0 }}>
                      {userName}
                    </td>
                  </tr>
                </tbody>
              </table>
              </>
              ) : (
                <div style={{ border: '3px solid black', padding: '20px', fontSize: '14pt', fontFamily: 'Arial, sans-serif', height: '100%' }}>
                  <h2 style={{ textAlign: 'center', borderBottom: '3px solid black', paddingBottom: '15px', marginTop: 0, fontSize: '20pt', fontWeight: '900' }}>ПЕРВИННА МЕДИЧНА КАРТКА (ФОРМА 100)</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', marginTop: '20px' }}>
                    <div><strong>ПІБ / Позивний:</strong> <br/><span style={{ fontSize: '16pt' }}>{userName}</span></div>
                    <div><strong>Дата та час поранення:</strong> <br/><span style={{ fontSize: '16pt' }}>{medDetails.time ? new Date(medDetails.time).toLocaleString('uk-UA') : '___:___ __.__.20__'}</span></div>
                  </div>
                  <div style={{ borderTop: '2px solid black', paddingTop: '15px', marginBottom: '20px' }}>
                    <strong>Механізм травми:</strong> <span style={{ fontSize: '16pt' }}>{medDetails.mechanism || '__________________'}</span>
                  </div>
                  <div style={{ borderTop: '2px solid black', paddingTop: '15px', marginBottom: '20px', minHeight: '80px' }}>
                    <strong>Локалізація та опис травм:</strong> <br/> <span style={{ fontSize: '14pt' }}>{medDetails.injuries || '____________________________________________________________________'}</span>
                  </div>
                  <div style={{ borderTop: '2px solid black', paddingTop: '15px', marginBottom: '20px', color: '#cc0000' }}>
                    <strong>Турнікет (Час накладання):</strong> <span style={{ fontSize: '18pt', fontWeight: 'bold' }}>{medDetails.tourniquetTime || 'НЕ НАКЛАДАВСЯ / ___:___'}</span>
                  </div>
                  <div style={{ borderTop: '2px solid black', paddingTop: '15px', marginBottom: '40px', minHeight: '60px' }}>
                    <strong>Медикаменти (Знеболювальні/Антибіотики):</strong> <br/> <span style={{ fontSize: '14pt' }}>{medDetails.meds || '____________________________________________________'}</span>
                  </div>
                  <div style={{ borderTop: '2px solid black', paddingTop: '20px', marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>Медик (ПІБ/Позивний):</strong> ____________________</span>
                    <span><strong>Підпис:</strong> ____________________</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};