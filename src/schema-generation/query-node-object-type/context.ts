import { FieldSelection } from '../../graphql/query-distiller';
import { Clock } from '../../execution/execution-options';

/**
 * A token that corresponds to a FieldSelection but is local to one execution
 *
 * There usually is a 1:1 relationship between a FieldSelection/FieldRequest and the SelectionToken. However, instances
 * of a FieldSelection do not convey an identity per se. Usage of the SelectionToken class makes it clear that it's not
 * taken for its values bot for the identity within an execution. This is a useful property for caches and external
 * state management.
 */
export class SelectionToken {
    // prevent structural equality checks
    private _selectionToken: undefined;
}

export interface FieldContext {
    readonly selectionStack: ReadonlyArray<FieldSelection>;
    readonly flexSearchMaxFilterableAmountOverride?: number;
    readonly flexSearchRecursionDepth?: number;

    /**
     * A stack of objects that correspond to the selections that are intended to be used with WeakMaps to store
     * additional information
     */
    readonly selectionTokenStack: ReadonlyArray<SelectionToken>;

    /**
     * The tip of the selection token stack (i.e., the token for the selection being resolved)
     *
     * Outside of resolving a field (should only occur within the query-node-object-type framework), this will be a
     * distinct token
     */
    readonly selectionToken: SelectionToken;

    /**
     * An interface to determine the current date/time
     */
    readonly clock: Clock;
}
