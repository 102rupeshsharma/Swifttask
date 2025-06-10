interface EventTarget {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
    dispatchEvent(evt: Event): boolean;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
    name?: any;
    value?: any;
    key?: any;
}

export interface SyntheticEvent {
    bubbles: boolean;
    cancelable: boolean;
    currentTarget: EventTarget;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    nativeEvent: Event;
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget;
    timeStamp: number;
    type: string;
}