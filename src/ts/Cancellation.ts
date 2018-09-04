import { ICancellation } from "./interfaces";

export class Cancellation implements ICancellation {
    isSupported(): boolean {
        return false;
    }
    throwIfRequested(): void {
    }
    
    isRequested(): boolean {
        return false;
    }

    register(_cb: (e:any) => void): void {
        
    }

    static readonly none : Cancellation = {
        isSupported(): boolean {
            return false;
        },

        throwIfRequested(): void {
        },
        
        isRequested(): boolean {
            return false;
        },
    
        register(_cb: (e:any) => void): void {
        }
    };
}