'use client';

import React, { useState, useRef } from 'react';
import { Zap, Hash } from 'lucide-react';
import { Modal } from '@/components/ui/Dialog';
import { useReferenceContext } from '@/context/ReferenceContext';
import { TaskService } from '@/services/TaskService';
import { useNavigation } from '@/context/NavigationContext';
import { TagPicker } from './pickers/TagPicker';
import Flyout from './ui/Flyout';
import { Category } from '@/entities/tag';

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

    const newTaskId = await TaskService.getInstance().addTask(
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
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary/50 mb-2">
              Task Title
            </label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartFocus()}
              placeholder="What are you working on?"
              className="w-full bg-foreground/5 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-secondary/30 focus:border-primary focus:outline-none transition-colors"
              autoFocus
            />
          </div>
          {/* Project/Tag Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-secondary/50 mb-2">
              Project
            </label>
            <div className="relative">
                <button
                    ref={pickerTriggerRef}
                    onClick={() => setIsPickerOpen(!isPickerOpen)}
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
                <Flyout 
                    isOpen={isPickerOpen} 
                    onClose={() => setIsPickerOpen(false)}
                    triggerEl={pickerTriggerRef.current}
                >
                    <TagPicker 
                        tags={tags} 
                        selectedTagId={categoryId} 
                        onSelect={(id) => {
                            setCategoryId(id);
                            setIsPickerOpen(false);
                        }} 
                    />
                </Flyout>
            </div>
          </div>
        </div>
      </Modal.Content>
      <Modal.Footer>
        <button 
          onClick={handleStartFocus}
          disabled={!title.trim()}
          className="w-full bg-primary hover:bg-primary-dim text-background font-bold text-sm h-12 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap size={16} />
          <span>Start Focusing</span>
        </button>
      </Modal.Footer>
    </Modal.Root>
  );
};
