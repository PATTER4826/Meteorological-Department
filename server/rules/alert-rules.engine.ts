/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Central Alert Rule Engine
 * Decoupled from Discord notification and data collector layers.
 */

import type { NormalizedEvent, SeverityLevel, EventType } from '../../shared/types.ts';

// Configurable Alert Rule Criteria
export interface AlertRuleCriteria {
  earthquake: {
    criticalMinMag: number;
    warningMinMag: number;
    watchMinMag: number;
    infoMinMag: number;
    closeProximityKm: number;      // Higher severity if closer than this
    regionalProximityKm: number;   // Within monitoring range
  };
  flood: {
    criticalCapacityPercent: number; // e.g. 100% or overflow
    warningCapacityPercent: number;  // e.g. 85%
    watchCapacityPercent: number;    // e.g. 75%
  };
  storm: {
    criticalWindSpeedKmh: number;    // e.g. Typhoon / Severe Tropical Storm (>= 89 km/h)
    warningWindSpeedKmh: number;     // e.g. Tropical Storm (>= 62 km/h)
    watchWindSpeedKmh: number;       // e.g. Tropical Depression / Low (>= 45 km/h)
    monitoringRadiusKm: number;      // e.g. 1000 km
  };
  pm25: {
    criticalThreshold: number;       // > 75.0 µg/m³ (Hazardous / Red)
    warningThreshold: number;        // > 37.5 µg/m³ (Unhealthy / Orange)
    watchThreshold: number;          // > 25.0 µg/m³ (Moderate / Yellow)
  };
  heavyRain: {
    criticalRainMmPerHour: number;   // >= 90 mm/h (Extremely Heavy)
    warningRainMmPerHour: number;    // >= 50 mm/h (Very Heavy)
    watchRainMmPerHour: number;      // >= 25 mm/h (Heavy)
  };
}

export const DEFAULT_ALERT_CRITERIA: AlertRuleCriteria = {
  earthquake: {
    criticalMinMag: 6.0,
    warningMinMag: 5.0,
    watchMinMag: 4.0,
    infoMinMag: 2.5,
    closeProximityKm: 250,
    regionalProximityKm: 800
  },
  flood: {
    criticalCapacityPercent: 100, // Overflow / Critical
    warningCapacityPercent: 85,   // Flood warning
    watchCapacityPercent: 75      // River watch
  },
  storm: {
    criticalWindSpeedKmh: 89,     // Typhoon / Severe storm
    warningWindSpeedKmh: 62,      // Tropical storm
    watchWindSpeedKmh: 45,        // Tropical depression
    monitoringRadiusKm: 1000
  },
  pm25: {
    criticalThreshold: 75.1,      // Red - Dangerous
    warningThreshold: 37.6,       // Orange - Unhealthy
    watchThreshold: 25.1          // Yellow - Moderate
  },
  heavyRain: {
    criticalRainMmPerHour: 90,
    warningRainMmPerHour: 50,
    watchRainMmPerHour: 25
  }
};

export interface RuleEvaluationResult {
  severity: SeverityLevel;
  subTypeTh: string;
  shouldAlert: boolean;
  alertCategoryTh: string;
  summaryTh: string;
}

export interface SignificantChangeCheck {
  isSignificant: boolean;
  reasonTh?: string;
  previousValueSummary?: string;
  newValueSummary?: string;
}

export class AlertRuleEngine {
  private static criteria: AlertRuleCriteria = { ...DEFAULT_ALERT_CRITERIA };

  public static getCriteria(): AlertRuleCriteria {
    return this.criteria;
  }

  public static updateCriteria(newCriteria: Partial<AlertRuleCriteria>) {
    this.criteria = { ...this.criteria, ...newCriteria };
  }

