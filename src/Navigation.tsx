import { MutableRefObject, ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { isMatching } from 'ts-pattern';
import { NavigationExitEvent, NavigationHandlers, NavigationPrevented, NavigationResumer } from './NavigationEvents';
import { Boxed, IfOnlyOneLiteral, typedMemo } from './helpers';

export type NavigationInferViews<P> = 
    P extends NavigationController<infer V> ? V : never;

export type NavigationDescriptor<Views extends string> = {
    /* The list of views */
    views: Views[];
    /* Default view */
    default: Views;
}

/* The navigation controller */
export type NavigationController<Views extends string> = {
    /* The active view */
    readonly active: Views
    /* Get all views */
    readonly views : ReadonlySet<Views>
    
    /* Navigate to a given view */
    navigate(target: Views) : void;
    /* Create a navigator */
    navigator(target: Views) : () => void;
    /* Check if a view is active */
    isActive(target: Views) : boolean;

    /* The event handling */
    readonly [events]: {
        /* The event handlers themselves */
        handlers: MutableRefObject<NavigationHandlers>,
        /* The resumer function */
        resumer: MutableRefObject<NavigationResumer | null>,
    };
}

/* Unique symbols to store stuff */
const events : unique symbol = Symbol();

export function useNavigation<const Views extends string>(config: NavigationDescriptor<Views>) : NavigationController<Views> {
    /* Create the references */
    const handlersRef = useRef<NavigationHandlers>({});
    const resumerRef = useRef<NavigationResumer | null>(null); 
    /* Create the active view state */
    const [active, setActive] = useState<Views>(config.default);
    const setActiveSafe = useCallback((view: Views) => {
        /* Clear handlers */
        handlersRef.current = {};
        /* Set */
        setActive(view);        
    }, [handlersRef, setActive]);

    /* A helper to create the resumer */
    const createResumer = useCallback((current: Views) => {
        /* Create resumer */
        const resumer : NavigationResumer = () => {
            /* Ensure the awaited handler is this function */
            if (resumerRef.current != resumer) { return 'ignored'; }
            /* Clear the reference */
            resumerRef.current = null;
            /* Call page change */
            setActiveSafe(current);
            /* Ok */
            return 'resumed';
        };
        /* Return it */
        return resumer;        
    }, [resumerRef, setActiveSafe]);

    /* The navigate function */
    const navigate = useCallback((target: Views) => {
        /* Prepare to make cancel, if needed */
        const prevent : Boxed<NavigationPrevented> = { value: 'proceed' };
        /* Clear the resumer */
        resumerRef.current = null;
        /* Check if there is a on exit handler */
        if (handlersRef.current.onExit) {
            /* Create the event */
            const event : NavigationExitEvent = {
                /* Prevent ? */
                prevent: () => prevent.value = 'prevent',
                /* Suspend */
                suspend: () => {
                    /* Create a resumer that we store */
                    resumerRef.current = createResumer(target);
                    /* Suspend */
                    prevent.value = 'suspend'; 
                    /* Return */
                    return resumerRef.current;
                }
            };
            /* Call the handler */
            handlersRef.current.onExit(event);            
        }
        /* We dispatch the event if we can */
        if (prevent.value === 'proceed') {
            /* Set the active */
            setActiveSafe(target);
        }
    }, [setActiveSafe, handlersRef, resumerRef, createResumer]);

    /* Return the navigation controller */
    return {
        /* Get all views ! */
        views: useMemo(() => new Set<Views>(config.views).add(config.default), [config.views, config.default]),
        /* The navigate function */
        navigate: navigate,
        navigator: useCallback((target: Views) => () => navigate(target), [navigate]),
        
        /* The is active function */
        isActive: useCallback((target: Views) => target === active, [active]),
        /* The active view */
        active: active,

        /* The context & handlers */
        [events]: {
            handlers: handlersRef,
            resumer: resumerRef
        }
    };
}

export function useNavigationEvents<const Views extends string>(controller: NavigationController<Views>, handlers: NavigationHandlers) {
    /* Get handlers */
    controller[events].handlers.current = { ...handlers };
}


/* The navigation properties */
const defaultViewIDPropName = 'view' as const;
export type NavigationProps<Views extends string, ViewPropName extends string = typeof defaultViewIDPropName> = {
    /* The navigation controller */
    controller: NavigationController<Views>
    /* The children */
    children: ReactElement | ReactElement[]
    /* The property names we are looking for in children */
    viewIdProperty: 
        /* If default property name, we don't request this */
        [ViewPropName] extends [typeof defaultViewIDPropName] ? undefined :
        /* If this is only one literal, ask for it. Else, ask for a list of it */ 
        IfOnlyOneLiteral<ViewPropName, ViewPropName, ViewPropName[]>
};

/* The component */
function NavigationRaw<const Views extends string, const ViewPropName extends string = typeof defaultViewIDPropName>(props: NavigationProps<Views, ViewPropName>) {
    /* Create a matching handler */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const checkForActiveView = useCallback((data: any) => {
        /* Get the right fit for the key */
        const key = 
            Array.isArray(props.viewIdProperty) ? (props.viewIdProperty.find(key => key in data) ?? null) :
            typeof props.viewIdProperty === 'string' ? (props.viewIdProperty in data ? props.viewIdProperty : null) :
            defaultViewIDPropName;
        /* Return if there is suck a key on the data, and it indeed is active */
        return key && isMatching({ [key]: props.controller.active });
    }, [props.controller.active, props.viewIdProperty]);
    /* Get children */
    const children = useMemo(() => Array.isArray(props.children) ? props.children : [props.children], [props.children]);
    const currentView = useMemo(() => children.find(e => checkForActiveView(e.props)), [checkForActiveView, children]);
    /* If view not selected, later return error view */
    return (currentView ?? null);
}

/* Its export */
export const Navigation = typedMemo(NavigationRaw);