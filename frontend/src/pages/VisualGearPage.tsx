import React, { useState, useEffect } from 'react';

export const VisualGearPage: React.FC = () => {
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [rot, setRot] = useState({ x: -10, y: -30 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const gearTips: Record<string, { title: string, tip: string, bad: string }> = {
    shoulder_l: { title: 'ЛІВА ЛЯМКА (ПЛЕЧЕ)', tip: 'Турнікет (ТК). Завжди у відкритому доступі. Резинки кріплення не повинні перетискати вороток.', bad: 'Закривати турнікет у підсумок на блискавці або ховати глибоко під броню.' },
    shoulder_r: { title: 'ПРАВА ЛЯМКА (ПЛЕЧЕ)', tip: 'Другий турнікет (ТК). Доступний для неробочої руки. Може кріпитися горизонтально або вертикально.', bad: 'Примотувати турнікет скотчем або ізострічкою так, щоб його неможливо було зірвати.' },
    chest_admin: { title: 'ГРУДНА ПАНЕЛЬ', tip: 'Невеликий адмін-підсумок (документи, блокнот, маркер), телефон на відкидній панелі або просто велкро для патчів/ідентифікаторів.', bad: 'Вішати сюди об\'ємні підсумки (магазини/утилітарки) — вони завадять вам залягти в окоп або цілитися лежачи.' },
    abdomen_mags: { title: 'ОСНОВНА ПАНЕЛЬ (ЖИВІТ)', tip: 'Основні магазини (3-4 шт) у плоских відкритих або закритих підсумках. Найшвидший доступ для екстреної перезарядки.', bad: 'Перевантажувати живіт гранатами або дворядними підсумками — це унеможливить ведення вогню лежачи.' },
    groin: { title: 'НАПАШНИК (ЖИВІТ / ПАХ)', tip: 'Додаткова медицина (бандаж, ножиці), маркерні вогні або запасні батареї. Слугує додатковим балістичним захистом паху.', bad: 'Класти туди важкі предмети — при швидкому бігу напашник буде боляче бити по ногах.' },
    side_left: { title: 'ЛІВИЙ КАМЕРБАНД (БІК)', tip: 'Для правші: рація (ближче до грудей/обличчя для швидкого доступу до тангенти), підсумки під гранати або 1-2 додаткових магазини.', bad: 'Вішати гранати близько до робочої руки, де зброя на ремені може випадково зачепити чеку.' },
    side_right: { title: 'ПРАВИЙ КАМЕРБАНД (БІК)', tip: 'Утилітарний підсумок, аптечка 2-го ешелону, гранати.', bad: 'Розміщувати предмети, що заважають вихоплювати вторинну зброю (пістолет), якщо вона є.' },
    backpack: { title: 'ШТУРМОВИЙ РЮКЗАК (СПИНА)', tip: 'Гідратор (вода), сухпай, запасний БК, тепловізор. Кріпиться системою MOLLE на спину або вдягається поверх броні лямками.', bad: 'Перевантажувати спину важким залізом — це порушить баланс плитоноски і вона буде "душити" вас спереду.' },
    belt_ifak: { title: 'АПТЕЧКА (IFAK) НА РПС', tip: 'Розміщується ззаду на поясі (РПС). Обов\'язково на ВІДРИВНІЙ платформі (велкро), щоб ви могли зірвати її та перемістити перед собою для роботи двома руками.', bad: 'Класти в медичний підсумок вологі серветки, снікерси чи інші немедичні речі.' },
    drop_pouch: { title: 'СКИДАЧ МАГАЗИНІВ', tip: 'Розміщується ззаду або збоку (під неробочу руку). Потрібен для швидкого скидання порожніх магазинів наосліп під час бою.', bad: 'Кріпити спереду — заважатиме при бігу та присіданнях.' },
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    setRot(prev => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5
    }));
    
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  return (
    <div className="animate-fade-in-up pb-12 overflow-x-hidden relative min-h-[calc(100vh-5rem)]">
      {/* 3D Styles */}
      <style>{`
        .perspective-container { perspective: 1200px; margin: 0 auto; width: 260px; height: 380px; }
        .cube { width: 100%; height: 100%; position: absolute; transform-style: preserve-3d; }
        .face { position: absolute; display: block; border: 2px solid #333; background: rgba(10, 10, 10, 0.95); box-shadow: inset 0 0 40px rgba(0,0,0,0.9); }
        .face-front { width: 260px; height: 380px; transform: rotateY(0deg) translateZ(80px); border-radius: 16px; }
        .face-back { width: 260px; height: 380px; transform: rotateY(180deg) translateZ(80px); border-radius: 16px; }
        .face-right { width: 160px; height: 360px; left: 50px; top: 10px; transform: rotateY(90deg) translateZ(128px); background: #0f0f0f; }
        .face-left { width: 160px; height: 360px; left: 50px; top: 10px; transform: rotateY(-90deg) translateZ(128px); background: #0f0f0f; }
        .face-top { width: 260px; height: 160px; top: 110px; transform: rotateX(90deg) translateZ(190px); background: #111; border-radius: 16px; }
        .face-bottom { width: 260px; height: 160px; top: 110px; transform: rotateX(-90deg) translateZ(190px); background: #050505; border-radius: 16px; }
        
        .slot-btn { position: absolute; border: 2px dashed #444; background: #111; color: #888; font-family: monospace; font-size: 10px; font-weight: bold; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .slot-btn:hover { border-color: var(--ab3-gold); color: white; transform: scale(1.02); z-index: 50; background: #1a1a1a; box-shadow: 0 0 15px rgba(201,162,39,0.2); }
        .active-slot { border-color: var(--ab3-gold) !important; background-color: var(--ab3-gold) !important; color: black !important; box-shadow: 0 0 20px rgba(201,162,39,0.5) !important; transform: scale(1.05); z-index: 60; }
        .grid-pattern { background-image: linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px); background-size: 20px 20px; opacity: 0.2; position: absolute; inset: 0; pointer-events: none; }
      `}</style>

      <div className="mb-10 text-center relative z-10">
        <h1 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-widest text-white mb-2 glitch-hover drop-shadow-lg">
          ТАКТИЧНИЙ 3D КОНСТРУКТОР
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--ab3-gold)]">
          // ВІЛЬНЕ ОБЕРТАННЯ: ЗАТИСНІТЬ ТА ПОТЯГНІТЬ МИШКОЮ //
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2 mb-12 relative z-10">
        <button onClick={() => setRot({ x: 0, y: 0 })} className="px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest bg-[#111] border border-[#333] text-gray-400 hover:text-white hover:border-[#555]">Спереду</button>
        <button onClick={() => setRot({ x: 0, y: -90 })} className="px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest bg-[#111] border border-[#333] text-gray-400 hover:text-white hover:border-[#555]">Праворуч</button>
        <button onClick={() => setRot({ x: 0, y: -180 })} className="px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest bg-[#111] border border-[#333] text-gray-400 hover:text-white hover:border-[#555]">Ззаду</button>
        <button onClick={() => setRot({ x: 0, y: 90 })} className="px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest bg-[#111] border border-[#333] text-gray-400 hover:text-white hover:border-[#555]">Ліворуч</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 max-w-7xl mx-auto">
        {/* 3D SCENE */}
        <div 
          className={`w-full lg:w-1/2 flex items-center justify-center min-h-[500px] relative border border-[#333] bg-[#050505] shadow-[8px_8px_0_0_#111] overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
        >
          <div className="absolute top-4 left-4 text-xs font-mono text-[var(--ab3-gold)] animate-pulse">🖱️ DRAG TO ROTATE</div>
          
          <div className="perspective-container">
            <div className="cube" style={{ transform: `translateZ(-150px) rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transition: isDragging ? 'none' : 'transform 0.5s ease-out' }}>
              
              {/* FRONT FACE */}
              <div className="face face-front">
                <div className="grid-pattern"></div>
                {/* Shoulders */}
                <button onClick={() => setActiveSlot('shoulder_l')} className={`slot-btn ${activeSlot === 'shoulder_l' ? 'active-slot' : 'border-red-900/50 text-red-500'}`} style={{ top: '10px', left: '20px', width: '60px', height: '80px' }}>ТК (Л)</button>
                <button onClick={() => setActiveSlot('shoulder_r')} className={`slot-btn ${activeSlot === 'shoulder_r' ? 'active-slot' : 'border-red-900/50 text-red-500'}`} style={{ top: '10px', right: '20px', width: '60px', height: '80px' }}>ТК (П)</button>
                
                {/* Chest / Admin */}
                <button onClick={() => setActiveSlot('chest_admin')} className={`slot-btn ${activeSlot === 'chest_admin' ? 'active-slot' : ''}`} style={{ top: '100px', left: '30px', right: '30px', height: '60px' }}>АДМІНКА / ПАТЧІ</button>
                
                {/* Abdomen / Mags */}
                <button onClick={() => setActiveSlot('abdomen_mags')} className={`slot-btn ${activeSlot === 'abdomen_mags' ? 'active-slot' : ''}`} style={{ top: '170px', left: '10px', right: '10px', height: '120px' }}>
                  <span className="mb-2">ОСНОВНИЙ БК (МАГАЗИНИ)</span>
                  <div className="flex gap-2">
                    <div className="w-12 h-16 border border-gray-600 bg-[#0a0a0a]"></div>
                    <div className="w-12 h-16 border border-gray-600 bg-[#0a0a0a]"></div>
                    <div className="w-12 h-16 border border-gray-600 bg-[#0a0a0a]"></div>
                  </div>
                </button>

                {/* Groin */}
                <button onClick={() => setActiveSlot('groin')} className={`slot-btn rounded-b-full ${activeSlot === 'groin' ? 'active-slot' : ''}`} style={{ top: '300px', left: '40px', right: '40px', height: '70px' }}>НАПАШНИК</button>
              </div>

              {/* BACK FACE */}
              <div className="face face-back">
                <div className="grid-pattern"></div>
                {/* Backpack */}
                <button onClick={() => setActiveSlot('backpack')} className={`slot-btn ${activeSlot === 'backpack' ? 'active-slot' : ''}`} style={{ top: '20px', left: '20px', right: '20px', height: '240px' }}>РЮКЗАК / ГІДРАТОР</button>
                
                {/* Lower Belt */}
                <div className="absolute top-[280px] left-2 right-2 flex justify-center gap-3">
                   <button onClick={() => setActiveSlot('drop_pouch')} className={`slot-btn relative ${activeSlot === 'drop_pouch' ? 'active-slot' : 'border-blue-900/50 text-blue-500'}`} style={{ width: '80px', height: '80px' }}>СКИДАЧ</button>
                   <button onClick={() => setActiveSlot('belt_ifak')} className={`slot-btn relative ${activeSlot === 'belt_ifak' ? 'active-slot' : 'border-red-900/50 text-red-500'}`} style={{ width: '120px', height: '80px' }}>АПТЕЧКА (IFAK)</button>
                </div>
              </div>

              {/* RIGHT FACE */}
              <div className="face face-right">
                <div className="grid-pattern"></div>
                <button onClick={() => setActiveSlot('side_right')} className={`slot-btn ${activeSlot === 'side_right' ? 'active-slot' : ''}`} style={{ top: '80px', left: '10px', right: '10px', height: '180px' }}>
                  <span className="mb-2 text-center">ПРАВИЙ БІК<br/><span className="text-[8px] opacity-70">(Утилітарки/Гранати)</span></span>
                  <div className="flex flex-col gap-2">
                    <div className="w-20 h-10 border border-gray-600 bg-[#0a0a0a] rounded"></div>
                    <div className="w-10 h-10 border border-gray-600 bg-[#0a0a0a] rounded-full mx-auto"></div>
                  </div>
                </button>
              </div>

              {/* LEFT FACE */}
              <div className="face face-left">
                <div className="grid-pattern"></div>
                <button onClick={() => setActiveSlot('side_left')} className={`slot-btn ${activeSlot === 'side_left' ? 'active-slot' : ''}`} style={{ top: '80px', left: '10px', right: '10px', height: '180px' }}>
                  <span className="mb-2 text-center">ЛІВИЙ БІК<br/><span className="text-[8px] opacity-70">(Рація/Гранати)</span></span>
                  <div className="flex flex-col gap-2">
                    <div className="w-10 h-16 border border-gray-600 bg-[#0a0a0a] mx-auto relative"><div className="absolute -top-3 right-1 w-1 h-4 bg-gray-500"></div></div>
                    <div className="w-10 h-10 border border-gray-600 bg-[#0a0a0a] rounded-full mx-auto"></div>
                  </div>
                </button>
              </div>

              {/* TOP / BOTTOM SOLID PLATES */}
              <div className="face face-top"><div className="grid-pattern"></div></div>
              <div className="face face-bottom"><div className="grid-pattern"></div></div>

            </div>
          </div>
        </div>

        {/* INFO PANEL */}
        <div className="w-full lg:w-1/2">
          <div className="h-full p-8 bg-[#0a0a0a] border border-[#333] shadow-[8px_8px_0_0_#111] flex flex-col">
            {activeSlot ? (
              <div className="animate-fade-in-up flex-1 flex flex-col">
                <h3 className="text-3xl font-heading font-black uppercase tracking-widest text-white mb-6 border-b border-[#222] pb-6">{gearTips[activeSlot].title}</h3>
                
                <div className="mb-6 bg-green-950/20 border border-green-900 border-l-4 border-l-green-500 p-6 shadow-inner">
                  <p className="font-mono text-sm text-green-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-2"><span className="text-xl">✓</span> Оптимальне розміщення:</p>
                  <p className="text-gray-300 text-base leading-relaxed text-justify">{gearTips[activeSlot].tip}</p>
                </div>

                <div className="bg-red-950/20 border border-red-900 border-l-4 border-l-red-500 p-6 shadow-inner">
                  <p className="font-mono text-sm text-red-500 uppercase tracking-widest mb-3 font-bold flex items-center gap-2"><span className="text-xl">⚠️</span> Критичні помилки:</p>
                  <p className="text-gray-300 text-base leading-relaxed text-justify">{gearTips[activeSlot].bad}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 border-2 border-dashed border-[#333] p-10">
                <div className="text-7xl mb-6 grayscale">🪖</div>
                <h3 className="text-2xl font-heading font-black uppercase tracking-widest text-white mb-3">ОБЕРІТЬ ЕЛЕМЕНТ</h3>
                <p className="font-mono text-sm uppercase tracking-widest text-gray-400 max-w-sm">Наведіть курсор на зону екіпірування на 3D моделі для отримання військових інструкцій</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};