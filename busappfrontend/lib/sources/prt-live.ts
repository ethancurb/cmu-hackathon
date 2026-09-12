/**
 * Live PRT source — a documented no-op stub. Wiring it is a future ticket; live feed access
 * is still unverified (issue #2).
 *
 * It returns empty results rather than throwing so that selecting DATA_MODE=live during
 * development degrades to an honestly empty panel instead of a crash. An empty result means
 * "we have nothing to show", which the UI must render as unknown — never as available space.
 */

import type { CapacitySource } from "../capacity-source.js";
import type { ArrivalReading, Stop, StopEvent } from "../contracts.js";

export class PRTLiveSource implements CapacitySource {
  readonly name = "PRTLiveSource";

  async stop(_stopId: string): Promise<Stop | null> {
    return null;
  }

  async arrivalsForStop(_stopId: string, _simNow: Date): Promise<ArrivalReading[]> {
    return [];
  }

  async runFuture(_runId: string, _from: Date): Promise<StopEvent[]> {
    return [];
  }
}
