import { ReactNode } from 'react';
import { NavigationInferViews } from '.';
import { typedMemo } from './helpers';

export const NavigationView = typedMemo(<const Controller>(props: { view: NavigationInferViews<Controller>, children?: ReactNode }) => {
    /* Return */
    return props.children;
});