  /**
   * Evaluate Earthquake severity based on magnitude and distance to Thailand
   */
  public static evaluateEarthquake(mag: number, distanceKm: number, depthKm: number = 10): RuleEvaluationResult {
    const c = this.criteria.earthquake;
    let severity: SeverityLevel = 'INFORMATION';
    let subTypeTh = 'ข้อมูลแผ่นดินไหวทั่วไป';
    let alertCategoryTh = '🟢 ข้อมูล';

    // If close proximity to Thailand border
    if (distanceKm <= c.closeProximityKm) {
      if (mag >= 5.5) {
        severity = 'CRITICAL';
        subTypeTh = 'แผ่นดินไหวรุนแรงใกล้พรมแดนไทย';
        alertCategoryTh = '🚨 วิกฤตฉุกเฉิน';
      } else if (mag >= 4.5) {
        severity = 'WARNING';
        subTypeTh = 'แผ่นดินไหวมีนัยสำคัญใกล้ประเทศไทย';
        alertCategoryTh = '🔴 รุนแรง / เตือนภัย';
      } else if (mag >= 3.5) {
        severity = 'WATCH';
        subTypeTh = 'แผ่นดินไหวขนาดเล็ก-ปานกลาง';
        alertCategoryTh = '🟡 เฝ้าระวัง';
      }
    } else if (distanceKm <= c.regionalProximityKm) {
      if (mag >= c.criticalMinMag) {
        severity = 'CRITICAL';
        subTypeTh = 'แผ่นดินไหวรุนแรงในภูมิภาค (รับรู้แรงสั่นสะเทือนได้)';
        alertCategoryTh = '🔴 รุนแรง';
      } else if (mag >= c.warningMinMag) {
        severity = 'WARNING';
        subTypeTh = 'แผ่นดินไหวปานกลาง-ค่อนข้างแรง';
        alertCategoryTh = '🟠 ควรระวัง';
      } else if (mag >= c.watchMinMag) {
        severity = 'WATCH';
        subTypeTh = 'แผ่นดินไหวระดับเฝ้าระวังในภูมิภาค';
        alertCategoryTh = '🟡 เฝ้าระวัง';
      }
    } else {
      if (mag >= 7.0) {
        severity = 'WARNING';
        subTypeTh = 'แผ่นดินไหวขนาดใหญ่มากในภูมิภาคเอเชีย';
        alertCategoryTh = '🟠 ควรระวัง (สึนามิ/โครงสร้าง)';
      }
    }

    const shouldAlert = severity === 'CRITICAL' || severity === 'WARNING' || (severity === 'WATCH' && distanceKm <= 500);

    return {
      severity,
      subTypeTh,
      shouldAlert,
      alertCategoryTh,
      summaryTh: `แผ่นดินไหวขนาด ${mag.toFixed(1)} ลึก ${depthKm} กม. ระยะห่างจากไทย ~${Math.round(distanceKm)} กม.`
    };
  }

  /**
   * Evaluate River Basin Flood severity
   */
  public static evaluateFlood(waterLevelM: number, bankLevelM: number, capacityPercent: number): RuleEvaluationResult {
    const c = this.criteria.flood;
    let severity: SeverityLevel = 'INFORMATION';
    let subTypeTh = 'ระดับน้ำปกติ';
    let alertCategoryTh = '🟢 ข้อมูล';

    if (capacityPercent >= c.criticalCapacityPercent || waterLevelM >= bankLevelM) {
      severity = 'CRITICAL';
      subTypeTh = 'น้ำท่วมล้นตลิ่งวิกฤต (Overflow)';
      alertCategoryTh = '🚨 วิกฤตล้นตลิ่ง';
    } else if (capacityPercent >= c.warningCapacityPercent) {
      severity = 'WARNING';
      subTypeTh = 'ระดับน้ำสูงเกินเกณฑ์เตือนภัย (Warning)';
      alertCategoryTh = '🔴 เตือนภัยน้ำท่วม';
    } else if (capacityPercent >= c.watchCapacityPercent) {
      severity = 'WATCH';
      subTypeTh = 'ระดับน้ำเฝ้าระวังใกล้ตลิ่ง (Watch)';
      alertCategoryTh = '🟡 เฝ้าระวังน้ำท่า';
    }

    return {
      severity,
      subTypeTh,
      shouldAlert: severity === 'CRITICAL' || severity === 'WARNING',
      alertCategoryTh,
      summaryTh: `ระดับน้ำ ${waterLevelM.toFixed(2)} ม. (${capacityPercent.toFixed(0)}% ความจุลำน้ำ, ระดับตลิ่ง ${bankLevelM.toFixed(2)} ม.)`
    };
  }

