/**
 * @author Toru Nagashima <https://github.com/mysticatea>
 * @copyright 2015 Toru Nagashima. All rights reserved.
 * See LICENSE file in root directory for full license.
 */
/**
 * @typedef {object} PrivateData
 * @property {EventTarget} eventTarget The event target.
 * @property {{type:string}} event The original event object.
 * @property {number} eventPhase The current event phase.
 * @property {EventTarget|null} currentTarget The current event target.
 * @property {boolean} canceled The flag to prevent default.
 * @property {boolean} stopped The flag to stop propagation.
 * @property {boolean} immediateStopped The flag to stop propagation immediately.
 * @property {Function|null} passiveListener The listener if the current listener is passive. Otherwise this is null.
 * @property {number} timeStamp The unix time.
 * @private
 */

/**
 * Private data for event wrappers.
 * @type {WeakMap<Event, PrivateData>}
 * @private
 */
const privateData = new WeakMap();

/**
 * Cache for wrapper classes.
 * @type {WeakMap<Object, Function>}
 * @private
 */
const wrappers = new WeakMap();

/**
 * Get private data.
 * @param {Event} event The event object to get private data.
 * @returns {PrivateData} The private data of the event.
 * @private
 */
function pd(event) {
    const retv = privateData.get(event);
    console.assert(
        retv != null,
        "'this' is expected an Event object, but got",
        event
    );
    return retv
}

/**
 * https://dom.spec.whatwg.org/#set-the-canceled-flag
 * @param data {PrivateData} private data.
 */
function setCancelFlag(data) {
    if (data.passiveListener != null) {
        if (
            typeof console !== "undefined" &&
            typeof console.error === "function"
        ) {
            console.error(
                "Unable to preventDefault inside passive event listener invocation.",
                data.passiveListener
            );
        }
        return
    }
    if (!data.event.cancelable) {
        return
    }

    data.canceled = true;
    if (typeof data.event.preventDefault === "function") {
        data.event.preventDefault();
    }
}

/**
 * @see https://dom.spec.whatwg.org/#interface-event
 * @private
 */
/**
 * The event wrapper.
 * @constructor
 * @param {EventTarget} eventTarget The event target of this dispatching.
 * @param {Event|{type:string}} event The original event to wrap.
 */
function Event$1(eventTarget, event) {
    privateData.set(this, {
        eventTarget,
        event,
        eventPhase: 2,
        currentTarget: eventTarget,
        canceled: false,
        stopped: false,
        immediateStopped: false,
        passiveListener: null,
        timeStamp: event.timeStamp || Date.now(),
    });

    // https://heycam.github.io/webidl/#Unforgeable
    Object.defineProperty(this, "isTrusted", { value: false, enumerable: true });

    // Define accessors
    const keys = Object.keys(event);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        if (!(key in this)) {
            Object.defineProperty(this, key, defineRedirectDescriptor(key));
        }
    }
}

