/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Data Provider Interface
 */

import type { NormalizedEvent } from '../../shared/types.ts';

export interface DataFetchResult {
  events: NormalizedEvent[];
  observations?: any;
  errors?: string[];
  rawCount: number;
}

export interface DisasterDataProvider {
  readonly id: string;
  readonly name: string;
  readonly category: 'Earthquake' | 'Weather' | 'Flood' | 'Air Quality' | 'Storm';
  readonly sourceUrl: string;
  isEnabled: boolean;
  pollIntervalMs: number;

  fetchData(): Promise<DataFetchResult>;
}
