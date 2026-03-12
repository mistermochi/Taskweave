'use client'
import React, { useState } from 'react';
import { DatePicker } from "@/components/pickers/DatePicker";

export default function VerifyDatePage() {
  const [date, setDate] = useState<number | undefined>(undefined);

  return (
    <div className="p-4 bg-background h-screen flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold mb-4 text-foreground">Compact Picker (Mobile Context)</h2>
        <div className="border rounded-lg inline-block overflow-hidden shadow-xl bg-card max-w-[360px]">
          <DatePicker type="assigned" value={date} onChange={setDate} />
        </div>
      </div>
      <div className="text-foreground">
        Selected Date: {date ? new Date(date).toLocaleString() : 'None'}
      </div>
    </div>
  );
}
