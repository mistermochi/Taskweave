import React, { createContext, useContext, useMemo } from 'react';
import { ContextService } from '../services/ContextService';
import { useUserId } from '../hooks/useFirestore';

const ContextServiceContext = createContext<ContextService | null>(null);

/**
 * Hook to consume the environmental context service within the React tree.
 * @throws Error if used outside of `ContextServiceProvider`.
 */
export const useContextService = (): ContextService => {
    const context = useContext(ContextServiceContext);
    if (!context) {
        throw new Error('useContextService must be used within ContextServiceProvider');
    }
    return context;
};

/**
 * Provider that bridges the `ContextService` (singleton/logic) with the React component tree.
 * It ensures the service is aware of the current authenticated user and provides
 * a stable reference for consumers.
 */
export const ContextServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const userId = useUserId();
    
    /**
     * Memoized service instance to prevent unnecessary re-initializations.
     * Updates the user context whenever the authenticated UID changes.
     */
    const service = useMemo(() => {
        const svc = ContextService.getInstance();
        svc.setUserId(userId);
        return svc;
    }, [userId]);

    return (
        <ContextServiceContext.Provider value={service}>
            {children}
        </ContextServiceContext.Provider>
    );
};