// Should be enumerable, but class methods are not enumerable.
Event$1.prototype = {
    /**
     * The type of this event.
     * @type {string}
     */
    get type() {
        return pd(this).event.type
    },

    /**
     * The target of this event.
     * @type {EventTarget}
     */
    get target() {
        return pd(this).eventTarget
    },

    /**
     * The target of this event.
     * @type {EventTarget}
     */
    get currentTarget() {
        return pd(this).currentTarget
    },

    /**
     * @returns {EventTarget[]} The composed path of this event.
     */
    composedPath() {
        const currentTarget = pd(this).currentTarget;
        if (currentTarget == null) {
            return []
        }
        return [currentTarget]
    },

    /**
     * Constant of NONE.
     * @type {number}
     */
    get NONE() {
        return 0
    },

    /**
     * Constant of CAPTURING_PHASE.
     * @type {number}
     */
    get CAPTURING_PHASE() {
        return 1
    },

    /**
     * Constant of AT_TARGET.
     * @type {number}
     */
    get AT_TARGET() {
        return 2
    },

    /**
     * Constant of BUBBLING_PHASE.
     * @type {number}
     */
    get BUBBLING_PHASE() {
        return 3
    },

    /**
     * The target of this event.
     * @type {number}
     */
    get eventPhase() {
        return pd(this).eventPhase
    },

    /**
     * Stop event bubbling.
     * @returns {void}
     */
    stopPropagation() {
        const data = pd(this);

        data.stopped = true;
        if (typeof data.event.stopPropagation === "function") {
            data.event.stopPropagation();
        }
    },

    /**
     * Stop event bubbling.
     * @returns {void}
     */
    stopImmediatePropagation() {
        const data = pd(this);

        data.stopped = true;
        data.immediateStopped = true;
        if (typeof data.event.stopImmediatePropagation === "function") {
            data.event.stopImmediatePropagation();
        }
    },

    /**
     * The flag to be bubbling.
     * @type {boolean}
     */
    get bubbles() {
        return Boolean(pd(this).event.bubbles)
    },

    /**
     * The flag to be cancelable.
     * @type {boolean}
     */
    get cancelable() {
        return Boolean(pd(this).event.cancelable)
    },

    /**
     * Cancel this event.
     * @returns {void}
     */
    preventDefault() {
        setCancelFlag(pd(this));
    },

    /**
     * The flag to indicate cancellation state.
     * @type {boolean}
     */
    get defaultPrevented() {
        return pd(this).canceled
    },

    /**
     * The flag to be composed.
     * @type {boolean}
     */
    get composed() {
        return Boolean(pd(this).event.composed)
    },

    /**
     * The unix time of this event.
     * @type {number}
     */
    get timeStamp() {
        return pd(this).timeStamp
    },

    /**
     * The target of this event.
     * @type {EventTarget}
     * @deprecated
     */
    get srcElement() {
        return pd(this).eventTarget
    },

    /**
     * The flag to stop event bubbling.
     * @type {boolean}
     * @deprecated
     */
    get cancelBubble() {
        return pd(this).stopped
    },
    set cancelBubble(value) {
        if (!value) {
            return
        }
        const data = pd(this);

        data.stopped = true;
        if (typeof data.event.cancelBubble === "boolean") {
            data.event.cancelBubble = true;
        }
    },

    /**
     * The flag to indicate cancellation state.
     * @type {boolean}
     * @deprecated
     */
    get returnValue() {
        return !pd(this).canceled
    },
    set returnValue(value) {
        if (!value) {
            setCancelFlag(pd(this));
        }
    },

    /**
     * Initialize this event object. But do nothing under event dispatching.
     * @param {string} type The event type.
     * @param {boolean} [bubbles=false] The flag to be possible to bubble up.
     * @param {boolean} [cancelable=false] The flag to be possible to cancel.
     * @deprecated
     */
    initEvent() {
        // Do nothing.
    },
};

// `constructor` is not enumerable.
Object.defineProperty(Event$1.prototype, "constructor", {
    value: Event$1,
    configurable: true,
    writable: true,
});

// Ensure `event instanceof window.Event` is `true`.
if (typeof window !== "undefined" && typeof window.Event !== "undefined") {
    Object.setPrototypeOf(Event$1.prototype, window.Event.prototype);

    // Make association for wrappers.
    wrappers.set(window.Event.prototype, Event$1);
}

/**
 * Get the property descriptor to redirect a given property.
 * @param {string} key Property name to define property descriptor.
 * @returns {PropertyDescriptor} The property descriptor to redirect the property.
 * @private
 */
function defineRedirectDescriptor(key) {
    return {
        get() {
            return pd(this).event[key]
        },
        set(value) {
            pd(this).event[key] = value;
        },
        configurable: true,
        enumerable: true,
    }
}

/**
 * Get the property descriptor to call a given method property.
 * @param {string} key Property name to define property descriptor.
 * @returns {PropertyDescriptor} The property descriptor to call the method property.
 * @private
 */
