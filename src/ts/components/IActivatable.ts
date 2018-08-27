import { IActivationController } from "./IActivationController";
import { ICancellation } from "../ICancellation";

/**
 * Интерфейс поддерживающий асинхронную активацию
 */
export interface IActivatable {
    /**
     * @returns Boolean indicates the current state
     */
    isActive(): boolean;

    /**
     * Starts the component activation
     * @param ct cancellation token for this operation
     */
    activate(ct?: ICancellation): Promise<void>;

    /**
     * Starts the component deactivation
     * @param ct cancellation token for this operation
     */
    deactivate(ct?: ICancellation): Promise<void>;

    /**
     * Sets the activation controller for this component
     * @param controller The activation controller
     * 
     * Activation controller checks whether this component
     * can be activated and manages the active state of the
     * component
     */
    setActivationController(controller: IActivationController);

    /**
     * Gets the current activation controller for this component
     */
    getActivationController(): IActivationController;
}