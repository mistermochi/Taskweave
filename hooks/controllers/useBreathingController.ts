
import { useState, useEffect, useRef } from 'react';
import { useUserId } from '@/hooks/useFirestore';
import { db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ContextService } from '@/services/ContextService';
import { useNavigation } from '@/context/NavigationContext';

export const useBreathingController = () => {
  const uid = useUserId();
  const { returnToPreviousView } = useNavigation();
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [text, setText] = useState('Inhale');
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const sequence = [
      { text: 'Inhale', phase: 'inhale', duration: 4000 },
      { text: 'Hold', phase: 'hold', duration: 2000 },
      { text: 'Exhale', phase: 'exhale', duration: 4000 },
    ] as const;

    let currentIndex = 0;

    function nextStep() {
      const current = sequence[currentIndex];
      setText(current.text);
      setPhase(current.phase);

      currentIndex = (currentIndex + 1) % sequence.length;

      timeoutId = setTimeout(nextStep, current.duration);
    }

    nextStep();

    return () => clearTimeout(timeoutId);
  }, []);

  const closeSession = async () => {
    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - startTimeRef.current) / 1000);
    
    // Log if duration is meaningful (> 5 seconds) and user exists
    if (durationSeconds > 5 && uid) {
      const context = await ContextService.getInstance().getSnapshot();
      const id = crypto.randomUUID();

      await setDoc(doc(db, 'users', uid, 'vitals', id), {
        id,
        timestamp: endTime,
        type: 'breathe',
        value: durationSeconds,
        context
      });
    }

    returnToPreviousView();
  };

  return {
    state: { phase, text },
    actions: { closeSession }
  };
};
