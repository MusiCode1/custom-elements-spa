// router.js

export class Router {
    constructor(rootElement) {
        this.routes = new Map();
        this.rootElement = rootElement;
        this.currentComponent = null;

        window.addEventListener('hashchange', this.handleHashChange.bind(this));
    }

    addRoute(path, componentName) {
        this.routes.set(path, componentName);
    }

    navigateTo(path) {
        window.location.hash = path;
    }

    handleHashChange() {
        const hash = window.location.hash.slice(1) || '/';
        const componentName = this.routes.get(hash) || this.routes.get('*');

        if (componentName) {
            if (this.currentComponent) {
                this.rootElement.removeChild(this.currentComponent);
            }
            this.currentComponent = document.createElement(componentName);
            this.rootElement.appendChild(this.currentComponent);
        } else {
            console.error(`No component found for path: ${hash}`);
        }
    }

    init() {
        this.handleHashChange();
    }
}