function defineCallDescriptor(key) {
    return {
        value() {
            const event = pd(this).event;
            return event[key].apply(event, arguments)
        },
        configurable: true,
        enumerable: true,
    }
}

/**
 * Define new wrapper class.
 * @param {Function} BaseEvent The base wrapper class.
 * @param {Object} proto The prototype of the original event.
 * @returns {Function} The defined wrapper class.
 * @private
 */
function defineWrapper(BaseEvent, proto) {
    const keys = Object.keys(proto);
    if (keys.length === 0) {
        return BaseEvent
    }

    /** CustomEvent */
    function CustomEvent(eventTarget, event) {
        BaseEvent.call(this, eventTarget, event);
    }

    CustomEvent.prototype = Object.create(BaseEvent.prototype, {
        constructor: { value: CustomEvent, configurable: true, writable: true },
    });

    // Define accessors.
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        if (!(key in BaseEvent.prototype)) {
            const descriptor = Object.getOwnPropertyDescriptor(proto, key);
            const isFunc = typeof descriptor.value === "function";
            Object.defineProperty(
                CustomEvent.prototype,
                key,
                isFunc
                    ? defineCallDescriptor(key)
                    : defineRedirectDescriptor(key)
            );
        }
    }

    return CustomEvent
}

/**
 * Get the wrapper class of a given prototype.
 * @param {Object} proto The prototype of the original event to get its wrapper.
 * @returns {Function} The wrapper class.
 * @private
 */
function getWrapper(proto) {
    if (proto == null || proto === Object.prototype) {
        return Event$1
    }

    let wrapper = wrappers.get(proto);
    if (wrapper == null) {
        wrapper = defineWrapper(getWrapper(Object.getPrototypeOf(proto)), proto);
        wrappers.set(proto, wrapper);
    }
    return wrapper
}

/**
 * Wrap a given event to management a dispatching.
 * @param {EventTarget} eventTarget The event target of this dispatching.
 * @param {Object} event The event to wrap.
 * @returns {Event} The wrapper instance.
 * @private
 */
function wrapEvent(eventTarget, event) {
    const Wrapper = getWrapper(Object.getPrototypeOf(event));
    return new Wrapper(eventTarget, event)
}

/**
 * Get the immediateStopped flag of a given event.
 * @param {Event} event The event to get.
 * @returns {boolean} The flag to stop propagation immediately.
 * @private
 */
function isStopped(event) {
    return pd(event).immediateStopped
}

/**
 * Set the current event phase of a given event.
 * @param {Event} event The event to set current target.
 * @param {number} eventPhase New event phase.
 * @returns {void}
 * @private
 */
function setEventPhase(event, eventPhase) {
    pd(event).eventPhase = eventPhase;
}

/**
 * Set the current target of a given event.
 * @param {Event} event The event to set current target.
 * @param {EventTarget|null} currentTarget New current target.
 * @returns {void}
 * @private
 */
function setCurrentTarget(event, currentTarget) {
    pd(event).currentTarget = currentTarget;
}

/**
 * Set a passive listener of a given event.
 * @param {Event} event The event to set current target.
 * @param {Function|null} passiveListener New passive listener.
 * @returns {void}
 * @private
 */
function setPassiveListener(event, passiveListener) {
    pd(event).passiveListener = passiveListener;
}

/**
 * @typedef {object} ListenerNode
 * @property {Function} listener
 * @property {1|2|3} listenerType
 * @property {boolean} passive
 * @property {boolean} once
 * @property {ListenerNode|null} next
 * @private
 */

/**
 * @type {WeakMap<object, Map<string, ListenerNode>>}
 * @private
 */
const listenersMap = new WeakMap();

// Listener types
const CAPTURE = 1;
const BUBBLE = 2;
const ATTRIBUTE = 3;

/**
 * Check whether a given value is an object or not.
 * @param {any} x The value to check.
 * @returns {boolean} `true` if the value is an object.
 */
