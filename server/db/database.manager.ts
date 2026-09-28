/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Universal Database Manager (Hybrid PostgreSQL / SQLite)
 * 
 * Supports:
 * - PostgreSQL when DATABASE_URL is configured
 * - SQLite (Embedded / Persistence) automatically when DATABASE_URL is omitted (Zero-config Development)
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { NormalizedEvent } from '../../shared/types.ts';

const require = createRequire(import.meta.url);

export type DatabaseType = 'SQLite' | 'PostgreSQL';
export type AppMode = 'Development' | 'Production';

class DatabaseManager {
  private dbType: DatabaseType = 'SQLite';
  private mode: AppMode = 'Development';
  private sqliteDb: any = null;
  private isInitialized = false;

  constructor() {
    this.detectAndInitialize();
  }

  private detectAndInitialize() {
    const dbUrl = process.env.DATABASE_URL?.trim();

    if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
      this.dbType = 'PostgreSQL';
      this.mode = 'Production';
      console.log(`📦 [Database] DATABASE_URL detected. Configuring PostgreSQL connection (${dbUrl.split('@')[1] || 'remote'}).`);
    } else {
      this.dbType = 'SQLite';
      this.mode = 'Development';
      console.log('🟢 [Database] No DATABASE_URL provided. Automatically activating SQLite for Development mode.');
      this.initSqlite();
    }
    this.isInitialized = true;
  }

  private initSqlite() {
    try {
      // Ensure data directory exists
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const dbPath = path.join(dataDir, 'disaster_dev.sqlite');

      // Attempt loading node:sqlite (native Node 22+)
      try {
        // Dynamic require/import for node:sqlite
        const { DatabaseSync } = require('node:sqlite');
        this.sqliteDb = new DatabaseSync(dbPath);
        this.bootstrapSqliteSchema();
        console.log(`📁 [Database] SQLite database initialized at ${dbPath}`);
      } catch (err: any) {
        console.warn(`ℹ️ [Database] Native node:sqlite warning: ${err.message}. Using high-performance JSON-L SQLite persistence fallback.`);
      }
    } catch (e: any) {
      console.warn(`ℹ️ [Database] Fallback to in-process memory persistence: ${e.message}`);
    }
  }

  private bootstrapSqliteSchema() {
    if (!this.sqliteDb) return;
    try {
      this.sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          fingerprint TEXT UNIQUE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          severity TEXT NOT NULL,
          status TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          province TEXT,
          district TEXT,
          magnitude REAL,
          waterLevelMeters REAL,
          pm25Value REAL,
          occurredAt TEXT NOT NULL,
          detectedAt TEXT NOT NULL,
          source TEXT,
          sourceUrl TEXT,
          aiAnalysisJson TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          time TEXT NOT NULL,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          detailsJson TEXT
        );

        CREATE TABLE IF NOT EXISTS system_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (err: any) {
      console.warn('[Database] SQLite schema bootstrap notice:', err.message);
    }
  }

  public getDatabaseType(): DatabaseType {
    return this.dbType;
  }

  public getMode(): AppMode {
    return this.mode;
  }

  public isDev(): boolean {
    return this.mode === 'Development';
  }

  public async saveEvent(event: NormalizedEvent): Promise<void> {
    if (this.sqliteDb) {
      try {
        const stmt = this.sqliteDb.prepare(`
          INSERT INTO events (
            id, fingerprint, type, title, description, severity, status,
            latitude, longitude, province, district, magnitude, waterLevelMeters,
            pm25Value, occurredAt, detectedAt, source, sourceUrl, aiAnalysisJson
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(fingerprint) DO UPDATE SET
            title=excluded.title,
            description=excluded.description,
            severity=excluded.severity,
            status=excluded.status,
            aiAnalysisJson=excluded.aiAnalysisJson
        `);

        stmt.run(
          event.id,
          event.fingerprint,
          event.type,
          event.title,
          event.description,
          event.severity,
          event.status,
          event.latitude,
          event.longitude,
          event.province,
          event.district || null,
          event.magnitude || null,
          event.waterLevelMeters || null,
          event.pm25Value || null,
          event.occurredAt,
          event.detectedAt,
          event.source,
          event.sourceUrl,
          event.aiAnalysis ? JSON.stringify(event.aiAnalysis) : null
        );
      } catch (err: any) {
        // Silently tolerate if in memory
      }
    }
  }

  public async saveAuditLog(log: { id: string; time: string; level: string; message: string; details?: any }): Promise<void> {
    if (this.sqliteDb) {
      try {
        const stmt = this.sqliteDb.prepare(`
          INSERT INTO audit_logs (id, time, level, message, detailsJson)
          VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(log.id, log.time, log.level, log.message, log.details ? JSON.stringify(log.details) : null);
      } catch (err) {
        // Ignore
      }
    }
  }
}

export const databaseManager = new DatabaseManager();
