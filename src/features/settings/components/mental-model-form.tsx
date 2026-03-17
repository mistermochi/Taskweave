"use client";

import React, { useState } from 'react';
import { useTaskContext } from '@/context/TaskContext';
import { useVitalsContext } from '@/context/VitalsContext';
import { RecommendationEngine } from '@/services/RecommendationEngine';
import { Button } from "@/shared/ui/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/ui/card";
import { Brain, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

export function MentalModelForm() {
  const { tasks } = useTaskContext();
  const { vitals } = useVitalsContext();

  const [calibrationStatus, setCalibrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [calibrationCount, setCalibrationCount] = useState(0);

  const [historyCalibrationStatus, setHistoryCalibrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [historyCalibrationCount, setHistoryCalibrationCount] = useState(0);

  const handleAICalibration = async () => {
    if (tasks.length === 0) {
      toast.error("Please add some tasks before calibrating.");
      return;
    }
    setCalibrationStatus('loading');
    try {
      const count = await RecommendationEngine.getInstance().calibrate(tasks);
      setCalibrationCount(count);
      setCalibrationStatus('success');
      toast.success(`AI Calibrated with ${count} samples`);
    } catch (e) {
      console.error(e);
      setCalibrationStatus('error');
      toast.error("AI calibration failed");
    }
  };

  const handleHistoryCalibration = async () => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) {
      toast.error("No completed tasks found in history to learn from.");
      return;
    }
    setHistoryCalibrationStatus('loading');
    try {
      const engine = RecommendationEngine.getInstance();
      const count = await engine.recalibrateFromHistory(tasks, vitals);
      setHistoryCalibrationCount(count);
      setHistoryCalibrationStatus('success');
      toast.success(`Re-learned from ${count} tasks`);
    } catch (e) {
      console.error(e);
      setHistoryCalibrationStatus('error');
      toast.error("Historical learning failed");
    }
  };

  const isReady = calibrationStatus === 'success' || historyCalibrationStatus === 'success';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mental Model</CardTitle>
        <CardDescription>
          Teach the scheduling engine how you work best.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className={cn("h-5 w-5", isReady ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-semibold">Engine Status</span>
          </div>
          <span className={cn(
            "text-[10px] font-bold uppercase px-2 py-1 rounded",
            isReady ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {isReady ? "Ready" : "Cold Start"}
          </span>
        </div>

        <div className="grid gap-4">
          {/* AI Synthetic Calibration */}
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">AI Calibration</span>
              <p className="text-[11px] text-muted-foreground">Generate synthetic success scenarios using Gemini.</p>
            </div>
            <Button
              onClick={handleAICalibration}
              disabled={calibrationStatus === 'loading' || tasks.length === 0}
              variant={calibrationStatus === 'success' ? "outline" : "default"}
              className={cn("w-full justify-start", calibrationStatus === 'success' && "border-primary text-primary hover:bg-primary/5")}
            >
              {calibrationStatus === 'loading' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
              ) : calibrationStatus === 'success' ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> AI Calibrated ({calibrationCount})</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2 text-yellow-500" /> Calibrate with AI</>
              )}
            </Button>
          </div>

          {/* Historical Re-learning */}
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium">Historical Learning</span>
              <p className="text-[11px] text-muted-foreground">Replay previous task completions to train the model.</p>
            </div>
            <Button
              onClick={handleHistoryCalibration}
              disabled={historyCalibrationStatus === 'loading' || tasks.filter(t => t.status === 'completed').length === 0}
              variant={historyCalibrationStatus === 'success' ? "outline" : "secondary"}
              className={cn("w-full justify-start", historyCalibrationStatus === 'success' && "border-primary text-primary hover:bg-primary/5")}
            >
              {historyCalibrationStatus === 'loading' ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Learning...</>
              ) : historyCalibrationStatus === 'success' ? (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Re-Learned ({historyCalibrationCount})</>
              ) : (
                <><Brain className="h-4 w-4 mr-2" /> Learn from History</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
