'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/shared/ui/Card';
import { Brain, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { RecommendationEngine } from '@/services/RecommendationEngine';
import { useTaskContext } from '@/context/TaskContext';
import { useVitalsContext } from '@/context/VitalsContext';

/**
 * Settings section for managing the machine learning "brain" of the application.
 * It allows the user to manually trigger calibration cycles to align the AI
 * recommendation engine with their current backlog or historical behavior.
 *
 * @component
 * @interaction
 * - "Calibrate with AI": Uses LLM (Gemini) to generate synthetic success scenarios.
 * - "Learn from History": Replays previous task completions to train the LinUCB model.
 */
export const MentalModelSettings: React.FC = () => {
  const { tasks } = useTaskContext();
  const { vitals } = useVitalsContext();

  /** Status of the AI-driven synthetic calibration. */
  const [calibrationStatus, setCalibrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [calibrationCount, setCalibrationCount] = useState(0);

  /** Status of the historical behavior re-learning. */
  const [historyCalibrationStatus, setHistoryCalibrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [historyCalibrationCount, setHistoryCalibrationCount] = useState(0);

  /**
   * Triggers the synthetic calibration flow.
   */
  const handleAICalibration = async () => {
    if (tasks.length === 0) {
        alert("Please add some tasks before calibrating.");
        return;
    }
    setCalibrationStatus('loading');
    try {
        const count = await RecommendationEngine.getInstance().calibrate(tasks);
        setCalibrationCount(count);
        setCalibrationStatus('success');
    } catch (e) {
        console.error(e);
        setCalibrationStatus('error');
    }
  };

  /**
   * Triggers the historical data replay flow.
   */
  const handleHistoryCalibration = async () => {
    if (tasks.filter(t => t.status === 'completed').length === 0) {
        alert("No completed tasks found in history to learn from.");
        return;
    }
    setHistoryCalibrationStatus('loading');
    try {
        const engine = RecommendationEngine.getInstance();
        const count = await engine.recalibrateFromHistory(tasks, vitals);
        setHistoryCalibrationCount(count);
        setHistoryCalibrationStatus('success');
    } catch (e) {
        console.error(e);
        setHistoryCalibrationStatus('error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Brain size={18} />
        </div>
        <div>
          <CardTitle>Mental Model</CardTitle>
          <CardDescription>Teach the scheduling engine.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="p-4 bg-surface-highlight rounded-xl border border-border space-y-3">
            <p className="text-sm font-medium leading-relaxed text-secondary mb-1">
                Engine status: {calibrationStatus === 'success' || historyCalibrationStatus === 'success' ? <span className="text-primary">Ready</span> : <span className="text-secondary">Cold Start</span>}
            </p>
            
            {/* AI Synthetic Calibration Button */}
            <button 
              onClick={handleAICalibration}
              disabled={calibrationStatus === 'loading' || tasks.length === 0}
              className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${calibrationStatus === 'success' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-foreground hover:bg-surface-highlight'}`}
            >
                {calibrationStatus === 'loading' ? (
                    <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                ) : calibrationStatus === 'success' ? (
                    <><CheckCircle2 size={16} /> AI Calibrated ({calibrationCount} samples)</>
                ) : (
                    <><Sparkles size={16} className="text-accent" /> Calibrate with AI</>
                )}
            </button>

            {/* Historical Re-learning Button */}
            <button 
              onClick={handleHistoryCalibration}
              disabled={historyCalibrationStatus === 'loading' || tasks.filter(t => t.status === 'completed').length === 0}
              className={`w-full py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${historyCalibrationStatus === 'success' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-border text-foreground hover:bg-surface-highlight'}`}
            >
                {historyCalibrationStatus === 'loading' ? (
                    <><Loader2 size={16} className="animate-spin" /> Learning...</>
                ) : historyCalibrationStatus === 'success' ? (
                    <><CheckCircle2 size={16} /> Re-Learned ({historyCalibrationCount} tasks)</>
                ) : (
                    <><Brain size={16} /> Learn from History</>
                )}
            </button>
        </div>
      </CardContent>
    </Card>
  );
};