  /**
   * Evaluate Tropical Storm severity
   */
  public static evaluateStorm(windSpeedKmh: number, distanceKm: number, categoryName: string): RuleEvaluationResult {
    const c = this.criteria.storm;
    let severity: SeverityLevel = 'INFORMATION';
    let subTypeTh = 'หย่อมความกดอากาศต่ำทั่วไป';
    let alertCategoryTh = '🟢 ข้อมูล';

    if (windSpeedKmh >= c.criticalWindSpeedKmh && distanceKm <= c.monitoringRadiusKm) {
      severity = 'CRITICAL';
      subTypeTh = 'พายุไต้ฝุ่น / พายุหมุนเขตร้อนรุนแรง';
      alertCategoryTh = '🚨 วิกฤตพายุหมุน';
    } else if (windSpeedKmh >= c.warningWindSpeedKmh && distanceKm <= c.monitoringRadiusKm) {
      severity = 'WARNING';
      subTypeTh = 'พายุโซนร้อน (Tropical Storm)';
      alertCategoryTh = '🔴 แจ้งเตือนพายุรุนแรง';
    } else if (windSpeedKmh >= c.watchWindSpeedKmh && distanceKm <= c.monitoringRadiusKm) {
      severity = 'WATCH';
      subTypeTh = 'พายุดีเปรสชัน / หย่อมความกดอากาศต่ำกำลังแรง';
      alertCategoryTh = '🟡 เฝ้าระวังพายุ';
    }

    return {
      severity,
      subTypeTh,
      shouldAlert: severity === 'CRITICAL' || severity === 'WARNING' || (severity === 'WATCH' && distanceKm <= 600),
      alertCategoryTh,
      summaryTh: `${categoryName} ความเร็วลมสูงสุด ${windSpeedKmh} กม./ชม. ห่างจากไทย ~${Math.round(distanceKm)} กม.`
    };
  }

  /**
   * Evaluate PM2.5 Air Quality severity
   */
  public static evaluatePM25(pm25Value: number, aqi?: number): RuleEvaluationResult {
    const c = this.criteria.pm25;
    let severity: SeverityLevel = 'INFORMATION';
    let subTypeTh = 'คุณภาพอากาศดีมาก-ปานกลาง';
    let alertCategoryTh = '🟢 ข้อมูล';

    if (pm25Value >= c.criticalThreshold) {
      severity = 'CRITICAL';
      subTypeTh = 'ฝุ่น PM2.5 วิกฤตอันตราย (สีแดง)';
      alertCategoryTh = '🚨 วิกฤตมลพิษทางอากาศ';
    } else if (pm25Value >= c.warningThreshold) {
      severity = 'WARNING';
      subTypeTh = 'ฝุ่น PM2.5 เริ่มมีผลกระทบต่อสุขภาพ (สีส้ม)';
      alertCategoryTh = '🟠 ควรระวังสุขภาพ';
    } else if (pm25Value >= c.watchThreshold) {
      severity = 'WATCH';
      subTypeTh = 'ฝุ่น PM2.5 ปานกลาง (สีเหลือง)';
      alertCategoryTh = '🟡 เฝ้าระวัง';
    }

    return {
      severity,
      subTypeTh,
      shouldAlert: severity === 'CRITICAL' || severity === 'WARNING',
      alertCategoryTh,
      summaryTh: `PM2.5 อยู่ที่ ${pm25Value.toFixed(1)} µg/m³ ${aqi ? `(AQI: ${aqi})` : ''}`
    };
  }

  /**
   * Evaluate Heavy Rain severity
   */
  public static evaluateHeavyRain(rainMmPerHour: number): RuleEvaluationResult {
    const c = this.criteria.heavyRain;
    let severity: SeverityLevel = 'INFORMATION';
    let subTypeTh = 'ฝนตกทั่วไป';
    let alertCategoryTh = '🟢 ข้อมูล';

    if (rainMmPerHour >= c.criticalRainMmPerHour) {
      severity = 'CRITICAL';
      subTypeTh = 'ฝนตกหนักมากระดับวิกฤต (เสี่ยงน้ำท่วมฉับพลัน/ดินถล่ม)';
      alertCategoryTh = '🚨 วิกฤตฝนตกหนัก';
    } else if (rainMmPerHour >= c.warningRainMmPerHour) {
      severity = 'WARNING';
      subTypeTh = 'ฝนตกหนัก (เสี่ยงน้ำท่วมขัง)';
      alertCategoryTh = '🔴 เตือนภัยฝนตกหนัก';
    } else if (rainMmPerHour >= c.watchRainMmPerHour) {
      severity = 'WATCH';
      subTypeTh = 'ฝนตกปานกลางถึงหนัก';
      alertCategoryTh = '🟡 เฝ้าระวังฝน';
    }

    return {
      severity,
      subTypeTh,
      shouldAlert: severity === 'CRITICAL' || severity === 'WARNING',
      alertCategoryTh,
      summaryTh: `ปริมาณฝนสะสม ${rainMmPerHour.toFixed(1)} มม./ชม.`
    };
  }

