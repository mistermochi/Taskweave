'use client';

import React, { useState } from 'react';
import { Tag } from '@/entities/tag';
import { TaskEntity, EnergyLevel, RecurrenceConfig } from '@/entities/task';
import { parseTaskInput } from '@/shared/lib/textParserUtils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { TagPicker } from '@/components/pickers/TagPicker';
import { DurationPicker } from '@/components/pickers/DurationPicker';
import { EnergyPicker } from '@/components/pickers/EnergyPicker';
import { DatePicker } from '@/components/pickers/DatePicker';
import { RecurrencePicker as RecurrenceInlinePicker } from '@/components/pickers/RecurrencePicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Hash, Clock, Zap, CalendarClock, Calendar, Repeat } from 'lucide-react';

interface CreateTaskSheetContentProps {
  initialSection: string | null;
  activeTagId: string | null;
  tags: Tag[];
  onCreate: (title: string, updates: Partial<TaskEntity>) => void;
  onClose: () => void;
}

export const CreateTaskSheetContent: React.FC<CreateTaskSheetContentProps> = ({
  initialSection,
  activeTagId,
  tags,
  onCreate,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tagId, setTagId] = useState(activeTagId || '');
  const [duration, setDuration] = useState(30);
  const [energy, setEnergy] = useState<EnergyLevel>('Medium');

  const getInitialDates = () => {
    let assigned: number | undefined = undefined;
    if (initialSection === 'today') {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      assigned = d.getTime();
    } else if (initialSection === 'upcoming') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
      assigned = d.getTime();
    }
    return { assigned };
  };

  const initialDates = getInitialDates();
  const [assignedDate, setAssignedDate] = useState<number | undefined>(initialDates.assigned);
  const [dueDate, setDueDate] = useState<number | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | undefined>(undefined);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    // Apply NLP parsing
    const { attributes } = parseTaskInput(newTitle);

    if (attributes.energy) setEnergy(attributes.energy);
    if (attributes.duration) setDuration(attributes.duration);
    if (attributes.assignedDate) setAssignedDate(attributes.assignedDate);
    if (attributes.dueDate) setDueDate(attributes.dueDate);
    if (attributes.recurrence) setRecurrence(attributes.recurrence);
    if (attributes.tagKeyword) {
      const matchedTag = tags.find(t => t.name.toLowerCase() === attributes.tagKeyword?.toLowerCase());
      if (matchedTag) setTagId(matchedTag.id);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) return;

    // Use cleaned title for the actual task
    const { cleanTitle } = parseTaskInput(title);

    onCreate(cleanTitle, {
      notes,
      category: tagId,
      duration,
      energy,
      assignedDate: assignedDate || null,
      dueDate: dueDate || null,
      recurrence: (dueDate ? recurrence : undefined) || null,
    });
    onClose();
  };

  const selectedTag = tags.find((t) => t.id === tagId);

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          autoFocus
          value={title}
          onChange={handleTitleChange}
          placeholder="What needs to be done? (e.g. 'Gym ~1h !high #personal')"
        />
        <p className="text-[10px] text-muted-foreground">
          Supports natural language: !high/med/low, ~30m, #tag, @today, due tomorrow, every monday...
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add details..."
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Project</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Hash size={14} style={{ color: selectedTag?.color }} />
                {selectedTag?.name || 'Inbox'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <TagPicker
                tags={tags}
                selectedTagId={tagId}
                onSelect={(id) => setTagId(id)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Duration</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Clock size={14} />
                {duration}m
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <DurationPicker duration={duration} onChange={setDuration} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Energy</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Zap size={14} />
                {energy}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <EnergyPicker energy={energy} onChange={setEnergy} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Scheduled</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <CalendarClock size={14} />
                {assignedDate ? new Date(assignedDate).toLocaleDateString() : 'Set date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <DatePicker
                value={assignedDate}
                onChange={setAssignedDate}
                type="assigned"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar size={14} />
                {dueDate ? new Date(dueDate).toLocaleDateString() : 'Set deadline'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <DatePicker value={dueDate} onChange={setDueDate} type="due" />
            </PopoverContent>
          </Popover>
        </div>

        {dueDate && (
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Repeat size={14} />
                  {recurrence ? recurrence.frequency : 'None'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <RecurrenceInlinePicker
                  standalone
                  value={recurrence}
                  onChange={setRecurrence}
                  baseDate={new Date(dueDate)}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" disabled={!title.trim()} onClick={handleCreate}>
          Create Task
        </Button>
      </div>
    </div>
  );
};
