'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';

type Environment = 'prod' | 'test';

interface EnvironmentContextType {
  environment: Environment;
  toggleEnvironment: () => void;
  visitsCollection: 'visits' | 'test_visits';
  hostsCollection: 'hosts' | 'test_hosts';
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider = ({ children }: { children: ReactNode }) => {
  const [environment, setEnvironment] = useState<Environment>('prod');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedEnv = localStorage.getItem('environment') as Environment | null;
    if (storedEnv && (storedEnv === 'prod' || storedEnv === 'test')) {
      setEnvironment(storedEnv);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
        localStorage.setItem('environment', environment);
    }
  }, [environment, isInitialized]);

  const toggleEnvironment = () => {
    setEnvironment(prev => {
        const newEnv = prev === 'prod' ? 'test' : 'prod';
        // Reload to ensure all components get the new context
        localStorage.setItem('environment', newEnv);
        window.location.reload();
        return newEnv;
    });
  };

  const visitsCollection = useMemo(() => environment === 'test' ? 'test_visits' : 'visits', [environment]);
  const hostsCollection = useMemo(() => environment === 'test' ? 'test_hosts' : 'hosts', [environment]);

  const value = {
    environment,
    toggleEnvironment,
    visitsCollection,
    hostsCollection,
  };

  if (!isInitialized) {
    return null;
  }

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
};

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};
