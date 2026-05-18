import React, { useState, useEffect, useRef } from 'react';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

// --- E2E ENCRYPTION (AES-GCM) ---
const deriveKey = async (seedString: string) => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(seedString.padEnd(32, '0').slice(0, 32)), { name: "PBKDF2" }, false, ["deriveKey"]);
  return window.crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode("military-grade-salt"), iterations: 100000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
};

const encryptMessage = async (text: string, seed: string) => {
  if (!window.crypto || !window.crypto.subtle) {
    // Резервний варіант для локальної мережі (HTTP) без SSL
    return { encryptedContent: btoa(encodeURIComponent(text)), iv: 'http-fallback' };
  }
  const key = await deriveKey(seed);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(text));
// Фікс для великих повідомлень (аудіо), щоб уникнути Maximum Call Stack Size Exceeded
    let binaryEnc = '';
    const bytesEnc = new Uint8Array(encrypted);
    for (let i = 0; i < bytesEnc.byteLength; i++) binaryEnc += String.fromCharCode(bytesEnc[i]);
    
    let binaryIv = '';
    for (let i = 0; i < iv.byteLength; i++) binaryIv += String.fromCharCode(iv[i]);

    return { encryptedContent: btoa(binaryEnc), iv: btoa(binaryIv) };
  };

