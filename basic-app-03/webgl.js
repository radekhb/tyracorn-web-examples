"use strict";
// -------------------------------------
// Global variables
// -------------------------------------
let gl;
let tyracornApp;
let drivers;
let appLoadingFutures;  // List<Future<?>>
let time = 0.0;
let baseUrl = ".";

// -------------------------------------
// Guard
// -------------------------------------

class Arrays {
    static copyOf(original, newLength) {
        let res = [];
        for (let i = 0; i < newLength; ++i) {
            res.push(original[i]);
        }
        return res;
    }
}
// -------------------------------------
// Guard
// -------------------------------------

class Guard {
    static beTrue() {
    }

    static beFalse() {
    }

    static beNull() {
    }

    static notNull() {
    }

    static equals() {
    }

    static positive() {
    }

    static notNegative() {
    }

    static notEmpty() {
    }

    static notNullCollection() {
    }

}
// -------------------------------------
// Float
// -------------------------------------

class Float {
    static POSITIVE_NIFINITY = Number.POSITIVE_INFINITY;
    static NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;

    static isInfinite(a) {
        return !Number.isFinite(a);
    }
}
// -------------------------------------
// String extensions
// -------------------------------------

String.prototype.startsWith = function (str) {
    return this.indexOf(str, 0) === 0;
};
String.prototype.contains = function (str) {
    return this.includes(str);
};
String.prototype.equals = function (that) {
    return this === that;
};
String.prototype.hashCode = function () {
    let hash = 0;

    // Return 0 for empty strings
    if (this.length === 0) {
        return hash;
    }

    // Calculate hash using polynomial rolling hash
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        // Convert to 32-bit integer to prevent overflow
        hash = hash & hash;
    }

    return hash;
};
// -------------------------------------
// ArrayList
// -------------------------------------

class ArrayList {
    constructor() {
        // Make _data non-enumerable so it doesn't appear in for...in loops
        Object.defineProperty(this, '_data', {
            value: [],
            writable: true,
            enumerable: false,
            configurable: true
        });
        this._updateLength();
    }

    // Update the length property and numeric indices
    _updateLength() {
        // Remove old numeric properties
        for (let i = this.length || 0; i < this._data.length + 10; i++) {
            delete this[i];
        }

        // Set length
        Object.defineProperty(this, 'length', {
            value: this._data.length,
            writable: false,
            enumerable: false,
            configurable: true
        });

        // Create enumerable numeric properties for for...in iteration
        for (let i = 0; i < this._data.length; i++) {
            Object.defineProperty(this, i, {
                get: () => this._data[i],
                set: (value) => {
                    this._data[i] = value;
                },
                enumerable: true,
                configurable: true
            });
        }
    }

    // Add element to the end
    add(element) {
        this._data.push(element);
        this._updateLength();
        return this;
    }

    // Insert element at specific index
    insert(index, element) {
        if (index < 0 || index > this._data.length) {
            throw new Error('Index out of bounds');
        }
        this._data.splice(index, 0, element);
        this._updateLength();
        return this;
    }

    // Remove element at index
    removeAt(index) {
        if (index < 0 || index >= this._data.length) {
            throw new Error('Index out of bounds');
        }
        const removed = this._data.splice(index, 1)[0];
        this._updateLength();
        return removed;
    }

    // Remove first occurrence of element
    remove(element) {
        const index = this._data.indexOf(element);
        if (index !== -1) {
            return this.removeAt(index);
        }
        return undefined;
    }

    // Get element at index
    get(index) {
        if (index < 0 || index >= this._data.length) {
            return undefined;
        }
        return this._data[index];
    }

    // Set element at index
    set(index, element) {
        if (index < 0 || index >= this._data.length) {
            throw new Error('Index out of bounds');
        }
        this._data[index] = element;
        return this;
    }

    // Check if list contains element
    contains(element) {
        return this._data.includes(element);
    }

    // Find index of element
    indexOf(element) {
        return this._data.indexOf(element);
    }

    // Clear all elements
    clear() {
        this._data = [];
        this._updateLength();
        return this;
    }

    // returns size of this list
    size() {
        return this._data.length;
    }

    // Check if list is empty
    isEmpty() {
        return this._data.length === 0;
    }

    // Convert to regular array
    toArray() {
        return [...this._data];
    }

    // Make it iterable for for...of loops
    * [Symbol.iterator] () {
        for (let i = 0; i < this._data.length; i++) {
            yield this._data[i];
        }
    }
    equals(other) {
        // Check if other is an ArrayList or array-like object
        if (!other || !(other instanceof ArrayList)) {
            return false;
        }

        // Check if lengths are equal
        const otherLength = other.length || (other._data ? other._data.length : 0);
        if (this._data.length !== otherLength) {
            return false;
        }

        // Compare each element using their equals method
        for (let i = 0; i < this._data.length; i++) {
            const thisElement = this._data[i];
            const otherElement = other._data ? other._data[i] : other[i];

            // Handle null/undefined elements
            if (thisElement === null && otherElement === null)
                continue;
            if (thisElement === undefined && otherElement === undefined)
                continue;
            if (thisElement === null || thisElement === undefined ||
                    otherElement === null || otherElement === undefined) {
                return false;
            }

            // Use equals method if available, otherwise use strict equality
            if (typeof thisElement.equals === 'function') {
                if (!thisElement.equals(otherElement)) {
                    return false;
                }
            } else {
                if (thisElement !== otherElement) {
                    return false;
                }
            }
        }

        return true;
    }

    // Generate hash code for the ArrayList
    hashCode() {
        let hash = 1;
        const prime = 31;

        for (let i = 0; i < this._data.length; i++) {
            const element = this._data[i];
            let elementHash = 0;

            if (element === null) {
                elementHash = 0;
            } else if (element === undefined) {
                elementHash = 0;
            } else if (typeof element.hashCode === 'function') {
                elementHash = element.hashCode();
            } else if (typeof element === 'string') {
                // Simple string hash function
                for (let j = 0; j < element.length; j++) {
                    elementHash = ((elementHash << 5) - elementHash + element.charCodeAt(j)) & 0xffffffff;
                }
            } else if (typeof element === 'number') {
                elementHash = element | 0; // Convert to 32-bit integer
            } else if (typeof element === 'boolean') {
                elementHash = element ? 1 : 0;
            } else {
                // For other objects, use a simple hash based on string representation
                const str = element.toString();
                for (let j = 0; j < str.length; j++) {
                    elementHash = ((elementHash << 5) - elementHash + str.charCodeAt(j)) & 0xffffffff;
                }
            }

            hash = (hash * prime + elementHash) & 0xffffffff;
        }

        return hash;
    }

    // String representation
    toString() {
        return `[${this._data.join(', ')}]`;
    }
}
// -------------------------------------
// HashSet
// -------------------------------------

class HashSet {
    constructor(initialCapacity = 16, loadFactor = 0.75) {
        this.capacity = initialCapacity;
        this.loadFactor = loadFactor;
        this.size = 0;
        this.buckets = new Array(this.capacity).fill(null).map(() => []);
    }

    // Hash function using object's hashCode method
    hash(element) {
        if (element === null || element === undefined) {
            return 0;
        }
        
        // Use the object's hashCode method if available
        if (typeof element.hashCode === 'function') {
            return Math.abs(element.hashCode()) % this.capacity;
        }
        
        // Fallback for primitive types
        let hash = 0;
        const str = String(element);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0x7FFFFFFF;
        }
        return hash % this.capacity;
    }

    // Check if two elements are equal using object's equals method
    elementsEqual(element1, element2) {
        if (element1 === element2) {
            return true;
        }
        
        if (element1 === null || element1 === undefined || element2 === null || element2 === undefined) {
            return false;
        }
        
        // Use the object's equals method if available
        if (typeof element1.equals === 'function') {
            return element1.equals(element2);
        }
        
        // Fallback to strict equality for primitives
        return element1 === element2;
    }

    // Add element to the set
    add(element) {
        const index = this.hash(element);
        const bucket = this.buckets[index];

        // Check if element already exists
        for (let i = 0; i < bucket.length; i++) {
            if (this.elementsEqual(bucket[i], element)) {
                return false; // Element already exists
            }
        }

        // Add new element
        bucket.push(element);
        this.size++;

        // Resize if load factor exceeded
        if (this.size > this.capacity * this.loadFactor) {
            this.resize();
        }

        return true; // Element was added
    }

    // Check if element exists in the set
    contains(element) {
        const index = this.hash(element);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (this.elementsEqual(bucket[i], element)) {
                return true;
            }
        }
        return false;
    }

    // Remove element from the set
    remove(element) {
        const index = this.hash(element);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (this.elementsEqual(bucket[i], element)) {
                bucket.splice(i, 1);
                this.size--;
                return true; // Element was removed
            }
        }
        return false; // Element was not found
    }

    // Check if set is empty
    isEmpty() {
        return this.size === 0;
    }

    // Get current size
    getSize() {
        return this.size;
    }

    // Clear all elements
    clear() {
        this.buckets = new Array(this.capacity).fill(null).map(() => []);
        this.size = 0;
    }

    // Get all elements as an array
    toArray() {
        const elements = [];
        for (const bucket of this.buckets) {
            for (const element of bucket) {
                elements.push(element);
            }
        }
        return elements;
    }

    // Iterator support - returns all elements
    [Symbol.iterator]() {
        const elements = this.toArray();
        let index = 0;
        return {
            next() {
                if (index < elements.length) {
                    return { value: elements[index++], done: false };
                } else {
                    return { done: true };
                }
            }
        };
    }

    // Add all elements from another collection
    addAll(collection) {
        let modified = false;
        if (Array.isArray(collection)) {
            for (const element of collection) {
                if (this.add(element)) {
                    modified = true;
                }
            }
        } else if (collection && typeof collection[Symbol.iterator] === 'function') {
            for (const element of collection) {
                if (this.add(element)) {
                    modified = true;
                }
            }
        }
        return modified;
    }

    // Remove all elements that exist in another collection
    removeAll(collection) {
        let modified = false;
        if (Array.isArray(collection)) {
            for (const element of collection) {
                if (this.remove(element)) {
                    modified = true;
                }
            }
        } else if (collection && typeof collection[Symbol.iterator] === 'function') {
            for (const element of collection) {
                if (this.remove(element)) {
                    modified = true;
                }
            }
        }
        return modified;
    }

    // Retain only elements that exist in another collection
    retainAll(collection) {
        const toRetain = new HashSet();
        
        // Add all elements from collection to toRetain set
        if (Array.isArray(collection)) {
            for (const element of collection) {
                toRetain.add(element);
            }
        } else if (collection && typeof collection[Symbol.iterator] === 'function') {
            for (const element of collection) {
                toRetain.add(element);
            }
        }

        // Remove elements not in toRetain
        let modified = false;
        const currentElements = this.toArray();
        for (const element of currentElements) {
            if (!toRetain.contains(element)) {
                this.remove(element);
                modified = true;
            }
        }
        
        return modified;
    }

    // Check if this set contains all elements from another collection
    containsAll(collection) {
        if (Array.isArray(collection)) {
            for (const element of collection) {
                if (!this.contains(element)) {
                    return false;
                }
            }
        } else if (collection && typeof collection[Symbol.iterator] === 'function') {
            for (const element of collection) {
                if (!this.contains(element)) {
                    return false;
                }
            }
        }
        return true;
    }

    // Resize the hash table when load factor is exceeded
    resize() {
        const oldBuckets = this.buckets;
        this.capacity *= 2;
        this.size = 0;
        this.buckets = new Array(this.capacity).fill(null).map(() => []);

        // Rehash all existing elements
        for (const bucket of oldBuckets) {
            for (const element of bucket) {
                this.add(element);
            }
        }
    }

    // String representation
    toString() {
        const elements = this.toArray();
        return `[${elements.join(', ')}]`;
    }

    // Override hashCode for HashSet
    hashCode() {
        let hash = 0;
        for (const bucket of this.buckets) {
            for (const element of bucket) {
                // Add hash codes of all elements (order independent)
                if (element !== null && element !== undefined) {
                    const elementHash = typeof element.hashCode === 'function' ? 
                        element.hashCode() : this.primitiveHashCode(element);
                    hash += elementHash;
                }
            }
        }
        return hash;
    }

    // Helper method to generate hash code for primitives
    primitiveHashCode(obj) {
        if (typeof obj === 'number') {
            return Math.floor(obj) ^ (Math.floor(obj) >>> 16);
        }
        if (typeof obj === 'boolean') {
            return obj ? 1231 : 1237;
        }
        
        let hash = 0;
        const str = String(obj);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0x7FFFFFFF;
        }
        return hash;
    }
    equals(other) {
        if (this === other) {
            return true;
        }
        
        if (!(other instanceof HashSet)) {
            return false;
        }
        
        if (this.size !== other.size) {
            return false;
        }
        
        // Check if all elements in this set exist in other set
        for (const bucket of this.buckets) {
            for (const element of bucket) {
                if (!other.contains(element)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // Create a shallow copy
    clone() {
        const newSet = new HashSet(this.capacity, this.loadFactor);
        newSet.addAll(this);
        return newSet;
    }
}
// -------------------------------------
// HashMap
// -------------------------------------

class HashMap {
    constructor(initialCapacity = 16, loadFactor = 0.75) {
        this.capacity = initialCapacity;
        this.loadFactor = loadFactor;
        this.size = 0;
        this.buckets = new Array(this.capacity).fill(null).map(() => []);
    }

    // Hash function using object's hashCode method
    hash(key) {
        if (key === null || key === undefined) {
            return 0;
        }

        // Use the object's hashCode method if available
        if (typeof key.hashCode === 'function') {
            return Math.abs(key.hashCode()) % this.capacity;
        }

        // Fallback for primitive types
        let hash = 0;
        const str = String(key);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0x7FFFFFFF;
        }
        return hash % this.capacity;
    }

    // Check if two keys are equal using object's equals method
    keysEqual(key1, key2) {
        if (key1 === key2) {
            return true;
        }

        if (key1 === null || key1 === undefined || key2 === null || key2 === undefined) {
            return false;
        }

        // Use the object's equals method if available
        if (typeof key1.equals === 'function') {
            return key1.equals(key2);
        }

        // Fallback to strict equality for primitives
        return key1 === key2;
    }
    put(key, value) {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        // Check if key already exists
        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                const oldValue = bucket[i][1];
                bucket[i][1] = value;
                return oldValue;
            }
        }

        // Add new key-value pair
        bucket.push([key, value]);
        this.size++;

        // Resize if load factor exceeded
        if (this.size > this.capacity * this.loadFactor) {
            this.resize();
        }

        return null;
    }

    putAll(map) {
        for (const bucket of map.buckets) {
            for (const [key, value] of bucket) {
                if (key === undefined) {
                    continue;
                }
                this.put(key, value);
            }
        }
        return null;
    }

    // Get value by key
    get(key) {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (this.keysEqual(bucket[i][0], key)) {
                return bucket[i][1];
            }
        }
        return null;
    }

    // Remove key-value pair
    remove(key) {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (this.keysEqual(bucket[i][0], key)) {
                const removedValue = bucket[i][1];
                bucket.splice(i, 1);
                this.size--;
                return removedValue;
            }
        }
        return null;
    }

    // Check if key exists
    containsKey(key) {
        return this.get(key) !== null;
    }

    // Check if two values are equal using object's equals method
    valuesEqual(value1, value2) {
        if (value1 === value2) {
            return true;
        }

        if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
            return false;
        }

        // Use the object's equals method if available
        if (typeof value1.equals === 'function') {
            return value1.equals(value2);
        }

        // Fallback to strict equality for primitives
        return value1 === value2;
    }

    // Check if value exists
    containsValue(value) {
        for (const bucket of this.buckets) {
            for (const [k, v] of bucket) {
                if (this.valuesEqual(v, value)) {
                    return true;
                }
            }
        }
        return false;
    }

    // Check if map is empty
    isEmpty() {
        return this.size === 0;
    }

    // Get all keys
    keySet() {
        const keys = [];
        for (const bucket of this.buckets) {
            for (const [key, value] of bucket) {
                keys.push(key);
            }
        }
        return keys;
    }

    // Get all values
    values() {
        const vals = [];
        for (const bucket of this.buckets) {
            for (const [key, value] of bucket) {
                vals.push(value);
            }
        }
        return vals;
    }

    // Get all key-value pairs
    entrySet() {
        const entries = [];
        for (const bucket of this.buckets) {
            for (const [key, value] of bucket) {
                entries.push({key, value});
            }
        }
        return entries;
    }

    // Clear all entries
    clear() {
        this.buckets = new Array(this.capacity).fill(null).map(() => []);
        this.size = 0;
    }

    // Resize the hash table when load factor is exceeded
    resize() {
        const oldBuckets = this.buckets;
        this.capacity *= 2;
        this.size = 0;
        this.buckets = new Array(this.capacity).fill(null).map(() => []);

        // Rehash all existing entries
        for (const bucket of oldBuckets) {
            for (const [key, value] of bucket) {
                this.put(key, value);
            }
        }
    }

    // Get current size
    getSize() {
        return this.size;
    }

    // Override hashCode for HashMap
    hashCode() {
        let hash = 0;
        for (const bucket of this.buckets) {
            for (const [key, value] of bucket) {
                // Combine hash codes of key and value
                let keyHash = 0;
                let valueHash = 0;

                if (key !== null && key !== undefined) {
                    keyHash = typeof key.hashCode === 'function' ?
                            key.hashCode() : this.primitiveHashCode(key);
                }

                if (value !== null && value !== undefined) {
                    valueHash = typeof value.hashCode === 'function' ?
                            value.hashCode() : this.primitiveHashCode(value);
                }

                // XOR key and value hash codes (similar to Java's HashMap)
                hash ^= keyHash ^ valueHash;
            }
        }
        return hash;
    }

    // Helper method to generate hash code for primitives
    primitiveHashCode(obj) {
        if (typeof obj === 'number') {
            return Math.floor(obj) ^ (Math.floor(obj) >>> 16);
        }
        if (typeof obj === 'boolean') {
            return obj ? 1231 : 1237;
        }

        let hash = 0;
        const str = String(obj);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0x7FFFFFFF;
        }
        return hash;
    }

    // Override equals for HashMap
    equals(other) {
        if (this === other) {
            return true;
        }

        if (!(other instanceof HashMap)) {
            return false;
        }

        if (this.size !== other.size) {
            return false;
        }

        // Check if all key-value pairs match
        for (const bucket of this.buckets) {
            for (const [key, value] of bucket) {
                const otherValue = other.get(key);
                if (otherValue === null || !this.valuesEqual(value, otherValue)) {
                    return false;
                }
            }
        }

        return true;
    }
}
/**
 * Floating point math utilities.
 * This is wrapper to match the java implementatino.
 */
class FMath {
    static PI = Math.PI;

    static min(a, b) {
        return Math.min(a, b);
    }

    static max(a, b) {
        return Math.max(a, b);
    }

    static abs(a) {
        return Math.abs(a);
    }

    static sin(x) {
        return Math.sin(x);
    }

    static cos(x) {
        return Math.cos(x);
    }

    static tan(x) {
        return Math.tan(x);
    }

    static sqrt(x) {
        return Math.sqrt(x);
    }

    static pow(x, y) {
        return Math.pow(x, y);
    }

    static toRadians(angdeg) {
        return angdeg * FMath.PI / 180.0;
    }

}
/**
 * String utility class.
 */
class StringUtils {

    /**
     * Removes leading and trailing whitespace from a string.
     * If the string is null or undefined, returns an empty string.
     * 
     * @param {string|null|undefined} str - The string to trim
     * @returns {string} The trimmed string, or empty string if input is null/undefined
     */
    static trimToEmpty(str) {
        if (str == null) {
            return '';
        }
        return str.toString().trim();
    }

}
/**
 * Collections class.
 */
class Collections {
    /**
     * Returns empty list.
     * 
     * @returns {ArrayList} empty list
     */
    static emptyList() {
        let res = new ArrayList();
        return res;
    }

    /**
     * Returns empty map.
     * 
     * @returns {HashMap} empty map
     */
    static emptyMap() {
        let res = new HashMap();
        return res;
    }

}
/**
 * Domain utility class.
 */
class Dut {
    static list() {
        let res = new ArrayList();
        for (let arg = 0; arg < arguments.length; ++arg) {
            res.add(arguments[arg]);
        }
        return res;
    }

    static map() {
        let res = new HashMap();
        for (let arg = 0; arg < arguments.length; arg = arg + 2) {
            res.put(arguments[arg], arguments[arg + 1]);
        }
        return res;
    }

    static immutableList() {
        let res = new ArrayList();
        for (let arg = 0; arg < arguments.length; ++arg) {
            res.add(arguments[arg]);
        }
        return res;
    }

    static copyImmutableList(list) {
        let res = new ArrayList();
        for (let item of list) {
            res.add(item);
        }
        return res;
    }

    static copySet(collection) {
        let res = new HashSet();
        if (Array.isArray(collection)) {
            for (let item of collection) {
                res.add(item);
            }
        } else {
            throw "unknown collection: " + collection;
        }
        return res;
    }

    static copyImmutableMap(map) {
        let res = new HashMap();
        res.putAll(map);
        return res;
    }
}
/**
 * Reference identifier.
 */
class RefId {
}
/**
 * Asynchronous task future.
 */
class AsyncTaskFuture {
    constructor() {
        this.done = false;
        this.success = false;
        this.result = null;
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
    }

    /**
     * Returns whether task is done.
     * Done can mean by success, failure, or cancellation.
     *
     * @return {boolean} task is done or not
     */
    isDone() {
        return this.done;
    }

    /**
     * Returns whether the task is in success state.
     * Success means done and without error.
     *
     * @return {boolean} whether the task is in success state
     */
    isSuccess() {
        return this.success;
    }

    /**
     * Returns result if exits. Returns null if result is not available.
     *
     * @return {Object} result if exists, null if doesn't exists
     */
    getResult() {
        return result;
    }

    /**
     * Creates new instance.
     */
    static create() {
        const res = new AsyncTaskFuture();
        res.guardInvariants();
        return res;
    }
}
/**
 * Asynchronous task executor.
 */
class AsyncTaskExecutor {
    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
    }

    /**
     * Returns sound ids.
     * 
     * @param {Function} task task to execute
     * @returns {Future} task future
     */
    execute(task) {
        const future = AsyncTaskFuture.create();
        this.executeInternal(task).then(
                function (value) {
                    future.done = true;
                    future.success = true;
                    future.result = value;
                },
                function (error) {
                    console.error(error);
                    future.done = true;
                    future.success = false;
                    future.result = null;
                }
        );
        return future;
    }

    /**
     * Internal function to trigger asynchronous execution.
     * 
     * @param {Functino} task task to execute
     * @returns {Promise} promise with execution
     */
    async executeInternal(task) {
        return task();
    }

    /**
     * Creates new instance.
     */
    static create() {
        const res = new AsyncTaskExecutor();
        res.guardInvariants();
        return res;
    }
}
/**
 * Web asset loader.
 */
class WebAssetLoader {

    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
    }

    /**
     * Loads textrue.
     * 
     * @param {String} path path to the texture
     * @returns {Texture} loaded texture
     */
    async loadTexture(path) {
        // load data synchronously
        if (path instanceof Path) {
            path = path.path;
        }
        let url = path;
        if (path.startsWith("asset:")) {
            url = baseUrl + "/assets/" + path.substring(6);
        }
        let resTex = null;
        let promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function () {
                try {
                    // Create a canvas element
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Set canvas dimensions to match image
                    canvas.width = img.width;
                    canvas.height = img.height;
                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0);

                    // Get image data
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    const pixelData = imageData.data; // Uint8ClampedArray with RGBA values (0-255)

                    // Determine if image has transparency
                    let hasAlpha = false;
                    for (let i = 3; i < pixelData.length; i += 4) {
                        if (pixelData[i] < 255) {
                            hasAlpha = true;
                            break;
                        }
                    }

                    const format = hasAlpha ? 'RGBA' : 'RGB';
                    const componentsPerPixel = hasAlpha ? 4 : 3;

                    // Convert to floating point array (0-1 range)
                    const totalPixels = img.width * img.height;
                    const buf = new Float32Array(totalPixels * componentsPerPixel);

                    let bufIndex = 0;
                    for (let i = 0; i < pixelData.length; i += 4) {
                        // Red
                        buf[bufIndex++] = pixelData[i] / 255.0;
                        // Green
                        buf[bufIndex++] = pixelData[i + 1] / 255.0;
                        // Blue
                        buf[bufIndex++] = pixelData[i + 2] / 255.0;
                        // Alpha (only if image has transparency)
                        if (hasAlpha) {
                            buf[bufIndex++] = pixelData[i + 3] / 255.0;
                        }
                    }
                    const bufArr = Array.from(buf);
                    let texture = hasAlpha ? Texture.rgbaFloatBuffer(img.width, img.height, bufArr) :
                            Texture.rgbFloatBuffer(img.width, img.height, bufArr);
                    resolve(texture);
                } catch (error) {
                    reject(new Error(`Failed to process image: ${error.message}`));
                }
            };

            img.onerror = function () {
                console.log('error');
                reject(new Error(`Failed to load image from URL: ${url}`));
            };

            // Handle CORS issues
            img.crossOrigin = 'anonymous';
            img.src = url;

        }).then(result => {
            resTex = result;
        }, error => {
            console.log(error);
            resTex = "";
        });
        await promise;
        return resTex;
    }

    /**
     * Returns mime type from url.
     * 
     * @param {String} url url
     * @returns {String}
     */
    getMimeTypeFromUrl(url) {
        const extension = url.split('.').pop().toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            case 'webp':
                return 'image/webp';
            case 'bmp':
                return 'image/bmp';
            default:
                return 'unknown/unknown'; // Default fallback
        }
    }
    /**
     * Creates new instance.
     */
    static create() {
        const res = new WebAssetLoader();
        res.guardInvariants();
        return res;
    }
}
/**
 * Web asset manager.
 */
class WebAssetManager {
    drivers;
    executor;
    loader;
    bank;
    dict = new HashMap();
    constructor() {
    }

    guardInvariants() {
    }

    resolveAsync() {
        if (arguments.length === 1 && arguments[0] instanceof Path) {
            return this.resolveAsync_1_Path(arguments[0]);
        } else if (arguments.length === 3 && arguments[0] instanceof Path && typeof arguments[1] === "string" && arguments[2] instanceof Function) {
            return this.resolveAsync_3_Path_string_Function(arguments[0], arguments[1], arguments[2]);
        } else if (arguments.length === 2 && arguments[0] instanceof Path && arguments[1] instanceof HashMap) {
            return this.resolveAsync_2_Path_Map(arguments[0], arguments[1]);
        } else {
            throw "error";
        }
    }

    resolveAsync_1_Path(path) {
        return this.resolveAsync(path, Collections.emptyMap());
    }

    resolveAsync_3_Path_string_Function(path, clazz, transformFnc) {
        return this.resolveAsync(path, Dut.map(clazz, transformFnc));
    }

    resolveAsync_2_Path_Map(path, transformFncs) {
        return this.executor.execute(() => {
            return this.resolve(path, transformFncs);
        });
    }

    async resolve(path, transformFncs) {
        let res = new ArrayList();
        if (path.getExtension().equals("")) {
            let files = this.loader.listFiles(path, true);
            for (let file of files) {
                res.addAll(this.resolve(file, transformFncs));
            }
            return res;
        }
        let fullyLoaded = false;
        if (this.dict.containsKey(path)) {
            fullyLoaded = true;
            for (let id of this.dict.get(path)) {
                res.add(id);
                if (!this.bank.containsKey(id)) {
                    fullyLoaded = false;
                    break;
                }
            }
        }
        if (fullyLoaded) {
            return res;
        }
        let ag = AssetGroup.empty();
        if (path.getExtension().equals("png")) {
            let tid = TextureId.of(path.getPlainName());
            let texture = await this.loader.loadTexture(path);
            ag = ag.put(tid, texture);
        }
        /*
         if (path.getExtension().equals("tap")) {
         let buf = this.loader.loadFile(path);
         let tap = Taps.fromBytes(buf);
         ag = Taps.toAssetGroup(tap);
         } else if (path.getExtension().equals("png")) {
         ag = loadeAssets.loadTexture(this.loader, path);
         } else if (path.getExtension().equals("mtl")) {
         ag = Objs.loadMtlLibrary(this.loader, path);
         } else if (path.getExtension().equals("obj")) {
         ag = Objs.loadModel(this.loader, path);
         } else if (path.getExtension().equals("fnt")) {
         ag = Fonts.loadFnt(this.loader, path, AssetGroup.empty());
         } else if (path.getExtension().equals("wav")) {
         ag = Assets.loadSound(this.loader, path);
         }
         */
        for (let clazz of transformFncs.keySet()) {
            if (clazz.equals("Texture")) {
                ag = ag.transform("Texture", (transformFncs.get(clazz)));
            } else if (clazz.equals("Material")) {
                ag = ag.transform("Material", (transformFncs.get(clazz)));
            } else if (clazz.equals("Mesh")) {
                ag = ag.transform("Mesh", (transformFncs.get(clazz)));
            } else if (clazz.equals("Model")) {
                ag = ag.transform("Model", (transformFncs.get(clazz)));
            } else if (clazz.equals("Font")) {
                ag = ag.transform("Font", (transformFncs.get(clazz)));
            } else if (clazz.equals("Sound")) {
                ag = ag.transform("Sound", (transformFncs.get(clazz)));
            } else {
                throw "unsupported class for transformation, implement me: " + clazz;
            }
        }

        for (let key of ag.getKeys()) {
            if (this.bank.containsKey(key)) {
                throw "bank already contains " + key;
            }
        }
        for (let key of ag.getKeys()) {
            res.add(key);
            this.bank.put(key, ag.get(key));
        }
        this.dict.put(path, ag.getKeys());
        this.attachCompasnions(ag);
        return res;
    }

