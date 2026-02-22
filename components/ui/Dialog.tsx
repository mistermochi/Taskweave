
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

// --- Shared Backdrop ---
const Backdrop: React.FC<{ isOpen: boolean; onClick: () => void; className?: string }> = ({ isOpen, onClick, className = '' }) => (
  <div 
    className={`fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${className}`}
    onClick={onClick}
  />
);

// --- Modal Primitives ---
const ModalRoot: React.FC<BaseDialogProps> = ({ isOpen, onClose, children, className = '' }) => {
  // We use local visible state to handle exit animations even if isOpen prop changes
  const [visible, setVisible] = useState(isOpen);
  
  useEffect(() => {
    if (isOpen) setVisible(true);
    else {
        const timer = setTimeout(() => setVisible(false), 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${className}`}>
      <Backdrop isOpen={isOpen} onClick={onClose} />
      <div 
        className={`
          relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] 
          transform transition-all duration-300 ease-elastic-out z-[70]
          animate-in fade-in-0 zoom-in-95
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}
        `}
      >
        {children}
      </div>
    </div>
  );
};

// --- Drawer Primitives ---
const DrawerRoot: React.FC<BaseDialogProps> = ({ isOpen, onClose, children, className = '' }) => {
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setVisible(true);
    else {
        const timer = setTimeout(() => setVisible(false), 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[60] flex justify-end ${className}`}>
      <Backdrop isOpen={isOpen} onClick={onClose} />
      <div 
        className={`
            relative w-full max-w-lg h-full bg-surface border-l border-border shadow-2xl flex flex-col z-[70]
            transform transition-transform duration-300 ease-elastic-out
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {children}
      </div>
    </div>
  );
};

// --- Common Parts ---
const Header: React.FC<{ title: React.ReactNode; onClose: () => void; actions?: React.ReactNode; className?: string }> = ({ title, onClose, actions, className = '' }) => (
  <header className={`px-6 py-4 flex items-center justify-between border-b border-border bg-surface/95 backdrop-blur-md shrink-0 ${className}`}>
    <div className="font-bold text-foreground text-sm uppercase tracking-wider truncate flex-1 pr-4">{title}</div>
    <div className="flex items-center gap-2">
      {actions}
      <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-secondary hover:text-foreground hover:bg-foreground/10 transition-colors">
        <X size={18} />
      </button>
    </div>
  </header>
);

const Content: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <main className={`flex-1 overflow-y-auto px-6 py-6 no-scrollbar ${className}`}>
    {children}
  </main>
);

const Footer: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <footer className={`p-4 border-t border-border bg-surface/95 shrink-0 ${className}`}>
    {children}
  </footer>
);

export const Modal = { Root: ModalRoot, Header, Content, Footer };
export const Drawer = { Root: DrawerRoot, Header, Content, Footer };
