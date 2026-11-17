import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export function Modal({ open, onOpenChange, children }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/50" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false);
          }}
        >
          <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
