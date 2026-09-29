/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * AI Analysis Service powered by @google/genai (gemini-3.8-flash)
 */

import { GoogleGenAI, Type } from '@google/genai';
import type { NormalizedEvent, AIAnalysisResult, SituationalSummary } from '../../shared/types.ts';
import { disasterStore } from '../db/store.ts';

class GeminiAIService {
  private ai: GoogleGenAI | null = null;
  private readonly modelName = 'gemini-3.8-flash';
  private quotaOrAccessIssueUntil = 0;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      disasterStore.addAuditLog('INFO', 'Gemini AI Service initialized successfully with model: gemini-3.8-flash');
    } else {
      disasterStore.addAuditLog('WARN', 'GEMINI_API_KEY not configured. AI features will use rule-based fallback analysis.');
    }
  }

  /**
   * Analyze a newly detected or updated disaster event using Gemini
   */
  async analyzeEvent(event: NormalizedEvent): Promise<AIAnalysisResult> {
    // If Gemini is not configured or in quota restriction backoff, generate strong deterministic rule-based analysis
    if (!this.ai || Date.now() < this.quotaOrAccessIssueUntil) {
      return this.generateFallbackAnalysis(event);
    }

    try {
      const prompt = `
คุณคือระบบ AI ผู้เชี่ยวชาญประจำ "ศูนย์แจ้งเตือนสภาพอากาศและภัยพิบัติแห่งประเทศไทย (THAI WEATHER & DISASTER AI CENTER)"

หน้าที่ของคุณ: วิเคราะห์ข้อมูลเหตุการณ์จริงที่ตรวจพบจากเซนเซอร์/API และส่งมอบการประเมินสถานการณ์

กฎเหล็กด้านความปลอดภัยและความถูกต้อง (Human Safety & Truthfulness):
1. ห้ามเปลี่ยนแปลงหรือดัดแปลงข้อมูลข้อเท็จจริงเด็ดขาด (เช่น ค่า Magnitude, ระดับน้ำ, ค่า PM2.5, พิกัด ต้องตรงกับข้อมูลต้นทาง)
2. ห้ามแต่งข้อมูลปลอมขึ้นมาเอง
3. แยกหมวดหมู่อย่างเด็ดขาดระหว่าง:
   - FACT: ข้อเท็จจริงที่วัดได้จากแหล่งข้อมูลทางการ
   - ANALYSIS: การวิเคราะห์แนวโน้มและผลกระทบที่อาจเกิดขึ้น
   - RECOMMENDATION: คำแนะนำด้านความปลอดภัยเบื้องต้น
4. สำหรับคำแนะนำ ต้องลงท้ายหรือกำกับเสมอว่า "โปรดติดตามประกาศอย่างเป็นทางการจากหน่วยงานราชการที่เกี่ยวข้อง"
5. ห้ามแอบอ้างตนเองเป็นหน่วยงานราชการ ให้ใช้ชื่อระบบ "THAI WEATHER & DISASTER AI CENTER"

ข้อมูลเหตุการณ์:
- รหัส: ${event.id}
- ประเภท: ${event.type}
- หัวข้อ: ${event.title}
- รายละเอียด: ${event.description}
- ระดับปัจจุบัน: ${event.severity}
- จังหวัด/พื้นที่: ${event.province} ${event.district || ''}
- พิกัด: ละติจูด ${event.latitude}, ลองจิจูด ${event.longitude}
- ปริมาณ/ค่าสำคัญ: ${event.magnitude ? `ขนาด ${event.magnitude} ลึก ${event.depth} กม.` : ''} ${event.waterLevelMeters ? `ระดับน้ำ ${event.waterLevelMeters} ม.` : ''} ${event.pm25Value ? `PM2.5 ${event.pm25Value} µg/m³` : ''} ${event.rainfallMm ? `ปริมาณฝน ${event.rainfallMm} มม.` : ''}
- เวลาเกิดเหตุ: ${event.occurredAt}
- แหล่งที่มาทางการ: ${event.source} (${event.sourceUrl})
`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a disaster risk analysis AI for Thailand. Provide objective, verified safety analysis in standard Thai. Do not invent facts.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              severity: {
                type: Type.STRING,
                description: 'Assessed severity: INFORMATION, WATCH, WARNING, or CRITICAL'
              },
              summary: {
                type: Type.STRING,
                description: 'Concise 1-2 sentence executive briefing in Thai'
              },
              fact: {
                type: Type.STRING,
                description: 'Clear factual recitation of recorded data from source'
              },
              analysis: {
                type: Type.STRING,
                description: 'AI impact assessment, potential progression, and affected sectors'
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Actionable safety guidance for citizens and local authorities'
              },
              affectedAreas: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Specific districts, subdistricts, or basins affected'
              },
              vulnerableGroups: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Vulnerable groups e.g. elderly, children, respiratory patients, low-lying residents'
              },
              urgency: {
                type: Type.STRING,
                description: 'IMMEDIATE, HIGH, MODERATE, or LOW'
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence score between 0.0 and 1.0'
              }
            },
            required: ['severity', 'summary', 'fact', 'analysis', 'recommendations', 'affectedAreas', 'urgency', 'confidence']
          }
        }
      });

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);

      // Enforce official safety disclaimer
      const recommendations: string[] = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
      const disclaimer = '⚠️ โปรดติดตามประกาศและคำสั่งอย่างเป็นทางการจากหน่วยงานราชการและศูนย์บรรเทาสาธารณภัย';
      if (!recommendations.some((r) => r.includes('หน่วยงานราชการ'))) {
        recommendations.push(disclaimer);
      }

      return {
        severity: ['INFORMATION', 'WATCH', 'WARNING', 'CRITICAL'].includes(parsed.severity)
          ? parsed.severity
          : event.severity,
        summary: parsed.summary || event.title,
        fact: parsed.fact || event.description,
        analysis: parsed.analysis || 'ประเมินจากข้อมูลตรวจวัดแบบเรียลไทม์',
        recommendations,
        affectedAreas: Array.isArray(parsed.affectedAreas) && parsed.affectedAreas.length > 0 ? parsed.affectedAreas : [event.province],
        vulnerableGroups: Array.isArray(parsed.vulnerableGroups) ? parsed.vulnerableGroups : ['ประชาชนทั่วไปในพื้นที่'],
        urgency: ['IMMEDIATE', 'HIGH', 'MODERATE', 'LOW'].includes(parsed.urgency) ? parsed.urgency : 'MODERATE',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
        analyzedAt: new Date().toISOString()
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isRestricted = errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('resource_exhausted') || errMsg.includes('quota');
      if (isRestricted) {
        this.quotaOrAccessIssueUntil = Date.now() + 10 * 60 * 1000; // 10 minutes backoff
        disasterStore.addAuditLog('WARN', 'Gemini AI API quota or permission restricted. Switched to verified rule-based analysis.');
      } else {
        disasterStore.addAuditLog('WARN', `Gemini AI analysis fallback used for ${event.id}: ${errMsg.substring(0, 80)}`);
      }
      return this.generateFallbackAnalysis(event);
    }
  }

  /**
   * Generate an automated comprehensive Situational Summary of Thailand
   */
  async generateDailySummary(events: NormalizedEvent[]): Promise<string> {
    if (!this.ai) {
      const active = events.filter((e) => e.status === 'ACTIVE');
      return `🇹🇭 สรุปสถานการณ์สภาพอากาศและภัยพิบัติแห่งประเทศไทย\n- เหตุการณ์เฝ้าระวังทั้งหมด: ${active.length} รายการ\n- ระดับวิกฤต (CRITICAL): ${active.filter((e) => e.severity === 'CRITICAL').length}\n- ระดับเตือนภัย (WARNING): ${active.filter((e) => e.severity === 'WARNING').length}\nขอให้ประชาชนติดตามข้อมูลอย่างใกล้ชิด`;
    }

    try {
      const active = events.filter((e) => e.status === 'ACTIVE');
      const eventBullets = active.map((e) => `- [${e.severity}] ${e.type}: ${e.title} (${e.province}) แหล่งที่มา: ${e.source}`).join('\n');

      const prompt = `
สรุปสถานการณ์สภาพอากาศและภัยพิบัติสำหรับประเทศไทยในวันนี้ ในฐานะ "THAI WEATHER & DISASTER AI CENTER"

ข้อมูลเหตุการณ์ที่กำลังเกิดขึ้นจริงในระบบ:
${eventBullets.length > 0 ? eventBullets : 'ไม่มีเหตุการณ์รุนแรงในขณะนี้ สภาพอากาศทั่วไปอยู่ในเกณฑ์ปกติ'}

รูปแบบการสรุป:
1. 🇹🇭 สรุปภาพรวมสถานการณ์ประเทศไทย
2. สถิติระดับภัย (Critical, Warning, Watch, Information)
3. พื้นที่และจังหวัดที่ต้องติดตามเป็นพิเศษ
4. ข้อแนะนำสำหรับประชาชนและผู้ปฏิบัติงาน
5. ข้อควรระวังและการประสานงานหน่วยงานรัฐ
`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      return response.text || 'ไม่สามารถสร้างสรุปสถานการณ์ได้ในขณะนี้';
    } catch (err: any) {
      return `เกิดข้อผิดพลาดในการประมวลผล AI Summary: ${err.message}`;
    }
  }

  /**
   * Disaster Emergency Assistant Chat (Grounded exclusively on verified data)
   */
  async answerUserQuery(query: string, currentEvents: NormalizedEvent[]): Promise<string> {
    if (!this.ai) {
      return 'ระบบ AI Assistant ทำงานในโหมดพื้นฐาน (ยังไม่ได้ตั้งค่า GEMINI_API_KEY) สามารถดูรายการเหตุการณ์ปัจจุบันได้ที่แท็บ Alerts และ Interactive Map';
    }

    try {
      const active = currentEvents.filter((e) => e.status === 'ACTIVE');
      const context = active.map((e) => ({
        id: e.id,
        type: e.type,
        severity: e.severity,
        title: e.title,
        province: e.province,
        description: e.description,
        source: e.source,
        occurredAt: e.occurredAt
      }));

      const prompt = `
คำถามจากประชาชน/ผู้ใช้งาน: "${query}"

ข้อมูลเหตุการณ์จริงที่มีอยู่ในระบบ THAI WEATHER & DISASTER AI CENTER ปัจจุบัน:
${JSON.stringify(context, null, 2)}

กฎการตอบคำถามอย่างเคร่งครัด:
1. ตอบโดยอ้างอิงจากข้อมูลจริงในระบบเท่านั้น
2. หากไม่มีข้อมูลเกี่ยวกับคำถาม หรือไม่มีภัยพิบัติในพื้นที่นั้น ให้ตอบตรงไปตรงมาว่า "จากฐานข้อมูลตรวจวัดล่าสุด ไม่พบรายงานเหตุการณ์หรือข้อมูลยังไม่เพียงพอในระบบ"
3. แยกส่วนความจริง (FACT) และคำแนะนำความปลอดภัย (RECOMMENDATION)
4. ลงท้ายด้วยคำแนะนำให้ติดตามประกาศจากหน่วยงานทางการเสมอ
5. ห้ามแต่งเรื่องหรือสร้างเหตุการณ์ที่ไม่มีอยู่ในข้อมูล
`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt
      });

      return response.text || 'ไม่มีข้อมูลเพียงพอสำหรับตอบคำถามนี้';
    } catch (err: any) {
      return `ขออภัย ไม่สามารถประมวลผลคำตอบได้: ${err.message}`;
    }
  }

  /**
   * Deterministic high-reliability fallback analysis
   */
  private generateFallbackAnalysis(event: NormalizedEvent): AIAnalysisResult {
    const isCritical = event.severity === 'CRITICAL';
    const isWarning = event.severity === 'WARNING';

    let summary = `ตรวจพบ ${event.title} ในพื้นที่ จ.${event.province}`;
    let fact = event.description;
    let analysis = `ระบบตรวจพบความผิดปกติจากเซนเซอร์ ${event.source} ขอให้เฝ้าระวังผลกระทบต่อเนื่อง`;
    const recs: string[] = [
      'ติดตามสถานการณ์ผ่านศูนย์เตือนภัยและสถานีวิทยุท้องถิ่น',
      'หลีกเลี่ยงการสัญจรผ่านเส้นทางที่มีความเสี่ยง',
      'โปรดติดตามประกาศอย่างเป็นทางการจากหน่วยงานราชการที่เกี่ยวข้อง'
    ];

    if (event.type === 'EARTHQUAKE') {
      fact = `แผ่นดินไหวขนาด ${event.magnitude || '-'} ลึก ${event.depth || '-'} กม. ตรวจวัดโดย ${event.source}`;
      analysis = 'คลื่นสั่นสะเทือนอาจส่งผลกระทบต่ออาคารสูงหรือโครงสร้างในรัศมีใกล้เคียง และอาจมีอาฟเตอร์ช็อกตามมา';
      recs.unshift('หากอยู่ในอาคาร หมอบ กำบัง ยึดให้แน่น (Drop, Cover, Hold On)');
    } else if (event.type === 'FLOOD') {
      fact = `ระดับน้ำอยู่ที่ ${event.waterLevelMeters || '-'} ม. จากสถานีวัดน้ำ ${event.source}`;
      analysis = 'ระดับน้ำในลำน้ำอยู่ในเกณฑ์สูง มีความเสี่ยงต่อการเอ่อล้นตลิ่งเข้าท่วมพื้นที่การเกษตรและบ้านเรือนริมน้ำ';
      recs.unshift('ยกสิ่งของขึ้นที่สูง และย้ายยานพาหนะไปยังพื้นที่ปลอดภัย');
    } else if (event.type === 'PM25') {
      fact = `ค่า PM2.5 ตรวจวัดได้ ${event.pm25Value || '-'} µg/m³ จาก ${event.source}`;
      analysis = 'สภาพอากาศปิดและการสะสมตัวของฝุ่นละอองส่งผลให้คุณภาพอากาศอยู่ในระดับที่มีผลกระทบต่อระบบทางเดินหายใจ';
      recs.unshift('สวมใส่หน้ากากป้องกันฝุ่น N95 เมื่อจำเป็นต้องออกนอกอาคาร', 'เด็ก ผู้สูงอายุ และผู้มีโรคประจำตัวควรหลีกเลี่ยงกิจกรรมกลางแจ้ง');
    }

    return {
      severity: event.severity,
      summary,
      fact,
      analysis,
      recommendations: recs,
      affectedAreas: [event.province],
      vulnerableGroups: ['ประชาชนในพื้นที่เสี่ยง'],
      urgency: isCritical ? 'IMMEDIATE' : isWarning ? 'HIGH' : 'MODERATE',
      confidence: 0.9,
      analyzedAt: new Date().toISOString()
    };
  }
}

export const geminiService = new GeminiAIService();
