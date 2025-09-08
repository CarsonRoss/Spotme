import { useEffect, useRef } from 'react';
import { startSpeedUpdates, stopSpeedUpdates } from '../../services/locationService';
import { getSpotsCloud } from '../../services/cloudStorage';
import { confirmParked, sendSpotOpeningNotification } from '../../services/notificationService';

const SPEED_STOP_THRESHOLD_MS = 60_000; // 1 minute
const SPEED_ZERO_THRESHOLD = 0.3; // m/s ~ 0.67 mph to treat as parked

export default function useParkedNotifier() {
  const parkedSinceRef = useRef<number | null>(null);
  const notifiedThisStopRef = useRef<boolean>(false);
  const cooldownUntilRef = useRef<number>(0);
  const wasParkedRef = useRef<boolean>(false);
  const userConfirmedParkedRef = useRef<boolean>(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    startSpeedUpdates(async (speed, loc) => {
      const now = Date.now();
      const isStopped = typeof speed === 'number' ? speed <= SPEED_ZERO_THRESHOLD : false;
      // Detect transition from parked -> moving (> ~10 mph)
      const isMovingFast = typeof speed === 'number' ? speed >= 4.4704 : false; // 10 mph
      if (wasParkedRef.current && userConfirmedParkedRef.current && !isStopped && isMovingFast) {
        wasParkedRef.current = false;
        userConfirmedParkedRef.current = false;
        // on depart, broadcast opening spot at last known location
        if (loc) {
          await sendSpotOpeningNotification(loc.coords.latitude, loc.coords.longitude);
        }
      }

      if (!isStopped) {
        parkedSinceRef.current = null;
        notifiedThisStopRef.current = false;
        return;
      }

      if (parkedSinceRef.current == null) {
        parkedSinceRef.current = now;
        return;
      }

      if (notifiedThisStopRef.current) return;
      // If user previously declined, wait 3 minutes before asking again
      if (Date.now() < cooldownUntilRef.current) return;

      const elapsed = now - parkedSinceRef.current;
      if (elapsed < SPEED_STOP_THRESHOLD_MS) return;

      // At least 1 min stopped; ask confirm regardless of spot radius
      try {
        if (!loc) return;
        const res = await confirmParked(30_000);
        if (res === 'no') {
          cooldownUntilRef.current = Date.now() + 3 * 60_000; // 3 minutes
          // reset timer to require a fresh continuous minute next time
          parkedSinceRef.current = null;
          wasParkedRef.current = false;
          userConfirmedParkedRef.current = false;
          return;
        }
        if (res === 'yes') {
          wasParkedRef.current = true;
          userConfirmedParkedRef.current = true;
          notifiedThisStopRef.current = true; // don't re-ask until movement
        }
      } catch {
        // ignore failures silently for now
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
      stopSpeedUpdates();
    };
  }, []);
}
