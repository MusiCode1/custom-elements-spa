
export interface CustomElement extends HTMLElement {
    setProp(propName: string, value: any): void;
    getProp(propName: string): any;
    onPropChange(propName: string, callback: (value: any) => void): void;
}

export type ComponentInitFunction = (element: CustomElement) => void;

export interface TemplateResult {
    template: HTMLTemplateElement;
    scriptContent: string | null;
}

export function registerComponent(name: string, templateUrl: string): Promise<void>;

declare global {
    interface HTMLElementTagNameMap {
        [key: string]: CustomElement;
    }
}