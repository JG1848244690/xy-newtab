var content = (function() {
	//#region \0rolldown/runtime.js
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/utils/internal/logger.mjs
	function print$1(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger$1 = {
		debug: (...args) => print$1(console.debug, ...args),
		log: (...args) => print$1(console.log, ...args),
		warn: (...args) => print$1(console.warn, ...args),
		error: (...args) => print$1(console.error, ...args)
	};
	//#endregion
	//#region node_modules/.pnpm/many-keys-map@2.0.1/node_modules/many-keys-map/index.js
	var nullKey = Symbol("null");
	var keyCounter = 0;
	var ManyKeysMap = class extends Map {
		constructor() {
			super();
			this._objectHashes = /* @__PURE__ */ new WeakMap();
			this._symbolHashes = /* @__PURE__ */ new Map();
			this._publicKeys = /* @__PURE__ */ new Map();
			const [pairs] = arguments;
			if (pairs === null || pairs === void 0) return;
			if (typeof pairs[Symbol.iterator] !== "function") throw new TypeError(typeof pairs + " is not iterable (cannot read property Symbol(Symbol.iterator))");
			for (const [keys, value] of pairs) this.set(keys, value);
		}
		_getPublicKeys(keys, create = false) {
			if (!Array.isArray(keys)) throw new TypeError("The keys parameter must be an array");
			const privateKey = this._getPrivateKey(keys, create);
			let publicKey;
			if (privateKey && this._publicKeys.has(privateKey)) publicKey = this._publicKeys.get(privateKey);
			else if (create) {
				publicKey = [...keys];
				this._publicKeys.set(privateKey, publicKey);
			}
			return {
				privateKey,
				publicKey
			};
		}
		_getPrivateKey(keys, create = false) {
			const privateKeys = [];
			for (let key of keys) {
				if (key === null) key = nullKey;
				const hashes = typeof key === "object" || typeof key === "function" ? "_objectHashes" : typeof key === "symbol" ? "_symbolHashes" : false;
				if (!hashes) privateKeys.push(key);
				else if (this[hashes].has(key)) privateKeys.push(this[hashes].get(key));
				else if (create) {
					const privateKey = `@@mkm-ref-${keyCounter++}@@`;
					this[hashes].set(key, privateKey);
					privateKeys.push(privateKey);
				} else return false;
			}
			return JSON.stringify(privateKeys);
		}
		set(keys, value) {
			const { publicKey } = this._getPublicKeys(keys, true);
			return super.set(publicKey, value);
		}
		get(keys) {
			const { publicKey } = this._getPublicKeys(keys);
			return super.get(publicKey);
		}
		has(keys) {
			const { publicKey } = this._getPublicKeys(keys);
			return super.has(publicKey);
		}
		delete(keys) {
			const { publicKey, privateKey } = this._getPublicKeys(keys);
			return Boolean(publicKey && super.delete(publicKey) && this._publicKeys.delete(privateKey));
		}
		clear() {
			super.clear();
			this._symbolHashes.clear();
			this._publicKeys.clear();
		}
		get [Symbol.toStringTag]() {
			return "ManyKeysMap";
		}
		get size() {
			return super.size;
		}
	};
	//#endregion
	//#region node_modules/.pnpm/defu@6.1.4/node_modules/defu/dist/defu.mjs
	function isPlainObject(value) {
		if (value === null || typeof value !== "object") return false;
		const prototype = Object.getPrototypeOf(value);
		if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) return false;
		if (Symbol.iterator in value) return false;
		if (Symbol.toStringTag in value) return Object.prototype.toString.call(value) === "[object Module]";
		return true;
	}
	function _defu(baseObject, defaults, namespace = ".", merger) {
		if (!isPlainObject(defaults)) return _defu(baseObject, {}, namespace, merger);
		const object = Object.assign({}, defaults);
		for (const key in baseObject) {
			if (key === "__proto__" || key === "constructor") continue;
			const value = baseObject[key];
			if (value === null || value === void 0) continue;
			if (merger && merger(object, key, value, namespace)) continue;
			if (Array.isArray(value) && Array.isArray(object[key])) object[key] = [...value, ...object[key]];
			else if (isPlainObject(value) && isPlainObject(object[key])) object[key] = _defu(value, object[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
			else object[key] = value;
		}
		return object;
	}
	function createDefu(merger) {
		return (...arguments_) => arguments_.reduce((p, c) => _defu(p, c, "", merger), {});
	}
	var defu = createDefu();
	createDefu((object, key, currentValue) => {
		if (object[key] !== void 0 && typeof currentValue === "function") {
			object[key] = currentValue(object[key]);
			return true;
		}
	});
	createDefu((object, key, currentValue) => {
		if (Array.isArray(object[key]) && typeof currentValue === "function") {
			object[key] = currentValue(object[key]);
			return true;
		}
	});
	//#endregion
	//#region node_modules/.pnpm/@1natsu+wait-element@4.1.2/node_modules/@1natsu/wait-element/dist/detectors.mjs
	var isExist = (element) => {
		return element !== null ? {
			isDetected: true,
			result: element
		} : { isDetected: false };
	};
	var isNotExist = (element) => {
		return element === null ? {
			isDetected: true,
			result: null
		} : { isDetected: false };
	};
	//#endregion
	//#region node_modules/.pnpm/@1natsu+wait-element@4.1.2/node_modules/@1natsu/wait-element/dist/index.mjs
	var getDefaultOptions = () => ({
		target: globalThis.document,
		unifyProcess: true,
		detector: isExist,
		observeConfigs: {
			childList: true,
			subtree: true,
			attributes: true
		},
		signal: void 0,
		customMatcher: void 0
	});
	var mergeOptions = (userSideOptions, defaultOptions) => {
		return defu(userSideOptions, defaultOptions);
	};
	var unifyCache = new ManyKeysMap();
	function createWaitElement(instanceOptions) {
		const { defaultOptions } = instanceOptions;
		return (selector, options) => {
			const { target, unifyProcess, observeConfigs, detector, signal, customMatcher } = mergeOptions(options, defaultOptions);
			const unifyPromiseKey = [
				selector,
				target,
				unifyProcess,
				observeConfigs,
				detector,
				signal,
				customMatcher
			];
			const cachedPromise = unifyCache.get(unifyPromiseKey);
			if (unifyProcess && cachedPromise) return cachedPromise;
			const detectPromise = new Promise(async (resolve, reject) => {
				if (signal?.aborted) return reject(signal.reason);
				const observer = new MutationObserver(async (mutations) => {
					for (const _ of mutations) {
						if (signal?.aborted) {
							observer.disconnect();
							break;
						}
						const detectResult2 = await detectElement({
							selector,
							target,
							detector,
							customMatcher
						});
						if (detectResult2.isDetected) {
							observer.disconnect();
							resolve(detectResult2.result);
							break;
						}
					}
				});
				signal?.addEventListener("abort", () => {
					observer.disconnect();
					return reject(signal.reason);
				}, { once: true });
				const detectResult = await detectElement({
					selector,
					target,
					detector,
					customMatcher
				});
				if (detectResult.isDetected) return resolve(detectResult.result);
				observer.observe(target, observeConfigs);
			}).finally(() => {
				unifyCache.delete(unifyPromiseKey);
			});
			unifyCache.set(unifyPromiseKey, detectPromise);
			return detectPromise;
		};
	}
	async function detectElement({ target, selector, detector, customMatcher }) {
		return await detector(customMatcher ? customMatcher(selector) : target.querySelector(selector));
	}
	var waitElement = createWaitElement({ defaultOptions: getDefaultOptions() });
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/utils/content-script-ui/shared.mjs
	function applyPosition(root, positionedElement, options) {
		if (options.position === "inline") return;
		if (options.zIndex != null) root.style.zIndex = String(options.zIndex);
		root.style.overflow = "visible";
		root.style.position = "relative";
		root.style.width = "0";
		root.style.height = "0";
		root.style.display = "block";
		if (positionedElement) if (options.position === "overlay") {
			positionedElement.style.position = "absolute";
			if (options.alignment?.startsWith("bottom-")) positionedElement.style.bottom = "0";
			else positionedElement.style.top = "0";
			if (options.alignment?.endsWith("-right")) positionedElement.style.right = "0";
			else positionedElement.style.left = "0";
		} else {
			positionedElement.style.position = "fixed";
			positionedElement.style.top = "0";
			positionedElement.style.bottom = "0";
			positionedElement.style.left = "0";
			positionedElement.style.right = "0";
		}
	}
	function getAnchor(options) {
		if (options.anchor == null) return document.body;
		let resolved = typeof options.anchor === "function" ? options.anchor() : options.anchor;
		if (typeof resolved === "string") if (resolved.startsWith("/")) return document.evaluate(resolved, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue ?? void 0;
		else return document.querySelector(resolved) ?? void 0;
		return resolved ?? void 0;
	}
	function mountUi(root, options) {
		const anchor = getAnchor(options);
		if (anchor == null) throw Error("Failed to mount content script UI: could not find anchor element");
		switch (options.append) {
			case void 0:
			case "last":
				anchor.append(root);
				break;
			case "first":
				anchor.prepend(root);
				break;
			case "replace":
				anchor.replaceWith(root);
				break;
			case "after":
				anchor.parentElement?.insertBefore(root, anchor.nextElementSibling);
				break;
			case "before":
				anchor.parentElement?.insertBefore(root, anchor);
				break;
			default: options.append(anchor, root);
		}
	}
	function createMountFunctions(baseFunctions, options) {
		let autoMountInstance;
		const stopAutoMount = () => {
			autoMountInstance?.stopAutoMount();
			autoMountInstance = void 0;
		};
		const mount = () => {
			baseFunctions.mount();
		};
		const unmount = baseFunctions.remove;
		const remove = () => {
			stopAutoMount();
			baseFunctions.remove();
		};
		const autoMount = (autoMountOptions) => {
			if (autoMountInstance) logger$1.warn("autoMount is already set.");
			autoMountInstance = autoMountUi({
				mount,
				unmount,
				stopAutoMount
			}, {
				...options,
				...autoMountOptions
			});
		};
		return {
			mount,
			remove,
			autoMount
		};
	}
	function autoMountUi(uiCallbacks, options) {
		const abortController = new AbortController();
		const EXPLICIT_STOP_REASON = "explicit_stop_auto_mount";
		const _stopAutoMount = () => {
			abortController.abort(EXPLICIT_STOP_REASON);
			options.onStop?.();
		};
		let resolvedAnchor = typeof options.anchor === "function" ? options.anchor() : options.anchor;
		if (resolvedAnchor instanceof Element) throw Error("autoMount and Element anchor option cannot be combined. Avoid passing `Element` directly or `() => Element` to the anchor.");
		async function observeElement(selector) {
			let isAnchorExist = !!getAnchor(options);
			if (isAnchorExist) uiCallbacks.mount();
			while (!abortController.signal.aborted) try {
				isAnchorExist = !!await waitElement(selector ?? "body", {
					customMatcher: () => getAnchor(options) ?? null,
					detector: isAnchorExist ? isNotExist : isExist,
					signal: abortController.signal
				});
				if (isAnchorExist) uiCallbacks.mount();
				else {
					uiCallbacks.unmount();
					if (options.once) uiCallbacks.stopAutoMount();
				}
			} catch (error) {
				if (abortController.signal.aborted && abortController.signal.reason === EXPLICIT_STOP_REASON) break;
				else throw error;
			}
		}
		observeElement(resolvedAnchor);
		return { stopAutoMount: _stopAutoMount };
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/utils/split-shadow-root-css.mjs
	/** @module wxt/utils/split-shadow-root-css */
	var AT_RULE_BLOCKS = /(\s*@(property|font-face)[\s\S]*?{[\s\S]*?})/gm;
	/**
	* Given a CSS string that will be loaded into a shadow root, split it into two
	* parts:
	*
	* - `documentCss`: CSS that needs to be applied to the document (like
	*   `@property`)
	* - `shadowCss`: CSS that needs to be applied to the shadow root
	*
	* @param css
	*/
	function splitShadowRootCss(css) {
		return {
			documentCss: Array.from(css.matchAll(AT_RULE_BLOCKS), (m) => m[0]).join("").trim(),
			shadowCss: css.replace(AT_RULE_BLOCKS, "").trim()
		};
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region node_modules/.pnpm/@webext-core+isolated-element@1.1.4/node_modules/@webext-core/isolated-element/lib/index.js
	var import_is_potential_custom_element_name = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		var regex = /^[a-z](?:[\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*-(?:[\x2D\.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
		var isPotentialCustomElementName = function(string) {
			return regex.test(string);
		};
		module.exports = isPotentialCustomElementName;
	})))(), 1);
	var __async = (__this, __arguments, generator) => {
		return new Promise((resolve, reject) => {
			var fulfilled = (value) => {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			};
			var rejected = (value) => {
				try {
					step(generator.throw(value));
				} catch (e) {
					reject(e);
				}
			};
			var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
			step((generator = generator.apply(__this, __arguments)).next());
		});
	};
	var ALLOWED_SHADOW_ELEMENTS = [
		"article",
		"aside",
		"blockquote",
		"body",
		"div",
		"footer",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"header",
		"main",
		"nav",
		"p",
		"section",
		"span"
	];
	function createIsolatedElement(options) {
		return __async(this, null, function* () {
			const { name, mode = "closed", css, isolateEvents = false } = options;
			if (!ALLOWED_SHADOW_ELEMENTS.includes(name) && !(0, import_is_potential_custom_element_name.default)(name)) throw Error(`"${name}" cannot have a shadow root attached to it. It must be two words and kebab-case, with a few exceptions. See https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#elements_you_can_attach_a_shadow_to`);
			const parentElement = document.createElement(name);
			const shadow = parentElement.attachShadow({ mode });
			const isolatedElement = document.createElement("div");
			if (css) {
				const style = document.createElement("style");
				if ("url" in css) style.textContent = yield fetch(css.url).then((res) => res.text());
				else style.textContent = css.textContent;
				shadow.appendChild(style);
			}
			shadow.appendChild(isolatedElement);
			if (isolateEvents) (Array.isArray(isolateEvents) ? isolateEvents : [
				"keydown",
				"keyup",
				"keypress"
			]).forEach((eventType) => {
				shadow.addEventListener(eventType, (e) => e.stopPropagation());
			});
			return {
				parentElement,
				shadow,
				isolatedElement
			};
		});
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/utils/content-script-ui/shadow-root.mjs
	/** @module wxt/utils/content-script-ui/shadow-root */
	/**
	* Create a content script UI inside a
	* [`ShadowRoot`](https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot).
	*
	* > This function is async because it has to load the CSS via a network call.
	*
	* @see https://wxt.dev/guide/essentials/content-scripts.html#shadow-root
	*/
	async function createShadowRootUi(ctx, options) {
		const instanceId = Math.random().toString(36).substring(2, 15);
		const css = [];
		if (!options.inheritStyles) css.push(`/* WXT Shadow Root Reset */ :host{all:initial !important;}`);
		if (options.css) css.push(options.css);
		if (ctx.options?.cssInjectionMode === "ui") {
			const entryCss = await loadCss();
			css.push(entryCss.replaceAll(":root", ":host"));
		}
		const { shadowCss, documentCss } = splitShadowRootCss(css.join("\n").trim());
		const { isolatedElement: uiContainer, parentElement: shadowHost, shadow } = await createIsolatedElement({
			name: options.name,
			css: { textContent: shadowCss },
			mode: options.mode ?? "open",
			isolateEvents: options.isolateEvents
		});
		let mounted;
		const mount = () => {
			mountUi(shadowHost, options);
			applyPosition(shadowHost, shadow.querySelector("html"), options);
			if (documentCss && !document.querySelector(`style[wxt-shadow-root-document-styles="${instanceId}"]`)) {
				const style = document.createElement("style");
				style.textContent = documentCss;
				style.setAttribute("wxt-shadow-root-document-styles", instanceId);
				(document.head ?? document.body).append(style);
			}
			mounted = options.onMount(uiContainer, shadow, shadowHost);
		};
		const remove = () => {
			options.onRemove?.(mounted);
			shadowHost.remove();
			document.querySelector(`style[wxt-shadow-root-document-styles="${instanceId}"]`)?.remove();
			while (uiContainer.lastChild) uiContainer.removeChild(uiContainer.lastChild);
			mounted = void 0;
		};
		const mountFunctions = createMountFunctions({
			mount,
			remove
		}, options);
		ctx.onInvalidated(remove);
		return {
			shadow,
			shadowHost,
			uiContainer,
			...mountFunctions,
			get mounted() {
				return mounted;
			}
		};
	}
	/** Load the CSS for the current entrypoint. */
	async function loadCss() {
		const url = browser.runtime.getURL(`/content-scripts/content.css`);
		try {
			return await (await fetch(url)).text();
		} catch (err) {
			logger$1.warn(`Failed to load styles @ ${url}. Did you forget to import the stylesheet in your entrypoint?`, err);
			return "";
		}
	}
	//#endregion
	//#region entrypoints/content.ts
	var content_default = defineContentScript({
		matches: ["*://*.google.com/*"],
		cssInjectionMode: "ui",
		async main(ctx) {
			console.log("[Extension] Content script loaded");
			if (window.__extensionInitialized) return;
			window.__extensionInitialized = true;
			(await createShadowRootUi(ctx, {
				name: "my-extension-overlay",
				position: "inline",
				anchor: "body",
				append: "first",
				onMount: (container) => {
					const div = document.createElement("div");
					div.textContent = "Extension loaded!";
					div.style.padding = "10px";
					div.style.background = "#4F46E5";
					div.style.color = "white";
					container.appendChild(div);
					return div;
				}
			})).mount();
		}
	});
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/utils/internal/custom-events.mjs
	var WxtLocationChangeEvent = class WxtLocationChangeEvent extends Event {
		static EVENT_NAME = getUniqueEventName("wxt:locationchange");
		constructor(newUrl, oldUrl) {
			super(WxtLocationChangeEvent.EVENT_NAME, {});
			this.newUrl = newUrl;
			this.oldUrl = oldUrl;
		}
	};
	/**
	* Returns an event name unique to the extension and content script that's
	* running.
	*/
	function getUniqueEventName(eventName) {
		return `${browser?.runtime?.id}:content:${eventName}`;
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/utils/internal/location-watcher.mjs
	var supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
	/**
	* Create a util that watches for URL changes, dispatching the custom event when
	* detected. Stops watching when content script is invalidated. Uses Navigation
	* API when available, otherwise falls back to polling.
	*/
	function createLocationWatcher(ctx) {
		let lastUrl;
		let watching = false;
		return { run() {
			if (watching) return;
			watching = true;
			lastUrl = new URL(location.href);
			if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
				const newUrl = new URL(event.destination.url);
				if (newUrl.href === lastUrl.href) return;
				window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
				lastUrl = newUrl;
			}, { signal: ctx.signal });
			else ctx.setInterval(() => {
				const newUrl = new URL(location.href);
				if (newUrl.href !== lastUrl.href) {
					window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
					lastUrl = newUrl;
				}
			}, 1e3);
		} };
	}
	//#endregion
	//#region node_modules/.pnpm/wxt@0.20.20_@types+node@25.5.0_jiti@2.6.1_tsx@4.21.0/node_modules/wxt/dist/utils/content-script-context.mjs
	/**
	* Implements
	* [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
	* Used to detect and stop content script code when the script is invalidated.
	*
	* It also provides several utilities like `ctx.setTimeout` and
	* `ctx.setInterval` that should be used in content scripts instead of
	* `window.setTimeout` or `window.setInterval`.
	*
	* To create context for testing, you can use the class's constructor:
	*
	* ```ts
	* import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
	*
	* test('storage listener should be removed when context is invalidated', () => {
	*   const ctx = new ContentScriptContext('test');
	*   const item = storage.defineItem('local:count', { defaultValue: 0 });
	*   const watcher = vi.fn();
	*
	*   const unwatch = item.watch(watcher);
	*   ctx.onInvalidated(unwatch); // Listen for invalidate here
	*
	*   await item.setValue(1);
	*   expect(watcher).toBeCalledTimes(1);
	*   expect(watcher).toBeCalledWith(1, 0);
	*
	*   ctx.notifyInvalidated(); // Use this function to invalidate the context
	*   await item.setValue(2);
	*   expect(watcher).toBeCalledTimes(1);
	* });
	* ```
	*/
	var ContentScriptContext = class ContentScriptContext {
		static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
		id;
		abortController;
		locationWatcher = createLocationWatcher(this);
		constructor(contentScriptName, options) {
			this.contentScriptName = contentScriptName;
			this.options = options;
			this.id = Math.random().toString(36).slice(2);
			this.abortController = new AbortController();
			this.stopOldScripts();
			this.listenForNewerScripts();
		}
		get signal() {
			return this.abortController.signal;
		}
		abort(reason) {
			return this.abortController.abort(reason);
		}
		get isInvalid() {
			if (browser.runtime?.id == null) this.notifyInvalidated();
			return this.signal.aborted;
		}
		get isValid() {
			return !this.isInvalid;
		}
		/**
		* Add a listener that is called when the content script's context is
		* invalidated.
		*
		* @example
		*   browser.runtime.onMessage.addListener(cb);
		*   const removeInvalidatedListener = ctx.onInvalidated(() => {
		*     browser.runtime.onMessage.removeListener(cb);
		*   });
		*   // ...
		*   removeInvalidatedListener();
		*
		* @returns A function to remove the listener.
		*/
		onInvalidated(cb) {
			this.signal.addEventListener("abort", cb);
			return () => this.signal.removeEventListener("abort", cb);
		}
		/**
		* Return a promise that never resolves. Useful if you have an async function
		* that shouldn't run after the context is expired.
		*
		* @example
		*   const getValueFromStorage = async () => {
		*     if (ctx.isInvalid) return ctx.block();
		*
		*     // ...
		*   };
		*/
		block() {
			return new Promise(() => {});
		}
		/**
		* Wrapper around `window.setInterval` that automatically clears the interval
		* when invalidated.
		*
		* Intervals can be cleared by calling the normal `clearInterval` function.
		*/
		setInterval(handler, timeout) {
			const id = setInterval(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearInterval(id));
			return id;
		}
		/**
		* Wrapper around `window.setTimeout` that automatically clears the interval
		* when invalidated.
		*
		* Timeouts can be cleared by calling the normal `setTimeout` function.
		*/
		setTimeout(handler, timeout) {
			const id = setTimeout(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearTimeout(id));
			return id;
		}
		/**
		* Wrapper around `window.requestAnimationFrame` that automatically cancels
		* the request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelAnimationFrame`
		* function.
		*/
		requestAnimationFrame(callback) {
			const id = requestAnimationFrame((...args) => {
				if (this.isValid) callback(...args);
			});
			this.onInvalidated(() => cancelAnimationFrame(id));
			return id;
		}
		/**
		* Wrapper around `window.requestIdleCallback` that automatically cancels the
		* request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelIdleCallback`
		* function.
		*/
		requestIdleCallback(callback, options) {
			const id = requestIdleCallback((...args) => {
				if (!this.signal.aborted) callback(...args);
			}, options);
			this.onInvalidated(() => cancelIdleCallback(id));
			return id;
		}
		addEventListener(target, type, handler, options) {
			if (type === "wxt:locationchange") {
				if (this.isValid) this.locationWatcher.run();
			}
			target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
				...options,
				signal: this.signal
			});
		}
		/**
		* @internal
		* Abort the abort controller and execute all `onInvalidated` listeners.
		*/
		notifyInvalidated() {
			this.abort("Content script context invalidated");
			logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
		}
		stopOldScripts() {
			document.dispatchEvent(new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
				contentScriptName: this.contentScriptName,
				messageId: this.id
			} }));
			window.postMessage({
				type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
				contentScriptName: this.contentScriptName,
				messageId: this.id
			}, "*");
		}
		verifyScriptStartedEvent(event) {
			const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
			const isFromSelf = event.detail?.messageId === this.id;
			return isSameContentScript && !isFromSelf;
		}
		listenForNewerScripts() {
			const cb = (event) => {
				if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
				this.notifyInvalidated();
			};
			document.addEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb);
			this.onInvalidated(() => document.removeEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb));
		}
	};
	//#endregion
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?C:/Users/xy/Desktop/myTestExtension/entrypoints/content.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	//#endregion
	return (async () => {
		try {
			const { main, ...options } = content_default;
			return await main(new ContentScriptContext("content", options));
		} catch (err) {
			logger.error(`The content script "content" crashed on startup!`, err);
			throw err;
		}
	})();
})();