function isObject(x) {
    return x !== null && typeof x === "object" //eslint-disable-line no-restricted-syntax
}

/**
 * Get listeners.
 * @param {EventTarget} eventTarget The event target to get.
 * @returns {Map<string, ListenerNode>} The listeners.
 * @private
 */
function getListeners(eventTarget) {
    const listeners = listenersMap.get(eventTarget);
    if (listeners == null) {
        throw new TypeError(
            "'this' is expected an EventTarget object, but got another value."
        )
    }
    return listeners
}

/**
 * Get the property descriptor for the event attribute of a given event.
 * @param {string} eventName The event name to get property descriptor.
 * @returns {PropertyDescriptor} The property descriptor.
 * @private
 */
function defineEventAttributeDescriptor(eventName) {
    return {
        get() {
            const listeners = getListeners(this);
            let node = listeners.get(eventName);
            while (node != null) {
                if (node.listenerType === ATTRIBUTE) {
                    return node.listener
                }
                node = node.next;
            }
            return null
        },

        set(listener) {
            if (typeof listener !== "function" && !isObject(listener)) {
                listener = null; // eslint-disable-line no-param-reassign
            }
            const listeners = getListeners(this);

            // Traverse to the tail while removing old value.
            let prev = null;
            let node = listeners.get(eventName);
            while (node != null) {
                if (node.listenerType === ATTRIBUTE) {
                    // Remove old value.
                    if (prev !== null) {
                        prev.next = node.next;
                    } else if (node.next !== null) {
                        listeners.set(eventName, node.next);
                    } else {
                        listeners.delete(eventName);
                    }
                } else {
                    prev = node;
                }

                node = node.next;
            }

            // Add new value.
            if (listener !== null) {
                const newNode = {
                    listener,
                    listenerType: ATTRIBUTE,
                    passive: false,
                    once: false,
                    next: null,
                };
                if (prev === null) {
                    listeners.set(eventName, newNode);
                } else {
                    prev.next = newNode;
                }
            }
        },
        configurable: true,
        enumerable: true,
    }
}

/**
 * Define an event attribute (e.g. `eventTarget.onclick`).
 * @param {Object} eventTargetPrototype The event target prototype to define an event attrbite.
 * @param {string} eventName The event name to define.
 * @returns {void}
 */
function defineEventAttribute(eventTargetPrototype, eventName) {
    Object.defineProperty(
        eventTargetPrototype,
        `on${eventName}`,
        defineEventAttributeDescriptor(eventName)
    );
}

/**
 * Define a custom EventTarget with event attributes.
 * @param {string[]} eventNames Event names for event attributes.
 * @returns {EventTarget} The custom EventTarget.
 * @private
 */
function defineCustomEventTarget(eventNames) {
    /** CustomEventTarget */
    function CustomEventTarget() {
        EventTarget.call(this);
    }

    CustomEventTarget.prototype = Object.create(EventTarget.prototype, {
        constructor: {
            value: CustomEventTarget,
            configurable: true,
            writable: true,
        },
    });

    for (let i = 0; i < eventNames.length; ++i) {
        defineEventAttribute(CustomEventTarget.prototype, eventNames[i]);
    }

    return CustomEventTarget
}

/**
 * EventTarget.
 *
 * - This is constructor if no arguments.
 * - This is a function which returns a CustomEventTarget constructor if there are arguments.
 *
 * For example:
 *
 *     class A extends EventTarget {}
 *     class B extends EventTarget("message") {}
 *     class C extends EventTarget("message", "error") {}
 *     class D extends EventTarget(["message", "error"]) {}
 */
function EventTarget() {
    /*eslint-disable consistent-return */
    if (this instanceof EventTarget) {
        listenersMap.set(this, new Map());
        return
    }
    if (arguments.length === 1 && Array.isArray(arguments[0])) {
        return defineCustomEventTarget(arguments[0])
    }
    if (arguments.length > 0) {
        const types = new Array(arguments.length);
        for (let i = 0; i < arguments.length; ++i) {
            types[i] = arguments[i];
        }
        return defineCustomEventTarget(types)
    }
    throw new TypeError("Cannot call a class as a function")
    /*eslint-enable consistent-return */
}

