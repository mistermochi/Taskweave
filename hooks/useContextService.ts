import { useSyncExternalStore } from 'react';
import { ContextService } from '../services/ContextService';

let singletonInstance: ContextService | null = null;

const getOrCreateInstance = (): ContextService => {
    if (!singletonInstance) {
        singletonInstance = ContextService.getInstance();
    }
    return singletonInstance;
};

const emptySubscribe = () => () => {};

export const useContextService = (): ContextService => {
    return useSyncExternalStore(
        emptySubscribe,
        getOrCreateInstance,
        getOrCreateInstance
    );
};

export const resetContextService = (): void => {
    singletonInstance = null;
};
