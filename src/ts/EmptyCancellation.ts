import { ICancellation } from "./ICancellation";

export class EmptyCancellation implements ICancellation {
    isSupported(): boolean {
        return false;
    }
    throwIfRequested(): void {
    }
    
    isRequested(): boolean {
        return false;
    }

    register(_cb: () => void): void {
        
    }

    static readonly default : EmptyCancellation = new EmptyCancellation();

}