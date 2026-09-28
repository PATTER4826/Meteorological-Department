/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * AI Emergency Assistant & Situational Briefing Drawer
 */

import React, { useState } from 'react';
import { SituationalSummary, NormalizedEvent } from '../../shared/types.ts';
import { Bot, Send, Sparkles, X, RefreshCw, AlertCircle, ShieldCheck, HelpCircle } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SituationalSummary | null;
  events: NormalizedEvent[];
  onRefreshSummary: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  summary,
  events,
  onRefreshSummary
}) => {
  const [activeTab, setActiveTab] = useState<'BRIEFING' | 'CHAT'>('BRIEFING');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'สวัสดีครับ ผมคือระบบ AI วิเคราะห์ภัยพิบัติประจำศูนย์ THAI WEATHER & DISASTER AI CENTER ท่านสามารถสอบถามสถานการณ์ภัยพิบัติ สภาพอากาศ ค่าฝุ่น PM2.5 หรือแผ่นดินไหวล่าสุดในประเทศไทยได้ โดยข้อมูลทั้งหมดจะอ้างอิงจากฐานข้อมูลสถานีตรวจวัดจริงในระบบครับ',
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'ตอนนี้ภาคอีสานมีภัยอะไรบ้าง',
    'จังหวัดไหนมี PM2.5 สูงเกินเกณฑ์',
    'วันนี้มีแผ่นดินไหวไหม',
    'สรุปสถานการณ์ประเทศไทยตอนนี้'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'ไม่มีข้อมูลเพียงพอสำหรับตอบคำถามนี้จากฐานข้อมูลปัจจุบัน',
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบ AI',
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-[1000] w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
              ศูนย์วิเคราะห์ AI อัจฉริยะ
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Gemini 3.8 Flash
              </span>
            </h3>
            <p className="text-xs text-slate-400">ประเมินความเสี่ยงและตอบข้อซักถามแบบมีหลักฐานอ้างอิง</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('BRIEFING')}
          className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'BRIEFING'
              ? 'border-purple-500 text-purple-300 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          สรุปภาพรวมรายวัน (Briefing)
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-3 text-center flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'CHAT'
              ? 'border-purple-500 text-purple-300 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          ถาม-ตอบสถานการณ์ (AI Chat)
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-sm">
        {activeTab === 'BRIEFING' ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                อัปเดตล่าสุด: {summary ? new Date(summary.updatedAt).toLocaleTimeString('th-TH') : '-'}
              </span>
              <button
                onClick={onRefreshSummary}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                รีเฟรชสรุป
              </button>
            </div>

            {/* Severity Counter Pills */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/40">
                <span className="block text-rose-400 font-bold text-lg font-mono">
                  {summary?.criticalCount || 0}
                </span>
                <span className="text-[11px] text-rose-300 font-medium">Critical</span>
              </div>
              <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-800/40">
                <span className="block text-amber-400 font-bold text-lg font-mono">
                  {summary?.warningCount || 0}
                </span>
                <span className="text-[11px] text-amber-300 font-medium">Warning</span>
              </div>
              <div className="p-2 rounded-xl bg-yellow-950/40 border border-yellow-800/40">
                <span className="block text-yellow-400 font-bold text-lg font-mono">
                  {summary?.watchCount || 0}
                </span>
                <span className="text-[11px] text-yellow-300 font-medium">Watch</span>
              </div>
              <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-800/40">
                <span className="block text-blue-400 font-bold text-lg font-mono">
                  {summary?.infoCount || 0}
                </span>
                <span className="text-[11px] text-blue-300 font-medium">Info</span>
              </div>
            </div>

            {/* Executive Headline */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                🇹🇭 หัวข้อรายงานสถานการณ์
              </span>
              <p className="text-sm font-semibold text-slate-100">
                {summary?.headlineTh}
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {summary?.situationOverviewTh}
              </p>
            </div>

            {/* Priority Zones */}
            {summary?.priorityZonesTh && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  📍 พื้นที่เฝ้าระวังพิเศษ
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {summary.priorityZonesTh.map((zone, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {zone}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Safety Directives */}
            {summary?.safetyDirectivesTh && (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex flex-col gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  แนวปฏิบัติความปลอดภัย
                </span>
                <ul className="flex flex-col gap-1 text-xs text-slate-300">
                  {summary.safetyDirectivesTh.map((dir, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{dir}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                ข้อมูลสรุปประมวลผลจาก API กรมอุตุนิยมวิทยา, USGS, กรมชลประทาน และ คพ. ด้วยโมเดล Gemini 3.8 Flash
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-3">
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors text-left"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/50 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-purple-400 italic py-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                  Gemini กำลังค้นหาข้อมูลและวิเคราะห์...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="พิมพ์คำถาม เช่น มีพายุเข้าไทยไหม..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !input.trim()}
                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