// Should be enumerable, but class methods are not enumerable.
EventTarget.prototype = {
    /**
     * Add a given listener to this event target.
     * @param {string} eventName The event name to add.
     * @param {Function} listener The listener to add.
     * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
     * @returns {void}
     */
    addEventListener(eventName, listener, options) {
        if (listener == null) {
            return
        }
        if (typeof listener !== "function" && !isObject(listener)) {
            throw new TypeError("'listener' should be a function or an object.")
        }

        const listeners = getListeners(this);
        const optionsIsObj = isObject(options);
        const capture = optionsIsObj
            ? Boolean(options.capture)
            : Boolean(options);
        const listenerType = capture ? CAPTURE : BUBBLE;
        const newNode = {
            listener,
            listenerType,
            passive: optionsIsObj && Boolean(options.passive),
            once: optionsIsObj && Boolean(options.once),
            next: null,
        };

        // Set it as the first node if the first node is null.
        let node = listeners.get(eventName);
        if (node === undefined) {
            listeners.set(eventName, newNode);
            return
        }

        // Traverse to the tail while checking duplication..
        let prev = null;
        while (node != null) {
            if (
                node.listener === listener &&
                node.listenerType === listenerType
            ) {
                // Should ignore duplication.
                return
            }
            prev = node;
            node = node.next;
        }

        // Add it.
        prev.next = newNode;
    },

    /**
     * Remove a given listener from this event target.
     * @param {string} eventName The event name to remove.
     * @param {Function} listener The listener to remove.
     * @param {boolean|{capture?:boolean,passive?:boolean,once?:boolean}} [options] The options for this listener.
     * @returns {void}
     */
    removeEventListener(eventName, listener, options) {
        if (listener == null) {
            return
        }

        const listeners = getListeners(this);
        const capture = isObject(options)
            ? Boolean(options.capture)
            : Boolean(options);
        const listenerType = capture ? CAPTURE : BUBBLE;

        let prev = null;
        let node = listeners.get(eventName);
        while (node != null) {
            if (
                node.listener === listener &&
                node.listenerType === listenerType
            ) {
                if (prev !== null) {
                    prev.next = node.next;
                } else if (node.next !== null) {
                    listeners.set(eventName, node.next);
                } else {
                    listeners.delete(eventName);
                }
                return
            }

            prev = node;
            node = node.next;
        }
    },

    /**
     * Dispatch a given event.
     * @param {Event|{type:string}} event The event to dispatch.
     * @returns {boolean} `false` if canceled.
     */
    dispatchEvent(event) {
        if (event == null || typeof event.type !== "string") {
            throw new TypeError('"event.type" should be a string.')
        }

        // If listeners aren't registered, terminate.
        const listeners = getListeners(this);
        const eventName = event.type;
        let node = listeners.get(eventName);
        if (node == null) {
            return true
        }

        // Since we cannot rewrite several properties, so wrap object.
        const wrappedEvent = wrapEvent(this, event);

        // This doesn't process capturing phase and bubbling phase.
        // This isn't participating in a tree.
        let prev = null;
        while (node != null) {
            // Remove this listener if it's once
            if (node.once) {
                if (prev !== null) {
                    prev.next = node.next;
                } else if (node.next !== null) {
                    listeners.set(eventName, node.next);
                } else {
                    listeners.delete(eventName);
                }
            } else {
                prev = node;
            }

            // Call this listener
            setPassiveListener(
                wrappedEvent,
                node.passive ? node.listener : null
            );
            if (typeof node.listener === "function") {
                try {
                    node.listener.call(this, wrappedEvent);
                } catch (err) {
                    if (
                        typeof console !== "undefined" &&
                        typeof console.error === "function"
                    ) {
                        console.error(err);
                    }
                }
            } else if (
                node.listenerType !== ATTRIBUTE &&
                typeof node.listener.handleEvent === "function"
            ) {
                node.listener.handleEvent(wrappedEvent);
            }

            // Break if `event.stopImmediatePropagation` was called.
            if (isStopped(wrappedEvent)) {
                break
            }

            node = node.next;
        }
        setPassiveListener(wrappedEvent, null);
        setEventPhase(wrappedEvent, 0);
        setCurrentTarget(wrappedEvent, null);

        return !wrappedEvent.defaultPrevented
    },
};

