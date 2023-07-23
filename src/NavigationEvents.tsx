export type NavigationExitEvent = {
    /* Prevents the event */
    prevent() : void;
    /* Suspend and allows later decision */
    suspend() : NavigationResumer;
}

export type NavigationHandlers = {
    /* Sent when window entered */
    onEntered?: () => void;
    /* Send when exited */
    onExit?: (e: NavigationExitEvent) => void;
}

/* A navigation resumer */
export type NavigationResumer = () => 'ignored' | 'resumed'
/* Do we prevent navigation ? */
export type NavigationPrevented = 'prevent' | 'suspend' | 'proceed';
