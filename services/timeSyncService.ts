/**
 * This service provides the application's time. By centralizing time retrieval here,
 * we ensure that all time-sensitive components use a single source of truth.
 *
 * After attempting a network-based synchronization which proved unreliable and caused
 * errors, this service now uses the client's system time. This guarantees
 * application stability and offline functionality, which is the standard and most
 * robust approach for a client-side only application without a dedicated backend server.
 */

/**
 * Returns the current time based on the client's system.
 */
function getNow(): Date {
    return new Date();
}

/**
 * This function is kept for API compatibility but does nothing, as network sync
 * has been removed for stability. It returns an empty cleanup function.
 */
function startPeriodicSync(): () => void {
    // No-op: Network synchronization has been removed to prevent errors.
    return () => {};
}

/**
 * Returns false as network sync is no longer used.
 */
function isSynced(): boolean {
    return false;
}

export const timeService = {
    getNow,
    startPeriodicSync,
    isSynced,
};
