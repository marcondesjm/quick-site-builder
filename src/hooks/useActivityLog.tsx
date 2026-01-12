import { useState, useEffect } from 'react';

// Simple global state for activity log visibility
let isActivityLogOpen = false;
let listeners: Set<() => void> = new Set();

export const useActivityLog = () => {
  const [isOpen, setIsOpen] = useState(isActivityLogOpen);

  useEffect(() => {
    const listener = () => setIsOpen(isActivityLogOpen);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toggle = () => {
    isActivityLogOpen = !isActivityLogOpen;
    listeners.forEach(l => l());
  };

  const open = () => {
    isActivityLogOpen = true;
    listeners.forEach(l => l());
  };

  const close = () => {
    isActivityLogOpen = false;
    listeners.forEach(l => l());
  };

  return { isOpen, toggle, open, close };
};