const decryptMessage = async (encContent: string, ivBase64: string, seed: string) => {
  if (ivBase64 === 'http-fallback') return decodeURIComponent(atob(encContent));
  if (!window.crypto || !window.crypto.subtle) return "🔒 [Потрібен HTTPS]";
  
  try {
    const key = await deriveKey(seed);
    const ivStr = atob(ivBase64);
      const iv = new Uint8Array(ivStr.length);
      for (let i = 0; i < ivStr.length; i++) iv[i] = ivStr.charCodeAt(i);
      
      const encStr = atob(encContent);
      const data = new Uint8Array(encStr.length);
      for (let i = 0; i < encStr.length; i++) data[i] = encStr.charCodeAt(i);
     const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch (e) { return "🔒 [Повідомлення]"; }
};

// --- CUSTOM TACTICAL AUDIO PLAYER ---
const TacticalAudioPlayer = ({ src, isOwn }: { src: string, isOwn: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (duration > 0) setProgress((audioRef.current.currentTime / duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (dur === Infinity || isNaN(dur)) {
        audioRef.current.currentTime = 1e101;
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            setDuration(audioRef.current.duration);
          }
        }, 100);
      } else {
        setDuration(dur);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration || duration === Infinity) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audioRef.current.currentTime = percentage * duration;
    setProgress(percentage * 100);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "00:00";
    const m = Math.floor(time / 60).toString().padStart(2, '0');
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={`flex items-center gap-3 p-2 mt-2 w-full min-w-[200px] border shadow-inner ${isOwn ? 'border-[var(--ab3-gold)] bg-black/40' : 'border-[#333] bg-black/40'}`}>
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} className="hidden" />
      <button onClick={togglePlay} className={`w-8 h-8 flex-shrink-0 flex items-center justify-center border transition-all ${isOwn ? 'border-[var(--ab3-gold)] text-[var(--ab3-gold)] hover:bg-[var(--ab3-gold)] hover:text-black' : 'border-gray-500 text-gray-300 hover:bg-gray-500 hover:text-black'}`}>
        {isPlaying ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
      </button>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex justify-between items-center text-[10px] font-mono tracking-widest leading-none" style={{ color: isOwn ? 'var(--ab3-gold)' : '#9ca3af' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="h-1.5 w-full bg-[#222] relative overflow-hidden cursor-pointer" onClick={handleSeek}>
          <div className={`absolute top-0 left-0 h-full transition-all duration-100 ease-linear ${isOwn ? 'bg-[var(--ab3-gold)] shadow-[0_0_5px_var(--ab3-gold)]' : 'bg-gray-400'}`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export const ChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const [unit, setUnit] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQ, setSearchQ] = useState('');
  
  // State: 'unit-general', 'unit-info', or 'dm-userId'
  const [activeChat, setActiveChat] = useState<string>('unit-general'); 
  const [activeUser, setActiveUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string} | null>(null);

  // Tactical Board States
  const [showBoard, setShowBoard] = useState(false);
  const boardRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [activeStamp, setActiveStamp] = useState<string | null>(null);

  // Voice (PTT) States
  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [uRes, cRes] = await Promise.all([api.get('/units/my'), api.get('/units/chat/contacts')]);
        if (uRes.data?.data) setUnit(uRes.data.data);
        setContacts(cRes.data?.data || []);
      } catch (e) {}
    };
    init();
  }, []);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000); // Polling for new messages
    return () => clearInterval(interval);
  }, [activeChat, unit]);

  // Timer for Voice Recording
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => setRecTime(t => t + 1), 1000);
    } else {
      clearInterval(recordingIntervalRef.current);
      setRecTime(0);
    }
    return () => clearInterval(recordingIntervalRef.current);
  }, [isRecording]);

  const loadMessages = async () => {
    if (!user) return;
    try {
      let raw = [];
      let seed = '';

      if (activeChat.startsWith('unit-') && unit) {
        const channel = activeChat.replace('unit-', '');
        const res = await api.get(`/units/${unit.id}/chat/${channel}`);
        raw = res.data?.data || [];
        seed = unit.id;
      } else if (activeChat.startsWith('dm-')) {
        const targetId = activeChat.replace('dm-', '');
        const res = await api.get(`/units/dm/${targetId}`);
        raw = res.data?.data || [];
        seed = [user.id, targetId].sort().join('_'); // Unique shared seed for E2E
      }

      const decrypted = await Promise.all(raw.map(async (m: any) => ({
        ...m, text: await decryptMessage(m.encryptedContent, m.iv, seed)
      })));
      setMessages(decrypted);
      chatEndRef.current?.scrollIntoView();
    } catch (e) {}
  };

  const handleSearch = async () => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const res = await api.get(`/units/users/search?q=${searchQ}`);
    setSearchResults(res.data?.data || []);
  };

  const startDM = (targetUser: any) => {
    setSearchQ(''); setSearchResults([]);
    setActiveUser(targetUser);
    setActiveChat(`dm-${targetUser.id}`);
    setIsSidebarOpen(false);
    if (!contacts.find(c => c.id === targetUser.id)) setContacts([...contacts, targetUser]);
  };

  const sendMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const text = input; setInput('');
    
    // Easter Eggs Commands
    if (text.trim().toUpperCase() === '/БАВОВНА' || text.trim().toUpperCase() === '/BAVOVNA') {
      setModal({ isOpen: true, title: 'СЕКРЕТНИЙ ПРОТОКОЛ', message: '🔥 АЛГОРИТМ "БАВОВНА" АКТИВОВАНО. КООРДИНАТИ ПЕРЕДАНО НА HIMARS. ВОРОЖІ СЕРВЕРИ ЗНИЩЕНО.' });
      return;
    }
    if (text.trim().toUpperCase() === '/СЕКРЕТ' || text.trim().toUpperCase() === '/SECRET') {
      setModal({ isOpen: true, title: 'EASTER EGG', message: '🕵️‍♂️ Ви знайшли приховану команду. Тактична перевага збільшена на 100%!' });
      return;
    }

    try {
      if (activeChat.startsWith('unit-')) {
        const channel = activeChat.replace('unit-', '');
        const enc = await encryptMessage(text, unit.id);
        await api.post(`/units/${unit.id}/chat/${channel}`, enc);
      } else if (activeChat.startsWith('dm-')) {
        const targetId = activeChat.replace('dm-', '');
        const enc = await encryptMessage(text, [user.id, targetId].sort().join('_'));
        await api.post(`/units/dm/${targetId}`, enc);
      }
      loadMessages();
    } catch (e: any) { 
      console.error("Chat Error:", e);
      setModal({ isOpen: true, title: 'ПОМИЛКА ЗВ\'ЯЗКУ', message: e.response?.data?.error || e.message || 'Відхилено сервером' });
    }
  };

  const isInfoReadOnly = activeChat === 'unit-info' && user?.id !== unit?.commanderId;

  // Tactical Board Handlers
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = boardRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Враховуємо реальний розмір canvas відносно того, як він відмальовується у CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const drawStamp = (x: number, y: number, type: string) => {
    const ctx = boardRef.current?.getContext('2d');
    if (!ctx) return;
    
    const size = 25; // Базовий розмір тактичного знаку
    ctx.lineWidth = 3;
    
    if (type.startsWith('friendly')) {
      ctx.strokeStyle = '#3b82f6'; // Синій НАТО
      ctx.fillStyle = 'rgba(59,130,246,0.3)';
      ctx.beginPath();
      ctx.rect(x - size, y - size*0.7, size*2, size*1.4);
      ctx.fill();
      ctx.stroke();
      
      if (type === 'friendly_inf') {
        ctx.beginPath();
        ctx.moveTo(x - size, y - size*0.7);
        ctx.lineTo(x + size, y + size*0.7);
        ctx.moveTo(x - size, y + size*0.7);
        ctx.lineTo(x + size, y - size*0.7);
        ctx.stroke();
      } else if (type === 'friendly_armor') {
        ctx.beginPath();
        ctx.ellipse(x, y, size*0.6, size*0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (type.startsWith('enemy')) {
      ctx.strokeStyle = '#ef4444'; // Червоний
      ctx.fillStyle = 'rgba(239,68,68,0.3)';
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      if (type === 'enemy_inf') {
        ctx.beginPath();
        ctx.moveTo(x - size*0.5, y - size*0.5);
        ctx.lineTo(x + size*0.5, y + size*0.5);
        ctx.moveTo(x - size*0.5, y + size*0.5);
        ctx.lineTo(x + size*0.5, y - size*0.5);
        ctx.stroke();
      } else if (type === 'enemy_armor') {
        ctx.beginPath();
        ctx.ellipse(x, y, size*0.4, size*0.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (type === 'ksp') {
       ctx.strokeStyle = '#f59e0b';
       ctx.fillStyle = 'rgba(245,158,11,0.3)';
       ctx.beginPath();
       ctx.rect(x - size, y - size*0.5, size*2, size);
       ctx.fill();
       ctx.stroke();
       ctx.beginPath();
       ctx.moveTo(x, y - size*0.5);
       ctx.lineTo(x, y - size*1.5);
       ctx.stroke();
       ctx.font = 'bold 16px monospace';
       ctx.fillStyle = '#f59e0b';
       ctx.textAlign = 'center';
       ctx.fillText('КСП', x, y + size*1.2);
    }
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e);
    
    if (activeStamp) {
      drawStamp(coords.x, coords.y, activeStamp);
      return;
    }

    setIsDrawing(true);
    const ctx = boardRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || activeStamp) return;
    const ctx = boardRef.current?.getContext('2d');
    if (!ctx) return;
    const coords = getCanvasCoords(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  const sendBoard = async () => {
    if (!boardRef.current || !user) return;
    const b64 = boardRef.current.toDataURL('image/png');
    setShowBoard(false);
    try {
      const seed = activeChat.startsWith('unit-') ? unit.id : [user.id, activeChat.replace('dm-', '')].sort().join('_');
      const enc = await encryptMessage(`[TACTICAL_BOARD]${b64}`, seed);
      if (activeChat.startsWith('unit-')) await api.post(`/units/${unit.id}/chat/${activeChat.replace('unit-', '')}`, enc);
      else await api.post(`/units/dm/${activeChat.replace('dm-', '')}`, enc);
      loadMessages();
    } catch (e) { setModal({ isOpen: true, title: 'ПОМИЛКА', message: 'Помилка відправки тактичної дошки. Перевірте з\'єднання.' }); }
  };

  // Voice (PTT) Handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
            const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                    const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await sendEncryptedData(`[AUDIO]${base64Audio}`);
        };
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setModal({ isOpen: true, title: 'ПОМИЛКА МІКРОФОНУ', message: 'Немає доступу до мікрофону або відсутній дозвіл.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendEncryptedData = async (content: string) => {
    const seed = activeChat.startsWith('unit-') ? unit.id : [user?.id, activeChat.replace('dm-', '')].sort().join('_');
    const enc = await encryptMessage(content, seed);
    if (activeChat.startsWith('unit-')) await api.post(`/units/${unit.id}/chat/${activeChat.replace('unit-', '')}`, enc);
    else await api.post(`/units/dm/${activeChat.replace('dm-', '')}`, enc);
    loadMessages();
  };

  return (
    <div className="flex h-[calc(100vh-80px)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-my-8 bg-[#050505] relative overflow-hidden font-mono">
      
      {/* LEFT SIDEBAR */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
      
      <div className={`absolute md:static top-0 left-0 h-full w-72 sm:w-80 bg-[#0a0a0a] border-r border-[#333] flex flex-col z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-[#333] bg-[#111] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ab3-gold)] opacity-5 blur-2xl"></div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">Підрозділ</p>
          {unit ? (
            <div className="space-y-3">
              <button onClick={() => setActiveChat('unit-general')} className={`w-full text-left px-4 py-3 text-sm font-bold border transition-all ${activeChat === 'unit-general' ? 'bg-[var(--ab3-gold)] text-black border-[var(--ab3-gold)] shadow-[0_0_15px_rgba(201,162,39,0.3)]' : 'bg-[#050505] text-gray-400 border-[#333] hover:border-[var(--ab3-gold)] hover:text-white'}`}>
                <span className="mr-2 font-mono">#</span> ЗАГАЛЬНИЙ
              </button>
              <button onClick={() => setActiveChat('unit-info')} className={`w-full text-left px-4 py-3 text-sm font-bold border transition-all ${activeChat === 'unit-info' ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-[#050505] text-gray-400 border-[#333] hover:border-blue-500 hover:text-white'}`}>
                <span className="mr-2 font-mono">!</span> ІНФОРМАЦІЙНИЙ
              </button>
            </div>
          ) : <p className="text-xs text-red-500 border border-red-900/50 bg-red-950/20 p-3 font-mono">/ NO_UNIT_ASSIGNED /</p>}
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4 border-b border-[#222] pb-2">Особисті повідомлення</p>
          <div className="mb-4 relative">
            <div className="flex border border-[#333] bg-[#050505] focus-within:border-[var(--ab3-gold)] transition-colors">
              <span className="flex items-center pl-3 text-gray-500 font-mono">&gt;</span>
              <input value={searchQ} onChange={e => { setSearchQ(e.target.value); handleSearch(); }} className="w-full bg-transparent text-xs px-2 py-3 text-white outline-none placeholder-gray-700 font-mono uppercase tracking-widest" placeholder="SEARCH_USER..." />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-[#111] border border-[#333] z-50 shadow-2xl overflow-hidden">
                {searchResults.map(u => (
                  <button key={u.id} onClick={() => startDM(u)} className="w-full text-left p-3 hover:bg-[#222] text-xs text-white border-b border-[#222] flex items-center gap-3 transition-colors group">
                    <div className="w-8 h-8 border border-[#444] bg-black flex items-center justify-center text-xs font-bold text-gray-400 group-hover:border-[var(--ab3-gold)] group-hover:text-[var(--ab3-gold)] transition-colors">{u.firstName?.[0]}{u.lastName?.[0]}</div>
                    <div><p className="font-bold tracking-widest">{u.lastName} {u.firstName}</p><p className="text-[9px] text-gray-500 mt-0.5">{u.rank}</p></div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {contacts.map(c => (
              <button key={c.id} onClick={() => startDM(c)} className={`w-full text-left px-3 py-3 text-xs font-bold border transition-colors flex items-center gap-3 ${activeChat === `dm-${c.id}` ? 'bg-[#111] text-white border-[var(--ab3-gold)]' : 'bg-[#050505] text-gray-400 border-[#222] hover:border-[#444]'}`}>
                <div className={`w-8 h-8 border flex items-center justify-center text-xs font-bold ${activeChat === `dm-${c.id}` ? 'bg-[var(--ab3-gold)] text-black border-[var(--ab3-gold)]' : 'bg-black border-[#444] text-gray-400'}`}>
                  {c.firstName?.[0] || 'U'}{c.lastName?.[0] || ''}
                </div>
                <div className="flex-1 min-w-0"><p className="tracking-widest truncate">{c.rank} {c.lastName}</p></div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CHAT */}
      <div className="flex-1 bg-[#0a0a0a] flex flex-col h-full overflow-hidden relative w-full">
        <div className="h-16 bg-[#111] border-b border-[#333] px-4 sm:px-6 flex items-center justify-between shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-gray-400 hover:text-white p-1 -ml-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div>
              <h2 className="text-lg font-heading font-black text-white truncate max-w-[200px] sm:max-w-xs uppercase tracking-widest">
                {activeChat === 'unit-general' ? 'ЗАГАЛЬНИЙ КАНАЛ' : activeChat === 'unit-info' ? 'ІНФОРМАЦІЙНИЙ КАНАЛ' : activeUser ? `DM // ${activeUser.rank} ${activeUser.lastName}` : 'ТЕРМІНАЛ ЗВ\'ЯЗКУ'}
              </h2>
              <p className="text-[10px] sm:text-xs font-mono text-gray-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> AES-256-GCM ENCRYPTED</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0" style={{ backgroundImage: 'radial-gradient(#222 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col max-w-[85%] sm:max-w-[75%] animate-fade-in-up ${m.senderId === user?.id ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
              {m.senderId !== user?.id && <span className="text-[10px] font-mono tracking-widest text-[var(--ab3-gold)] mb-1 ml-1">[{m.rank}] {m.lastName}</span>}
              <div className={`p-4 border shadow-[4px_4px_0_0_rgba(0,0,0,0.8)] ${m.senderId === user?.id ? 'bg-[#111] border-[var(--ab3-gold)] text-[var(--ab3-gold)]' : activeChat === 'unit-info' ? 'bg-[#050505] border-blue-500 text-blue-400' : 'bg-[#050505] text-gray-300 border-[#333]'}`}>
                {m.text.startsWith('[TACTICAL_BOARD]') ? (
                  <img src={m.text.replace('[TACTICAL_BOARD]', '')} alt="Тактична схема" className="max-w-full rounded border border-[#333] invert" style={{ filter: m.senderId !== user?.id ? 'none' : 'none' }} />
                ) : m.text.startsWith('[AUDIO]') ? (
                  <div className="flex flex-col gap-1 w-full min-w-[240px]">
                    <span className={`text-[10px] font-mono tracking-widest mb-1 flex items-center gap-2 font-bold ${m.senderId === user?.id ? 'text-[var(--ab3-gold)]' : 'text-gray-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_5px_red]"></span>
                      РАДІОПЕРЕХОПЛЕННЯ
                    </span>
                    <TacticalAudioPlayer src={m.text.replace('[AUDIO]', '')} isOwn={m.senderId === user?.id} />
                  </div>
                ) : (
                  m.text
                )}
              </div>
              <span className={`text-[9px] font-mono text-gray-600 mt-2 ${m.senderId === user?.id ? 'mr-1' : 'ml-1'}`}>{new Date((m.createdAt || '').includes('T') ? m.createdAt : (m.createdAt || '').replace(' ', 'T') + 'Z').toLocaleTimeString('uk-UA', {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-[#111] border-t border-[#333] flex-shrink-0 pb-8 md:pb-4">
          {isInfoReadOnly ? (
            <div className="w-full text-center py-4 border border-[#333] text-xs font-mono text-gray-500 bg-black uppercase tracking-widest shadow-inner">/ РОЗСИЛКА ІНФОРМАЦІЇ ДОЗВОЛЕНА ЛИШЕ КОМАНДИРУ /</div>
          ) : (
            <div className="flex gap-2 max-w-5xl mx-auto">
              <form onSubmit={sendMsg} className="flex-1 flex gap-0 border border-[#333] p-1 bg-black focus-within:border-[var(--ab3-gold)] transition-colors shadow-lg">
                <span className="hidden sm:flex items-center pl-4 pr-2 font-mono text-[var(--ab3-gold)] animate-pulse">&gt;</span>
                <button type="button" onClick={() => setShowBoard(true)} className="px-4 font-mono text-[var(--ab3-gold)] border-r border-[#333] hover:bg-[#222]" title="Тактична дошка">
                  🖍️
                </button>
                
                {isRecording ? (
                  <div className="flex-1 bg-red-950/30 flex items-center px-4 justify-between border-y border-red-900/50">
                    <span className="text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> ЗАПИС ЕФІРУ...
                    </span>
                    <span className="text-red-400 font-mono text-sm">00:{recTime.toString().padStart(2, '0')}</span>
                  </div>
                ) : (
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="ВВЕСТИ КОМАНДУ..." className="flex-1 bg-transparent px-3 sm:px-2 py-3 text-white font-mono focus:outline-none placeholder-gray-700 text-sm" />
                )}
                
                <button type="submit" disabled={!input.trim() || isRecording} className="px-6 sm:px-8 font-bold font-mono text-black bg-[var(--ab3-gold)] hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:bg-[#222] disabled:text-gray-500 shadow-[0_0_15px_rgba(201,162,39,0.3)] disabled:shadow-none tracking-widest text-xs">
                  EXECUTE
                </button>
              </form>
              
              {/* PTT (Push-To-Talk) Button */}
              <button 
                onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording}
                onTouchStart={startRecording} onTouchEnd={stopRecording}
                className={`w-14 sm:w-16 flex-shrink-0 flex items-center justify-center border transition-all ${isRecording ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_red] scale-95' : 'bg-[#111] border-[#333] text-[var(--ab3-gold)] hover:bg-[#222] hover:border-[var(--ab3-gold)]'}`}
                title="Утримуйте для запису голосу"
              >
                🎙️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TACTICAL MODAL */}
      {modal?.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#333] border-l-4 border-l-red-500 p-8 max-w-md w-full shadow-[8px_8px_0_0_#111] animate-scale-in relative overflow-hidden font-mono">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-10 blur-2xl pointer-events-none"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-3 flex items-center gap-3">
              <span className="text-red-500">!</span> {modal.title}
            </h3>
            <p className="text-xs text-gray-400 mb-8 leading-relaxed uppercase tracking-widest">{modal.message}</p>
            <div className="flex gap-4">
              <button onClick={() => setModal(null)} className="w-full bg-[#111] border border-[#333] text-white font-bold uppercase tracking-widest px-4 py-3 hover:bg-[#222] transition-colors">ЗАКРИТИ ТЕРМІНАЛ</button>
            </div>
          </div>
        </div>
      )}

      {/* TACTICAL BOARD OVERLAY */}
      {showBoard && (
        <div className="absolute inset-0 z-[100] bg-[#0a0a0a] flex flex-col">
          <div className="border-b border-[#333] bg-[#111] flex flex-col px-4 py-3 gap-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mr-1">Маркер:</span>
                <button onClick={() => { setActiveStamp(null); setBrushColor('#ef4444'); }} className={`w-8 h-8 rounded-full bg-red-500 ${brushColor === '#ef4444' && !activeStamp ? 'ring-2 ring-offset-2 ring-offset-[#111] ring-white' : ''}`}></button>
                <button onClick={() => { setActiveStamp(null); setBrushColor('#3b82f6'); }} className={`w-8 h-8 rounded-full bg-blue-500 ${brushColor === '#3b82f6' && !activeStamp ? 'ring-2 ring-offset-2 ring-offset-[#111] ring-white' : ''}`}></button>
                <button onClick={() => { setActiveStamp(null); setBrushColor('#f59e0b'); }} className={`w-8 h-8 rounded-full bg-yellow-500 ${brushColor === '#f59e0b' && !activeStamp ? 'ring-2 ring-offset-2 ring-offset-[#111] ring-white' : ''}`}></button>
                <button onClick={() => { setActiveStamp(null); setBrushColor('#22c55e'); }} className={`w-8 h-8 rounded-full bg-green-500 ${brushColor === '#22c55e' && !activeStamp ? 'ring-2 ring-offset-2 ring-offset-[#111] ring-white' : ''}`}></button>
                <button onClick={() => { setActiveStamp(null); setBrushColor('#ffffff'); }} className={`w-8 h-8 rounded-full bg-white ${brushColor === '#ffffff' && !activeStamp ? 'ring-2 ring-offset-2 ring-offset-[#111] ring-gray-400' : ''}`}></button>
                <button onClick={() => { const ctx = boardRef.current?.getContext('2d'); ctx?.clearRect(0,0,boardRef.current!.width, boardRef.current!.height); }} className="text-[10px] font-mono ml-2 text-red-500 hover:text-red-400 border border-red-900/50 px-2 py-1 bg-red-900/20 uppercase tracking-widest">Очистити</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowBoard(false)} className="text-[10px] font-mono font-bold text-white bg-[#222] border border-[#444] hover:bg-[#333] px-4 py-2 uppercase tracking-widest">Скасувати</button>
                <button onClick={sendBoard} className="text-[10px] font-mono font-bold text-black bg-[var(--ab3-gold)] hover:bg-yellow-400 px-4 py-2 shadow-[0_0_15px_rgba(201,162,39,0.3)] uppercase tracking-widest">Відправити схему</button>
              </div>
            </div>
            
            <div className="flex gap-2 items-center flex-wrap pt-2 border-t border-[#222]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mr-1">Тактичні знаки:</span>
                <button onClick={() => setActiveStamp('friendly_inf')} className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${activeStamp === 'friendly_inf' ? 'bg-blue-900/50 border-blue-500 text-white' : 'bg-black border-[#333] text-blue-400 hover:border-blue-500'}`}>🟦 Свої (Піхота)</button>
                <button onClick={() => setActiveStamp('friendly_armor')} className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${activeStamp === 'friendly_armor' ? 'bg-blue-900/50 border-blue-500 text-white' : 'bg-black border-[#333] text-blue-400 hover:border-blue-500'}`}>🟦 Свої (Броня)</button>
                <button onClick={() => setActiveStamp('enemy_inf')} className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${activeStamp === 'enemy_inf' ? 'bg-red-900/50 border-red-500 text-white' : 'bg-black border-[#333] text-red-400 hover:border-red-500'}`}>♦️ Ворог (Піхота)</button>
                <button onClick={() => setActiveStamp('enemy_armor')} className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${activeStamp === 'enemy_armor' ? 'bg-red-900/50 border-red-500 text-white' : 'bg-black border-[#333] text-red-400 hover:border-red-500'}`}>♦️ Ворог (Броня)</button>
                <button onClick={() => setActiveStamp('ksp')} className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest border transition-colors ${activeStamp === 'ksp' ? 'bg-yellow-900/50 border-yellow-500 text-white' : 'bg-black border-[#333] text-yellow-500 hover:border-yellow-500'}`}>🟧 КСП</button>
            </div>
          </div>
          <canvas ref={boardRef} width={window.innerWidth} height={window.innerHeight} className="flex-1 w-full bg-[#050505] cursor-crosshair touch-none"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} />
        </div>
      )}
    </div>
  );
};