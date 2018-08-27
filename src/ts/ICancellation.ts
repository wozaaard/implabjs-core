export interface ICancellation {
    throwIfRequested(): void;
    isRequested(): boolean;
    isSupported(): boolean;
    register(cb: () => void): void;
}