// `constructor` is not enumerable.
Object.defineProperty(EventTarget.prototype, "constructor", {
    value: EventTarget,
    configurable: true,
    writable: true,
});

// Ensure `eventTarget instanceof window.EventTarget` is `true`.
if (
    typeof window !== "undefined" &&
    typeof window.EventTarget !== "undefined"
) {
    Object.setPrototypeOf(EventTarget.prototype, window.EventTarget.prototype);
}

var PostMessageType;
(function (PostMessageType) {
    PostMessageType["INIT_WORKER"] = "INIT_WORKER";
    PostMessageType["DATA_AVAILABLE"] = "DATA_AVAILABLE";
    PostMessageType["START_RECORDING"] = "START_RECORDING";
    PostMessageType["STOP_RECORDING"] = "STOP_RECORDING";
    PostMessageType["ERROR"] = "ERROR";
    PostMessageType["BLOB_READY"] = "BLOB_READY";
    PostMessageType["WORKER_RECORDING"] = "WORKER_RECORDING";
    PostMessageType["WORKER_READY"] = "WORKER_READY";
})(PostMessageType || (PostMessageType = {}));
const initMessage = (wasmURL) => ({
    type: PostMessageType.INIT_WORKER,
    wasmURL
});
const startRecordingMessage = (config) => ({
    type: PostMessageType.START_RECORDING,
    config
});
const dataAvailableMessage = (data) => ({
    type: PostMessageType.DATA_AVAILABLE,
    data
});
const stopRecordingMessage = () => ({
    type: PostMessageType.STOP_RECORDING
});

