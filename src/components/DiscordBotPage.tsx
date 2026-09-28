/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Dedicated Discord Bot Landing & Invite Page
 * หน้าเว็บไซต์บอทสำหรับเพิ่มเข้าเซิร์ฟเวอร์ Discord และตั้งค่าการแจ้งเตือน
 */

import React, { useState } from 'react';
import {
  Bot,
  ExternalLink,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Sparkles,
  Terminal,
  Radio,
  Bell,
  CheckCircle2,
  ChevronRight,
  Layers,
  ArrowRight,
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface DiscordBotPageProps {
  onSendTestWebhook?: (url: string) => Promise<boolean>;
}

export const DiscordBotPage: React.FC<DiscordBotPageProps> = ({ onSendTestWebhook }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [clientId, setClientId] = useState('123456789012345678');
  const [webhookInput, setWebhookInput] = useState('');
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);
  const [webhookFeedback, setWebhookFeedback] = useState<string | null>(null);

  // Active preview embed type
  const [previewType, setPreviewType] = useState<'EARTHQUAKE' | 'FLOOD' | 'STORM' | 'PM25'>('EARTHQUAKE');

  // Command runner state
  const [activeCommand, setActiveCommand] = useState<string>('/alerts');
  const [commandResult, setCommandResult] = useState<any>(null);
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);

  // Default permissions: Send Messages (2048), Embed Links (16384), Attach Files (32768), Use Slash Commands (2147483648)
  const permissionsInt = '2147534848';
  const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId.trim() || '123456789012345678'}&permissions=${permissionsInt}&scope=bot%20applications.commands`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleTestWebhookSend = async () => {
    if (!webhookInput.trim()) return;
    setIsSendingWebhook(true);
    setWebhookFeedback(null);

    try {
      const res = await fetch('/api/admin/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setWebhookFeedback('✅ ส่งข้อความแจ้งเตือนเข้าห้อง Discord ของคุณสำเร็จแล้ว! กรุณาตรวจสอบใน Discord');
      } else {
        setWebhookFeedback(`❌ ไม่สามารถส่งได้: ${data.message || 'กรุณาตรวจสอบความถูกต้องของ Webhook URL'}`);
      }
    } catch (err: any) {
      setWebhookFeedback(`❌ ข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const handleRunSlashCommand = async (cmd: string) => {
    setActiveCommand(cmd);
    setIsExecutingCmd(true);
    try {
      const res = await fetch('/api/discord/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      setCommandResult(data.response);
    } catch (err: any) {
      setCommandResult({ title: 'ข้อผิดพลาด', description: err.message });
    } finally {
      setIsExecutingCmd(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-900/40 p-6 sm:p-10 shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/40">
              <Bot className="w-3.5 h-3.5" />
              OFFICIAL DISCORD BOT & WEBHOOK INTEGRATION
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              🟢 พร้อมเชื่อมต่อ 24/7
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            เพิ่มบอทแจ้งเตือนภัยพิบัติ <br className="hidden sm:inline" />
            เข้าเซิร์ฟเวอร์ <span className="text-[#5865F2]">Discord</span> ของคุณ
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            รับการแจ้งเตือนแผ่นดินไหว น้ำท่วม พายุฝนฟ้าคะนอง และวิกฤตฝุ่น PM2.5 แบบเรียลไทม์ 
            พร้อมบทวิเคราะห์ความเสี่ยงจาก AI Gemini 3.8 Flash และคำแนะนำความปลอดภัย ส่งตรงถึงสมาชิกใน Discord ทันที
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#5865F2]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Bot className="w-5 h-5" />
              <span>เพิ่มบอทเข้า Discord (Add to Discord)</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleCopyInvite}
              className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center gap-2 border border-slate-700 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์เชิญ (Invite Link)'}</span>
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block">เวลาตอบสนอง:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">&lt; 3 วินาที</span>
            </div>
            <div>
              <span className="text-slate-400 block">รองรับ Slash Commands:</span>
              <span className="text-cyan-400 font-bold font-mono text-sm">8 คำสั่งหลัก</span>
            </div>
            <div>
              <span className="text-slate-400 block">ระบบ Anti-Spam:</span>
              <span className="text-purple-400 font-bold font-mono text-sm">Fingerprint Deduplication</span>
            </div>
            <div>
              <span className="text-slate-400 block">ความปลอดภัย:</span>
              <span className="text-amber-400 font-bold font-mono text-sm">ตรวจสอบแหล่งข้อมูลจริง</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Discord Embed Preview & Instant Webhook Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 cols): Interactive Discord Message Mockup */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#5865F2]" />
                ตัวอย่างการแจ้งเตือนจริงใน Discord (Live Embed Preview)
              </h2>
              <p className="text-xs text-slate-400">
                รูปแบบกล่องข้อความ Embed สวยงาม สีสันตรงตามระดับภัยพิบัติ พร้อมบทวิเคราะห์ AI
              </p>
            </div>

            {/* Switch preview type */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setPreviewType('EARTHQUAKE')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  previewType === 'EARTHQUAKE' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                แผ่นดินไหว
              </button>
              <button
                onClick={() => setPreviewType('FLOOD')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  previewType === 'FLOOD' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                น้ำท่วม
              </button>
              <button
                onClick={() => setPreviewType('STORM')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  previewType === 'STORM' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                พายุ
              </button>
              <button
                onClick={() => setPreviewType('PM25')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  previewType === 'PM25' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                PM2.5
              </button>
            </div>
          </div>

          {/* Discord Native Message Simulator */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#313338] border border-[#232428] shadow-2xl font-sans text-slate-200">
            {/* Discord Message Header */}
            <div className="flex items-start gap-3.5">
              {/* Bot Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-lg shrink-0 shadow-md">
                🇹🇭
              </div>

              <div className="flex flex-col flex-1 gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm hover:underline cursor-pointer">
                    Thai Disaster AI Center
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#5865F2] text-white">
                    BOT ✓
                  </span>
                  <span className="text-[11px] text-[#949BA4]">
                    วันนี้ เวลา 12:45 น.
                  </span>
                </div>

                <div className="text-xs text-[#DBDEE1]">
                  @everyone 🚨 แจ้งเตือนภัยพิบัติระดับวิกฤต (CRITICAL)
                </div>

                {/* Discord Embed Box */}
                {previewType === 'EARTHQUAKE' && (
                  <div className="mt-1 p-4 rounded-lg bg-[#2B2D31] border-l-4 border-l-[#DC2626] flex flex-col gap-3 max-w-xl">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      🚨 【 CRITICAL 】 🌏 แผ่นดินไหวขนาด M 6.2 อ.แม่ลาว จ.เชียงราย
                    </div>
                    <p className="text-xs text-[#DBDEE1] leading-relaxed">
                      ตรวจพบแผ่นดินไหวขนาด 6.2 ความลึก 10 กม. จุดศูนย์กลาง อ.แม่ลาว จ.เชียงราย รู้สึกสั่นไหวรุนแรงในหลายจังหวัดภาคเหนือ
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-[#949BA4] block font-semibold">📍 พื้นที่ / จังหวัด</span>
                        <span className="text-white">เชียงราย (อ.แม่ลาว)</span>
                      </div>
                      <div>
                        <span className="text-[#949BA4] block font-semibold">🕒 เวลาเกิดเหตุ</span>
                        <span className="text-white font-mono">เมื่อสักครู่</span>
                      </div>
                    </div>

                    <div className="text-xs bg-[#1E1F22] p-2.5 rounded border border-[#383A40]">
                      <span className="text-[#949BA4] block font-semibold mb-1">📊 ข้อมูลตรวจวัดทางการ:</span>
                      <div className="font-mono text-white text-[11px] flex flex-col gap-0.5">
                        <span>• <b>Magnitude:</b> 6.2</span>
                        <span>• <b>ความลึก:</b> 10 กม.</span>
                        <span>• <b>ระยะห่างจากแนวชายแดน:</b> ในประเทศไทย</span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="text-[#C4B5FD] block font-bold mb-1">🤖 AI Analysis (สรุปการประเมินโดย Gemini):</span>
                      <p className="text-[#DBDEE1] leading-relaxed">
                        แรงสั่นสะเทือนระดับรุนแรงอาจทำให้โครงสร้างอาคาร สิ่งปลูกสร้างเก่า หรือสะพานได้รับความเสียหาย และมีความเสี่ยงสูงที่จะเกิดอาฟเตอร์ช็อกตามมา
                      </p>
                    </div>

                    <div className="text-xs bg-rose-950/30 p-2.5 rounded border border-rose-900/40 text-rose-200">
                      <span className="font-bold block mb-1 text-rose-300">🛡️ คำแนะนำด้านความปลอดภัย:</span>
                      <span>• หากอยู่ในอาคาร หมอบ กำบัง ยึดให้แน่น (Drop, Cover, Hold On)</span><br />
                      <span>• หลีกเลี่ยงการใช้ลิฟต์และระวังสิ่งของตกหล่นจากที่สูง</span><br />
                      <span className="font-semibold text-rose-100">• ⚠️ โปรดติดตามประกาศและคำสั่งอย่างเป็นทางการจากหน่วยงานราชการ</span>
                    </div>

                    <div className="pt-2 border-t border-[#383A40] flex items-center justify-between text-[11px] text-[#949BA4]">
                      <span>แหล่งข้อมูล: <a href="https://earthquake.usgs.gov" className="text-[#00A8FC] hover:underline" target="_blank" rel="noreferrer">USGS Seismology & กรมอุตุนิยมวิทยา</a></span>
                      <span className="font-mono">THAI WEATHER & DISASTER AI CENTER</span>
                    </div>
                  </div>
                )}

                {previewType === 'FLOOD' && (
                  <div className="mt-1 p-4 rounded-lg bg-[#2B2D31] border-l-4 border-l-[#EA580C] flex flex-col gap-3 max-w-xl">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      🚨 【 WARNING 】 🌊 วิกฤตน้ำเอ่อล้นตลิ่ง แม่น้ำเจ้าพระยา จ.พระนครศรีอยุธยา
                    </div>
                    <p className="text-xs text-[#DBDEE1] leading-relaxed">
                      สถานี C.29A พระนครศรีอยุธยา ตรวจพบระดับน้ำ 4.85 ม.รทก. คิดเป็น 89% ของความจุลำน้ำ เสี่ยงเกิดน้ำท่วมขังในพื้นที่ลุ่มต่ำริมฝั่ง
                    </p>
                    <div className="text-xs bg-[#1E1F22] p-2.5 rounded border border-[#383A40]">
                      <span className="text-[#949BA4] block font-semibold mb-1">📊 ข้อมูลตรวจวัด:</span>
                      <span className="text-white font-mono text-[11px]">• ระดับน้ำ 4.85 ม. (ตลิ่ง 5.20 ม., อัตราไหล 2,400 ลบ.ม./วินาที)</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[#C4B5FD] block font-bold mb-1">🤖 AI Analysis & คำแนะนำ:</span>
                      <p className="text-[#DBDEE1]">
                        แนะนำให้ชุมชนริมแม่น้ำเจ้าพระยาและแม่น้ำป่าสักยกสิ่งของขึ้นที่สูง ย้ายรถยนต์ และติดตามประกาศระบายน้ำจากเขื่อนเจ้าพระยา
                      </p>
                    </div>
                    <div className="pt-2 border-t border-[#383A40] text-[11px] text-[#949BA4]">
                      แหล่งข้อมูล: กรมชลประทาน (RID) & ThaiWater
                    </div>
                  </div>
                )}

                {previewType === 'STORM' && (
                  <div className="mt-1 p-4 rounded-lg bg-[#2B2D31] border-l-4 border-l-[#D97706] flex flex-col gap-3 max-w-xl">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      ⚠️ 【 WATCH 】 🌀 เฝ้าระวังพายุโซนร้อนเคลื่อนตัวเข้าสู่ภาคตะวันออกเฉียงเหนือ
                    </div>
                    <p className="text-xs text-[#DBDEE1]">
                      ความเร็วลมสูงสุดใกล้ศูนย์กลาง 75 กม./ชม. มีแนวโน้มส่งผลให้เกิดฝนตกหนักถึงหนักมากและลมกระโชกแรงใน จ.อุบลราชธานี, อำนาจเจริญ, มุกดาหาร
                    </p>
                    <div className="pt-2 border-t border-[#383A40] text-[11px] text-[#949BA4]">
                      แหล่งข้อมูล: กรมอุตุนิยมวิทยา (TMD) & JTWC
                    </div>
                  </div>
                )}

                {previewType === 'PM25' && (
                  <div className="mt-1 p-4 rounded-lg bg-[#2B2D31] border-l-4 border-l-[#DC2626] flex flex-col gap-3 max-w-xl">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      🚨 【 CRITICAL 】 🌫️ ฝุ่น PM2.5 สูงเกินเกณฑ์ระดับสีแดง จ.สระบุรี
                    </div>
                    <p className="text-xs text-[#DBDEE1]">
                      สถานีตรวจวัด อ.เฉลิมพระเกียรติ ตรวจพบค่า PM2.5 แตะ 128.4 µg/m³ (AQI: 220) อยู่ในเกณฑ์มีผลกระทบต่อสุขภาพอย่างยิ่ง
                    </p>
                    <div className="pt-2 border-t border-[#383A40] text-[11px] text-[#949BA4]">
                      แหล่งข้อมูล: กรมควบคุมมลพิษ (PCD) Air4Thai
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Instant Webhook Setup & Tester */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  ทดสอบส่ง Webhook เข้าห้อง Discord ทันที
                </h3>
                <span className="text-[11px] text-slate-400">
                  ไม่ต้องโฮสต์บอท แค่สร้าง Webhook ใน Discord
                </span>
              </div>
            </div>

            {/* How to get Webhook steps */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 flex flex-col gap-2">
              <span className="font-semibold text-indigo-300">วิธีสร้าง Discord Webhook ใน 3 ขั้นตอน:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                <li>เปิด Discord ➡️ ไปที่การตั้งค่าห้อง (Channel Settings ⚙️)</li>
                <li>เลือกเมนู <b className="text-slate-200">การผสานรวม (Integrations)</b> ➡️ กด <b className="text-slate-200">Webhooks</b></li>
                <li>กด <b className="text-slate-200">สร้าง Webhook ใหม่ (New Webhook)</b> แล้วคัดลอก URL มาวางด้านล่าง</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-300 font-semibold">
                Discord Webhook URL ของห้องคุณ:
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  placeholder="https://discord.com/api/webhooks/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />

                <button
                  onClick={handleTestWebhookSend}
                  disabled={isSendingWebhook || !webhookInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-950"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingWebhook ? 'กำลังส่งสัญญาณ...' : 'ยิงข้อความทดสอบเข้า Discord (Send Test Alert)'}</span>
                </button>
              </div>

              {webhookFeedback && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                  {webhookFeedback}
                </div>
              )}
            </div>
          </div>

          {/* Custom Client ID Generator for Full Bot */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-3">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              กำหนด Discord Client ID ของคุณเอง
            </h3>
            <p className="text-xs text-slate-400">
              หากคุณสร้าง Discord Application ไว้บน Discord Developer Portal สามารถใส่ Client ID เพื่อสร้าง Invite Link ของตัวเองได้
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Discord Application Client ID"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleCopyInvite}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shrink-0"
              >
                คัดลอกลิงก์
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slash Commands Showcase */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Terminal className="w-4 h-4" />
            คำสั่ง Slash Commands ทั้งหมด (รองรับการพิมพ์ / ใน Discord)
          </div>
          <p className="text-xs text-slate-400">
            สมาชิกในเซิร์ฟเวอร์สามารถพิมพ์คำสั่งต่อไปนี้เพื่อสอบถามข้อมูลภัยพิบัติ สภาพอากาศ และระดับน้ำได้ตลอดเวลา
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { cmd: '/status', desc: 'ตรวจสอบสถานะศูนย์เฝ้าระวัง Uptime และเซนเซอร์ทั้งหมด', badge: 'System' },
            { cmd: '/alerts', desc: 'ดูรายงานเหตุการณ์ระดับเตือนภัย (Warning & Critical) ทั้งหมด', badge: 'Alerts' },
            { cmd: '/earthquake', desc: 'รายงานแผ่นดินไหวล่าสุดในไทยและรัศมีใกล้เคียง พร้อมระยะทาง', badge: 'USGS' },
            { cmd: '/flood', desc: 'รายงานระดับน้ำในลุ่มน้ำหลัก (เจ้าพระยา, ปิง, ยม, น่าน, มูล, ชี)', badge: 'Hydro' },
            { cmd: '/pm25', desc: 'รายงานค่าฝุ่น PM2.5 และดัชนีคุณภาพอากาศทุกจังหวัด', badge: 'PCD' },
            { cmd: '/weather', desc: 'สภาพอากาศ อุณหภูมิ ลม และเรดาร์ฝนรายภูมิภาค', badge: 'Radar' },
            { cmd: '/storm', desc: 'ติดตามเส้นทางพายุหมุนเขตร้อนและความกดอากาศต่ำ', badge: 'Cyclone' },
            { cmd: '/map', desc: 'รับลิงก์เปิดแผนที่ Interactive Thailand Map แบบเต็มจอ', badge: 'Map' },
            { cmd: '/help', desc: 'คู่มือการใช้งานบอทและรายชื่อช่องทางฉุกเฉิน', badge: 'Help' }
          ].map((item) => (
            <div
              key={item.cmd}
              onClick={() => handleRunSlashCommand(item.cmd)}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all flex flex-col justify-between gap-2 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-emerald-400 text-sm group-hover:text-emerald-300">
                    {item.cmd}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-emerald-400">
                <span>คลิกเพื่อทดสอบคำสั่ง</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>

        {/* Command Output Box */}
        {commandResult && (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold">
                ผลลัพธ์คำสั่ง {activeCommand} (Terminal Simulation):
              </span>
              <span className="text-slate-500 text-[10px]">
                {new Date().toLocaleTimeString('th-TH')}
              </span>
            </div>
            <span className="font-bold text-slate-200">{commandResult.title}</span>
            <p className="text-slate-300 whitespace-pre-line leading-relaxed">
              {commandResult.description}
            </p>
          </div>
        )}
      </div>

      {/* Recommended Channel Architecture */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          โครงสร้างห้องแนะนำสำหรับ Discord Server (Channel Routing Architecture)
        </h3>
        <p className="text-xs text-slate-400">
          เพื่อให้สมาชิกในเซิร์ฟเวอร์ของคุณได้รับข้อมูลอย่างเป็นระเบียบ ไม่ถูกรบกวนด้วยข้อความที่ไม่เกี่ยวข้อง แนะนำให้สร้างห้องดังนี้:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-rose-900/40">
            <span className="font-bold text-rose-400 block mb-1">🚨・critical-alert</span>
            <span className="text-slate-400 text-[11px]">เฉพาะเหตุการณ์ฉุกเฉินระดับวิกฤต มีผลกระทบต่อชีวิตและทรัพย์สินทันที (@everyone)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-amber-900/40">
            <span className="font-bold text-amber-400 block mb-1">🌏・earthquake-watch</span>
            <span className="text-slate-400 text-[11px]">รายงานแผ่นดินไหวในไทยและประเทศเพื่อนบ้าน ขนาดตั้งแต่ M 3.0 ขึ้นไป</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-blue-900/40">
            <span className="font-bold text-blue-400 block mb-1">🌊・flood-monitor</span>
            <span className="text-slate-400 text-[11px]">ติดตามระดับน้ำลุ่มน้ำหลัก เขื่อนเจ้าพระยา และพื้นที่เสี่ยงน้ำเอ่อล้นตลิ่ง</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-cyan-900/40">
            <span className="font-bold text-cyan-400 block mb-1">🌦️・weather-radar</span>
            <span className="text-slate-400 text-[11px]">เรดาร์ฝนตกหนัก พายุฝนฟ้าคะนอง และดัชนีความร้อนสูง</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-orange-900/40">
            <span className="font-bold text-orange-400 block mb-1">🌫️・pm25-air-quality</span>
            <span className="text-slate-400 text-[11px]">รายงานคุณภาพอากาศเมื่อค่า PM2.5 เกินเกณฑ์มาตรฐานสีส้มและสีแดง</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-purple-900/40">
            <span className="font-bold text-purple-400 block mb-1">🌀・storm-cyclone</span>
            <span className="text-slate-400 text-[11px]">ติดตามเส้นทางพายุหมุนเขตร้อนในทะเลจีนใต้และอ่าวไทย</span>
          </div>
        </div>
      </div>
    </div>
  );
};
