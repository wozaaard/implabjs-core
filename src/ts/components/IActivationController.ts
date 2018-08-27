import { IActivatable } from './IActivatable';
import { ICancellation } from '../ICancellation';
import { EmptyCancellation } from '../EmptyCancellation';

export interface IActivationController {
    activating(component: IActivatable, ct?: ICancellation): Promise<void>;

    activated(component: IActivatable, ct?: ICancellation): Promise<void>;

    deactivating(component: IActivatable, ct?: ICancellation): Promise<void>;

    deactivated(component: IActivatable, ct?: ICancellation): Promise<void>;

    deactivate(ct?: ICancellation): Promise<void>;

    activate(component: IActivatable, ct?: ICancellation): Promise<void>;

    getActive(): IActivatable;
}