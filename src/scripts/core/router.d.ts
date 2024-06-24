// router.d.ts

export class Router {
    constructor(rootElement: HTMLElement);
    addRoute(path: string, componentName: string): void;
    navigateTo(path: string): void;
    init(): void;
}