    put(key, asset) {
        this.bank.put(key, asset);
        this.attachCompanions(key, asset);
    }

    containsKey(key) {
        return this.bank.containsKey(key);
    }

    isMaterialized(key) {
        return this.bank.isMaterialized(key);
    }

    getKeys(type) {
        return this.bank.getKeys(type);
    }

    get(clazz, key) {
        return this.bank.get(clazz, key);
    }

    getCompanion(clazz, key, type) {
        return this.bank.getCompanion(clazz, key, type);
    }

    remove(key) {
        this.bank.remove(key);
    }

    syncToDrivers() {
        let gd = this.drivers.getDriver("GraphicsDriver");
        let ad = this.drivers.getDriver("AudioDriver");
        let gdms = gd.getMeshes();
        let abms = this.bank.getKeys(MeshId.TYPE);
        for (let rid of abms) {
            let mid = rid;
            if (this.bank.isSynced(mid) && gdms.contains(mid)) {
                continue;
            }
            if (gdms.contains(mid)) {
                gd.disposeMesh(mid);
            }
            gd.loadMesh(mid, this.bank.get("Mesh", mid));
            this.bank.markSynced(mid);
        }
        for (let mid of gdms) {
            if (!abms.contains(mid)) {
                gd.disposeMesh(mid);
            }
        }
        let gdtxs = gd.getTextures();
        let abtxs = this.bank.getKeys(TextureId.TYPE);
        for (let rid of abtxs) {
            let tid = rid;
            if (this.bank.isSynced(tid) && gdtxs.contains(tid)) {
                continue;
            }
            if (gdtxs.contains(tid)) {
                gd.disposeTexture(tid);
            }
            gd.loadTexture(tid, this.bank.get("Texture", tid), true);
            this.bank.markSynced(tid);
        }
        for (let tid of gdtxs) {
            if (!abtxs.contains(tid)) {
                gd.disposeTexture(tid);
            }
        }
        let gdshbs = gd.getShadowBuffers();
        let abshbs = this.bank.getKeys(ShadowBufferId.TYPE);
        for (let rid of abshbs) {
            let sbid = rid;
            if (this.bank.isSynced(sbid) && gdshbs.contains(sbid)) {
                continue;
            }
            if (gdshbs.contains(sbid)) {
                gd.disposeShadowBuffer(sbid);
            }
            gd.createShadowBuffer(sbid, this.bank.get("ShadowBuffer", sbid));
            this.bank.markSynced(sbid);
        }
        for (let sbid of gdshbs) {
            if (!abshbs.contains(sbid)) {
                gd.disposeShadowBuffer(sbid);
            }
        }
        let adrivSounds = ad.getSounds();
        let bankSounds = this.bank.getKeys(SoundId.TYPE);
        for (let rid of bankSounds) {
            let id = rid;
            if (this.bank.isSynced(id) && adrivSounds.contains(id)) {
                continue;
            }
            if (adrivSounds.contains(id)) {
                ad.disposeSound(id);
            }
            ad.loadSound(id, this.bank.get("Sound", id));
            this.bank.markSynced(id);
        }
        for (let id of adrivSounds) {
            if (!bankSounds.contains(id)) {
                ad.disposeSound(id);
            }
        }
    }

    attachCompasnions(ag) {
        for (let key of ag.getKeys()) {
            this.attachCompanions(key, ag.get(key));
        }
    }

    attachCompanions(key, asset) {
        if (asset instanceof Texture) {
            let tex = asset;
            let size = Size2.create(tex.getWidth(), tex.getHeight());
            this.bank.putCompanion(key, AssetCompanionType.SIZE, size);
        } else if (asset instanceof Mesh) {
            let mesh = asset;
            let aabb = WebAssetManager.calculateMeshAabb(mesh);
            this.bank.putCompanion(key, AssetCompanionType.BOUNDING_AABB, aabb);
        }
    }

    toString() {
    }

    static create(drivers, executor, loader, bank) {
        let res = new WebAssetManager();
        res.drivers = drivers;
        res.executor = executor;
        res.loader = loader;
        res.bank = bank;
        res.guardInvariants();
        return res;
    }

    static calculateMeshAabb(mesh) {
        let minX = Float.POSITIVE_INFINITY;
        let minY = Float.POSITIVE_INFINITY;
        let minZ = Float.POSITIVE_INFINITY;
        let maxX = Float.NEGATIVE_INFINITY;
        let maxY = Float.NEGATIVE_INFINITY;
        let maxZ = Float.NEGATIVE_INFINITY;
        let attrs = mesh.getVertexAttrs();
        for (let i = 0; i < mesh.getNumVertices(); ++i) {
            let vertex = mesh.getVertex(i);
            let offset = 0;
            for (let attr of attrs) {
                if (attr.equals(VertexAttr.POS3)) {
                    let x = vertex.coord(offset);
                    let y = vertex.coord(offset + 1);
                    let z = vertex.coord(offset + 2);
                    minX = FMath.min(minX, x);
                    minY = FMath.min(minY, y);
                    minZ = FMath.min(minZ, z);
                    maxX = FMath.max(maxX, x);
                    maxY = FMath.max(maxY, y);
                    maxZ = FMath.max(maxZ, z);
                }
                offset = offset + attr.getSize();
            }
        }
        if (Float.isInfinite(minX)) {
            return null;
        }
        return Aabb3.create(Vec3.create(minX, minY, minZ), Vec3.create(maxX, maxY, maxZ));
    }

}
/**
 * GL mesh reference.
 */
class WebglMeshRef {
  vbo;
  ebo;
  vao;
  vertexAttrs;
  numIndices;
  vertexSize;
  constructor() {
  }

  guardInvariants() {
  }

  getVbo() {
    return this.vbo;
  }

  getEbo() {
    return this.ebo;
  }

  getVao() {
    return this.vao;
  }

  getVertexAttrs() {
    return this.vertexAttrs;
  }

  getNumIndices() {
    return this.numIndices;
  }

  getVertexSize() {
    return this.vertexSize;
  }

  toString() {
  }

  static create(vbo, ebo, vao, vertexAttrs, numIndices) {
    let res = new WebglMeshRef();
    res.vbo = vbo;
    res.ebo = ebo;
    res.vao = vao;
    res.vertexAttrs = Dut.copyImmutableList(vertexAttrs);
    res.numIndices = numIndices;
    res.vertexSize = 0;
    for (let va of vertexAttrs) {
      res.vertexSize = res.vertexSize+va.getSize();
    }
    res.guardInvariants();
    return res;
  }

}

/**
 * GL texture reference.
 */
class WebglTextureRef {
    /**
     * Texture reference in opengl.
     * @type int 
     */
    textureId;

    /**
     * Referenced texture
     * @type Texture
     */
    texture;
    constructor() {
    }

    guardInvariants() {
    }

    getTextureId() {
        return this.textureId;
    }

    getTexture() {
        return this.texture;
    }

    toString() {
    }

    static create(textureId, texture) {
        let res = new WebglTextureRef();
        res.textureId = textureId;
        res.texture = texture;
        res.guardInvariants();
        return res;
    }

}

/**
 * Webgl shadow buffer reference.
 */
class WebglShadowBufferRef {
    /**
     * Frame buffer object reference.
     */
    fbo;

    /**
     * Texture reference.
     */
    textureId;

    /**
     * Render buffer identifier.
     */
    renderBufferId;

    /**
     * Width.
     */
    width;

    /**
     * Height.
     */
    height;
    constructor() {
    }

    guardInvariants() {
    }

    getFbo() {
        return this.fbo;
    }

    getTextureId() {
        return this.textureId;
    }

    getRenderBufferId() {
        return this.renderBufferId;
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }

    toString() {
    }

    static create(fbo, textureId, renderBufferId, width, height) {
        let res = new WebglShadowBufferRef();
        res.fbo = fbo;
        res.textureId = textureId;
        res.renderBufferId = renderBufferId;
        res.width = width;
        res.height = height;
        res.guardInvariants();
        return res;
    }

}

/**
 * Web GL shader.
 * Assumes WebGL context 'gl' is available globally
 */
class WebglShader {
    constructor() {
        this.id = null;
        this.buf = new Float32Array(16);
    }

    /**
     * Put this program into use.
     */
    use() {
        gl.useProgram(this.id);
    }

    /**
     * Sets uniform scalar (integer).
     */
    setUniformInt(name, val) {
        const loc = gl.getUniformLocation(this.id, name);
        gl.uniform1i(loc, val);
    }

    /**
     * Sets uniform scalar (float).
     */
    setUniformFloat(name, val) {
        const loc = gl.getUniformLocation(this.id, name);
        gl.uniform1f(loc, val);
    }

    /**
     * Sets uniform vector (Vec3).
     */
    setUniformVec(name, vec) {
        const loc = gl.getUniformLocation(this.id, name);
        this.buf[0] = vec.x();
        this.buf[1] = vec.y();
        this.buf[2] = vec.z();
        gl.uniform3fv(loc, this.buf.subarray(0, 3));
    }

    /**
     * Sets uniform vector (RGB).
     */
    setUniformRgb(name, rgb) {
        const loc = gl.getUniformLocation(this.id, name);
        this.buf[0] = rgb.r();
        this.buf[1] = rgb.g();
        this.buf[2] = rgb.b();
        gl.uniform3fv(loc, this.buf.subarray(0, 3));
    }

    /**
     * Sets uniform vector (RGBA).
     */
    setUniformRgba(name, rgba) {
        const loc = gl.getUniformLocation(this.id, name);
        this.buf[0] = rgba.r();
        this.buf[1] = rgba.g();
        this.buf[2] = rgba.b();
        this.buf[3] = rgba.a();
        gl.uniform4fv(loc, this.buf.subarray(0, 4));
    }

    /**
     * Sets uniform matrix (Mat33).
     */
    setUniformMat33(name, mat) {
        const loc = gl.getUniformLocation(this.id, name);
        
        // Convert to column-major order for WebGL
        this.buf[0] = mat.m00();
        this.buf[1] = mat.m10();
        this.buf[2] = mat.m20();
        this.buf[3] = mat.m01();
        this.buf[4] = mat.m11();
        this.buf[5] = mat.m21();
        this.buf[6] = mat.m02();
        this.buf[7] = mat.m12();
        this.buf[8] = mat.m22();
        
        gl.uniformMatrix3fv(loc, false, this.buf.subarray(0, 9));
    }

    /**
     * Sets uniform matrix (Mat44).
     */
    setUniformMat(name, mat) {
        const loc = gl.getUniformLocation(this.id, name);
        
        // Convert to column-major order for WebGL
        this.buf[0] = mat.m00();
        this.buf[1] = mat.m10();
        this.buf[2] = mat.m20();
        this.buf[3] = mat.m30();
        this.buf[4] = mat.m01();
        this.buf[5] = mat.m11();
        this.buf[6] = mat.m21();
        this.buf[7] = mat.m31();
        this.buf[8] = mat.m02();
        this.buf[9] = mat.m12();
        this.buf[10] = mat.m22();
        this.buf[11] = mat.m32();
        this.buf[12] = mat.m03();
        this.buf[13] = mat.m13();
        this.buf[14] = mat.m23();
        this.buf[15] = mat.m33();
        
        gl.uniformMatrix4fv(loc, false, this.buf);
    }

    /**
     * Sets uniform matrix with individual components.
     */
    setUniformMatComponents(name, m00, m01, m02, m03, m10, m11, m12, m13,
                           m20, m21, m22, m23, m30, m31, m32, m33) {
        const loc = gl.getUniformLocation(this.id, name);
        
        // Convert to column-major order for WebGL
        this.buf[0] = m00;
        this.buf[1] = m10;
        this.buf[2] = m20;
        this.buf[3] = m30;
        this.buf[4] = m01;
        this.buf[5] = m11;
        this.buf[6] = m21;
        this.buf[7] = m31;
        this.buf[8] = m02;
        this.buf[9] = m12;
        this.buf[10] = m22;
        this.buf[11] = m32;
        this.buf[12] = m03;
        this.buf[13] = m13;
        this.buf[14] = m23;
        this.buf[15] = m33;
        
        gl.uniformMatrix4fv(loc, false, this.buf);
    }

    /**
     * Deletes program from the graphics card.
     */
    deleteProgram() {
        gl.deleteProgram(this.id);
    }

    /**
     * Creates shader instance.
     */
    static create(id) {
        const res = new WebglShader();
        res.id = id;
        return res;
    }
}
/**
 * Web GL utility method.
 * Assumes WebGL context 'gl' is available globally.
 */
class WebglUtils {
    constructor() {
        // Prevents construction
        throw new Error("WebglUtils is a utility class and cannot be instantiated");
    }

    /**
     * Loads shader program.
     */
    static loadShaderProgram(vertexShaderSource, fragmentShaderSource) {
        const vertexShader = WebglUtils.loadShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = WebglUtils.loadShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        WebglUtils.guardError("program linking");

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`error in linking program: ${WebglUtils.getProgramLog(program)}`);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    /**
     * Load shader.
     */
    static loadShader(type, source) {
        // Load shader source from loader
        if (typeof source === 'string') {
            // If it's already a string, use it directly
            const shaderSource = source;
            const shader = gl.createShader(type);
            gl.shaderSource(shader, shaderSource);
            gl.compileShader(shader);

            WebglUtils.guardError("Compilation error");

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw `error in compiling shader: ${WebglUtils.getShaderLog(shader)}`
            }

            return shader;
        } else {
            // If it's a buffer/array, convert to string
            const shaderSource = new TextDecoder().decode(source);
            const shader = gl.createShader(type);
            gl.shaderSource(shader, shaderSource);
            gl.compileShader(shader);

            WebglUtils.guardError("Compilation error");

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw `error in compiling shader: ${WebglUtils.getShaderLog(shader)}`
            }

            return shader;
        }
    }

    /**
     * Guards for the error. Throws an exception if there was an OpenGL error.
     */
    static guardError(msg) {
        let glErr = gl.getError();

        while (glErr !== gl.NO_ERROR) {
            const errorString = WebglUtils.getErrorString(glErr);
            throw new Error(`WebGL error: ${msg}; ${errorString}`);
        }
    }

    /**
     * Returns shader log.
     */
    static getShaderLog(shader) {
        return gl.getShaderInfoLog(shader);
    }

    /**
     * Returns program log.
     */
    static getProgramLog(program) {
        return gl.getProgramInfoLog(program);
    }

    /**
     * Converts WebGL error code to string.
     */
    static getErrorString(errorCode) {
        switch (errorCode) {
            case gl.NO_ERROR:
                return "NO_ERROR";
            case gl.INVALID_ENUM:
                return "INVALID_ENUM";
            case gl.INVALID_VALUE:
                return "INVALID_VALUE";
            case gl.INVALID_OPERATION:
                return "INVALID_OPERATION";
            case gl.INVALID_FRAMEBUFFER_OPERATION:
                return "INVALID_FRAMEBUFFER_OPERATION";
            case gl.OUT_OF_MEMORY:
                return "OUT_OF_MEMORY";
            case gl.CONTEXT_LOST_WEBGL:
                return "CONTEXT_LOST_WEBGL";
            default:
                return `UNKNOWN_ERROR(${errorCode})`;
        }
    }

    /**
     * Creates a simple shader program from source strings.
     * Useful for testing or when you have shader source directly.
     */
    static createShaderProgramFromSource(vertexSource, fragmentSource) {
        const vertexShader = WebglUtils.createShaderFromSource(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = WebglUtils.createShaderFromSource(gl.FRAGMENT_SHADER, fragmentSource);

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`error in linking program: ${gl.getProgramInfoLog(program)}`);
        }

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        return program;
    }

    /**
     * Creates a shader from source string.
     */
    static createShaderFromSource(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`error in compiling shader: ${gl.getShaderInfoLog(shader)}`);
        }

        return shader;
    }
}
/**
 * WebGL Color Renderer - JavaScript version of JoglColorRenderer
 * Assumes WebGL context 'gl' is available globally
 */

class WebglColorRenderer {
    constructor() {
        this.refProvider = null;
        this.shader = null;
        this.camera = null;
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        if (!this.refProvider) {
            throw new Error("refProvider cannot be null");
        }
        if (!this.shader) {
            throw new Error("shader cannot be null");
        }
    }

    /**
     * Starts the renderer.
     * 
     * @param {Environmenty} environment environment
     */
    start(environment) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        const vp = this.refProvider.getScreenViewport();
        gl.viewport(vp.x, vp.y, vp.width, vp.height);

        this.camera = environment.getCamera();
    }

    /**
     * Renders a mesh with the given transformation matrix.
     * 
     * @param {MeshId} mesh identifier
     * @param {Mat44} mat transformation matric
     */
    render(mesh, mat) {
        const m = this.refProvider.getMeshRef(mesh);

        if (this.arraysEqual(m.getVertexAttrs(), [VertexAttr.POS3, VertexAttr.RGB])) {
            gl.disable(gl.BLEND);
            this.shader.use();
            this.shader.setUniformMat("modelMat", mat);
            this.shader.setUniformMat("viewMat", this.camera.getView());
            this.shader.setUniformMat("projMat", this.camera.getProj());

            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getVbo());

            // Position attribute (3 floats)
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.enableVertexAttribArray(0);

            // Color attribute (3 floats)
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
            gl.enableVertexAttribArray(1);

            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);

        } else {
            throw "unsupported mesh in this method: " + m.getVertexAttrs();
        }
    }

    /**
     * Renders a transparent mesh with the given transformation matrix.
     * 
     * @param {MeshId} mesh identifier
     * @param {Mat44} mat transformation matric
     * @param {BlendType} blendType blending type
     */
    renderTransparent(mesh, mat, blendType) {
        const m = this.refProvider.getMeshRef(mesh);

        if (this.arraysEqual(m.getVertexAttrs(), [VertexAttr.POS3, VertexAttr.RGBA])) {
            gl.enable(gl.BLEND);

            if (blendType === BlendType.ALPHA) {
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            } else if (blendType === BlendType.ADDITIVE) {
                gl.blendFunc(gl.ONE, gl.ONE);
            } else if (blendType === BlendType.MULTIPLICATIVE) {
                gl.blendFunc(gl.ZERO, gl.SRC_ALPHA);
            } else {
                throw "unsupported blend type: " + blendType.toString();
            }

            this.shader.use();
            this.shader.setUniformMat("modelMat", mat);
            this.shader.setUniformMat("viewMat", this.camera.getView());
            this.shader.setUniformMat("projMat", this.camera.getProj());

            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getVbo());

            // Position attribute (3 floats)
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 7 * 4, 0);
            gl.enableVertexAttribArray(0);

            // Color attribute (3 floats)
            gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
            gl.enableVertexAttribArray(1);

            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);

        } else {
            throw "unsupported mesh in this method: " + m.getVertexAttrs();
        }
    }

    /**
     * Ends the renderer.
     */
    end() {
        // Nothing to do here
    }

    /**
     * Helper method to compare arrays.
     * 
     * @param {Array} a first array
     * @param {Array} b second array
     * @returns {Boolean} whether those arrays are equal ow not
     */
    arraysEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Creates new instance.
     */
    static create(refProvider, shader) {
        const res = new WebglColorRenderer();
        res.refProvider = refProvider;
        res.shader = shader;
        res.guardInvariants();
        return res;
    }
}
/**
 * WebGL Scene Renderer - JavaScript version of JoglSceneRenderer
 * Assumes WebGL context 'gl' is available globally
 */

class WebglSceneRenderer {
    /**
     * Offset for diffuse textures.
     * This has to be synchronized with relevant shader program.
     */
    static DIFFUSE_TEXTURE_OFFSET = 0;
    /**
     * Maximum number of diffuse textures.
     * This has to be synchronized with relevant shader program.
     */
    static MAX_DIFFUSE_TEXTURES = 2;
    /**
     * Offset for specular textures.
     * This has to be synchronized with relevant shader program.
     */
    static SPECULAR_TEXTURE_OFFSET = 2;
    /**
     * Maximum number of specular textures.
     * This has to be synchronized with relevant shader program.
     */
    static MAX_SPECULAR_TEXTURES = 2;
    /**
     * Offset for alpha textures.
     * This has to be synchronized with relevant shader program.
     */
    static ALPHA_TEXTURE_OFFSET = 4;
    /**
     * Maximum number of alpha textures.
     * This has to be synchronized with relevant shader program.
     */
    static MAX_ALPHA_TEXTURES = 1;
    /**
     * Offset for shadow maps.
     * This has to be synchronized with relevant shader program.
     */
    static SHADOW_MAP_OFFSET = 5;
    /**
     * Maximum number of shadow maps.
     * This has to be synchronized with relevant shader program.
     */
    static MAX_SHADOW_MAPS = 3;
    /**
     * Maximum number of directional lights.
     * This has to be synchronized with relevant shader program.
     */
    static MAX_DIR_LIGHTS = 3;
    /**
     * Maximum number of point lights.
     * This has to be synchronized with relevant shader program.
     */
    static MAX_POINT_LIGHTS = 10;
    /**
     * Maximum number of spot lights.
     * This has to be synchronized with relevant shader program.
     */
    static MAX_SPOT_LIGHTS = 10;

    constructor() {
        this.assetBank = null;
        this.refProvider = null;
        this.shader = null;
        this.defaultTexture = null;
        this.camera = null;
        this.rgbaBuf = [];
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        Guard.notNull(this.assetBank, "assetBank cannot be null");
        Guard.notNull(this.refProvider, "refProvider cannot be null");
        Guard.notNull(this.shader, "shader shader cannot be null");
        Guard.notNull(this.defaultTexture, "defaultTexture shader cannot be null");
    }