const mp3EncoderWorker = () => {
    // from vmsg
    // Must be in sync with emcc settings!
    const TOTAL_STACK = 5 * 1024 * 1024;
    const TOTAL_MEMORY = 128 * 1024 * 1024;
    const WASM_PAGE_SIZE = 64 * 1024;
    const ctx = self;
    const memory = new WebAssembly.Memory({
        initial: TOTAL_MEMORY / WASM_PAGE_SIZE,
        maximum: TOTAL_MEMORY / WASM_PAGE_SIZE
    });
    let dynamicTop = TOTAL_STACK;
    let vmsg;
    let isRecording = false;
    let vmsgRef;
    let pcmLeft;
    const getWasmModuleFallback = (url, imports) => {
        return fetch(url)
            .then(response => response.arrayBuffer())
            .then(buffer => WebAssembly.instantiate(buffer, imports));
    };
    const getWasmModule = (url, imports) => {
        if (!WebAssembly.instantiateStreaming) {
            return getWasmModuleFallback(url, imports);
        }
        return WebAssembly
            .instantiateStreaming(fetch(url), imports)
            .catch(() => getWasmModuleFallback(url, imports));
    };
    const getVmsgImports = () => {
        const onExit = (err) => {
            ctx.postMessage({ type: 'ERROR', error: 'internal' });
        };
        const sbrk = (increment) => {
            const oldDynamicTop = dynamicTop;
            dynamicTop += increment;
            return oldDynamicTop;
        };
        const env = {
            memory,
            sbrk,
            exit: onExit,
            pow: Math.pow,
            powf: Math.pow,
            exp: Math.exp,
            sqrtf: Math.sqrt,
            cos: Math.cos,
            log: Math.log,
            sin: Math.sin
        };
        return { env };
    };
    const onStartRecording = (config) => {
        isRecording = true;
        vmsgRef = vmsg.vmsg_init(config.sampleRate);
        if (!vmsgRef || !vmsg) {
            throw new Error('init_failed');
        }
        const pcmLeftRef = new Uint32Array(memory.buffer, vmsgRef, 1)[0];
        pcmLeft = new Float32Array(memory.buffer, pcmLeftRef);
    };
    const onStopRecording = () => {
        isRecording = false;
        if (vmsg.vmsg_flush(vmsgRef) < 0) {
            throw new Error('flush_failed');
        }
        const mp3BytesRef = new Uint32Array(memory.buffer, vmsgRef + 4, 1)[0];
        const size = new Uint32Array(memory.buffer, vmsgRef + 8, 1)[0];
        const mp3Bytes = new Uint8Array(memory.buffer, mp3BytesRef, size);
        const blob = new Blob([mp3Bytes], { type: 'audio/mpeg' });
        vmsg.vmsg_free(vmsgRef);
        return blob;
    };
    const onDataReceived = (data) => {
        if (!isRecording) {
            return;
        }
        pcmLeft.set(data);
        const encodedBytesAmount = vmsg.vmsg_encode(vmsgRef, data.length);
        if (encodedBytesAmount < 0) {
            throw new Error('encoding_failed');
        }
    };
    ctx.onmessage = event => {
        const message = event.data;
        try {
            switch (message.type) {
                case 'INIT_WORKER': {
                    const imports = getVmsgImports();
                    getWasmModule(message.wasmURL, imports)
                        .then(wasm => {
                        vmsg = wasm.instance.exports;
                        ctx.postMessage({ type: 'WORKER_READY' });
                    })
                        .catch(err => {
                        ctx.postMessage({ type: 'ERROR', error: err.message });
                    });
                    break;
                }
                case 'START_RECORDING': {
                    onStartRecording(message.config);
                    ctx.postMessage({ type: 'WORKER_RECORDING' });
                    break;
                }
                case 'DATA_AVAILABLE': {
                    onDataReceived(message.data);
                    break;
                }
                case 'STOP_RECORDING': {
                    const blob = onStopRecording();
                    ctx.postMessage({ type: 'BLOB_READY', blob });
                    break;
                }
            }
        }
        catch (err) {
            ctx.postMessage({ type: 'ERROR', error: err.message });
        }
    };
};

