'use client';

import React from 'react';
import { Check, Zap, BatteryWarning, Meh, X } from 'lucide-react';
import { useSessionSummaryController } from '@/hooks/controllers/useSessionSummaryController';
import { Modal } from '@/shared/ui/dialog';

/**
 * Interface for SessionSummaryModal props.
 */
interface SessionSummaryModalProps {
  /** ID of the task that was just completed. */
  taskId: string | undefined;
  /** Callback to close the modal. */
  onClose: () => void;
}

/**
 * Post-task reflection modal.
 * Allows users to report their mood and see the projected impact on their
 * biological energy after finishing a focus session.
 *
 * @component
 */
const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({ taskId, onClose }) => {
  const { state, actions } = useSessionSummaryController(taskId);

  if (!taskId || !state.task) return null;

  return (
    <Modal.Root isOpen={!!taskId} onClose={onClose}>
      <Modal.Header
        title="Session Complete"
        onClose={onClose}
      />
      <Modal.Content>
        {/* Success Header */}
        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 animate-in zoom-in-50 duration-500">
                <Check size={32} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{state.task.title}</h2>
            <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-foreground/5 border border-border text-xs text-secondary font-medium">
                    {state.getTimeChipText()}
                </span>
                {state.timeDifference !== 0 && (
                    <span className={`text-xs font-bold ${state.timeDifference > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {state.timeDifference > 0 ? `+${Math.round(state.timeDifference/60)}m over` : `-${Math.abs(Math.round(state.timeDifference/60))}m under`}
                    </span>
                )}
            </div>
        </div>

        {/* Mood Reflection */}
        <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary/50">How do you feel?</h3>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'Energized', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                    { id: 'Neutral', icon: Meh, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { id: 'Drained', icon: BatteryWarning, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                ].map(option => (
                    <button
                        key={option.id}
                        onClick={() => actions.setMood(option.id as any)}
                        className={`
                            flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all
                            ${state.mood === option.id
                                ? `${option.bg} border-current ${option.color}`
                                : 'border-border bg-foreground/5 text-secondary hover:border-secondary/30'
                            }
                        `}
                    >
                        <option.icon size={24} />
                        <span className="text-xs font-bold">{option.id}</span>
                    </button>
                ))}
            </div>

            {/* Energy Impact Projection */}
            <div className="p-4 rounded-2xl bg-surface-highlight border border-border mt-6">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-secondary uppercase">Projected Energy</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-foreground">{Math.round(state.projectedEnergy)}</span>
                        <span className={`text-xs font-bold ${state.energyDelta >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                            {state.energyDelta >= 0 ? '+' : ''}{Math.round(state.energyDelta)}
                        </span>
                    </div>
                </div>
                <div className="w-full h-2 bg-foreground/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${state.energyDelta >= 0 ? 'bg-emerald-400' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, Math.max(5, state.projectedEnergy))}%` }}
                    />
                </div>
            </div>

            {/* Optional Notes */}
            <div className="mt-6">
                 <textarea
                    value={state.notes}
                    onChange={(e) => actions.setNotes(e.target.value)}
                    placeholder="Any reflections on this session? (Optional)"
                    className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-secondary/30 focus:border-primary focus:outline-none transition-colors min-h-[100px] resize-none"
                />
            </div>
        </div>
      </Modal.Content>
      <Modal.Footer>
        <button
          onClick={async () => {
              await actions.finishSession();
              onClose();
          }}
          className="w-full bg-primary hover:bg-primary-dim text-background font-bold text-sm h-12 rounded-xl transition-all shadow-lg shadow-primary/20"
        >
          Done
        </button>
      </Modal.Footer>
    </Modal.Root>
  );
};

export default SessionSummaryModal;