    init() {
        this.shader.use();

        // bind texture placeholders
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture.getTextureId());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.shader.setUniformInt("diffuseTexture1", 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture.getTextureId());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.shader.setUniformInt("diffuseTexture2", 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture.getTextureId());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.shader.setUniformInt("specularTexture1", 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture.getTextureId());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.shader.setUniformInt("specularTexture2", 3);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture.getTextureId());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.shader.setUniformInt("alphaTexture1", 4);

        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture.getTextureId());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.shader.setUniformInt("shadowTexture1", 5);

        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture.getTextureId());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.shader.setUniformInt("shadowTexture2", 6);

        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, this.defaultTexture.getTextureId());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        this.shader.setUniformInt("shadowTexture3", 7);

    }

    /**
     * Starts the renderer.
     * 
     * @param {Environmenty} environment environment
     */
    start(environment) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);
        const vp = this.refProvider.getScreenViewport();
        gl.viewport(vp.x, vp.y, vp.width, vp.height);
        this.shader.use();
        this.shader.setUniformMat("viewMat", environment.getCamera().getView());
        this.shader.setUniformMat("projMat", environment.getCamera().getProj());
        this.shader.setUniformVec("viewPos", environment.getCamera().getPos());
        this.shader.setUniformFloat("gamma", environment.getGamma());

        // lightning
        let numDirLights = 0;
        let numPointLights = 0;
        let numSpotLights = 0;
        let numShadowMaps = 0;
        for (const light of environment.getLights()) {
            if (light.isDirectionalShadowless()) {
                const pref = "dirLights[" + numDirLights + "].";
                this.shader.setUniformVec(pref + "dir", light.getDir());
                this.shader.setUniformRgb(pref + "ambient", light.getAmbient());
                this.shader.setUniformRgb(pref + "diffuse", light.getDiffuse());
                this.shader.setUniformRgb(pref + "specular", light.getSpecular());
                this.shader.setUniformInt(pref + "shadowMapIdx", -1);
                ++numDirLights;
            } else if (light.isPointShadowless()) {
                const pref = "pointLights[" + numPointLights + "].";
                this.shader.setUniformVec(pref + "pos", light.getPos());
                this.shader.setUniformFloat(pref + "range", light.getRange());
                this.shader.setUniformFloat(pref + "constAtt", light.getAttenuation().getConstant());
                this.shader.setUniformFloat(pref + "linAtt", light.getAttenuation().getLinear());
                this.shader.setUniformFloat(pref + "sqrAtt", light.getAttenuation().getQuadratic());
                this.shader.setUniformRgb(pref + "ambient", light.getAmbient());
                this.shader.setUniformRgb(pref + "diffuse", light.getDiffuse());
                this.shader.setUniformRgb(pref + "specular", light.getSpecular());
                ++numPointLights;
            } else if (light.isSpotShadowless()) {
                const pref = "spotLights[" + numSpotLights + "].";
                this.shader.setUniformVec(pref + "pos", light.getPos());
                this.shader.setUniformVec(pref + "dir", light.getDir());
                this.shader.setUniformFloat(pref + "cosInTh", FMath.cos(light.getCone().getInTheta()));
                this.shader.setUniformFloat(pref + "cosOutTh", FMath.cos(light.getCone().getOutTheta()));
                this.shader.setUniformFloat(pref + "range", light.getRange());
                this.shader.setUniformFloat(pref + "constAtt", light.getAttenuation().getConstant());
                this.shader.setUniformFloat(pref + "linAtt", light.getAttenuation().getLinear());
                this.shader.setUniformFloat(pref + "sqrAtt", light.getAttenuation().getQuadratic());
                this.shader.setUniformRgb(pref + "ambient", light.getAmbient());
                this.shader.setUniformRgb(pref + "diffuse", light.getDiffuse());
                this.shader.setUniformRgb(pref + "specular", light.getSpecular());
                this.shader.setUniformInt(pref + "shadowMapIdx", -1);
                ++numSpotLights;
            } else if (light.isSpotShadowMap()) {
                const pref = "spotLights[" + numSpotLights + "].";
                this.shader.setUniformVec(pref + "pos", light.getPos());
                this.shader.setUniformVec(pref + "dir", light.getDir());
                this.shader.setUniformFloat(pref + "cosInTh", FMath.cos(light.getCone().getInTheta()));
                this.shader.setUniformFloat(pref + "cosOutTh", FMath.cos(light.getCone().getOutTheta()));
                this.shader.setUniformFloat(pref + "range", light.getRange());
                this.shader.setUniformFloat(pref + "constAtt", light.getAttenuation().getConstant());
                this.shader.setUniformFloat(pref + "linAtt", light.getAttenuation().getLinear());
                this.shader.setUniformFloat(pref + "sqrAtt", light.getAttenuation().getQuadratic());
                this.shader.setUniformRgb(pref + "ambient", light.getAmbient());
                this.shader.setUniformRgb(pref + "diffuse", light.getDiffuse());
                this.shader.setUniformRgb(pref + "specular", light.getSpecular());
                this.shader.setUniformInt(pref + "shadowMapIdx", numShadowMaps);

                const smpref = "shadowMaps[" + numShadowMaps + "].";
                this.shader.setUniformMat(smpref + "lightMat", light.getShadowMap().getLightMat());
                this.shader.setUniformInt(smpref + "pcfType", this.pcfTypeToInternal(light.getShadowMap().getPcfType()));
                const tid = this.refProvider.getShadowBufferRef(light.getShadowMap().getShadowBuffer()).getTextureId();
                gl.activeTexture(gl.TEXTURE0 + WebglSceneRenderer.SHADOW_MAP_OFFSET + numShadowMaps);
                gl.bindTexture(gl.TEXTURE_2D, tid);
                ++numSpotLights;
                ++numShadowMaps;
            } else if (light.isDirectionalShadowMap()) {
                const pref = "dirLights[" + numDirLights + "].";
                this.shader.setUniformVec(pref + "dir", light.getDir());
                this.shader.setUniformRgb(pref + "ambient", light.getAmbient());
                this.shader.setUniformRgb(pref + "diffuse", light.getDiffuse());
                this.shader.setUniformRgb(pref + "specular", light.getSpecular());
                this.shader.setUniformInt(pref + "shadowMapIdx", numShadowMaps);

                const smpref = "shadowMaps[" + numShadowMaps + "].";
                this.shader.setUniformMat(smpref + "lightMat", light.getShadowMap().getLightMat());
                this.shader.setUniformInt(smpref + "pcfType", this.pcfTypeToInternal(light.getShadowMap().getPcfType()));
                const tid = this.refProvider.getShadowBufferRef(light.getShadowMap().getShadowBuffer()).getTextureId();
                gl.activeTexture(gl.TEXTURE0 + WebglSceneRenderer.SHADOW_MAP_OFFSET + numShadowMaps);
                gl.bindTexture(gl.TEXTURE_2D, tid);
                ++numDirLights;
                ++numShadowMaps;
            } else {
                throw "unsupported light type: " + light.getType();
            }
        }
        this.shader.setUniformInt("numDirLights", numDirLights);
        this.shader.setUniformInt("numPointLights", numPointLights);
        this.shader.setUniformInt("numSpotLights", numSpotLights);
        this.shader.setUniformInt("numShadowMaps", numShadowMaps);
    }

    /**
     * Performs rendering. Arguments determines how the object is rendered.
     */
    render() {
        if (arguments.length === 3 && arguments[0] instanceof MeshId && arguments[1] instanceof Mat44 && arguments[2] instanceof Material) {
            this.renderMesh(arguments[0], 0, 0, 0, arguments[1], arguments[2]);
        } else {
            throw "unsupported arguments for rendering, implement me";
        }
    }

    /**
     * Renders mesh.
     * 
     * @param {MeshId} mesh mesh to render
     * @param {number} frame1 first frame (integer)
     * @param {number} frame2 second frame (integer)
     * @param {number} t interpolation number (float)
     * @param {Mat44} mat matrix
     * @param {Material} material material
     */
    renderMesh(mesh, frame1, frame2, t, mat, material) {
        const m = this.refProvider.getMeshRef(mesh);

        gl.disable(gl.BLEND);

        this.shader.setUniformMat("modelMat", mat);
        this.shader.setUniformMat33("normalMat", this.getNormalMat(mat));
        this.shader.setUniformRgb("material.ambient", material.getAmbient());
        this.shader.setUniformRgb("material.diffuse", material.getDiffuse());
        this.shader.setUniformRgb("material.specular", material.getSpecular());
        this.shader.setUniformFloat("material.shininess", material.getShininess());

        let numDiffuseTextures = 0;
        let numSpecularTextures = 0;
        let numAlphaTextures = 0;
        for (const tex of material.getTextures()) {
            if (tex.getType().equals(TextureType.DIFFUSE)) {
                const tid = this.refProvider.getTextureRef(tex.getTexture()).getTextureId();
                gl.activeTexture(gl.TEXTURE0 + WebglSceneRenderer.DIFFUSE_TEXTURE_OFFSET + numDiffuseTextures);
                gl.bindTexture(gl.TEXTURE_2D, tid);
                ++numDiffuseTextures;
            } else if (tex.getType().equals(TextureType.SPECULAR)) {
                const tid = this.refProvider.getTextureRef(tex.getTexture()).getTextureId();
                gl.activeTexture(gl.TEXTURE0 + WebglSceneRenderer.SPECULAR_TEXTURE_OFFSET + numSpecularTextures);
                gl.bindTexture(gl.TEXTURE_2D, tid);
                ++numSpecularTextures;
            } else if (tex.getType().equals(TextureType.ALPHA)) {
                const tid = this.refProvider.getTextureRef(tex.getTexture()).getTextureId();
                gl.activeTexture(gl.TEXTURE0 + WebglSceneRenderer.ALPHA_TEXTURE_OFFSET + numAlphaTextures);
                gl.bindTexture(gl.TEXTURE_2D, tid);
                ++numAlphaTextures;
            } else {
                throw "unsupported texture type: " + tex.getType();
            }
            switch (tex.getStyle().getHorizWrapType()) {
                case TextureWrapType.REPEAT:
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                    break;
                case TextureWrapType.MIRRORED_REPEAT:
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
                    break;
                case TextureWrapType.EDGE:
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    break;
                case TextureWrapType.BORDER:
                    // TextureWrapType.BORDER is not supported in webgl, sorry can't use it here, so replacing with clamp to edge for the moment
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_BORDER);
                    //gl.texParameterfv(gl.TEXTURE_2D, gl.TEXTURE_BORDER_COLOR, tex.getStyle().getBorderColor().toBuf(rgbaBuf), 0);
                    break;
                default:
                    throw "unsupported horizontal wrap type: " + tex.getStyle().getHorizWrapType();
            }
            switch (tex.getStyle().getVertWrapType()) {
                case TextureWrapType.REPEAT:
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                    break;
                case TextureWrapType.MIRRORED_REPEAT:
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
                    break;
                case TextureWrapType.EDGE:
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    break;
                case TextureWrapType.BORDER:
                    // TextureWrapType.BORDER is not supported in webgl, sorry can't use it here, so replacing with clamp to edge for the moment
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_BORDER);
                    //gl.texParameterfv(gl.TEXTURE_2D, gl.TEXTURE_BORDER_COLOR, tex.getStyle().getBorderColor().toBuf(rgbaBuf), 0);
                    break;
                default:
                    throw "unsupported vertical wrap type: " + tex.getStyle().getVertWrapType();
            }
            switch (tex.getStyle().getMinFilterType()) {
                case TextureFilterType.NEAREST:
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    break;
                case TextureFilterType.LINEAR:
                    // ref: WebglGraphicsDriver.js - currently this does not work (look to mipmaps), so replacing with NEAREST for the moment
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    break;
                case TextureFilterType.LINEAR_MIPMAP_LINEAR:
                    // ref: WebglGraphicsDriver.js - currently this does not work (look to mipmaps), so replacing with NEAREST for the moment
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                    break;
                default:
                    throw "unsupported min filter type: " + tex.getStyle().getMinFilterType();
            }
            switch (tex.getStyle().getMagFilterType()) {
                case TextureFilterType.NEAREST:
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    break;
                case TextureFilterType.LINEAR:
                    // ref: WebglGraphicsDriver.js - currently this does not work (look to mipmaps), so replacing with NEAREST for the moment
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    break;
                default:
                    throw "unsupported mag filter type: " + tex.getStyle().getMinFilterType();
            }
        }
        this.shader.setUniformInt("numDiffuseTextures", numDiffuseTextures);
        this.shader.setUniformInt("numSpecularTextures", numSpecularTextures);
        this.shader.setUniformInt("numAlphaTextures", numAlphaTextures);

        if (m.getVertexAttrs().equals(Dut.list(VertexAttr.POS3, VertexAttr.NORM3))) {
            this.shader.setUniformFloat("t", 0);
            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getVbo());
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
            gl.enableVertexAttribArray(3);
            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);
        } else if (this.isAnimatedModel(m.getVertexAttrs())) {
            this.shader.setUniformFloat("t", t);
            const vsize = m.getVertexSize();
            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getVbo());
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, vsize * 4, frame1 * 6 * 4);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, vsize * 4, frame2 * 6 * 4);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(2, 3, gl.FLOAT, false, vsize * 4, frame1 * 6 * 4 + 3 * 4);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(3, 3, gl.FLOAT, false, vsize * 4, frame2 * 6 * 4 + 3 * 4);
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(4, 2, gl.FLOAT, false, vsize * 4, (vsize - 2) * 4);
            gl.enableVertexAttribArray(4);
            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);
        } else {
            throw new IllegalArgumentException("unsupported mesh attributes for " + mesh + " in this method: " + m.getVertexAttrs());
        }
    }

    /**
     * Ends the renderer.
     */
    end() {
        // Nothing to do here
    }

    /**
     * Returns normal matrix.
     * 
     * @param {Mat44} model model matrix
     * @returns {Mat33} normal matrix
     */
    getNormalMat(model) {
        let tl = Mat33.create(
                model.m00(), model.m01(), model.m02(),
                model.m10(), model.m11(), model.m12(),
                model.m20(), model.m21(), model.m22());
        return tl.inv().transpose();
    }

    /**
     * Converts PCF type to the internal representation.
     * 
     * @param {ShadowMapPcfType} pcfType pcf type
     * @returns {Number} internal PCF type representatin
     */
    pcfTypeToInternal(pcfType) {
        switch (pcfType) {
            case ShadowMapPcfType.NONE:
                return 0;
            case ShadowMapPcfType.GAUSS_33:
                return 1;
            case ShadowMapPcfType.GAUSS_55:
                return 2;
            default:
                throw "unsupported pcf type, implement me: " + pcfType;
        }
    }

    /**
     * Returns if attribute set is animated model.
     *
     * @param {ArrayList of VertexAttr} attrs vertex attributes
     * @returns {Boolean} whether thi is an animated model
     */
    isAnimatedModel(attrs) {
        if (attrs.size() < 3 || !attrs.get(attrs.size() - 1).equals(VertexAttr.TEX2)) {
            return false;
        }
        for (let i = 0; i < attrs.size() - 1; i = i + 2) {
            if (!attrs.get(i).equals(VertexAttr.POS3) || !attrs.get(i + 1).equals(VertexAttr.NORM3)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Creates new instance.
     * 
     * @param {AssetBank} assetBank asset bank
     * @param {GlRefProvider} refProvider provider for gl references
     * @param {WebglShader} shader shader
     * @param {WebglTextureRef} default texture
     * @returns {WebglSceneRenderer} created object
     */
    static create(assetBank, refProvider, shader, defaultTexture) {
        const res = new WebglSceneRenderer();
        res.assetBank = assetBank;
        res.refProvider = refProvider;
        res.shader = shader;
        res.defaultTexture = defaultTexture;
        res.guardInvariants();
        res.init();
        return res;
    }
}
/**
 * WebGL Shadow Map Renderer - JavaScript version of JoglShadowMapRenderer
 * Assumes WebGL context 'gl' is available globally.
 */

class WebglShadowMapRenderer {
    constructor() {
        this.refProvider = null;
        this.shader = null;
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        if (!this.refProvider) {
            throw new Error("refProvider cannot be null");
        }
        if (!this.shader) {
            throw new Error("shader cannot be null");
        }
    }

    /**
     * Starts the renderer.
     * 
     * @param {Environmenty} environment environment
     */
    start(environment) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        const light = environment.getLight();
        if (light.isSpotShadowMap()) {
            const sbuf = this.refProvider.getShadowBufferRef(light.getShadowMap().getShadowBuffer());
            gl.viewport(0, 0, sbuf.getWidth(), sbuf.getHeight());

            gl.bindFramebuffer(gl.FRAMEBUFFER, sbuf.getFbo());
            gl.clear(gl.DEPTH_BUFFER_BIT);
            this.shader.use();
            this.shader.setUniformMat("lightMat", light.getShadowMap().getLightMat());
        } else if (light.isDirectionalShadowMap()) {
            const sbuf = this.refProvider.getShadowBufferRef(light.getShadowMap().getShadowBuffer());
            gl.viewport(0, 0, sbuf.getWidth(), sbuf.getHeight());

            gl.bindFramebuffer(gl.FRAMEBUFFER, sbuf.getFbo());
            gl.clear(gl.DEPTH_BUFFER_BIT);
            this.shader.use();
            this.shader.setUniformMat("lightMat", light.getShadowMap().getLightMat());
        } else {
            throw "unsupported shadow light class: " + environment.getLight();
        }
    }

    /**
     * Performs rendering. Arguments determines how the object is rendered.
     */
    render() {
        if (arguments.length === 2 && arguments[0] instanceof MeshId && arguments[1] instanceof Mat44) {
            this.renderMesh(arguments[0], 0, 0, 0, arguments[1]);
        } else {
            throw "unsupported arguments for rendering, implement me";
        }
    }

    /**
     * Renders mesh.
     * 
     * @param {MeshId} mesh mesh to render
     * @param {number} frame1 first frame (integer)
     * @param {number} frame2 second frame (integer)
     * @param {number} t interpolation number (float)
     * @param {Mat44} mat matrix
     */
    renderMesh(mesh, frame1, frame2, t, mat) {
        const m = this.refProvider.getMeshRef(mesh);
        gl.disable(gl.BLEND);
        this.shader.setUniformMat("modelMat", mat);

        if (m.getVertexAttrs().equals(Dut.list(VertexAttr.POS3, VertexAttr.NORM3))) {
            this.shader.setUniformFloat("t", 0);
            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getVbo());
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);
        } else if (this.isAnimatedModel(m.getVertexAttrs())) {
            this.shader.setUniformFloat("t", t);
            const vsize = m.getVertexSize();
            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getVbo());
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, vsize * 4, frame1 * 6 * 4);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, vsize * 4, frame2 * 6 * 4);
            gl.enableVertexAttribArray(1);
            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);
        } else {
            throw new IllegalArgumentException("unsupported mesh attributes for " + mesh + " in this method: " + m.getVertexAttrs());
        }
    }

    /**
     * Ends the renderer.
     */
    end() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    /**
     * Returns if attribute set is animated model.
     *
     * @param {ArrayList of VertexAttr} attrs vertex attributes
     * @returns {Boolean} whether thi is an animated model
     */
    isAnimatedModel(attrs) {
        if (attrs.size() < 3 || !attrs.get(attrs.size() - 1).equals(VertexAttr.TEX2)) {
            return false;
        }
        for (let i = 0; i < attrs.size() - 1; i = i + 2) {
            if (!attrs.get(i).equals(VertexAttr.POS3) || !attrs.get(i + 1).equals(VertexAttr.NORM3)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Helper method to compare arrays.
     * 
     * @param {Array} a first array
     * @param {Array} b second array
     * @returns {Boolean} whether those arrays are equal ow not
     */
    arraysEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    /**
     * Creates new instance.
     */
    static create(refProvider, shader) {
        const res = new WebglShadowMapRenderer();
        res.refProvider = refProvider;
        res.shader = shader;
        res.guardInvariants();
        return res;
    }
}
/**
 * Web GL Graphics Driver. This class manages shaders and renderes.
 * Assumes WebGL context 'gl' is available globally.
 */
class WebglGraphicsDriver {
    assetBank = null;
    screenViewport = null;
    shaders = [];
    renderers = new HashMap();
    meshes = new HashMap();
    textures = new HashMap();
    shadowBuffers = new HashMap();

    // Rectangle meshes for debugging and sprites
    debugRectMesh = null;
    spriteRectMesh = null;
    primitivesMesh = null;
    defaultTexture = null;

    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        if (!this.assetBank) {
            throw new Error("assetBank cannot be null");
        }
    }

    /**
     * Performs the necessary initialization.
     * This includes loading shaders and preparing classes for later usage.
     */
    init() {
        // Create debug plane mesh
        const dbgPlane = Mesh.create(
                [VertexAttr.POS3, VertexAttr.TEX2],
                [
                    Vertex.create(-1, -1, 0, 0, 0),
                    Vertex.create(1, -1, 0, 1, 0),
                    Vertex.create(1, 1, 0, 1, 1),
                    Vertex.create(-1, 1, 0, 0, 1)
                ],
                [
                    Face.triangle(0, 1, 2),
                    Face.triangle(0, 2, 3)
                ]
                );
        this.debugRectMesh = this.pushMeshToGraphicCard(dbgPlane);

        // Create sprite plane mesh
        const spritePlane = Mesh.create(
                [VertexAttr.POS3, VertexAttr.TEX2],
                [
                    Vertex.create(-0.5, -0.5, 0, 0, 0),
                    Vertex.create(0.5, -0.5, 0, 1, 0),
                    Vertex.create(0.5, 0.5, 0, 1, 1),
                    Vertex.create(-0.5, 0.5, 0, 0, 1)
                ],
                [
                    Face.triangle(0, 1, 2),
                    Face.triangle(0, 2, 3)
                ]
                );
        this.spriteRectMesh = this.pushMeshToGraphicCard(spritePlane);

        // Create primitive mesh
        const primitive = Mesh.create(
                [VertexAttr.POS3, VertexAttr.RGB],
                [],
                []
                );
        this.primitivesMesh = this.pushMeshToGraphicCard(primitive);

        // Create default texture
        const tex = Texture.rgbConstant(1, 1, Rgb.BLACK);
        this.defaultTexture = this.pushTextureToGraphicCard(tex, false);

        // Load shaders
        const colorShaderVertexSource = `#version 300 es

            precision mediump float;

            layout (location=0) in vec3 position;
            layout (location=1) in vec4 color;

            out vec4 varColor;

            uniform mat4 modelMat;
            uniform mat4 viewMat;
            uniform mat4 projMat;

            void main(void) {
                gl_Position = projMat * viewMat * modelMat * vec4(position, 1.0);
                varColor = color;
            }
        `;
        const colorShaderFragmentSource = `#version 300 es

            precision mediump float;

            in vec4 varColor;

            out vec4 fragColor;

            uniform mat4 modelMat;
            uniform mat4 viewMat;
            uniform mat4 projMat;

            void main(void) {
                if (varColor.w < 0.01) {
                    discard;
                }
                fragColor = varColor;
            }
        `;
        const colorShaderProgram = WebglUtils.loadShaderProgram(colorShaderVertexSource, colorShaderFragmentSource);
        const colorShader = WebglShader.create(colorShaderProgram);

        const sceneShaderVertexSource = `#version 300 es

            precision mediump float;
            precision mediump int;

            #define MAX_DIR_LIGHTS 3
            #define MAX_POINT_LIGHTS 10
            #define MAX_SPOT_LIGHTS 10
            #define MAX_SHADOW_MAPS 3

            struct ShadowMap {
                mat4 lightMat;
                int pcfType;
            };

            layout (location=0) in vec3 position1;
            layout (location=1) in vec3 position2;
            layout (location=2) in vec3 normal1;
            layout (location=3) in vec3 normal2;
            layout (location=4) in vec2 texCoord;

            out vec3 varFragPos;
            out vec3 varNormal;
            out vec2 varTexCoord;
            out vec4 varFragPosShadow[MAX_SHADOW_MAPS];

            uniform float t;
            uniform mat4 modelMat;
            uniform mat4 viewMat;
            uniform mat4 projMat;
            uniform mat3 normalMat;
            uniform vec3 viewPos;
            uniform int numShadowMaps;
            uniform ShadowMap shadowMaps[MAX_SHADOW_MAPS];

            void main(void) {
                vec3 position = (1.0 - t) * position1 + t * position2;
                vec3 normal = normalize((1.0 - t) * normal1 + t * normal2);
                gl_Position = projMat * viewMat * modelMat * vec4(position, 1.0);
                varFragPos = vec3(modelMat * vec4(position, 1.0));
                for(int i = 0; i < numShadowMaps; ++i) {
                    varFragPosShadow[i] = shadowMaps[i].lightMat * vec4(varFragPos, 1.0);
                }
                varNormal = normalMat * normal;
                varTexCoord = texCoord;
            }

        `;

        const sceneShaderFragmentSource = `#version 300 es

            precision mediump float;
            precision mediump int;

            #define MAX_DIR_LIGHTS 3
            #define MAX_POINT_LIGHTS 10
            #define MAX_SPOT_LIGHTS 10
            #define MAX_SHADOW_MAPS 3

            struct Material {
                vec3 ambient;
                vec3 diffuse;
                vec3 specular;
                float shininess;
            };

            struct DirLight {
                vec3 dir;
                vec3 ambient;
                vec3 diffuse;
                vec3 specular;
                int shadowMapIdx;
            };

            struct PointLight {
                vec3 pos;
                float range;

                float constAtt;
                float linAtt;
                float sqrAtt;

                vec3 ambient;
                vec3 diffuse;
                vec3 specular;
            };

            struct SpotLight {
                vec3  pos;
                vec3  dir;
                float cosInTh;
                float cosOutTh;
                float range;

                float constAtt;
                float linAtt;
                float sqrAtt;

                vec3 ambient;
                vec3 diffuse;
                vec3 specular;
                int shadowMapIdx;
            };    

            struct ShadowMap {
                mat4 lightMat;
                int pcfType;
            };

            in vec3 varFragPos;
            in vec3 varNormal;
            in vec2 varTexCoord;
            in vec4 varFragPosShadow[MAX_SHADOW_MAPS];

            out vec4 fragColor;

            uniform float t;
            uniform mat4 modelMat;
            uniform mat4 viewMat;
            uniform mat4 projMat;
            uniform mat3 normalMat;
            uniform vec3 viewPos;

            uniform int numDiffuseTextures;
            uniform int numSpecularTextures;
            uniform int numAlphaTextures;
            uniform int numShadowMaps;
            uniform ShadowMap shadowMaps[MAX_SHADOW_MAPS];
            uniform Material material;

            uniform sampler2D diffuseTexture1;
            uniform sampler2D diffuseTexture2;
            uniform sampler2D specularTexture1;
            uniform sampler2D specularTexture2;
            uniform sampler2D alphaTexture1;
            uniform sampler2D shadowTexture1;
            uniform sampler2D shadowTexture2;
            uniform sampler2D shadowTexture3;

            uniform int numDirLights;
            uniform DirLight dirLights[MAX_DIR_LIGHTS];

            uniform int numPointLights;
            uniform PointLight pointLights[MAX_POINT_LIGHTS];

            uniform int numSpotLights;
            uniform SpotLight spotLights[MAX_SPOT_LIGHTS];

            uniform float gamma;

            vec3 blendRgb(vec3 bottom, vec3 top, float alpha) {
                return (1.0 - alpha) * bottom + alpha * top;
            }

            vec3 getAmbient() {
                vec3 res = material.ambient;
                if (numDiffuseTextures > 0) {
                    vec4 tc = texture(diffuseTexture1, varTexCoord);
                    res = blendRgb(res, tc.rgb, tc.a);
                }
                if (numDiffuseTextures > 1) {
                    vec4 tc = texture(diffuseTexture2, varTexCoord);
                    res = blendRgb(res, tc.rgb, tc.a);
                }
                return res;
            }

            vec3 getDiffuse() {
                vec3 res = material.diffuse;
                if (numDiffuseTextures > 0) {
                    vec4 tc = texture(diffuseTexture1, varTexCoord);
                    res = blendRgb(res, tc.rgb, tc.a);
                }
                if (numDiffuseTextures > 1) {
                    vec4 tc = texture(diffuseTexture2, varTexCoord);
                    res = blendRgb(res, tc.rgb, tc.a);
                }
                return res;
            }

            vec3 getSpecular() {
                vec3 res = material.specular;
                if (numSpecularTextures > 0) {
                    vec4 tc = texture(specularTexture1, varTexCoord);
                    res = blendRgb(res, tc.rgb, tc.a);
                }
                if (numSpecularTextures > 1) {
                    vec4 tc = texture(specularTexture2, varTexCoord);
                    res = blendRgb(res, tc.rgb, tc.a);
                }
                return res;
            }

            float getAlpha() {
                float res = 1.0;
                if (numAlphaTextures > 0) {
                    vec4 tc = texture(alphaTexture1, varTexCoord);
                    res = tc.a;
                }
                return res;
            }

            vec3 getDirLightImpact(DirLight light, vec3 normal, vec3 viewDir, float shadow) {
                vec3 lightDir = normalize(-light.dir);

                // diffuse
                float diff = max(dot(normal, lightDir), 0.0);

                // specular
                vec3 reflectDir = reflect(-lightDir, normal);
                float reflectFact = max(dot(viewDir, reflectDir), 0.0);
                float spec = 0.0;
                if (reflectFact > 0.0 || material.shininess > 0.0) {
                    spec = pow(reflectFact, material.shininess);
                }

                // combine
                vec3 ambient  = light.ambient  * getAmbient();
                vec3 diffuse  = light.diffuse  * diff * getDiffuse();
                vec3 specular = light.specular * spec * getSpecular();
                return (ambient + (1.0 - shadow) * (diffuse + specular));
            }

            vec3 getPointLightImpact(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir) {
                float distance = length(light.pos - fragPos);
                if (distance > light.range) {
                    return vec3(0, 0, 0);
                }

                vec3 lightDir = normalize(light.pos - fragPos);

                // diffuse shading
                float diff = max(dot(normal, lightDir), 0.0);

                // specular shading
                vec3 reflectDir = reflect(-lightDir, normal);
                float reflectFact = max(dot(viewDir, reflectDir), 0.0);
                float spec = 0.0;
                if (reflectFact > 0.0 || material.shininess > 0.0) {
                    spec = pow(reflectFact, material.shininess);
                }

                // attenuation
                float attenuation = 1.0 / (light.constAtt + light.linAtt * distance + light.sqrAtt * (distance * distance));

                // combine
                vec3 ambient = light.ambient * getAmbient();
                vec3 diffuse = light.diffuse * diff * getDiffuse();
                vec3 specular = light.specular * spec * getSpecular();
                ambient *= attenuation;
                diffuse *= attenuation;
                specular *= attenuation;
                return (ambient + diffuse + specular);
            }

            vec3 getSpotLightImpact(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir, float shadow) {
                float distance = length(light.pos - fragPos);
                if (distance > light.range) {
                    return vec3(0, 0, 0);
                }

                vec3 lightDir = normalize(light.pos - fragPos);

                // diffuse shading
                float diff = max(dot(normal, lightDir), 0.0);

                // specular shading
                vec3 reflectDir = reflect(-lightDir, normal);
                float reflectFact = max(dot(viewDir, reflectDir), 0.0);
                float spec = 0.0;
                if (reflectFact > 0.0 || material.shininess > 0.0) {
                    spec = pow(reflectFact, material.shininess);
                }

                // attenuation
                float attenuation = 1.0 / (light.constAtt + light.linAtt * distance + light.sqrAtt * (distance * distance));

                // spotlight intensity
                float theta = dot(-lightDir, normalize(light.dir)); 
                float epsilon = light.cosInTh - light.cosOutTh;
                float intensity = clamp((theta - light.cosOutTh) / epsilon, 0.0, 1.0);

                // combine results
                vec3 ambient = light.ambient * getAmbient();
                vec3 diffuse = light.diffuse * diff * getDiffuse();
                vec3 specular = light.specular * spec * getSpecular();
                ambient *= attenuation * intensity;
                diffuse *= attenuation * intensity;
                specular *= attenuation * intensity;
                return (ambient + (1.0 - shadow) * (diffuse + specular));
            }

            float shadowCalc(vec4 fragPosLightSpace, int shadowTexIdx, float bias) {
                // perform perspective divide
                vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
                // transform to [0,1] range
                projCoords = projCoords * 0.5 + 0.5;

                float shadow = 1.0;

                if (shadowTexIdx == 0) {
                    float pcfDepth = texture(shadowTexture1, projCoords.xy).r;
                    shadow = projCoords.z - bias > pcfDepth  ? 1.0 : 0.0;
                }
                else if (shadowTexIdx == 1) {
                    float pcfDepth = texture(shadowTexture2, projCoords.xy).r;
                    shadow = projCoords.z - bias > pcfDepth  ? 1.0 : 0.0;
                }
                else if (shadowTexIdx == 2) {
                    float pcfDepth = texture(shadowTexture3, projCoords.xy).r;
                    shadow = projCoords.z - bias > pcfDepth  ? 1.0 : 0.0;
                }

                return shadow;
            }

            void main(void) {
                vec3 norm = normalize(varNormal);
                vec3 viewDir = normalize(viewPos - varFragPos);

                vec3 fc = vec3(0, 0, 0);

                for(int i = 0; i < numDirLights; ++i) {
                    float shadow = 0.0;
                    int smidx = dirLights[i].shadowMapIdx;
                    if (smidx != -1) {
                        vec3 lightDir = normalize(-dirLights[i].dir);
                        float bias = max(0.01 * (1.0 - dot(norm, lightDir)), 0.005);
                        shadow = shadowCalc(varFragPosShadow[smidx], smidx, bias);
                    }
                    fc += getDirLightImpact(dirLights[i], norm, viewDir, shadow);
                }
                for(int i = 0; i < numPointLights; ++i) {
                    fc += getPointLightImpact(pointLights[i], norm, varFragPos, viewDir);
                }
                for(int i = 0; i < numSpotLights; ++i) {
                    float shadow = 0.0;
                    int smidx = spotLights[i].shadowMapIdx;
                    if (smidx != -1) {
                        vec3 lightDir = normalize(spotLights[i].pos - varFragPos);
                        float bias = max(0.01 * (1.0 - dot(norm, lightDir)), 0.005);
                        shadow = shadowCalc(varFragPosShadow[smidx], smidx, bias);
                    }
                    fc += getSpotLightImpact(spotLights[i], norm, varFragPos, viewDir, shadow);
                }
                float alpha = getAlpha();
                if (alpha < 0.01) {
                    discard;
                }
                fragColor = vec4(pow(fc.rgb, vec3(1.0/gamma)), alpha);
            }

        `;
        const sceneShaderProgram = WebglUtils.loadShaderProgram(sceneShaderVertexSource, sceneShaderFragmentSource);
        const sceneShader = WebglShader.create(sceneShaderProgram);

        const shadowMapShaderVertexSource = `#version 300 es

            precision mediump float;

            layout (location=0) in vec3 position1;
            layout (location=1) in vec3 position2;

            uniform float t;
            uniform mat4 modelMat;
            uniform mat4 lightMat;

            void main(void) {
                vec3 position = (1.0 - t) * position1 + t * position2;
                gl_Position = lightMat * modelMat * vec4(position, 1.0);
            }
        `;
        const shadowMapShaderFragmentSource = `#version 300 es

            precision mediump float;

            void main(void) {
            }
        `;
        const shadowMapShaderProgram = WebglUtils.loadShaderProgram(shadowMapShaderVertexSource, shadowMapShaderFragmentSource);
        const shadowMapShader = WebglShader.create(shadowMapShaderProgram);

        // TODO - uncomment
        /*
         const spriteShader = WebglShader.create(
         WebglUtils.loadShaderProgram(
         this.loader,
         "resource:shader/sprite-vertex.glsl",
         "resource:shader/sprite-fragment.glsl"
         )
         );
         const sceneShader = WebglShader.create(
         WebglUtils.loadShaderProgram(
         this.loader,
         "resource:shader/scene-vertex.glsl",
         "resource:shader/scene-fragment.glsl"
         )
         );
         */

        // TODO - uncomment other shaders
        this.shaders.push(colorShader, sceneShader, shadowMapShader); //spriteShader);

        // Create renderers
        this.renderers.put("ColorRenderer", WebglColorRenderer.create(this, colorShader));
        this.renderers.put("SceneRenderer", WebglSceneRenderer.create(this.assetBank, this, sceneShader, this.defaultTexture));
        this.renderers.put("ShadowMapRenderer", WebglShadowMapRenderer.create(this, shadowMapShader));
        // TODO - uncomment
        //this.renderers.set("WebGLSpriteRenderer"", WebGLSpriteRenderer.create(this, this.spriteRectMesh, spriteShader));
        // this.renderers.set("WebGLUiRenderer", WebGLUiRenderer.create(this, this.spriteRectMesh, spriteShader, this.primitivesMesh, colorShader));
        // this.renderers.set("WebGLBufferDebugRenderer", WebGLBufferDebugRenderer.create(this, this.debugRectMesh, colorShader));
    }

    /**
     * Returns current screen viewport.
     */
    getScreenViewport() {
        return this.screenViewport;
    }

    /**
     * Sets screen viewport.
     * 
     * @param {Viewport} screenViewport screen viewport
     */
    setScreenViewport(screenViewport) {
        this.screenViewport = screenViewport;
    }

    /**
     * Loads mesh too the driver.
     * 
     * @param {MeshId} id mesh identifier
     * @param {Mesg} mesh mesh
     */
    loadMesh(id, mesh) {
        if (this.meshes.containsKey(id)) {
            throw "id is already taken: " + id;
        }
        let ref = this.pushMeshToGraphicCard(mesh);
        this.meshes.put(id, ref);
    }

    /**
     * Disposes mesh from the driver.
     * 
     * @param {MeshId} id mesh identifier
     */
    disposeMesh(id) {
        let ptr = this.meshes.remove(id);
        if (ptr === null) {
            return;
        }
        disposeMeshFromGraphicCard(ptr);
    }

    /**
     * Returns mesh ids.
     * 
     * @returns {Set of MeshId} mesh ids
     */
    getMeshes() {
        return Dut.copySet(this.meshes.keySet());
    }

    /**
     * Loads texture into a driver.
     * 
     * @param {TextureId} id identifier
     * @param {Texture} texture texture
     * @param {mipmap} mipmap whether to do mipmap ow not
     */
    loadTexture(id, texture, mipmap) {
        const ref = this.pushTextureToGraphicCard(texture, mipmap);
        this.textures.put(id, ref);
    }

    /**
     * Returns texrure ids.
     * 
     * @returns {Set of TextureId} texture ids
     */
    getTextures() {
        return Dut.copySet(this.textures.keySet());
    }

    /**
     * Returns shadow buffer ids.
     * 
     * @returns {Set of ShadowBufferId} shadow buffer ids
     */
    getShadowBuffers() {
        return Dut.copySet(this.shadowBuffers.keySet());
    }

    /**
     * Pushes mesh to graphics card.
     * 
     * @param {Mesh} mesh mesh
     * @returns {WebglMeshRef} mesh reference
     */
    pushMeshToGraphicCard(mesh) {
        let attrs = mesh.getVertexAttrs();
        let varr = new Float32Array(this.getVertexArray(mesh));
        let iarr = new Uint32Array(this.getIndexArray(mesh));
        let vbuf = null;
        let ibuf = null;
        let vao = null;

        try {
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            vbuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
            gl.bufferData(gl.ARRAY_BUFFER, varr, gl.STATIC_DRAW);

            ibuf = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iarr, gl.STATIC_DRAW);

            gl.bindVertexArray(null);
        } catch (e) {
            console.error(e);
            if (vao !== null) {
                gl.deleteVertexArray(vao)
            }
            if (vbuf !== null) {
                gl.deleteBuffer(vbuf);
            }
            if (ibuf !== null) {
                gl.deleteBuffer(ibuf);
            }
            throw "error during pushin mesh to the driver";
        }
        return WebglMeshRef.create(vbuf, ibuf, vao, attrs, iarr.length);
    }

    /**
     * Pushes texture to graphics card.
     * 
     * @param {Texture} texture texture
     * @param {mipmap} mipmap whether to do mipmap ow not
     * @returns {WebglMeshRef} texture reference
     * 
     */
    pushTextureToGraphicCard(texture, mipmap) {
        const ptr = gl.createTexture();
        let arr = new Float32Array(texture.getBuf());

        gl.bindTexture(gl.TEXTURE_2D, ptr);

        if (texture.getChannels().equals(Texture.RGB)) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, texture.getWidth(), texture.getHeight(), 0, gl.RGB, gl.FLOAT, arr);
        } else if (texture.getChannels().equals(Texture.RGBA)) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, texture.getWidth(), texture.getHeight(), 0, gl.RGBA, gl.FLOAT, arr);
        } else {
            throw "unsupported texture channels: " + texture;
        }

        if (mipmap) {
            // Currently mipmaps are not working. Leaving them up until I can figure out how to make them work.
            // gl.generateMipmap(gl.TEXTURE_2D);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        return WebglTextureRef.create(ptr, texture);
    }

    /**
     * Returns vertex array. 
     * 
     * @param {Mesh} mesh
     * @returns {Array} array with vertex dara
     */
    getVertexArray(mesh) {
        let num = mesh.getNumVertices();
        let s = mesh.getVertexSize();
        let res = [];
        for (let i = 0; i < num; ++i) {
            let v = mesh.getVertex(i);
            for (let j = 0; j < s; ++j) {
                res[i * s + j] = v.coord(j);
            }
        }
        return res;
    }

    /**
     * Returns index array.
     *
     * @param {Mesh} mesh mesh
     * @return index array
     */
    getIndexArray(mesh) {
        let res = [];
        for (let i = 0; i < mesh.getNumFaces(); ++i) {
            let f = mesh.getFace(i);
            res[i * 3] = f.getIndices().get(0);
            res[i * 3 + 1] = f.getIndices().get(1);
            res[i * 3 + 2] = f.getIndices().get(2);
        }
        return res;
    }

    /**
     * Creates shadow buffer.
     * 
     * @param {ShadowBufferId} id identifier
     * @param {ShadowBuffer} shadowBuffer shadow buffer
     * @returns {WebglShadowBufferRef} shadow buffer reference
     */
    createShadowBuffer(id, shadowBuffer) {
        const framebuffer = gl.createFramebuffer();

        // Create depth texture
        const depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, shadowBuffer.getWidth(), shadowBuffer.getHeight(), 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Attach depth texture to framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

        gl.drawBuffers([gl.NONE]);
        gl.readBuffer(gl.NONE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // Check framebuffer status
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            throw "shadow framebuffer is not complete: " + status;
        }

        this.shadowBuffers.put(id, WebglShadowBufferRef.create(framebuffer, depthTexture, 0, shadowBuffer.getWidth(), shadowBuffer.getHeight()));
    }

    /**
     * Disposes mesh from graphics card.
     * 
     * @param {WebglMeshRed} meshRef mesh reference
     */
    disposeMeshFromGraphicCard(meshRef) {
        if (!meshRef) {
            return;
        }

        gl.deleteBuffer(meshRef.vbo);
        gl.deleteBuffer(meshRef.ebo);
        gl.deleteVertexArray(meshRef.vao);
    }

    /**
     * Disposes texture from graphics card.
     */
    disposeTextureFromGraphicCard(textureRef) {
        if (!textureRef) {
            return;
        }
        gl.deleteTexture(textureRef.textureId);
    }

    /**
     * Disposes shadow buffer from graphics card.
     */
    disposeShadowBufferFromGraphicCard(shadowBufferRef) {
        if (!shadowBufferRef) {
            return;
        }
        gl.deleteTexture(shadowBufferRef.depthTexture);
        gl.deleteFramebuffer(shadowBufferRef.framebuffer);
    }

    /**
     * Clears buffers.
     */
    clearBuffers(...buffers) {
        for (const buf of buffers) {
            if (buf === BufferId.COLOR) {
                gl.clearColor(0, 0, 0, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);
            } else if (buf === BufferId.DEPTH) {
                gl.clear(gl.DEPTH_BUFFER_BIT);
            } else {
                throw new Error(`unknown buffer: ${buf}`);
            }
        }
    }

    /**
     * Starts a renderer.
     */
    startRenderer(rendererClass, environment) {
        if (!this.renderers.containsKey(rendererClass)) {
            throw `unsupported renderer class: ${rendererClass}`;
        }

        const renderer = this.renderers.get(rendererClass);
        renderer.start(environment);
        return renderer;
    }

    /**
     * Closes the driver. This cleans up everything.
     */
    close() {
        // Dispose all meshes
        for (const [id, mesh] of this.meshes) {
            this.disposeMesh(id);
        }

        // Dispose special meshes
        this.disposeMeshFromGraphicCard(this.spriteRectMesh);
        this.spriteRectMesh = null;
        this.disposeMeshFromGraphicCard(this.debugRectMesh);
        this.debugRectMesh = null;
        this.disposeMeshFromGraphicCard(this.primitivesMesh);
        this.primitivesMesh = null;
        this.disposeTextureFromGraphicCard(this.defaultTexture);
        this.defaultTexture = null;

        // Dispose all textures
        for (const [id, texture] of this.textures) {
            this.disposeTexture(id);
        }

        // Dispose all shadow buffers
        for (const [id, shadowBuffer] of this.shadowBuffers) {
            this.disposeShadowBuffer(id);
        }

        // Delete shaders
        for (const shader of this.shaders) {
            shader.deleteProgram();
        }
        this.shaders = [];
    }

    /**
     * Returns mesh reference.
     */
    getMeshRef(id) {
        return this.meshes.get(id);
    }

    /**
     * Returns texture reference.
     */
    getTextureRef(id) {
        return this.textures.get(id);
    }

    /**
     * Returns shadow buffer reference.
     */
    getShadowBufferRef(id) {
        return this.shadowBuffers.get(id);
    }

    /**
     * Creates new instance.
     * 
     * @param {AssetBank} assetBank
     * @returns {WebglGraphicsDriver} graphics driver
     */
    static create(assetBank) {
        const res = new WebglGraphicsDriver();
        res.assetBank = assetBank;
        res.guardInvariants();
        return res;
    }
}
/**
 * Web GL Graphics Driver. This class manages shaders and renderes.
 * Assumes WebGL context 'gl' is available globally.
 */
