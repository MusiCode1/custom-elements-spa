
export async function registerComponent(name, templateUrl, defaultProps = {}) {
    try {
        const { template, scriptContent } = await fetchTemplate(templateUrl);

        let module;

        if (scriptContent) {
            module = await loadComponentModule(scriptContent);
        }

        const CustomElement = setComponent(template, module, defaultProps);

        customElements.define(name, CustomElement);

        return CustomElement;
    } catch (error) {
        console.error(`נכשל ברישום הקומפוננטה ${name}:`, error);
        throw error;
    }
}

function setComponent(template, module, defaultProps = {}) {
    return class extends HTMLElement {
        #props;
        #propChangeCallbacks;

        constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.shadowRoot.appendChild(template.content.cloneNode(true));
            this.#props = { ...defaultProps };
            this.#propChangeCallbacks = {
                global: new Set()
            };
        }

        static get observedAttributes() {
            return Object.keys(defaultProps);
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue !== newValue && name in defaultProps) {
                this.setProp(name, this.#parseAttributeValue(newValue, defaultProps[name]));
            }
        }

        #parseAttributeValue(value, defaultValue) {
            if (typeof defaultValue === 'boolean') return value !== 'false';
            if (typeof defaultValue === 'number') return Number(value);
            if (typeof defaultValue === 'object') {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    console.error('שגיאה בפענוח ערך JSON של מאפיין:', e);
                    return defaultValue;
                }
            }
            return value;
        }

        connectedCallback() {
            if (module) {
                const initFunction = module.default || module.init;
                if (typeof initFunction === 'function') {
                    initFunction(this.#getComponentInterface());
                }
            }
        }

        #getComponentInterface() {
            return {
                component: this,
                shadowRoot: this.shadowRoot,
                setProps: this.setProps.bind(this),
                setProp: this.setProp.bind(this),
                getProps: this.getProps.bind(this),
                getProp: this.getProp.bind(this),
                onPropChange: this.onPropChange.bind(this),
                onPropsChange: this.onPropsChange.bind(this),
                emit: this.emit.bind(this)
            };
        }

        setProps(newProps) {
            const changedProps = {};
            let hasChanges = false;

            Object.entries(newProps).forEach(([key, value]) => {
                if (this.#props[key] !== value) {
                    changedProps[key] = value;
                    this.#props[key] = value;
                    this.#notifyPropChange(key, value, this.#props[key]);
                    if (key in defaultProps) {
                        this.setAttribute(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
                    }
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                this.#notifyPropsChange(changedProps);
            }
        }

        setProp(key, value) {
            if (this.#props[key] !== value) {
                const oldValue = this.#props[key];
                this.#props[key] = value;
                this.#notifyPropChange(key, value, oldValue);
                if (key in defaultProps) {
                    this.setAttribute(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
                }
                this.#notifyPropsChange({ [key]: value });
            }
        }

        getProps() {
            return { ...this.#props };
        }

        getProp(key) {
            return this.#props[key];
        }

        onPropChange(propName, callback) {
            if (typeof callback !== 'function') {
                throw new TypeError('הקולבק חייב להיות פונקציה');
            }
            if (!this.#propChangeCallbacks[propName]) {
                this.#propChangeCallbacks[propName] = new Set();
            }
            this.#propChangeCallbacks[propName].add(callback);
            return () => this.#propChangeCallbacks[propName].delete(callback);
        }

        onPropsChange(callback) {
            if (typeof callback !== 'function') {
                throw new TypeError('הקולבק חייב להיות פונקציה');
            }
            this.#propChangeCallbacks.global.add(callback);
            return () => this.#propChangeCallbacks.global.delete(callback);
        }

        #notifyPropChange(key, newValue, oldValue) {
            if (this.#propChangeCallbacks[key]) {
                this.#propChangeCallbacks[key].forEach(cb => cb(newValue, oldValue));
            }
        }

        #notifyPropsChange(changedProps) {
            const oldProps = { ...this.#props, ...changedProps };
            this.#propChangeCallbacks.global.forEach(cb => cb(this.#props, oldProps));
        }

        emit(eventName, detail) {
            this.dispatchEvent(new CustomEvent(eventName, {
                bubbles: true,
                composed: true,
                detail
            }));
        }
    };
}

async function loadComponentModule(scriptContent) {
    if (!scriptContent) return null;

    const blob = new Blob([scriptContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    try {
        return await import(url);
    } catch (error) {
        console.error('שגיאה בטעינת מודול הקומפוננטה:', error);
        return null;
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function fetchTemplate(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`שגיאת HTTP! סטטוס: ${response.status}`);
        }
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        const templateElement = doc.querySelector('template');
        if (!templateElement) {
            throw new Error(`לא נמצאה תבנית ב-${url}`);
        }

        const scriptElement = templateElement.content.querySelector('script');
        let scriptContent = null;
        if (scriptElement) {
            scriptContent = scriptElement.textContent;
            scriptElement.remove();
        }

        return { template: templateElement, scriptContent };
    } catch (error) {
        console.error(`שגיאה בטעינת התבנית מ-${url}:`, error);
        throw error;
    }
}