'use client';

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface ModalProviderProps {
  children: React.ReactNode;
}

interface ModalContextType {
  isOpen: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOpen: (modal: ReactNode, fetchData?: () => Promise<any>) => void;
  setClose: () => void;
}

const ModalContext = createContext<ModalContextType>({
  isOpen: false,
  setClose: () => {},
  setOpen: () => {},
});

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showingModal, setShowingModal] = useState<ReactNode>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(function () {
    setIsMounted(true);
  }, []);

  const setOpen = async (modal: ReactNode) => {
    if (modal) {
      setShowingModal(modal);
      setIsOpen(true);
    }
  };

  const setClose = () => {
    setIsOpen(false);
  };

  if (!isMounted) return null;

  return (
    <ModalContext.Provider value={{ setClose, setOpen, isOpen }}>
      {children}
      {showingModal}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined)
    throw new Error('useModal used outside its provider.');

  return context;
};