class WebAudioDriver {
    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
    }

    /**
     * Returns sound ids.
     * 
     * @returns {Set of SoundId} sound ids
     */
    getSounds() {
        return new HashSet();
    }

    /**
     * Creates new instance.
     */
    static create() {
        const res = new WebAudioDriver();
        res.guardInvariants();
        return res;
    }
}


// -------------------------------------
// Framework portion
// -------------------------------------

/**
 * Provider for Tyracorn drivers.
 */
class DriverProvider {

    assetBank = DefaultAssetBank.create();
    assetLoader = WebAssetLoader.create();
    executor = AsyncTaskExecutor.create();
    assetManager = WebAssetManager.create(this, this.executor, this.assetLoader, this.assetBank);
    graphicsDriver = WebglGraphicsDriver.create(this.assetManager);
    audioDriver = WebAudioDriver.create();

    constructor() {
    }

    /**
     * Returns whether specified driver is available or not.
     * If this method returns true, then implementation is responsible to provide the driver.
     * If this method returns false, then attempt to get the driver will fail by exception.
     *
     * @param driver driver to provide as string
     * @return true if driver is available, false otherwise
     */
    isDriverAvailable(driver) {
        if (driver === "GraphicsDriver") {
            return true;
        } else if (driver === "AudioDriver") {
            return true;
        } else if (driver === "AssetManager") {
            return true;
        }
        return false;
    }

    /**
     * Returns the driver of a given type.
     *
     * @param driver driver to provide as string
     * @return driver instance
     */
    getDriver(driver) {
        if (driver === "GraphicsDriver") {
            return this.graphicsDriver;
        } else if (driver === "AudioDriver") {
            return this.audioDriver;
        } else if (driver === "AssetManager") {
            return this.assetManager;
        }
        throw "driver doesn't exists:" + driver;
        return null;
    }
}


// -------------------------------------
// Translated framework code
// -------------------------------------

class Vec3 {
  static ZERO = Vec3.create(0, 0, 0);
  static RIGHT = Vec3.create(1, 0, 0);
  static LEFT = Vec3.create(-1, 0, 0);
  static UP = Vec3.create(0, 1, 0);
  static DOWN = Vec3.create(0, -1, 0);
  static FORWARD = Vec3.create(0, 0, 1);
  static BACKWARD = Vec3.create(0, 0, -1);
  mX;
  mY;
  mZ;
  constructor() {
  }

  getClass() {
    return "Vec3";
  }

  x() {
    return this.mX;
  }

  y() {
    return this.mY;
  }

  z() {
    return this.mZ;
  }

  mag() {
    return FMath.sqrt(this.mX*this.mX+this.mY*this.mY+this.mZ*this.mZ);
  }

  sqrMag() {
    return this.mX*this.mX+this.mY*this.mY+this.mZ*this.mZ;
  }

  normalize() {
    let m = this.mag();
    return Vec3.create(this.mX/m, this.mY/m, this.mZ/m);
  }

  scale(s) {
    return Vec3.create(this.mX*s, this.mY*s, this.mZ*s);
  }

  add() {
    if (arguments.length===1&&arguments[0] instanceof Vec3) {
      return this.add_1_Vec3(arguments[0]);
    }
    else if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return this.add_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw "error";
    }
  }

  add_1_Vec3(vec) {
    return Vec3.create(this.mX+vec.mX, this.mY+vec.mY, this.mZ+vec.mZ);
  }

  add_3_number_number_number(dx, dy, dz) {
    return Vec3.create(this.mX+dx, this.mY+dy, this.mZ+dz);
  }

  addScaled(vec, s) {
    return Vec3.create(this.mX+vec.mX*s, this.mY+vec.mY*s, this.mZ+vec.mZ*s);
  }

  sub(vec) {
    return Vec3.create(this.mX-vec.mX, this.mY-vec.mY, this.mZ-vec.mZ);
  }

  subScaled(vec, s) {
    return Vec3.create(this.mX-vec.mX*s, this.mY-vec.mY*s, this.mZ-vec.mZ*s);
  }

  subAndScale(vec, s) {
    let dx = this.mX-vec.mX;
    let dy = this.mY-vec.mY;
    let dz = this.mZ-vec.mZ;
    return Vec3.create(dx*s, dy*s, dz*s);
  }

  subAndNormalize(vec) {
    let dx = this.mX-vec.mX;
    let dy = this.mY-vec.mY;
    let dz = this.mZ-vec.mZ;
    let m = FMath.sqrt(dx*dx+dy*dy+dz*dz);
    return Vec3.create(dx/m, dy/m, dz/m);
  }

  dot(vec) {
    return this.mX*vec.mX+this.mY*vec.mY+this.mZ*vec.mZ;
  }

  dist(vec) {
    let dx = this.mX-vec.mX;
    let dy = this.mY-vec.mY;
    let dz = this.mZ-vec.mZ;
    return FMath.sqrt(dx*dx+dy*dy+dz*dz);
  }

  sqrDist(vec) {
    let dx = this.mX-vec.mX;
    let dy = this.mY-vec.mY;
    let dz = this.mZ-vec.mZ;
    return dx*dx+dy*dy+dz*dz;
  }

  homogenize() {
    return Vec4.create(this.mX, this.mY, this.mZ, 1);
  }

  dehomogenize() {
    return Vec2.create(this.mX/this.mZ, this.mY/this.mZ);
  }

  hashCode() {
    return this.mX+13*this.mY+17*this.mZ;
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Vec3)) {
      return false;
    }
    let ob = obj;
    return ob.mX==this.mX&&ob.mY==this.mY&&ob.mZ==this.mZ;
  }

  toString() {
  }

  static create(x, y, z) {
    let res = new Vec3();
    res.mX = x;
    res.mY = y;
    res.mZ = z;
    return res;
  }

  static diagonal(a) {
    let res = new Vec3();
    res.mX = a;
    res.mY = a;
    res.mZ = a;
    return res;
  }

  static cross(a, b) {
    return Vec3.create(a.mY*b.mZ-a.mZ*b.mY, a.mZ*b.mX-a.mX*b.mZ, a.mX*b.mY-a.mY*b.mX);
  }

  static interpolate(a, b, t) {
    let ti = 1-t;
    return Vec3.create(ti*a.mX+t*b.mX, ti*a.mY+t*b.mY, ti*a.mZ+t*b.mZ);
  }

}
class Vec4 {
  mX;
  mY;
  mZ;
  mW;
  constructor() {
  }

  getClass() {
    return "Vec4";
  }

  x() {
    return this.mX;
  }

  y() {
    return this.mY;
  }

  z() {
    return this.mZ;
  }

  w() {
    return this.mW;
  }

  mag() {
    return FMath.sqrt(this.mX*this.mX+this.mY*this.mY+this.mZ*this.mZ+this.mW*this.mW);
  }

  normalize() {
    let m = this.mag();
    return Vec4.create(this.mX/m, this.mY/m, this.mZ/m, this.mW/m);
  }

  scale(s) {
    return Vec4.create(this.mX*s, this.mY*s, this.mZ*s, this.mW*s);
  }

  add(vec) {
    return Vec4.create(this.mX+vec.mX, this.mY+vec.mY, this.mZ+vec.mZ, this.mW+vec.mW);
  }

  sub(vec) {
    return Vec4.create(this.mX-vec.mX, this.mY-vec.mY, this.mZ-vec.mZ, this.mW-vec.mW);
  }

  dot(vec) {
    return this.mX*vec.mX+this.mY*vec.mY+this.mZ*vec.mZ+this.mW*vec.mW;
  }

  dist(vec) {
    let dx = this.mX-vec.mX;
    let dy = this.mY-vec.mY;
    let dz = this.mZ-vec.mZ;
    let dw = this.mW-vec.mW;
    return FMath.sqrt(dx*dx+dy*dy+dz*dz+dw*dw);
  }

  dehomogenize() {
    return Vec3.create(this.mX/this.mW, this.mY/this.mW, this.mZ/this.mW);
  }

  hashCode() {
    return this.mX+13*this.mY+17*this.mZ+19*this.mW;
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Vec4)) {
      return false;
    }
    let ob = obj;
    return ob.mX==this.mX&&ob.mY==this.mY&&ob.mZ==this.mZ&&ob.mW==this.mW;
  }

  toString() {
  }

  static create(x, y, z, w) {
    let res = new Vec4();
    res.mX = x;
    res.mY = y;
    res.mZ = z;
    res.mW = w;
    return res;
  }

}
class Mat33 {
  static ZERO = Mat33.create(0, 0, 0, 0, 0, 0, 0, 0, 0);
  static IDENTITY = Mat33.create(1, 0, 0, 0, 1, 0, 0, 0, 1);
  mm00;
  mm01;
  mm02;
  mm10;
  mm11;
  mm12;
  mm20;
  mm21;
  mm22;
  constructor() {
  }

  getClass() {
    return "Mat33";
  }

  m00() {
    return this.mm00;
  }

  m01() {
    return this.mm01;
  }

  m02() {
    return this.mm02;
  }

  m10() {
    return this.mm10;
  }

  m11() {
    return this.mm11;
  }

  m12() {
    return this.mm12;
  }

  m20() {
    return this.mm20;
  }

  m21() {
    return this.mm21;
  }

  m22() {
    return this.mm22;
  }

  col(idx) {
    if (idx==0) {
      return Vec3.create(this.mm00, this.mm10, this.mm20);
    }
    else if (idx==1) {
      return Vec3.create(this.mm01, this.mm11, this.mm21);
    }
    else if (idx==2) {
      return Vec3.create(this.mm02, this.mm12, this.mm22);
    }
    else {
      throw "idx can be only 0, 1 or 2: "+idx;
    }
  }

  det() {
    let v1 = (this.mm11*this.mm22-this.mm12*this.mm21)*this.mm00;
    let v2 = (this.mm01*this.mm22-this.mm02*this.mm21)*this.mm10;
    let v3 = (this.mm01*this.mm12-this.mm02*this.mm11)*this.mm20;
    return v1-v2+v3;
  }

  add(mat) {
    return Mat33.create(this.mm00+mat.mm00, this.mm01+mat.mm01, this.mm02+mat.mm02, this.mm10+mat.mm10, this.mm11+mat.mm11, this.mm12+mat.mm12, this.mm20+mat.mm20, this.mm21+mat.mm21, this.mm22+mat.mm22);
  }

  inv() {
    let determinant = this.det();
    if (FMath.abs(determinant)<1e-9) {
      throw "matrix inversion doesn't exists: "+this;
    }
    let res = new Mat33();
    res.mm00 = (this.mm11*this.mm22-this.mm21*this.mm12)/determinant;
    res.mm01 = (this.mm21*this.mm02-this.mm01*this.mm22)/determinant;
    res.mm02 = (this.mm01*this.mm12-this.mm11*this.mm02)/determinant;
    res.mm10 = (this.mm20*this.mm12-this.mm10*this.mm22)/determinant;
    res.mm11 = (this.mm00*this.mm22-this.mm20*this.mm02)/determinant;
    res.mm12 = (this.mm10*this.mm02-this.mm00*this.mm12)/determinant;
    res.mm20 = (this.mm10*this.mm21-this.mm20*this.mm11)/determinant;
    res.mm21 = (this.mm20*this.mm01-this.mm00*this.mm21)/determinant;
    res.mm22 = (this.mm00*this.mm11-this.mm10*this.mm01)/determinant;
    return res;
  }

  transpose() {
    let res = new Mat33();
    res.mm00 = this.mm00;
    res.mm01 = this.mm10;
    res.mm02 = this.mm20;
    res.mm10 = this.mm01;
    res.mm11 = this.mm11;
    res.mm12 = this.mm21;
    res.mm20 = this.mm02;
    res.mm21 = this.mm12;
    res.mm22 = this.mm22;
    return res;
  }

  mulel(x) {
    return Mat33.create(this.mm00*x, this.mm01*x, this.mm02*x, this.mm10*x, this.mm11*x, this.mm12*x, this.mm20*x, this.mm21*x, this.mm22*x);
  }