content;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbInByaW50IiwibG9nZ2VyIiwiYnJvd3NlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yMF9AdHlwZXMrbm9kZUAyNS41LjBfaml0aUAyLjYuMV90c3hANC4yMS4wL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3d4dEAwLjIwLjIwX0B0eXBlcytub2RlQDI1LjUuMF9qaXRpQDIuNi4xX3RzeEA0LjIxLjAvbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvZ2dlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vbWFueS1rZXlzLW1hcEAyLjAuMS9ub2RlX21vZHVsZXMvbWFueS1rZXlzLW1hcC9pbmRleC5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9kZWZ1QDYuMS40L25vZGVfbW9kdWxlcy9kZWZ1L2Rpc3QvZGVmdS5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vQDFuYXRzdSt3YWl0LWVsZW1lbnRANC4xLjIvbm9kZV9tb2R1bGVzL0AxbmF0c3Uvd2FpdC1lbGVtZW50L2Rpc3QvZGV0ZWN0b3JzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9AMW5hdHN1K3dhaXQtZWxlbWVudEA0LjEuMi9ub2RlX21vZHVsZXMvQDFuYXRzdS93YWl0LWVsZW1lbnQvZGlzdC9pbmRleC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjBfQHR5cGVzK25vZGVAMjUuNS4wX2ppdGlAMi42LjFfdHN4QDQuMjEuMC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtdWkvc2hhcmVkLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yMF9AdHlwZXMrbm9kZUAyNS41LjBfaml0aUAyLjYuMV90c3hANC4yMS4wL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9zcGxpdC1zaGFkb3ctcm9vdC1jc3MubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0B3eHQtZGV2K2Jyb3dzZXJAMC4xLjM4L25vZGVfbW9kdWxlcy9Ad3h0LWRldi9icm93c2VyL3NyYy9pbmRleC5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjBfQHR5cGVzK25vZGVAMjUuNS4wX2ppdGlAMi42LjFfdHN4QDQuMjEuMC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vaXMtcG90ZW50aWFsLWN1c3RvbS1lbGVtZW50LW5hbWVAMS4wLjEvbm9kZV9tb2R1bGVzL2lzLXBvdGVudGlhbC1jdXN0b20tZWxlbWVudC1uYW1lL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0B3ZWJleHQtY29yZStpc29sYXRlZC1lbGVtZW50QDEuMS40L25vZGVfbW9kdWxlcy9Ad2ViZXh0LWNvcmUvaXNvbGF0ZWQtZWxlbWVudC9saWIvaW5kZXguanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvLnBucG0vd3h0QDAuMjAuMjBfQHR5cGVzK25vZGVAMjUuNS4wX2ppdGlAMi42LjFfdHN4QDQuMjEuMC9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdXRpbHMvY29udGVudC1zY3JpcHQtdWkvc2hhZG93LXJvb3QubWpzIiwiLi4vLi4vLi4vZW50cnlwb2ludHMvY29udGVudC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yMF9AdHlwZXMrbm9kZUAyNS41LjBfaml0aUAyLjYuMV90c3hANC4yMS4wL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yMF9AdHlwZXMrbm9kZUAyNS41LjBfaml0aUAyLjYuMV90c3hANC4yMS4wL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS93eHRAMC4yMC4yMF9AdHlwZXMrbm9kZUAyNS41LjBfaml0aUAyLjYuMV90c3hANC4yMS4wL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9jb250ZW50LXNjcmlwdC1jb250ZXh0Lm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyNyZWdpb24gc3JjL3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC50c1xuZnVuY3Rpb24gZGVmaW5lQ29udGVudFNjcmlwdChkZWZpbml0aW9uKSB7XG5cdHJldHVybiBkZWZpbml0aW9uO1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBkZWZpbmVDb250ZW50U2NyaXB0IH07XG4iLCIvLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvZ2dlci50c1xuZnVuY3Rpb24gcHJpbnQobWV0aG9kLCAuLi5hcmdzKSB7XG5cdGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJwcm9kdWN0aW9uXCIpIHJldHVybjtcblx0aWYgKHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiKSBtZXRob2QoYFt3eHRdICR7YXJncy5zaGlmdCgpfWAsIC4uLmFyZ3MpO1xuXHRlbHNlIG1ldGhvZChcIlt3eHRdXCIsIC4uLmFyZ3MpO1xufVxuLyoqIFdyYXBwZXIgYXJvdW5kIGBjb25zb2xlYCB3aXRoIGEgXCJbd3h0XVwiIHByZWZpeCAqL1xuY29uc3QgbG9nZ2VyID0ge1xuXHRkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuXHRsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG5cdHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuXHRlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBsb2dnZXIgfTtcbiIsImNvbnN0IG51bGxLZXkgPSBTeW1ib2woJ251bGwnKTsgLy8gYG9iamVjdEhhc2hlc2Aga2V5IGZvciBudWxsXG5cbmxldCBrZXlDb3VudGVyID0gMDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFueUtleXNNYXAgZXh0ZW5kcyBNYXAge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5fb2JqZWN0SGFzaGVzID0gbmV3IFdlYWtNYXAoKTtcblx0XHR0aGlzLl9zeW1ib2xIYXNoZXMgPSBuZXcgTWFwKCk7IC8vIGh0dHBzOi8vZ2l0aHViLmNvbS90YzM5L2VjbWEyNjIvaXNzdWVzLzExOTRcblx0XHR0aGlzLl9wdWJsaWNLZXlzID0gbmV3IE1hcCgpO1xuXG5cdFx0Y29uc3QgW3BhaXJzXSA9IGFyZ3VtZW50czsgLy8gTWFwIGNvbXBhdFxuXHRcdGlmIChwYWlycyA9PT0gbnVsbCB8fCBwYWlycyA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBwYWlyc1tTeW1ib2wuaXRlcmF0b3JdICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKHR5cGVvZiBwYWlycyArICcgaXMgbm90IGl0ZXJhYmxlIChjYW5ub3QgcmVhZCBwcm9wZXJ0eSBTeW1ib2woU3ltYm9sLml0ZXJhdG9yKSknKTtcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IFtrZXlzLCB2YWx1ZV0gb2YgcGFpcnMpIHtcblx0XHRcdHRoaXMuc2V0KGtleXMsIHZhbHVlKTtcblx0XHR9XG5cdH1cblxuXHRfZ2V0UHVibGljS2V5cyhrZXlzLCBjcmVhdGUgPSBmYWxzZSkge1xuXHRcdGlmICghQXJyYXkuaXNBcnJheShrZXlzKSkge1xuXHRcdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIGtleXMgcGFyYW1ldGVyIG11c3QgYmUgYW4gYXJyYXknKTtcblx0XHR9XG5cblx0XHRjb25zdCBwcml2YXRlS2V5ID0gdGhpcy5fZ2V0UHJpdmF0ZUtleShrZXlzLCBjcmVhdGUpO1xuXG5cdFx0bGV0IHB1YmxpY0tleTtcblx0XHRpZiAocHJpdmF0ZUtleSAmJiB0aGlzLl9wdWJsaWNLZXlzLmhhcyhwcml2YXRlS2V5KSkge1xuXHRcdFx0cHVibGljS2V5ID0gdGhpcy5fcHVibGljS2V5cy5nZXQocHJpdmF0ZUtleSk7XG5cdFx0fSBlbHNlIGlmIChjcmVhdGUpIHtcblx0XHRcdHB1YmxpY0tleSA9IFsuLi5rZXlzXTsgLy8gUmVnZW5lcmF0ZSBrZXlzIGFycmF5IHRvIGF2b2lkIGV4dGVybmFsIGludGVyYWN0aW9uXG5cdFx0XHR0aGlzLl9wdWJsaWNLZXlzLnNldChwcml2YXRlS2V5LCBwdWJsaWNLZXkpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7cHJpdmF0ZUtleSwgcHVibGljS2V5fTtcblx0fVxuXG5cdF9nZXRQcml2YXRlS2V5KGtleXMsIGNyZWF0ZSA9IGZhbHNlKSB7XG5cdFx0Y29uc3QgcHJpdmF0ZUtleXMgPSBbXTtcblx0XHRmb3IgKGxldCBrZXkgb2Yga2V5cykge1xuXHRcdFx0aWYgKGtleSA9PT0gbnVsbCkge1xuXHRcdFx0XHRrZXkgPSBudWxsS2V5O1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBoYXNoZXMgPSB0eXBlb2Yga2V5ID09PSAnb2JqZWN0JyB8fCB0eXBlb2Yga2V5ID09PSAnZnVuY3Rpb24nID8gJ19vYmplY3RIYXNoZXMnIDogKHR5cGVvZiBrZXkgPT09ICdzeW1ib2wnID8gJ19zeW1ib2xIYXNoZXMnIDogZmFsc2UpO1xuXG5cdFx0XHRpZiAoIWhhc2hlcykge1xuXHRcdFx0XHRwcml2YXRlS2V5cy5wdXNoKGtleSk7XG5cdFx0XHR9IGVsc2UgaWYgKHRoaXNbaGFzaGVzXS5oYXMoa2V5KSkge1xuXHRcdFx0XHRwcml2YXRlS2V5cy5wdXNoKHRoaXNbaGFzaGVzXS5nZXQoa2V5KSk7XG5cdFx0XHR9IGVsc2UgaWYgKGNyZWF0ZSkge1xuXHRcdFx0XHRjb25zdCBwcml2YXRlS2V5ID0gYEBAbWttLXJlZi0ke2tleUNvdW50ZXIrK31AQGA7XG5cdFx0XHRcdHRoaXNbaGFzaGVzXS5zZXQoa2V5LCBwcml2YXRlS2V5KTtcblx0XHRcdFx0cHJpdmF0ZUtleXMucHVzaChwcml2YXRlS2V5KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gSlNPTi5zdHJpbmdpZnkocHJpdmF0ZUtleXMpO1xuXHR9XG5cblx0c2V0KGtleXMsIHZhbHVlKSB7XG5cdFx0Y29uc3Qge3B1YmxpY0tleX0gPSB0aGlzLl9nZXRQdWJsaWNLZXlzKGtleXMsIHRydWUpO1xuXHRcdHJldHVybiBzdXBlci5zZXQocHVibGljS2V5LCB2YWx1ZSk7XG5cdH1cblxuXHRnZXQoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gc3VwZXIuZ2V0KHB1YmxpY0tleSk7XG5cdH1cblxuXHRoYXMoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gc3VwZXIuaGFzKHB1YmxpY0tleSk7XG5cdH1cblxuXHRkZWxldGUoa2V5cykge1xuXHRcdGNvbnN0IHtwdWJsaWNLZXksIHByaXZhdGVLZXl9ID0gdGhpcy5fZ2V0UHVibGljS2V5cyhrZXlzKTtcblx0XHRyZXR1cm4gQm9vbGVhbihwdWJsaWNLZXkgJiYgc3VwZXIuZGVsZXRlKHB1YmxpY0tleSkgJiYgdGhpcy5fcHVibGljS2V5cy5kZWxldGUocHJpdmF0ZUtleSkpO1xuXHR9XG5cblx0Y2xlYXIoKSB7XG5cdFx0c3VwZXIuY2xlYXIoKTtcblx0XHR0aGlzLl9zeW1ib2xIYXNoZXMuY2xlYXIoKTtcblx0XHR0aGlzLl9wdWJsaWNLZXlzLmNsZWFyKCk7XG5cdH1cblxuXHRnZXQgW1N5bWJvbC50b1N0cmluZ1RhZ10oKSB7XG5cdFx0cmV0dXJuICdNYW55S2V5c01hcCc7XG5cdH1cblxuXHRnZXQgc2l6ZSgpIHtcblx0XHRyZXR1cm4gc3VwZXIuc2l6ZTtcblx0fVxufVxuIiwiZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICBpZiAodmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih2YWx1ZSk7XG4gIGlmIChwcm90b3R5cGUgIT09IG51bGwgJiYgcHJvdG90eXBlICE9PSBPYmplY3QucHJvdG90eXBlICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihwcm90b3R5cGUpICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGlmIChTeW1ib2wuaXRlcmF0b3IgaW4gdmFsdWUpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKFN5bWJvbC50b1N0cmluZ1RhZyBpbiB2YWx1ZSkge1xuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpID09PSBcIltvYmplY3QgTW9kdWxlXVwiO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBfZGVmdShiYXNlT2JqZWN0LCBkZWZhdWx0cywgbmFtZXNwYWNlID0gXCIuXCIsIG1lcmdlcikge1xuICBpZiAoIWlzUGxhaW5PYmplY3QoZGVmYXVsdHMpKSB7XG4gICAgcmV0dXJuIF9kZWZ1KGJhc2VPYmplY3QsIHt9LCBuYW1lc3BhY2UsIG1lcmdlcik7XG4gIH1cbiAgY29uc3Qgb2JqZWN0ID0gT2JqZWN0LmFzc2lnbih7fSwgZGVmYXVsdHMpO1xuICBmb3IgKGNvbnN0IGtleSBpbiBiYXNlT2JqZWN0KSB7XG4gICAgaWYgKGtleSA9PT0gXCJfX3Byb3RvX19cIiB8fCBrZXkgPT09IFwiY29uc3RydWN0b3JcIikge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IHZhbHVlID0gYmFzZU9iamVjdFtrZXldO1xuICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdm9pZCAwKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKG1lcmdlciAmJiBtZXJnZXIob2JqZWN0LCBrZXksIHZhbHVlLCBuYW1lc3BhY2UpKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpICYmIEFycmF5LmlzQXJyYXkob2JqZWN0W2tleV0pKSB7XG4gICAgICBvYmplY3Rba2V5XSA9IFsuLi52YWx1ZSwgLi4ub2JqZWN0W2tleV1dO1xuICAgIH0gZWxzZSBpZiAoaXNQbGFpbk9iamVjdCh2YWx1ZSkgJiYgaXNQbGFpbk9iamVjdChvYmplY3Rba2V5XSkpIHtcbiAgICAgIG9iamVjdFtrZXldID0gX2RlZnUoXG4gICAgICAgIHZhbHVlLFxuICAgICAgICBvYmplY3Rba2V5XSxcbiAgICAgICAgKG5hbWVzcGFjZSA/IGAke25hbWVzcGFjZX0uYCA6IFwiXCIpICsga2V5LnRvU3RyaW5nKCksXG4gICAgICAgIG1lcmdlclxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0W2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZURlZnUobWVyZ2VyKSB7XG4gIHJldHVybiAoLi4uYXJndW1lbnRzXykgPT4gKFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSB1bmljb3JuL25vLWFycmF5LXJlZHVjZVxuICAgIGFyZ3VtZW50c18ucmVkdWNlKChwLCBjKSA9PiBfZGVmdShwLCBjLCBcIlwiLCBtZXJnZXIpLCB7fSlcbiAgKTtcbn1cbmNvbnN0IGRlZnUgPSBjcmVhdGVEZWZ1KCk7XG5jb25zdCBkZWZ1Rm4gPSBjcmVhdGVEZWZ1KChvYmplY3QsIGtleSwgY3VycmVudFZhbHVlKSA9PiB7XG4gIGlmIChvYmplY3Rba2V5XSAhPT0gdm9pZCAwICYmIHR5cGVvZiBjdXJyZW50VmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIG9iamVjdFtrZXldID0gY3VycmVudFZhbHVlKG9iamVjdFtrZXldKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufSk7XG5jb25zdCBkZWZ1QXJyYXlGbiA9IGNyZWF0ZURlZnUoKG9iamVjdCwga2V5LCBjdXJyZW50VmFsdWUpID0+IHtcbiAgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0W2tleV0pICYmIHR5cGVvZiBjdXJyZW50VmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIG9iamVjdFtrZXldID0gY3VycmVudFZhbHVlKG9iamVjdFtrZXldKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufSk7XG5cbmV4cG9ydCB7IGNyZWF0ZURlZnUsIGRlZnUgYXMgZGVmYXVsdCwgZGVmdSwgZGVmdUFycmF5Rm4sIGRlZnVGbiB9O1xuIiwiY29uc3QgaXNFeGlzdCA9IChlbGVtZW50KSA9PiB7XG4gIHJldHVybiBlbGVtZW50ICE9PSBudWxsID8geyBpc0RldGVjdGVkOiB0cnVlLCByZXN1bHQ6IGVsZW1lbnQgfSA6IHsgaXNEZXRlY3RlZDogZmFsc2UgfTtcbn07XG5jb25zdCBpc05vdEV4aXN0ID0gKGVsZW1lbnQpID0+IHtcbiAgcmV0dXJuIGVsZW1lbnQgPT09IG51bGwgPyB7IGlzRGV0ZWN0ZWQ6IHRydWUsIHJlc3VsdDogbnVsbCB9IDogeyBpc0RldGVjdGVkOiBmYWxzZSB9O1xufTtcblxuZXhwb3J0IHsgaXNFeGlzdCwgaXNOb3RFeGlzdCB9O1xuIiwiaW1wb3J0IE1hbnlLZXlzTWFwIGZyb20gJ21hbnkta2V5cy1tYXAnO1xuaW1wb3J0IHsgZGVmdSB9IGZyb20gJ2RlZnUnO1xuaW1wb3J0IHsgaXNFeGlzdCB9IGZyb20gJy4vZGV0ZWN0b3JzLm1qcyc7XG5cbmNvbnN0IGdldERlZmF1bHRPcHRpb25zID0gKCkgPT4gKHtcbiAgdGFyZ2V0OiBnbG9iYWxUaGlzLmRvY3VtZW50LFxuICB1bmlmeVByb2Nlc3M6IHRydWUsXG4gIGRldGVjdG9yOiBpc0V4aXN0LFxuICBvYnNlcnZlQ29uZmlnczoge1xuICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICBzdWJ0cmVlOiB0cnVlLFxuICAgIGF0dHJpYnV0ZXM6IHRydWVcbiAgfSxcbiAgc2lnbmFsOiB2b2lkIDAsXG4gIGN1c3RvbU1hdGNoZXI6IHZvaWQgMFxufSk7XG5jb25zdCBtZXJnZU9wdGlvbnMgPSAodXNlclNpZGVPcHRpb25zLCBkZWZhdWx0T3B0aW9ucykgPT4ge1xuICByZXR1cm4gZGVmdSh1c2VyU2lkZU9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKTtcbn07XG5cbmNvbnN0IHVuaWZ5Q2FjaGUgPSBuZXcgTWFueUtleXNNYXAoKTtcbmZ1bmN0aW9uIGNyZWF0ZVdhaXRFbGVtZW50KGluc3RhbmNlT3B0aW9ucykge1xuICBjb25zdCB7IGRlZmF1bHRPcHRpb25zIH0gPSBpbnN0YW5jZU9wdGlvbnM7XG4gIHJldHVybiAoc2VsZWN0b3IsIG9wdGlvbnMpID0+IHtcbiAgICBjb25zdCB7XG4gICAgICB0YXJnZXQsXG4gICAgICB1bmlmeVByb2Nlc3MsXG4gICAgICBvYnNlcnZlQ29uZmlncyxcbiAgICAgIGRldGVjdG9yLFxuICAgICAgc2lnbmFsLFxuICAgICAgY3VzdG9tTWF0Y2hlclxuICAgIH0gPSBtZXJnZU9wdGlvbnMob3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpO1xuICAgIGNvbnN0IHVuaWZ5UHJvbWlzZUtleSA9IFtcbiAgICAgIHNlbGVjdG9yLFxuICAgICAgdGFyZ2V0LFxuICAgICAgdW5pZnlQcm9jZXNzLFxuICAgICAgb2JzZXJ2ZUNvbmZpZ3MsXG4gICAgICBkZXRlY3RvcixcbiAgICAgIHNpZ25hbCxcbiAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICBdO1xuICAgIGNvbnN0IGNhY2hlZFByb21pc2UgPSB1bmlmeUNhY2hlLmdldCh1bmlmeVByb21pc2VLZXkpO1xuICAgIGlmICh1bmlmeVByb2Nlc3MgJiYgY2FjaGVkUHJvbWlzZSkge1xuICAgICAgcmV0dXJuIGNhY2hlZFByb21pc2U7XG4gICAgfVxuICAgIGNvbnN0IGRldGVjdFByb21pc2UgPSBuZXcgUHJvbWlzZShcbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9Bc3luY1Byb21pc2VFeGVjdXRvcjogYXZvaWQgbmVzdGluZyBwcm9taXNlXG4gICAgICBhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGlmIChzaWduYWw/LmFib3J0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KHNpZ25hbC5yZWFzb24pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoXG4gICAgICAgICAgYXN5bmMgKG11dGF0aW9ucykgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBfIG9mIG11dGF0aW9ucykge1xuICAgICAgICAgICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSB7XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnN0IGRldGVjdFJlc3VsdDIgPSBhd2FpdCBkZXRlY3RFbGVtZW50KHtcbiAgICAgICAgICAgICAgICBzZWxlY3RvcixcbiAgICAgICAgICAgICAgICB0YXJnZXQsXG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IsXG4gICAgICAgICAgICAgICAgY3VzdG9tTWF0Y2hlclxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgaWYgKGRldGVjdFJlc3VsdDIuaXNEZXRlY3RlZCkge1xuICAgICAgICAgICAgICAgIG9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRldGVjdFJlc3VsdDIucmVzdWx0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgc2lnbmFsPy5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICAgIFwiYWJvcnRcIixcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICBvYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHNpZ25hbC5yZWFzb24pO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBvbmNlOiB0cnVlIH1cbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgZGV0ZWN0UmVzdWx0ID0gYXdhaXQgZGV0ZWN0RWxlbWVudCh7XG4gICAgICAgICAgc2VsZWN0b3IsXG4gICAgICAgICAgdGFyZ2V0LFxuICAgICAgICAgIGRldGVjdG9yLFxuICAgICAgICAgIGN1c3RvbU1hdGNoZXJcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChkZXRlY3RSZXN1bHQuaXNEZXRlY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKGRldGVjdFJlc3VsdC5yZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUodGFyZ2V0LCBvYnNlcnZlQ29uZmlncyk7XG4gICAgICB9XG4gICAgKS5maW5hbGx5KCgpID0+IHtcbiAgICAgIHVuaWZ5Q2FjaGUuZGVsZXRlKHVuaWZ5UHJvbWlzZUtleSk7XG4gICAgfSk7XG4gICAgdW5pZnlDYWNoZS5zZXQodW5pZnlQcm9taXNlS2V5LCBkZXRlY3RQcm9taXNlKTtcbiAgICByZXR1cm4gZGV0ZWN0UHJvbWlzZTtcbiAgfTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGRldGVjdEVsZW1lbnQoe1xuICB0YXJnZXQsXG4gIHNlbGVjdG9yLFxuICBkZXRlY3RvcixcbiAgY3VzdG9tTWF0Y2hlclxufSkge1xuICBjb25zdCBlbGVtZW50ID0gY3VzdG9tTWF0Y2hlciA/IGN1c3RvbU1hdGNoZXIoc2VsZWN0b3IpIDogdGFyZ2V0LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICByZXR1cm4gYXdhaXQgZGV0ZWN0b3IoZWxlbWVudCk7XG59XG5jb25zdCB3YWl0RWxlbWVudCA9IGNyZWF0ZVdhaXRFbGVtZW50KHtcbiAgZGVmYXVsdE9wdGlvbnM6IGdldERlZmF1bHRPcHRpb25zKClcbn0pO1xuXG5leHBvcnQgeyBjcmVhdGVXYWl0RWxlbWVudCwgZ2V0RGVmYXVsdE9wdGlvbnMsIHdhaXRFbGVtZW50IH07XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi4vaW50ZXJuYWwvbG9nZ2VyLm1qc1wiO1xuaW1wb3J0IHsgd2FpdEVsZW1lbnQgfSBmcm9tIFwiQDFuYXRzdS93YWl0LWVsZW1lbnRcIjtcbmltcG9ydCB7IGlzRXhpc3QsIGlzTm90RXhpc3QgfSBmcm9tIFwiQDFuYXRzdS93YWl0LWVsZW1lbnQvZGV0ZWN0b3JzXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2NvbnRlbnQtc2NyaXB0LXVpL3NoYXJlZC50c1xuZnVuY3Rpb24gYXBwbHlQb3NpdGlvbihyb290LCBwb3NpdGlvbmVkRWxlbWVudCwgb3B0aW9ucykge1xuXHRpZiAob3B0aW9ucy5wb3NpdGlvbiA9PT0gXCJpbmxpbmVcIikgcmV0dXJuO1xuXHRpZiAob3B0aW9ucy56SW5kZXggIT0gbnVsbCkgcm9vdC5zdHlsZS56SW5kZXggPSBTdHJpbmcob3B0aW9ucy56SW5kZXgpO1xuXHRyb290LnN0eWxlLm92ZXJmbG93ID0gXCJ2aXNpYmxlXCI7XG5cdHJvb3Quc3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XG5cdHJvb3Quc3R5bGUud2lkdGggPSBcIjBcIjtcblx0cm9vdC5zdHlsZS5oZWlnaHQgPSBcIjBcIjtcblx0cm9vdC5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuXHRpZiAocG9zaXRpb25lZEVsZW1lbnQpIGlmIChvcHRpb25zLnBvc2l0aW9uID09PSBcIm92ZXJsYXlcIikge1xuXHRcdHBvc2l0aW9uZWRFbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xuXHRcdGlmIChvcHRpb25zLmFsaWdubWVudD8uc3RhcnRzV2l0aChcImJvdHRvbS1cIikpIHBvc2l0aW9uZWRFbGVtZW50LnN0eWxlLmJvdHRvbSA9IFwiMFwiO1xuXHRcdGVsc2UgcG9zaXRpb25lZEVsZW1lbnQuc3R5bGUudG9wID0gXCIwXCI7XG5cdFx0aWYgKG9wdGlvbnMuYWxpZ25tZW50Py5lbmRzV2l0aChcIi1yaWdodFwiKSkgcG9zaXRpb25lZEVsZW1lbnQuc3R5bGUucmlnaHQgPSBcIjBcIjtcblx0XHRlbHNlIHBvc2l0aW9uZWRFbGVtZW50LnN0eWxlLmxlZnQgPSBcIjBcIjtcblx0fSBlbHNlIHtcblx0XHRwb3NpdGlvbmVkRWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwiZml4ZWRcIjtcblx0XHRwb3NpdGlvbmVkRWxlbWVudC5zdHlsZS50b3AgPSBcIjBcIjtcblx0XHRwb3NpdGlvbmVkRWxlbWVudC5zdHlsZS5ib3R0b20gPSBcIjBcIjtcblx0XHRwb3NpdGlvbmVkRWxlbWVudC5zdHlsZS5sZWZ0ID0gXCIwXCI7XG5cdFx0cG9zaXRpb25lZEVsZW1lbnQuc3R5bGUucmlnaHQgPSBcIjBcIjtcblx0fVxufVxuZnVuY3Rpb24gZ2V0QW5jaG9yKG9wdGlvbnMpIHtcblx0aWYgKG9wdGlvbnMuYW5jaG9yID09IG51bGwpIHJldHVybiBkb2N1bWVudC5ib2R5O1xuXHRsZXQgcmVzb2x2ZWQgPSB0eXBlb2Ygb3B0aW9ucy5hbmNob3IgPT09IFwiZnVuY3Rpb25cIiA/IG9wdGlvbnMuYW5jaG9yKCkgOiBvcHRpb25zLmFuY2hvcjtcblx0aWYgKHR5cGVvZiByZXNvbHZlZCA9PT0gXCJzdHJpbmdcIikgaWYgKHJlc29sdmVkLnN0YXJ0c1dpdGgoXCIvXCIpKSByZXR1cm4gZG9jdW1lbnQuZXZhbHVhdGUocmVzb2x2ZWQsIGRvY3VtZW50LCBudWxsLCBYUGF0aFJlc3VsdC5GSVJTVF9PUkRFUkVEX05PREVfVFlQRSwgbnVsbCkuc2luZ2xlTm9kZVZhbHVlID8/IHZvaWQgMDtcblx0ZWxzZSByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihyZXNvbHZlZCkgPz8gdm9pZCAwO1xuXHRyZXR1cm4gcmVzb2x2ZWQgPz8gdm9pZCAwO1xufVxuZnVuY3Rpb24gbW91bnRVaShyb290LCBvcHRpb25zKSB7XG5cdGNvbnN0IGFuY2hvciA9IGdldEFuY2hvcihvcHRpb25zKTtcblx0aWYgKGFuY2hvciA9PSBudWxsKSB0aHJvdyBFcnJvcihcIkZhaWxlZCB0byBtb3VudCBjb250ZW50IHNjcmlwdCBVSTogY291bGQgbm90IGZpbmQgYW5jaG9yIGVsZW1lbnRcIik7XG5cdHN3aXRjaCAob3B0aW9ucy5hcHBlbmQpIHtcblx0XHRjYXNlIHZvaWQgMDpcblx0XHRjYXNlIFwibGFzdFwiOlxuXHRcdFx0YW5jaG9yLmFwcGVuZChyb290KTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgXCJmaXJzdFwiOlxuXHRcdFx0YW5jaG9yLnByZXBlbmQocm9vdCk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIFwicmVwbGFjZVwiOlxuXHRcdFx0YW5jaG9yLnJlcGxhY2VXaXRoKHJvb3QpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBcImFmdGVyXCI6XG5cdFx0XHRhbmNob3IucGFyZW50RWxlbWVudD8uaW5zZXJ0QmVmb3JlKHJvb3QsIGFuY2hvci5uZXh0RWxlbWVudFNpYmxpbmcpO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSBcImJlZm9yZVwiOlxuXHRcdFx0YW5jaG9yLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZShyb290LCBhbmNob3IpO1xuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDogb3B0aW9ucy5hcHBlbmQoYW5jaG9yLCByb290KTtcblx0fVxufVxuZnVuY3Rpb24gY3JlYXRlTW91bnRGdW5jdGlvbnMoYmFzZUZ1bmN0aW9ucywgb3B0aW9ucykge1xuXHRsZXQgYXV0b01vdW50SW5zdGFuY2U7XG5cdGNvbnN0IHN0b3BBdXRvTW91bnQgPSAoKSA9PiB7XG5cdFx0YXV0b01vdW50SW5zdGFuY2U/LnN0b3BBdXRvTW91bnQoKTtcblx0XHRhdXRvTW91bnRJbnN0YW5jZSA9IHZvaWQgMDtcblx0fTtcblx0Y29uc3QgbW91bnQgPSAoKSA9PiB7XG5cdFx0YmFzZUZ1bmN0aW9ucy5tb3VudCgpO1xuXHR9O1xuXHRjb25zdCB1bm1vdW50ID0gYmFzZUZ1bmN0aW9ucy5yZW1vdmU7XG5cdGNvbnN0IHJlbW92ZSA9ICgpID0+IHtcblx0XHRzdG9wQXV0b01vdW50KCk7XG5cdFx0YmFzZUZ1bmN0aW9ucy5yZW1vdmUoKTtcblx0fTtcblx0Y29uc3QgYXV0b01vdW50ID0gKGF1dG9Nb3VudE9wdGlvbnMpID0+IHtcblx0XHRpZiAoYXV0b01vdW50SW5zdGFuY2UpIGxvZ2dlci53YXJuKFwiYXV0b01vdW50IGlzIGFscmVhZHkgc2V0LlwiKTtcblx0XHRhdXRvTW91bnRJbnN0YW5jZSA9IGF1dG9Nb3VudFVpKHtcblx0XHRcdG1vdW50LFxuXHRcdFx0dW5tb3VudCxcblx0XHRcdHN0b3BBdXRvTW91bnRcblx0XHR9LCB7XG5cdFx0XHQuLi5vcHRpb25zLFxuXHRcdFx0Li4uYXV0b01vdW50T3B0aW9uc1xuXHRcdH0pO1xuXHR9O1xuXHRyZXR1cm4ge1xuXHRcdG1vdW50LFxuXHRcdHJlbW92ZSxcblx0XHRhdXRvTW91bnRcblx0fTtcbn1cbmZ1bmN0aW9uIGF1dG9Nb3VudFVpKHVpQ2FsbGJhY2tzLCBvcHRpb25zKSB7XG5cdGNvbnN0IGFib3J0Q29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcblx0Y29uc3QgRVhQTElDSVRfU1RPUF9SRUFTT04gPSBcImV4cGxpY2l0X3N0b3BfYXV0b19tb3VudFwiO1xuXHRjb25zdCBfc3RvcEF1dG9Nb3VudCA9ICgpID0+IHtcblx0XHRhYm9ydENvbnRyb2xsZXIuYWJvcnQoRVhQTElDSVRfU1RPUF9SRUFTT04pO1xuXHRcdG9wdGlvbnMub25TdG9wPy4oKTtcblx0fTtcblx0bGV0IHJlc29sdmVkQW5jaG9yID0gdHlwZW9mIG9wdGlvbnMuYW5jaG9yID09PSBcImZ1bmN0aW9uXCIgPyBvcHRpb25zLmFuY2hvcigpIDogb3B0aW9ucy5hbmNob3I7XG5cdGlmIChyZXNvbHZlZEFuY2hvciBpbnN0YW5jZW9mIEVsZW1lbnQpIHRocm93IEVycm9yKFwiYXV0b01vdW50IGFuZCBFbGVtZW50IGFuY2hvciBvcHRpb24gY2Fubm90IGJlIGNvbWJpbmVkLiBBdm9pZCBwYXNzaW5nIGBFbGVtZW50YCBkaXJlY3RseSBvciBgKCkgPT4gRWxlbWVudGAgdG8gdGhlIGFuY2hvci5cIik7XG5cdGFzeW5jIGZ1bmN0aW9uIG9ic2VydmVFbGVtZW50KHNlbGVjdG9yKSB7XG5cdFx0bGV0IGlzQW5jaG9yRXhpc3QgPSAhIWdldEFuY2hvcihvcHRpb25zKTtcblx0XHRpZiAoaXNBbmNob3JFeGlzdCkgdWlDYWxsYmFja3MubW91bnQoKTtcblx0XHR3aGlsZSAoIWFib3J0Q29udHJvbGxlci5zaWduYWwuYWJvcnRlZCkgdHJ5IHtcblx0XHRcdGlzQW5jaG9yRXhpc3QgPSAhIWF3YWl0IHdhaXRFbGVtZW50KHNlbGVjdG9yID8/IFwiYm9keVwiLCB7XG5cdFx0XHRcdGN1c3RvbU1hdGNoZXI6ICgpID0+IGdldEFuY2hvcihvcHRpb25zKSA/PyBudWxsLFxuXHRcdFx0XHRkZXRlY3RvcjogaXNBbmNob3JFeGlzdCA/IGlzTm90RXhpc3QgOiBpc0V4aXN0LFxuXHRcdFx0XHRzaWduYWw6IGFib3J0Q29udHJvbGxlci5zaWduYWxcblx0XHRcdH0pO1xuXHRcdFx0aWYgKGlzQW5jaG9yRXhpc3QpIHVpQ2FsbGJhY2tzLm1vdW50KCk7XG5cdFx0XHRlbHNlIHtcblx0XHRcdFx0dWlDYWxsYmFja3MudW5tb3VudCgpO1xuXHRcdFx0XHRpZiAob3B0aW9ucy5vbmNlKSB1aUNhbGxiYWNrcy5zdG9wQXV0b01vdW50KCk7XG5cdFx0XHR9XG5cdFx0fSBjYXRjaCAoZXJyb3IpIHtcblx0XHRcdGlmIChhYm9ydENvbnRyb2xsZXIuc2lnbmFsLmFib3J0ZWQgJiYgYWJvcnRDb250cm9sbGVyLnNpZ25hbC5yZWFzb24gPT09IEVYUExJQ0lUX1NUT1BfUkVBU09OKSBicmVhaztcblx0XHRcdGVsc2UgdGhyb3cgZXJyb3I7XG5cdFx0fVxuXHR9XG5cdG9ic2VydmVFbGVtZW50KHJlc29sdmVkQW5jaG9yKTtcblx0cmV0dXJuIHsgc3RvcEF1dG9Nb3VudDogX3N0b3BBdXRvTW91bnQgfTtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYXBwbHlQb3NpdGlvbiwgY3JlYXRlTW91bnRGdW5jdGlvbnMsIG1vdW50VWkgfTtcbiIsIi8vI3JlZ2lvbiBzcmMvdXRpbHMvc3BsaXQtc2hhZG93LXJvb3QtY3NzLnRzXG4vKiogQG1vZHVsZSB3eHQvdXRpbHMvc3BsaXQtc2hhZG93LXJvb3QtY3NzICovXG5jb25zdCBBVF9SVUxFX0JMT0NLUyA9IC8oXFxzKkAocHJvcGVydHl8Zm9udC1mYWNlKVtcXHNcXFNdKj97W1xcc1xcU10qP30pL2dtO1xuLyoqXG4qIEdpdmVuIGEgQ1NTIHN0cmluZyB0aGF0IHdpbGwgYmUgbG9hZGVkIGludG8gYSBzaGFkb3cgcm9vdCwgc3BsaXQgaXQgaW50byB0d29cbiogcGFydHM6XG4qXG4qIC0gYGRvY3VtZW50Q3NzYDogQ1NTIHRoYXQgbmVlZHMgdG8gYmUgYXBwbGllZCB0byB0aGUgZG9jdW1lbnQgKGxpa2VcbiogICBgQHByb3BlcnR5YClcbiogLSBgc2hhZG93Q3NzYDogQ1NTIHRoYXQgbmVlZHMgdG8gYmUgYXBwbGllZCB0byB0aGUgc2hhZG93IHJvb3RcbipcbiogQHBhcmFtIGNzc1xuKi9cbmZ1bmN0aW9uIHNwbGl0U2hhZG93Um9vdENzcyhjc3MpIHtcblx0cmV0dXJuIHtcblx0XHRkb2N1bWVudENzczogQXJyYXkuZnJvbShjc3MubWF0Y2hBbGwoQVRfUlVMRV9CTE9DS1MpLCAobSkgPT4gbVswXSkuam9pbihcIlwiKS50cmltKCksXG5cdFx0c2hhZG93Q3NzOiBjc3MucmVwbGFjZShBVF9SVUxFX0JMT0NLUywgXCJcIikudHJpbSgpXG5cdH07XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IHNwbGl0U2hhZG93Um9vdENzcyB9O1xuIiwiLy8gI3JlZ2lvbiBzbmlwcGV0XG5leHBvcnQgY29uc3QgYnJvd3NlciA9IGdsb2JhbFRoaXMuYnJvd3Nlcj8ucnVudGltZT8uaWRcbiAgPyBnbG9iYWxUaGlzLmJyb3dzZXJcbiAgOiBnbG9iYWxUaGlzLmNocm9tZTtcbi8vICNlbmRyZWdpb24gc25pcHBldFxuIiwiaW1wb3J0IHsgYnJvd3NlciBhcyBicm93c2VyJDEgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy9icm93c2VyLnRzXG4vKipcbiogQ29udGFpbnMgdGhlIGBicm93c2VyYCBleHBvcnQgd2hpY2ggeW91IHNob3VsZCB1c2UgdG8gYWNjZXNzIHRoZSBleHRlbnNpb25cbiogQVBJcyBpbiB5b3VyIHByb2plY3Q6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG4qXG4qIGJyb3dzZXIucnVudGltZS5vbkluc3RhbGxlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4qICAgLy8gLi4uXG4qIH0pO1xuKiBgYGBcbipcbiogQG1vZHVsZSB3eHQvYnJvd3NlclxuKi9cbmNvbnN0IGJyb3dzZXIgPSBicm93c2VyJDE7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGJyb3dzZXIgfTtcbiIsIi8vIEdlbmVyYXRlZCB1c2luZyBgbnBtIHJ1biBidWlsZGAuIERvIG5vdCBlZGl0LlxuXG52YXIgcmVnZXggPSAvXlthLXpdKD86W1xcLjAtOV9hLXpcXHhCN1xceEMwLVxceEQ2XFx4RDgtXFx4RjZcXHhGOC1cXHUwMzdEXFx1MDM3Ri1cXHUxRkZGXFx1MjAwQ1xcdTIwMERcXHUyMDNGXFx1MjA0MFxcdTIwNzAtXFx1MjE4RlxcdTJDMDAtXFx1MkZFRlxcdTMwMDEtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZGRF18W1xcdUQ4MDAtXFx1REI3Rl1bXFx1REMwMC1cXHVERkZGXSkqLSg/OltcXHgyRFxcLjAtOV9hLXpcXHhCN1xceEMwLVxceEQ2XFx4RDgtXFx4RjZcXHhGOC1cXHUwMzdEXFx1MDM3Ri1cXHUxRkZGXFx1MjAwQ1xcdTIwMERcXHUyMDNGXFx1MjA0MFxcdTIwNzAtXFx1MjE4RlxcdTJDMDAtXFx1MkZFRlxcdTMwMDEtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZGRF18W1xcdUQ4MDAtXFx1REI3Rl1bXFx1REMwMC1cXHVERkZGXSkqJC87XG5cbnZhciBpc1BvdGVudGlhbEN1c3RvbUVsZW1lbnROYW1lID0gZnVuY3Rpb24oc3RyaW5nKSB7XG5cdHJldHVybiByZWdleC50ZXN0KHN0cmluZyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGlzUG90ZW50aWFsQ3VzdG9tRWxlbWVudE5hbWU7XG4iLCJ2YXIgX19hc3luYyA9IChfX3RoaXMsIF9fYXJndW1lbnRzLCBnZW5lcmF0b3IpID0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICB2YXIgZnVsZmlsbGVkID0gKHZhbHVlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJlamVjdChlKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciByZWplY3RlZCA9ICh2YWx1ZSkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIHN0ZXAgPSAoeCkgPT4geC5kb25lID8gcmVzb2x2ZSh4LnZhbHVlKSA6IFByb21pc2UucmVzb2x2ZSh4LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpO1xuICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseShfX3RoaXMsIF9fYXJndW1lbnRzKSkubmV4dCgpKTtcbiAgfSk7XG59O1xuXG4vLyBzcmMvaW5kZXgudHNcbmltcG9ydCBpc1BvdGVudGlhbEN1c3RvbUVsZW1lbnROYW1lIGZyb20gXCJpcy1wb3RlbnRpYWwtY3VzdG9tLWVsZW1lbnQtbmFtZVwiO1xudmFyIEFMTE9XRURfU0hBRE9XX0VMRU1FTlRTID0gW1xuICBcImFydGljbGVcIixcbiAgXCJhc2lkZVwiLFxuICBcImJsb2NrcXVvdGVcIixcbiAgXCJib2R5XCIsXG4gIFwiZGl2XCIsXG4gIFwiZm9vdGVyXCIsXG4gIFwiaDFcIixcbiAgXCJoMlwiLFxuICBcImgzXCIsXG4gIFwiaDRcIixcbiAgXCJoNVwiLFxuICBcImg2XCIsXG4gIFwiaGVhZGVyXCIsXG4gIFwibWFpblwiLFxuICBcIm5hdlwiLFxuICBcInBcIixcbiAgXCJzZWN0aW9uXCIsXG4gIFwic3BhblwiXG5dO1xuZnVuY3Rpb24gY3JlYXRlSXNvbGF0ZWRFbGVtZW50KG9wdGlvbnMpIHtcbiAgcmV0dXJuIF9fYXN5bmModGhpcywgbnVsbCwgZnVuY3Rpb24qICgpIHtcbiAgICBjb25zdCB7IG5hbWUsIG1vZGUgPSBcImNsb3NlZFwiLCBjc3MsIGlzb2xhdGVFdmVudHMgPSBmYWxzZSB9ID0gb3B0aW9ucztcbiAgICBpZiAoIUFMTE9XRURfU0hBRE9XX0VMRU1FTlRTLmluY2x1ZGVzKG5hbWUpICYmICFpc1BvdGVudGlhbEN1c3RvbUVsZW1lbnROYW1lKG5hbWUpKSB7XG4gICAgICB0aHJvdyBFcnJvcihcbiAgICAgICAgYFwiJHtuYW1lfVwiIGNhbm5vdCBoYXZlIGEgc2hhZG93IHJvb3QgYXR0YWNoZWQgdG8gaXQuIEl0IG11c3QgYmUgdHdvIHdvcmRzIGFuZCBrZWJhYi1jYXNlLCB3aXRoIGEgZmV3IGV4Y2VwdGlvbnMuIFNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRWxlbWVudC9hdHRhY2hTaGFkb3cjZWxlbWVudHNfeW91X2Nhbl9hdHRhY2hfYV9zaGFkb3dfdG9gXG4gICAgICApO1xuICAgIH1cbiAgICBjb25zdCBwYXJlbnRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICBjb25zdCBzaGFkb3cgPSBwYXJlbnRFbGVtZW50LmF0dGFjaFNoYWRvdyh7IG1vZGUgfSk7XG4gICAgY29uc3QgaXNvbGF0ZWRFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBpZiAoY3NzKSB7XG4gICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgIGlmIChcInVybFwiIGluIGNzcykge1xuICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IHlpZWxkIGZldGNoKGNzcy51cmwpLnRoZW4oKHJlcykgPT4gcmVzLnRleHQoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGNzcy50ZXh0Q29udGVudDtcbiAgICAgIH1cbiAgICAgIHNoYWRvdy5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgfVxuICAgIHNoYWRvdy5hcHBlbmRDaGlsZChpc29sYXRlZEVsZW1lbnQpO1xuICAgIGlmIChpc29sYXRlRXZlbnRzKSB7XG4gICAgICBjb25zdCBldmVudFR5cGVzID0gQXJyYXkuaXNBcnJheShpc29sYXRlRXZlbnRzKSA/IGlzb2xhdGVFdmVudHMgOiBbXCJrZXlkb3duXCIsIFwia2V5dXBcIiwgXCJrZXlwcmVzc1wiXTtcbiAgICAgIGV2ZW50VHlwZXMuZm9yRWFjaCgoZXZlbnRUeXBlKSA9PiB7XG4gICAgICAgIHNoYWRvdy5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgKGUpID0+IGUuc3RvcFByb3BhZ2F0aW9uKCkpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBwYXJlbnRFbGVtZW50LFxuICAgICAgc2hhZG93LFxuICAgICAgaXNvbGF0ZWRFbGVtZW50XG4gICAgfTtcbiAgfSk7XG59XG5leHBvcnQge1xuICBjcmVhdGVJc29sYXRlZEVsZW1lbnRcbn07XG4iLCJpbXBvcnQgeyBsb2dnZXIgfSBmcm9tIFwiLi4vaW50ZXJuYWwvbG9nZ2VyLm1qc1wiO1xuaW1wb3J0IHsgYXBwbHlQb3NpdGlvbiwgY3JlYXRlTW91bnRGdW5jdGlvbnMsIG1vdW50VWkgfSBmcm9tIFwiLi9zaGFyZWQubWpzXCI7XG5pbXBvcnQgeyBzcGxpdFNoYWRvd1Jvb3RDc3MgfSBmcm9tIFwiLi4vc3BsaXQtc2hhZG93LXJvb3QtY3NzLm1qc1wiO1xuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuaW1wb3J0IHsgY3JlYXRlSXNvbGF0ZWRFbGVtZW50IH0gZnJvbSBcIkB3ZWJleHQtY29yZS9pc29sYXRlZC1lbGVtZW50XCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2NvbnRlbnQtc2NyaXB0LXVpL3NoYWRvdy1yb290LnRzXG4vKiogQG1vZHVsZSB3eHQvdXRpbHMvY29udGVudC1zY3JpcHQtdWkvc2hhZG93LXJvb3QgKi9cbi8qKlxuKiBDcmVhdGUgYSBjb250ZW50IHNjcmlwdCBVSSBpbnNpZGUgYVxuKiBbYFNoYWRvd1Jvb3RgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU2hhZG93Um9vdCkuXG4qXG4qID4gVGhpcyBmdW5jdGlvbiBpcyBhc3luYyBiZWNhdXNlIGl0IGhhcyB0byBsb2FkIHRoZSBDU1MgdmlhIGEgbmV0d29yayBjYWxsLlxuKlxuKiBAc2VlIGh0dHBzOi8vd3h0LmRldi9ndWlkZS9lc3NlbnRpYWxzL2NvbnRlbnQtc2NyaXB0cy5odG1sI3NoYWRvdy1yb290XG4qL1xuYXN5bmMgZnVuY3Rpb24gY3JlYXRlU2hhZG93Um9vdFVpKGN0eCwgb3B0aW9ucykge1xuXHRjb25zdCBpbnN0YW5jZUlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDE1KTtcblx0Y29uc3QgY3NzID0gW107XG5cdGlmICghb3B0aW9ucy5pbmhlcml0U3R5bGVzKSBjc3MucHVzaChgLyogV1hUIFNoYWRvdyBSb290IFJlc2V0ICovIDpob3N0e2FsbDppbml0aWFsICFpbXBvcnRhbnQ7fWApO1xuXHRpZiAob3B0aW9ucy5jc3MpIGNzcy5wdXNoKG9wdGlvbnMuY3NzKTtcblx0aWYgKGN0eC5vcHRpb25zPy5jc3NJbmplY3Rpb25Nb2RlID09PSBcInVpXCIpIHtcblx0XHRjb25zdCBlbnRyeUNzcyA9IGF3YWl0IGxvYWRDc3MoKTtcblx0XHRjc3MucHVzaChlbnRyeUNzcy5yZXBsYWNlQWxsKFwiOnJvb3RcIiwgXCI6aG9zdFwiKSk7XG5cdH1cblx0Y29uc3QgeyBzaGFkb3dDc3MsIGRvY3VtZW50Q3NzIH0gPSBzcGxpdFNoYWRvd1Jvb3RDc3MoY3NzLmpvaW4oXCJcXG5cIikudHJpbSgpKTtcblx0Y29uc3QgeyBpc29sYXRlZEVsZW1lbnQ6IHVpQ29udGFpbmVyLCBwYXJlbnRFbGVtZW50OiBzaGFkb3dIb3N0LCBzaGFkb3cgfSA9IGF3YWl0IGNyZWF0ZUlzb2xhdGVkRWxlbWVudCh7XG5cdFx0bmFtZTogb3B0aW9ucy5uYW1lLFxuXHRcdGNzczogeyB0ZXh0Q29udGVudDogc2hhZG93Q3NzIH0sXG5cdFx0bW9kZTogb3B0aW9ucy5tb2RlID8/IFwib3BlblwiLFxuXHRcdGlzb2xhdGVFdmVudHM6IG9wdGlvbnMuaXNvbGF0ZUV2ZW50c1xuXHR9KTtcblx0bGV0IG1vdW50ZWQ7XG5cdGNvbnN0IG1vdW50ID0gKCkgPT4ge1xuXHRcdG1vdW50VWkoc2hhZG93SG9zdCwgb3B0aW9ucyk7XG5cdFx0YXBwbHlQb3NpdGlvbihzaGFkb3dIb3N0LCBzaGFkb3cucXVlcnlTZWxlY3RvcihcImh0bWxcIiksIG9wdGlvbnMpO1xuXHRcdGlmIChkb2N1bWVudENzcyAmJiAhZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihgc3R5bGVbd3h0LXNoYWRvdy1yb290LWRvY3VtZW50LXN0eWxlcz1cIiR7aW5zdGFuY2VJZH1cIl1gKSkge1xuXHRcdFx0Y29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cdFx0XHRzdHlsZS50ZXh0Q29udGVudCA9IGRvY3VtZW50Q3NzO1xuXHRcdFx0c3R5bGUuc2V0QXR0cmlidXRlKFwid3h0LXNoYWRvdy1yb290LWRvY3VtZW50LXN0eWxlc1wiLCBpbnN0YW5jZUlkKTtcblx0XHRcdChkb2N1bWVudC5oZWFkID8/IGRvY3VtZW50LmJvZHkpLmFwcGVuZChzdHlsZSk7XG5cdFx0fVxuXHRcdG1vdW50ZWQgPSBvcHRpb25zLm9uTW91bnQodWlDb250YWluZXIsIHNoYWRvdywgc2hhZG93SG9zdCk7XG5cdH07XG5cdGNvbnN0IHJlbW92ZSA9ICgpID0+IHtcblx0XHRvcHRpb25zLm9uUmVtb3ZlPy4obW91bnRlZCk7XG5cdFx0c2hhZG93SG9zdC5yZW1vdmUoKTtcblx0XHRkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBzdHlsZVt3eHQtc2hhZG93LXJvb3QtZG9jdW1lbnQtc3R5bGVzPVwiJHtpbnN0YW5jZUlkfVwiXWApPy5yZW1vdmUoKTtcblx0XHR3aGlsZSAodWlDb250YWluZXIubGFzdENoaWxkKSB1aUNvbnRhaW5lci5yZW1vdmVDaGlsZCh1aUNvbnRhaW5lci5sYXN0Q2hpbGQpO1xuXHRcdG1vdW50ZWQgPSB2b2lkIDA7XG5cdH07XG5cdGNvbnN0IG1vdW50RnVuY3Rpb25zID0gY3JlYXRlTW91bnRGdW5jdGlvbnMoe1xuXHRcdG1vdW50LFxuXHRcdHJlbW92ZVxuXHR9LCBvcHRpb25zKTtcblx0Y3R4Lm9uSW52YWxpZGF0ZWQocmVtb3ZlKTtcblx0cmV0dXJuIHtcblx0XHRzaGFkb3csXG5cdFx0c2hhZG93SG9zdCxcblx0XHR1aUNvbnRhaW5lcixcblx0XHQuLi5tb3VudEZ1bmN0aW9ucyxcblx0XHRnZXQgbW91bnRlZCgpIHtcblx0XHRcdHJldHVybiBtb3VudGVkO1xuXHRcdH1cblx0fTtcbn1cbi8qKiBMb2FkIHRoZSBDU1MgZm9yIHRoZSBjdXJyZW50IGVudHJ5cG9pbnQuICovXG5hc3luYyBmdW5jdGlvbiBsb2FkQ3NzKCkge1xuXHRjb25zdCB1cmwgPSBicm93c2VyLnJ1bnRpbWUuZ2V0VVJMKGAvY29udGVudC1zY3JpcHRzLyR7aW1wb3J0Lm1ldGEuZW52LkVOVFJZUE9JTlR9LmNzc2ApO1xuXHR0cnkge1xuXHRcdHJldHVybiBhd2FpdCAoYXdhaXQgZmV0Y2godXJsKSkudGV4dCgpO1xuXHR9IGNhdGNoIChlcnIpIHtcblx0XHRsb2dnZXIud2FybihgRmFpbGVkIHRvIGxvYWQgc3R5bGVzIEAgJHt1cmx9LiBEaWQgeW91IGZvcmdldCB0byBpbXBvcnQgdGhlIHN0eWxlc2hlZXQgaW4geW91ciBlbnRyeXBvaW50P2AsIGVycik7XG5cdFx0cmV0dXJuIFwiXCI7XG5cdH1cbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgY3JlYXRlU2hhZG93Um9vdFVpIH07XG4iLCJpbXBvcnQgXCJ+L3NyYy9hc3NldHMvdGFpbHdpbmQuY3NzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICBtYXRjaGVzOiBbXCIqOi8vKi5nb29nbGUuY29tLypcIl0sICAvLyDkv67mlLnkuLrnm67moIfnvZHnq5lcbiAgY3NzSW5qZWN0aW9uTW9kZTogXCJ1aVwiLFxuXG4gIGFzeW5jIG1haW4oY3R4KSB7XG4gICAgY29uc29sZS5sb2coXCJbRXh0ZW5zaW9uXSBDb250ZW50IHNjcmlwdCBsb2FkZWRcIik7XG5cbiAgICAvLyDpmLLmraLph43lpI3liJ3lp4vljJZcbiAgICBpZiAod2luZG93Ll9fZXh0ZW5zaW9uSW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgd2luZG93Ll9fZXh0ZW5zaW9uSW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gICAgLy8g56S65L6L77ya5oyC6L295LiA5Liq566A5Y2V55qEIFVJXG4gICAgY29uc3QgdWkgPSBhd2FpdCBjcmVhdGVTaGFkb3dSb290VWkoY3R4LCB7XG4gICAgICBuYW1lOiBcIm15LWV4dGVuc2lvbi1vdmVybGF5XCIsXG4gICAgICBwb3NpdGlvbjogXCJpbmxpbmVcIixcbiAgICAgIGFuY2hvcjogXCJib2R5XCIsXG4gICAgICBhcHBlbmQ6IFwiZmlyc3RcIixcbiAgICAgIG9uTW91bnQ6IChjb250YWluZXIpID0+IHtcbiAgICAgICAgLy8g5Zyo6L+Z6YeM5riy5p+TIFJlYWN0IOe7hOS7tlxuICAgICAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBkaXYudGV4dENvbnRlbnQgPSBcIkV4dGVuc2lvbiBsb2FkZWQhXCI7XG4gICAgICAgIGRpdi5zdHlsZS5wYWRkaW5nID0gXCIxMHB4XCI7XG4gICAgICAgIGRpdi5zdHlsZS5iYWNrZ3JvdW5kID0gXCIjNEY0NkU1XCI7XG4gICAgICAgIGRpdi5zdHlsZS5jb2xvciA9IFwid2hpdGVcIjtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRpdik7XG4gICAgICAgIHJldHVybiBkaXY7XG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdWkubW91bnQoKTtcbiAgfSxcbn0pO1xuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9jdXN0b20tZXZlbnRzLnRzXG52YXIgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCA9IGNsYXNzIFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgZXh0ZW5kcyBFdmVudCB7XG5cdHN0YXRpYyBFVkVOVF9OQU1FID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpO1xuXHRjb25zdHJ1Y3RvcihuZXdVcmwsIG9sZFVybCkge1xuXHRcdHN1cGVyKFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQuRVZFTlRfTkFNRSwge30pO1xuXHRcdHRoaXMubmV3VXJsID0gbmV3VXJsO1xuXHRcdHRoaXMub2xkVXJsID0gb2xkVXJsO1xuXHR9XG59O1xuLyoqXG4qIFJldHVybnMgYW4gZXZlbnQgbmFtZSB1bmlxdWUgdG8gdGhlIGV4dGVuc2lvbiBhbmQgY29udGVudCBzY3JpcHQgdGhhdCdzXG4qIHJ1bm5pbmcuXG4qL1xuZnVuY3Rpb24gZ2V0VW5pcXVlRXZlbnROYW1lKGV2ZW50TmFtZSkge1xuXHRyZXR1cm4gYCR7YnJvd3Nlcj8ucnVudGltZT8uaWR9OiR7aW1wb3J0Lm1ldGEuZW52LkVOVFJZUE9JTlR9OiR7ZXZlbnROYW1lfWA7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQsIGdldFVuaXF1ZUV2ZW50TmFtZSB9O1xuIiwiaW1wb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCB9IGZyb20gXCIuL2N1c3RvbS1ldmVudHMubWpzXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIudHNcbmNvbnN0IHN1cHBvcnRzTmF2aWdhdGlvbkFwaSA9IHR5cGVvZiBnbG9iYWxUaGlzLm5hdmlnYXRpb24/LmFkZEV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIjtcbi8qKlxuKiBDcmVhdGUgYSB1dGlsIHRoYXQgd2F0Y2hlcyBmb3IgVVJMIGNoYW5nZXMsIGRpc3BhdGNoaW5nIHRoZSBjdXN0b20gZXZlbnQgd2hlblxuKiBkZXRlY3RlZC4gU3RvcHMgd2F0Y2hpbmcgd2hlbiBjb250ZW50IHNjcmlwdCBpcyBpbnZhbGlkYXRlZC4gVXNlcyBOYXZpZ2F0aW9uXG4qIEFQSSB3aGVuIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGZhbGxzIGJhY2sgdG8gcG9sbGluZy5cbiovXG5mdW5jdGlvbiBjcmVhdGVMb2NhdGlvbldhdGNoZXIoY3R4KSB7XG5cdGxldCBsYXN0VXJsO1xuXHRsZXQgd2F0Y2hpbmcgPSBmYWxzZTtcblx0cmV0dXJuIHsgcnVuKCkge1xuXHRcdGlmICh3YXRjaGluZykgcmV0dXJuO1xuXHRcdHdhdGNoaW5nID0gdHJ1ZTtcblx0XHRsYXN0VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcblx0XHRpZiAoc3VwcG9ydHNOYXZpZ2F0aW9uQXBpKSBnbG9iYWxUaGlzLm5hdmlnYXRpb24uYWRkRXZlbnRMaXN0ZW5lcihcIm5hdmlnYXRlXCIsIChldmVudCkgPT4ge1xuXHRcdFx0Y29uc3QgbmV3VXJsID0gbmV3IFVSTChldmVudC5kZXN0aW5hdGlvbi51cmwpO1xuXHRcdFx0aWYgKG5ld1VybC5ocmVmID09PSBsYXN0VXJsLmhyZWYpIHJldHVybjtcblx0XHRcdHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgbGFzdFVybCkpO1xuXHRcdFx0bGFzdFVybCA9IG5ld1VybDtcblx0XHR9LCB7IHNpZ25hbDogY3R4LnNpZ25hbCB9KTtcblx0XHRlbHNlIGN0eC5zZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRjb25zdCBuZXdVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdFx0aWYgKG5ld1VybC5ocmVmICE9PSBsYXN0VXJsLmhyZWYpIHtcblx0XHRcdFx0d2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBsYXN0VXJsKSk7XG5cdFx0XHRcdGxhc3RVcmwgPSBuZXdVcmw7XG5cdFx0XHR9XG5cdFx0fSwgMWUzKTtcblx0fSB9O1xufVxuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfTtcbiIsImltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuL2ludGVybmFsL2xvZ2dlci5tanNcIjtcbmltcG9ydCB7IGdldFVuaXF1ZUV2ZW50TmFtZSB9IGZyb20gXCIuL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzXCI7XG5pbXBvcnQgeyBjcmVhdGVMb2NhdGlvbldhdGNoZXIgfSBmcm9tIFwiLi9pbnRlcm5hbC9sb2NhdGlvbi13YXRjaGVyLm1qc1wiO1xuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJ3eHQvYnJvd3NlclwiO1xuLy8jcmVnaW9uIHNyYy91dGlscy9jb250ZW50LXNjcmlwdC1jb250ZXh0LnRzXG4vKipcbiogSW1wbGVtZW50c1xuKiBbYEFib3J0Q29udHJvbGxlcmBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9BYm9ydENvbnRyb2xsZXIpLlxuKiBVc2VkIHRvIGRldGVjdCBhbmQgc3RvcCBjb250ZW50IHNjcmlwdCBjb2RlIHdoZW4gdGhlIHNjcmlwdCBpcyBpbnZhbGlkYXRlZC5cbipcbiogSXQgYWxzbyBwcm92aWRlcyBzZXZlcmFsIHV0aWxpdGllcyBsaWtlIGBjdHguc2V0VGltZW91dGAgYW5kXG4qIGBjdHguc2V0SW50ZXJ2YWxgIHRoYXQgc2hvdWxkIGJlIHVzZWQgaW4gY29udGVudCBzY3JpcHRzIGluc3RlYWQgb2ZcbiogYHdpbmRvdy5zZXRUaW1lb3V0YCBvciBgd2luZG93LnNldEludGVydmFsYC5cbipcbiogVG8gY3JlYXRlIGNvbnRleHQgZm9yIHRlc3RpbmcsIHlvdSBjYW4gdXNlIHRoZSBjbGFzcydzIGNvbnN0cnVjdG9yOlxuKlxuKiBgYGB0c1xuKiBpbXBvcnQgeyBDb250ZW50U2NyaXB0Q29udGV4dCB9IGZyb20gJ3d4dC91dGlscy9jb250ZW50LXNjcmlwdHMtY29udGV4dCc7XG4qXG4qIHRlc3QoJ3N0b3JhZ2UgbGlzdGVuZXIgc2hvdWxkIGJlIHJlbW92ZWQgd2hlbiBjb250ZXh0IGlzIGludmFsaWRhdGVkJywgKCkgPT4ge1xuKiAgIGNvbnN0IGN0eCA9IG5ldyBDb250ZW50U2NyaXB0Q29udGV4dCgndGVzdCcpO1xuKiAgIGNvbnN0IGl0ZW0gPSBzdG9yYWdlLmRlZmluZUl0ZW0oJ2xvY2FsOmNvdW50JywgeyBkZWZhdWx0VmFsdWU6IDAgfSk7XG4qICAgY29uc3Qgd2F0Y2hlciA9IHZpLmZuKCk7XG4qXG4qICAgY29uc3QgdW53YXRjaCA9IGl0ZW0ud2F0Y2god2F0Y2hlcik7XG4qICAgY3R4Lm9uSW52YWxpZGF0ZWQodW53YXRjaCk7IC8vIExpc3RlbiBmb3IgaW52YWxpZGF0ZSBoZXJlXG4qXG4qICAgYXdhaXQgaXRlbS5zZXRWYWx1ZSgxKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFRpbWVzKDEpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkV2l0aCgxLCAwKTtcbipcbiogICBjdHgubm90aWZ5SW52YWxpZGF0ZWQoKTsgLy8gVXNlIHRoaXMgZnVuY3Rpb24gdG8gaW52YWxpZGF0ZSB0aGUgY29udGV4dFxuKiAgIGF3YWl0IGl0ZW0uc2V0VmFsdWUoMik7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRUaW1lcygxKTtcbiogfSk7XG4qIGBgYFxuKi9cbnZhciBDb250ZW50U2NyaXB0Q29udGV4dCA9IGNsYXNzIENvbnRlbnRTY3JpcHRDb250ZXh0IHtcblx0c3RhdGljIFNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpjb250ZW50LXNjcmlwdC1zdGFydGVkXCIpO1xuXHRpZDtcblx0YWJvcnRDb250cm9sbGVyO1xuXHRsb2NhdGlvbldhdGNoZXIgPSBjcmVhdGVMb2NhdGlvbldhdGNoZXIodGhpcyk7XG5cdGNvbnN0cnVjdG9yKGNvbnRlbnRTY3JpcHROYW1lLCBvcHRpb25zKSB7XG5cdFx0dGhpcy5jb250ZW50U2NyaXB0TmFtZSA9IGNvbnRlbnRTY3JpcHROYW1lO1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0dGhpcy5pZCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpO1xuXHRcdHRoaXMuYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuXHRcdHRoaXMuc3RvcE9sZFNjcmlwdHMoKTtcblx0XHR0aGlzLmxpc3RlbkZvck5ld2VyU2NyaXB0cygpO1xuXHR9XG5cdGdldCBzaWduYWwoKSB7XG5cdFx0cmV0dXJuIHRoaXMuYWJvcnRDb250cm9sbGVyLnNpZ25hbDtcblx0fVxuXHRhYm9ydChyZWFzb24pIHtcblx0XHRyZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuYWJvcnQocmVhc29uKTtcblx0fVxuXHRnZXQgaXNJbnZhbGlkKCkge1xuXHRcdGlmIChicm93c2VyLnJ1bnRpbWU/LmlkID09IG51bGwpIHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcblx0XHRyZXR1cm4gdGhpcy5zaWduYWwuYWJvcnRlZDtcblx0fVxuXHRnZXQgaXNWYWxpZCgpIHtcblx0XHRyZXR1cm4gIXRoaXMuaXNJbnZhbGlkO1xuXHR9XG5cdC8qKlxuXHQqIEFkZCBhIGxpc3RlbmVyIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRlbnQgc2NyaXB0J3MgY29udGV4dCBpc1xuXHQqIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQGV4YW1wbGVcblx0KiAgIGJyb3dzZXIucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoY2IpO1xuXHQqICAgY29uc3QgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lciA9IGN0eC5vbkludmFsaWRhdGVkKCgpID0+IHtcblx0KiAgICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5yZW1vdmVMaXN0ZW5lcihjYik7XG5cdCogICB9KTtcblx0KiAgIC8vIC4uLlxuXHQqICAgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lcigpO1xuXHQqXG5cdCogQHJldHVybnMgQSBmdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyLlxuXHQqL1xuXHRvbkludmFsaWRhdGVkKGNiKSB7XG5cdFx0dGhpcy5zaWduYWwuYWRkRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcblx0XHRyZXR1cm4gKCkgPT4gdGhpcy5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImFib3J0XCIsIGNiKTtcblx0fVxuXHQvKipcblx0KiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgbmV2ZXIgcmVzb2x2ZXMuIFVzZWZ1bCBpZiB5b3UgaGF2ZSBhbiBhc3luYyBmdW5jdGlvblxuXHQqIHRoYXQgc2hvdWxkbid0IHJ1biBhZnRlciB0aGUgY29udGV4dCBpcyBleHBpcmVkLlxuXHQqXG5cdCogQGV4YW1wbGVcblx0KiAgIGNvbnN0IGdldFZhbHVlRnJvbVN0b3JhZ2UgPSBhc3luYyAoKSA9PiB7XG5cdCogICAgIGlmIChjdHguaXNJbnZhbGlkKSByZXR1cm4gY3R4LmJsb2NrKCk7XG5cdCpcblx0KiAgICAgLy8gLi4uXG5cdCogICB9O1xuXHQqL1xuXHRibG9jaygpIHtcblx0XHRyZXR1cm4gbmV3IFByb21pc2UoKCkgPT4ge30pO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cuc2V0SW50ZXJ2YWxgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsXG5cdCogd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIEludGVydmFscyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNsZWFySW50ZXJ2YWxgIGZ1bmN0aW9uLlxuXHQqL1xuXHRzZXRJbnRlcnZhbChoYW5kbGVyLCB0aW1lb3V0KSB7XG5cdFx0Y29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG5cdFx0fSwgdGltZW91dCk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFySW50ZXJ2YWwoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRUaW1lb3V0YCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbFxuXHQqIHdoZW4gaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBUaW1lb3V0cyBjYW4gYmUgY2xlYXJlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYHNldFRpbWVvdXRgIGZ1bmN0aW9uLlxuXHQqL1xuXHRzZXRUaW1lb3V0KGhhbmRsZXIsIHRpbWVvdXQpIHtcblx0XHRjb25zdCBpZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuXHRcdH0sIHRpbWVvdXQpO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhclRpbWVvdXQoaWQpKTtcblx0XHRyZXR1cm4gaWQ7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzXG5cdCogdGhlIHJlcXVlc3Qgd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxBbmltYXRpb25GcmFtZWBcblx0KiBmdW5jdGlvbi5cblx0Ki9cblx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKSB7XG5cdFx0Y29uc3QgaWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKC4uLmFyZ3MpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuXHRcdH0pO1xuXHRcdHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxBbmltYXRpb25GcmFtZShpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RJZGxlQ2FsbGJhY2tgIHRoYXQgYXV0b21hdGljYWxseSBjYW5jZWxzIHRoZVxuXHQqIHJlcXVlc3Qgd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIENhbGxiYWNrcyBjYW4gYmUgY2FuY2VsZWQgYnkgY2FsbGluZyB0aGUgbm9ybWFsIGBjYW5jZWxJZGxlQ2FsbGJhY2tgXG5cdCogZnVuY3Rpb24uXG5cdCovXG5cdHJlcXVlc3RJZGxlQ2FsbGJhY2soY2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0XHRjb25zdCBpZCA9IHJlcXVlc3RJZGxlQ2FsbGJhY2soKC4uLmFyZ3MpID0+IHtcblx0XHRcdGlmICghdGhpcy5zaWduYWwuYWJvcnRlZCkgY2FsbGJhY2soLi4uYXJncyk7XG5cdFx0fSwgb3B0aW9ucyk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbElkbGVDYWxsYmFjayhpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHRhZGRFdmVudExpc3RlbmVyKHRhcmdldCwgdHlwZSwgaGFuZGxlciwgb3B0aW9ucykge1xuXHRcdGlmICh0eXBlID09PSBcInd4dDpsb2NhdGlvbmNoYW5nZVwiKSB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSB0aGlzLmxvY2F0aW9uV2F0Y2hlci5ydW4oKTtcblx0XHR9XG5cdFx0dGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXI/Lih0eXBlLnN0YXJ0c1dpdGgoXCJ3eHQ6XCIpID8gZ2V0VW5pcXVlRXZlbnROYW1lKHR5cGUpIDogdHlwZSwgaGFuZGxlciwge1xuXHRcdFx0Li4ub3B0aW9ucyxcblx0XHRcdHNpZ25hbDogdGhpcy5zaWduYWxcblx0XHR9KTtcblx0fVxuXHQvKipcblx0KiBAaW50ZXJuYWxcblx0KiBBYm9ydCB0aGUgYWJvcnQgY29udHJvbGxlciBhbmQgZXhlY3V0ZSBhbGwgYG9uSW52YWxpZGF0ZWRgIGxpc3RlbmVycy5cblx0Ki9cblx0bm90aWZ5SW52YWxpZGF0ZWQoKSB7XG5cdFx0dGhpcy5hYm9ydChcIkNvbnRlbnQgc2NyaXB0IGNvbnRleHQgaW52YWxpZGF0ZWRcIik7XG5cdFx0bG9nZ2VyLmRlYnVnKGBDb250ZW50IHNjcmlwdCBcIiR7dGhpcy5jb250ZW50U2NyaXB0TmFtZX1cIiBjb250ZXh0IGludmFsaWRhdGVkYCk7XG5cdH1cblx0c3RvcE9sZFNjcmlwdHMoKSB7XG5cdFx0ZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCB7IGRldGFpbDoge1xuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9IH0pKTtcblx0XHR3aW5kb3cucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0dHlwZTogQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLFxuXHRcdFx0Y29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG5cdFx0XHRtZXNzYWdlSWQ6IHRoaXMuaWRcblx0XHR9LCBcIipcIik7XG5cdH1cblx0dmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG5cdFx0Y29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRldGFpbD8uY29udGVudFNjcmlwdE5hbWUgPT09IHRoaXMuY29udGVudFNjcmlwdE5hbWU7XG5cdFx0Y29uc3QgaXNGcm9tU2VsZiA9IGV2ZW50LmRldGFpbD8ubWVzc2FnZUlkID09PSB0aGlzLmlkO1xuXHRcdHJldHVybiBpc1NhbWVDb250ZW50U2NyaXB0ICYmICFpc0Zyb21TZWxmO1xuXHR9XG5cdGxpc3RlbkZvck5ld2VyU2NyaXB0cygpIHtcblx0XHRjb25zdCBjYiA9IChldmVudCkgPT4ge1xuXHRcdFx0aWYgKCEoZXZlbnQgaW5zdGFuY2VvZiBDdXN0b21FdmVudCkgfHwgIXRoaXMudmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSkgcmV0dXJuO1xuXHRcdFx0dGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIGNiKSk7XG5cdH1cbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTQsMTUsMTZdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQUNBLFNBQVMsb0JBQW9CLFlBQVk7QUFDeEMsU0FBTzs7OztDQ0RSLFNBQVNBLFFBQU0sUUFBUSxHQUFHLE1BQU07QUFFL0IsTUFBSSxPQUFPLEtBQUssT0FBTyxTQUFVLFFBQU8sU0FBUyxLQUFLLE9BQU8sSUFBSSxHQUFHLEtBQUs7TUFDcEUsUUFBTyxTQUFTLEdBQUcsS0FBSzs7O0NBRzlCLElBQU1DLFdBQVM7RUFDZCxRQUFRLEdBQUcsU0FBU0QsUUFBTSxRQUFRLE9BQU8sR0FBRyxLQUFLO0VBQ2pELE1BQU0sR0FBRyxTQUFTQSxRQUFNLFFBQVEsS0FBSyxHQUFHLEtBQUs7RUFDN0MsT0FBTyxHQUFHLFNBQVNBLFFBQU0sUUFBUSxNQUFNLEdBQUcsS0FBSztFQUMvQyxRQUFRLEdBQUcsU0FBU0EsUUFBTSxRQUFRLE9BQU8sR0FBRyxLQUFLO0VBQ2pEOzs7Q0NaRCxJQUFNLFVBQVUsT0FBTyxPQUFPO0NBRTlCLElBQUksYUFBYTtDQUVqQixJQUFxQixjQUFyQixjQUF5QyxJQUFJO0VBQzVDLGNBQWM7QUFDYixVQUFPO0FBRVAsUUFBSyxnQ0FBZ0IsSUFBSSxTQUFTO0FBQ2xDLFFBQUssZ0NBQWdCLElBQUksS0FBSztBQUM5QixRQUFLLDhCQUFjLElBQUksS0FBSztHQUU1QixNQUFNLENBQUMsU0FBUztBQUNoQixPQUFJLFVBQVUsUUFBUSxVQUFVLEtBQUEsRUFDL0I7QUFHRCxPQUFJLE9BQU8sTUFBTSxPQUFPLGNBQWMsV0FDckMsT0FBTSxJQUFJLFVBQVUsT0FBTyxRQUFRLGtFQUFrRTtBQUd0RyxR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