  /**
   * Detect whether an existing event has changed significantly
   * Example:
   * Earthquake: Magnitude changed by >= 0.3
   * Flood: Capacity changed by >= 5% or status escalated
   * PM2.5: Crossed threshold or changed by >= 25 µg/m³
   * Any: Severity escalated (WATCH -> WARNING, WARNING -> CRITICAL)
   */
  public static checkSignificantChange(previous: NormalizedEvent, current: NormalizedEvent): SignificantChangeCheck {
    const severityHierarchy: Record<SeverityLevel, number> = {
      INFORMATION: 1,
      WATCH: 2,
      WARNING: 3,
      CRITICAL: 4
    };

    const prevRank = severityHierarchy[previous.severity] || 1;
    const currRank = severityHierarchy[current.severity] || 1;

    // 1. Severity Escalation or De-escalation
    if (currRank > prevRank) {
      return {
        isSignificant: true,
        reasonTh: `ยกระดับความรุนแรงจาก ${previous.severity} เป็น ${current.severity}`,
        previousValueSummary: `ระดับ: ${previous.severity}`,
        newValueSummary: `ระดับใหม่: ${current.severity}`
      };
    }

    // 2. Earthquake Significant Update (Magnitude adjustment by >= 0.3)
    if (current.type === 'EARTHQUAKE' && previous.magnitude !== undefined && current.magnitude !== undefined) {
      const diff = Math.abs(current.magnitude - previous.magnitude);
      if (diff >= 0.3) {
        return {
          isSignificant: true,
          reasonTh: `อัปเดตขนาดความรุนแรง Magnitude จาก ${previous.magnitude.toFixed(1)} เป็น ${current.magnitude.toFixed(1)}`,
          previousValueSummary: `Magnitude ${previous.magnitude.toFixed(1)}`,
          newValueSummary: `Magnitude ${current.magnitude.toFixed(1)}`
        };
      }
    }

    // 3. Flood Significant Update (Capacity changed by >= 5% or water level crossed bank)
    if (current.type === 'FLOOD' && previous.waterLevelMeters !== undefined && current.waterLevelMeters !== undefined) {
      const levelDiff = Math.abs(current.waterLevelMeters - previous.waterLevelMeters);
      if (levelDiff >= 0.3) {
        return {
          isSignificant: true,
          reasonTh: `ระดับน้ำเปลี่ยนแปลงอย่างมีนัยสำคัญ (${previous.waterLevelMeters.toFixed(2)} ม. → ${current.waterLevelMeters.toFixed(2)} ม.)`,
          previousValueSummary: `${previous.waterLevelMeters.toFixed(2)} ม.`,
          newValueSummary: `${current.waterLevelMeters.toFixed(2)} ม.`
        };
      }
    }

    // 4. PM2.5 Significant Update (changed by >= 25 µg/m³)
    if (current.type === 'PM25' && previous.pm25Value !== undefined && current.pm25Value !== undefined) {
      const pmDiff = Math.abs(current.pm25Value - previous.pm25Value);
      if (pmDiff >= 25) {
        return {
          isSignificant: true,
          reasonTh: `ค่าฝุ่น PM2.5 เปลี่ยนแปลงอย่างมีนัยสำคัญ (${previous.pm25Value.toFixed(1)} → ${current.pm25Value.toFixed(1)} µg/m³)`,
          previousValueSummary: `${previous.pm25Value.toFixed(1)} µg/m³`,
          newValueSummary: `${current.pm25Value.toFixed(1)} µg/m³`
        };
      }
    }

    // 5. Storm wind speed update (changed by >= 15 km/h)
    if (current.type === 'STORM' && previous.windSpeedKmh !== undefined && current.windSpeedKmh !== undefined) {
      const windDiff = Math.abs(current.windSpeedKmh - previous.windSpeedKmh);
      if (windDiff >= 15) {
        return {
          isSignificant: true,
          reasonTh: `ความเร็วลมสูงสุดเปลี่ยนแปลง (${previous.windSpeedKmh} → ${current.windSpeedKmh} กม./ชม.)`,
          previousValueSummary: `${previous.windSpeedKmh} กม./ชม.`,
          newValueSummary: `${current.windSpeedKmh} กม./ชม.`
        };
      }
    }

    return { isSignificant: false };
  }
}
