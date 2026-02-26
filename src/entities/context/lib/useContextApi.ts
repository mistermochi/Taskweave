import { useSyncExternalStore } from 'react';
import { contextApi, ContextApi } from '../api/contextApi';

/**
 * Placeholder subscription function for the external store.
 * Currently, contextApi does not support standard store subscriptions.
 */
const emptySubscribe = () => () => {};

/**
 * Hook to access the environmental context API within React components.
 * Uses `useSyncExternalStore` to ensure stability and compatibility with
 * Concurrent React.
 *
 * @returns The `ContextApi` singleton instance.
 */
export const useContextApi = (): ContextApi => {
    const getInstance = () => contextApi;
    return useSyncExternalStore(
        emptySubscribe,
        getInstance,
        getInstance
    );
};