const MP3_MIME_TYPE = 'audio/mpeg';
const SafeAudioContext = window.AudioContext || window.webkitAudioContext;
const createGain = (ctx) => (ctx.createGain || ctx.createGainNode).call(ctx);
const createScriptProcessor = (ctx) => (ctx.createScriptProcessor || ctx.createJavaScriptNode).call(ctx, 4096, 1, 1);
const getMp3MediaRecorder = (config) => {
    const workerBlob = new Blob([`(${mp3EncoderWorker.toString()})()`], {
        type: 'application/javascript'
    });
    const worker = new Worker(URL.createObjectURL(workerBlob));
    class Mp3MediaRecorder extends EventTarget {
        constructor(stream, { audioContext } = {}) {
            super();
            this.mimeType = MP3_MIME_TYPE;
            this.state = 'inactive';
            this.audioBitsPerSecond = 0;
            this.videoBitsPerSecond = 0;
            this.onWorkerMessage = (event) => {
                const message = event.data;
                switch (message.type) {
                    case PostMessageType.WORKER_RECORDING: {
                        const event = new Event('start');
                        this.dispatchEvent(event);
                        this.state = 'recording';
                        break;
                    }
                    case PostMessageType.ERROR: {
                        const error = new Error(message.error);
                        const fallbackEvent = new Event('error');
                        fallbackEvent.error = error;
                        const event = window.MediaRecorderErrorEvent
                            ? new MediaRecorderErrorEvent('error', { error })
                            : fallbackEvent;
                        this.dispatchEvent(event);
                        this.state = 'inactive';
                        break;
                    }
                    case PostMessageType.BLOB_READY: {
                        const stopEvent = new Event('stop');
                        const fallbackDataEvent = new Event('dataavailable');
                        fallbackDataEvent.data = message.blob;
                        fallbackDataEvent.timecode = Date.now();
                        const dataEvent = window.BlobEvent
                            ? new BlobEvent('dataavailable', {
                                data: message.blob,
                                timecode: Date.now()
                            })
                            : fallbackDataEvent;
                        this.dispatchEvent(dataEvent);
                        this.dispatchEvent(stopEvent);
                        this.state = 'inactive';
                        break;
                    }
                }
            };
            this.stream = stream;
            this.audioContext = audioContext || new SafeAudioContext();
            this.sourceNode = this.audioContext.createMediaStreamSource(stream);
            this.gainNode = createGain(this.audioContext);
            this.gainNode.gain.value = 1;
            this.processorNode = createScriptProcessor(this.audioContext);
            this.sourceNode.connect(this.gainNode);
            this.gainNode.connect(this.processorNode);
            worker.onmessage = this.onWorkerMessage;
        }
        start() {
            if (this.state !== 'inactive') {
                throw this.getStateError('start');
            }
            this.processorNode.onaudioprocess = event => {
                worker.postMessage(dataAvailableMessage(event.inputBuffer.getChannelData(0)));
            };
            this.processorNode.connect(this.audioContext.destination);
            this.audioContext.resume();
            worker.postMessage(startRecordingMessage({ sampleRate: this.audioContext.sampleRate }));
        }
        stop() {
            if (this.state !== 'recording') {
                throw this.getStateError('stop');
            }
            this.processorNode.disconnect();
            this.audioContext.suspend();
            worker.postMessage(stopRecordingMessage());
        }
        pause() {
            if (this.state !== 'recording') {
                throw this.getStateError('pause');
            }
            this.audioContext.suspend();
            this.state = 'paused';
            this.dispatchEvent(new Event('pause'));
        }
        resume() {
            if (this.state !== 'paused') {
                throw this.getStateError('resume');
            }
            this.audioContext.resume();
            this.state = 'recording';
            this.dispatchEvent(new Event('resume'));
        }
        requestData() {
            // not implemented, dataavailable event only fires when encoding is finished
        }
        getStateError(method) {
            return new Error(`Uncaught DOMException: Failed to execute '${method}' on 'MediaRecorder': The MediaRecorder's state is '${this.state}'.`);
        }
        getAudioContext() {
            return this.audioContext;
        }
        getSourceNode() {
            return this.sourceNode;
        }
    }
    Mp3MediaRecorder.isTypeSupported = (mimeType) => mimeType === MP3_MIME_TYPE;
    defineEventAttribute(Mp3MediaRecorder.prototype, 'start');
    defineEventAttribute(Mp3MediaRecorder.prototype, 'stop');
    defineEventAttribute(Mp3MediaRecorder.prototype, 'pause');
    defineEventAttribute(Mp3MediaRecorder.prototype, 'resume');
    defineEventAttribute(Mp3MediaRecorder.prototype, 'dataavailable');
    defineEventAttribute(Mp3MediaRecorder.prototype, 'error');
    return new Promise((resolve, reject) => {
        const wasmURL = new URL(config.wasmURL, window.location.origin).href;
        worker.postMessage(initMessage(wasmURL));
        worker.onmessage = ({ data }) => {
            if (data.type === PostMessageType.WORKER_READY) {
                resolve(Mp3MediaRecorder);
            }
            else {
                const errorMessage = data.type === PostMessageType.ERROR ? data.error : 'Unknown error occurred ';
                reject(errorMessage);
            }
        };
    });
};

export { getMp3MediaRecorder };
//# sourceMappingURL=mp3-mediarecorder.es2015.js.map
