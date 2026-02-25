import { useSyncExternalStore } from 'react';
import { ContextService } from '../services/ContextService';

/**
 * Global singleton instance of the ContextService for the hook's lifecycle.
 */
let singletonInstance: ContextService | null = null;

/**
 * Returns the existing ContextService instance or creates a new one.
 */
const getOrCreateInstance = (): ContextService => {
    if (!singletonInstance) {
        singletonInstance = ContextService.getInstance();
    }
    return singletonInstance;
};

/**
 * Placeholder subscription function for the external store.
 * Currently, ContextService does not support standard store subscriptions.
 */
const emptySubscribe = () => () => {};

/**
 * Hook to access the environmental context service within React components.
 * Uses `useSyncExternalStore` to ensure stability and compatibility with
 * Concurrent React.
 *
 * @returns The `ContextService` singleton instance.
 */
export const useContextService = (): ContextService => {
    return useSyncExternalStore(
        emptySubscribe,
        getOrCreateInstance,
        getOrCreateInstance
    );
};

/**
 * Utility to clear the singleton instance, primarily used for testing purposes.
 */
export const resetContextService = (): void => {
    singletonInstance = null;
};
