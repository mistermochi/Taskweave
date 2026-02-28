'use client';

import React, { useState } from 'react';
import { Tag } from '@/entities/tag';
import { TaskEntity, EnergyLevel, RecurrenceConfig } from '@/entities/task';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { TagPicker } from '@/components/pickers/TagPicker';
import { DurationPicker } from '@/components/pickers/DurationPicker';
import { EnergyPicker } from '@/components/pickers/EnergyPicker';
import { DatePicker } from '@/components/pickers/DatePicker';
import { RecurrencePicker as RecurrenceInlinePicker } from '@/components/pickers/RecurrencePicker';
import { DependencyPicker } from '@/components/pickers/DependencyPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Hash, Clock, Zap, CalendarClock, Calendar, Repeat, GitBranch } from 'lucide-react';

interface TaskDetailsSheetContentProps {
  task: TaskEntity;
  allTasks: TaskEntity[];
  tags: Tag[];
  onUpdate: (task: TaskEntity, updates: Partial<TaskEntity>) => void;
  onClose: () => void;
}

export const TaskDetailsSheetContent: React.FC<TaskDetailsSheetContentProps> = ({
  task,
  allTasks,
  tags,
  onUpdate,
  onClose,
}) => {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [tagId, setTagId] = useState(task.category);
  const [duration, setDuration] = useState(task.duration);
  const [energy, setEnergy] = useState<EnergyLevel>(task.energy);
  const [assignedDate, setAssignedDate] = useState<number | undefined>(task.assignedDate || undefined);
  const [dueDate, setDueDate] = useState<number | undefined>(task.dueDate || undefined);
  const [recurrence, setRecurrence] = useState<RecurrenceConfig | undefined>(task.recurrence || undefined);
  const [blockedBy, setBlockedBy] = useState<string[]>(task.blockedBy || []);

  const handleSave = () => {
    onUpdate(task, {
      title,
      notes,
      category: tagId,
      duration,
      energy,
      assignedDate: assignedDate || null,
      dueDate: dueDate || null,
      recurrence: (dueDate ? recurrence : undefined) || null,
      blockedBy,
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />
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

        <div className="space-y-2 col-span-2">
          <Label>Dependencies</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <GitBranch size={14} />
                {blockedBy.length} blocked
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start">
              <DependencyPicker
                allTasks={allTasks}
                currentTaskId={task.id}
                selectedIds={blockedBy}
                onIdsChange={setBlockedBy}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-auto flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};
