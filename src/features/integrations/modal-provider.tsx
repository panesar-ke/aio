'use client';

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface ModalProviderProps {
  children: React.ReactNode;
}

export type ModalData = {};

interface ModalContextType {
  data: ModalData;
  isOpen: boolean;
  setOpen: (modal: ReactNode, fetchData?: () => Promise<any>) => void;
  setClose: () => void;
}

const ModalContext = createContext<ModalContextType>({
  data: {},
  isOpen: false,
  setClose: () => {},
  setOpen: (modal: ReactNode, fetchData?: () => Promise<any>) => {},
});

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ModalData>({});
  const [showingModal, setShowingModal] = useState<ReactNode>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(function () {
    setIsMounted(true);
  }, []);

  const setOpen = async (modal: ReactNode, fetchData?: () => Promise<any>) => {
    if (modal) {
      if (fetchData) {
        setData({ ...data, ...(await fetchData()) });
      }
      setShowingModal(modal);
      setIsOpen(true);
    }
  };

  const setClose = () => {
    setData({});
    setIsOpen(false);
  };

  if (!isMounted) return null;

  return (
    <ModalContext.Provider value={{ data, setClose, setOpen, isOpen }}>
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
