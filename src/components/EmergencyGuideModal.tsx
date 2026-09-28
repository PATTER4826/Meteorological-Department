/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Emergency Safety Guide Modal (คู่มือเตรียมพร้อมและรับมือภัยพิบัติ)
 */

import React, { useState, useEffect } from 'react';
import { EventType } from '../../shared/types.ts';
import {
  X,
  ShieldAlert,
  PhoneCall,
  Luggage,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Flame,
  Waves,
  Activity,
  Wind,
  CloudRain,
  Sun,
  LifeBuoy
} from 'lucide-react';

interface EmergencyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: EventType;
}

interface GuideContent {
  title: string;
  emoji: string;
  summary: string;
  before: string[];
  during: string[];
  after: string[];
  hotlines: { name: string; number: string; desc: string }[];
}

const EMERGENCY_GUIDES: Record<string, GuideContent> = {
  EARTHQUAKE: {
    title: 'แผ่นดินไหว (Earthquake)',
    emoji: '🌏',
    summary: 'เหตุการณ์แผ่นดินไหวเกิดขึ้นฉับพลันโดยไม่มีสัญญาณเตือนล่วงหน้า การปฏิบัติตนอย่างถูกต้องภายใน 10-30 วินาทีแรกมีความสำคัญที่สุดในการรักษาชีวิต',
    before: [
      'สำรวจและยึดตรึงเฟอร์นิเจอร์ ตู้สูง ชั้นวางของ และเครื่องใช้ไฟฟ้าหนักให้ติดกับผนังห้อง',
      'จัดเตรียมกระเป๋าฉุกเฉิน 72 ชั่วโมง (Go-Bag) วางไว้ในตำแหน่งที่หยิบง่ายใกล้ทางออก',
      'กำหนดจุดนัดพบที่ปลอดภัยสำหรับสมาชิกในครอบครัวหลังเกิดเหตุฉุกเฉิน'
    ],
    during: [
      'หมอบ กำบัง ยึด (Drop, Cover, Hold On) ใต้โต๊ะหรือโครงสร้างที่แข็งแรง',
      'อยู่ให้ห่างจากหน้าต่างกระจก ประตูระเบียง และวัตถุที่อาจตกหล่นใส่',
      'ห้ามใช้ลิฟต์โดยเด็ดขาด หากอยู่ในลิฟต์ให้กดจอดทุกชั้นและรีบออกจากลิฟต์ทันที',
      'หากอยู่นอกอาคาร ให้เคลื่อนย้ายไปยังที่โล่งแจ้ง หลีกเลี่ยงเสาไฟฟ้า ป้ายโฆษณา และอาคารสูง',
      'หากกำลังขับรถ ให้ชะลอความเร็ว จอดรถในที่ปลอดภัย หลีกเลี่ยงการจอดใต้สะพานหรือทางยกระดับ'
    ],
    after: [
      'ระวังและเตรียมพร้อมรับมืออาฟเตอร์ช็อก (Aftershocks) ที่อาจตามมาอีกหลายระลอก',
      'ตรวจสอบกลิ่นแก๊สรั่วและระบบไฟฟ้า หากได้กลิ่นแก๊สให้ปิดวาล์วถังแก๊สและเปิดหน้าต่างระบายอากาศ ห้ามเปิดสวิตช์ไฟ',
      'สวมรองเท้าหุ้มส้นเพื่อป้องกันเศษกระจกและสิ่งหักพังบาดเท้า',
      'หากอาคารมีรอยแตกร้าวรุนแรง ให้รีบอพยพออกจากอาคารไปยังศูนย์พักพิงชั่วคราว'
    ],
    hotlines: [
      { name: 'ศูนย์เตือนภัยพิบัติแห่งชาติ (ปภ.)', number: '1784', desc: 'สายด่วนสาธารณภัย 24 ชม.' },
      { name: 'สถาบันการแพทย์ฉุกเฉิน (สพฉ.)', number: '1669', desc: 'เจ็บป่วยฉุกเฉิน กู้ชีพ' },
      { name: 'กองเฝ้าระวังแผ่นดินไหว TMD', number: '02-399-4547', desc: 'สอบถามข้อมูลแผ่นดินไหว' }
    ]
  },
  FLOOD: {
    title: 'น้ำท่วม & น้ำป่าไหลหลาก (Flood & Flash Flood)',
    emoji: '🌊',
    summary: 'อุทกภัยและน้ำป่าไหลหลากมีความเสี่ยงต่อกระแสน้ำพัดพา ดินโคลนถล่ม และอันตรายจากไฟฟ้าลัดวงจร รวมถึงสัตว์มีพิษที่หนีน้ำขึ้นที่สูง',
    before: [
      'ติดตามประกาศเตือนภัยจากกรมอุตุนิยมวิทยาและกรมชลประทานอย่างต่อเนื่อง',
      'ยกสิ่งของมีค่า เอกสารสำคัญ เครื่องใช้ไฟฟ้า และปลั๊กไฟขึ้นที่สูงเหนือระดับน้ำสูงสุดที่คาดการณ์',
      'สับคัทเอาต์หรือเบรกเกอร์ตัดวงจรไฟฟ้าชั้นล่างเพื่อป้องกันไฟรั่วไฟดูด',
      'นำยานพาหนะไปจอดไว้บนพื้นที่สูงหรือลานจอดที่ปลอดภัย',
      'กักเก็บน้ำสะอาด ยารักษาโรคประจำตัว และอาหารแห้งสำรองไว้สำหรับอย่างน้อย 3-5 วัน'
    ],
    during: [
      'ห้ามเดินลุยน้ำเชี่ยวที่ระดับน้ำสูงเกินหัวเข่า เพราะกระแสน้ำแรงอาจพัดพาล้มได้',
      'ห้ามสัมผัสเสาไฟฟ้า สายไฟ หรืออุปกรณ์ไฟฟ้าที่แช่อยู่ในน้ำเด็ดขาด',
      'ห้ามขับขี่รถยนต์หรือจักรยานยนต์ฝ่ากระแสน้ำท่วมสูง เพราะรถอาจดับหรือถูกน้ำพัดตกข้างทาง',
      'ระวังสัตว์มีพิษ เช่น งู ตะขาบ แมงป่อง ที่หนีน้ำขึ้นมาหลบซ่อนตามซอกมุมบ้านหรือขอบหน้าต่าง',
      'หากมีคำสั่งอพยพจากทางการ ให้รีบเดินทางไปยังศูนย์พักพิงทันทีโดยไม่ต้องรอให้น้ำท่วมถึงบ้าน'
    ],
    after: [
      'ก่อนกลับเข้าบ้าน ตรวจสอบความปลอดภัยของโครงสร้างอาคารว่ามีรอยทรุดหรือเอียงหรือไม่',
      'อย่าเพิ่งเปิดสวิตช์ไฟฟ้าจนกว่าจะมีช่างผู้ชำนาญการตรวจสอบความแห้งสนิทของสายไฟและเบรกเกอร์',
      'ระวังเชื้อโรคที่มากับน้ำท่วม เช่น โรคฉี่หนู (Leptospirosis) และโรคตาแดง',
      'ทำความสะอาดและฆ่าเชื้อโรคบริเวณพื้นบ้านและภาชนะก่อนนำกลับมาใช้งาน'
    ],
    hotlines: [
      { name: 'ศูนย์เตือนภัย ปภ.', number: '1784', desc: 'ขอความช่วยเหลือ อพยพน้ำท่วม' },
      { name: 'กรมทางหลวง (สอบถามเส้นทาง)', number: '1586', desc: 'เช็กเส้นทางถนนน้ำท่วมผ่านไม่ได้' },
      { name: 'ตำรวจทางหลวง', number: '1193', desc: 'ขอความช่วยเหลือฉุกเฉินบนทางหลวง' }
    ]
  },
  STORM: {
    title: 'พายุหมุนเขตร้อน & ลมกระโชกแรง (Tropical Storm & Cyclone)',
    emoji: '🌀',
    summary: 'พายุหมุนเขตร้อนมักนำพาฝนตกหนักต่อเนื่อง ลมพายุพัดกระโชกแรง คลื่นลมแรงในทะเล และความเสี่ยงดินโคลนถล่มบริเวณที่ลาดเชิงเขา',
    before: [
      'ตัดแต่งกิ่งไม้ใหญ่ที่อยู่ใกล้ตัวบ้านหรือแนวสายไฟฟ้า เพื่อป้องกันกิ่งไม้หักทับ',
      'ตรวจสอบและซ่อมแซมโครงสร้างหลังคา ประตู หน้าต่าง และแผ่นกันสาดให้แข็งแรง',
      'เก็บสิ่งของที่อาจปลิวตามลมได้ เช่น กระถางต้นไม้ ราวตากผ้า แผ่นสังกะสี เข้าไว้ในที่ร่ม',
      'ชาวเรือและประมงควรติดตามประกาศเตือนคลื่นลมแรง และนำเรือเข้าเทียบท่าหลบคลื่นลม'
    ],
    during: [
      'อยู่ภายในอาคารที่มั่นคง ปิดประตูหน้าต่างให้สนิท ห้ามเปิดระเบียง',
      'หลีกเลี่ยงการอยู่ในที่โล่งแจ้ง ใต้ต้นไม้ใหญ่ ใกล้ป้ายโฆษณาที่ไม่แข็งแรง หรือเสาไฟฟ้าแรงสูง',
      'ระวังอันตรายจากฟ้าผ่า ปิดและถอดปลั๊กเครื่องใช้ไฟฟ้าเพื่อป้องกันความเสียหายจากกระแสไฟกระชาก',
      'หากอยู่ในพื้นที่ลาดเชิงเขา สังเกตสีของน้ำลำห้วย หากเปลี่ยนเป็นสีขุ่นแดงหรือมีเสียงดังผิดปกติให้รีบอพยพ'
    ],
    after: [
      'ระมัดระวังสายไฟฟ้าที่อาจขาดตกอยู่บนพื้นถนนหรือในแอ่งน้ำ',
      'ตรวจสอบความเสียหายของหลังคาและสิ่งปลูกสร้างอย่างระมัดระวัง',
      'หลีกเลี่ยงการสัญจรผ่านเส้นทางที่มีต้นไม้ล้มขวางทางหรือเสาไฟฟ้าเอน'
    ],
    hotlines: [
      { name: 'สายด่วนกรมอุตุนิยมวิทยา', number: '1182', desc: 'ตรวจสอบเรดาร์พายุ 24 ชม.' },
      { name: 'ศูนย์บรรเทาสาธารณภัย กองทัพบก', number: '1138', desc: 'ช่วยเหลือพื้นที่ประสบพายุรุนแรง' },
      { name: 'การไฟฟ้านครหลวง / ภูมิภาค', number: '1130 / 1129', desc: 'แจ้งเสาไฟล้ม สายไฟขาด' }
    ]
  },
  PM25: {
    title: 'วิกฤตฝุ่นละออง PM2.5 (Air Pollution & Smog)',
    emoji: '🌫️',
    summary: 'ฝุ่น PM2.5 มีขนาดเล็กมากจนสามารถผ่านเข้าสู่ถุงลมปอดและกระแสเลือดได้โดยตรง ส่งผลกระทบอย่างรุนแรงต่อระบบทางเดินหายใจและหลอดเลือดหัวใจ',
    before: [
      'ตรวจสอบค่าฝุ่น PM2.5 ประจำวันผ่านหน้าแดชบอร์ดนี้หรือแอป Air4Thai ก่อนออกจากบ้าน',
      'จัดเตรียมหน้ากากอนามัยที่สามารถป้องกันอนุภาคขนาดเล็กได้ เช่น หน้ากากมาตรฐาน N95 หรือ KN95',
      'เตรียมห้องปลอดฝุ่น (Clean Room) ภายในบ้าน โดยปิดช่องระบายอากาศและเปิดเครื่องฟอกอากาศที่มีแผ่นกรอง HEPA'
    ],
    during: [
      'สวมหน้ากาก N95 ให้แนบสนิทกับใบหน้าทุกครั้งเมื่อจำเป็นต้องออกนอกอาคาร',
      'งดการออกกำลังกายหรือทำกิจกรรมที่ต้องใช้แรงกลางแจ้งโดยเด็ดขาดในช่วงที่ค่าฝุ่นอยู่ในระดับสีส้มหรือสีแดง',
      'กลุ่มเสี่ยง เช่น เด็กเล็ก ผู้สูงอายุ หญิงตั้งครรภ์ และผู้ป่วยโรคหอบหืด ภูมิแพ้ หรือโรคหัวใจ ควรอยู่ภายในอาคารเท่านั้น',
      'หลีกเลี่ยงกิจกรรมที่ก่อให้เกิดควันและฝุ่นละอองเพิ่ม เช่น การเผาเศษขยะ การจุดธูป หรือการสตาร์ทเครื่องยนต์ทิ้งไว้',
      'หากมีอาการไอ แน่นหน้าอก หายใจมีเสียงหวีด หรือเวียนศีรษะ ให้รีบพบแพทย์ทันที'
    ],
    after: [
      'ทำความสะอาดร่างกาย ล้างหน้า บ้วนปาก และใช้น้ำเกลือล้างจมูกเมื่อกลับเข้ามาในอาคาร',
      'หมั่นทำความสะอาดหรือเปลี่ยนแผ่นกรองเครื่องฟอกอากาศตามระยะเวลาที่กำหนด',
      'ดื่มน้ำสะอาดมากๆ เพื่อช่วยขับสารพิษออกจากร่างกาย'
    ],
    hotlines: [
      { name: 'สายด่วนกรมควบคุมมลพิษ', number: '1650', desc: 'แจ้งเรื่องร้องเรียนมลพิษทางอากาศ' },
      { name: 'สายด่วนสุขภาพ กรมควบคุมโรค', number: '1422', desc: 'ปรึกษาปัญหาสุขภาพจากฝุ่น' }
    ]
  },
  HEAT: {
    title: 'คลื่นความร้อน & ดัชนีความร้อนสูง (Extreme Heat)',
    emoji: '☀️',
    summary: 'สภาพอากาศร้อนจัดและดัชนีความร้อนสูง (Heat Index) เสี่ยงต่อการเกิดโรคลมแดด (Heatstroke) ซึ่งอาจเป็นอันตรายถึงชีวิตได้ในเวลาอันรวดเร็ว',
    before: [
      'วางแผนหลีกเลี่ยงการทำกิจกรรมกลางแจ้งที่มีแดดจัดในช่วงเวลา 11:00 - 15:00 น.',
      'เตรียมน้ำดื่มสะอาดไว้ใกล้ตัวตลอดเวลา',
      'สวมใส่เสื้อผ้าสีอ่อน เนื้อผ้าโปร่ง บาง ระบายอากาศได้ดี เช่น ผ้าฝ้าย'
    ],
    during: [
      'ดื่มน้ำสะอาดบ่อยๆ อย่างน้อยชั่วโมงละ 2-4 แก้ว แม้ว่าจะยังไม่รู้สึกกระหายน้ำก็ตาม',
      'หลีกเลี่ยงเครื่องดื่มแอลกอฮอล์ กาแฟ และเครื่องดื่มที่มีน้ำตาลสูง เพราะจะเร่งให้ร่างกายสูญเสียน้ำเร็วขึ้น',
      'ห้ามทิ้งเด็กเล็ก ผู้สูงอายุ หรือสัตว์เลี้ยงไว้ในรถที่จอดตากแดดโดยเด็ดขาด แม้จะแง้มกระจกไว้ก็ตาม',
      'สังเกตสัญญาณเตือน Heatstroke: ตัวร้อนจัดแต่ไม่มีเหงื่อ ผิวหนังแดงแห้ง ชีพจรเต้นเร็ว มึนงง สับสน หรือหมดสติ'
    ],
    after: [
      'หากพบผู้มีอาการ Heatstroke ให้รีบนำเข้าที่ร่ม ปลดเสื้อผ้าให้หลวม และใช้ผ้าชุบน้ำเย็นเช็ดตามตัวเพื่อลดอุณหภูมิ',
      'โทรเรียกรถพยาบาลฉุกเฉิน 1669 ทันที'
    ],
    hotlines: [
      { name: 'หน่วยแพทย์กู้ชีพฉุกเฉิน', number: '1669', desc: 'เรียกรถพยาบาลผู้ป่วยลมแดด' },
      { name: 'สายด่วนกรมควบคุมโรค', number: '1422', desc: 'คำแนะนำการป้องกันฮีทสโตรก' }
    ]
  }
};

