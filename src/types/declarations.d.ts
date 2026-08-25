/**
 * Ambient type declarations to provide standalone IDE support for React and JSX
 * without requiring local node_modules installation.
 */

declare module 'react' {
  export type ReactNode = any;
  export type CSSProperties = Record<string, any>;
  export type FC<P = {}> = (props: P) => any;
  export type FormEvent = any;
  export type ChangeEvent<T = any> = any;
  export type MouseEvent<T = any> = any;

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[] | undefined): T;
  export function useRef<T>(initialValue?: T): { current: T };

  const React: {
    useState: typeof useState;
    useEffect: typeof useEffect;
    useCallback: typeof useCallback;
    useMemo: typeof useMemo;
    useRef: typeof useRef;
    createElement: any;
    Fragment: any;
  };

  export default React;
}

declare module 'react-dom' {
  export function render(element: any, container: any): void;
  export function createRoot(container: any): any;
}

declare module 'lucide-react' {
  export const Shield: any;
  export const Users: any;
  export const Calendar: any;
  export const CheckSquare: any;
  export const MessageSquare: any;
  export const Settings: any;
  export const Bell: any;
  export const LogOut: any;
  export const Video: any;
  export const Plus: any;
  export const Trash: any;
  export const Edit: any;
  export const Check: any;
  export const X: any;
  [key: string]: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
