import React, { createContext, useContext, useMemo } from 'react';
import { ContextService } from '../services/ContextService';
import { useUserId } from '../hooks/useFirestore';

const ContextServiceContext = createContext<ContextService | null>(null);

export const useContextService = (): ContextService => {
    const context = useContext(ContextServiceContext);
    if (!context) {
        throw new Error('useContextService must be used within ContextServiceProvider');
    }
    return context;
};

interface ContextServiceProviderProps {
    children: React.ReactNode;
}

export const ContextServiceProvider: React.FC<ContextServiceProviderProps> = ({ children }) => {
    const userId = useUserId();
    
    const service = useMemo(() => {
        const svc = new ContextService();
        svc.setUserId(userId);
        return svc;
    }, [userId]);

    return (
        <ContextServiceContext.Provider value={service}>
            {children}
        </ContextServiceContext.Provider>
    );
};
