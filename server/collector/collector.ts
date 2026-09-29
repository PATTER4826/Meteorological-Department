/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Data Collector Facade (Powered by 24/7 AlertWorker)
 */

import { alertWorker } from '../worker/alert.worker.ts';
import type { NormalizedEvent } from '../../shared/types.ts';

class DataCollector {
  public async start() {
    await alertWorker.start();
  }

  public stop() {
    alertWorker.stop();
  }

  public async triggerSimulation(scenario: 'EARTHQUAKE' | 'FLOOD' | 'STORM' | 'PM25'): Promise<NormalizedEvent> {
    return alertWorker.triggerTestAlert(scenario);
  }
}

export const dataCollector = new DataCollector();
