'use client';

import React, { useState, useRef } from 'react';
import { Zap, Hash } from 'lucide-react';
import { Modal } from '@/shared/ui/dialog';
import { useReferenceContext } from '@/context/ReferenceContext';
import { taskApi } from '@/entities/task';
import { useNavigation } from '@/context/NavigationContext';
import { TagPicker } from '@/components/pickers/TagPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Category } from '@/entities/tag';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';

/**
 * Interface for QuickFocusModal props.
 */
interface QuickFocusModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Callback to close the modal. */
  onClose: () => void;
}

/**
 * Modal dialog for starting an unplanned, "adhoc" focus session.
 * It allows the user to quickly name a task and pick a project without
 * going through the full creation form.
 *
 * @component
 * @interaction
 * - Creates a new task with 0 duration, which triggers an "upward counting" timer mode.
 * - Automatically transitions to the focused view for the new task upon creation.
 */
export const QuickFocusModal: React.FC<QuickFocusModalProps> = ({ isOpen, onClose }) => {
  const { tags } = useReferenceContext();
  const { focusOnTask } = useNavigation();
  
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<Category>('');

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerTriggerRef = useRef<HTMLButtonElement>(null);


  /**
   * Creates the adhoc task and starts the focus session.
   */
  const handleStartFocus = async () => {
    if (!title.trim()) return;

    const newTaskId = await taskApi.addTask(
      title.trim(),
      categoryId,
      0,
      50,
      '',
      undefined,
      undefined
    );

    if (newTaskId) {
      onClose();
      // Delay to allow modal exit animation to finish
      setTimeout(() => {
        focusOnTask(newTaskId);
      }, 100);
    }
  };

  const selectedTag = tags.find(t => t.id === categoryId);

  return (
    <Modal.Root isOpen={isOpen} onClose={onClose}>
      <Modal.Header 
        title={
          <div className="flex items-center gap-2 text-foreground">
            <Zap size={20} className="text-primary" />
            <span>Start Unplanned Focus</span>
          </div>
        }
        onClose={onClose}
      />
      <Modal.Content>
        <p className="text-sm text-secondary mb-6">
          Give your task a name, choose a project, and jump right into focus mode. The timer will count up.
        </p>

        <div className="space-y-4">
          {/* Task Title Input */}
          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-secondary/50">
              Task Title
            </Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartFocus()}
              placeholder="What are you working on?"
              className="bg-foreground/5"
              autoFocus
            />
          </div>
          {/* Project/Tag Picker */}
          <div className="grid gap-2">
            <Label className="text-xs font-bold uppercase tracking-widest text-secondary/50">
              Project
            </Label>
            <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                      className="w-full flex items-center justify-between p-3 bg-foreground/5 border border-border rounded-xl text-sm text-foreground hover:border-primary transition-colors"
                  >
                      <div className="flex items-center gap-2">
                          {selectedTag ? (
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTag.color }}></span>
                          ) : (
                              <Hash size={12} className="text-secondary" />
                          )}
                          <span>{selectedTag?.name || 'Inbox'}</span>
                      </div>
                      <span className="text-xs text-secondary">Change</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                    <TagPicker 
                        tags={tags} 
                        selectedTagId={categoryId} 
                        onSelect={(id) => {
                            setCategoryId(id);
                            setIsPickerOpen(false);
                        }} 
                    />
                </PopoverContent>
            </Popover>
          </div>
        </div>
      </Modal.Content>
      <Modal.Footer className="sm:justify-center">
        <Button
          onClick={handleStartFocus}
          disabled={!title.trim()}
          className="w-full h-12 font-bold"
        >
          <Zap size={16} className="mr-2" />
          <span>Start Focusing</span>
        </Button>
      </Modal.Footer>
    </Modal.Root>
  );
};
