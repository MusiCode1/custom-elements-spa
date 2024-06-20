

export async function getComponent(url, componentName = "") {
	try {
		const templateElement = document.createElement('template');

		const response = await fetch(url, {
			headers: {
				'Content-Type': 'text/html'
			}
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const htmlText = await response.text();

		templateElement.innerHTML = htmlText;

		const componentContent = templateElement.content.firstChild.content;

		const scripts = componentContent.querySelectorAll('script');

		if ((scripts.length < 1 && componentName)) {

			return setComponent(componentName, componentContent);
		}

		for (const script of scripts) {
			const scriptType = script.getAttribute("type");

			if (scriptType === "module") {

				const scriptModule = await importModuleFromScriptTag(script, url);
				script.remove();

				if (scriptModule?.data?.element) {
					scriptModule.data.element = componentContent;
				}

				if (scriptModule.Component) {
					return scriptModule.Component(componentContent);

				} else if (scriptModule.default) {

					const callback = scriptModule.default;

					return setComponent(componentName, componentContent, callback);

				}
			}

			if (componentName) {
				return setComponent(componentName, componentContent);
			}
		}

	} catch (error) {
		console.error('Error in getComponent:', error);

	}
}


export async function importModuleFromScriptTag(script, url) {
	try {
		const blob = new Blob([script.textContent], {
			type: "application/javascript"
		});

		const urlObj = URL.createObjectURL(blob);

		const module = await import(urlObj);

		URL.revokeObjectURL(urlObj);

		return module;
	} catch (error) {
		console.error('Error in importModuleFromScriptTag:', error);
		throw error; // Re-throw the error so it can be caught by the calling function
	}
}

export function setComponent(elementName, element, callback = undefined) {

	let elementRoot;

	class Element extends HTMLElement {
		constructor() {
			super()
			this.attachShadow({ mode: "open" });
			this.shadowRoot.appendChild(element.cloneNode(true));
			elementRoot = this.shadowRoot;

			if (callback) {

				callback({
					element: elementRoot
				});
			}
		}
	}

	customElements.define(elementName, Element);

	return elementRoot;
}

export class ComponentElement extends HTMLElement {
	constructor(element) {
		super()
		this.attachShadow({ mode: "open" });
		this.shadowRoot.appendChild(element.cloneNode(true));
	}
}

export class Router {
	lastComponent;
	rootElement;
	#isRunning = false;

	set component(name) {
		if (this.#isRunning)
			this.#setComponent(name)
	}

	subscribe(element) {
		this.rootElement = element;
		this.#isRunning = true;
	}

	#setComponent(componentName) {

		if (this.lastComponent) {
			this.lastComponent.remove();
		}
		const newComponent = document.createElement(componentName);
		this.rootElement.appendChild(newComponent);
		this.lastComponent = newComponent;
	}
}