  mul() {
    if (arguments.length===1&&arguments[0] instanceof Vec3) {
      return this.mul_1_Vec3(arguments[0]);
    }
    else if (arguments.length===1&&arguments[0] instanceof Mat33) {
      return this.mul_1_Mat33(arguments[0]);
    }
    else if (arguments.length===1&&arguments[0] instanceof Mat34) {
      return this.mul_1_Mat34(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  mul_1_Vec3(vec) {
    let x = vec.x()*this.mm00+vec.y()*this.mm01+vec.z()*this.mm02;
    let y = vec.x()*this.mm10+vec.y()*this.mm11+vec.z()*this.mm12;
    let z = vec.x()*this.mm20+vec.y()*this.mm21+vec.z()*this.mm22;
    return Vec3.create(x, y, z);
  }

  mul_1_Mat33(right) {
    let res = new Mat33();
    res.mm00 = this.mm00*right.mm00+this.mm01*right.mm10+this.mm02*right.mm20;
    res.mm01 = this.mm00*right.mm01+this.mm01*right.mm11+this.mm02*right.mm21;
    res.mm02 = this.mm00*right.mm02+this.mm01*right.mm12+this.mm02*right.mm22;
    res.mm10 = this.mm10*right.mm00+this.mm11*right.mm10+this.mm12*right.mm20;
    res.mm11 = this.mm10*right.mm01+this.mm11*right.mm11+this.mm12*right.mm21;
    res.mm12 = this.mm10*right.mm02+this.mm11*right.mm12+this.mm12*right.mm22;
    res.mm20 = this.mm20*right.mm00+this.mm21*right.mm10+this.mm22*right.mm20;
    res.mm21 = this.mm20*right.mm01+this.mm21*right.mm11+this.mm22*right.mm21;
    res.mm22 = this.mm20*right.mm02+this.mm21*right.mm12+this.mm22*right.mm22;
    return res;
  }

  mul_1_Mat34(right) {
    return Mat34.create(this.mm00*right.m00()+this.mm01*right.m10()+this.mm02*right.m20(), this.mm00*right.m01()+this.mm01*right.m11()+this.mm02*right.m21(), this.mm00*right.m02()+this.mm01*right.m12()+this.mm02*right.m22(), this.mm00*right.m03()+this.mm01*right.m13()+this.mm02*right.m23(), this.mm10*right.m00()+this.mm11*right.m10()+this.mm12*right.m20(), this.mm10*right.m01()+this.mm11*right.m11()+this.mm12*right.m21(), this.mm10*right.m02()+this.mm11*right.m12()+this.mm12*right.m22(), this.mm10*right.m03()+this.mm11*right.m13()+this.mm12*right.m23(), this.mm20*right.m00()+this.mm21*right.m10()+this.mm22*right.m20(), this.mm20*right.m01()+this.mm21*right.m11()+this.mm22*right.m21(), this.mm20*right.m02()+this.mm21*right.m12()+this.mm22*right.m22(), this.mm20*right.m03()+this.mm21*right.m13()+this.mm22*right.m23());
  }

  toBufCol(buf) {
    buf[0] = this.mm00;
    buf[1] = this.mm10;
    buf[2] = this.mm20;
    buf[3] = this.mm01;
    buf[4] = this.mm11;
    buf[5] = this.mm21;
    buf[6] = this.mm02;
    buf[7] = this.mm12;
    buf[8] = this.mm22;
    return buf;
  }

  hashCode() {
    return this.mm00+13*this.mm01+17*this.mm02+23*this.mm10+29*this.mm11+31*this.mm12+41*this.mm20+43*this.mm21+47*this.mm22;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    else if (!(obj instanceof Mat33)) {
      return false;
    }
    let ob = obj;
    return ob.mm00==this.mm00&&ob.mm01==this.mm01&&ob.mm02==this.mm02&&ob.mm10==this.mm10&&ob.mm11==this.mm11&&ob.mm12==this.mm12&&ob.mm20==this.mm20&&ob.mm21==this.mm21&&ob.mm22==this.mm22;
  }

  toString() {
  }

  static create(m00, m01, m02, m10, m11, m12, m20, m21, m22) {
    let res = new Mat33();
    res.mm00 = m00;
    res.mm01 = m01;
    res.mm02 = m02;
    res.mm10 = m10;
    res.mm11 = m11;
    res.mm12 = m12;
    res.mm20 = m20;
    res.mm21 = m21;
    res.mm22 = m22;
    return res;
  }

  static diagonal(m) {
    let res = new Mat33();
    res.mm00 = m;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm10 = 0;
    res.mm11 = m;
    res.mm12 = 0;
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = m;
    return res;
  }

  static rotX(a) {
    let res = new Mat33();
    res.mm00 = 1;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm10 = 0;
    res.mm11 = FMath.cos(a);
    res.mm12 = -FMath.sin(a);
    res.mm20 = 0;
    res.mm21 = FMath.sin(a);
    res.mm22 = FMath.cos(a);
    return res;
  }

  static rotY(a) {
    let res = new Mat33();
    res.mm00 = FMath.cos(a);
    res.mm01 = 0;
    res.mm02 = FMath.sin(a);
    res.mm10 = 0;
    res.mm11 = 1;
    res.mm12 = 0;
    res.mm20 = -FMath.sin(a);
    res.mm21 = 0;
    res.mm22 = FMath.cos(a);
    return res;
  }

  static rotZ(a) {
    let res = new Mat33();
    res.mm00 = FMath.cos(a);
    res.mm01 = -FMath.sin(a);
    res.mm02 = 0;
    res.mm10 = FMath.sin(a);
    res.mm11 = FMath.cos(a);
    res.mm12 = 0;
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = 1;
    return res;
  }

  static rot(q) {
    let bb = q.b()*q.b();
    let cc = q.c()*q.c();
    let dd = q.d()*q.d();
    let res = new Mat33();
    res.mm00 = 1-2*cc-2*dd;
    res.mm01 = 2*q.b()*q.c()-2*q.d()*q.a();
    res.mm02 = 2*q.b()*q.d()+2*q.c()*q.a();
    res.mm10 = 2*q.b()*q.c()+2*q.d()*q.a();
    res.mm11 = 1-2*bb-2*dd;
    res.mm12 = 2*q.c()*q.d()-2*q.b()*q.a();
    res.mm20 = 2*q.b()*q.d()-2*q.c()*q.a();
    res.mm21 = 2*q.c()*q.d()+2*q.b()*q.a();
    res.mm22 = 1-2*bb-2*cc;
    return res;
  }

  static scale() {
    if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return Mat33.scale_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="number") {
      return Mat33.scale_1_number(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  static scale_3_number_number_number(sx, sy, sz) {
    let res = new Mat33();
    res.mm00 = sx;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm10 = 0;
    res.mm11 = sy;
    res.mm12 = 0;
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = sz;
    return res;
  }

  static scale_1_number(s) {
    let res = new Mat33();
    res.mm00 = s;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm10 = 0;
    res.mm11 = s;
    res.mm12 = 0;
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = s;
    return res;
  }

}
class Mat44 {
  static IDENTITY = Mat44.create(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  mm00;
  mm01;
  mm02;
  mm03;
  mm10;
  mm11;
  mm12;
  mm13;
  mm20;
  mm21;
  mm22;
  mm23;
  mm30;
  mm31;
  mm32;
  mm33;
  constructor() {
  }

  getClass() {
    return "Mat44";
  }

  m00() {
    return this.mm00;
  }

  m01() {
    return this.mm01;
  }

  m02() {
    return this.mm02;
  }

  m03() {
    return this.mm03;
  }

  m10() {
    return this.mm10;
  }

  m11() {
    return this.mm11;
  }

  m12() {
    return this.mm12;
  }

  m13() {
    return this.mm13;
  }

  m20() {
    return this.mm20;
  }

  m21() {
    return this.mm21;
  }

  m22() {
    return this.mm22;
  }

  m23() {
    return this.mm23;
  }

  m30() {
    return this.mm30;
  }

  m31() {
    return this.mm31;
  }

  m32() {
    return this.mm32;
  }

  m33() {
    return this.mm33;
  }

  mul() {
    if (arguments.length===1&&arguments[0] instanceof Vec4) {
      return this.mul_1_Vec4(arguments[0]);
    }
    else if (arguments.length===1&&arguments[0] instanceof Vec3) {
      return this.mul_1_Vec3(arguments[0]);
    }
    else if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return this.mul_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else if (arguments.length===1&&arguments[0] instanceof Mat44) {
      return this.mul_1_Mat44(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  mul_1_Vec4(vec) {
    let x = vec.x()*this.mm00+vec.y()*this.mm01+vec.z()*this.mm02+vec.w()*this.mm03;
    let y = vec.x()*this.mm10+vec.y()*this.mm11+vec.z()*this.mm12+vec.w()*this.mm13;
    let z = vec.x()*this.mm20+vec.y()*this.mm21+vec.z()*this.mm22+vec.w()*this.mm23;
    let w = vec.x()*this.mm30+vec.y()*this.mm31+vec.z()*this.mm32+vec.w()*this.mm33;
    return Vec4.create(x, y, z, w);
  }

  mul_1_Vec3(vec) {
    let x = vec.x()*this.mm00+vec.y()*this.mm01+vec.z()*this.mm02+this.mm03;
    let y = vec.x()*this.mm10+vec.y()*this.mm11+vec.z()*this.mm12+this.mm13;
    let z = vec.x()*this.mm20+vec.y()*this.mm21+vec.z()*this.mm22+this.mm23;
    let w = vec.x()*this.mm30+vec.y()*this.mm31+vec.z()*this.mm32+this.mm33;
    return Vec3.create(x/w, y/w, z/w);
  }

  mul_3_number_number_number(x, y, z) {
    let nx = x*this.mm00+y*this.mm01+z*this.mm02+this.mm03;
    let ny = x*this.mm10+y*this.mm11+z*this.mm12+this.mm13;
    let nz = x*this.mm20+y*this.mm21+z*this.mm22+this.mm23;
    let nw = x*this.mm30+y*this.mm31+z*this.mm32+this.mm33;
    return Vec3.create(nx/nw, ny/nw, nz/nw);
  }

  mul_1_Mat44(right) {
    let res = new Mat44();
    res.mm00 = this.mm00*right.mm00+this.mm01*right.mm10+this.mm02*right.mm20+this.mm03*right.mm30;
    res.mm01 = this.mm00*right.mm01+this.mm01*right.mm11+this.mm02*right.mm21+this.mm03*right.mm31;
    res.mm02 = this.mm00*right.mm02+this.mm01*right.mm12+this.mm02*right.mm22+this.mm03*right.mm32;
    res.mm03 = this.mm00*right.mm03+this.mm01*right.mm13+this.mm02*right.mm23+this.mm03*right.mm33;
    res.mm10 = this.mm10*right.mm00+this.mm11*right.mm10+this.mm12*right.mm20+this.mm13*right.mm30;
    res.mm11 = this.mm10*right.mm01+this.mm11*right.mm11+this.mm12*right.mm21+this.mm13*right.mm31;
    res.mm12 = this.mm10*right.mm02+this.mm11*right.mm12+this.mm12*right.mm22+this.mm13*right.mm32;
    res.mm13 = this.mm10*right.mm03+this.mm11*right.mm13+this.mm12*right.mm23+this.mm13*right.mm33;
    res.mm20 = this.mm20*right.mm00+this.mm21*right.mm10+this.mm22*right.mm20+this.mm23*right.mm30;
    res.mm21 = this.mm20*right.mm01+this.mm21*right.mm11+this.mm22*right.mm21+this.mm23*right.mm31;
    res.mm22 = this.mm20*right.mm02+this.mm21*right.mm12+this.mm22*right.mm22+this.mm23*right.mm32;
    res.mm23 = this.mm20*right.mm03+this.mm21*right.mm13+this.mm22*right.mm23+this.mm23*right.mm33;
    res.mm30 = this.mm30*right.mm00+this.mm31*right.mm10+this.mm32*right.mm20+this.mm33*right.mm30;
    res.mm31 = this.mm30*right.mm01+this.mm31*right.mm11+this.mm32*right.mm21+this.mm33*right.mm31;
    res.mm32 = this.mm30*right.mm02+this.mm31*right.mm12+this.mm32*right.mm22+this.mm33*right.mm32;
    res.mm33 = this.mm30*right.mm03+this.mm31*right.mm13+this.mm32*right.mm23+this.mm33*right.mm33;
    return res;
  }

  det() {
    let d1 = this.mm11*this.mm22*this.mm33+this.mm12*this.mm23*this.mm31+this.mm13*this.mm21*this.mm32-this.mm13*this.mm22*this.mm31-this.mm12*this.mm21*this.mm33-this.mm11*this.mm23*this.mm32;
    let d2 = this.mm01*this.mm22*this.mm33+this.mm02*this.mm23*this.mm31+this.mm03*this.mm21*this.mm32-this.mm03*this.mm22*this.mm31-this.mm02*this.mm21*this.mm33-this.mm01*this.mm23*this.mm32;
    let d3 = this.mm01*this.mm12*this.mm33+this.mm02*this.mm13*this.mm31+this.mm03*this.mm11*this.mm32-this.mm03*this.mm12*this.mm31-this.mm02*this.mm11*this.mm33-this.mm01*this.mm13*this.mm32;
    let d4 = this.mm01*this.mm12*this.mm23+this.mm02*this.mm13*this.mm21+this.mm03*this.mm11*this.mm22-this.mm03*this.mm12*this.mm21-this.mm02*this.mm11*this.mm23-this.mm01*this.mm13*this.mm22;
    return this.mm00*d1-this.mm10*d2+this.mm20*d3-this.mm30*d4;
  }

  inv() {
    let determinant = this.det();
    if (FMath.abs(determinant)<1e-9) {
      throw "matrix inversion doesn't exists: "+this;
    }
    let res = new Mat44();
    res.mm00 = (this.mm11*this.mm22*this.mm33+this.mm12*this.mm23*this.mm31+this.mm13*this.mm21*this.mm32-this.mm13*this.mm22*this.mm31-this.mm12*this.mm21*this.mm33-this.mm11*this.mm23*this.mm32)/determinant;
    res.mm01 = (-this.mm01*this.mm22*this.mm33-this.mm02*this.mm23*this.mm31-this.mm03*this.mm21*this.mm32+this.mm03*this.mm22*this.mm31+this.mm02*this.mm21*this.mm33+this.mm01*this.mm23*this.mm32)/determinant;
    res.mm02 = (this.mm01*this.mm12*this.mm33+this.mm02*this.mm13*this.mm31+this.mm03*this.mm11*this.mm32-this.mm03*this.mm12*this.mm31-this.mm02*this.mm11*this.mm33-this.mm01*this.mm13*this.mm32)/determinant;
    res.mm03 = (-this.mm01*this.mm12*this.mm23-this.mm02*this.mm13*this.mm21-this.mm03*this.mm11*this.mm22+this.mm03*this.mm12*this.mm21+this.mm02*this.mm11*this.mm23+this.mm01*this.mm13*this.mm22)/determinant;
    res.mm10 = (-this.mm10*this.mm22*this.mm33-this.mm12*this.mm23*this.mm30-this.mm13*this.mm20*this.mm32+this.mm13*this.mm22*this.mm30+this.mm12*this.mm20*this.mm33+this.mm10*this.mm23*this.mm32)/determinant;
    res.mm11 = (this.mm00*this.mm22*this.mm33+this.mm02*this.mm23*this.mm30+this.mm03*this.mm20*this.mm32-this.mm03*this.mm22*this.mm30-this.mm02*this.mm20*this.mm33-this.mm00*this.mm23*this.mm32)/determinant;
    res.mm12 = (-this.mm00*this.mm12*this.mm33-this.mm02*this.mm13*this.mm30-this.mm03*this.mm10*this.mm32+this.mm03*this.mm12*this.mm30+this.mm02*this.mm10*this.mm33+this.mm00*this.mm13*this.mm32)/determinant;
    res.mm13 = (this.mm00*this.mm12*this.mm23+this.mm02*this.mm13*this.mm20+this.mm03*this.mm10*this.mm22-this.mm03*this.mm12*this.mm20-this.mm02*this.mm10*this.mm23-this.mm00*this.mm13*this.mm22)/determinant;
    res.mm20 = (this.mm10*this.mm21*this.mm33+this.mm11*this.mm23*this.mm30+this.mm13*this.mm20*this.mm31-this.mm13*this.mm21*this.mm30-this.mm11*this.mm20*this.mm33-this.mm10*this.mm23*this.mm31)/determinant;
    res.mm21 = (-this.mm00*this.mm21*this.mm33-this.mm01*this.mm23*this.mm30-this.mm03*this.mm20*this.mm31+this.mm03*this.mm21*this.mm30+this.mm01*this.mm20*this.mm33+this.mm00*this.mm23*this.mm31)/determinant;
    res.mm22 = (this.mm00*this.mm11*this.mm33+this.mm01*this.mm13*this.mm30+this.mm03*this.mm10*this.mm31-this.mm03*this.mm11*this.mm30-this.mm01*this.mm10*this.mm33-this.mm00*this.mm13*this.mm31)/determinant;
    res.mm23 = (-this.mm00*this.mm11*this.mm23-this.mm01*this.mm13*this.mm20-this.mm03*this.mm10*this.mm21+this.mm03*this.mm11*this.mm20+this.mm01*this.mm10*this.mm23+this.mm00*this.mm13*this.mm21)/determinant;
    res.mm30 = (-this.mm10*this.mm21*this.mm32-this.mm11*this.mm22*this.mm30-this.mm12*this.mm20*this.mm31+this.mm12*this.mm21*this.mm30+this.mm11*this.mm20*this.mm32+this.mm10*this.mm22*this.mm31)/determinant;
    res.mm31 = (this.mm00*this.mm21*this.mm32+this.mm01*this.mm22*this.mm30+this.mm02*this.mm20*this.mm31-this.mm02*this.mm21*this.mm30-this.mm01*this.mm20*this.mm32-this.mm00*this.mm22*this.mm31)/determinant;
    res.mm32 = (-this.mm00*this.mm11*this.mm32-this.mm01*this.mm12*this.mm30-this.mm02*this.mm10*this.mm31+this.mm02*this.mm11*this.mm30+this.mm01*this.mm10*this.mm32+this.mm00*this.mm12*this.mm31)/determinant;
    res.mm33 = (this.mm00*this.mm11*this.mm22+this.mm01*this.mm12*this.mm20+this.mm02*this.mm10*this.mm21-this.mm02*this.mm11*this.mm20-this.mm01*this.mm10*this.mm22-this.mm00*this.mm12*this.mm21)/determinant;
    return res;
  }

  toBufCol(buf) {
    buf[0] = this.mm00;
    buf[1] = this.mm10;
    buf[2] = this.mm20;
    buf[3] = this.mm30;
    buf[4] = this.mm01;
    buf[5] = this.mm11;
    buf[6] = this.mm21;
    buf[7] = this.mm31;
    buf[8] = this.mm02;
    buf[9] = this.mm12;
    buf[10] = this.mm22;
    buf[11] = this.mm32;
    buf[12] = this.mm03;
    buf[13] = this.mm13;
    buf[14] = this.mm23;
    buf[15] = this.mm33;
    return buf;
  }

  hashCode() {
    return this.mm00+13*this.mm01+17*this.mm02+19*this.mm03+23*this.mm10+29*this.mm11+31*this.mm12+37*this.mm13+41*this.mm20+43*this.mm21+47*this.mm22+53*this.mm23+59*this.mm30+61*this.mm31+67*this.mm32+71*this.mm33;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    else if (obj==this) {
      return true;
    }
    else if (!(obj instanceof Mat44)) {
      return false;
    }
    let ob = obj;
    return ob.mm00==this.mm00&&ob.mm01==this.mm01&&ob.mm02==this.mm02&&ob.mm03==this.mm03&&ob.mm10==this.mm10&&ob.mm11==this.mm11&&ob.mm12==this.mm12&&ob.mm13==this.mm13&&ob.mm20==this.mm20&&ob.mm21==this.mm21&&ob.mm22==this.mm22&&ob.mm23==this.mm23&&ob.mm30==this.mm30&&ob.mm31==this.mm31&&ob.mm32==this.mm32&&ob.mm33==this.mm33;
  }

  toString() {
  }

  static create(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
    let res = new Mat44();
    res.mm00 = m00;
    res.mm01 = m01;
    res.mm02 = m02;
    res.mm03 = m03;
    res.mm10 = m10;
    res.mm11 = m11;
    res.mm12 = m12;
    res.mm13 = m13;
    res.mm20 = m20;
    res.mm21 = m21;
    res.mm22 = m22;
    res.mm23 = m23;
    res.mm30 = m30;
    res.mm31 = m31;
    res.mm32 = m32;
    res.mm33 = m33;
    return res;
  }

  static trans() {
    if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return Mat44.trans_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else if (arguments.length===1&&arguments[0] instanceof Vec3) {
      return Mat44.trans_1_Vec3(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  static trans_3_number_number_number(tx, ty, tz) {
    let res = new Mat44();
    res.mm00 = 1;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm03 = tx;
    res.mm10 = 0;
    res.mm11 = 1;
    res.mm12 = 0;
    res.mm13 = ty;
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = 1;
    res.mm23 = tz;
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

  static trans_1_Vec3(v) {
    let res = new Mat44();
    res.mm00 = 1;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm03 = v.x();
    res.mm10 = 0;
    res.mm11 = 1;
    res.mm12 = 0;
    res.mm13 = v.y();
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = 1;
    res.mm23 = v.z();
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

  static rotX(a) {
    let res = new Mat44();
    res.mm00 = 1;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm03 = 0;
    res.mm10 = 0;
    res.mm11 = FMath.cos(a);
    res.mm12 = -FMath.sin(a);
    res.mm13 = 0;
    res.mm20 = 0;
    res.mm21 = FMath.sin(a);
    res.mm22 = FMath.cos(a);
    res.mm23 = 0;
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

  static rotY(a) {
    let res = new Mat44();
    res.mm00 = FMath.cos(a);
    res.mm01 = 0;
    res.mm02 = FMath.sin(a);
    res.mm03 = 0;
    res.mm10 = 0;
    res.mm11 = 1;
    res.mm12 = 0;
    res.mm13 = 0;
    res.mm20 = -FMath.sin(a);
    res.mm21 = 0;
    res.mm22 = FMath.cos(a);
    res.mm23 = 0;
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

  static rotZ(a) {
    let res = new Mat44();
    res.mm00 = FMath.cos(a);
    res.mm01 = -FMath.sin(a);
    res.mm02 = 0;
    res.mm03 = 0;
    res.mm10 = FMath.sin(a);
    res.mm11 = FMath.cos(a);
    res.mm12 = 0;
    res.mm13 = 0;
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = 1;
    res.mm23 = 0;
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

  static rot(q) {
    let bb = q.b()*q.b();
    let cc = q.c()*q.c();
    let dd = q.d()*q.d();
    let res = new Mat44();
    res.mm00 = 1-2*cc-2*dd;
    res.mm01 = 2*q.b()*q.c()-2*q.d()*q.a();
    res.mm02 = 2*q.b()*q.d()+2*q.c()*q.a();
    res.mm03 = 0;
    res.mm10 = 2*q.b()*q.c()+2*q.d()*q.a();
    res.mm11 = 1-2*bb-2*dd;
    res.mm12 = 2*q.c()*q.d()-2*q.b()*q.a();
    res.mm13 = 0;
    res.mm20 = 2*q.b()*q.d()-2*q.c()*q.a();
    res.mm21 = 2*q.c()*q.d()+2*q.b()*q.a();
    res.mm22 = 1-2*bb-2*cc;
    res.mm23 = 0;
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

  static scale() {
    if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return Mat44.scale_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="number") {
      return Mat44.scale_1_number(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  static scale_3_number_number_number(sx, sy, sz) {
    let res = new Mat44();
    res.mm00 = sx;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm03 = 0;
    res.mm10 = 0;
    res.mm11 = sy;
    res.mm12 = 0;
    res.mm13 = 0;
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = sz;
    res.mm23 = 0;
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

  static scale_1_number(s) {
    let res = new Mat44();
    res.mm00 = s;
    res.mm01 = 0;
    res.mm02 = 0;
    res.mm03 = 0;
    res.mm10 = 0;
    res.mm11 = s;
    res.mm12 = 0;
    res.mm13 = 0;
    res.mm20 = 0;
    res.mm21 = 0;
    res.mm22 = s;
    res.mm23 = 0;
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

  static transofm(v, q) {
    let bb = q.b()*q.b();
    let cc = q.c()*q.c();
    let dd = q.d()*q.d();
    let res = new Mat44();
    res.mm00 = 1-2*cc-2*dd;
    res.mm01 = 2*q.b()*q.c()-2*q.d()*q.a();
    res.mm02 = 2*q.b()*q.d()+2*q.c()*q.a();
    res.mm03 = v.x();
    res.mm10 = 2*q.b()*q.c()+2*q.d()*q.a();
    res.mm11 = 1-2*bb-2*dd;
    res.mm12 = 2*q.c()*q.d()-2*q.b()*q.a();
    res.mm13 = v.y();
    res.mm20 = 2*q.b()*q.d()-2*q.c()*q.a();
    res.mm21 = 2*q.c()*q.d()+2*q.b()*q.a();
    res.mm22 = 1-2*bb-2*cc;
    res.mm23 = v.z();
    res.mm30 = 0;
    res.mm31 = 0;
    res.mm32 = 0;
    res.mm33 = 1;
    return res;
  }

}
class Size2 {
  mWidth;
  mHeight;
  constructor() {
  }

  getClass() {
    return "Size2";
  }

  guardInvariants() {
  }

  width() {
    return this.mWidth;
  }

  height() {
    return this.mHeight;
  }

  aspect() {
    return this.mWidth/this.mHeight;
  }

  scale(s) {
    return Size2.create(this.mWidth*s, this.mHeight*s);
  }

  hashCode() {
    return (this.mWidth*13+this.mHeight*31);
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Size2)) {
      return false;
    }
    let that = obj;
    return this.mWidth==that.mWidth&&this.mHeight==that.mHeight;
  }

  toString() {
  }

  static create(width, height) {
    let res = new Size2();
    res.mWidth = width;
    res.mHeight = height;
    res.guardInvariants();
    return res;
  }

}
class Rect2 {
  mPos;
  mSize;
  constructor() {
  }

  getClass() {
    return "Rect2";
  }

  guardInvariants() {
  }

  x() {
    return this.mPos.x();
  }

  y() {
    return this.mPos.y();
  }

  width() {
    return this.mSize.width();
  }

  height() {
    return this.mSize.height();
  }

  centerX() {
    return this.mPos.x()+this.mSize.width()/2;
  }

  centerY() {
    return this.mPos.y()+this.mSize.height()/2;
  }

  center() {
    return Pos2.create(this.centerX(), this.centerY());
  }

  pos() {
    return this.mPos;
  }

  size() {
    return this.mSize;
  }

  move(d) {
    return Rect2.create(this.mPos.move(d), this.mSize);
  }

  isInside() {
    if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return this.isInside_2_number_number(arguments[0], arguments[1]);
    }
    else if (arguments.length===1&&arguments[0] instanceof Pos2) {
      return this.isInside_1_Pos2(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  isInside_2_number_number(px, py) {
    return px>=this.mPos.x()&&px<=(this.mPos.x()+this.mSize.width())&&py>=this.mPos.y()&&py<=(this.mPos.y()+this.mSize.height());
  }

  isInside_1_Pos2(pos) {
    return this.isInside(pos.x(), pos.y());
  }

  isIntersect(other) {
    let maxX = this.mPos.x()+this.mSize.width();
    let maxY = this.mPos.y()+this.mSize.height();
    let otherMaxX = other.mPos.x()+other.mSize.width();
    let otherMaxY = other.mPos.y()+other.mSize.height();
    return !(this.mPos.x()>otherMaxX||maxX<other.mPos.x()||this.mPos.y()>otherMaxY||maxY<other.mPos.y());
  }

  intersect(other) {
    let maxX = this.mPos.x()+this.mSize.width();
    let maxY = this.mPos.y()+this.mSize.height();
    let otherMaxX = other.mPos.x()+other.mSize.width();
    let otherMaxY = other.mPos.y()+other.mSize.height();
    let nx = FMath.max(this.mPos.x(), other.mPos.x());
    let ny = FMath.max(this.mPos.y(), other.mPos.y());
    return Rect2.create(nx, ny, FMath.min(maxX, otherMaxX)-nx, FMath.min(maxY, otherMaxY));
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create() {
    if (arguments.length===4&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number"&& typeof arguments[3]==="number") {
      return Rect2.create_4_number_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else if (arguments.length===2&&arguments[0] instanceof Pos2&&arguments[1] instanceof Size2) {
      return Rect2.create_2_Pos2_Size2(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  static create_4_number_number_number_number(x, y, width, height) {
    let res = new Rect2();
    res.mPos = Pos2.create(x, y);
    res.mSize = Size2.create(width, height);
    res.guardInvariants();
    return res;
  }

  static create_2_Pos2_Size2(pos, size) {
    let res = new Rect2();
    res.mPos = pos;
    res.mSize = size;
    res.guardInvariants();
    return res;
  }

}
class Quaternion {
  static ZERO_ROT = Quaternion.create(1, 0, 0, 0);
  mA;
  mB;
  mC;
  mD;
  constructor() {
  }

  getClass() {
    return "Quaternion";
  }

  a() {
    return this.mA;
  }

  b() {
    return this.mB;
  }

  c() {
    return this.mC;
  }

  d() {
    return this.mD;
  }

  mag() {
    return FMath.sqrt(this.mA*this.mA+this.mB*this.mB+this.mC*this.mC+this.mD*this.mD);
  }

  normalize() {
    let m = this.mag();
    return Quaternion.create(this.mA/m, this.mB/m, this.mC/m, this.mD/m);
  }

  conj() {
    return Quaternion.create(this.mA, -this.mB, -this.mC, -this.mD);
  }

  scale(s) {
    return Quaternion.create(this.mA*s, this.mB*s, this.mC*s, this.mD*s);
  }

  add(quat) {
    return Quaternion.create(this.mA+quat.mA, this.mB+quat.mB, this.mC+quat.mC, this.mD+quat.mD);
  }

  sub(quat) {
    return Quaternion.create(this.mA-quat.mA, this.mB-quat.mB, this.mC-quat.mC, this.mD-quat.mD);
  }

  dist(quat) {
    let da = this.mA-quat.mA;
    let db = this.mB-quat.mB;
    let dc = this.mC-quat.mC;
    let dd = this.mD-quat.mD;
    return FMath.sqrt(da*da+db*db+dc*dc+dd*dd);
  }

  mul(quat) {
    let res = new Quaternion();
    res.mA = this.mA*quat.mA-this.mB*quat.mB-this.mC*quat.mC-this.mD*quat.mD;
    res.mB = this.mA*quat.mB+this.mB*quat.mA+this.mC*quat.mD-this.mD*quat.mC;
    res.mC = this.mA*quat.mC-this.mB*quat.mD+this.mC*quat.mA+this.mD*quat.mB;
    res.mD = this.mA*quat.mD+this.mB*quat.mC-this.mC*quat.mB+this.mD*quat.mA;
    return res;
  }

  rotate(pt) {
    let pq = Quaternion.create(0, pt.x(), pt.y(), pt.z());
    let r = this.mul(pq.mul(this.conj()));
    return Vec3.create(r.b(), r.c(), r.d());
  }

  hashCode() {
    return this.mA+13*this.mB+17*this.mC+19*this.mD;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    else if (!(obj instanceof Quaternion)) {
      return false;
    }
    let ob = obj;
    return ob.mA==this.mA&&ob.mB==this.mB&&ob.mC==this.mC&&ob.mD==this.mD;
  }

  toString() {
  }

  static create(a, b, c, d) {
    let res = new Quaternion();
    res.mA = a;
    res.mB = b;
    res.mC = c;
    res.mD = d;
    return res;
  }

  static rot() {
    if (arguments.length===4&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number"&& typeof arguments[3]==="number") {
      return Quaternion.rot_4_number_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else if (arguments.length===2&&arguments[0] instanceof Vec3&& typeof arguments[1]==="number") {
      return Quaternion.rot_2_Vec3_number(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  static rot_4_number_number_number_number(x, y, z, theta) {
    let sth = FMath.sin(theta/2);
    let res = new Quaternion();
    res.mA = FMath.cos(theta/2);
    res.mB = x*sth;
    res.mC = y*sth;
    res.mD = z*sth;
    return res;
  }

  static rot_2_Vec3_number(axis, theta) {
    return Quaternion.rot(axis.x(), axis.y(), axis.z(), theta);
  }

  static rotX(theta) {
    return Quaternion.rot(1, 0, 0, theta);
  }

  static rotY(theta) {
    return Quaternion.rot(0, 1, 0, theta);
  }

  static rotZ(theta) {
    return Quaternion.rot(0, 0, 1, theta);
  }

}
class RefIdType {
  mType;
  constructor() {
  }

  getClass() {
    return "RefIdType";
  }

  guardInvariants() {
  }

  type() {
    return this.mType;
  }

  hashCode() {
    return this.mType.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof RefIdType)) {
      return false;
    }
    let other = obj;
    return other.mType.equals(this.mType);
  }

  toString() {
  }

  static of(type) {
    let res = new RefIdType();
    res.mType = type;
    res.guardInvariants();
    return res;
  }

}
class Path {
  path;
  constructor() {
  }

  getClass() {
    return "Path";
  }

  guardInvariants() {
  }

  getPath() {
    return this.path;
  }

  startsWith(str) {
    return this.path.startsWith(str);
  }

  getName() {
    let pth = this.path;
    if (pth.contains(":")) {
      pth = pth.substring(pth.lastIndexOf(":")+1);
    }
    if (pth.equals("")||pth.equals("/")) {
      return null;
    }
    let parts = pth.split("/");
    return parts[parts.length-1];
  }

  getPlainName() {
    let name = this.getName();
    if (name==null||!name.contains(".")) {
      return name;
    }
    return name.substring(0, name.lastIndexOf("."));
  }

  getExtension() {
    let name = this.getName();
    if (name==null) {
      return name;
    }
    if (name.contains(".")) {
      return name.substring(name.lastIndexOf(".")+1);
    }
    return "";
  }

  getParent() {
    let prefix = "";
    let pth = this.path;
    if (pth.contains(":")) {
      prefix = pth.substring(0, pth.lastIndexOf(":")+1);
      pth = pth.substring(pth.lastIndexOf(":")+1);
    }
    if (pth.equals("")||pth.equals("/")) {
      return null;
    }
    let parts = pth.split("/");
    let bld = new StringBuilder();
    for (let i = 0; i<parts.length-1; ++i) {
      if (StringUtils.isEmpty(parts[i])) {
        continue;
      }
      bld.append(parts[i]);
      if (i<parts.length-2) {
        bld.append("/");
      }
    }
    let str = bld.toString();
    if (pth.startsWith("/")) {
      str = "/"+str;
    }
    return Path.of(prefix+str);
  }

  getChild(name) {
    Guard.beFalse(name.startsWith("/"), "child name must be relative");
    let prefix = "";
    let pth = this.path;
    if (pth.contains(":")) {
      prefix = pth.substring(0, pth.lastIndexOf(":")+1);
      pth = pth.substring(pth.lastIndexOf(":")+1);
    }
    if (pth.equals("")||pth.equals("/")) {
      return Path.of(prefix+pth+name);
    }
    return Path.of(prefix+pth+"/"+name);
  }

  hashCode() {
    return this.path.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (obj==this) {
      return true;
    }
    if (obj instanceof Path) {
      let other = obj;
      return this.path.equals(other.path);
    }
    else {
      return false;
    }
  }

  toString() {
  }

  static of(path) {
    let res = new Path();
    res.path = Path.normalize(path);
    res.guardInvariants();
    return res;
  }

  static normalize(str) {
    if (str.contains(":")) {
      let before = str.substring(0, str.lastIndexOf(":")+1);
      let after = str.substring(str.lastIndexOf(":")+1);
      after = Path.normalize(after);
      return before+after;
    }
    str = StringUtils.trimToEmpty(str);
    while (str.endsWith("/")&&str.length()>1) {
      str = str.substring(0, str.length()-1);
    }
    return str;
  }

}
class Rgb {
  static RED = Rgb.create(1, 0, 0);
  static GREEN = Rgb.create(0, 1, 0);
  static BLUE = Rgb.create(0, 0, 1);
  static WHITE = Rgb.create(1, 1, 1);
  static BLACK = Rgb.create(0, 0, 0);
  static YELLOW = Rgb.create(1, 1, 0);
  static PURPLE = Rgb.create(0.5, 0, 0.5);
  static CYAN = Rgb.create(0, 1, 1);
  static NAVY = Rgb.create(0, 0, 0.5);
  static OLIVE = Rgb.create(0.5, 0.5, 0);
  mR;
  mG;
  mB;
  constructor() {
  }

  getClass() {
    return "Rgb";
  }

  r() {
    return this.mR;
  }

  g() {
    return this.mG;
  }

  b() {
    return this.mB;
  }

  scale(s) {
    return Rgb.create(this.mR*s, this.mG*s, this.mB*s);
  }

  hashCode() {
    return this.mR+13*this.mG+17*this.mB;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    else if (!(obj instanceof Rgb)) {
      return false;
    }
    let ob = obj;
    return ob.mR==this.mR&&ob.mG==this.mG&&ob.mB==this.mB;
  }

  toString() {
  }

  static create(r, g, b) {
    let res = new Rgb();
    res.mR = r;
    res.mG = g;
    res.mB = b;
    return res;
  }

  static gray(x) {
    let res = new Rgb();
    res.mR = x;
    res.mG = x;
    res.mB = x;
    return res;
  }

}
class Rgba {
  static TRANSPARENT = Rgba.create(0, 0, 0, 0);
  static RED = Rgba.create(1, 0, 0, 1);
  static GREEN = Rgba.create(0, 1, 0, 1);
  static BLUE = Rgba.create(0, 0, 1, 1);
  static WHITE = Rgba.create(1, 1, 1, 1);
  static BLACK = Rgba.create(0, 0, 0, 1);
  static YELLOW = Rgba.create(1, 1, 0, 1);
  mR;
  mG;
  rB;
  rA;
  constructor() {
  }

  getClass() {
    return "Rgba";
  }

  r() {
    return this.mR;
  }

  g() {
    return this.mG;
  }

  b() {
    return this.rB;
  }

  a() {
    return this.rA;
  }

  toRgb() {
    return Rgb.create(this.mR, this.mG, this.rB);
  }

  toBuf(buf) {
    buf[0] = this.mR;
    buf[1] = this.mG;
    buf[2] = this.rB;
    buf[3] = this.rA;
    return buf;
  }

  hashCode() {
    return this.mR+13*this.mG+17*this.rB+19*this.rA;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    else if (!(obj instanceof Rgba)) {
      return false;
    }
    let ob = obj;
    return ob.mR==this.mR&&ob.mG==this.mG&&ob.rB==this.rB&&ob.rA==this.rA;
  }

  toString() {
  }

  static create(r, g, b, a) {
    let res = new Rgba();
    res.mR = r;
    res.mG = g;
    res.rB = b;
    res.rA = a;
    return res;
  }

  static gray(x) {
    let res = new Rgba();
    res.mR = x;
    res.mG = x;
    res.rB = x;
    res.rA = 1;
    return res;
  }

}
const createTextureChannel = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const TextureChannel = Object.freeze({
  RED: createTextureChannel("RED"),
  GREEN: createTextureChannel("GREEN"),
  BLUE: createTextureChannel("BLUE"),
  ALPHA: createTextureChannel("ALPHA")
});
class Texture {
  static RGB = Dut.immutableList(TextureChannel.RED, TextureChannel.GREEN, TextureChannel.BLUE);
  static RGBA = Dut.immutableList(TextureChannel.RED, TextureChannel.GREEN, TextureChannel.BLUE, TextureChannel.ALPHA);
  channels;
  width;
  height;
  buf;
  constructor() {
  }

  getClass() {
    return "Texture";
  }

  guardInvaritants() {
    Guard.notNullCollection(this.channels, "channels cannot have a null element");
    Guard.positive(this.width, "width must be positive");
    Guard.positive(this.height, "height must be positive");
    Guard.notNull(this.buf, "buf cannot be null");
    Guard.beTrue(this.buf.length==this.channels.size()*this.width*this.height, "buf.lenght must be equal to numChannels * width * height");
  }

  getChannels() {
    return this.channels;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getBuf() {
    return Arrays.copyOf(this.buf, this.buf.length);
  }

  getBufValue(idx) {
    return this.buf[idx];
  }

  flipVert() {
    let rbuf = [];
    let pxsize = this.channels.size();
    for (let y = 0; y<this.height; ++y) {
      for (let x = 0; x<this.width; ++x) {
        let srcStart = (y*this.width+x)*pxsize;
        let dstStart = ((this.height-1-y)*this.width+x)*pxsize;
        for (let i = 0; i<pxsize; ++i) {
          rbuf[dstStart+i] = this.buf[srcStart+i];
        }
      }
    }
    return Texture.create(this.channels, this.width, this.height, rbuf);
  }

  crop(x, y, w, h) {
    let rbuf = [];
    for (let iy = 0,idx=0; iy<h; ++iy) {
      for (let ix = 0; ix<w; ++ix) {
        for (let i = 0; i<this.channels.size(); ++i,++idx) {
          rbuf[idx] = this.buf[((y+iy)*this.width+x+ix)*this.channels.size()+i];
        }
      }
    }
    return Texture.create(this.channels, w, h, rbuf);
  }

  powRgb(p) {
    let rbuf = [];
    let pxsize = this.channels.size();
    let idx = 0;
    for (let y = 0; y<this.height; ++y) {
      for (let x = 0; x<this.width; ++x) {
        for (let i = 0; i<pxsize; ++i,++idx) {
          if (this.channels.get(i).equals(TextureChannel.RED)||this.channels.get(i).equals(TextureChannel.GREEN)||this.channels.get(i).equals(TextureChannel.BLUE)) {
            rbuf[idx] = FMath.pow(this.buf[idx], p);
          }
          else {
            rbuf[idx] = this.buf[idx];
          }
        }
      }
    }
    return Texture.create(this.channels, this.width, this.height, rbuf);
  }

  isCompatible(other) {
    if (!this.channels.equals(other.channels)) {
      return false;
    }
    if (this.width!=other.width) {
      return false;
    }
    if (this.height!=other.height) {
      return false;
    }
    return true;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(channels, width, height, ...buf) {
    if (Array.isArray(buf)&&buf.length===1&&Array.isArray(buf[0])) {
      buf = buf[0];
    }
    let res = new Texture();
    res.channels = Dut.copyImmutableList(channels);
    res.width = width;
    res.height = height;
    res.buf = Arrays.copyOf(buf, buf.length);
    res.guardInvaritants();
    return res;
  }

  static rgbFloatBuffer(width, height, ...buf) {
    if (Array.isArray(buf)&&buf.length===1&&Array.isArray(buf[0])) {
      buf = buf[0];
    }
    let res = new Texture();
    res.channels = Texture.RGB;
    res.width = width;
    res.height = height;
    res.buf = Arrays.copyOf(buf, buf.length);
    res.guardInvaritants();
    return res;
  }

  static rgbPixels(width, height, ...pixels) {
    if (Array.isArray(pixels)&&pixels.length===1&&Array.isArray(pixels[0])) {
      pixels = pixels[0];
    }
    let res = new Texture();
    res.channels = Texture.RGB;
    res.width = width;
    res.height = height;
    res.buf = [];
    for (let i = 0,idx=0; i<pixels.length; ++i) {
      let p = pixels[i];
      res.buf[idx++] = p.r();
      res.buf[idx++] = p.g();
      res.buf[idx++] = p.b();
    }
    res.guardInvaritants();
    return res;
  }

  static rgbaFloatBuffer(width, height, ...buf) {
    if (Array.isArray(buf)&&buf.length===1&&Array.isArray(buf[0])) {
      buf = buf[0];
    }
    let res = new Texture();
    res.channels = Texture.RGBA;
    res.width = width;
    res.height = height;
    res.buf = Arrays.copyOf(buf, buf.length);
    res.guardInvaritants();
    return res;
  }

  static rgbaPixels(width, height, ...pixels) {
    if (Array.isArray(pixels)&&pixels.length===1&&Array.isArray(pixels[0])) {
      pixels = pixels[0];
    }
    let res = new Texture();
    res.channels = Texture.RGBA;
    res.width = width;
    res.height = height;
    res.buf = [];
    for (let i = 0,idx=0; i<pixels.length; ++i) {
      let p = pixels[i];
      res.buf[idx++] = p.r();
      res.buf[idx++] = p.g();
      res.buf[idx++] = p.b();
      res.buf[idx++] = p.a();
    }
    res.guardInvaritants();
    return res;
  }

  static rgbConstant(width, height, color) {
    let res = new Texture();
    res.channels = Texture.RGB;
    res.width = width;
    res.height = height;
    res.buf = [];
    for (let i = 0,idx=0; i<width*height; ++i) {
      res.buf[idx++] = color.r();
      res.buf[idx++] = color.g();
      res.buf[idx++] = color.b();
    }
    res.guardInvaritants();
    return res;
  }

  static rgbaConstant(width, height, color) {
    let res = new Texture();
    res.channels = Texture.RGBA;
    res.width = width;
    res.height = height;
    res.buf = [];
    for (let i = 0,idx=0; i<width*height; ++i) {
      res.buf[idx++] = color.r();
      res.buf[idx++] = color.g();
      res.buf[idx++] = color.b();
      res.buf[idx++] = color.a();
    }
    res.guardInvaritants();
    return res;
  }

}
class TextureId extends RefId {
  static TYPE = RefIdType.of("TEXTURE_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "TextureId";
  }

  guardInvariants() {
  }

  type() {
    return TextureId.TYPE;
  }

  id() {
    return this.mId;
  }

  hashCode() {
    return this.mId.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof TextureId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new TextureId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
const createTextureType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const TextureType = Object.freeze({
  ALPHA: createTextureType("ALPHA"),
  DIFFUSE: createTextureType("DIFFUSE"),
  SPECULAR: createTextureType("SPECULAR")
});
class TextureAttachment {
  type;
  texture;
  style;
  constructor() {
  }

  getClass() {
    return "TextureAttachment";
  }

  guardInvariants() {
  }

  getType() {
    return this.type;
  }

  getTexture() {
    return this.texture;
  }

  getStyle() {
    return this.style;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(type, texture, style) {
    let res = new TextureAttachment();
    res.type = type;
    res.texture = texture;
    res.style = style;
    res.guardInvariants();
    return res;
  }

  static diffuse() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return TextureAttachment.diffuse_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return TextureAttachment.diffuse_1_string(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  static diffuse_1_TextureId(texture) {
    let res = new TextureAttachment();
    res.type = TextureType.DIFFUSE;
    res.texture = texture;
    res.style = TextureStyle.SMOOTH_REPEAT;
    res.guardInvariants();
    return res;
  }

  static diffuse_1_string(texture) {
    let res = new TextureAttachment();
    res.type = TextureType.DIFFUSE;
    res.texture = TextureId.of(texture);
    res.style = TextureStyle.SMOOTH_REPEAT;
    res.guardInvariants();
    return res;
  }

  static specular() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return TextureAttachment.specular_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return TextureAttachment.specular_1_string(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  static specular_1_TextureId(texture) {
    let res = new TextureAttachment();
    res.type = TextureType.SPECULAR;
    res.texture = texture;
    res.style = TextureStyle.SMOOTH_REPEAT;
    res.guardInvariants();
    return res;
  }

  static specular_1_string(texture) {
    let res = new TextureAttachment();
    res.type = TextureType.SPECULAR;
    res.texture = TextureId.of(texture);
    res.style = TextureStyle.SMOOTH_REPEAT;
    res.guardInvariants();
    return res;
  }

}
class TextureFncs {
  constructor() {
  }

  getClass() {
    return "TextureFncs";
  }

  static flipVertGamma(gamma) {
    return (tex) => {
      return tex.flipVert().powRgb(gamma);
    };
  }

  static flipVert() {
    return (tex) => {
      return tex.flipVert();
    };
  }

  static gamma(gamma) {
    return (tex) => {
      return tex.powRgb(gamma);
    };
  }

}
const createVertexAttrType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const VertexAttrType = Object.freeze({
  POS: createVertexAttrType("POS"),
  NORM: createVertexAttrType("NORM"),
  TEX: createVertexAttrType("TEX"),
  RGB: createVertexAttrType("RGB"),
  RGBA: createVertexAttrType("RGBA")
});
class VertexAttr {
  static POS2 = VertexAttr.create(VertexAttrType.POS, 2);
  static POS3 = VertexAttr.create(VertexAttrType.POS, 3);
  static NORM2 = VertexAttr.create(VertexAttrType.NORM, 2);
  static NORM3 = VertexAttr.create(VertexAttrType.NORM, 3);
  static RGB = VertexAttr.create(VertexAttrType.RGB, 3);
  static RGBA = VertexAttr.create(VertexAttrType.RGBA, 4);
  static TEX2 = VertexAttr.create(VertexAttrType.TEX, 2);
  static TEX3 = VertexAttr.create(VertexAttrType.TEX, 3);
  type;
  size;
  constructor() {
  }

  getClass() {
    return "VertexAttr";
  }

  guardInvariants() {
  }

  getType() {
    return this.type;
  }

  getSize() {
    return this.size;
  }

  hashCode() {
    return 5*this.type.hashCode()+13*this.size;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (this==obj) {
      return true;
    }
    if (obj instanceof VertexAttr) {
      let other = obj;
      return this.type.equals(other.type)&&(this.size==other.size);
    }
    return false;
  }

  toString() {
  }

  static create(type, size) {
    let res = new VertexAttr();
    res.type = type;
    res.size = size;
    res.guardInvariants();
    return res;
  }

}
class Vertex {
  buf;
  constructor() {
  }

  getClass() {
    return "Vertex";
  }

  guardInvariants() {
  }

  dim() {
    return this.buf.length;
  }

  coord(idx) {
    return this.buf[idx];
  }

  hashCode() {
    let res = 7;
    for (let i = 0; i<this.buf.length; ++i) {
      res = res+7*this.buf[i];
    }
    return res;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Vertex)) {
      return false;
    }
    let other = obj;
    if (this.buf.length!=other.buf.length) {
      return false;
    }
    for (let i = 0; i<this.buf.length; ++i) {
      if (this.buf[i]!=other.buf[i]) {
        return false;
      }
    }
    return true;
  }

  toString() {
  }

  static create(...buf) {
    if (Array.isArray(buf)&&buf.length===1&&Array.isArray(buf[0])) {
      buf = buf[0];
    }
    let res = new Vertex();
    res.buf = Arrays.copyOf(buf, buf.length);
    res.guardInvariants();
    return res;
  }

}
class Face {
  indices;
  constructor() {
  }

  getClass() {
    return "Face";
  }

  guardInvariants() {
  }

  getNumIndices() {
    return this.indices.size();
  }

  getIndices() {
    return this.indices;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static triangle(i1, i2, i3) {
    let res = new Face();
    res.indices = Dut.immutableList(i1, i2, i3);
    res.guardInvariants();
    return res;
  }

  static create(...idxs) {
    if (Array.isArray(idxs)&&idxs.length===1&&Array.isArray(idxs[0])) {
      idxs = idxs[0];
    }
    let res = new Face();
    let ilist = new ArrayList(idxs.length);
    for (let x of idxs) {
      ilist.add(x);
    }
    res.indices = Dut.copyImmutableList(ilist);
    res.guardInvariants();
    return res;
  }

}
class MaterialId extends RefId {
  static TYPE = RefIdType.of("MATERIAL_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "MaterialId";
  }

  guardInvariants() {
  }

  type() {
    return MaterialId.TYPE;
  }

  id() {
    return this.mId;
  }

  hashCode() {
    return this.mId.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof MaterialId)) {
      return false;
    }
    return (obj).this.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new MaterialId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
class MaterialBase {
  ambient;
  diffuse;
  specular;
  shininess;
  constructor() {
  }

  getClass() {
    return "MaterialBase";
  }

  guardInvaritants() {
    Guard.notNull(this.ambient, "ambient cannot be null");
    Guard.notNull(this.diffuse, "diffuse cannot be null");
    Guard.notNull(this.specular, "specular cannot be null");
  }

  getAmbient() {
    return this.ambient;
  }

  getDiffuse() {
    return this.diffuse;
  }

  getSpecular() {
    return this.specular;
  }

  getShininess() {
    return this.shininess;
  }

  withAmbient(ambient) {
    return MaterialBase.create(ambient, this.diffuse, this.specular, this.shininess);
  }

  withDiffuse(diffuse) {
    return MaterialBase.create(this.ambient, diffuse, this.specular, this.shininess);
  }

  withSpecular(specular) {
    return MaterialBase.create(this.ambient, this.diffuse, specular, this.shininess);
  }

  withShininess(shininess) {
    return MaterialBase.create(this.ambient, this.diffuse, this.specular, shininess);
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(ambient, diffuse, specular, shininess) {
    let res = new MaterialBase();
    res.ambient = ambient;
    res.diffuse = diffuse;
    res.specular = specular;
    res.shininess = shininess;
    res.guardInvaritants();
    return res;
  }

}
class Material {
  static BLACK = Material.create(Rgb.BLACK, Rgb.BLACK, Rgb.BLACK, 1);
  static BRASS = Material.create(Rgb.create(0.329412, 0.223529, 0.027451), Rgb.create(0.780392, 0.568627, 0.113725), Rgb.create(0.992157, 0.941176, 0.807843), 27.8974);
  static BRONZE = Material.create(Rgb.create(0.2125, 0.1275, 0.054), Rgb.create(0.714, 0.4284, 0.18144), Rgb.create(0.393548, 0.271906, 0.166721), 25.6);
  static CHROME = Material.create(Rgb.create(0.25, 0.25, 0.25), Rgb.create(0.4, 0.4, 0.4), Rgb.create(0.774597, 0.774597, 0.774597), 76.8);
  static COPPER = Material.create(Rgb.create(0.19125, 0.0735, 0.0225), Rgb.create(0.7038, 0.27048, 0.0828), Rgb.create(0.256777, 0.137622, 0.086014), 12.8);
  static GOLD = Material.create(Rgb.create(0.24725, 0.1995, 0.0745), Rgb.create(0.75164, 0.60648, 0.22648), Rgb.create(0.628281, 0.555802, 0.366065), 51.2);
  static SILVER = Material.create(Rgb.create(0.19225, 0.19225, 0.19225), Rgb.create(0.50754, 0.50754, 0.50754), Rgb.create(0.508273, 0.508273, 0.508273), 51.2);
  static WHITE_PLASTIC = Material.create(Rgb.BLACK, Rgb.gray(0.55), Rgb.gray(0.7), 32.0);
  base;
  textures;
  constructor() {
  }

  getClass() {
    return "Material";
  }

  guardInvariants() {
  }

  getBase() {
    return this.base;
  }

  getAmbient() {
    return this.base.getAmbient();
  }

  getDiffuse() {
    return this.base.getDiffuse();
  }

  getSpecular() {
    return this.base.getSpecular();
  }

  getShininess() {
    return this.base.getShininess();
  }

  getTextures() {
    return this.textures;
  }

  withAmbient(ambient) {
    return Material.create(this.base.withAmbient(ambient), this.textures);
  }

  withDiffuse(diffues) {
    return Material.create(this.base.withDiffuse(diffues), this.textures);
  }

  withSpecular(specular) {
    return Material.create(this.base.withSpecular(specular), this.textures);
  }

  withShininess(shininess) {
    return Material.create(this.base.withShininess(shininess), this.textures);
  }

  addTexture(texture) {
    let txts = Dut.copyList(this.textures);
    txts.add(texture);
    return Material.create(this.base, txts);
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create() {
    if (arguments.length===2&&arguments[0] instanceof MaterialBase&&arguments[1] instanceof ArrayList) {
      return Material.create_2_MaterialBase_List(arguments[0], arguments[1]);
    }
    else if (arguments.length===1&&arguments[0] instanceof MaterialBase) {
      return Material.create_1_MaterialBase(arguments[0]);
    }
    else if (arguments.length===4&&arguments[0] instanceof Rgb&&arguments[1] instanceof Rgb&&arguments[2] instanceof Rgb&& typeof arguments[3]==="number") {
      return Material.create_4_Rgb_Rgb_Rgb_number(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else if (arguments.length===5&&arguments[0] instanceof Rgb&&arguments[1] instanceof Rgb&&arguments[2] instanceof Rgb&& typeof arguments[3]==="number"&&arguments[4] instanceof TextureAttachment) {
      return Material.create_5_Rgb_Rgb_Rgb_number_TextureAttachment(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
    }
    else if (arguments.length===6&&arguments[0] instanceof Rgb&&arguments[1] instanceof Rgb&&arguments[2] instanceof Rgb&& typeof arguments[3]==="number"&&arguments[4] instanceof TextureAttachment&&arguments[5] instanceof TextureAttachment) {
      return Material.create_6_Rgb_Rgb_Rgb_number_TextureAttachment_TextureAttachment(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    }
    else if (arguments.length===7&&arguments[0] instanceof Rgb&&arguments[1] instanceof Rgb&&arguments[2] instanceof Rgb&& typeof arguments[3]==="number"&&arguments[4] instanceof TextureAttachment&&arguments[5] instanceof TextureAttachment&&arguments[6] instanceof TextureAttachment) {
      return Material.create_7_Rgb_Rgb_Rgb_number_TextureAttachment_TextureAttachment_TextureAttachment(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
    }
    else {
      throw "error";
    }
  }

  static create_2_MaterialBase_List(base, textures) {
    let res = new Material();
    res.base = base;
    res.textures = Dut.copyImmutableList(textures);
    res.guardInvariants();
    return res;
  }

  static create_1_MaterialBase(base) {
    return Material.create(base, Collections.emptyList());
  }

  static create_4_Rgb_Rgb_Rgb_number(ambient, diffuse, specular, shininess) {
    let res = new Material();
    res.base = MaterialBase.create(ambient, diffuse, specular, shininess);
    res.textures = Collections.emptyList();
    res.guardInvariants();
    return res;
  }

  static create_5_Rgb_Rgb_Rgb_number_TextureAttachment(ambient, diffuse, specular, shininess, texture1) {
    let res = new Material();
    res.base = MaterialBase.create(ambient, diffuse, specular, shininess);
    res.textures = Dut.immutableList(texture1);
    res.guardInvariants();
    return res;
  }

  static create_6_Rgb_Rgb_Rgb_number_TextureAttachment_TextureAttachment(ambient, diffuse, specular, shininess, texture1, texture2) {
    let res = new Material();
    res.base = MaterialBase.create(ambient, diffuse, specular, shininess);
    res.textures = Dut.immutableList(texture1, texture2);
    res.guardInvariants();
    return res;
  }

  static create_7_Rgb_Rgb_Rgb_number_TextureAttachment_TextureAttachment_TextureAttachment(ambient, diffuse, specular, shininess, texture1, texture2, texture3) {
    let res = new Material();
    res.base = MaterialBase.create(ambient, diffuse, specular, shininess);
    res.textures = Dut.immutableList(texture1, texture2, texture3);
    res.guardInvariants();
    return res;
  }

}
class Mesh {
  static MODEL_ATTRS = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3, VertexAttr.TEX2);
  vertexAttrs;
  vertices;
  faces;
  constructor() {
  }

  getClass() {
    return "Mesh";
  }

  guardInvariants() {
  }

  getVertexAttrs() {
    return this.vertexAttrs;
  }

  getVertexSize() {
    let res = 0;
    for (let attr of this.vertexAttrs) {
      res = res+attr.getSize();
    }
    return res;
  }

  getNumVertices() {
    return this.vertices.size();
  }

  getVertices() {
    return this.vertices;
  }

  getVertex(idx) {
    return this.vertices.get(idx);
  }

  getNumFaces() {
    return this.faces.size();
  }

  getFaces() {
    return this.faces;
  }

  getFace(idx) {
    return this.faces.get(idx);
  }

  getUnpackedFaces() {
    let res = new ArrayList();
    for (let face of this.faces) {
      let ufc = new ArrayList();
      for (let idx of face.getIndices()) {
        ufc.add(this.vertices.get(idx));
      }
      res.add(ufc);
    }
    return res;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(vertexAttrs, vertices, faces) {
    let res = new Mesh();
    res.vertexAttrs = Dut.copyImmutableList(vertexAttrs);
    res.vertices = Dut.copyImmutableList(vertices);
    res.faces = Dut.copyImmutableList(faces);
    res.guardInvariants();
    return res;
  }

  static fabric(vertices, faces) {
    let res = new Mesh();
    res.vertexAttrs = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3);
    res.vertices = Dut.copyImmutableList(vertices);
    res.faces = Dut.copyImmutableList(faces);
    res.guardInvariants();
    return res;
  }

  static model(vertices, faces) {
    let res = new Mesh();
    res.vertexAttrs = Mesh.MODEL_ATTRS;
    res.vertices = Dut.copyImmutableList(vertices);
    res.faces = Dut.copyImmutableList(faces);
    res.guardInvariants();
    return res;
  }

  static modelTriangles(vertices, merge) {
    Guard.beTrue(vertices.size()%3==0, "number of verftices must be multiplication of 3");
    let keepAllVerts = !merge;
    let res = new Mesh();
    res.vertexAttrs = Mesh.MODEL_ATTRS;
    let vts = new ArrayList();
    let fcs = new ArrayList();
    for (let i = 0; i<vertices.size(); i=i+3) {
      let v1 = vertices.get(i);
      let f1 = vts.indexOf(v1);
      if (f1==-1||keepAllVerts) {
        vts.add(v1);
        f1 = vts.size()-1;
      }
      let v2 = vertices.get(i+1);
      let f2 = vts.indexOf(v2);
      if (f2==-1||keepAllVerts) {
        vts.add(v2);
        f2 = vts.size()-1;
      }
      let v3 = vertices.get(i+2);
      let f3 = vts.indexOf(v3);
      if (f3==-1||keepAllVerts) {
        vts.add(v3);
        f3 = vts.size()-1;
      }
      fcs.add(Face.triangle(f1, f2, f3));
    }
    res.vertices = Dut.copyImmutableList(vts);
    res.faces = Dut.copyImmutableList(fcs);
    res.guardInvariants();
    return res;
  }

  static modelAnimated(frames) {
    if (frames.isEmpty()) {
      throw "at least 1 frame must be defined";
    }
    let numFrames = frames.size();
    let frame0 = frames.get(0);
    let faces0 = frame0.getFaces();
    for (let frame of frames) {
      Guard.equals(Mesh.MODEL_ATTRS, frame.getVertexAttrs(), "vertex attributes of all frames must be %s", Mesh.MODEL_ATTRS);
      Guard.equals(frame0.getNumVertices(), frame.getNumVertices(), "all frames must have same number of vertices");
      Guard.equals(faces0, frame.getFaces(), "all frames must have same faces");
    }
    let vertarrs = new ArrayList();
    let attrs = new ArrayList();
    for (let i = 0; i<frame0.getNumVertices(); ++i) {
      let v = [];
      v[numFrames*6] = frame0.getVertex(i).coord(6);
      v[numFrames*6+1] = frame0.getVertex(i).coord(7);
      vertarrs.add(v);
    }
    for (let f = 0; f<numFrames; ++f) {
      let frame = frames.get(f);
      attrs.add(VertexAttr.POS3);
      attrs.add(VertexAttr.NORM3);
      for (let i = 0; i<frame.getNumVertices(); ++i) {
        let v = vertarrs.get(i);
        v[f*6] = frame.getVertex(i).coord(0);
        v[f*6+1] = frame.getVertex(i).coord(1);
        v[f*6+2] = frame.getVertex(i).coord(2);
        v[f*6+3] = frame.getVertex(i).coord(3);
        v[f*6+4] = frame.getVertex(i).coord(4);
        v[f*6+5] = frame.getVertex(i).coord(5);
      }
    }
    attrs.add(VertexAttr.TEX2);
    let verts = new ArrayList();
    for (let v of vertarrs) {
      verts.add(Vertex.create(v));
    }
    return Mesh.create(attrs, verts, faces0);
  }

}
class MeshId extends RefId {
  static TYPE = RefIdType.of("MESH_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "MeshId";
  }

  guardInvariants() {
  }

  type() {
    return MeshId.TYPE;
  }

  id() {
    return this.mId;
  }

  hashCode() {
    return this.mId.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof MeshId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new MeshId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
class Attenuation {
  static QUADRATIC_1 = Attenuation.pureQuadratic(1);
  constant;
  linear;
  quadratic;
  constructor() {
  }

  getClass() {
    return "Attenuation";
  }

  getConstant() {
    return this.constant;
  }

  getLinear() {
    return this.linear;
  }

  getQuadratic() {
    return this.quadratic;
  }

  getIntensity(r) {
    return 1/(this.constant+r*this.linear+r*r*this.quadratic);
  }

  getDistance(intensity) {
    if (this.constant==1&&this.quadratic==0&&this.linear>0) {
      return (1-intensity*this.constant)/(intensity*this.linear);
    }
    else if (this.constant==1&&this.linear==0&&this.quadratic>0) {
      return FMath.sqrt((1-intensity*this.constant)/(intensity*this.quadratic));
    }
    else {
      throw "not supported for this case, implement me if you want: "+this;
    }
  }

  hashCode() {
    return this.constant+13*this.linear+17*this.quadratic;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    else if (!(obj instanceof Attenuation)) {
      return false;
    }
    let ob = obj;
    return ob.constant==this.constant&&ob.linear==this.linear&&ob.quadratic==this.quadratic;
  }

  toString() {
  }

  static create(constant, linear, quadratic) {
    let res = new Attenuation();
    res.constant = constant;
    res.linear = linear;
    res.quadratic = quadratic;
    return res;
  }

  static pureLinear() {
    if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return Attenuation.pureLinear_2_number_number(arguments[0], arguments[1]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="number") {
      return Attenuation.pureLinear_1_number(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  static pureLinear_2_number_number(distance, intensity) {
    let linear = (1-intensity)/(distance*intensity);
    return Attenuation.create(1, linear, 0);
  }

  static pureLinear_1_number(distance) {
    return Attenuation.pureLinear(distance, 0.5);
  }

  static pureQuadratic() {
    if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return Attenuation.pureQuadratic_2_number_number(arguments[0], arguments[1]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="number") {
      return Attenuation.pureQuadratic_1_number(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  static pureQuadratic_2_number_number(distance, intensity) {
    let quadratic = (1-intensity)/(distance*distance*intensity);
    return Attenuation.create(1, 0, quadratic);
  }

  static pureQuadratic_1_number(distance) {
    return Attenuation.pureQuadratic(distance, 0.5);
  }

}
const createLightType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const LightType = Object.freeze({
  DIRECTIONAL: createLightType("DIRECTIONAL"),
  SPOT: createLightType("SPOT"),
  POINT: createLightType("POINT")
});
class LightColor {
  static AMBIENT_WHITE = LightColor.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK);
  ambient;
  diffuse;
  specular;
  constructor() {
  }

  getClass() {
    return "LightColor";
  }

  guardInvaritants() {
    Guard.notNull(this.ambient, "ambient cannot be null");
    Guard.notNull(this.diffuse, "diffuse cannot be null");
    Guard.notNull(this.specular, "specular cannot be null");
  }

  getAmbient() {
    return this.ambient;
  }

  getDiffuse() {
    return this.diffuse;
  }

  getSpecular() {
    return this.specular;
  }

  withAmbient(ambient) {
    return LightColor.create(ambient, this.diffuse, this.specular);
  }

  withDiffuse(diffuse) {
    return LightColor.create(this.ambient, diffuse, this.specular);
  }

  withSpecular(specular) {
    return LightColor.create(this.ambient, this.diffuse, specular);
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(ambient, diffuse, specular) {
    let res = new LightColor();
    res.ambient = ambient;
    res.diffuse = diffuse;
    res.specular = specular;
    res.guardInvaritants();
    return res;
  }

}
class LightCone {
  static DEFAULT = LightCone.create(FMath.PI/9, FMath.PI/6);
  inTheta;
  outTheta;
  constructor() {
  }

  getClass() {
    return "LightCone";
  }

  guardInvaritants() {
    Guard.beTrue(this.inTheta>=0, "inTheta must be >= 0");
    Guard.beTrue(this.outTheta>=this.inTheta, "outTheta must be >= inTheta");
  }

  getInTheta() {
    return this.inTheta;
  }

  getOutTheta() {
    return this.outTheta;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(inTheta, outTheta) {
    let res = new LightCone();
    res.inTheta = inTheta;
    res.outTheta = outTheta;
    res.guardInvaritants();
    return res;
  }

}
class Light {
  type;
  color;
  pos;
  dir;
  range;
  attenuation;
  cone;
  shadowMap;
  constructor() {
  }

  getClass() {
    return "Light";
  }

  guardInvaritants() {
    Guard.notNull(this.type, "type cannot be null");
    Guard.notNull(this.color, "color cannot be null");
    Guard.notNull(this.pos, "pos cannot be null");
    Guard.notNull(this.dir, "dir cannot be null");
    Guard.notNegative(this.range, "range cannot br negartive");
    Guard.notNull(this.range, "range cannot be null");
    Guard.notNull(this.cone, "cone cannot be null");
  }

  getType() {
    return this.type;
  }

  getColor() {
    return this.color;
  }

  getAmbient() {
    return this.color.getAmbient();
  }

  getDiffuse() {
    return this.color.getDiffuse();
  }

  getSpecular() {
    return this.color.getSpecular();
  }

  getPos() {
    return this.pos;
  }

  getDir() {
    return this.dir;
  }

  getRange() {
    return this.range;
  }

  getAttenuation() {
    return this.attenuation;
  }

  getCone() {
    return this.cone;
  }

  getShadowMap() {
    return this.shadowMap;
  }

  isShadow() {
    return this.shadowMap!=null;
  }

  isPointShadowless() {
    return this.type==LightType.POINT&&this.shadowMap==null;
  }

  isPointShadowMap() {
    return this.type==LightType.POINT&&this.shadowMap!=null;
  }

  isDirectionalShadowless() {
    return this.type==LightType.DIRECTIONAL&&this.shadowMap==null;
  }

  isDirectionalShadowMap() {
    return this.type==LightType.DIRECTIONAL&&this.shadowMap!=null;
  }

  isSpotShadowless() {
    return this.type==LightType.SPOT&&this.shadowMap==null;
  }

  isSpotShadowMap() {
    return this.type==LightType.SPOT&&this.shadowMap!=null;
  }

  withShadowMap(shadowMap) {
    let res = new Light();
    res.type = this.type;
    res.color = this.color;
    res.pos = this.pos;
    res.dir = this.dir;
    res.range = this.range;
    res.cone = this.cone;
    res.shadowMap = shadowMap;
    return res;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static pointQadratic(color, pos, midDst) {
    let res = new Light();
    res.type = LightType.POINT;
    res.color = color;
    res.pos = pos;
    res.dir = Vec3.FORWARD;
    res.attenuation = Attenuation.pureQuadratic(midDst);
    res.range = res.attenuation.getDistance(0.01);
    res.cone = LightCone.DEFAULT;
    res.shadowMap = null;
    res.guardInvaritants();
    return res;
  }

  static spotQuadratic() {
    if (arguments.length===5&&arguments[0] instanceof LightColor&&arguments[1] instanceof Vec3&&arguments[2] instanceof Vec3&& typeof arguments[3]==="number"&&arguments[4] instanceof LightCone) {
      return Light.spotQuadratic_5_LightColor_Vec3_Vec3_number_LightCone(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
    }
    else if (arguments.length===6&&arguments[0] instanceof LightColor&&arguments[1] instanceof Vec3&&arguments[2] instanceof Vec3&& typeof arguments[3]==="number"&&arguments[4] instanceof LightCone&&arguments[5] instanceof ShadowMap) {
      return Light.spotQuadratic_6_LightColor_Vec3_Vec3_number_LightCone_ShadowMap(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    }
    else {
      throw "error";
    }
  }

  static spotQuadratic_5_LightColor_Vec3_Vec3_number_LightCone(color, pos, dir, midDst, cone) {
    let res = new Light();
    res.type = LightType.SPOT;
    res.color = color;
    res.pos = pos;
    res.dir = dir;
    res.attenuation = Attenuation.pureQuadratic(midDst);
    res.range = res.attenuation.getDistance(0.01);
    res.cone = cone;
    res.shadowMap = null;
    res.guardInvaritants();
    return res;
  }

  static spotQuadratic_6_LightColor_Vec3_Vec3_number_LightCone_ShadowMap(color, pos, dir, midDst, cone, shadowMap) {
    let res = new Light();
    res.type = LightType.SPOT;
    res.color = color;
    res.pos = pos;
    res.dir = dir;
    res.attenuation = Attenuation.pureQuadratic(midDst);
    res.range = res.attenuation.getDistance(0.01);
    res.cone = cone;
    res.shadowMap = shadowMap;
    res.guardInvaritants();
    return res;
  }

  static directional() {
    if (arguments.length===2&&arguments[0] instanceof LightColor&&arguments[1] instanceof Vec3) {
      return Light.directional_2_LightColor_Vec3(arguments[0], arguments[1]);
    }
    else if (arguments.length===3&&arguments[0] instanceof LightColor&&arguments[1] instanceof Vec3&&arguments[2] instanceof ShadowMap) {
      return Light.directional_3_LightColor_Vec3_ShadowMap(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw "error";
    }
  }

  static directional_2_LightColor_Vec3(color, dir) {
    let res = new Light();
    res.type = LightType.DIRECTIONAL;
    res.color = color;
    res.pos = Vec3.ZERO;
    res.dir = dir;
    res.attenuation = Attenuation.QUADRATIC_1;
    res.range = res.attenuation.getDistance(0.01);
    res.cone = LightCone.DEFAULT;
    res.shadowMap = null;
    res.guardInvaritants();
    return res;
  }

  static directional_3_LightColor_Vec3_ShadowMap(color, dir, shadowMap) {
    let res = new Light();
    res.type = LightType.DIRECTIONAL;
    res.color = color;
    res.pos = Vec3.ZERO;
    res.dir = dir;
    res.attenuation = Attenuation.QUADRATIC_1;
    res.range = res.attenuation.getDistance(0.01);
    res.cone = LightCone.DEFAULT;
    res.shadowMap = shadowMap;
    res.guardInvaritants();
    return res;
  }

}
const createShadowMapPcfType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const ShadowMapPcfType = Object.freeze({
  NONE: createShadowMapPcfType("NONE"),
  GAUSS_33: createShadowMapPcfType("GAUSS_33"),
  GAUSS_55: createShadowMapPcfType("GAUSS_55")
});
class ShadowMap {
  shadowBuffer;
  pcfType;
  camera;
  constructor() {
  }

  getClass() {
    return "ShadowMap";
  }

  guardInvaritants() {
    Guard.notNull(this.shadowBuffer, "shadowBuffer cannot be null");
    Guard.notNull(this.pcfType, "pcfType cannot be null");
    Guard.notNull(this.camera, "camera cannot be null");
  }

  getShadowBuffer() {
    return this.shadowBuffer;
  }

  getPcfType() {
    return this.pcfType;
  }

  getCamera() {
    return this.camera;
  }

  getLightMat() {
    return this.camera.getProj().mul(this.camera.getView());
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static createDir() {
    if (arguments.length===5&&arguments[0] instanceof ShadowBufferId&&arguments[1] instanceof Vec3&&arguments[2] instanceof Vec3&& typeof arguments[3]==="number"&& typeof arguments[4]==="number") {
      return ShadowMap.createDir_5_ShadowBufferId_Vec3_Vec3_number_number(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
    }
    else if (arguments.length===6&&arguments[0] instanceof ShadowBufferId&&arguments[1] instanceof ShadowMapPcfType&&arguments[2] instanceof Vec3&&arguments[3] instanceof Vec3&& typeof arguments[4]==="number"&& typeof arguments[5]==="number") {
      return ShadowMap.createDir_6_ShadowBufferId_ShadowMapPcfType_Vec3_Vec3_number_number(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    }
    else {
      throw "error";
    }
  }

  static createDir_5_ShadowBufferId_Vec3_Vec3_number_number(shadowBuffer, pos, dir, r, range) {
    let res = new ShadowMap();
    res.shadowBuffer = shadowBuffer;
    res.pcfType = ShadowMapPcfType.GAUSS_55;
    res.camera = Camera.ortho(r*2, r*2, 0, range).lookAt(pos, pos.add(dir), ShadowMap.perp(dir));
    res.guardInvaritants();
    return res;
  }

  static createDir_6_ShadowBufferId_ShadowMapPcfType_Vec3_Vec3_number_number(shadowBuffer, pcfType, pos, dir, r, range) {
    let res = new ShadowMap();
    res.shadowBuffer = shadowBuffer;
    res.pcfType = pcfType;
    res.camera = Camera.ortho(r*2, r*2, 0, range).lookAt(pos, pos.add(dir), ShadowMap.perp(dir));
    res.guardInvaritants();
    return res;
  }

  static createSpot() {
    if (arguments.length===6&&arguments[0] instanceof ShadowBufferId&&arguments[1] instanceof Vec3&&arguments[2] instanceof Vec3&& typeof arguments[3]==="number"&& typeof arguments[4]==="number"&& typeof arguments[5]==="number") {
      return ShadowMap.createSpot_6_ShadowBufferId_Vec3_Vec3_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    }
    else if (arguments.length===7&&arguments[0] instanceof ShadowBufferId&&arguments[1] instanceof ShadowMapPcfType&&arguments[2] instanceof Vec3&&arguments[3] instanceof Vec3&& typeof arguments[4]==="number"&& typeof arguments[5]==="number"&& typeof arguments[6]==="number") {
      return ShadowMap.createSpot_7_ShadowBufferId_ShadowMapPcfType_Vec3_Vec3_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
    }
    else {
      throw "error";
    }
  }

  static createSpot_6_ShadowBufferId_Vec3_Vec3_number_number_number(shadowBuffer, pos, dir, outTheta, near, range) {
    let res = new ShadowMap();
    res.shadowBuffer = shadowBuffer;
    res.pcfType = ShadowMapPcfType.GAUSS_55;
    res.camera = Camera.persp(outTheta*2, 1, near, range).lookAt(pos, pos.add(dir), ShadowMap.perp(dir));
    res.guardInvaritants();
    return res;
  }

  static createSpot_7_ShadowBufferId_ShadowMapPcfType_Vec3_Vec3_number_number_number(shadowBuffer, pcfType, pos, dir, outTheta, near, range) {
    let res = new ShadowMap();
    res.shadowBuffer = shadowBuffer;
    res.pcfType = pcfType;
    res.camera = Camera.persp(outTheta*2, 1, near, range).lookAt(pos, pos.add(dir), ShadowMap.perp(dir));
    res.guardInvaritants();
    return res;
  }

  static perp(v) {
    v = v.normalize();
    let h1 = Vec3.cross(Vec3.create(1, 0, 0), v);
    let h2 = Vec3.cross(Vec3.create(0, 1, 0), v);
    let h3 = Vec3.cross(Vec3.create(0, 0, 1), v);
    let m1 = h1.mag();
    let m2 = h2.mag();
    let m3 = h3.mag();
    let max = Math.max(m1, Math.max(m2, m3));
    if (max==m1) {
      return h1.normalize();
    }
    if (max==m2) {
      return h2.normalize();
    }
    return h3.normalize();
  }

}
class BufferId extends RefId {
  static TYPE = RefIdType.of("BUFFER_ID");
  static COLOR = BufferId.of("color");
  static DEPTH = BufferId.of("depth");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "BufferId";
  }

  guardInvariants() {
  }

  type() {
    return BufferId.TYPE;
  }

  id() {
    return this.mId;
  }

  hashCode() {
    return this.mId.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof BufferId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new BufferId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
class ShadowBufferId extends RefId {
  static TYPE = RefIdType.of("SHADOW_BUFFER_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "ShadowBufferId";
  }

  guardInvariants() {
  }

  type() {
    return ShadowBufferId.TYPE;
  }

  id() {
    return this.mId;
  }

  hashCode() {
    return this.mId.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof ShadowBufferId)) {
      return false;
    }
    return (obj).this.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new ShadowBufferId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
class ShadowBuffer {
  width;
  height;
  constructor() {
  }

  getClass() {
    return "ShadowBuffer";
  }

  guardInvaritants() {
    Guard.notNegative(this.width, "width cannot be negative");
    Guard.notNegative(this.height, "height cannot be negative");
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(width, height) {
    let res = new ShadowBuffer();
    res.width = width;
    res.height = height;
    res.guardInvaritants();
    return res;
  }

}
class Camera {
  proj;
  view;
  pos;
  near;
  far;
  getClass() {
    return "Camera";
  }

  guardInvariants() {
  }

  getProj() {
    return this.proj;
  }

  getView() {
    return this.view;
  }

  getPos() {
    return this.pos;
  }

  getNear() {
    return this.near;
  }

  getFar() {
    return this.far;
  }

  withPersp(fovy, aspect, near, far) {
    let h = FMath.tan(fovy*0.5);
    let nproj = Mat44.create(1.0/(h*aspect), 0.0, 0.0, 0.0, 0.0, 1.0/h, 0.0, 0.0, 0.0, 0.0, (near+far)/(near-far), 2*near*far/(near-far), 0.0, 0.0, -1.0, 0.0);
    let res = new Camera();
    res.proj = nproj;
    res.view = Mat44.IDENTITY;
    res.pos = this.pos;
    res.near = near;
    res.far = far;
    res.guardInvariants();
    return res;
  }

  lookAt(pos, target, upDir) {
    let fwd = target.sub(pos).normalize();
    let side = Vec3.cross(fwd, upDir).normalize();
    let upfix = Vec3.cross(side, fwd).normalize();
    let v = Mat44.create(side.x(), side.y(), side.z(), -side.dot(pos), upfix.x(), upfix.y(), upfix.z(), -upfix.dot(pos), -fwd.x(), -fwd.y(), -fwd.z(), fwd.dot(pos), 0, 0, 0, 1);
    let res = new Camera();
    res.proj = this.proj;
    res.view = v;
    res.pos = pos;
    res.near = this.near;
    res.far = this.far;
    res.guardInvariants();
    return res;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static persp(fovy, aspect, near, far) {
    let h = FMath.tan(fovy*0.5);
    let proj = Mat44.create(1.0/(h*aspect), 0.0, 0.0, 0.0, 0.0, 1.0/h, 0.0, 0.0, 0.0, 0.0, (near+far)/(near-far), 2*near*far/(near-far), 0.0, 0.0, -1.0, 0.0);
    let res = new Camera();
    res.proj = proj;
    res.view = Mat44.IDENTITY;
    res.pos = Vec3.create(0, 0, 0);
    res.near = near;
    res.far = far;
    res.guardInvariants();
    return res;
  }

  static ortho(w, h, near, far) {
    let proj = Mat44.create(2.0/w, 0.0, 0.0, 0.0, 0.0, 2.0/h, 0.0, 0.0, 0.0, 0.0, -1.0/(far-near), -near/(near-far), 0.0, 0.0, 0.0, 1.0);
    let res = new Camera();
    res.proj = proj;
    res.view = Mat44.IDENTITY;
    res.pos = Vec3.create(0, 0, 0);
    res.near = near;
    res.far = far;
    res.guardInvariants();
    return res;
  }

  static custom(proj, view, near, far) {
    let res = new Camera();
    res.proj = proj;
    res.view = view;
    let viewInv = view.inv();
    res.pos = Vec3.create(viewInv.m03()/viewInv.m33(), viewInv.m13()/viewInv.m33(), viewInv.m23()/viewInv.m33());
    res.near = near;
    res.far = far;
    res.guardInvariants();
    return res;
  }

}
const createTextureWrapType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const TextureWrapType = Object.freeze({
  REPEAT: createTextureWrapType("REPEAT"),
  MIRRORED_REPEAT: createTextureWrapType("MIRRORED_REPEAT"),
  EDGE: createTextureWrapType("EDGE"),
  BORDER: createTextureWrapType("BORDER")
});
const createTextureFilterType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const TextureFilterType = Object.freeze({
  NEAREST: createTextureFilterType("NEAREST"),
  LINEAR: createTextureFilterType("LINEAR"),
  LINEAR_MIPMAP_LINEAR: createTextureFilterType("LINEAR_MIPMAP_LINEAR")
});
class TextureStyle {
  static SMOOTH_REPEAT = TextureStyle.create(TextureWrapType.REPEAT, TextureWrapType.REPEAT, Rgba.TRANSPARENT, TextureFilterType.LINEAR_MIPMAP_LINEAR, TextureFilterType.LINEAR);
  static SMOOTH_EDGE = TextureStyle.create(TextureWrapType.EDGE, TextureWrapType.EDGE, Rgba.TRANSPARENT, TextureFilterType.LINEAR_MIPMAP_LINEAR, TextureFilterType.LINEAR);
  static SMOOTH_BORDER_TRANSPARENT = TextureStyle.create(TextureWrapType.BORDER, TextureWrapType.BORDER, Rgba.TRANSPARENT, TextureFilterType.LINEAR_MIPMAP_LINEAR, TextureFilterType.LINEAR);
  static PIXEL_EDGE = TextureStyle.create(TextureWrapType.EDGE, TextureWrapType.EDGE, Rgba.TRANSPARENT, TextureFilterType.LINEAR_MIPMAP_LINEAR, TextureFilterType.NEAREST);
  static PIXEL_BORDER_TRANSPARENT = TextureStyle.create(TextureWrapType.BORDER, TextureWrapType.BORDER, Rgba.TRANSPARENT, TextureFilterType.LINEAR_MIPMAP_LINEAR, TextureFilterType.NEAREST);
  horizWrapType;
  vertWrapType;
  borderColor;
  minFilterType;
  magFilterType;
  constructor() {
  }

  getClass() {
    return "TextureStyle";
  }

  guardInvariants() {
  }

  getHorizWrapType() {
    return this.horizWrapType;
  }

  getVertWrapType() {
    return this.vertWrapType;
  }

  getBorderColor() {
    return this.borderColor;
  }

  getMinFilterType() {
    return this.minFilterType;
  }

  getMagFilterType() {
    return this.magFilterType;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(horizWrapType, vertWrapType, borderColor, minFilterType, magFilterType) {
    let res = new TextureStyle();
    res.horizWrapType = horizWrapType;
    res.vertWrapType = vertWrapType;
    res.borderColor = borderColor;
    res.minFilterType = minFilterType;
    res.magFilterType = magFilterType;
    res.guardInvariants();
    return res;
  }

}
const createBlendType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const BlendType = Object.freeze({
  ALPHA: createBlendType("ALPHA"),
  ADDITIVE: createBlendType("ADDITIVE"),
  MULTIPLICATIVE: createBlendType("MULTIPLICATIVE")
});
class Viewport {
  x;
  y;
  width;
  height;
  constructor() {
  }

  getClass() {
    return "Viewport";
  }

  getX() {
    return this.x;
  }

  getY() {
    return this.y;
  }

  getWidth() {
    return this.width;
  }

  getHeight() {
    return this.height;
  }

  getAspect() {
    return this.width/this.height;
  }

  getSize() {
    return Size2.create(this.width, this.height);
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(x, y, width, height) {
    let res = new Viewport();
    res.x = x;
    res.y = y;
    res.width = width;
    res.height = height;
    return res;
  }

}
class BasicEnvironment {
  camera;
  constructor() {
  }

  getClass() {
    return "BasicEnvironment";
  }

  guardInvariants() {
  }

  getCamera() {
    return this.camera;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(camera) {
    let res = new BasicEnvironment();
    res.camera = camera;
    res.guardInvariants();
    return res;
  }

}
class SceneEnvironment {
  camera;
  lights;
  gamma;
  constructor() {
  }

  getClass() {
    return "SceneEnvironment";
  }

  guardInvariants() {
  }

  getCamera() {
    return this.camera;
  }

  getLights() {
    return this.lights;
  }

  getGamma() {
    return this.gamma;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create() {
    if (arguments.length===2&&arguments[0] instanceof Camera&&arguments[1] instanceof ArrayList) {
      return SceneEnvironment.create_2_Camera_List(arguments[0], arguments[1]);
    }
    else if (arguments.length===2&&arguments[0] instanceof Camera&&arguments[1] instanceof Light) {
      return SceneEnvironment.create_2_Camera_Light(arguments[0], arguments[1]);
    }
    else if (arguments.length===3&&arguments[0] instanceof Camera&&arguments[1] instanceof Light&&arguments[2] instanceof Light) {
      return SceneEnvironment.create_3_Camera_Light_Light(arguments[0], arguments[1], arguments[2]);
    }
    else if (arguments.length===4&&arguments[0] instanceof Camera&&arguments[1] instanceof Light&&arguments[2] instanceof Light&&arguments[3] instanceof Light) {
      return SceneEnvironment.create_4_Camera_Light_Light_Light(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else if (arguments.length===5&&arguments[0] instanceof Camera&&arguments[1] instanceof Light&&arguments[2] instanceof Light&&arguments[3] instanceof Light&&arguments[4] instanceof Light) {
      return SceneEnvironment.create_5_Camera_Light_Light_Light_Light(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
    }
    else {
      throw "error";
    }
  }

  static create_2_Camera_List(camera, lights) {
    let res = new SceneEnvironment();
    res.camera = camera;
    res.lights = Dut.copyImmutableList(lights);
    res.gamma = 2.2;
    res.guardInvariants();
    return res;
  }

  static create_2_Camera_Light(camera, light1) {
    let res = new SceneEnvironment();
    res.camera = camera;
    res.lights = Dut.immutableList(light1);
    res.gamma = 2.2;
    res.guardInvariants();
    return res;
  }

  static create_3_Camera_Light_Light(camera, light1, light2) {
    let res = new SceneEnvironment();
    res.camera = camera;
    res.lights = Dut.immutableList(light1, light2);
    res.gamma = 2.2;
    res.guardInvariants();
    return res;
  }

  static create_4_Camera_Light_Light_Light(camera, light1, light2, light3) {
    let res = new SceneEnvironment();
    res.camera = camera;
    res.lights = Dut.immutableList(light1, light2, light3);
    res.gamma = 2.2;
    res.guardInvariants();
    return res;
  }

  static create_5_Camera_Light_Light_Light_Light(camera, light1, light2, light3, light4) {
    let res = new SceneEnvironment();
    res.camera = camera;
    res.lights = Dut.immutableList(light1, light2, light3, light4);
    res.gamma = 2.2;
    res.guardInvariants();
    return res;
  }

}
class ShadowMapEnvironment {
  light;
  constructor() {
  }

  getClass() {
    return "ShadowMapEnvironment";
  }

  guardInvariants() {
  }

  getLight() {
    return this.light;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(light) {
    let res = new ShadowMapEnvironment();
    res.light = light;
    res.guardInvariants();
    return res;
  }

}
class SoundId extends RefId {
  static TYPE = RefIdType.of("SOUND_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "SoundId";
  }

  guardInvariants() {
  }

  type() {
    return SoundId.TYPE;
  }

  id() {
    return this.mId;
  }

  hashCode() {
    return this.mId.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof SoundId)) {
      return false;
    }
    return (obj).this.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new SoundId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
class AssetGroup {
  cache;
  constructor() {
  }

  getClass() {
    return "AssetGroup";
  }

  guardInvariants() {
  }

  put(key, asset) {
    Guard.notNull(key, "key cannot be null");
    Guard.notNull(asset, "asset cannot be null");
    let c = new HashMap();
    c.putAll(this.cache);
    c.put(key, asset);
    let res = new AssetGroup();
    res.cache = Dut.copyImmutableMap(c);
    res.guardInvariants();
    return res;
  }

  remove(key) {
    Guard.notNull(key, "key cannot be null");
    let c = new HashMap();
    c.putAll(this.cache);
    c.remove(key);
    let res = new AssetGroup();
    res.cache = Dut.copyImmutableMap(c);
    res.guardInvariants();
    return res;
  }

  containsKey(key) {
    return this.cache.containsKey(key);
  }

  isEmpty() {
    return this.cache.isEmpty();
  }

  getKeys() {
    if (arguments.length===0) {
      return this.getKeys_0();
    }
    else if (arguments.length===1&&arguments[0] instanceof RefIdType) {
      return this.getKeys_1_RefIdType(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  getKeys_0() {
    return this.cache.keySet();
  }

  getKeys_1_RefIdType(type) {
    let res = new HashSet();
    for (let rid of this.cache.keySet()) {
      if (rid.type().equals(type)) {
        res.add(rid);
      }
    }
    return res;
  }

  get() {
    if (arguments.length===1&&arguments[0] instanceof RefId) {
      return this.get_1_RefId(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="string"&&arguments[1] instanceof RefId) {
      return this.get_2_string_RefId(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  get_1_RefId(key) {
    if (!this.cache.containsKey(key)) {
      throw "no asset under "+key;
    }
    return this.cache.get(key);
  }

  get_2_string_RefId(clazz, key) {
    if (!this.cache.containsKey(key)) {
      throw "no asset under "+key;
    }
    return this.cache.get(key);
  }

  getAsAssetGroup(key) {
    if (!this.cache.containsKey(key)) {
      throw "no asset under "+key;
    }
    return AssetGroup.empty().put(key, this.cache.get(key));
  }

  mergeStrict(other) {
    let c = new HashMap();
    c.putAll(this.cache);
    for (let key of other.cache.keySet()) {
      if (c.containsKey(key)) {
        if (c.get(key).equals(other.cache.get(key))) {
          continue;
        }
        throw "key is presented in both groups: "+key;
      }
      c.put(key, other.cache.get(key));
    }
    let res = new AssetGroup();
    res.cache = Dut.copyImmutableMap(c);
    res.guardInvariants();
    return res;
  }

  mergeXor(other) {
    let c = new HashMap();
    for (let key of this.cache.keySet()) {
      if (!other.containsKey(key)) {
        c.put(key, this.cache.get(key));
      }
    }
    for (let key of other.cache.keySet()) {
      if (!this.cache.containsKey(key)) {
        c.put(key, other.cache.get(key));
      }
    }
    let res = new AssetGroup();
    res.cache = Dut.copyImmutableMap(c);
    res.guardInvariants();
    return res;
  }

  mergeSkip(other) {
    let c = new HashMap();
    c.putAll(this.cache);
    for (let key of other.cache.keySet()) {
      if (c.containsKey(key)) {
        continue;
      }
      c.put(key, other.cache.get(key));
    }
    let res = new AssetGroup();
    res.cache = Dut.copyImmutableMap(c);
    res.guardInvariants();
    return res;
  }

  transform() {
    if (arguments.length===1&&arguments[0] instanceof Function) {
      return this.transform_1_Function(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="string"&&arguments[1] instanceof Function) {
      return this.transform_2_string_Function(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  transform_1_Function(fnc) {
    return fnc(this);
  }

  transform_2_string_Function(clazz, fnc) {
    let res = AssetGroup.empty();
    for (let key of this.cache.keySet()) {
      let val = this.cache.get(key);
      if (val.getClass().equals(clazz)) {
        res = res.put(key, fnc(val));
      }
      else {
        res = res.put(key, val);
      }
    }
    return res;
  }

  transformKeys(clazz, fnc) {
    let res = AssetGroup.empty();
    for (let key of this.cache.keySet()) {
      if (key.getClass().equals(clazz)) {
        res = res.put(fnc(key), this.cache.get(key));
      }
      else {
        res = res.put(key, this.cache.get(key));
      }
    }
    return res;
  }

  toManagerStrict(am) {
    for (let key of this.cache.keySet()) {
      if (am.containsKey(key)) {
        throw "bank already contains "+key;
      }
    }
    for (let key of this.cache.keySet()) {
      am.put(key, this.cache.get(key));
    }
  }

  toManagerSkip(am) {
    for (let key of this.cache.keySet()) {
      if (am.containsKey(key)) {
        continue;
      }
      am.put(key, this.cache.get(key));
    }
  }

  toManagerUpdate(am) {
    for (let key of this.cache.keySet()) {
      am.put(key, this.cache.get(key));
    }
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static empty() {
    let res = new AssetGroup();
    res.cache = Collections.emptyMap();
    res.guardInvariants();
    return res;
  }

  static of(key, asset) {
    return AssetGroup.empty().put(key, asset);
  }

}
class Assets {
  constructor() {
  }

  getClass() {
    return "Assets";
  }

  static loadDir() {
    if (arguments.length===2&&arguments[0] instanceof AssetLoader&&arguments[1] instanceof Path) {
      return Assets.loadDir_2_AssetLoader_Path(arguments[0], arguments[1]);
    }
    else if (arguments.length===3&&arguments[0] instanceof AssetLoader&&arguments[1] instanceof Path&& typeof arguments[2]==="boolean") {
      return Assets.loadDir_3_AssetLoader_Path_boolean(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw "error";
    }
  }

  static loadDir_2_AssetLoader_Path(loader, dir) {
    return Assets.loadDir(loader, dir, true);
  }

  static loadDir_3_AssetLoader_Path_boolean(loader, dir, recursive) {
    let items = loader.list(dir);
    let files = loader.listFiles(dir, false);
    let descriptor = null;
    for (let file of files) {
      if (file.getName().equals("tap.json")) {
        descriptor = file;
        break;
      }
    }
    let res = AssetGroup.empty();
    if (descriptor==null) {
      res = res.mergeStrict(Assets.loadFiles(loader, files));
    }
    else {
      let tapJson = new JsonObject(new String(loader.loadFile(descriptor), Charset.forName("utf-8")));
      let docType = tapJson.getString("docType");
      let schemaVersion = tapJson.getInt("schemaVersion");
      Guard.equals("Tyracorn Asset Package Descriptor", docType, "docType is not \"Tyracorn Asset Package Descriptor\"");
      if (schemaVersion==1) {
        let tasksJson = tapJson.has("tasks")?tapJson.getJSONArray("tasks"):new JsonArray();
        for (let i = 0; i<tasksJson.length(); ++i) {
          let taskJson = tasksJson.getJSONObject(i);
          let type = taskJson.getString("type");
          if (type.equals("LOAD_ALL")) {
            let exclusionsJson = taskJson.has("exclusions")?taskJson.getJSONArray("exclusions"):new JsonArray();
            let exclusions = Assets.jsonArrayToStringArray(exclusionsJson);
            let okFiles = new ArrayList();
            for (let file of files) {
              if (file.getName().equals("tap.json")) {
                continue;
              }
              let ok = true;
              for (let excl of exclusions) {
                if (excl.startsWith("*.")) {
                  let ext = excl.substring(1);
                  if (file.getName().endsWith(ext)) {
                    ok = false;
                    break;
                  }
                }
                else if (file.getName().equals(excl)) {
                  ok = false;
                  break;
                }
              }
              if (ok) {
                okFiles.add(file);
              }
            }
            res = res.mergeStrict(Assets.loadFiles(loader, okFiles));
          }
          else if (type.equals("LOAD_ANIMATED_OBJ_MODEL")) {
            let modelId = taskJson.getString("modelId");
            let filesJson = taskJson.getJSONArray("files");
            let filesStrs = Assets.jsonArrayToStringArray(filesJson);
            let animFiles = new ArrayList();
            for (let fileStr of filesStrs) {
              animFiles.add(dir.getChild(fileStr));
            }
            res = res.mergeStrict(Objs.loadAnimatedModel(modelId, loader, animFiles));
          }
          else if (type.equals("TEXTURE_FLIP_VERT")) {
            res = res.transform("Texture", TextureFncs.flipVert());
          }
          else if (type.equals("TEXTURE_GAMMA")) {
            let gamma = Float.valueOf(taskJson.getString("gamma"));
            res = res.transform("Texture", TextureFncs.gamma(gamma));
          }
          else if (type.equals("MATERIAL_DIFFUSE_TO_AMBIENT")) {
            res = res.transform("Material", Assets.materialDiffuseToAmbientFnc());
          }
          else if (type.equals("CREATE_CLIP_ANIMATION_COLLECTION")) {
            res = res.mergeStrict(Assets.parseCreateClipAnimationCollectionTask(taskJson));
          }
          else if (type.equals("CREATE_PHYSICAL_MATERIAL")) {
            res = res.mergeStrict(Assets.parseCreatePhysicalMaterialTask(taskJson));
          }
          else if (type.equals("CREATE_SPRITES")) {
            res = Assets.createSprites(taskJson, res);
          }
          else {
            throw "unsupported task type, fix the file or implement: "+type;
          }
        }
      }
      else {
        throw "unknown version: "+schemaVersion;
      }
    }
    if (recursive) {
      let subDirs = Dut.copyList(items);
      subDirs.removeAll(files);
      for (let subDir of subDirs) {
        res = res.mergeStrict(Assets.loadDir(loader, subDir, true));
      }
    }
    return res;
  }

  static loadFiles(loader, files) {
    let res = AssetGroup.empty();
    for (let file of files) {
      if (file.getExtension().equals("png")) {
        res = res.mergeStrict(Assets.loadTexture(loader, file));
      }
    }
    for (let file of files) {
      if (file.getExtension().equals("mtl")) {
        res = res.mergeStrict(Objs.loadMtlLibrary(loader, file));
      }
    }
    for (let file of files) {
      if (file.getExtension().equals("obj")) {
        res = res.mergeStrict(Objs.loadModel(loader, file));
      }
    }
    for (let file of files) {
      if (file.getExtension().equals("fnt")) {
        res = res.mergeStrict(Fonts.loadFnt(loader, file, res));
      }
    }
    for (let file of files) {
      if (file.getExtension().equals("wav")) {
        res = res.mergeStrict(Assets.loadSound(loader, file));
      }
    }
    for (let file of files) {
      if (file.getExtension().equals("tap")) {
        let buf = loader.loadFile(file);
        let tap = Taps.fromBytes(buf);
        let ag = Taps.toAssetGroup(tap);
        res = res.mergeStrict(ag);
      }
    }
    return res;
  }

  static loadTexture(loader, file) {
    let tid = TextureId.of(file.getPlainName());
    let texture = loader.loadTexture(file);
    return AssetGroup.of(tid, texture);
  }

  static loadSound(loader, file) {
    let sid = SoundId.of(file.getPlainName());
    let sound = loader.loadSound(file);
    return AssetGroup.of(sid, sound);
  }

  static jsonArrayToStringArray(jsonArray) {
    let res = new ArrayList();
    for (let j = 0; j<jsonArray.length(); ++j) {
      res.add(jsonArray.getString(j));
    }
    return res;
  }

  diffuseToAmbient(material) {
    return material.withAmbient(material.getDiffuse());
  }

  static materialDiffuseToAmbientFnc() {
    return (mat) => {
      return mat.withAmbient(mat.getDiffuse());
    };
  }

  static parseCreateClipAnimationCollectionTask(taskJson) {
    let id = ClipAnimationCollectionId.of(taskJson.getString("collectionId"));
    let animations = new HashMap();
    let animsJson = taskJson.getJSONObject("animations");
    for (let key of animsJson.keySet()) {
      let animJson = animsJson.getJSONObject(key);
      let clip = Assets.parseClip(animJson.getJSONArray("clip"));
      let dur = Float.valueOf(animJson.getString("duration"));
      let loop = animJson.getBoolean("loop");
      let triggers = animJson.has("triggers")?Assets.parseTriggers(animJson.getJSONArray("triggers")):Collections.emptyMap();
      animations.put(key, ClipAnimation.create(clip, dur, loop, triggers));
    }
    let res = ClipAnimationCollection.create(animations);
    return AssetGroup.of(id, res);
  }

  static parseCreatePhysicalMaterialTask(taskJson) {
    let id = PhysicalMaterialId.of(taskJson.getString("physicalMaterialId"));
    let pmJson = taskJson.getJSONObject("physicalMaterial");
    let bounciness = pmJson.getFloat("bounciness");
    let bouninessCombineType = pmJson.getEnum("CombineType", "bouninessCombineType");
    let staticFriction = pmJson.getFloat("staticFriction");
    let dynamicFriction = pmJson.getFloat("dynamicFriction");
    let frictionCombineType = pmJson.getEnum("CombineType", "frictionCombineType");
    let res = PhysicalMaterial.create(bounciness, bouninessCombineType, staticFriction, dynamicFriction, frictionCombineType);
    return AssetGroup.of(id, res);
  }

  static createSprites(taskJson, assets) {
    let res = assets;
    let spritesJson = taskJson.getJSONObject("sprites");
    for (let key of spritesJson.keySet()) {
      let spriteJson = spritesJson.getJSONObject(key);
      let tid = Assets.findSpriteTexture(key, assets);
      let sheet = SpriteSheet.create(key, assets.get("Texture", tid), Assets.getNumStripFrames(tid), 1);
      let dur = Float.valueOf(spriteJson.getString("duration"));
      let loop = spriteJson.getBoolean("loop");
      let triggers = spriteJson.has("triggers")?Assets.parseTriggers(spriteJson.getJSONArray("triggers")):Collections.emptyMap();
      let sprite = sheet.createSprite(dur, loop, triggers);
      let id = SpriteId.of(key);
      res = res.remove(tid).mergeStrict(sheet.getAssets()).put(id, sprite);
    }
    return res;
  }

  static findSpriteTexture(spriteId, assets) {
    let prefix = spriteId+"_strip-";
    let ids = assets.getKeys(TextureId.TYPE);
    let res = null;
    for (let id of ids) {
      if (id.id().startsWith(prefix)) {
        Guard.beNull(res, "more than 1 texture is candidate for sprite %s", spriteId);
        res = id;
      }
    }
    Guard.notNull(res, "unable to find texture id for %s", spriteId);
    return res;
  }

  static getNumStripFrames(id) {
    let splits = id.id().split("_");
    let st = splits[splits.length-1];
    Guard.beTrue(st.startsWith("strip-"), "unable to recognize string");
    return Integer.parseInt(st.substring(6));
  }

  static parseClip(array) {
    let frames = new ArrayList();
    for (let i = 0; i<array.length(); ++i) {
      frames.add(array.getInt(i));
    }
    return Clip.create(frames);
  }

  static parseTriggers(array) {
    let res = new HashMap();
    for (let i = 0; i<array.length(); ++i) {
      let tJson = array.getJSONObject(i);
      let t = Float.valueOf(tJson.getString("t"));
      let trgsJson = tJson.getJSONArray("triggers");
      let triggers = new HashSet();
      for (let j = 0; j<trgsJson.length(); ++j) {
        triggers.add(trgsJson.getString(j));
      }
      res.put(t, triggers);
    }
    return res;
  }

}
const createAssetCompanionType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    equals(other) {
      return this.symbol === other?.symbol;
    },
    hashCode() {
      const description = this.symbol.description || "";
      let hash = 0;
      for (let i = 0; i < description.length; i++) {
        const char = description.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash;
    },
    [Symbol.toPrimitive]() {
      return this.symbol;
    },
    toString() {
      return this.symbol.toString();
    }
  };
};
const AssetCompanionType = Object.freeze({
  BOUNDING_AABB: createAssetCompanionType("BOUNDING_AABB"),
  SIZE: createAssetCompanionType("SIZE")
});
class DefaultAssetBank {
  assets = new HashMap();
  companions = new HashMap();
  lock = new Object();
  constructor() {
  }

  getClass() {
    return "DefaultAssetBank";
  }

  put(key, asset) {
    Guard.notNull(asset, "asset cannot be null");
    this.assets.put(key, asset);
    this.companions.put(key, new HashMap());
  }

  putCompanion(key, type, companion) {
    Guard.notNull(companion, "companion cannot be null");
    this.companions.get(key).put(type, companion);
  }

  containsKey(key) {
    return this.assets.containsKey(key);
  }

  getKeys(type) {
    let res = new HashSet();
    for (let key of this.assets.keySet()) {
      if (key.type().equals(type)) {
        res.add(key);
      }
    }
    return res;
  }

  isMaterialized(key) {
    return this.assets.get(key)!=null;
  }

  get(assetClass, key) {
    if (!this.assets.containsKey(key)) {
      throw "no asset under "+key;
    }
    let res = this.assets.get(key);
    if (res==null) {
      throw "asset is dematerialized (e.g. pushed to the hardware) "+key;
    }
    return res;
  }

  getCompanion(clazz, key, type) {
    if (!this.companions.containsKey(key)) {
      throw "no asset under "+key;
    }
    let res = this.companions.get(key).get(type);
    if (res==null) {
      throw "asset "+key+" does not have companion "+type;
    }
    return res;
  }

  markSynced(id) {
    this.assets.put(id, null);
  }

  isSynced(key) {
    if (!this.assets.containsKey(key)) {
      throw "no asset under "+key;
    }
    return this.assets.get(key)==null;
  }

  remove(key) {
    this.assets.remove(key);
    this.companions.remove(key);
  }

  toString() {
  }

  static create() {
    let res = new DefaultAssetBank();
    return res;
  }

}


// -------------------------------------
// Transslates app specific code
// -------------------------------------

class BoxMeshFactory {
  constructor() {
  }

  getClass() {
    return "BoxMeshFactory";
  }

  static rgbBox() {
    if (arguments.length===4&&arguments[0] instanceof Rgb&&arguments[1] instanceof Rgb&&arguments[2] instanceof Rgb&&arguments[3] instanceof Rgb) {
      return BoxMeshFactory.rgbBox_4_Rgb_Rgb_Rgb_Rgb(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return BoxMeshFactory.rgbBox_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw "error";
    }
  }

  static rgbBox_4_Rgb_Rgb_Rgb_Rgb(c1, c2, c3, c4) {
    let res = Mesh.create(Dut.immutableList(VertexAttr.POS3, VertexAttr.RGB), Dut.list(Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b()), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b()), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b()), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b()), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b()), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b()), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b()), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b()), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b()), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b()), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b()), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b()), Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b()), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b()), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b()), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b()), Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b()), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b()), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b()), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b()), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b()), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b()), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b()), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b())), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23)));
    return res;
  }

  static rgbBox_3_number_number_number(r, g, b) {
    let res = Mesh.create(Dut.immutableList(VertexAttr.POS3, VertexAttr.RGB), Dut.list(Vertex.create(-0.5, -0.5, 0.5, r, g, b), Vertex.create(-0.5, -0.5, -0.5, r, g, b), Vertex.create(0.5, -0.5, -0.5, r, g, b), Vertex.create(0.5, -0.5, 0.5, r, g, b), Vertex.create(-0.5, 0.5, 0.5, r, g, b), Vertex.create(0.5, 0.5, 0.5, r, g, b), Vertex.create(0.5, 0.5, -0.5, r, g, b), Vertex.create(-0.5, 0.5, -0.5, r, g, b), Vertex.create(-0.5, -0.5, -0.5, r, g, b), Vertex.create(-0.5, 0.5, -0.5, r, g, b), Vertex.create(0.5, 0.5, -0.5, r, g, b), Vertex.create(0.5, -0.5, -0.5, r, g, b), Vertex.create(-0.5, -0.5, 0.5, r, g, b), Vertex.create(0.5, -0.5, 0.5, r, g, b), Vertex.create(0.5, 0.5, 0.5, r, g, b), Vertex.create(-0.5, 0.5, 0.5, r, g, b), Vertex.create(-0.5, -0.5, 0.5, r, g, b), Vertex.create(-0.5, 0.5, 0.5, r, g, b), Vertex.create(-0.5, 0.5, -0.5, r, g, b), Vertex.create(-0.5, -0.5, -0.5, r, g, b), Vertex.create(0.5, -0.5, 0.5, r, g, b), Vertex.create(0.5, -0.5, -0.5, r, g, b), Vertex.create(0.5, 0.5, -0.5, r, g, b), Vertex.create(0.5, 0.5, 0.5, r, g, b)), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23)));
    return res;
  }

  static rgbaBox(c1, c2, c3, c4, a) {
    let res = Mesh.create(Dut.immutableList(VertexAttr.POS3, VertexAttr.RGBA), Dut.list(Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b(), a)), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23)));
    return res;
  }

  static fabricBox() {
    let res = Mesh.fabric(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, -1, 0), Vertex.create(-0.5, -0.5, -0.5, 0, -1, 0), Vertex.create(0.5, -0.5, -0.5, 0, -1, 0), Vertex.create(0.5, -0.5, 0.5, 0, -1, 0), Vertex.create(-0.5, 0.5, 0.5, 0, 1, 0), Vertex.create(0.5, 0.5, 0.5, 0, 1, 0), Vertex.create(0.5, 0.5, -0.5, 0, 1, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, -1), Vertex.create(-0.5, 0.5, -0.5, 0, 0, -1), Vertex.create(0.5, 0.5, -0.5, 0, 0, -1), Vertex.create(0.5, -0.5, -0.5, 0, 0, -1), Vertex.create(-0.5, -0.5, 0.5, 0, 0, 1), Vertex.create(0.5, -0.5, 0.5, 0, 0, 1), Vertex.create(0.5, 0.5, 0.5, 0, 0, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 0, 1), Vertex.create(-0.5, -0.5, 0.5, -1, 0, 0), Vertex.create(-0.5, 0.5, 0.5, -1, 0, 0), Vertex.create(-0.5, 0.5, -0.5, -1, 0, 0), Vertex.create(-0.5, -0.5, -0.5, -1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 1, 0, 0), Vertex.create(0.5, -0.5, -0.5, 1, 0, 0), Vertex.create(0.5, 0.5, -0.5, 1, 0, 0), Vertex.create(0.5, 0.5, 0.5, 1, 0, 0)), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23)));
    return res;
  }

  static modelBox() {
    let res = Mesh.model(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, -1, 0, 0, 1), Vertex.create(-0.5, -0.5, -0.5, 0, -1, 0, 0, 0), Vertex.create(0.5, -0.5, -0.5, 0, -1, 0, 1, 0), Vertex.create(0.5, -0.5, 0.5, 0, -1, 0, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 1, 0, 0, 1), Vertex.create(0.5, 0.5, 0.5, 0, 1, 0, 1, 1), Vertex.create(0.5, 0.5, -0.5, 0, 1, 0, 1, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 1, 0, 0, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, -1, 0, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 0, -1, 0, 1), Vertex.create(0.5, 0.5, -0.5, 0, 0, -1, 1, 1), Vertex.create(0.5, -0.5, -0.5, 0, 0, -1, 1, 0), Vertex.create(-0.5, -0.5, 0.5, 0, 0, 1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 0, 0, 1, 1, 0), Vertex.create(0.5, 0.5, 0.5, 0, 0, 1, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 0, 1, 0, 1), Vertex.create(-0.5, -0.5, 0.5, -1, 0, 0, 0, 1), Vertex.create(-0.5, 0.5, 0.5, -1, 0, 0, 1, 1), Vertex.create(-0.5, 0.5, -0.5, -1, 0, 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, -1, 0, 0, 0, 0), Vertex.create(0.5, -0.5, 0.5, 1, 0, 0, 0, 1), Vertex.create(0.5, -0.5, -0.5, 1, 0, 0, 0, 0), Vertex.create(0.5, 0.5, -0.5, 1, 0, 0, 1, 0), Vertex.create(0.5, 0.5, 0.5, 1, 0, 0, 1, 1)), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23)));
    return res;
  }

  static modelSkybox() {
    let res = Mesh.model(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, 1, 0, 0, 1), Vertex.create(-0.5, -0.5, -0.5, 0, 1, 0, 0, 0), Vertex.create(0.5, -0.5, -0.5, 0, 1, 0, 1, 0), Vertex.create(0.5, -0.5, 0.5, 0, 1, 0, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, -1, 0, 0, 1), Vertex.create(0.5, 0.5, 0.5, 0, -1, 0, 1, 1), Vertex.create(0.5, 0.5, -0.5, 0, -1, 0, 1, 0), Vertex.create(-0.5, 0.5, -0.5, 0, -1, 0, 0, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, 1, 0, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 0, 1, 0, 1), Vertex.create(0.5, 0.5, -0.5, 0, 0, 1, 1, 1), Vertex.create(0.5, -0.5, -0.5, 0, 0, 1, 1, 0), Vertex.create(-0.5, -0.5, 0.5, 0, 0, -1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 0, 0, -1, 1, 0), Vertex.create(0.5, 0.5, 0.5, 0, 0, -1, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 0, -1, 0, 1), Vertex.create(-0.5, -0.5, 0.5, 1, 0, 0, 0, 1), Vertex.create(-0.5, 0.5, 0.5, 1, 0, 0, 1, 1), Vertex.create(-0.5, 0.5, -0.5, 1, 0, 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, 1, 0, 0, 0, 0), Vertex.create(0.5, -0.5, 0.5, -1, 0, 0, 0, 1), Vertex.create(0.5, -0.5, -0.5, -1, 0, 0, 0, 0), Vertex.create(0.5, 0.5, -0.5, -1, 0, 0, 1, 0), Vertex.create(0.5, 0.5, 0.5, -1, 0, 0, 1, 1)), Dut.list(Face.triangle(0, 2, 1), Face.triangle(0, 3, 2), Face.triangle(4, 6, 5), Face.triangle(4, 7, 6), Face.triangle(8, 10, 9), Face.triangle(8, 11, 10), Face.triangle(12, 14, 13), Face.triangle(12, 15, 14), Face.triangle(16, 18, 17), Face.triangle(16, 19, 18), Face.triangle(20, 22, 21), Face.triangle(20, 23, 22)));
    return res;
  }

  static modelBoxDeformed1() {
    let en = Vec2.create(1, -1).normalize();
    let res = Mesh.model(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, -1, 0, 0, 1), Vertex.create(-0.5, -0.5, -0.5, 0, -1, 0, 0, 0), Vertex.create(0.5, -0.5, -0.5, 0, -1, 0, 1, 0), Vertex.create(0.5, -0.5, 0.5, 0, -1, 0, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 1, 0, 0, 1), Vertex.create(1.0, 0.5, 0.5, 0, 1, 0, 1, 1), Vertex.create(1.0, 0.5, -0.5, 0, 1, 0, 1, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 1, 0, 0, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, -1, 0, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 0, -1, 0, 1), Vertex.create(1.0, 0.5, -0.5, 0, 0, -1, 1, 1), Vertex.create(0.5, -0.5, -0.5, 0, 0, -1, 1, 0), Vertex.create(-0.5, -0.5, 0.5, 0, 0, 1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 0, 0, 1, 1, 0), Vertex.create(1.0, 0.5, 0.5, 0, 0, 1, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 0, 1, 0, 1), Vertex.create(-0.5, -0.5, 0.5, -1, 0, 0, 0, 1), Vertex.create(-0.5, 0.5, 0.5, -1, 0, 0, 1, 1), Vertex.create(-0.5, 0.5, -0.5, -1, 0, 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, -1, 0, 0, 0, 0), Vertex.create(0.5, -0.5, 0.5, en.x(), en.y(), 0, 0, 1), Vertex.create(0.5, -0.5, -0.5, en.x(), en.y(), 0, 0, 0), Vertex.create(1.0, 0.5, -0.5, en.x(), en.y(), 0, 1, 0), Vertex.create(1.0, 0.5, 0.5, en.x(), en.y(), 0, 1, 1)), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23)));
    return res;
  }

  static modelBoxDeformed2() {
    let en = Vec2.create(-1, -1).normalize();
    let res = Mesh.model(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, -1, 0, 0, 1), Vertex.create(-0.5, -0.5, -0.5, 0, -1, 0, 0, 0), Vertex.create(0.5, -0.5, -0.5, 0, -1, 0, 1, 0), Vertex.create(0.5, -0.5, 0.5, 0, -1, 0, 1, 1), Vertex.create(-1.0, 0.5, 0.5, 0, 1, 0, 0, 1), Vertex.create(0.5, 0.5, 0.5, 0, 1, 0, 1, 1), Vertex.create(0.5, 0.5, -0.5, 0, 1, 0, 1, 0), Vertex.create(-1.0, 0.5, -0.5, 0, 1, 0, 0, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, -1, 0, 0), Vertex.create(-1.0, 0.5, -0.5, 0, 0, -1, 0, 1), Vertex.create(0.5, 0.5, -0.5, 0, 0, -1, 1, 1), Vertex.create(0.5, -0.5, -0.5, 0, 0, -1, 1, 0), Vertex.create(-0.5, -0.5, 0.5, 0, 0, 1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 0, 0, 1, 1, 0), Vertex.create(0.5, 0.5, 0.5, 0, 0, 1, 1, 1), Vertex.create(-1.0, 0.5, 0.5, 0, 0, 1, 0, 1), Vertex.create(-0.5, -0.5, 0.5, en.x(), en.y(), 0, 0, 1), Vertex.create(-1.0, 0.5, 0.5, en.x(), en.y(), 0, 1, 1), Vertex.create(-1.0, 0.5, -0.5, en.x(), en.y(), 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, en.x(), en.y(), 0, 0, 0), Vertex.create(0.5, -0.5, 0.5, 1, 0, 0, 0, 1), Vertex.create(0.5, -0.5, -0.5, 1, 0, 0, 0, 0), Vertex.create(0.5, 0.5, -0.5, 1, 0, 0, 1, 0), Vertex.create(0.5, 0.5, 0.5, 1, 0, 0, 1, 1)), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23)));
    return res;
  }

}
class BasicApp03 {
  box = MeshId.of("box");
  whiteBox = MeshId.of("white-box");
  time = 0;
  constructor() {
  }

  getClass() {
    return "BasicApp03";
  }

  move(drivers, dt) {
    this.time = this.time+dt;
    let gDriver = drivers.getDriver("GraphicsDriver");
    let aspect = gDriver.getScreenViewport().getAspect();
    let fovy = aspect>=1?FMath.toRadians(60):FMath.toRadians(90);
    let m = 2*FMath.sin(this.time/3);
    let cam = Camera.persp(fovy, aspect, 1.0, 50.0).lookAt(Vec3.create(m, 2, 7), Vec3.ZERO, Vec3.create(0, 1, 0));
    let dirLight = Light.directional(LightColor.create(Rgb.gray(0.4), Rgb.gray(0.6), Rgb.gray(0.6)), Vec3.create(-0.3, -0.8, -0.4).normalize());
    let pointLight = Light.pointQadratic(LightColor.create(Rgb.BLACK, Rgb.BLUE, Rgb.WHITE), Vec3.create(0, 0, 3.6), 4);
    let spotLightColor = LightColor.create(Rgb.BLACK, Rgb.WHITE, Rgb.WHITE);
    let spotLightCone = LightCone.create(FMath.PI/9, FMath.PI/6);
    let spotLight1 = Light.spotQuadratic(spotLightColor, Vec3.create(0, 2, 0), Vec3.create(0.4+m, -1, 0.2).normalize(), 8, spotLightCone);
    let spotLight2 = Light.spotQuadratic(spotLightColor, Vec3.create(0, 2, 0), Vec3.create(0.4, -1, 0.2+m/2).normalize(), 8, spotLightCone);
    gDriver.clearBuffers(BufferId.COLOR, BufferId.DEPTH);
    let objRenderer = gDriver.startRenderer("SceneRenderer", SceneEnvironment.create(cam, dirLight, pointLight, spotLight1, spotLight2));
    objRenderer.render(this.box, Mat44.trans(0, -1, 0).mul(Mat44.scale(20, 1, 20)), Material.WHITE_PLASTIC);
    objRenderer.render(this.box, Mat44.trans(-3, 0, -3), Material.GOLD);
    objRenderer.render(this.box, Mat44.trans(0, 0, -3), Material.SILVER);
    objRenderer.render(this.box, Mat44.trans(3, 0, -3), Material.COPPER);
    objRenderer.render(this.box, Mat44.trans(-3, 0, 0), Material.GOLD);
    objRenderer.render(this.box, Mat44.trans(0, 0, 0), Material.SILVER);
    objRenderer.render(this.box, Mat44.trans(3, 0, 0), Material.COPPER);
    objRenderer.render(this.box, Mat44.trans(-3, 0, 3), Material.GOLD);
    objRenderer.render(this.box, Mat44.trans(0, 0, 3), Material.SILVER);
    objRenderer.render(this.box, Mat44.trans(3, 0, 3), Material.WHITE_PLASTIC);
    objRenderer.end();
    let crndr = gDriver.startRenderer("ColorRenderer", BasicEnvironment.create(cam));
    crndr.render(this.whiteBox, Mat44.trans(pointLight.getPos()).mul(Mat44.scale(0.05)));
    crndr.render(this.whiteBox, Mat44.trans(spotLight1.getPos()).mul(Mat44.scale(0.05)));
    crndr.render(this.whiteBox, Mat44.trans(spotLight2.getPos()).mul(Mat44.scale(0.05)));
    crndr.end();
  }

  init(drivers, properties) {
    let assets = drivers.getDriver("AssetManager");
    assets.put(this.box, BoxMeshFactory.fabricBox());
    assets.put(this.whiteBox, BoxMeshFactory.rgbBox(1, 1, 1));
    return Collections.emptyList();
  }

  close(drivers) {
  }

}


// -------------------------------------
// Management code
// -------------------------------------

/**
 * Callback when canvas is resized to keep it the full screen.
 */
function resizeCanvas() {
    const canvas = document.getElementById('glCanvas');
    if (document.fullscreenElement === canvas) {
        canvas.width = window.screen.width;
        canvas.height = window.screen.height;
    } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    if (gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (drivers) {
            let viewport = Viewport.create(0, 0, canvas.width, canvas.height);
            drivers.graphicsDriver.setScreenViewport(viewport);
        }
    }
}

/**
 * Toggles fullscreen.
 */
function toggleFullscreen() {
    const canvas = document.getElementById('glCanvas');
    if (!document.fullscreenElement) {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen();
        } else if (canvas.msRequestFullscreen) {
            canvas.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

/**
 * Initializes the web gl.
 */
function initWebGl() {
    const canvas = document.getElementById("glCanvas");
    gl = canvas.getContext("webgl2");

    if (!gl) {
        alert("Unable to initialize WebGL. Your browser may not support it.");
        return;
    }
    const ext = gl.getExtension('GMAN_debug_helper');
    if (ext) {
        ext.setConfiguration({
            failUnsetUniforms: false
        });
    }
    // Ensure canvas is properly sized after WebGL initialization
    resizeCanvas();
}

/**
 * App loop funciton. This loops forever.
 */
function appLoop() {
    if (appLoadingFutures.isEmpty()) {
        // app goes
        let dt = 0.0;
        if (time === 0.0) {
            time = Date.now() * 0.001;
        } else {
            const timeNext = Date.now() * 0.001;
            dt = timeNext - time;
            time = timeNext;
        }
        tyracornApp.move(drivers, dt);
    } else {
        // still loading
        let futs = new ArrayList();
        for (let future of appLoadingFutures) {
            if (future.isDone()) {
                if (!future.isSuccess()) {
                    throw "Initialization failed";
                }
            } else {
                futs.add(future);
            }
            appLoadingFutures = futs;
        }
        if (appLoadingFutures.isEmpty()) {
            drivers.getDriver("AssetManager").syncToDrivers();
        }
    }
    requestAnimationFrame(() => appLoop());
}

/**
 * Main function.
 */
async function main() {
    initWebGl();

    // register events to resize the canvas when needed
    document.addEventListener('fullscreenchange', resizeCanvas);
    document.addEventListener('webkitfullscreenchange', resizeCanvas);
    document.addEventListener('mozfullscreenchange', resizeCanvas);
    document.addEventListener('MSFullscreenChange', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Ensure canvas is properly sized after DOM is ready
    setTimeout(resizeCanvas, 0);

    drivers = new DriverProvider();
    resizeCanvas();
    drivers.getDriver("GraphicsDriver").init();
    tyracornApp = new BasicApp03();

    appLoadingFutures = tyracornApp.init(drivers, {});
    if (appLoadingFutures.isEmpty()) {
        drivers.getDriver("AssetManager").syncToDrivers();
    }
    appLoop();
}


// -------------------------------------
// Start the app when the page loads
// -------------------------------------
window.addEventListener('load', main); 