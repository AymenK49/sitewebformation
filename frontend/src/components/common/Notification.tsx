import React, { createContext, useContext, useState, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (props: NotificationProps) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé à l\'intérieur de NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<(NotificationProps & { id: number })[]>([]);
  const [counter, setCounter] = useState(0);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const showNotification = useCallback(({ message, type, duration = 5000 }: NotificationProps) => {
    const id = counter;
    setCounter(prev => prev + 1);

    setNotifications(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => removeNotification(id), duration);
    }
  }, [counter, removeNotification]);

  const getBackgroundColor = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
        return 'bg-blue-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getTextColor = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getBorderColor = (type: NotificationType): string => {
    switch (type) {
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      case 'warning':
        return 'border-yellow-400';
      case 'info':
        return 'border-blue-400';
      default:
        return 'border-gray-400';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4">
        {notifications.map(({ id, message, type }) => (
          <Transition
            key={id}
            show={true}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto border ${getBorderColor(
                type
              )} ${getBackgroundColor(type)}`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="ml-3 w-0 flex-1">
                    <p className={`text-sm font-medium ${getTextColor(type)}`}>
                      {message}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      className={`rounded-md inline-flex ${getTextColor(
                        type
                      )} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      onClick={() => removeNotification(id)}
                    >
                      <span className="sr-only">Fermer</span>
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;