'use client';

import React from 'react';
import { Check, Zap, BatteryWarning, Meh, X } from 'lucide-react';
import { useSessionSummaryController } from '@/hooks/controllers/useSessionSummaryController';
import { Modal } from '@/shared/ui/Dialog';

/**
 * Interface for SessionSummaryModal props.
 */
interface SessionSummaryModalProps {
    /** The ID of the task that was just completed. If null, modal is hidden. */
    taskId?: string;
    /** Callback to close the modal. */
    onClose: () => void;
}

/**
 * Reflection modal displayed after completing a focus session.
 * It allows the user to log their post-task mood and optional notes,
 * which are then used to update the biological energy model.
 *
 * @component
 * @interaction
 * - Uses `useSessionSummaryController` to calculate energy impact in real-time.
 * - Displays a set of mood options (Drained, Neutral, Energized).
 * - Persists the reflection data to Firestore on completion.
 */
const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({ taskId, onClose }) => {
  const { state, actions } = useSessionSummaryController(taskId);

  const moodOptions = [
    { label: 'Drained', icon: BatteryWarning, color: 'text-orange-400', activeBg: 'bg-orange-500/20' },
    { label: 'Neutral', icon: Meh, color: 'text-blue-400', activeBg: 'bg-blue-500/20' },
    { label: 'Energized', icon: Zap, color: 'text-primary', activeBg: 'bg-primary/20' }
  ] as const;

  const handleFinish = () => {
    actions.finishSession();
    onClose();
  };

  if (state.isLoading || !taskId) return null;

  return (
    <Modal.Root isOpen={!!taskId} onClose={onClose}>
        <Modal.Header 
            title="Session Complete"
            onClose={onClose}
        />
        <Modal.Content>
            {/* Task Summary Info */}
            <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check size={24} className="text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-medium text-foreground leading-tight mb-1">{state.task?.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-secondary">
                        <span className="font-mono text-foreground">{state.getTimeChipText()}</span>
                        <span className="w-1 h-1 rounded-full bg-border"></span>
                        <span>{state.energyDelta > 0 ? '+' : ''}{state.energyDelta} Energy</span>
                    </div>
                </div>
            </div>

            {/* Reflection Inputs */}
            <div className="space-y-6">
                
                {/* Mood Selection */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary/50 mb-3">How do you feel?</label>
                    <div className="grid grid-cols-3 gap-2">
                        {moodOptions.map((option) => {
                            const isActive = state.mood === option.label;
                            return (
                                <button
                                    key={option.label}
                                    onClick={() => actions.setMood(option.label)}
                                    className={`flex flex-col items-center justify-center gap-2 py-3 rounded-xl border transition-all ${isActive ? `${option.activeBg} border-transparent ring-1 ring-border` : 'bg-foreground/5 border-transparent hover:border-border text-secondary'}`}
                                >
                                    <option.icon size={20} className={isActive ? option.color : 'opacity-50'} />
                                    <span className={`text-xxs font-bold uppercase ${isActive ? 'text-foreground' : 'opacity-50'}`}>{option.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Session Notes */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-secondary/50 mb-2">Notes</label>
                    <input 
                        type="text"
                        value={state.notes}
                        onChange={(e) => actions.setNotes(e.target.value)}
                        placeholder="Add a reflection..."
                        className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-secondary/30 focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
            </div>
        </Modal.Content>

        <Modal.Footer>
            <button 
                onClick={handleFinish}
                className="w-full py-3.5 bg-foreground text-background hover:bg-foreground/80 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
            >
                <span>Done</span>
            </button>
        </Modal.Footer>
    </Modal.Root>
  );
};

export default SessionSummaryModal;
