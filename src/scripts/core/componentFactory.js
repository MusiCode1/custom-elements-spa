
export async function registerComponent(name, templateUrl) {
    const { template, scriptContent } = await fetchTemplate(templateUrl);

    customElements.define(name, class extends HTMLElement {
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            this._props = {};
            this._propChangeCallbacks = {};
        }

        async connectedCallback() {
            if (scriptContent) {
                const blob = new Blob([scriptContent], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                try {
                    const module = await import(url);
                    if (typeof module.default === 'function') {
                        module.default({ element: this.shadowRoot });
                    }
                } catch (error) {
                    console.error(`Error loading script for component ${name}:`, error);
                } finally {
                    URL.revokeObjectURL(url);
                }
            }
        }

        /**
         * מגדיר ערך ל-prop
         * @param {string} propName - שם ה-prop
         * @param {*} value - הערך החדש
         */
        setProp(propName, value) {
            if (this._props[propName] !== value) {
                this._props[propName] = value;
                if (this._propChangeCallbacks[propName]) {
                    this._propChangeCallbacks[propName].forEach(callback => callback(value));
                }
            }
        }

        /**
         * מחזיר את הערך של prop
         * @param {string} propName - שם ה-prop
         * @returns {*} ערך ה-prop
         */
        getProp(propName) {
            return this._props[propName];
        }

        /**
         * מוסיף callback לשינוי ב-prop
         * @param {string} propName - שם ה-prop
         * @param {function} callback - פונקציית ה-callback
         */
        onPropChange(propName, callback) {
            if (!this._propChangeCallbacks[propName]) {
                this._propChangeCallbacks[propName] = [];
            }
            this._propChangeCallbacks[propName].push(callback);
        }
    });
}

/**
 * מביא תבנית HTML מה-URL שסופק
 * @param {string} url - הנתיב לקובץ התבנית
 * @returns {Promise<{template: HTMLTemplateElement, scriptContent: string | null}>}
 */
async function fetchTemplate(url) {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const templateElement = doc.querySelector('template');

    const scriptElement = templateElement.content.querySelector('script');

    if (!templateElement) {
        throw new Error(`No template found in ${url}`);
    }

    const template = document.createElement('template');
    template.content.appendChild(templateElement.content.cloneNode(true));

    let scriptContent = null;
    if (scriptElement) {
        scriptContent = scriptElement.textContent;
        scriptElement.remove();
    }

    return { template, scriptContent };
}