export const EmergencyGuideModal: React.FC<EmergencyGuideModalProps> = ({
  isOpen,
  onClose,
  initialType = 'EARTHQUAKE'
}) => {
  const [selectedKey, setSelectedKey] = useState<string>('EARTHQUAKE');
  const [activeStep, setActiveStep] = useState<'DURING' | 'BEFORE' | 'AFTER' | 'BAG'>('DURING');

  useEffect(() => {
    if (initialType && EMERGENCY_GUIDES[initialType]) {
      setSelectedKey(initialType);
    }
  }, [initialType, isOpen]);

  if (!isOpen) return null;

  const currentGuide = EMERGENCY_GUIDES[selectedKey] || EMERGENCY_GUIDES.EARTHQUAKE;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5">
                  คู่มือเตรียมพร้อมและรับมือภัยพิบัติ (Emergency Guide)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ปภ. 1784
                </span>
              </div>
              <p className="text-xs text-slate-400">
                แนวทางปฏิบัติตามมาตรฐานสากลเพื่อความปลอดภัยในชีวิตและทรัพย์สิน
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hazard Type Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { key: 'EARTHQUAKE', label: 'แผ่นดินไหว', emoji: '🌏' },
            { key: 'FLOOD', label: 'น้ำท่วม', emoji: '🌊' },
            { key: 'STORM', label: 'พายุหมุน', emoji: '🌀' },
            { key: 'PM25', label: 'ฝุ่น PM2.5', emoji: '🌫️' },
            { key: 'HEAT', label: 'คลื่นความร้อน', emoji: '☀️' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedKey(item.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold transition-all shrink-0 ${
                selectedKey === item.key
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Guide Overview Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/20 border border-slate-800 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <span className="text-xl">{currentGuide.emoji}</span>
            <span>{currentGuide.title}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {currentGuide.summary}
          </p>
        </div>

        {/* Action Phase Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 rounded-xl p-1 text-xs font-semibold gap-1">
          <button
            onClick={() => setActiveStep('DURING')}
            className={`flex-1 py-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeStep === 'DURING'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>⚠️</span>
            <span>ระหว่างเกิดเหตุ (During)</span>
          </button>
          <button
            onClick={() => setActiveStep('BEFORE')}
            className={`flex-1 py-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeStep === 'BEFORE'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🛡️</span>
            <span>ก่อนเกิดเหตุ (Before)</span>
          </button>
          <button
            onClick={() => setActiveStep('AFTER')}
            className={`flex-1 py-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeStep === 'AFTER'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🔄</span>
            <span>หลังเกิดเหตุ (After)</span>
          </button>
          <button
            onClick={() => setActiveStep('BAG')}
            className={`flex-1 py-2 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 ${
              activeStep === 'BAG'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎒</span>
            <span>กระเป๋าฉุกเฉิน 72 ชม.</span>
          </button>
        </div>

        {/* Action Guide Details */}
        <div className="flex flex-col gap-3 min-h-[220px]">
          {activeStep === 'DURING' && (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                ข้อควรปฏิบัติทันทีขณะเกิดเหตุการณ์:
              </span>
              <div className="flex flex-col gap-2">
                {currentGuide.during.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs leading-relaxed text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold font-mono text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === 'BEFORE' && (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                การเตรียมความพร้อมล่วงหน้าเพื่อลดความสูญเสีย:
              </span>
              <div className="flex flex-col gap-2">
                {currentGuide.before.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs leading-relaxed text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold font-mono text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === 'AFTER' && (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                การปฏิบัติตนและฟื้นฟูหลังเหตุการณ์สงบ:
              </span>
              <div className="flex flex-col gap-2">
                {currentGuide.after.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs leading-relaxed text-slate-200">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold font-mono text-[11px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === 'BAG' && (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Luggage className="w-4 h-4" />
                เช็กลิสต์กระเป๋าฉุกเฉิน 72 ชั่วโมง (Survival Go-Bag):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'น้ำดื่มสะอาดอย่างน้อย 3 ลิตรต่อคนต่อวัน',
                  'อาหารแห้ง อาหารกระป๋องพร้อมที่เปิด และขนมให้พลังงานสูง',
                  'ไฟฉายพร้อมถ่านสำรอง หรือไฟฉายแบบมือหมุน',
                  'วิทยุพกพาแบบใส่ถ่าน สำหรับรับฟังประกาศราชการ',
                  'ชุดปฐมพยาบาล ยาประจำตัว และยาฆ่าเชื้อ',
                  'นกหวีดสำหรับเป่าขอความช่วยเหลือหากติดค้าง',
                  'แบตเตอรี่สำรอง (Power Bank) พร้อมสายชาร์จ',
                  'สำเนาเอกสารสำคัญ เช่น บัตรประชาชน ทะเบียนบ้าน บันทึกเบอร์โทร',
                  'เงินสดสำรองสำหรับใช้ในกรณีตู้ ATM หรือระบบไฟฟ้าล่ม',
                  'หน้ากาก N95 ถุงขยะ เสื้อกันฝน และไฟแช็ก'
                ].map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Hotlines Section */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4" />
              เบอร์โทรศัพท์ฉุกเฉินสำคัญ (Emergency Hotlines)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">โทรฟรี 24 ชั่วโมง</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {currentGuide.hotlines.map((h, i) => (
              <a
                key={i}
                href={`tel:${h.number.replace(/-/g, '')}`}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 transition-colors flex flex-col justify-between group"
              >
                <div>
                  <span className="font-semibold text-slate-200 block text-xs">{h.name}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">{h.desc}</span>
                </div>
                <span className="font-mono font-bold text-base text-rose-400 group-hover:text-rose-300 mt-2 block">
                  📞 {h.number}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Official Disclaimer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
          <span>ข้อมูลอ้างอิงจาก: กรมป้องกันและบรรเทาสาธารณภัย (ปภ.) & กรมอุตุนิยมวิทยา</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            ปิดคู่มือ
          </button>
        </div>
      </div>
    </div>
  );
};
