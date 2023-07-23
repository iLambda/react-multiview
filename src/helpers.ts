/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentType, memo } from 'react';

/* Boxing a type */
export type Boxed<T> = { value: T };

/* Union to intersection */
export type UnionToIntersection<T> = 
    (T extends any ? (x: T) => any : never) extends 
    (x: infer R) => any ? R : never

/* Check if literal type is only one value */
export type IfOnlyOneLiteral<C, T, F> = 
    [UnionToIntersection<C>] extends [never] 
        ? F 
        : T
    
/* Typed version of memo */
export const typedMemo: <T extends ComponentType<any>>(
    c: T,
    areEqual?: (
        prev: React.ComponentProps<T>,
        next: React.ComponentProps<T>
    ) => boolean
  ) => T = memo;
