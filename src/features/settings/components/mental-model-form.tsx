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
      <CardHeader className="pb-4">
        <CardTitle>Mental Model</CardTitle>
        <CardDescription>
          Teach the scheduling engine.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-2">
            <Brain className={cn("h-4 w-4", isReady ? "text-primary" : "text-muted-foreground")} />
            <span className="text-xs font-semibold">Engine Status</span>
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
            isReady ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {isReady ? "Ready" : "Cold Start"}
          </span>
        </div>

        <div className="grid gap-3">
          {/* AI Synthetic Calibration */}
          <div className="space-y-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Calibration</span>
              <p className="text-[10px] text-muted-foreground">Generate synthetic success scenarios.</p>
            </div>
            <Button
              onClick={handleAICalibration}
              disabled={calibrationStatus === 'loading' || tasks.length === 0}
              variant={calibrationStatus === 'success' ? "outline" : "default"}
              size="sm"
              className={cn("w-full justify-start h-8 text-xs", calibrationStatus === 'success' && "border-primary text-primary hover:bg-primary/5")}
            >
              {calibrationStatus === 'loading' ? (
                <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Analyzing...</>
              ) : calibrationStatus === 'success' ? (
                <><CheckCircle2 className="h-3 w-3 mr-2" /> AI Calibrated ({calibrationCount})</>
              ) : (
                <><Sparkles className="h-3 w-3 mr-2 text-yellow-500" /> Calibrate AI</>
              )}
            </Button>
          </div>

          {/* Historical Re-learning */}
          <div className="space-y-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Historical Learning</span>
              <p className="text-[10px] text-muted-foreground">Replay previous completions.</p>
            </div>
            <Button
              onClick={handleHistoryCalibration}
              disabled={historyCalibrationStatus === 'loading' || tasks.filter(t => t.status === 'completed').length === 0}
              variant={historyCalibrationStatus === 'success' ? "outline" : "secondary"}
              size="sm"
              className={cn("w-full justify-start h-8 text-xs", historyCalibrationStatus === 'success' && "border-primary text-primary hover:bg-primary/5")}
            >
              {historyCalibrationStatus === 'loading' ? (
                <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Learning...</>
              ) : historyCalibrationStatus === 'success' ? (
                <><CheckCircle2 className="h-3 w-3 mr-2" /> Re-Learned ({historyCalibrationCount})</>
              ) : (
                <><Brain className="h-3 w-3 mr-2" /> Learn from History</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
