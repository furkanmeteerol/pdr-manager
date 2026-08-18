import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
  targetId?: 'modal-root' | 'lock-root';
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ children, targetId = 'modal-root' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  const container = document.getElementById(targetId) || document.body;
  return createPortal(children, container);
};
