"use client";

import React, { useState } from 'react';
import { useUserSettings } from "@/hooks/useUserSettings";
import { Switch } from "@/shared/ui/ui/switch";
import { Button } from "@/shared/ui/ui/button";
import { MapPin, Move, Battery, Zap } from 'lucide-react';
import { contextApi } from '@/entities/context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/ui/card";
import { toast } from "sonner";

export function SensorsForm() {
  const { settings, updateSettings } = useUserSettings();
  const [locationStatus, setLocationStatus] = useState<string>(settings.homeLat ? 'Home Location Set' : 'Unknown');

  const toggleLocation = async (checked: boolean) => {
    try {
      await updateSettings({ useLocation: checked });
      if (checked && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(() => {}, (err) => console.warn(err));
      }
      toast.success(`Location tracking ${checked ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error("Failed to update location setting");
    }
  };

  const toggleMotion = async (checked: boolean) => {
    try {
      if (checked) {
        const granted = await contextApi.requestMotionPermission();
        if (granted) {
          await updateSettings({ useMotion: true });
          toast.success("Activity tracking enabled");
        } else {
          toast.error("Motion permission denied or not supported.");
        }
      } else {
        await updateSettings({ useMotion: false });
        toast.success("Activity tracking disabled");
      }
    } catch (error) {
      toast.error("Failed to update activity setting");
    }
  };

  const setHomeLocation = () => {
    if ('geolocation' in navigator) {
      setLocationStatus('Locating...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateSettings({ homeLat: latitude, homeLng: longitude });
          setLocationStatus('Home Location Updated!');
          toast.success("Home location updated!");
          setTimeout(() => setLocationStatus('Home Location Set'), 3000);
        },
        (err) => {
          console.error(err);
          setLocationStatus('Error getting location');
          toast.error("Failed to get current location");
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
      );
    } else {
      setLocationStatus('Geolocation not supported');
      toast.error("Geolocation is not supported by your browser");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Context Sensors</CardTitle>
        <CardDescription>
          Allow Taskweave to adapt to your environment using hardware sensors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
          <div className="flex items-center gap-3">
            <div className={settings.useLocation ? "text-primary" : "text-muted-foreground"}>
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Location</span>
              <span className="text-xs text-muted-foreground">Home vs Work detection</span>
            </div>
          </div>
          <Switch
            checked={!!settings.useLocation}
            onCheckedChange={toggleLocation}
          />
        </div>

        {/* Home Baseline Configuration */}
        {settings.useLocation && (
          <div className="flex items-center justify-between p-4 rounded-xl border bg-accent/20 border-accent/50 ml-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Set &quot;Home&quot;</span>
              <span className={`text-[10px] font-medium ${locationStatus.includes('Error') ? 'text-destructive' : 'text-primary'}`}>{locationStatus}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={setHomeLocation}
            >
              Set Current
            </Button>
          </div>
        )}

        {/* Motion Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
          <div className="flex items-center gap-3">
            <div className={settings.useMotion ? "text-primary" : "text-muted-foreground"}>
              <Move className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Activity</span>
              <span className="text-xs text-muted-foreground">Detect walking vs sitting</span>
            </div>
          </div>
          <Switch
            checked={!!settings.useMotion}
            onCheckedChange={toggleMotion}
          />
        </div>

        {/* Static Battery Status Indicator */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card opacity-60">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Battery className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Battery Aware</span>
              <span className="text-xs">Optimize based on power</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-2 py-1 rounded">Always On</span>
        </div>
      </CardContent>
    </Card>
  );
}
