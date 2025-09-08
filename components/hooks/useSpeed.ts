import { useEffect, useState } from 'react';
import { startSpeedUpdates, stopSpeedUpdates, getLastSpeed, type SpeedListener } from '../../services/locationService';

export default function useSpeed() {
  const [speed, setSpeed] = useState<number | null>(getLastSpeed());

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    const listener: SpeedListener = (s) => setSpeed(s);

    startSpeedUpdates(listener).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
      stopSpeedUpdates();
    };
  }, []);

  return speed; // meters/second or null
}
