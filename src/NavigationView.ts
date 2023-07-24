import { ReactNode } from 'react';
import { NavigationViews } from './Navigation';

export function NavigationView<const Controller>( props: { view: NavigationViews<Controller>, children: ReactNode } ) {
    /* Return */
    return props.children;
}