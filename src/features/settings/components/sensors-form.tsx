"use client";

import React, { useState } from 'react';
import { useUserSettings } from "@/hooks/useUserSettings";
import { Switch } from "@/shared/ui/ui/switch";
import { Button } from "@/shared/ui/ui/button";
import { MapPin, Move, Battery } from 'lucide-react';
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
  const [locationStatus, setLocationStatus] = useState<string>(settings.homeLat ? 'Home Set' : 'Unknown');

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
          setLocationStatus('Updated!');
          toast.success("Home location updated!");
          setTimeout(() => setLocationStatus('Home Set'), 3000);
        },
        (err) => {
          console.error(err);
          setLocationStatus('Error');
          toast.error("Failed to get location");
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
      );
    } else {
      setLocationStatus('Not supported');
      toast.error("Geolocation is not supported");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Sensors</CardTitle>
        <CardDescription>
          Hardware adaptivity settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Location Toggle */}
        <div className="flex flex-col gap-2 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className={`h-4 w-4 ${settings.useLocation ? "text-primary" : "text-muted-foreground"}`} />
              <div className="flex flex-col">
                <span className="text-xs font-medium">Location Tracking</span>
                <span className="text-[10px] text-muted-foreground">Home vs Work detection</span>
              </div>
            </div>
            <Switch
              checked={!!settings.useLocation}
              onCheckedChange={toggleLocation}
              className="scale-75"
            />
          </div>

          {/* Home Baseline Configuration */}
          {settings.useLocation && (
            <div className="flex items-center justify-between pt-2 border-t mt-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Home Base</span>
                <span className={`text-[10px] font-medium ${locationStatus.includes('Error') ? 'text-destructive' : 'text-primary'}`}>{locationStatus}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] px-2"
                onClick={setHomeLocation}
              >
                Set Current
              </Button>
            </div>
          )}
        </div>

        {/* Motion Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <Move className={`h-4 w-4 ${settings.useMotion ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex flex-col">
              <span className="text-xs font-medium">Activity Detection</span>
              <span className="text-[10px] text-muted-foreground">Walking vs sitting</span>
            </div>
          </div>
          <Switch
            checked={!!settings.useMotion}
            onCheckedChange={toggleMotion}
            className="scale-75"
          />
        </div>

        {/* Static Battery Status Indicator */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10 opacity-60">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Battery className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-xs font-medium">Battery Aware</span>
              <span className="text-[10px]">Optimize power usage</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">Always On</span>
        </div>
      </CardContent>
    </Card>
  );
}
