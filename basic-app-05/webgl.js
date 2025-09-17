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
let mouseDown = false;
let mouseLastDragX = 0;
let mouseLastDragY = 0;
let ongoingTouches = [];
let canvas;

// -------------------------------------
// Guard
// -------------------------------------

class Arrays {
    static copyOf(original, newLength) {
        if (original instanceof ArrayBuffer && newLength === undefined) {
            // handle case of array buffer, this is like a bridge between js and java
            return original;
        }
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

String.prototype.isEmpty = function () {
    return this.length === 0;
};
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

    addAll(collection) {
        for (const item of collection) {
            this._data.push(item);
        }
        this._updateLength();
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

    getOrDefault(key, def) {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (this.keysEqual(bucket[i][0], key)) {
                return bucket[i][1];
            }
        }
        return def;
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
 * Reference identifier.
 */
class StringParser {
    input;
    cursor = 0;
    /**
     * Creates new instnace.
     * @param {String} str
     * @returns {StringParser} created parser
     */
    constructor(str) {
        if (!str) {
            throw new Error("input string must be defined");
        }
        this.input = str;
        this.cursor = 0;
    }

    /**
     * Returns true if next character is available to read.
     * False if end of input string has been reached.
     *
     * @return {boolean} true if there is next character, false otherwise
     */
    hasNext() {
        return this.cursor < this.input.length;
    }

    /**
     * Reads one character. Cursor is moved by one character.
     *
     * @return {String} character
     */
    readCharacter() {
        const res = this.input.substring(this.cursor, this.cursor + 1);
        ++this.cursor;
        return res;
    }

    /**
     * Looks up character without moving the cursor.
     *
     * @return {String} character
     */
    lookupCharacter() {
        return this.input.substring(this.cursor, this.cursor + 1);
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

    /**
     * Placeholder for unmodifiable map.
     * 
     * @param {HashMap} input map
     * @returns {HashMap} unmodifiable map
     */
    static unmodifiableMap(map) {
        return map;
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

    static copyList(collection) {
        let res = new ArrayList();
        res.addAll(collection)
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
        if (map === null || map === undefined) {
            return res;
        }
        res.putAll(map);
        return res;
    }
}
/**
 * Function utilities.
 */
class Functions {

    /**
     * Applies function to the input parameter.
     * 
     * @param {Function} fnc function to apply
     * @param {Any} input input to use
     * @return {Any} result after application
     */
    static apply(fnc, input) {
        return fnc(input);
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
/*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) */
!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t="undefined"!=typeof globalThis?globalThis:t||self).pako={})}(this,(function(t){"use strict";function e(t){let e=t.length;for(;--e>=0;)t[e]=0}const a=256,i=286,n=30,s=15,r=new Uint8Array([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]),o=new Uint8Array([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]),l=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7]),h=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),d=new Array(576);e(d);const _=new Array(60);e(_);const f=new Array(512);e(f);const c=new Array(256);e(c);const u=new Array(29);e(u);const w=new Array(n);function m(t,e,a,i,n){this.static_tree=t,this.extra_bits=e,this.extra_base=a,this.elems=i,this.max_length=n,this.has_stree=t&&t.length}let b,g,p;function k(t,e){this.dyn_tree=t,this.max_code=0,this.stat_desc=e}e(w);const v=t=>t<256?f[t]:f[256+(t>>>7)],y=(t,e)=>{t.pending_buf[t.pending++]=255&e,t.pending_buf[t.pending++]=e>>>8&255},x=(t,e,a)=>{t.bi_valid>16-a?(t.bi_buf|=e<<t.bi_valid&65535,y(t,t.bi_buf),t.bi_buf=e>>16-t.bi_valid,t.bi_valid+=a-16):(t.bi_buf|=e<<t.bi_valid&65535,t.bi_valid+=a)},z=(t,e,a)=>{x(t,a[2*e],a[2*e+1])},A=(t,e)=>{let a=0;do{a|=1&t,t>>>=1,a<<=1}while(--e>0);return a>>>1},E=(t,e,a)=>{const i=new Array(16);let n,r,o=0;for(n=1;n<=s;n++)o=o+a[n-1]<<1,i[n]=o;for(r=0;r<=e;r++){let e=t[2*r+1];0!==e&&(t[2*r]=A(i[e]++,e))}},R=t=>{let e;for(e=0;e<i;e++)t.dyn_ltree[2*e]=0;for(e=0;e<n;e++)t.dyn_dtree[2*e]=0;for(e=0;e<19;e++)t.bl_tree[2*e]=0;t.dyn_ltree[512]=1,t.opt_len=t.static_len=0,t.sym_next=t.matches=0},Z=t=>{t.bi_valid>8?y(t,t.bi_buf):t.bi_valid>0&&(t.pending_buf[t.pending++]=t.bi_buf),t.bi_buf=0,t.bi_valid=0},U=(t,e,a,i)=>{const n=2*e,s=2*a;return t[n]<t[s]||t[n]===t[s]&&i[e]<=i[a]},S=(t,e,a)=>{const i=t.heap[a];let n=a<<1;for(;n<=t.heap_len&&(n<t.heap_len&&U(e,t.heap[n+1],t.heap[n],t.depth)&&n++,!U(e,i,t.heap[n],t.depth));)t.heap[a]=t.heap[n],a=n,n<<=1;t.heap[a]=i},D=(t,e,i)=>{let n,s,l,h,d=0;if(0!==t.sym_next)do{n=255&t.pending_buf[t.sym_buf+d++],n+=(255&t.pending_buf[t.sym_buf+d++])<<8,s=t.pending_buf[t.sym_buf+d++],0===n?z(t,s,e):(l=c[s],z(t,l+a+1,e),h=r[l],0!==h&&(s-=u[l],x(t,s,h)),n--,l=v(n),z(t,l,i),h=o[l],0!==h&&(n-=w[l],x(t,n,h)))}while(d<t.sym_next);z(t,256,e)},T=(t,e)=>{const a=e.dyn_tree,i=e.stat_desc.static_tree,n=e.stat_desc.has_stree,r=e.stat_desc.elems;let o,l,h,d=-1;for(t.heap_len=0,t.heap_max=573,o=0;o<r;o++)0!==a[2*o]?(t.heap[++t.heap_len]=d=o,t.depth[o]=0):a[2*o+1]=0;for(;t.heap_len<2;)h=t.heap[++t.heap_len]=d<2?++d:0,a[2*h]=1,t.depth[h]=0,t.opt_len--,n&&(t.static_len-=i[2*h+1]);for(e.max_code=d,o=t.heap_len>>1;o>=1;o--)S(t,a,o);h=r;do{o=t.heap[1],t.heap[1]=t.heap[t.heap_len--],S(t,a,1),l=t.heap[1],t.heap[--t.heap_max]=o,t.heap[--t.heap_max]=l,a[2*h]=a[2*o]+a[2*l],t.depth[h]=(t.depth[o]>=t.depth[l]?t.depth[o]:t.depth[l])+1,a[2*o+1]=a[2*l+1]=h,t.heap[1]=h++,S(t,a,1)}while(t.heap_len>=2);t.heap[--t.heap_max]=t.heap[1],((t,e)=>{const a=e.dyn_tree,i=e.max_code,n=e.stat_desc.static_tree,r=e.stat_desc.has_stree,o=e.stat_desc.extra_bits,l=e.stat_desc.extra_base,h=e.stat_desc.max_length;let d,_,f,c,u,w,m=0;for(c=0;c<=s;c++)t.bl_count[c]=0;for(a[2*t.heap[t.heap_max]+1]=0,d=t.heap_max+1;d<573;d++)_=t.heap[d],c=a[2*a[2*_+1]+1]+1,c>h&&(c=h,m++),a[2*_+1]=c,_>i||(t.bl_count[c]++,u=0,_>=l&&(u=o[_-l]),w=a[2*_],t.opt_len+=w*(c+u),r&&(t.static_len+=w*(n[2*_+1]+u)));if(0!==m){do{for(c=h-1;0===t.bl_count[c];)c--;t.bl_count[c]--,t.bl_count[c+1]+=2,t.bl_count[h]--,m-=2}while(m>0);for(c=h;0!==c;c--)for(_=t.bl_count[c];0!==_;)f=t.heap[--d],f>i||(a[2*f+1]!==c&&(t.opt_len+=(c-a[2*f+1])*a[2*f],a[2*f+1]=c),_--)}})(t,e),E(a,d,t.bl_count)},O=(t,e,a)=>{let i,n,s=-1,r=e[1],o=0,l=7,h=4;for(0===r&&(l=138,h=3),e[2*(a+1)+1]=65535,i=0;i<=a;i++)n=r,r=e[2*(i+1)+1],++o<l&&n===r||(o<h?t.bl_tree[2*n]+=o:0!==n?(n!==s&&t.bl_tree[2*n]++,t.bl_tree[32]++):o<=10?t.bl_tree[34]++:t.bl_tree[36]++,o=0,s=n,0===r?(l=138,h=3):n===r?(l=6,h=3):(l=7,h=4))},I=(t,e,a)=>{let i,n,s=-1,r=e[1],o=0,l=7,h=4;for(0===r&&(l=138,h=3),i=0;i<=a;i++)if(n=r,r=e[2*(i+1)+1],!(++o<l&&n===r)){if(o<h)do{z(t,n,t.bl_tree)}while(0!=--o);else 0!==n?(n!==s&&(z(t,n,t.bl_tree),o--),z(t,16,t.bl_tree),x(t,o-3,2)):o<=10?(z(t,17,t.bl_tree),x(t,o-3,3)):(z(t,18,t.bl_tree),x(t,o-11,7));o=0,s=n,0===r?(l=138,h=3):n===r?(l=6,h=3):(l=7,h=4)}};let F=!1;const L=(t,e,a,i)=>{x(t,0+(i?1:0),3),Z(t),y(t,a),y(t,~a),a&&t.pending_buf.set(t.window.subarray(e,e+a),t.pending),t.pending+=a};var N=(t,e,i,n)=>{let s,r,o=0;t.level>0?(2===t.strm.data_type&&(t.strm.data_type=(t=>{let e,i=4093624447;for(e=0;e<=31;e++,i>>>=1)if(1&i&&0!==t.dyn_ltree[2*e])return 0;if(0!==t.dyn_ltree[18]||0!==t.dyn_ltree[20]||0!==t.dyn_ltree[26])return 1;for(e=32;e<a;e++)if(0!==t.dyn_ltree[2*e])return 1;return 0})(t)),T(t,t.l_desc),T(t,t.d_desc),o=(t=>{let e;for(O(t,t.dyn_ltree,t.l_desc.max_code),O(t,t.dyn_dtree,t.d_desc.max_code),T(t,t.bl_desc),e=18;e>=3&&0===t.bl_tree[2*h[e]+1];e--);return t.opt_len+=3*(e+1)+5+5+4,e})(t),s=t.opt_len+3+7>>>3,r=t.static_len+3+7>>>3,r<=s&&(s=r)):s=r=i+5,i+4<=s&&-1!==e?L(t,e,i,n):4===t.strategy||r===s?(x(t,2+(n?1:0),3),D(t,d,_)):(x(t,4+(n?1:0),3),((t,e,a,i)=>{let n;for(x(t,e-257,5),x(t,a-1,5),x(t,i-4,4),n=0;n<i;n++)x(t,t.bl_tree[2*h[n]+1],3);I(t,t.dyn_ltree,e-1),I(t,t.dyn_dtree,a-1)})(t,t.l_desc.max_code+1,t.d_desc.max_code+1,o+1),D(t,t.dyn_ltree,t.dyn_dtree)),R(t),n&&Z(t)},B={_tr_init:t=>{F||((()=>{let t,e,a,h,k;const v=new Array(16);for(a=0,h=0;h<28;h++)for(u[h]=a,t=0;t<1<<r[h];t++)c[a++]=h;for(c[a-1]=h,k=0,h=0;h<16;h++)for(w[h]=k,t=0;t<1<<o[h];t++)f[k++]=h;for(k>>=7;h<n;h++)for(w[h]=k<<7,t=0;t<1<<o[h]-7;t++)f[256+k++]=h;for(e=0;e<=s;e++)v[e]=0;for(t=0;t<=143;)d[2*t+1]=8,t++,v[8]++;for(;t<=255;)d[2*t+1]=9,t++,v[9]++;for(;t<=279;)d[2*t+1]=7,t++,v[7]++;for(;t<=287;)d[2*t+1]=8,t++,v[8]++;for(E(d,287,v),t=0;t<n;t++)_[2*t+1]=5,_[2*t]=A(t,5);b=new m(d,r,257,i,s),g=new m(_,o,0,n,s),p=new m(new Array(0),l,0,19,7)})(),F=!0),t.l_desc=new k(t.dyn_ltree,b),t.d_desc=new k(t.dyn_dtree,g),t.bl_desc=new k(t.bl_tree,p),t.bi_buf=0,t.bi_valid=0,R(t)},_tr_stored_block:L,_tr_flush_block:N,_tr_tally:(t,e,i)=>(t.pending_buf[t.sym_buf+t.sym_next++]=e,t.pending_buf[t.sym_buf+t.sym_next++]=e>>8,t.pending_buf[t.sym_buf+t.sym_next++]=i,0===e?t.dyn_ltree[2*i]++:(t.matches++,e--,t.dyn_ltree[2*(c[i]+a+1)]++,t.dyn_dtree[2*v(e)]++),t.sym_next===t.sym_end),_tr_align:t=>{x(t,2,3),z(t,256,d),(t=>{16===t.bi_valid?(y(t,t.bi_buf),t.bi_buf=0,t.bi_valid=0):t.bi_valid>=8&&(t.pending_buf[t.pending++]=255&t.bi_buf,t.bi_buf>>=8,t.bi_valid-=8)})(t)}};var C=(t,e,a,i)=>{let n=65535&t|0,s=t>>>16&65535|0,r=0;for(;0!==a;){r=a>2e3?2e3:a,a-=r;do{n=n+e[i++]|0,s=s+n|0}while(--r);n%=65521,s%=65521}return n|s<<16|0};const M=new Uint32Array((()=>{let t,e=[];for(var a=0;a<256;a++){t=a;for(var i=0;i<8;i++)t=1&t?3988292384^t>>>1:t>>>1;e[a]=t}return e})());var H=(t,e,a,i)=>{const n=M,s=i+a;t^=-1;for(let a=i;a<s;a++)t=t>>>8^n[255&(t^e[a])];return-1^t},j={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"},K={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_MEM_ERROR:-4,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};const{_tr_init:P,_tr_stored_block:Y,_tr_flush_block:G,_tr_tally:X,_tr_align:W}=B,{Z_NO_FLUSH:q,Z_PARTIAL_FLUSH:J,Z_FULL_FLUSH:Q,Z_FINISH:V,Z_BLOCK:$,Z_OK:tt,Z_STREAM_END:et,Z_STREAM_ERROR:at,Z_DATA_ERROR:it,Z_BUF_ERROR:nt,Z_DEFAULT_COMPRESSION:st,Z_FILTERED:rt,Z_HUFFMAN_ONLY:ot,Z_RLE:lt,Z_FIXED:ht,Z_DEFAULT_STRATEGY:dt,Z_UNKNOWN:_t,Z_DEFLATED:ft}=K,ct=258,ut=262,wt=42,mt=113,bt=666,gt=(t,e)=>(t.msg=j[e],e),pt=t=>2*t-(t>4?9:0),kt=t=>{let e=t.length;for(;--e>=0;)t[e]=0},vt=t=>{let e,a,i,n=t.w_size;e=t.hash_size,i=e;do{a=t.head[--i],t.head[i]=a>=n?a-n:0}while(--e);e=n,i=e;do{a=t.prev[--i],t.prev[i]=a>=n?a-n:0}while(--e)};let yt=(t,e,a)=>(e<<t.hash_shift^a)&t.hash_mask;const xt=t=>{const e=t.state;let a=e.pending;a>t.avail_out&&(a=t.avail_out),0!==a&&(t.output.set(e.pending_buf.subarray(e.pending_out,e.pending_out+a),t.next_out),t.next_out+=a,e.pending_out+=a,t.total_out+=a,t.avail_out-=a,e.pending-=a,0===e.pending&&(e.pending_out=0))},zt=(t,e)=>{G(t,t.block_start>=0?t.block_start:-1,t.strstart-t.block_start,e),t.block_start=t.strstart,xt(t.strm)},At=(t,e)=>{t.pending_buf[t.pending++]=e},Et=(t,e)=>{t.pending_buf[t.pending++]=e>>>8&255,t.pending_buf[t.pending++]=255&e},Rt=(t,e,a,i)=>{let n=t.avail_in;return n>i&&(n=i),0===n?0:(t.avail_in-=n,e.set(t.input.subarray(t.next_in,t.next_in+n),a),1===t.state.wrap?t.adler=C(t.adler,e,n,a):2===t.state.wrap&&(t.adler=H(t.adler,e,n,a)),t.next_in+=n,t.total_in+=n,n)},Zt=(t,e)=>{let a,i,n=t.max_chain_length,s=t.strstart,r=t.prev_length,o=t.nice_match;const l=t.strstart>t.w_size-ut?t.strstart-(t.w_size-ut):0,h=t.window,d=t.w_mask,_=t.prev,f=t.strstart+ct;let c=h[s+r-1],u=h[s+r];t.prev_length>=t.good_match&&(n>>=2),o>t.lookahead&&(o=t.lookahead);do{if(a=e,h[a+r]===u&&h[a+r-1]===c&&h[a]===h[s]&&h[++a]===h[s+1]){s+=2,a++;do{}while(h[++s]===h[++a]&&h[++s]===h[++a]&&h[++s]===h[++a]&&h[++s]===h[++a]&&h[++s]===h[++a]&&h[++s]===h[++a]&&h[++s]===h[++a]&&h[++s]===h[++a]&&s<f);if(i=ct-(f-s),s=f-ct,i>r){if(t.match_start=e,r=i,i>=o)break;c=h[s+r-1],u=h[s+r]}}}while((e=_[e&d])>l&&0!=--n);return r<=t.lookahead?r:t.lookahead},Ut=t=>{const e=t.w_size;let a,i,n;do{if(i=t.window_size-t.lookahead-t.strstart,t.strstart>=e+(e-ut)&&(t.window.set(t.window.subarray(e,e+e-i),0),t.match_start-=e,t.strstart-=e,t.block_start-=e,t.insert>t.strstart&&(t.insert=t.strstart),vt(t),i+=e),0===t.strm.avail_in)break;if(a=Rt(t.strm,t.window,t.strstart+t.lookahead,i),t.lookahead+=a,t.lookahead+t.insert>=3)for(n=t.strstart-t.insert,t.ins_h=t.window[n],t.ins_h=yt(t,t.ins_h,t.window[n+1]);t.insert&&(t.ins_h=yt(t,t.ins_h,t.window[n+3-1]),t.prev[n&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=n,n++,t.insert--,!(t.lookahead+t.insert<3)););}while(t.lookahead<ut&&0!==t.strm.avail_in)},St=(t,e)=>{let a,i,n,s=t.pending_buf_size-5>t.w_size?t.w_size:t.pending_buf_size-5,r=0,o=t.strm.avail_in;do{if(a=65535,n=t.bi_valid+42>>3,t.strm.avail_out<n)break;if(n=t.strm.avail_out-n,i=t.strstart-t.block_start,a>i+t.strm.avail_in&&(a=i+t.strm.avail_in),a>n&&(a=n),a<s&&(0===a&&e!==V||e===q||a!==i+t.strm.avail_in))break;r=e===V&&a===i+t.strm.avail_in?1:0,Y(t,0,0,r),t.pending_buf[t.pending-4]=a,t.pending_buf[t.pending-3]=a>>8,t.pending_buf[t.pending-2]=~a,t.pending_buf[t.pending-1]=~a>>8,xt(t.strm),i&&(i>a&&(i=a),t.strm.output.set(t.window.subarray(t.block_start,t.block_start+i),t.strm.next_out),t.strm.next_out+=i,t.strm.avail_out-=i,t.strm.total_out+=i,t.block_start+=i,a-=i),a&&(Rt(t.strm,t.strm.output,t.strm.next_out,a),t.strm.next_out+=a,t.strm.avail_out-=a,t.strm.total_out+=a)}while(0===r);return o-=t.strm.avail_in,o&&(o>=t.w_size?(t.matches=2,t.window.set(t.strm.input.subarray(t.strm.next_in-t.w_size,t.strm.next_in),0),t.strstart=t.w_size,t.insert=t.strstart):(t.window_size-t.strstart<=o&&(t.strstart-=t.w_size,t.window.set(t.window.subarray(t.w_size,t.w_size+t.strstart),0),t.matches<2&&t.matches++,t.insert>t.strstart&&(t.insert=t.strstart)),t.window.set(t.strm.input.subarray(t.strm.next_in-o,t.strm.next_in),t.strstart),t.strstart+=o,t.insert+=o>t.w_size-t.insert?t.w_size-t.insert:o),t.block_start=t.strstart),t.high_water<t.strstart&&(t.high_water=t.strstart),r?4:e!==q&&e!==V&&0===t.strm.avail_in&&t.strstart===t.block_start?2:(n=t.window_size-t.strstart,t.strm.avail_in>n&&t.block_start>=t.w_size&&(t.block_start-=t.w_size,t.strstart-=t.w_size,t.window.set(t.window.subarray(t.w_size,t.w_size+t.strstart),0),t.matches<2&&t.matches++,n+=t.w_size,t.insert>t.strstart&&(t.insert=t.strstart)),n>t.strm.avail_in&&(n=t.strm.avail_in),n&&(Rt(t.strm,t.window,t.strstart,n),t.strstart+=n,t.insert+=n>t.w_size-t.insert?t.w_size-t.insert:n),t.high_water<t.strstart&&(t.high_water=t.strstart),n=t.bi_valid+42>>3,n=t.pending_buf_size-n>65535?65535:t.pending_buf_size-n,s=n>t.w_size?t.w_size:n,i=t.strstart-t.block_start,(i>=s||(i||e===V)&&e!==q&&0===t.strm.avail_in&&i<=n)&&(a=i>n?n:i,r=e===V&&0===t.strm.avail_in&&a===i?1:0,Y(t,t.block_start,a,r),t.block_start+=a,xt(t.strm)),r?3:1)},Dt=(t,e)=>{let a,i;for(;;){if(t.lookahead<ut){if(Ut(t),t.lookahead<ut&&e===q)return 1;if(0===t.lookahead)break}if(a=0,t.lookahead>=3&&(t.ins_h=yt(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),0!==a&&t.strstart-a<=t.w_size-ut&&(t.match_length=Zt(t,a)),t.match_length>=3)if(i=X(t,t.strstart-t.match_start,t.match_length-3),t.lookahead-=t.match_length,t.match_length<=t.max_lazy_match&&t.lookahead>=3){t.match_length--;do{t.strstart++,t.ins_h=yt(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart}while(0!=--t.match_length);t.strstart++}else t.strstart+=t.match_length,t.match_length=0,t.ins_h=t.window[t.strstart],t.ins_h=yt(t,t.ins_h,t.window[t.strstart+1]);else i=X(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++;if(i&&(zt(t,!1),0===t.strm.avail_out))return 1}return t.insert=t.strstart<2?t.strstart:2,e===V?(zt(t,!0),0===t.strm.avail_out?3:4):t.sym_next&&(zt(t,!1),0===t.strm.avail_out)?1:2},Tt=(t,e)=>{let a,i,n;for(;;){if(t.lookahead<ut){if(Ut(t),t.lookahead<ut&&e===q)return 1;if(0===t.lookahead)break}if(a=0,t.lookahead>=3&&(t.ins_h=yt(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart),t.prev_length=t.match_length,t.prev_match=t.match_start,t.match_length=2,0!==a&&t.prev_length<t.max_lazy_match&&t.strstart-a<=t.w_size-ut&&(t.match_length=Zt(t,a),t.match_length<=5&&(t.strategy===rt||3===t.match_length&&t.strstart-t.match_start>4096)&&(t.match_length=2)),t.prev_length>=3&&t.match_length<=t.prev_length){n=t.strstart+t.lookahead-3,i=X(t,t.strstart-1-t.prev_match,t.prev_length-3),t.lookahead-=t.prev_length-1,t.prev_length-=2;do{++t.strstart<=n&&(t.ins_h=yt(t,t.ins_h,t.window[t.strstart+3-1]),a=t.prev[t.strstart&t.w_mask]=t.head[t.ins_h],t.head[t.ins_h]=t.strstart)}while(0!=--t.prev_length);if(t.match_available=0,t.match_length=2,t.strstart++,i&&(zt(t,!1),0===t.strm.avail_out))return 1}else if(t.match_available){if(i=X(t,0,t.window[t.strstart-1]),i&&zt(t,!1),t.strstart++,t.lookahead--,0===t.strm.avail_out)return 1}else t.match_available=1,t.strstart++,t.lookahead--}return t.match_available&&(i=X(t,0,t.window[t.strstart-1]),t.match_available=0),t.insert=t.strstart<2?t.strstart:2,e===V?(zt(t,!0),0===t.strm.avail_out?3:4):t.sym_next&&(zt(t,!1),0===t.strm.avail_out)?1:2};function Ot(t,e,a,i,n){this.good_length=t,this.max_lazy=e,this.nice_length=a,this.max_chain=i,this.func=n}const It=[new Ot(0,0,0,0,St),new Ot(4,4,8,4,Dt),new Ot(4,5,16,8,Dt),new Ot(4,6,32,32,Dt),new Ot(4,4,16,16,Tt),new Ot(8,16,32,32,Tt),new Ot(8,16,128,128,Tt),new Ot(8,32,128,256,Tt),new Ot(32,128,258,1024,Tt),new Ot(32,258,258,4096,Tt)];function Ft(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=ft,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new Uint16Array(1146),this.dyn_dtree=new Uint16Array(122),this.bl_tree=new Uint16Array(78),kt(this.dyn_ltree),kt(this.dyn_dtree),kt(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new Uint16Array(16),this.heap=new Uint16Array(573),kt(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new Uint16Array(573),kt(this.depth),this.sym_buf=0,this.lit_bufsize=0,this.sym_next=0,this.sym_end=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}const Lt=t=>{if(!t)return 1;const e=t.state;return!e||e.strm!==t||e.status!==wt&&57!==e.status&&69!==e.status&&73!==e.status&&91!==e.status&&103!==e.status&&e.status!==mt&&e.status!==bt?1:0},Nt=t=>{if(Lt(t))return gt(t,at);t.total_in=t.total_out=0,t.data_type=_t;const e=t.state;return e.pending=0,e.pending_out=0,e.wrap<0&&(e.wrap=-e.wrap),e.status=2===e.wrap?57:e.wrap?wt:mt,t.adler=2===e.wrap?0:1,e.last_flush=-2,P(e),tt},Bt=t=>{const e=Nt(t);var a;return e===tt&&((a=t.state).window_size=2*a.w_size,kt(a.head),a.max_lazy_match=It[a.level].max_lazy,a.good_match=It[a.level].good_length,a.nice_match=It[a.level].nice_length,a.max_chain_length=It[a.level].max_chain,a.strstart=0,a.block_start=0,a.lookahead=0,a.insert=0,a.match_length=a.prev_length=2,a.match_available=0,a.ins_h=0),e},Ct=(t,e,a,i,n,s)=>{if(!t)return at;let r=1;if(e===st&&(e=6),i<0?(r=0,i=-i):i>15&&(r=2,i-=16),n<1||n>9||a!==ft||i<8||i>15||e<0||e>9||s<0||s>ht||8===i&&1!==r)return gt(t,at);8===i&&(i=9);const o=new Ft;return t.state=o,o.strm=t,o.status=wt,o.wrap=r,o.gzhead=null,o.w_bits=i,o.w_size=1<<o.w_bits,o.w_mask=o.w_size-1,o.hash_bits=n+7,o.hash_size=1<<o.hash_bits,o.hash_mask=o.hash_size-1,o.hash_shift=~~((o.hash_bits+3-1)/3),o.window=new Uint8Array(2*o.w_size),o.head=new Uint16Array(o.hash_size),o.prev=new Uint16Array(o.w_size),o.lit_bufsize=1<<n+6,o.pending_buf_size=4*o.lit_bufsize,o.pending_buf=new Uint8Array(o.pending_buf_size),o.sym_buf=o.lit_bufsize,o.sym_end=3*(o.lit_bufsize-1),o.level=e,o.strategy=s,o.method=a,Bt(t)};var Mt={deflateInit:(t,e)=>Ct(t,e,ft,15,8,dt),deflateInit2:Ct,deflateReset:Bt,deflateResetKeep:Nt,deflateSetHeader:(t,e)=>Lt(t)||2!==t.state.wrap?at:(t.state.gzhead=e,tt),deflate:(t,e)=>{if(Lt(t)||e>$||e<0)return t?gt(t,at):at;const a=t.state;if(!t.output||0!==t.avail_in&&!t.input||a.status===bt&&e!==V)return gt(t,0===t.avail_out?nt:at);const i=a.last_flush;if(a.last_flush=e,0!==a.pending){if(xt(t),0===t.avail_out)return a.last_flush=-1,tt}else if(0===t.avail_in&&pt(e)<=pt(i)&&e!==V)return gt(t,nt);if(a.status===bt&&0!==t.avail_in)return gt(t,nt);if(a.status===wt&&0===a.wrap&&(a.status=mt),a.status===wt){let e=ft+(a.w_bits-8<<4)<<8,i=-1;if(i=a.strategy>=ot||a.level<2?0:a.level<6?1:6===a.level?2:3,e|=i<<6,0!==a.strstart&&(e|=32),e+=31-e%31,Et(a,e),0!==a.strstart&&(Et(a,t.adler>>>16),Et(a,65535&t.adler)),t.adler=1,a.status=mt,xt(t),0!==a.pending)return a.last_flush=-1,tt}if(57===a.status)if(t.adler=0,At(a,31),At(a,139),At(a,8),a.gzhead)At(a,(a.gzhead.text?1:0)+(a.gzhead.hcrc?2:0)+(a.gzhead.extra?4:0)+(a.gzhead.name?8:0)+(a.gzhead.comment?16:0)),At(a,255&a.gzhead.time),At(a,a.gzhead.time>>8&255),At(a,a.gzhead.time>>16&255),At(a,a.gzhead.time>>24&255),At(a,9===a.level?2:a.strategy>=ot||a.level<2?4:0),At(a,255&a.gzhead.os),a.gzhead.extra&&a.gzhead.extra.length&&(At(a,255&a.gzhead.extra.length),At(a,a.gzhead.extra.length>>8&255)),a.gzhead.hcrc&&(t.adler=H(t.adler,a.pending_buf,a.pending,0)),a.gzindex=0,a.status=69;else if(At(a,0),At(a,0),At(a,0),At(a,0),At(a,0),At(a,9===a.level?2:a.strategy>=ot||a.level<2?4:0),At(a,3),a.status=mt,xt(t),0!==a.pending)return a.last_flush=-1,tt;if(69===a.status){if(a.gzhead.extra){let e=a.pending,i=(65535&a.gzhead.extra.length)-a.gzindex;for(;a.pending+i>a.pending_buf_size;){let n=a.pending_buf_size-a.pending;if(a.pending_buf.set(a.gzhead.extra.subarray(a.gzindex,a.gzindex+n),a.pending),a.pending=a.pending_buf_size,a.gzhead.hcrc&&a.pending>e&&(t.adler=H(t.adler,a.pending_buf,a.pending-e,e)),a.gzindex+=n,xt(t),0!==a.pending)return a.last_flush=-1,tt;e=0,i-=n}let n=new Uint8Array(a.gzhead.extra);a.pending_buf.set(n.subarray(a.gzindex,a.gzindex+i),a.pending),a.pending+=i,a.gzhead.hcrc&&a.pending>e&&(t.adler=H(t.adler,a.pending_buf,a.pending-e,e)),a.gzindex=0}a.status=73}if(73===a.status){if(a.gzhead.name){let e,i=a.pending;do{if(a.pending===a.pending_buf_size){if(a.gzhead.hcrc&&a.pending>i&&(t.adler=H(t.adler,a.pending_buf,a.pending-i,i)),xt(t),0!==a.pending)return a.last_flush=-1,tt;i=0}e=a.gzindex<a.gzhead.name.length?255&a.gzhead.name.charCodeAt(a.gzindex++):0,At(a,e)}while(0!==e);a.gzhead.hcrc&&a.pending>i&&(t.adler=H(t.adler,a.pending_buf,a.pending-i,i)),a.gzindex=0}a.status=91}if(91===a.status){if(a.gzhead.comment){let e,i=a.pending;do{if(a.pending===a.pending_buf_size){if(a.gzhead.hcrc&&a.pending>i&&(t.adler=H(t.adler,a.pending_buf,a.pending-i,i)),xt(t),0!==a.pending)return a.last_flush=-1,tt;i=0}e=a.gzindex<a.gzhead.comment.length?255&a.gzhead.comment.charCodeAt(a.gzindex++):0,At(a,e)}while(0!==e);a.gzhead.hcrc&&a.pending>i&&(t.adler=H(t.adler,a.pending_buf,a.pending-i,i))}a.status=103}if(103===a.status){if(a.gzhead.hcrc){if(a.pending+2>a.pending_buf_size&&(xt(t),0!==a.pending))return a.last_flush=-1,tt;At(a,255&t.adler),At(a,t.adler>>8&255),t.adler=0}if(a.status=mt,xt(t),0!==a.pending)return a.last_flush=-1,tt}if(0!==t.avail_in||0!==a.lookahead||e!==q&&a.status!==bt){let i=0===a.level?St(a,e):a.strategy===ot?((t,e)=>{let a;for(;;){if(0===t.lookahead&&(Ut(t),0===t.lookahead)){if(e===q)return 1;break}if(t.match_length=0,a=X(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++,a&&(zt(t,!1),0===t.strm.avail_out))return 1}return t.insert=0,e===V?(zt(t,!0),0===t.strm.avail_out?3:4):t.sym_next&&(zt(t,!1),0===t.strm.avail_out)?1:2})(a,e):a.strategy===lt?((t,e)=>{let a,i,n,s;const r=t.window;for(;;){if(t.lookahead<=ct){if(Ut(t),t.lookahead<=ct&&e===q)return 1;if(0===t.lookahead)break}if(t.match_length=0,t.lookahead>=3&&t.strstart>0&&(n=t.strstart-1,i=r[n],i===r[++n]&&i===r[++n]&&i===r[++n])){s=t.strstart+ct;do{}while(i===r[++n]&&i===r[++n]&&i===r[++n]&&i===r[++n]&&i===r[++n]&&i===r[++n]&&i===r[++n]&&i===r[++n]&&n<s);t.match_length=ct-(s-n),t.match_length>t.lookahead&&(t.match_length=t.lookahead)}if(t.match_length>=3?(a=X(t,1,t.match_length-3),t.lookahead-=t.match_length,t.strstart+=t.match_length,t.match_length=0):(a=X(t,0,t.window[t.strstart]),t.lookahead--,t.strstart++),a&&(zt(t,!1),0===t.strm.avail_out))return 1}return t.insert=0,e===V?(zt(t,!0),0===t.strm.avail_out?3:4):t.sym_next&&(zt(t,!1),0===t.strm.avail_out)?1:2})(a,e):It[a.level].func(a,e);if(3!==i&&4!==i||(a.status=bt),1===i||3===i)return 0===t.avail_out&&(a.last_flush=-1),tt;if(2===i&&(e===J?W(a):e!==$&&(Y(a,0,0,!1),e===Q&&(kt(a.head),0===a.lookahead&&(a.strstart=0,a.block_start=0,a.insert=0))),xt(t),0===t.avail_out))return a.last_flush=-1,tt}return e!==V?tt:a.wrap<=0?et:(2===a.wrap?(At(a,255&t.adler),At(a,t.adler>>8&255),At(a,t.adler>>16&255),At(a,t.adler>>24&255),At(a,255&t.total_in),At(a,t.total_in>>8&255),At(a,t.total_in>>16&255),At(a,t.total_in>>24&255)):(Et(a,t.adler>>>16),Et(a,65535&t.adler)),xt(t),a.wrap>0&&(a.wrap=-a.wrap),0!==a.pending?tt:et)},deflateEnd:t=>{if(Lt(t))return at;const e=t.state.status;return t.state=null,e===mt?gt(t,it):tt},deflateSetDictionary:(t,e)=>{let a=e.length;if(Lt(t))return at;const i=t.state,n=i.wrap;if(2===n||1===n&&i.status!==wt||i.lookahead)return at;if(1===n&&(t.adler=C(t.adler,e,a,0)),i.wrap=0,a>=i.w_size){0===n&&(kt(i.head),i.strstart=0,i.block_start=0,i.insert=0);let t=new Uint8Array(i.w_size);t.set(e.subarray(a-i.w_size,a),0),e=t,a=i.w_size}const s=t.avail_in,r=t.next_in,o=t.input;for(t.avail_in=a,t.next_in=0,t.input=e,Ut(i);i.lookahead>=3;){let t=i.strstart,e=i.lookahead-2;do{i.ins_h=yt(i,i.ins_h,i.window[t+3-1]),i.prev[t&i.w_mask]=i.head[i.ins_h],i.head[i.ins_h]=t,t++}while(--e);i.strstart=t,i.lookahead=2,Ut(i)}return i.strstart+=i.lookahead,i.block_start=i.strstart,i.insert=i.lookahead,i.lookahead=0,i.match_length=i.prev_length=2,i.match_available=0,t.next_in=r,t.input=o,t.avail_in=s,i.wrap=n,tt},deflateInfo:"pako deflate (from Nodeca project)"};const Ht=(t,e)=>Object.prototype.hasOwnProperty.call(t,e);var jt=function(t){const e=Array.prototype.slice.call(arguments,1);for(;e.length;){const a=e.shift();if(a){if("object"!=typeof a)throw new TypeError(a+"must be non-object");for(const e in a)Ht(a,e)&&(t[e]=a[e])}}return t},Kt=t=>{let e=0;for(let a=0,i=t.length;a<i;a++)e+=t[a].length;const a=new Uint8Array(e);for(let e=0,i=0,n=t.length;e<n;e++){let n=t[e];a.set(n,i),i+=n.length}return a};let Pt=!0;try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(t){Pt=!1}const Yt=new Uint8Array(256);for(let t=0;t<256;t++)Yt[t]=t>=252?6:t>=248?5:t>=240?4:t>=224?3:t>=192?2:1;Yt[254]=Yt[254]=1;var Gt=t=>{if("function"==typeof TextEncoder&&TextEncoder.prototype.encode)return(new TextEncoder).encode(t);let e,a,i,n,s,r=t.length,o=0;for(n=0;n<r;n++)a=t.charCodeAt(n),55296==(64512&a)&&n+1<r&&(i=t.charCodeAt(n+1),56320==(64512&i)&&(a=65536+(a-55296<<10)+(i-56320),n++)),o+=a<128?1:a<2048?2:a<65536?3:4;for(e=new Uint8Array(o),s=0,n=0;s<o;n++)a=t.charCodeAt(n),55296==(64512&a)&&n+1<r&&(i=t.charCodeAt(n+1),56320==(64512&i)&&(a=65536+(a-55296<<10)+(i-56320),n++)),a<128?e[s++]=a:a<2048?(e[s++]=192|a>>>6,e[s++]=128|63&a):a<65536?(e[s++]=224|a>>>12,e[s++]=128|a>>>6&63,e[s++]=128|63&a):(e[s++]=240|a>>>18,e[s++]=128|a>>>12&63,e[s++]=128|a>>>6&63,e[s++]=128|63&a);return e},Xt=(t,e)=>{const a=e||t.length;if("function"==typeof TextDecoder&&TextDecoder.prototype.decode)return(new TextDecoder).decode(t.subarray(0,e));let i,n;const s=new Array(2*a);for(n=0,i=0;i<a;){let e=t[i++];if(e<128){s[n++]=e;continue}let r=Yt[e];if(r>4)s[n++]=65533,i+=r-1;else{for(e&=2===r?31:3===r?15:7;r>1&&i<a;)e=e<<6|63&t[i++],r--;r>1?s[n++]=65533:e<65536?s[n++]=e:(e-=65536,s[n++]=55296|e>>10&1023,s[n++]=56320|1023&e)}}return((t,e)=>{if(e<65534&&t.subarray&&Pt)return String.fromCharCode.apply(null,t.length===e?t:t.subarray(0,e));let a="";for(let i=0;i<e;i++)a+=String.fromCharCode(t[i]);return a})(s,n)},Wt=(t,e)=>{(e=e||t.length)>t.length&&(e=t.length);let a=e-1;for(;a>=0&&128==(192&t[a]);)a--;return a<0||0===a?e:a+Yt[t[a]]>e?a:e};var qt=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0};const Jt=Object.prototype.toString,{Z_NO_FLUSH:Qt,Z_SYNC_FLUSH:Vt,Z_FULL_FLUSH:$t,Z_FINISH:te,Z_OK:ee,Z_STREAM_END:ae,Z_DEFAULT_COMPRESSION:ie,Z_DEFAULT_STRATEGY:ne,Z_DEFLATED:se}=K;function re(t){this.options=jt({level:ie,method:se,chunkSize:16384,windowBits:15,memLevel:8,strategy:ne},t||{});let e=this.options;e.raw&&e.windowBits>0?e.windowBits=-e.windowBits:e.gzip&&e.windowBits>0&&e.windowBits<16&&(e.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new qt,this.strm.avail_out=0;let a=Mt.deflateInit2(this.strm,e.level,e.method,e.windowBits,e.memLevel,e.strategy);if(a!==ee)throw new Error(j[a]);if(e.header&&Mt.deflateSetHeader(this.strm,e.header),e.dictionary){let t;if(t="string"==typeof e.dictionary?Gt(e.dictionary):"[object ArrayBuffer]"===Jt.call(e.dictionary)?new Uint8Array(e.dictionary):e.dictionary,a=Mt.deflateSetDictionary(this.strm,t),a!==ee)throw new Error(j[a]);this._dict_set=!0}}function oe(t,e){const a=new re(e);if(a.push(t,!0),a.err)throw a.msg||j[a.err];return a.result}re.prototype.push=function(t,e){const a=this.strm,i=this.options.chunkSize;let n,s;if(this.ended)return!1;for(s=e===~~e?e:!0===e?te:Qt,"string"==typeof t?a.input=Gt(t):"[object ArrayBuffer]"===Jt.call(t)?a.input=new Uint8Array(t):a.input=t,a.next_in=0,a.avail_in=a.input.length;;)if(0===a.avail_out&&(a.output=new Uint8Array(i),a.next_out=0,a.avail_out=i),(s===Vt||s===$t)&&a.avail_out<=6)this.onData(a.output.subarray(0,a.next_out)),a.avail_out=0;else{if(n=Mt.deflate(a,s),n===ae)return a.next_out>0&&this.onData(a.output.subarray(0,a.next_out)),n=Mt.deflateEnd(this.strm),this.onEnd(n),this.ended=!0,n===ee;if(0!==a.avail_out){if(s>0&&a.next_out>0)this.onData(a.output.subarray(0,a.next_out)),a.avail_out=0;else if(0===a.avail_in)break}else this.onData(a.output)}return!0},re.prototype.onData=function(t){this.chunks.push(t)},re.prototype.onEnd=function(t){t===ee&&(this.result=Kt(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg};var le={Deflate:re,deflate:oe,deflateRaw:function(t,e){return(e=e||{}).raw=!0,oe(t,e)},gzip:function(t,e){return(e=e||{}).gzip=!0,oe(t,e)},constants:K};const he=16209;var de=function(t,e){let a,i,n,s,r,o,l,h,d,_,f,c,u,w,m,b,g,p,k,v,y,x,z,A;const E=t.state;a=t.next_in,z=t.input,i=a+(t.avail_in-5),n=t.next_out,A=t.output,s=n-(e-t.avail_out),r=n+(t.avail_out-257),o=E.dmax,l=E.wsize,h=E.whave,d=E.wnext,_=E.window,f=E.hold,c=E.bits,u=E.lencode,w=E.distcode,m=(1<<E.lenbits)-1,b=(1<<E.distbits)-1;t:do{c<15&&(f+=z[a++]<<c,c+=8,f+=z[a++]<<c,c+=8),g=u[f&m];e:for(;;){if(p=g>>>24,f>>>=p,c-=p,p=g>>>16&255,0===p)A[n++]=65535&g;else{if(!(16&p)){if(0==(64&p)){g=u[(65535&g)+(f&(1<<p)-1)];continue e}if(32&p){E.mode=16191;break t}t.msg="invalid literal/length code",E.mode=he;break t}k=65535&g,p&=15,p&&(c<p&&(f+=z[a++]<<c,c+=8),k+=f&(1<<p)-1,f>>>=p,c-=p),c<15&&(f+=z[a++]<<c,c+=8,f+=z[a++]<<c,c+=8),g=w[f&b];a:for(;;){if(p=g>>>24,f>>>=p,c-=p,p=g>>>16&255,!(16&p)){if(0==(64&p)){g=w[(65535&g)+(f&(1<<p)-1)];continue a}t.msg="invalid distance code",E.mode=he;break t}if(v=65535&g,p&=15,c<p&&(f+=z[a++]<<c,c+=8,c<p&&(f+=z[a++]<<c,c+=8)),v+=f&(1<<p)-1,v>o){t.msg="invalid distance too far back",E.mode=he;break t}if(f>>>=p,c-=p,p=n-s,v>p){if(p=v-p,p>h&&E.sane){t.msg="invalid distance too far back",E.mode=he;break t}if(y=0,x=_,0===d){if(y+=l-p,p<k){k-=p;do{A[n++]=_[y++]}while(--p);y=n-v,x=A}}else if(d<p){if(y+=l+d-p,p-=d,p<k){k-=p;do{A[n++]=_[y++]}while(--p);if(y=0,d<k){p=d,k-=p;do{A[n++]=_[y++]}while(--p);y=n-v,x=A}}}else if(y+=d-p,p<k){k-=p;do{A[n++]=_[y++]}while(--p);y=n-v,x=A}for(;k>2;)A[n++]=x[y++],A[n++]=x[y++],A[n++]=x[y++],k-=3;k&&(A[n++]=x[y++],k>1&&(A[n++]=x[y++]))}else{y=n-v;do{A[n++]=A[y++],A[n++]=A[y++],A[n++]=A[y++],k-=3}while(k>2);k&&(A[n++]=A[y++],k>1&&(A[n++]=A[y++]))}break}}break}}while(a<i&&n<r);k=c>>3,a-=k,c-=k<<3,f&=(1<<c)-1,t.next_in=a,t.next_out=n,t.avail_in=a<i?i-a+5:5-(a-i),t.avail_out=n<r?r-n+257:257-(n-r),E.hold=f,E.bits=c};const _e=15,fe=new Uint16Array([3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0]),ce=new Uint8Array([16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78]),ue=new Uint16Array([1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0]),we=new Uint8Array([16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64]);var me=(t,e,a,i,n,s,r,o)=>{const l=o.bits;let h,d,_,f,c,u,w=0,m=0,b=0,g=0,p=0,k=0,v=0,y=0,x=0,z=0,A=null;const E=new Uint16Array(16),R=new Uint16Array(16);let Z,U,S,D=null;for(w=0;w<=_e;w++)E[w]=0;for(m=0;m<i;m++)E[e[a+m]]++;for(p=l,g=_e;g>=1&&0===E[g];g--);if(p>g&&(p=g),0===g)return n[s++]=20971520,n[s++]=20971520,o.bits=1,0;for(b=1;b<g&&0===E[b];b++);for(p<b&&(p=b),y=1,w=1;w<=_e;w++)if(y<<=1,y-=E[w],y<0)return-1;if(y>0&&(0===t||1!==g))return-1;for(R[1]=0,w=1;w<_e;w++)R[w+1]=R[w]+E[w];for(m=0;m<i;m++)0!==e[a+m]&&(r[R[e[a+m]]++]=m);if(0===t?(A=D=r,u=20):1===t?(A=fe,D=ce,u=257):(A=ue,D=we,u=0),z=0,m=0,w=b,c=s,k=p,v=0,_=-1,x=1<<p,f=x-1,1===t&&x>852||2===t&&x>592)return 1;for(;;){Z=w-v,r[m]+1<u?(U=0,S=r[m]):r[m]>=u?(U=D[r[m]-u],S=A[r[m]-u]):(U=96,S=0),h=1<<w-v,d=1<<k,b=d;do{d-=h,n[c+(z>>v)+d]=Z<<24|U<<16|S|0}while(0!==d);for(h=1<<w-1;z&h;)h>>=1;if(0!==h?(z&=h-1,z+=h):z=0,m++,0==--E[w]){if(w===g)break;w=e[a+r[m]]}if(w>p&&(z&f)!==_){for(0===v&&(v=p),c+=b,k=w-v,y=1<<k;k+v<g&&(y-=E[k+v],!(y<=0));)k++,y<<=1;if(x+=1<<k,1===t&&x>852||2===t&&x>592)return 1;_=z&f,n[_]=p<<24|k<<16|c-s|0}}return 0!==z&&(n[c+z]=w-v<<24|64<<16|0),o.bits=p,0};const{Z_FINISH:be,Z_BLOCK:ge,Z_TREES:pe,Z_OK:ke,Z_STREAM_END:ve,Z_NEED_DICT:ye,Z_STREAM_ERROR:xe,Z_DATA_ERROR:ze,Z_MEM_ERROR:Ae,Z_BUF_ERROR:Ee,Z_DEFLATED:Re}=K,Ze=16180,Ue=16190,Se=16191,De=16192,Te=16194,Oe=16199,Ie=16200,Fe=16206,Le=16209,Ne=t=>(t>>>24&255)+(t>>>8&65280)+((65280&t)<<8)+((255&t)<<24);function Be(){this.strm=null,this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Uint16Array(320),this.work=new Uint16Array(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}const Ce=t=>{if(!t)return 1;const e=t.state;return!e||e.strm!==t||e.mode<Ze||e.mode>16211?1:0},Me=t=>{if(Ce(t))return xe;const e=t.state;return t.total_in=t.total_out=e.total=0,t.msg="",e.wrap&&(t.adler=1&e.wrap),e.mode=Ze,e.last=0,e.havedict=0,e.flags=-1,e.dmax=32768,e.head=null,e.hold=0,e.bits=0,e.lencode=e.lendyn=new Int32Array(852),e.distcode=e.distdyn=new Int32Array(592),e.sane=1,e.back=-1,ke},He=t=>{if(Ce(t))return xe;const e=t.state;return e.wsize=0,e.whave=0,e.wnext=0,Me(t)},je=(t,e)=>{let a;if(Ce(t))return xe;const i=t.state;return e<0?(a=0,e=-e):(a=5+(e>>4),e<48&&(e&=15)),e&&(e<8||e>15)?xe:(null!==i.window&&i.wbits!==e&&(i.window=null),i.wrap=a,i.wbits=e,He(t))},Ke=(t,e)=>{if(!t)return xe;const a=new Be;t.state=a,a.strm=t,a.window=null,a.mode=Ze;const i=je(t,e);return i!==ke&&(t.state=null),i};let Pe,Ye,Ge=!0;const Xe=t=>{if(Ge){Pe=new Int32Array(512),Ye=new Int32Array(32);let e=0;for(;e<144;)t.lens[e++]=8;for(;e<256;)t.lens[e++]=9;for(;e<280;)t.lens[e++]=7;for(;e<288;)t.lens[e++]=8;for(me(1,t.lens,0,288,Pe,0,t.work,{bits:9}),e=0;e<32;)t.lens[e++]=5;me(2,t.lens,0,32,Ye,0,t.work,{bits:5}),Ge=!1}t.lencode=Pe,t.lenbits=9,t.distcode=Ye,t.distbits=5},We=(t,e,a,i)=>{let n;const s=t.state;return null===s.window&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new Uint8Array(s.wsize)),i>=s.wsize?(s.window.set(e.subarray(a-s.wsize,a),0),s.wnext=0,s.whave=s.wsize):(n=s.wsize-s.wnext,n>i&&(n=i),s.window.set(e.subarray(a-i,a-i+n),s.wnext),(i-=n)?(s.window.set(e.subarray(a-i,a),0),s.wnext=i,s.whave=s.wsize):(s.wnext+=n,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=n))),0};var qe={inflateReset:He,inflateReset2:je,inflateResetKeep:Me,inflateInit:t=>Ke(t,15),inflateInit2:Ke,inflate:(t,e)=>{let a,i,n,s,r,o,l,h,d,_,f,c,u,w,m,b,g,p,k,v,y,x,z=0;const A=new Uint8Array(4);let E,R;const Z=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);if(Ce(t)||!t.output||!t.input&&0!==t.avail_in)return xe;a=t.state,a.mode===Se&&(a.mode=De),r=t.next_out,n=t.output,l=t.avail_out,s=t.next_in,i=t.input,o=t.avail_in,h=a.hold,d=a.bits,_=o,f=l,x=ke;t:for(;;)switch(a.mode){case Ze:if(0===a.wrap){a.mode=De;break}for(;d<16;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(2&a.wrap&&35615===h){0===a.wbits&&(a.wbits=15),a.check=0,A[0]=255&h,A[1]=h>>>8&255,a.check=H(a.check,A,2,0),h=0,d=0,a.mode=16181;break}if(a.head&&(a.head.done=!1),!(1&a.wrap)||(((255&h)<<8)+(h>>8))%31){t.msg="incorrect header check",a.mode=Le;break}if((15&h)!==Re){t.msg="unknown compression method",a.mode=Le;break}if(h>>>=4,d-=4,y=8+(15&h),0===a.wbits&&(a.wbits=y),y>15||y>a.wbits){t.msg="invalid window size",a.mode=Le;break}a.dmax=1<<a.wbits,a.flags=0,t.adler=a.check=1,a.mode=512&h?16189:Se,h=0,d=0;break;case 16181:for(;d<16;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(a.flags=h,(255&a.flags)!==Re){t.msg="unknown compression method",a.mode=Le;break}if(57344&a.flags){t.msg="unknown header flags set",a.mode=Le;break}a.head&&(a.head.text=h>>8&1),512&a.flags&&4&a.wrap&&(A[0]=255&h,A[1]=h>>>8&255,a.check=H(a.check,A,2,0)),h=0,d=0,a.mode=16182;case 16182:for(;d<32;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}a.head&&(a.head.time=h),512&a.flags&&4&a.wrap&&(A[0]=255&h,A[1]=h>>>8&255,A[2]=h>>>16&255,A[3]=h>>>24&255,a.check=H(a.check,A,4,0)),h=0,d=0,a.mode=16183;case 16183:for(;d<16;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}a.head&&(a.head.xflags=255&h,a.head.os=h>>8),512&a.flags&&4&a.wrap&&(A[0]=255&h,A[1]=h>>>8&255,a.check=H(a.check,A,2,0)),h=0,d=0,a.mode=16184;case 16184:if(1024&a.flags){for(;d<16;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}a.length=h,a.head&&(a.head.extra_len=h),512&a.flags&&4&a.wrap&&(A[0]=255&h,A[1]=h>>>8&255,a.check=H(a.check,A,2,0)),h=0,d=0}else a.head&&(a.head.extra=null);a.mode=16185;case 16185:if(1024&a.flags&&(c=a.length,c>o&&(c=o),c&&(a.head&&(y=a.head.extra_len-a.length,a.head.extra||(a.head.extra=new Uint8Array(a.head.extra_len)),a.head.extra.set(i.subarray(s,s+c),y)),512&a.flags&&4&a.wrap&&(a.check=H(a.check,i,c,s)),o-=c,s+=c,a.length-=c),a.length))break t;a.length=0,a.mode=16186;case 16186:if(2048&a.flags){if(0===o)break t;c=0;do{y=i[s+c++],a.head&&y&&a.length<65536&&(a.head.name+=String.fromCharCode(y))}while(y&&c<o);if(512&a.flags&&4&a.wrap&&(a.check=H(a.check,i,c,s)),o-=c,s+=c,y)break t}else a.head&&(a.head.name=null);a.length=0,a.mode=16187;case 16187:if(4096&a.flags){if(0===o)break t;c=0;do{y=i[s+c++],a.head&&y&&a.length<65536&&(a.head.comment+=String.fromCharCode(y))}while(y&&c<o);if(512&a.flags&&4&a.wrap&&(a.check=H(a.check,i,c,s)),o-=c,s+=c,y)break t}else a.head&&(a.head.comment=null);a.mode=16188;case 16188:if(512&a.flags){for(;d<16;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(4&a.wrap&&h!==(65535&a.check)){t.msg="header crc mismatch",a.mode=Le;break}h=0,d=0}a.head&&(a.head.hcrc=a.flags>>9&1,a.head.done=!0),t.adler=a.check=0,a.mode=Se;break;case 16189:for(;d<32;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}t.adler=a.check=Ne(h),h=0,d=0,a.mode=Ue;case Ue:if(0===a.havedict)return t.next_out=r,t.avail_out=l,t.next_in=s,t.avail_in=o,a.hold=h,a.bits=d,ye;t.adler=a.check=1,a.mode=Se;case Se:if(e===ge||e===pe)break t;case De:if(a.last){h>>>=7&d,d-=7&d,a.mode=Fe;break}for(;d<3;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}switch(a.last=1&h,h>>>=1,d-=1,3&h){case 0:a.mode=16193;break;case 1:if(Xe(a),a.mode=Oe,e===pe){h>>>=2,d-=2;break t}break;case 2:a.mode=16196;break;case 3:t.msg="invalid block type",a.mode=Le}h>>>=2,d-=2;break;case 16193:for(h>>>=7&d,d-=7&d;d<32;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if((65535&h)!=(h>>>16^65535)){t.msg="invalid stored block lengths",a.mode=Le;break}if(a.length=65535&h,h=0,d=0,a.mode=Te,e===pe)break t;case Te:a.mode=16195;case 16195:if(c=a.length,c){if(c>o&&(c=o),c>l&&(c=l),0===c)break t;n.set(i.subarray(s,s+c),r),o-=c,s+=c,l-=c,r+=c,a.length-=c;break}a.mode=Se;break;case 16196:for(;d<14;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(a.nlen=257+(31&h),h>>>=5,d-=5,a.ndist=1+(31&h),h>>>=5,d-=5,a.ncode=4+(15&h),h>>>=4,d-=4,a.nlen>286||a.ndist>30){t.msg="too many length or distance symbols",a.mode=Le;break}a.have=0,a.mode=16197;case 16197:for(;a.have<a.ncode;){for(;d<3;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}a.lens[Z[a.have++]]=7&h,h>>>=3,d-=3}for(;a.have<19;)a.lens[Z[a.have++]]=0;if(a.lencode=a.lendyn,a.lenbits=7,E={bits:a.lenbits},x=me(0,a.lens,0,19,a.lencode,0,a.work,E),a.lenbits=E.bits,x){t.msg="invalid code lengths set",a.mode=Le;break}a.have=0,a.mode=16198;case 16198:for(;a.have<a.nlen+a.ndist;){for(;z=a.lencode[h&(1<<a.lenbits)-1],m=z>>>24,b=z>>>16&255,g=65535&z,!(m<=d);){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(g<16)h>>>=m,d-=m,a.lens[a.have++]=g;else{if(16===g){for(R=m+2;d<R;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(h>>>=m,d-=m,0===a.have){t.msg="invalid bit length repeat",a.mode=Le;break}y=a.lens[a.have-1],c=3+(3&h),h>>>=2,d-=2}else if(17===g){for(R=m+3;d<R;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}h>>>=m,d-=m,y=0,c=3+(7&h),h>>>=3,d-=3}else{for(R=m+7;d<R;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}h>>>=m,d-=m,y=0,c=11+(127&h),h>>>=7,d-=7}if(a.have+c>a.nlen+a.ndist){t.msg="invalid bit length repeat",a.mode=Le;break}for(;c--;)a.lens[a.have++]=y}}if(a.mode===Le)break;if(0===a.lens[256]){t.msg="invalid code -- missing end-of-block",a.mode=Le;break}if(a.lenbits=9,E={bits:a.lenbits},x=me(1,a.lens,0,a.nlen,a.lencode,0,a.work,E),a.lenbits=E.bits,x){t.msg="invalid literal/lengths set",a.mode=Le;break}if(a.distbits=6,a.distcode=a.distdyn,E={bits:a.distbits},x=me(2,a.lens,a.nlen,a.ndist,a.distcode,0,a.work,E),a.distbits=E.bits,x){t.msg="invalid distances set",a.mode=Le;break}if(a.mode=Oe,e===pe)break t;case Oe:a.mode=Ie;case Ie:if(o>=6&&l>=258){t.next_out=r,t.avail_out=l,t.next_in=s,t.avail_in=o,a.hold=h,a.bits=d,de(t,f),r=t.next_out,n=t.output,l=t.avail_out,s=t.next_in,i=t.input,o=t.avail_in,h=a.hold,d=a.bits,a.mode===Se&&(a.back=-1);break}for(a.back=0;z=a.lencode[h&(1<<a.lenbits)-1],m=z>>>24,b=z>>>16&255,g=65535&z,!(m<=d);){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(b&&0==(240&b)){for(p=m,k=b,v=g;z=a.lencode[v+((h&(1<<p+k)-1)>>p)],m=z>>>24,b=z>>>16&255,g=65535&z,!(p+m<=d);){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}h>>>=p,d-=p,a.back+=p}if(h>>>=m,d-=m,a.back+=m,a.length=g,0===b){a.mode=16205;break}if(32&b){a.back=-1,a.mode=Se;break}if(64&b){t.msg="invalid literal/length code",a.mode=Le;break}a.extra=15&b,a.mode=16201;case 16201:if(a.extra){for(R=a.extra;d<R;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}a.length+=h&(1<<a.extra)-1,h>>>=a.extra,d-=a.extra,a.back+=a.extra}a.was=a.length,a.mode=16202;case 16202:for(;z=a.distcode[h&(1<<a.distbits)-1],m=z>>>24,b=z>>>16&255,g=65535&z,!(m<=d);){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(0==(240&b)){for(p=m,k=b,v=g;z=a.distcode[v+((h&(1<<p+k)-1)>>p)],m=z>>>24,b=z>>>16&255,g=65535&z,!(p+m<=d);){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}h>>>=p,d-=p,a.back+=p}if(h>>>=m,d-=m,a.back+=m,64&b){t.msg="invalid distance code",a.mode=Le;break}a.offset=g,a.extra=15&b,a.mode=16203;case 16203:if(a.extra){for(R=a.extra;d<R;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}a.offset+=h&(1<<a.extra)-1,h>>>=a.extra,d-=a.extra,a.back+=a.extra}if(a.offset>a.dmax){t.msg="invalid distance too far back",a.mode=Le;break}a.mode=16204;case 16204:if(0===l)break t;if(c=f-l,a.offset>c){if(c=a.offset-c,c>a.whave&&a.sane){t.msg="invalid distance too far back",a.mode=Le;break}c>a.wnext?(c-=a.wnext,u=a.wsize-c):u=a.wnext-c,c>a.length&&(c=a.length),w=a.window}else w=n,u=r-a.offset,c=a.length;c>l&&(c=l),l-=c,a.length-=c;do{n[r++]=w[u++]}while(--c);0===a.length&&(a.mode=Ie);break;case 16205:if(0===l)break t;n[r++]=a.length,l--,a.mode=Ie;break;case Fe:if(a.wrap){for(;d<32;){if(0===o)break t;o--,h|=i[s++]<<d,d+=8}if(f-=l,t.total_out+=f,a.total+=f,4&a.wrap&&f&&(t.adler=a.check=a.flags?H(a.check,n,f,r-f):C(a.check,n,f,r-f)),f=l,4&a.wrap&&(a.flags?h:Ne(h))!==a.check){t.msg="incorrect data check",a.mode=Le;break}h=0,d=0}a.mode=16207;case 16207:if(a.wrap&&a.flags){for(;d<32;){if(0===o)break t;o--,h+=i[s++]<<d,d+=8}if(4&a.wrap&&h!==(4294967295&a.total)){t.msg="incorrect length check",a.mode=Le;break}h=0,d=0}a.mode=16208;case 16208:x=ve;break t;case Le:x=ze;break t;case 16210:return Ae;default:return xe}return t.next_out=r,t.avail_out=l,t.next_in=s,t.avail_in=o,a.hold=h,a.bits=d,(a.wsize||f!==t.avail_out&&a.mode<Le&&(a.mode<Fe||e!==be))&&We(t,t.output,t.next_out,f-t.avail_out),_-=t.avail_in,f-=t.avail_out,t.total_in+=_,t.total_out+=f,a.total+=f,4&a.wrap&&f&&(t.adler=a.check=a.flags?H(a.check,n,f,t.next_out-f):C(a.check,n,f,t.next_out-f)),t.data_type=a.bits+(a.last?64:0)+(a.mode===Se?128:0)+(a.mode===Oe||a.mode===Te?256:0),(0===_&&0===f||e===be)&&x===ke&&(x=Ee),x},inflateEnd:t=>{if(Ce(t))return xe;let e=t.state;return e.window&&(e.window=null),t.state=null,ke},inflateGetHeader:(t,e)=>{if(Ce(t))return xe;const a=t.state;return 0==(2&a.wrap)?xe:(a.head=e,e.done=!1,ke)},inflateSetDictionary:(t,e)=>{const a=e.length;let i,n,s;return Ce(t)?xe:(i=t.state,0!==i.wrap&&i.mode!==Ue?xe:i.mode===Ue&&(n=1,n=C(n,e,a,0),n!==i.check)?ze:(s=We(t,e,a,a),s?(i.mode=16210,Ae):(i.havedict=1,ke)))},inflateInfo:"pako inflate (from Nodeca project)"};var Je=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1};const Qe=Object.prototype.toString,{Z_NO_FLUSH:Ve,Z_FINISH:$e,Z_OK:ta,Z_STREAM_END:ea,Z_NEED_DICT:aa,Z_STREAM_ERROR:ia,Z_DATA_ERROR:na,Z_MEM_ERROR:sa}=K;function ra(t){this.options=jt({chunkSize:65536,windowBits:15,to:""},t||{});const e=this.options;e.raw&&e.windowBits>=0&&e.windowBits<16&&(e.windowBits=-e.windowBits,0===e.windowBits&&(e.windowBits=-15)),!(e.windowBits>=0&&e.windowBits<16)||t&&t.windowBits||(e.windowBits+=32),e.windowBits>15&&e.windowBits<48&&0==(15&e.windowBits)&&(e.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new qt,this.strm.avail_out=0;let a=qe.inflateInit2(this.strm,e.windowBits);if(a!==ta)throw new Error(j[a]);if(this.header=new Je,qe.inflateGetHeader(this.strm,this.header),e.dictionary&&("string"==typeof e.dictionary?e.dictionary=Gt(e.dictionary):"[object ArrayBuffer]"===Qe.call(e.dictionary)&&(e.dictionary=new Uint8Array(e.dictionary)),e.raw&&(a=qe.inflateSetDictionary(this.strm,e.dictionary),a!==ta)))throw new Error(j[a])}function oa(t,e){const a=new ra(e);if(a.push(t),a.err)throw a.msg||j[a.err];return a.result}ra.prototype.push=function(t,e){const a=this.strm,i=this.options.chunkSize,n=this.options.dictionary;let s,r,o;if(this.ended)return!1;for(r=e===~~e?e:!0===e?$e:Ve,"[object ArrayBuffer]"===Qe.call(t)?a.input=new Uint8Array(t):a.input=t,a.next_in=0,a.avail_in=a.input.length;;){for(0===a.avail_out&&(a.output=new Uint8Array(i),a.next_out=0,a.avail_out=i),s=qe.inflate(a,r),s===aa&&n&&(s=qe.inflateSetDictionary(a,n),s===ta?s=qe.inflate(a,r):s===na&&(s=aa));a.avail_in>0&&s===ea&&a.state.wrap>0&&0!==t[a.next_in];)qe.inflateReset(a),s=qe.inflate(a,r);switch(s){case ia:case na:case aa:case sa:return this.onEnd(s),this.ended=!0,!1}if(o=a.avail_out,a.next_out&&(0===a.avail_out||s===ea))if("string"===this.options.to){let t=Wt(a.output,a.next_out),e=a.next_out-t,n=Xt(a.output,t);a.next_out=e,a.avail_out=i-e,e&&a.output.set(a.output.subarray(t,t+e),0),this.onData(n)}else this.onData(a.output.length===a.next_out?a.output:a.output.subarray(0,a.next_out));if(s!==ta||0!==o){if(s===ea)return s=qe.inflateEnd(this.strm),this.onEnd(s),this.ended=!0,!0;if(0===a.avail_in)break}}return!0},ra.prototype.onData=function(t){this.chunks.push(t)},ra.prototype.onEnd=function(t){t===ta&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=Kt(this.chunks)),this.chunks=[],this.err=t,this.msg=this.strm.msg};var la={Inflate:ra,inflate:oa,inflateRaw:function(t,e){return(e=e||{}).raw=!0,oa(t,e)},ungzip:oa,constants:K};const{Deflate:ha,deflate:da,deflateRaw:_a,gzip:fa}=le,{Inflate:ca,inflate:ua,inflateRaw:wa,ungzip:ma}=la;var ba=ha,ga=da,pa=_a,ka=fa,va=ca,ya=ua,xa=wa,za=ma,Aa=K,Ea={Deflate:ba,deflate:ga,deflateRaw:pa,gzip:ka,Inflate:va,inflate:ya,inflateRaw:xa,ungzip:za,constants:Aa};t.Deflate=ba,t.Inflate=va,t.constants=Aa,t.default=Ea,t.deflate=ga,t.deflateRaw=pa,t.gzip=ka,t.inflate=ya,t.inflateRaw=xa,t.ungzip=za,Object.defineProperty(t,"__esModule",{value:!0})}));

/**
 * Tap buffer reader. Simplifies the read of the tap files.
 */
class TapBufferReader {
    dataView;
    offset;
    textDecoder;
    constructor() {
    }

    getClass() {
        return "TapBufferReader";
    }

    guardInvariants() {
    }

    readInt() {
        const res = this.dataView.getInt32(this.offset, false);
        this.offset += 4;
        return res;
    }

    readFloat() {
        const res = this.dataView.getFloat32(this.offset, false);
        this.offset += 4;
        return res;
    }

    readString() {
        const length = this.dataView.getInt32(this.offset, false);
        this.offset += 4;
        const strBytes = new Uint8Array(this.dataView.buffer, this.offset, length);
        const res = this.textDecoder.decode(strBytes);
        this.offset += length;
        return res;
    }

    close() {
        // nothing to do here
    }

    /**
     * Creates new instance
     * @param {TapEntry} entry tap entry
     * @returns {TapBufferReader} creates instance
     */
    static create(entry) {
        let res = new TapBufferReader();
        res.dataView = new DataView(entry.data);
        res.offset = 0;
        res.textDecoder = new TextDecoder('utf-8');
        res.guardInvariants();
        return res;
    }

}
/**
 * Utility class to work with tyracorn asset packages.
 */
class Taps {

    /**
     * Decodes TAP from bytes.
     *
     * @param {ArrayBuffer} buffer byte buffer with data
     * @return {Tap} decoded package
     */
    static fromBytes(buffer) {
        const view = new DataView(buffer);
        // read header
        let offset = 0;
        const textDecoder = new TextDecoder('utf-8');

        const headerLength = view.getInt32(offset, false);
        offset += 4;
        const headerBytes = new Uint8Array(view.buffer, offset, headerLength);
        const magic = textDecoder.decode(headerBytes);
        offset += headerLength;
        const version = view.getInt32(offset, false);
        offset += 4;

        if (magic !== "Tyracorn Asset Package!") {
            throw new Error("Magic string not found, invalid file format.");
        }
        if (version === 2) {
            const cbuflen = view.getInt32(offset, false);
            offset += 4;

            const entriesBytes = Taps.decompressBytes(buffer, offset, cbuflen);
            const entriesView = new DataView(entriesBytes);
            let entriesOffset = 0;
            const numEntries = entriesView.getInt32(entriesOffset);
            entriesOffset += 4;
            let res = Tap.empty();
            for (let i = 0; i < numEntries; ++i) {
                // entry type
                const entryTypeLength = entriesView.getInt32(entriesOffset, false);
                entriesOffset += 4;
                const entryTypeBytes = new Uint8Array(entriesView.buffer, entriesOffset, entryTypeLength);
                const entryType = textDecoder.decode(entryTypeBytes);
                entriesOffset += entryTypeLength;
                // entry id
                const entryIdLength = entriesView.getInt32(entriesOffset, false);
                entriesOffset += 4;
                const entryIdBytes = new Uint8Array(entriesView.buffer, entriesOffset, entryIdLength);
                const entryId = textDecoder.decode(entryIdBytes);
                entriesOffset += entryIdLength;
                // entry version
                const entryVersion = entriesView.getInt32(entriesOffset, false);
                entriesOffset += 4;
                // entry byte length
                const entryNumBytes = entriesView.getInt32(entriesOffset, false);
                entriesOffset += 4;
                const entryDataBuffer = entriesBytes.slice(entriesOffset, entriesOffset + entryNumBytes)
                entriesOffset += entryNumBytes;
                // add entry to result
                const etype = TapEntryType.valueOf(entryType);
                res = res.addEntry(TapEntry.create(etype, entryId, entryVersion, entryDataBuffer));
            }
            return res;
        } else {
            throw new Error("unsupported version " + version + ", implement me");
        }
    }

    /**
     * Converts TAP to the asset group.
     *
     * @param {Tap} tap input tap
     * @return {AssetGroup} asset group
     */
    static toAssetGroup(tap) {
        let res = AssetGroup.empty();
        for (let entry of tap.getEntries()) {
            if (entry.getType().equals(TapEntryType.TEXTURE)) {
                const ag = TapTextures.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.FONT)) {
                const ag = TapFonts.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else {
                throw new Error("unsupported entry type: " + entry.getType().toString());
            }
            /*
             if (entry.getType().equals(TapEntryType.MESH)) {
             AssetGroup ag = TapMeshes.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else if (entry.getType().equals(TapEntryType.MATERIAL)) {
             AssetGroup ag = TapMaterials.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else if (entry.getType().equals(TapEntryType.PHYSICAL_MATERIAL)) {
             AssetGroup ag = TapPhysicalMaterials.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else if (entry.getType().equals(TapEntryType.MODEL)) {
             AssetGroup ag = TapModels.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else if (entry.getType().equals(TapEntryType.CLIP_ANIMATION_COLLECTION)) {
             AssetGroup ag = TapClipAnimationCollections.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else if (entry.getType().equals(TapEntryType.SPRITE)) {
             AssetGroup ag = TapSprites.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else if (entry.getType().equals(TapEntryType.SOUND)) {
             AssetGroup ag = TapSounds.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else if (entry.getType().equals(TapEntryType.PREFAB)) {
             AssetGroup ag = TapPrefabs.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else if (entry.getType().equals(TapEntryType.SCENE)) {
             AssetGroup ag = TapScenes.toAssetGroup(entry);
             res = res.mergeStrict(ag);
             }
             else {
             throw new RuntimeException("unsupported entry type: " + entry.getType());
             }
             */
        }
        return res;
    }

    /**
     * Decompresses bytes.
     * 
     * @param {ArrayBuffer} buffer data to decompress
     * @param {Number} offset offset to start reading from
     * @param {Number} numBytes number of bytes to read
     * @returns {ArrayBuffer} decompressed data
     */
    static decompressBytes(buffer, offset, numBytes) {
        try {
            const uint8Array = new Uint8Array(buffer, offset, numBytes);
            const decompressed = pako.inflate(uint8Array);
            return decompressed.buffer;
        } catch (error) {
            throw new Error(`Decompression failed: ${error}`);
        }
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
     * Returns the list of files within the specified directory.
     * Returned files are guaranteed to be files which existed at the time of making the request.
     * 
     * @param {Path|String} path path that goes to the directory
     * @param {boolean} recursive whether list recursive
     * @returns {List of Path} listed files
     */
    async listFiles(path, recursive) {
        // resolve the url
        const pathStr = path instanceof Path ? path.path : path;
        const url = (path.startsWith("asset:") ? baseUrl + "/assets/" + pathStr.substring(6) : pathStr) + "/content.json";
        let files = [];
        const promise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'text';

            // Set up event handlers
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        try {
                            const jsonData = JSON.parse(xhr.responseText);
                            // Ensure the result is an array
                            if (Array.isArray(jsonData)) {
                                resolve(jsonData);
                            } else {
                                reject(new Error("Invalid  data"));
                            }
                        } catch (parseError) {
                            reject(new Error("Failed to parse JSON: ${parseError.message}"));
                        }
                    } else {
                        reject(new Error(`HTTP Error: ${xhr.status} - ${xhr.statusText}`));
                    }
                }
            };
            xhr.onerror = function () {
                reject(new Error("Network error occurred during the request"));
            };
            xhr.ontimeout = function () {
                reject(new Error("Request timed out"));
            };
            xhr.timeout = 10000;
            xhr.send();
        }).then(result => {
            files = result;
        }, error => {
            console.log(error);
            files = null;
        });
        await promise;
        if (files === null) {
            throw new Error("Unable to list directory: " + pathStr);
        }
        const res = new ArrayList();
        for (const fl of files) {
            if (fl.contains(".")) {
                // it's a file
                res.add(path.getChild(fl));
            } else if (recursive) {
                // it's a directory
                const sub = path.getChild(fl);
                let subfiles = null;
                const subPromise = this.listFiles(sub, recursive)
                        .then(result => {
                            subfiles = result;
                        });
                await subPromise;
                if (files === null) {
                    throw new Error("Unable to list directory: " + sub.path);
                }
                res.addAll(subfiles);
            }
        }
        return res;
    }

    /**
     * Loads file.
     * 
     * @param {Path|String} path path to the file
     * @returns {ArrayBuffer} loaded file data
     */
    async loadFile(path) {
        if (path instanceof Path) {
            path = path.path;
        }
        let url = path;
        if (path.startsWith("asset:")) {
            url = baseUrl + "/assets/" + path.substring(6);
        }
        // load url
        const data = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';

            // Set up event handlers
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`HTTP Error: ${xhr.status}`));
                    }
                }
            };
            xhr.onerror = function () {
                reject(new Error("Network error occurred during the request"));
            };
            xhr.ontimeout = function () {
                reject(new Error("Request timed out"));
            };
            xhr.timeout = 10000;
            xhr.send();
        });
        
        return data;
    }

    /**
     * Loads texture.
     * 
     * @param {Path|String} path path to the texture
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
            let files = await this.loader.listFiles(path, true);
            for (let file of files) {
                const subres = await this.resolve(file, transformFncs);
                res.addAll(subres);
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
        if (path.getExtension().equals("tap")) {
            let buf = await this.loader.loadFile(path);
            let tap = Taps.fromBytes(buf);
            ag = Taps.toAssetGroup(tap);
        }
        else if (path.getExtension().equals("png")) {
            let tid = TextureId.of(path.getPlainName());
            let texture = await this.loader.loadTexture(path);
            ag = ag.put(tid, texture);
        }
        else {
            throw "unsupported type to load, implement me: " + path.path;
        }
        
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
    setUniformVec3(name, vec) {
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
    setUniformMat44(name, mat) {
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
    setUniformMat44Components(name, m00, m01, m02, m03, m10, m11, m12, m13,
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
            this.shader.setUniformMat44("modelMat", mat);
            this.shader.setUniformMat44("viewMat", this.camera.getView());
            this.shader.setUniformMat44("projMat", this.camera.getProj());

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
            this.shader.setUniformMat44("modelMat", mat);
            this.shader.setUniformMat44("viewMat", this.camera.getView());
            this.shader.setUniformMat44("projMat", this.camera.getProj());

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
        this.shader.setUniformMat44("viewMat", environment.getCamera().getView());
        this.shader.setUniformMat44("projMat", environment.getCamera().getProj());
        this.shader.setUniformVec3("viewPos", environment.getCamera().getPos());
        this.shader.setUniformFloat("gamma", environment.getGamma());

        // lightning
        let numDirLights = 0;
        let numPointLights = 0;
        let numSpotLights = 0;
        let numShadowMaps = 0;
        for (const light of environment.getLights()) {
            if (light.isDirectionalShadowless()) {
                const pref = "dirLights[" + numDirLights + "].";
                this.shader.setUniformVec3(pref + "dir", light.getDir());
                this.shader.setUniformRgb(pref + "ambient", light.getAmbient());
                this.shader.setUniformRgb(pref + "diffuse", light.getDiffuse());
                this.shader.setUniformRgb(pref + "specular", light.getSpecular());
                this.shader.setUniformInt(pref + "shadowMapIdx", -1);
                ++numDirLights;
            } else if (light.isPointShadowless()) {
                const pref = "pointLights[" + numPointLights + "].";
                this.shader.setUniformVec3(pref + "pos", light.getPos());
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
                this.shader.setUniformVec3(pref + "pos", light.getPos());
                this.shader.setUniformVec3(pref + "dir", light.getDir());
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
                this.shader.setUniformVec3(pref + "pos", light.getPos());
                this.shader.setUniformVec3(pref + "dir", light.getDir());
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
                this.shader.setUniformMat44(smpref + "lightMat", light.getShadowMap().getLightMat());
                this.shader.setUniformInt(smpref + "pcfType", this.pcfTypeToInternal(light.getShadowMap().getPcfType()));
                const tid = this.refProvider.getShadowBufferRef(light.getShadowMap().getShadowBuffer()).getTextureId();
                gl.activeTexture(gl.TEXTURE0 + WebglSceneRenderer.SHADOW_MAP_OFFSET + numShadowMaps);
                gl.bindTexture(gl.TEXTURE_2D, tid);
                ++numSpotLights;
                ++numShadowMaps;
            } else if (light.isDirectionalShadowMap()) {
                const pref = "dirLights[" + numDirLights + "].";
                this.shader.setUniformVec3(pref + "dir", light.getDir());
                this.shader.setUniformRgb(pref + "ambient", light.getAmbient());
                this.shader.setUniformRgb(pref + "diffuse", light.getDiffuse());
                this.shader.setUniformRgb(pref + "specular", light.getSpecular());
                this.shader.setUniformInt(pref + "shadowMapIdx", numShadowMaps);

                const smpref = "shadowMaps[" + numShadowMaps + "].";
                this.shader.setUniformMat44(smpref + "lightMat", light.getShadowMap().getLightMat());
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

        this.shader.setUniformMat44("modelMat", mat);
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
                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
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
            this.shader.setUniformMat44("lightMat", light.getShadowMap().getLightMat());
        } else if (light.isDirectionalShadowMap()) {
            const sbuf = this.refProvider.getShadowBufferRef(light.getShadowMap().getShadowBuffer());
            gl.viewport(0, 0, sbuf.getWidth(), sbuf.getHeight());

            gl.bindFramebuffer(gl.FRAMEBUFFER, sbuf.getFbo());
            gl.clear(gl.DEPTH_BUFFER_BIT);
            this.shader.use();
            this.shader.setUniformMat44("lightMat", light.getShadowMap().getLightMat());
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
        this.shader.setUniformMat44("modelMat", mat);

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
 * WebGL Ui Painter - JavaScript version of JoglUiPainter.
 * Assumes WebGL context 'gl' is available globally.
 */

class WebglUiPainter {
    /**
     * Asset bank.
     */
    assetBank;

    /**
     * Reference provider.
     */
    refProvider;

    /**
     * Sprite mesh reference.
     */
    spriteMesh;

    /**
     * Shader program for sprites.
     */
    spriteShader;

    /**
     * Primitive mesh reference.
     */
    primitiveMesh;

    /**
     * Shader program for primitives.
     */
    primitiveShader;

    /**
     * Buffer for RGBA values.
     */
    rgbaBuf = [];

    /**
     * Vertex buffer for data exchange.
     */
    vertBuf = []

    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        Guard.notNull(this.assetBank, "assetBank cannot be null");
        Guard.notNull(this.refProvider, "refProvider cannot be null");
        Guard.notNull(this.spriteMesh, "spriteMesh cannot be null");
        Guard.notNull(this.spriteShader, "spriteShader cannot be null");
        Guard.notNull(this.primitiveMesh, "primitiveMesh cannot be null");
        Guard.notNull(this.primitiveShader, "primitiveShader cannot be null");
    }

    /**
     * Draws the image. Arguments determines how the object is rendered.
     */
    drawImage() {
        if (arguments.length === 6 && arguments[0] instanceof TextureId &&
                typeof arguments[1] === "number" && typeof arguments[2] === "number" &&
                typeof arguments[3] === "number" && typeof arguments[4] === "number" &&
                arguments[5] instanceof TextureStyle) {
            this.drawImageInternal(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
        } else {
            throw "unsupported arguments, implement me";
        }
    }

    /**
     * Draws the image image.
     *
     * @param {TextureId} img image
     * @param {Number} x x
     * @param {Number} y y
     * @param {Number} width width
     * @param {Number} height height
     * @param {TextureStyle} style style used for texture
     */
    drawImageInternal(img, x, y, width, height, style) {
        const tref = this.refProvider.getTextureRef(img).getTextureId();
        gl.disable(gl.BLEND);
        const cx = x + width / 2;
        const cy = y + height / 2;

        this.spriteShader.use();
        this.spriteShader.setUniformMat44Components("modelMat",
                2 * width, 0, 0, 2 * cx - 1,
                0, 2 * height, 0, 1 - 2 * cy,
                0, 0, 1, 0,
                0, 0, 0, 1);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tref);
        switch (style.getHorizWrapType()) {
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
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_BORDER);
                //gl.glTexParameterfv(gl.TEXTURE_2D, gl.TEXTURE_BORDER_COLOR, style.getBorderColor().toBuf(rgbaBuf), 0);
                break;
            default:
                throw "unsupported horizontal wrap type: " + style.getHorizWrapType();
        }
        switch (style.getVertWrapType()) {
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
                //gl.glTexParameterfv(gl.TEXTURE_2D, gl.TEXTURE_BORDER_COLOR, style.getBorderColor().toBuf(rgbaBuf), 0);
                break;
            default:
                throw "unsupported vertical wrap type: " + style.getVertWrapType();
        }
        switch (style.getMinFilterType()) {
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
        switch (style.getMagFilterType()) {
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

        gl.bindVertexArray(this.spriteMesh.getVao());
        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteMesh.getVbo());
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * 4, 0);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
        gl.enableVertexAttribArray(1);
        gl.drawElements(gl.TRIANGLES, this.spriteMesh.getNumIndices(), gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Returns font.
     *
     * @param {FontId} id font identifier
     * @return {Font} font
     */
    getFont(id) {
        return this.assetBank.get("Font", id);
    }

    /**
     * Creates new instance.
     *
     * @param {AssetBank} assetBank asset bank
     * @param {WebglRefProvider} refProvider reference provider
     * @param {WebglMeshRef} spriteMesh sprite mesh
     * @param {WebglShader} spriteShader sprite shader
     * @param {WebglMeshRef} primitiveMesh primitive mesh
     * @param {WebglShader} primitiveShader primitive shader
     * @return {WebglUiPainter} created instance
     */
    static create(assetBank, refProvider, spriteMesh, spriteShader, primitiveMesh, primitiveShader) {
        const res = new WebglUiPainter();
        res.assetBank = assetBank;
        res.refProvider = refProvider;
        res.spriteMesh = spriteMesh;
        res.spriteShader = spriteShader;
        res.primitiveMesh = primitiveMesh;
        res.primitiveShader = primitiveShader;
        res.guardInvariants();
        return res;
    }

}
/**
 * WebGL Ui Renderer - JavaScript version of JoglUiRenderer.
 * Assumes WebGL context 'gl' is available globally.
 */
class WebglUiRenderer {
    /**
     * Asset bank.
     */
    assetBank;

    /**
     * Reference provider.
     */
    refProvider;

    /**
     * Sprite mesh reference.
     */
    spriteMesh;

    /**
     * Shader program for sprites.
     */
    spriteShader;

    /**
     * Primitive mesh reference.
     */
    primitiveMesh;

    /**
     * Shader program for primitives.
     */
    primitiveShader;

    /**
     * Painter.
     */
    painter;

    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        Guard.notNull(this.assetBank, "assetBank cannot be null");
        Guard.notNull(this.refProvider, "refProvider cannot be null");
        Guard.notNull(this.spriteMesh, "spriteMesh cannot be null");
        Guard.notNull(this.spriteShader, "spriteShader cannot be null");
        Guard.notNull(this.primitiveMesh, "primitiveMesh cannot be null");
        Guard.notNull(this.primitiveShader, "primitiveShader cannot be null");
        Guard.notNull(this.painter, "painter cannot be null");
    }

    /**
     * Starts the renderer.
     * 
     * @param {Environmenty} environment environment
     */
    start(environment) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);
        const vp = this.refProvider.getScreenViewport();
        gl.viewport(vp.x, vp.y, vp.width, vp.height);

        this.spriteShader.use();
        this.spriteShader.setUniformMat44("viewMat", Mat44.IDENTITY);
        this.spriteShader.setUniformMat44("projMat", Mat44.IDENTITY);
        this.spriteShader.setUniformFloat("gamma", environment.getGamma());

        this.primitiveShader.use();
        this.primitiveShader.setUniformMat44("viewMat", Mat44.IDENTITY);
        this.primitiveShader.setUniformMat44("projMat", Mat44.IDENTITY);
    }

    /**
     * Renders the ui.
     * 
     * param {Ui} ui ui to render
     */
    render(ui) {
        ui.draw(this.painter);
    }

    /**
     * Ends the renderer.
     */
    end() {
        gl.disable(gl.SCISSOR_TEST);
    }

    /**
     * Creates new instance.
     *
     * @param {AssetBank} assetBank asset bank
     * @param {WebglRefProvider} refProvider reference provider
     * @param {WebglMeshRef} spriteMesh sprite mesh
     * @param {WebglShader} spriteShader sprite shader
     * @param {WebglMeshRef} primitiveMesh primitive mesh
     * @param {WebglShader} primitiveShader primitive shader
     * @return {WebglUiRenderer} created instance
     */
    static create(assetBank, refProvider, spriteMesh, spriteShader, primitiveMesh, primitiveShader) {
        const res = new WebglUiRenderer();
        res.assetBank = assetBank;
        res.refProvider = refProvider;
        res.spriteMesh = spriteMesh;
        res.spriteShader = spriteShader;
        res.primitiveMesh = primitiveMesh;
        res.primitiveShader = primitiveShader;
        res.painter = WebglUiPainter.create(assetBank, refProvider, spriteMesh, spriteShader, primitiveMesh, primitiveShader);
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

        const spriteShaderVertexSource = `#version 300 es

            precision mediump float;

            layout (location=0) in vec3 position;
            layout (location=1) in vec2 texCoord;

            out vec2 varTexCoord;

            uniform mat4 modelMat;
            uniform mat4 viewMat;
            uniform mat4 projMat;
            uniform sampler2D sampler;

            void main(void) {
                gl_Position = projMat * viewMat * modelMat * vec4(position, 1.0);
                varTexCoord = texCoord;
            }
        `;
        const spriteShaderFragmentSource = `#version 300 es

            precision mediump float;

            in vec2 varTexCoord;

            out vec4 fragColor;

            uniform mat4 modelMat;
            uniform mat4 viewMat;
            uniform mat4 projMat;
            uniform float gamma;
            uniform sampler2D sampler;

            void main(void) {
                vec4 fc = texture(sampler, varTexCoord);
                if (fc.a < 0.01) {
                    discard;
                }
                fragColor = vec4(pow(fc.rgb, vec3(1.0/gamma)), 1.0);
            }
        `;
        const spriteShaderProgram = WebglUtils.loadShaderProgram(spriteShaderVertexSource, spriteShaderFragmentSource);
        const spriteShader = WebglShader.create(spriteShaderProgram);

        // Register renderers and shaders
        this.shaders.push(colorShader, sceneShader, shadowMapShader, spriteShader);
        this.renderers.put("ColorRenderer", WebglColorRenderer.create(this, colorShader));
        this.renderers.put("SceneRenderer", WebglSceneRenderer.create(this.assetBank, this, sceneShader, this.defaultTexture));
        this.renderers.put("ShadowMapRenderer", WebglShadowMapRenderer.create(this, shadowMapShader));
        this.renderers.put("UiRenderer", WebglUiRenderer.create(this.assetBank, this, this.spriteRectMesh, spriteShader, this.primitivesMesh, colorShader));
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
/**
 * Touch driver implemented for AWT events.
 *
 * @author radek.hecl
 */
class WebTouchDriver {

    /**
     * Touch region size.
     */
    size;
    /**
     * Hash set with listeners.
     */
    listeners;
    /**
     * Creates new instance.
     */
    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        Guard.notNull(this.size, "size cannot be null");
        Guard.notNullCollection(this.listeners, "listeners cannot have null element");
    }

    /**
     * Adds touch listener.
     * 
     * @param {TouchListener} listener
     */
    addTouchListener(listener) {
        Guard.notNull(listener, "listener cannot be null");
        this.listeners.add(listener);
    }

    /**
     * Removes touch listener.
     * 
     * @param {TouchListener} listener
     */
    removeTouchListener(listener) {
        this.listeners.remove(listener);
    }

    onMouseDown(x, y) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchStart(999, pos, this.size);
        }
    }

    onMouseUp(x, y, cancel) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchEnd(999, pos, this.size, cancel);
        }
    }

    onMouseDragged(x, y) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchMove(999, pos, this.size);
        }
    }

    /**
     * Called when area size changes.
     *
     * @param {Size2} size new size are
     */
    onAreaSizeChange(size) {
        this.size = size;
    }

    /**
     * Creates new instance.
     *
     * @return {WebTouchDriver} created instance
     */
    static create() {
        const res = new WebTouchDriver();
        res.size = Size2.create(1, 1);
        res.listeners = new HashSet();
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
    displayDriver = ProxyDisplayDriver.create();
    graphicsDriver = WebglGraphicsDriver.create(this.assetManager);
    audioDriver = WebAudioDriver.create();
    touchDriver = WebTouchDriver.create();

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
        } else if (driver === "DisplayDriver") {
            return true;
        } else if (driver === "AudioDriver") {
            return true;
        } else if (driver === "TouchDriver") {
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
        } else if (driver === "DisplayDriver") {
            return this.displayDriver;
        } else if (driver === "AudioDriver") {
            return this.audioDriver;
        } else if (driver === "TouchDriver") {
            return this.touchDriver;
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

class Vec2 {
  static ZERO = Vec2.create(0, 0);
  mX;
  mY;
  constructor() {
  }

  getClass() {
    return "Vec2";
  }

  x() {
    return this.mX;
  }

  y() {
    return this.mY;
  }

  mag() {
    return FMath.sqrt(this.mX*this.mX+this.mY*this.mY);
  }

  normalize() {
    let m = this.mag();
    return Vec2.create(this.mX/m, this.mY/m);
  }

  scale(s) {
    return Vec2.create(this.mX*s, this.mY*s);
  }

  add() {
    if (arguments.length===1&&arguments[0] instanceof Vec2) {
      return this.add_1_Vec2(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return this.add_2_number_number(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  add_1_Vec2(vec) {
    return Vec2.create(this.mX+vec.mX, this.mY+vec.mY);
  }

  add_2_number_number(dx, dy) {
    return Vec2.create(this.mX+dx, this.mY+dy);
  }

  sub(vec) {
    return Vec2.create(this.mX-vec.mX, this.mY-vec.mY);
  }

  dot(vec) {
    return this.mX*vec.mX+this.mY*vec.mY;
  }

  dist(vec) {
    let dx = this.mX-vec.mX;
    let dy = this.mY-vec.mY;
    return FMath.sqrt(dx*dx+dy*dy);
  }

  homogenize() {
    return Vec3.create(this.mX, this.mY, 1);
  }

  hashCode() {
    return this.mX+13*this.mY;
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Vec2)) {
      return false;
    }
    let ob = obj;
    return ob.mX==this.mX&&ob.mY==this.mY;
  }

  toString() {
  }

  static create(x, y) {
    let res = new Vec2();
    res.mX = x;
    res.mY = y;
    return res;
  }

  static avg(vecs) {
    let x = 0;
    let y = 0;
    for (let vec of vecs) {
      x = x+vec.mX;
      y = y+vec.mY;
    }
    let res = new Vec2();
    res.mX = x/vecs.size();
    res.mY = y/vecs.size();
    return res;
  }

}
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
class Pos2 {
  static ZERO = Pos2.create(0, 0);
  mX;
  mY;
  constructor() {
  }

  getClass() {
    return "Pos2";
  }

  guardInvariants() {
  }

  x() {
    return this.mX;
  }

  y() {
    return this.mY;
  }

  move() {
    if (arguments.length===1&&arguments[0] instanceof Vec2) {
      return this.move_1_Vec2(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return this.move_2_number_number(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  move_1_Vec2(d) {
    let res = new Pos2();
    res.mX = this.mX+d.x();
    res.mY = this.mY+d.y();
    return res;
  }

  move_2_number_number(dx, dy) {
    let res = new Pos2();
    res.mX = this.mX+dx;
    res.mY = this.mY+dy;
    return res;
  }

  moveX(dx) {
    let res = new Pos2();
    res.mX = this.mX+dx;
    res.mY = this.mY;
    return res;
  }

  moveY(dy) {
    let res = new Pos2();
    res.mX = this.mX;
    res.mY = this.mY+dy;
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

  static create(x, y) {
    let res = new Pos2();
    res.mX = x;
    res.mY = y;
    res.guardInvariants();
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
  ALPHA: createTextureChannel("ALPHA"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
  SPECULAR: createTextureType("SPECULAR"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
  RGBA: createVertexAttrType("RGBA"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
  POINT: createLightType("POINT"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
  GAUSS_55: createShadowMapPcfType("GAUSS_55"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
class ProxyDisplayDriver {
  size = Size2.create(1, 1);
  listeners = new HashSet();
  lock = new Object();
  constructor() {
  }

  getClass() {
    return "ProxyDisplayDriver";
  }

  guardInvariants() {
  }

  addDisplayistener(listener) {
    Guard.notNull(listener, "listener cannot be null");
    this.listeners.add(listener);
    listener.onDisplayResize(this.size);
  }

  removeDisplayListener(listener) {
    this.listeners.remove(listener);
  }

  onDisplayResize(size) {
    this.size = size;
    for (let listener of this.listeners) {
      listener.onDisplayResize(size);
    }
  }

  toString() {
  }

  static create() {
    let res = new ProxyDisplayDriver();
    res.guardInvariants();
    return res;
  }

}
class UiPosFncs {
  constructor() {
  }

  getClass() {
    return "UiPosFncs";
  }

  static center() {
    if (arguments.length===0) {
      return UiPosFncs.center_0();
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return UiPosFncs.center_2_number_number(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  static center_0() {
    return (size) => {
      return Pos2.create(size.width()/2, size.height()/2);
    };
  }

  static center_2_number_number(x, y) {
    return (size) => {
      return Pos2.create(size.width()/2+x, size.height()/2+y);
    };
  }

  static leftTop(x, y) {
    return (size) => {
      return Pos2.create(x, y);
    };
  }

  static centerTop(y) {
    return (size) => {
      return Pos2.create(size.width()/2, y);
    };
  }

  static leftCenter() {
    if (arguments.length===1&& typeof arguments[0]==="number") {
      return UiPosFncs.leftCenter_1_number(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return UiPosFncs.leftCenter_2_number_number(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  static leftCenter_1_number(x) {
    return (size) => {
      return Pos2.create(x, size.height()/2);
    };
  }

  static leftCenter_2_number_number(x, y) {
    return (size) => {
      return Pos2.create(x, size.height()/2+y);
    };
  }

}
class UiSizeFncs {
  constructor() {
  }

  getClass() {
    return "UiSizeFncs";
  }

  static identity() {
    return (size) => {
      return size;
    };
  }

  static scale(s) {
    return (size) => {
      return size.scale(s);
    };
  }

  static constant(width, height) {
    return (size) => {
      return Size2.create(width, height);
    };
  }

  static constantWidth(width) {
    return (size) => {
      let aspect = size.height()/size.width();
      return Size2.create(width, width*aspect);
    };
  }

  static constantHeight(height) {
    return (size) => {
      let aspect = size.width()/size.height();
      return Size2.create(height*aspect, height);
    };
  }

  static landscapePortrait(landscape, portrait) {
    return (size) => {
      if (size.width()>=size.height()) {
        return landscape(size);
      }
      else {
        return portrait(size);
      }
    };
  }

}
class UiRegionFncs {
  constructor() {
  }

  getClass() {
    return "UiRegionFncs";
  }

  static full() {
    return (size) => {
      return Rect2.create(0, 0, size.width(), size.height());
    };
  }

  static center() {
    if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return UiRegionFncs.center_2_number_number(arguments[0], arguments[1]);
    }
    else if (arguments.length===4&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number"&& typeof arguments[3]==="number") {
      return UiRegionFncs.center_4_number_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else {
      throw "error";
    }
  }

  static center_2_number_number(width, height) {
    return (size) => {
      return Rect2.create(size.width()/2-width/2, size.height()/2-height/2, width, height);
    };
  }

  static center_4_number_number_number_number(x, y, width, height) {
    return (size) => {
      return Rect2.create(size.width()/2+x, size.height()/2+y, width, height);
    };
  }

  static centerTop(y, width, height) {
    return (size) => {
      return Rect2.create(size.width()/2-width/2, y, width, height);
    };
  }

  static leftTop(x, y, width, height) {
    return (size) => {
      return Rect2.create(x, y, width, height);
    };
  }

  static rightTop(x, y, width, height) {
    return (size) => {
      return Rect2.create(size.width()-x, y, width, height);
    };
  }

  static leftCenter(x, width, height) {
    return (size) => {
      return Rect2.create(x, size.height()/2-height/2, width, height);
    };
  }

  static rightCenter(x, width, height) {
    return (size) => {
      return Rect2.create(size.width()-x, size.height()/2-height/2, width, height);
    };
  }

  static centerBottom(y, width, height) {
    return (size) => {
      return Rect2.create(size.width()/2-width/2, size.height()-y, width, height);
    };
  }

  static fullBottom() {
    if (arguments.length===1&& typeof arguments[0]==="number") {
      return UiRegionFncs.fullBottom_1_number(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return UiRegionFncs.fullBottom_2_number_number(arguments[0], arguments[1]);
    }
    else {
      throw "error";
    }
  }

  static fullBottom_1_number(height) {
    return (size) => {
      return Rect2.create(0, size.height()-height, size.width(), height);
    };
  }

  static fullBottom_2_number_number(y, height) {
    return (size) => {
      return Rect2.create(0, size.height()-y, size.width(), height);
    };
  }

  static leftBottom(x, y, width, height) {
    return (size) => {
      return Rect2.create(x, size.height()-y, width, height);
    };
  }

  static rightBottom(x, y, width, height) {
    return (size) => {
      return Rect2.create(size.width()-x, size.height()-y, width, height);
    };
  }

  static constant(x, y, width, height) {
    return (size) => {
      return Rect2.create(x, y, width, height);
    };
  }

  static centerHeightSafe(height, aspect, maxWidthRatio) {
    return (size) => {
      let maxW = size.width()*maxWidthRatio;
      let h = height;
      let w = h*aspect;
      if (w>maxW) {
        w = maxW;
        h = w/aspect;
      }
      return Rect2.create(size.width()/2-w/2, size.height()/2-h/2, w, h);
    };
  }

  static landscapePortrait(landscape, portrait) {
    return (size) => {
      if (size.width()>=size.height()) {
        return landscape(size);
      }
      else {
        return portrait(size);
      }
    };
  }

}
class UiEventActions {
  constructor() {
  }

  getClass() {
    return "UiEventActions";
  }

  static showScreen(screenManager, screen) {
    return (evtSource) => {
      screenManager.showScreen(screen);
    };
  }

  static previousPage(container) {
    return (evtSource) => {
      container.previousPage();
    };
  }

  static nextPage(container) {
    return (evtSource) => {
      container.nextPage();
    };
  }

  static exitApp(screenManager) {
    return (evtSource) => {
      screenManager.exitApp();
    };
  }

}
class UiPainters {
  constructor() {
  }

  getClass() {
    return "UiPainters";
  }

  static drawText(painter, text, font, pos, alignment) {
    if (text.isEmpty()) {
      return ;
    }
    let fontData = painter.getFont(font);
    let parser = new StringParser(text);
    let cursorX = pos.x();
    let cursorY = pos.y();
    if (alignment.getHorizontal().equals(TextAlignmentHorizontal.LEFT)) {
      cursorX = cursorX-fontData.getCharacterOffset(parser.lookupCharacter()).x();
    }
    else if (alignment.getHorizontal().equals(TextAlignmentHorizontal.CENTER)) {
      cursorX = cursorX-fontData.getTextWidth(text)/2;
    }
    else if (alignment.getHorizontal().equals(TextAlignmentHorizontal.RIGHT)) {
      cursorX = cursorX-fontData.getTextWidth(text);
    }
    else {
      throw "unsupprted horizontal alignment: "+alignment.getHorizontal();
    }
    if (alignment.getVertical().equals(TextAlignmentVertical.TOP)) {
    }
    else if (alignment.getVertical().equals(TextAlignmentVertical.CENTER)) {
      cursorY = cursorY-fontData.getSize()/2;
    }
    else if (alignment.getVertical().equals(TextAlignmentVertical.BASE)) {
      cursorY = cursorY-fontData.getBase();
    }
    else if (alignment.getVertical().equals(TextAlignmentVertical.BOTOM)) {
      cursorY = cursorY-fontData.getSize();
    }
    else {
      throw "unsupprted vertical alignment: "+alignment.getVertical();
    }
    while (parser.hasNext()) {
      let ch = parser.readCharacter();
      let sprite = fontData.getCharacterSprite(ch);
      let offset = fontData.getCharacterOffset(ch);
      let size = fontData.getCharacterSize(ch);
      let x = cursorX+offset.x();
      let y = cursorY+offset.y();
      painter.drawImage(sprite, x, y, size.width(), size.height(), fontData.getTextureStyle());
      if (parser.hasNext()) {
        cursorX = cursorX+fontData.getCharAdvance(ch, parser.lookupCharacter());
      }
    }
  }

}
class StretchUiPainter {
  target;
  size;
  constructor() {
  }

  getClass() {
    return "StretchUiPainter";
  }

  guardInvariants() {
  }

  drawImage() {
    if (arguments.length===6&&arguments[0] instanceof TextureId&& typeof arguments[1]==="number"&& typeof arguments[2]==="number"&& typeof arguments[3]==="number"&& typeof arguments[4]==="number"&&arguments[5] instanceof TextureStyle) {
      this.drawImage_6_TextureId_number_number_number_number_TextureStyle(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    }
    else if (arguments.length===3&&arguments[0] instanceof TextureId&&arguments[1] instanceof Rect2&&arguments[2] instanceof TextureStyle) {
      this.drawImage_3_TextureId_Rect2_TextureStyle(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw "error";
    }
  }

  drawImage_6_TextureId_number_number_number_number_TextureStyle(img, x, y, width, height, style) {
    let nx = x/this.size.width();
    let ny = y/this.size.height();
    let nw = width/this.size.width();
    let nh = height/this.size.height();
    this.target.drawImage(img, nx, ny, nw, nh, style);
  }

  drawImage_3_TextureId_Rect2_TextureStyle(img, region, style) {
    this.drawImage(img, region.x(), region.y(), region.width(), region.height(), style);
  }

  drawText(text, font, pos, alignment) {
    UiPainters.drawText(this, text, font, pos, alignment);
  }

  fillRect(rect, color) {
    let normRect = Rect2.create(rect.x()/this.size.width(), rect.y()/this.size.height(), rect.width()/this.size.width(), rect.height()/this.size.height());
    this.target.fillRect(normRect, color);
  }

  drawLine(start, end, color) {
    let normStart = Vec2.create(start.x()/this.size.width(), start.y()/this.size.height());
    let normEnd = Vec2.create(end.x()/this.size.width(), end.y()/this.size.height());
    this.target.drawLine(normStart, normEnd, color);
  }

  setClipRect(rect) {
    let normRect = Rect2.create(rect.x()/this.size.width(), rect.y()/this.size.height(), rect.width()/this.size.width(), rect.height()/this.size.height());
    this.target.setClipRect(normRect);
  }

  unsetClipRect() {
    this.target.unsetClipRect();
  }

  getFont(id) {
    return this.target.getFont(id);
  }

  toString() {
  }

  static create(target, size) {
    let res = new StretchUiPainter();
    res.target = target;
    res.size = size;
    res.guardInvariants();
    return res;
  }

}
class StretchUi {
  sizeFnc;
  size;
  components = new ArrayList();
  focused;
  lock = new Object();
  constructor() {
  }

  getClass() {
    return "StretchUi";
  }

  guardInvariants() {
  }

  subscribe(drivers) {
    if (drivers.isDriverAvailable("KeyboardDriver")) {
      drivers.getDriver("KeyboardDriver").addKeyListener(this);
    }
    if (drivers.isDriverAvailable("TouchDriver")) {
      drivers.getDriver("TouchDriver").addTouchListener(this);
    }
    if (drivers.isDriverAvailable("DisplayDriver")) {
      drivers.getDriver("DisplayDriver").addDisplayistener(this);
    }
  }

  unsubscribe(drivers) {
    if (drivers.isDriverAvailable("KeyboardDriver")) {
      drivers.getDriver("KeyboardDriver").removeKeyListener(this);
    }
    if (drivers.isDriverAvailable("TouchDriver")) {
      drivers.getDriver("TouchDriver").removeTouchListener(this);
    }
    if (drivers.isDriverAvailable("DisplayDriver")) {
      drivers.getDriver("DisplayDriver").removeDisplayListener(this);
    }
  }

  addComponent(component) {
    Guard.notNull(component, "component cannot be null");
    this.components.add(component);
    component.init(this);
    component.onContainerResize(this.size);
  }

  removeComponent(component) {
    this.components.remove(component);
  }

  move(dt) {
    for (let cmp of this.components) {
      cmp.move(dt);
    }
  }

  draw(painter) {
    let painterWrapper = StretchUiPainter.create(painter, this.size);
    for (let cmp of this.components) {
      cmp.draw(painterWrapper);
    }
  }

  requestFocus(target) {
    if (this.focused!=null) {
      this.focused.onFocusLost();
    }
    if (target!=null) {
      this.focused = target;
      target.onFocus();
    }
    return true;
  }

  getFocused() {
    return this.focused;
  }

  onKeyPressed(key) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp instanceof UiKeyboardListener) {
        if ((cmp).this.onKeyPressed(key)) {
          break;
        }
      }
    }
  }

  onKeyReleased(key) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp instanceof UiKeyboardListener) {
        if ((cmp).this.onKeyReleased(key)) {
          break;
        }
      }
    }
  }

  onTouchStart(id, pos, size) {
    let hx = pos.x()*this.size.width()/size.width();
    let hy = pos.y()*this.size.height()/size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp instanceof UiTouchListener) {
        if ((cmp).this.onTouchStart(id, hpos, size)) {
          break;
        }
      }
    }
  }

  onTouchMove(id, pos, size) {
    let hx = pos.x()*this.size.width()/size.width();
    let hy = pos.y()*this.size.height()/size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp instanceof UiTouchListener) {
        if ((cmp).this.onTouchMove(id, hpos, size)) {
          break;
        }
      }
    }
  }

  onTouchEnd(id, pos, size, cancel) {
    let hx = pos.x()*this.size.width()/size.width();
    let hy = pos.y()*this.size.height()/size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp instanceof UiTouchListener) {
        if ((cmp).this.onTouchEnd(id, hpos, size, cancel)) {
          break;
        }
      }
    }
  }

  onDisplayResize(size) {
    this.size = Functions.apply(this.sizeFnc, size);
    for (let cmp of this.components) {
      cmp.onContainerResize(this.size);
    }
  }

  toString() {
  }

  static create(sizeFnc) {
    let res = new StretchUi();
    res.sizeFnc = sizeFnc;
    res.size = Functions.apply(sizeFnc, Size2.create(1, 1));
    res.guardInvariants();
    return res;
  }

}
class UiComponent {
  getClass() {
    return "UiComponent";
  }

  init(controller) {
  }

  move(dt) {
  }

  draw(painter) {
  }

  onContainerResize(size) {
  }

  hashCode() {
    return super.hashCode();
  }

  equals(obj) {
    return super.equals(obj);
  }

}
class ImageView extends UiComponent {
  texture;
  regionFnc;
  containerSize;
  region;
  constructor() {
    super();
  }

  getClass() {
    return "ImageView";
  }

  guardInvariants() {
  }

  move(dt) {
  }

  draw(painter) {
    painter.drawImage(this.texture, this.region, TextureStyle.PIXEL_EDGE);
  }

  onContainerResize(size) {
    this.containerSize = size;
    this.region = Functions.apply(this.regionFnc, size);
  }

  getTexture() {
    return this.texture;
  }

  setTexture() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return this.setTexture_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.setTexture_1_string(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  setTexture_1_TextureId(texture) {
    Guard.notNull(texture, "texture cannot be null");
    this.texture = texture;
    return this;
  }

  setTexture_1_string(texture) {
    return this.setTexture(TextureId.of(texture));
  }

  setRegionFnc(regionFnc) {
    Guard.notNull(regionFnc, "regionFnc cannot be null");
    this.regionFnc = regionFnc;
    this.onContainerResize(this.containerSize);
    return this;
  }

  toString() {
  }

  static create() {
    let res = new ImageView();
    res.texture = TextureId.of("image");
    res.regionFnc = UiRegionFncs.center(100, 25);
    res.containerSize = Size2.create(1, 1);
    res.region = Functions.apply(res.regionFnc, res.containerSize);
    res.guardInvariants();
    return res;
  }

}
class ImageButton extends UiComponent {
  upTexture;
  downTexture;
  disabledTexture;
  text;
  font;
  regionFnc;
  onClickActions;
  containerSize;
  region;
  disabled = false;
  down = false;
  trackedTouch = null;
  constructor() {
    super();
  }

  getClass() {
    return "ImageButton";
  }

  guardInvariants() {
  }

  init(controller) {
  }

  move(dt) {
  }

  draw(painter) {
    if (this.disabled) {
      painter.drawImage(this.disabledTexture, this.region, TextureStyle.PIXEL_EDGE);
    }
    else if (this.down) {
      painter.drawImage(this.downTexture, this.region, TextureStyle.PIXEL_EDGE);
    }
    else {
      painter.drawImage(this.upTexture, this.region, TextureStyle.PIXEL_EDGE);
    }
    painter.drawText(this.text, this.font, this.region.center(), TextAlignment.CENTER);
  }

  onTouchStart(id, pos, size) {
    let inside = this.region.isInside(pos);
    if (this.disabled||this.trackedTouch!=null) {
      return inside;
    }
    if (inside) {
      this.trackedTouch = id;
      this.down = true;
    }
    return inside;
  }

  onTouchMove(id, pos, size) {
    if (this.disabled) {
      return false;
    }
    if (this.trackedTouch==null||id!=this.trackedTouch) {
      return false;
    }
    this.down = this.region.isInside(pos.x(), pos.y());
    return true;
  }

  onTouchEnd(id, pos, size, cancel) {
    if (this.disabled) {
      return false;
    }
    if (this.trackedTouch==null||id!=this.trackedTouch) {
      return false;
    }
    this.trackedTouch = null;
    this.down = false;
    if (this.region.isInside(pos)&&!cancel) {
      for (let action of this.onClickActions) {
        action.run(this);
      }
    }
    return true;
  }

  onContainerResize(size) {
    this.containerSize = size;
    this.region = Functions.apply(this.regionFnc, size);
  }

  isDown() {
    return this.down;
  }

  isDisabled() {
    return this.disabled;
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.trackedTouch = null;
    return this;
  }

  addOnClickAction(action) {
    Guard.notNull(action, "action cannot be null");
    this.onClickActions.add(action);
    return this;
  }

  removeOnClickAction(action) {
    this.onClickActions.remove(action);
    return this;
  }

  setUpTexture() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return this.setUpTexture_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.setUpTexture_1_string(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  setUpTexture_1_TextureId(upTexture) {
    Guard.notNull(upTexture, "upTexture cannot be null");
    this.upTexture = upTexture;
    return this;
  }

  setUpTexture_1_string(upTexture) {
    return this.setUpTexture(TextureId.of(upTexture));
  }

  setDownTexture() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return this.setDownTexture_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.setDownTexture_1_string(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  setDownTexture_1_TextureId(downTexture) {
    Guard.notNull(downTexture, "downTexture cannot be null");
    this.downTexture = downTexture;
    return this;
  }

  setDownTexture_1_string(downTexture) {
    return this.setDownTexture(TextureId.of(downTexture));
  }

  setDisabledTexture() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return this.setDisabledTexture_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.setDisabledTexture_1_string(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  setDisabledTexture_1_TextureId(disabledTexture) {
    Guard.notNull(disabledTexture, "disabledTexture cannot be null");
    this.disabledTexture = disabledTexture;
    return this;
  }

  setDisabledTexture_1_string(disabledTexture) {
    return this.setDisabledTexture(TextureId.of(disabledTexture));
  }

  getText() {
    return this.text;
  }

  setText(text) {
    Guard.notNull(text, "text cannot be null");
    this.text = text;
    return this;
  }

  setFont(font) {
    Guard.notNull(font, "font cannot be null");
    this.font = font;
    return this;
  }

  setRegionFnc(regionFnc) {
    Guard.notNull(regionFnc, "regionFnc cannot be null");
    this.regionFnc = regionFnc;
    this.onContainerResize(this.containerSize);
    return this;
  }

  toString() {
  }

  static create() {
    let res = new ImageButton();
    res.upTexture = TextureId.of("button-up");
    res.downTexture = TextureId.of("button-down");
    res.disabledTexture = TextureId.of("button-disabled");
    res.text = "";
    res.font = FontId.DEFAULT;
    res.regionFnc = UiRegionFncs.center(100, 25);
    res.containerSize = Size2.create(1, 1);
    res.region = Functions.apply(res.regionFnc, res.containerSize);
    res.onClickActions = new HashSet();
    res.guardInvariants();
    return res;
  }

}
class ImageToggleButton extends UiComponent {
  upTexture;
  downTexture;
  text;
  font;
  regionFnc;
  onToggleActions;
  containerSize;
  region;
  down = false;
  toggledDown = false;
  trackedTouch = null;
  constructor() {
    super();
  }

  getClass() {
    return "ImageToggleButton";
  }

  guardInvariants() {
  }

  move(dt) {
  }

  draw(painter) {
    if (this.down) {
      painter.drawImage(this.downTexture, this.region, TextureStyle.PIXEL_EDGE);
    }
    else {
      painter.drawImage(this.upTexture, this.region, TextureStyle.PIXEL_EDGE);
    }
    painter.drawText(this.text, this.font, this.region.center(), TextAlignment.CENTER);
  }

  onTouchStart(id, pos, size) {
    let inside = this.region.isInside(pos);
    if (this.trackedTouch!=null) {
      return inside;
    }
    if (inside) {
      this.trackedTouch = id;
      this.down = !this.toggledDown;
    }
    return inside;
  }

  onTouchMove(id, pos, size) {
    if (this.trackedTouch==null||id!=this.trackedTouch) {
      return false;
    }
    if (this.region.isInside(pos)) {
      this.down = !this.toggledDown;
    }
    else {
      this.down = this.toggledDown;
    }
    return true;
  }

  onTouchEnd(id, pos, size, cancel) {
    if (this.trackedTouch==null||id!=this.trackedTouch) {
      return false;
    }
    this.trackedTouch = null;
    if (this.region.isInside(pos.x(), pos.y())&&!cancel) {
      this.toggledDown = !this.toggledDown;
      this.down = this.toggledDown;
      for (let action of this.onToggleActions) {
        action.run(this);
      }
    }
    this.down = this.toggledDown;
    return true;
  }

  onContainerResize(size) {
    this.containerSize = size;
    this.region = this.regionFnc.apply(size);
  }

  toggleDown() {
    if (this.toggledDown) {
      return ;
    }
    this.toggledDown = true;
    this.down = true;
    this.trackedTouch = null;
    for (let action of this.onToggleActions) {
      action.run(this);
    }
  }

  toggleDownSilent() {
    if (this.toggledDown) {
      return ;
    }
    this.toggledDown = true;
    this.down = true;
    this.trackedTouch = null;
  }

  toggleUp() {
    if (!this.toggledDown) {
      return this;
    }
    this.toggledDown = false;
    this.down = false;
    this.trackedTouch = null;
    for (let action of this.onToggleActions) {
      action.run(this);
    }
    return this;
  }

  toggleUpSilent() {
    if (!this.toggledDown) {
      return this;
    }
    this.toggledDown = false;
    this.down = false;
    this.trackedTouch = null;
    return this;
  }

  toggleSilent(toggledDown) {
    if (toggledDown) {
      this.toggleDownSilent();
    }
    else {
      this.toggleUpSilent();
    }
    return this;
  }

  isToggledDown() {
    return this.toggledDown;
  }

  addOnToggleAction(action) {
    Guard.notNull(action, "action cannot be null");
    this.onToggleActions.add(action);
    return this;
  }

  removeOnToggleAction(action) {
    this.onToggleActions.remove(action);
    return this;
  }

  setUpTexture() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return this.setUpTexture_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.setUpTexture_1_string(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  setUpTexture_1_TextureId(upTexture) {
    Guard.notNull(upTexture, "upTexture cannot be null");
    this.upTexture = upTexture;
    return this;
  }

  setUpTexture_1_string(upTexture) {
    return this.setUpTexture(TextureId.of(upTexture));
  }

  setDownTexture() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return this.setDownTexture_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.setDownTexture_1_string(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  setDownTexture_1_TextureId(downTexture) {
    Guard.notNull(downTexture, "downTexture cannot be null");
    this.downTexture = downTexture;
    return this;
  }

  setDownTexture_1_string(downTexture) {
    return this.setDownTexture(TextureId.of(downTexture));
  }

  getText() {
    return this.text;
  }

  setText(text) {
    Guard.notNull(text, "text cannot be null");
    this.text = text;
    return this;
  }

  setFont(font) {
    Guard.notNull(font, "font cannot be null");
    this.font = font;
    return this;
  }

  setRegionFnc(regionFnc) {
    Guard.notNull(regionFnc, "regionFnc cannot be null");
    this.regionFnc = regionFnc;
    this.onContainerResize(this.containerSize);
    return this;
  }

  toString() {
  }

  static create() {
    let res = new ImageToggleButton();
    res.upTexture = TextureId.of("button-up");
    res.downTexture = TextureId.of("button-down");
    res.text = "";
    res.font = FontId.DEFAULT;
    res.regionFnc = UiRegionFncs.center(100, 25);
    res.containerSize = Size2.create(1, 1);
    res.region = res.regionFnc.apply(res.containerSize);
    res.onToggleActions = new HashSet();
    res.guardInvariants();
    return res;
  }

}
class Label extends UiComponent {
  text;
  font;
  posFnc;
  alignment;
  containerSize;
  pos;
  constructor() {
    super();
  }

  getClass() {
    return "Label";
  }

  guardInvariants() {
  }

  move(dt) {
  }

  draw(painter) {
    painter.drawText(this.text, this.font, this.pos, this.alignment);
  }

  onContainerResize(size) {
    this.containerSize = size;
    this.pos = Functions.apply(this.posFnc, size);
  }

  getText() {
    return this.text;
  }

  setText(text) {
    Guard.notNull(text, "text cannot be null");
    this.text = text;
    return this;
  }

  getFont() {
    return this.font;
  }

  setFont(font) {
    Guard.notNull(font, "font cannot be null");
    this.font = font;
    return this;
  }

  getPosFnc() {
    return this.posFnc;
  }

  setPosFnc(posFnc) {
    Guard.notNull(posFnc, "posFnc cannot be null");
    this.posFnc = posFnc;
    this.onContainerResize(this.containerSize);
    return this;
  }

  getAlignment() {
    return this.alignment;
  }

  setAlignment(alignment) {
    Guard.notNull(alignment, "alignment cannot be null");
    this.alignment = alignment;
    return this;
  }

  toString() {
  }

  static create() {
    let res = new Label();
    res.text = "";
    res.font = FontId.DEFAULT;
    res.alignment = TextAlignment.CENTER;
    res.posFnc = UiPosFncs.center();
    res.containerSize = Size2.create(1, 1);
    res.pos = Functions.apply(res.posFnc, res.containerSize);
    res.guardInvariants();
    return res;
  }

}
const createTextAlignmentHorizontal = (description) => {
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
const TextAlignmentHorizontal = Object.freeze({
  LEFT: createTextAlignmentHorizontal("LEFT"),
  CENTER: createTextAlignmentHorizontal("CENTER"),
  RIGHT: createTextAlignmentHorizontal("RIGHT"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
});
const createTextAlignmentVertical = (description) => {
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
const TextAlignmentVertical = Object.freeze({
  TOP: createTextAlignmentVertical("TOP"),
  CENTER: createTextAlignmentVertical("CENTER"),
  BASE: createTextAlignmentVertical("BASE"),
  BOTOM: createTextAlignmentVertical("BOTOM"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
});
class TextAlignment {
  static LEFT_TOP = TextAlignment.create(TextAlignmentHorizontal.LEFT, TextAlignmentVertical.TOP);
  static CENTER_TOP = TextAlignment.create(TextAlignmentHorizontal.CENTER, TextAlignmentVertical.TOP);
  static RIGHT_TOP = TextAlignment.create(TextAlignmentHorizontal.RIGHT, TextAlignmentVertical.TOP);
  static LEFT_CENTER = TextAlignment.create(TextAlignmentHorizontal.LEFT, TextAlignmentVertical.CENTER);
  static CENTER = TextAlignment.create(TextAlignmentHorizontal.CENTER, TextAlignmentVertical.CENTER);
  static RIGHT_CENTER = TextAlignment.create(TextAlignmentHorizontal.RIGHT, TextAlignmentVertical.CENTER);
  static LEFT_BASE = TextAlignment.create(TextAlignmentHorizontal.LEFT, TextAlignmentVertical.BASE);
  static CENTER_BASE = TextAlignment.create(TextAlignmentHorizontal.CENTER, TextAlignmentVertical.BASE);
  static RIGHT_BASE = TextAlignment.create(TextAlignmentHorizontal.RIGHT, TextAlignmentVertical.BASE);
  static LEFT_BOTTOM = TextAlignment.create(TextAlignmentHorizontal.LEFT, TextAlignmentVertical.BOTOM);
  static CENTER_BOTTOM = TextAlignment.create(TextAlignmentHorizontal.CENTER, TextAlignmentVertical.BOTOM);
  static RIGHT_BOTTOM = TextAlignment.create(TextAlignmentHorizontal.RIGHT, TextAlignmentVertical.BOTOM);
  horizontal;
  vertical;
  constructor() {
  }

  getClass() {
    return "TextAlignment";
  }

  guardInvariants() {
  }

  getHorizontal() {
    return this.horizontal;
  }

  getVertical() {
    return this.vertical;
  }

  withHorizontal(hor) {
    let res = new TextAlignment();
    res.horizontal = hor;
    res.vertical = this.vertical;
    res.guardInvariants();
    return res;
  }

  withVertical(vert) {
    let res = new TextAlignment();
    res.horizontal = this.horizontal;
    res.vertical = vert;
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

  static create(horizontal, vertical) {
    let res = new TextAlignment();
    res.horizontal = horizontal;
    res.vertical = vertical;
    res.guardInvariants();
    return res;
  }

}
class Character {
  character;
  sprite;
  fontSize;
  offset;
  size;
  advance;
  kernings;
  constructor() {
  }

  getClass() {
    return "Character";
  }

  guardInvariants() {
  }

  getCharacter() {
    return this.character;
  }

  getSprite() {
    return this.sprite;
  }

  getFontSize() {
    return this.fontSize;
  }

  getOffset() {
    return this.offset;
  }

  getSize() {
    return this.size;
  }

  getAdvance() {
    return this.advance;
  }

  getKerning(nextCh) {
    return this.kernings.getOrDefault(nextCh, 0);
  }

  getKernings() {
    return this.kernings;
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
    if (arguments.length===7&& typeof arguments[0]==="string"&&arguments[1] instanceof TextureId&& typeof arguments[2]==="number"&&arguments[3] instanceof Vec2&&arguments[4] instanceof Size2&& typeof arguments[5]==="number"&&arguments[6] instanceof HashMap) {
      return Character.create_7_string_TextureId_number_Vec2_Size2_number_Map(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
    }
    else if (arguments.length===7&& typeof arguments[0]==="string"&& typeof arguments[1]==="string"&& typeof arguments[2]==="number"&&arguments[3] instanceof Vec2&&arguments[4] instanceof Size2&& typeof arguments[5]==="number"&&arguments[6] instanceof HashMap) {
      return Character.create_7_string_string_number_Vec2_Size2_number_Map(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
    }
    else {
      throw "error";
    }
  }

  static create_7_string_TextureId_number_Vec2_Size2_number_Map(character, sprite, fontSize, offset, size, advance, kernings) {
    let res = new Character();
    res.character = character;
    res.sprite = sprite;
    res.fontSize = fontSize;
    res.offset = offset;
    res.size = size;
    res.advance = advance;
    res.kernings = Dut.copyImmutableMap(kernings);
    res.guardInvariants();
    return res;
  }

  static create_7_string_string_number_Vec2_Size2_number_Map(character, sprite, fontSize, offset, size, advance, kernings) {
    return Character.create(character, TextureId.of(sprite), fontSize, offset, size, advance, kernings);
  }

}
class FontId extends RefId {
  static TYPE = RefIdType.of("FONT_ID");
  static DEFAULT = FontId.of("arial-20");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "FontId";
  }

  guardInvariants() {
  }

  type() {
    return FontId.TYPE;
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
    if (!(obj instanceof FontId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new FontId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
class Font {
  name;
  textureStyle;
  size;
  base;
  characters;
  constructor() {
  }

  getClass() {
    return "Font";
  }

  guardInvariants() {
  }

  getName() {
    return this.name;
  }

  getTextureStyle() {
    return this.textureStyle;
  }

  getSize() {
    return this.size;
  }

  getBase() {
    return this.base;
  }

  hasCharacter(character) {
    return this.characters.containsKey(character);
  }

  getCharacters() {
    return this.characters;
  }

  getCharacterSprite(ch) {
    return this.characters.get(ch).getSprite();
  }

  getCharacterSize(ch) {
    let chr = this.characters.get(ch);
    return chr.getSize().scale(this.size/chr.getFontSize());
  }

  getCharacterOffset(ch) {
    let chr = this.characters.get(ch);
    if (chr==null) {
      throw "character is registered in the font: "+ch;
    }
    return chr.getOffset().scale(this.size/chr.getFontSize());
  }

  getCharAdvance(ch, nextCh) {
    let chr = this.characters.get(ch);
    return (chr.getAdvance()+chr.getKerning(nextCh))*(this.size/chr.getFontSize());
  }

  getTextWidth(text) {
    if (text.isEmpty()) {
      return 0;
    }
    let parser = new StringParser(text);
    let res = -this.getCharacterOffset(parser.lookupCharacter()).x();
    let cursor = 0;
    while (parser.hasNext()) {
      let ch = parser.readCharacter();
      if (parser.hasNext()) {
        cursor = cursor+this.getCharAdvance(ch, parser.lookupCharacter());
      }
      else {
        res = res+this.getCharacterOffset(ch).x()+this.getCharacterSize(ch).width();
      }
    }
    res = res+cursor;
    return res;
  }

  addCharacter(character) {
    Guard.beFalse(this.characters.containsKey(character.getCharacter()), "character is already presented in the font: %s", character.getCharacter());
    let res = new Font();
    res.name = this.name;
    res.textureStyle = this.textureStyle;
    res.size = this.size;
    res.base = this.base;
    res.characters = new HashMap();
    res.characters.putAll(this.characters);
    res.characters.put(character.getCharacter(), character);
    res.characters = Collections.unmodifiableMap(res.characters);
    res.guardInvariants();
    return res;
  }

  withSize(s) {
    let res = new Font();
    res.name = this.name;
    res.textureStyle = this.textureStyle;
    res.size = s;
    res.base = this.base*s/this.size;
    res.characters = this.characters;
    res.guardInvariants();
    return res;
  }

  withTextureStyle(ts) {
    let res = new Font();
    res.name = this.name;
    res.textureStyle = ts;
    res.size = this.size;
    res.base = this.base;
    res.characters = this.characters;
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

  static empty(name, size, base) {
    let res = new Font();
    res.name = name;
    res.textureStyle = TextureStyle.create(TextureWrapType.EDGE, TextureWrapType.EDGE, Rgba.TRANSPARENT, TextureFilterType.LINEAR, TextureFilterType.LINEAR);
    res.size = size;
    res.base = base;
    res.characters = Collections.emptyMap();
    res.guardInvariants();
    return res;
  }

}
class Fonts {
  constructor() {
  }

  getClass() {
    return "Fonts";
  }

  static loadFnt(loader, file, dependencies) {
    let res = AssetGroup.empty();
    let height = 0;
    let base = 0;
    let chars = new HashMap();
    let pages = new HashMap();
    let kernings = new HashMap();
    let buf = loader.loadFile(file);
    let doc = null;
    let is = new ByteArrayInputStream(buf);
    try {
      let fact = DocumentBuilderFactory.newInstance();
      let bld = fact.newDocumentBuilder();
      doc = bld.parse(is);
      is.close();
      is = null;
    }
    catch (e) {
      throw e;
    }
    finally {
      try {
        if (is!=null) {
          is.close();
        }
      }
      catch (ex) {
      }
    }
    let docEl = doc.getDocumentElement();
    Guard.beTrue(docEl.getNodeName().equals("font"), "this is not a font document");
    let nodes = docEl.getChildNodes();
    for (let i = 0; i<nodes.getLength(); ++i) {
      let node = nodes.item(i);
      if (node.getNodeType()!=Node.ELEMENT_NODE) {
        continue;
      }
      if (node.getNodeName().equals("common")) {
        height = Integer.valueOf(node.getAttributes().getNamedItem("lineHeight").getTextContent());
        base = Integer.valueOf(node.getAttributes().getNamedItem("base").getTextContent());
      }
      else if (node.getNodeName().equals("chars")) {
        let chnds = node.getChildNodes();
        for (let j = 0; j<chnds.getLength(); ++j) {
          let chnd = chnds.item(j);
          if (chnd.getNodeType()!=Node.ELEMENT_NODE) {
            continue;
          }
          let ch = (Integer.parseInt(chnd.getAttributes().getNamedItem("id").getNodeValue()))+"";
          let chdata = Dut.map("x", chnd.getAttributes().getNamedItem("x").getTextContent(), "y", chnd.getAttributes().getNamedItem("y").getTextContent(), "width", chnd.getAttributes().getNamedItem("width").getTextContent(), "height", chnd.getAttributes().getNamedItem("height").getTextContent(), "offsetX", chnd.getAttributes().getNamedItem("xoffset").getTextContent(), "offsetY", chnd.getAttributes().getNamedItem("yoffset").getTextContent(), "advance", chnd.getAttributes().getNamedItem("xadvance").getTextContent(), "page", chnd.getAttributes().getNamedItem("page").getTextContent());
          chars.put(ch, chdata);
        }
      }
      else if (node.getNodeName().equals("pages")) {
        let pgnds = node.getChildNodes();
        for (let j = 0; j<pgnds.getLength(); ++j) {
          let pgnd = pgnds.item(j);
          if (pgnd.getNodeType()!=Node.ELEMENT_NODE) {
            continue;
          }
          let id = pgnd.getAttributes().getNamedItem("id").getTextContent();
          let fname = pgnd.getAttributes().getNamedItem("file").getTextContent();
          let textureFile = file.getParent().getChild(fname);
          let texId = TextureId.of(textureFile.getPlainName());
          if (dependencies.containsKey(texId)) {
            let texture = dependencies.get("Texture", texId);
            pages.put(id, texture);
          }
          else {
            let texture = loader.loadTexture(file.getParent().getChild(fname));
            pages.put(id, texture);
          }
        }
      }
      else if (node.getNodeName().equals("kernings")) {
        let krnds = node.getChildNodes();
        for (let j = 0; j<krnds.getLength(); ++j) {
          let krnd = krnds.item(j);
          if (krnd.getNodeType()!=Node.ELEMENT_NODE) {
            continue;
          }
          let first = (Integer.parseInt(krnd.getAttributes().getNamedItem("first").getNodeValue()))+"";
          let second = (Integer.parseInt(krnd.getAttributes().getNamedItem("second").getNodeValue()))+"";
          let amount = Float.valueOf(krnd.getAttributes().getNamedItem("amount").getTextContent());
          if (!kernings.containsKey(first)) {
            kernings.put(first, new HashMap());
          }
          kernings.get(first).put(second, amount);
        }
      }
    }
    let font = Font.empty(file.getPlainName(), height, base);
    for (let ch of chars.keySet()) {
      let chconf = chars.get(ch);
      let tex = pages.get(chconf.get("page")).crop(Integer.valueOf(chconf.get("x")), Integer.valueOf(chconf.get("y")), Integer.valueOf(chconf.get("width")), Integer.valueOf(chconf.get("height")));
      let texId = TextureId.of(file.getPlainName()+"."+ch);
      let rch = Character.create(ch, texId, height, Vec2.create(Integer.valueOf(chconf.get("offsetX")), Integer.valueOf(chconf.get("offsetY"))), Size2.create(Integer.valueOf(chconf.get("width")), Integer.valueOf(chconf.get("height"))), Integer.valueOf(chconf.get("advance")), kernings.getOrDefault(ch, Collections.emptyMap()));
      font = font.addCharacter(rch);
      res = res.put(texId, tex);
    }
    res = res.put(FontId.of(file.getPlainName()), font);
    return res;
  }

  static prepareScaledFonts(assets, sizes) {
    let ids = assets.getKeys(FontId.TYPE);
    for (let id of ids) {
      let parts = id.id().split("-");
      let base = parts[0];
      for (let i = 1; i<parts.length-1; ++i) {
        base = base+"-"+parts[i];
      }
      for (let size of sizes) {
        let nid = base+"-"+size;
        let fid = FontId.of(nid);
        if (assets.containsKey(fid)) {
          continue;
        }
        assets.put(fid, assets.get("Font", id).withSize(size));
      }
    }
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
  BORDER: createTextureWrapType("BORDER"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
  LINEAR_MIPMAP_LINEAR: createTextureFilterType("LINEAR_MIPMAP_LINEAR"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
  MULTIPLICATIVE: createBlendType("MULTIPLICATIVE"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
class UiEnvironment {
  static DEFAULT = UiEnvironment.create();
  gamma;
  constructor() {
  }

  getClass() {
    return "UiEnvironment";
  }

  guardInvariants() {
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
    let res = new UiEnvironment();
    res.gamma = 2.2;
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
class AssetPlaceholder {
  static INSTANCE = new AssetPlaceholder();
  constructor() {
  }

  getClass() {
    return "AssetPlaceholder";
  }

  hashCode() {
    return 0;
  }

  equals(obj) {
    return this==obj;
  }

  toString() {
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
  SIZE: createAssetCompanionType("SIZE"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
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
    return !AssetPlaceholder.INSTANCE.equals(this.assets.get(key));
  }

  get(assetClass, key) {
    if (!this.assets.containsKey(key)) {
      throw "no asset under "+key.id();
    }
    let res = this.assets.get(key);
    if (AssetPlaceholder.INSTANCE.equals(res)) {
      throw "asset is dematerialized (e.g. pushed to the hardware) "+key;
    }
    return res;
  }

  getCompanion(clazz, key, type) {
    if (!this.companions.containsKey(key)) {
      throw "no asset under "+key.id();
    }
    let res = this.companions.get(key).get(type);
    if (res==null) {
      throw "asset "+key+" does not have companion "+type;
    }
    return res;
  }

  markSynced(id) {
    this.assets.put(id, AssetPlaceholder.INSTANCE);
  }

  isSynced(key) {
    if (!this.assets.containsKey(key)) {
      throw "no asset under "+key.id();
    }
    return AssetPlaceholder.INSTANCE.equals(this.assets.get(key));
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
const createTapEntryType = (description) => {
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
const TapEntryType = Object.freeze({
  TEXTURE: createTapEntryType("TEXTURE"),
  SPRITE: createTapEntryType("SPRITE"),
  MESH: createTapEntryType("MESH"),
  MATERIAL: createTapEntryType("MATERIAL"),
  MODEL: createTapEntryType("MODEL"),
  CLIP_ANIMATION_COLLECTION: createTapEntryType("CLIP_ANIMATION_COLLECTION"),
  SOUND: createTapEntryType("SOUND"),
  FONT: createTapEntryType("FONT"),
  PHYSICAL_MATERIAL: createTapEntryType("PHYSICAL_MATERIAL"),
  PREFAB: createTapEntryType("PREFAB"),
  SCENE: createTapEntryType("SCENE"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
});
class TapEntry {
  type;
  id;
  version;
  data;
  constructor() {
  }

  getClass() {
    return "TapEntry";
  }

  guardInvariants() {
  }

  getType() {
    return this.type;
  }

  getId() {
    return this.id;
  }

  getVersion() {
    return this.version;
  }

  getData() {
    return Arrays.copyOf(this.data, this.data.length);
  }

  createDataStream() {
    return new ByteArrayInputStream(this.data);
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(type, id, version, data) {
    let res = new TapEntry();
    res.type = type;
    res.id = id;
    res.version = version;
    res.data = Arrays.copyOf(data, data.length);
    res.guardInvariants();
    return res;
  }

}
class Tap {
  entries;
  constructor() {
  }

  getClass() {
    return "Tap";
  }

  guardInvariants() {
  }

  getEntries() {
    return this.entries;
  }

  addEntry(entry) {
    let lst = Dut.copyList(this.entries);
    lst.add(entry);
    let res = new Tap();
    res.entries = Dut.copyImmutableList(lst);
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

  static empty() {
    let res = new Tap();
    res.entries = Collections.emptyList();
    res.guardInvariants();
    return res;
  }

}
class TapTextures {
  constructor() {
  }

  getClass() {
    return "TapTextures";
  }

  static toEntry(id, texture) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.intToBytes(texture.getChannels().size()));
      for (let ch of texture.getChannels()) {
        bos.write(TapBytes.stringToBytes(ch.name()));
      }
      bos.write(TapBytes.intToBytes(texture.getWidth()));
      bos.write(TapBytes.intToBytes(texture.getHeight()));
      let pbuf = texture.getBuf();
      for (let i = 0; i<pbuf.length; ++i) {
        bos.write(TapBytes.floatToBytes(pbuf[i]));
      }
      buf = bos.toByteArray();
      bos.close();
      bos = null;
    }
    catch (e) {
      throw e;
    }
    finally {
      if (bos!=null) {
        try {
          bos.close();
        }
        catch (ex) {
        }
      }
    }
    return TapEntry.create(TapEntryType.TEXTURE, id.id(), 1, buf);
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.TEXTURE, "entry must be a TEXTURE type");
    if (entry.getVersion()==1) {
      let texture = null;
      let reader = TapBufferReader.create(entry);
      try {
        let numChannels = reader.readInt();
        let channels = new ArrayList(numChannels);
        for (let i = 0; i<numChannels; ++i) {
          channels.add(TextureChannel.valueOf(reader.readString()));
        }
        let w = reader.readInt();
        let h = reader.readInt();
        let pbufLength = numChannels*w*h;
        let pbuf = [];
        for (let i = 0; i<pbufLength; ++i) {
          pbuf[i] = reader.readFloat();
        }
        texture = Texture.create(channels, w, h, pbuf);
      }
      finally {
        reader.close();
      }
      return AssetGroup.of(TextureId.of(entry.getId()), texture);
    }
    else {
      throw "unsupported version, implement me: "+entry.getVersion();
    }
  }

}
class TapFonts {
  constructor() {
  }

  getClass() {
    return "TapFonts";
  }

  static toEntry(id, font) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.stringToBytes(font.getName()));
      bos.write(TapBytes.stringToBytes(font.getTextureStyle().getHorizWrapType().name()));
      bos.write(TapBytes.stringToBytes(font.getTextureStyle().getVertWrapType().name()));
      bos.write(TapBytes.floatToBytes(font.getTextureStyle().getBorderColor().r()));
      bos.write(TapBytes.floatToBytes(font.getTextureStyle().getBorderColor().g()));
      bos.write(TapBytes.floatToBytes(font.getTextureStyle().getBorderColor().b()));
      bos.write(TapBytes.floatToBytes(font.getTextureStyle().getBorderColor().a()));
      bos.write(TapBytes.stringToBytes(font.getTextureStyle().getMinFilterType().name()));
      bos.write(TapBytes.stringToBytes(font.getTextureStyle().getMagFilterType().name()));
      bos.write(TapBytes.floatToBytes(font.getSize()));
      bos.write(TapBytes.floatToBytes(font.getBase()));
      bos.write(TapBytes.intToBytes(font.getCharacters().size()));
      for (let chk of Dut.copySortedSet(font.getCharacters().keySet())) {
        let ch = font.getCharacters().get(chk);
        bos.write(TapBytes.stringToBytes(ch.getCharacter()));
        bos.write(TapBytes.stringToBytes(ch.getSprite().id()));
        bos.write(TapBytes.floatToBytes(ch.getFontSize()));
        bos.write(TapBytes.floatToBytes(ch.getOffset().x()));
        bos.write(TapBytes.floatToBytes(ch.getOffset().y()));
        bos.write(TapBytes.floatToBytes(ch.getSize().width()));
        bos.write(TapBytes.floatToBytes(ch.getSize().height()));
        bos.write(TapBytes.floatToBytes(ch.getAdvance()));
        bos.write(TapBytes.intToBytes(ch.getKernings().size()));
        for (let kch of Dut.copySortedSet(ch.getKernings().keySet())) {
          bos.write(TapBytes.stringToBytes(kch));
          bos.write(TapBytes.floatToBytes(ch.getKerning(kch)));
        }
      }
      buf = bos.toByteArray();
      bos.close();
      bos = null;
    }
    catch (e) {
      throw e;
    }
    finally {
      if (bos!=null) {
        try {
          bos.close();
        }
        catch (ex) {
        }
      }
    }
    return TapEntry.create(TapEntryType.FONT, id.id(), 1, buf);
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.FONT, "entry must be a FONT type");
    if (entry.getVersion()==1) {
      let font = null;
      let reader = TapBufferReader.create(entry);
      try {
        let name = reader.readString();
        let horizWrapType = TextureWrapType.valueOf(reader.readString());
        let veryWrapType = TextureWrapType.valueOf(reader.readString());
        let borderR = reader.readFloat();
        let borderG = reader.readFloat();
        let borderB = reader.readFloat();
        let borderA = reader.readFloat();
        let minFilter = TextureFilterType.valueOf(reader.readString());
        let magFilter = TextureFilterType.valueOf(reader.readString());
        let size = reader.readFloat();
        let base = reader.readFloat();
        let textureStyle = TextureStyle.create(horizWrapType, veryWrapType, Rgba.create(borderR, borderG, borderB, borderA), minFilter, magFilter);
        font = Font.empty(name, size, base).withTextureStyle(textureStyle);
        let numCharacters = reader.readInt();
        for (let i = 0; i<numCharacters; ++i) {
          let ch = reader.readString();
          let sprite = TextureId.of(reader.readString());
          let fontSize = reader.readFloat();
          let offsetX = reader.readFloat();
          let offsetY = reader.readFloat();
          let width = reader.readFloat();
          let height = reader.readFloat();
          let advance = reader.readFloat();
          let numKernings = reader.readInt();
          let kernings = new HashMap();
          for (let j = 0; j<numKernings; ++j) {
            let kch = reader.readString();
            let kval = reader.readFloat();
            kernings.put(kch, kval);
          }
          let chr = Character.create(ch, sprite, fontSize, Vec2.create(offsetX, offsetY), Size2.create(width, height), advance, kernings);
          font = font.addCharacter(chr);
        }
      }
      finally {
        reader.close();
      }
      return AssetGroup.of(FontId.of(entry.getId()), font);
    }
    else {
      throw "unsupported version, implement me: "+entry.getVersion();
    }
  }

}
const createBasicLoadingScreenLoadStrategy = (description) => {
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
const BasicLoadingScreenLoadStrategy = Object.freeze({
  DIRECT_FILE_TEXTURE: createBasicLoadingScreenLoadStrategy("DIRECT_FILE_TEXTURE"),
  TAP_FILE: createBasicLoadingScreenLoadStrategy("TAP_FILE"),

  valueOf(description) {
    if (typeof description !== 'string') {
      throw new Error('valueOf expects a string parameter');
    }
    for (const [key, value] of Object.entries(this)) {
      if (typeof value === 'object' && value.symbol && value.symbol.description === description) {
        return value;
      }
    }
    throw new Error(`No enum constant with description: ${description}`);
  },

  values() {
    return Object.values(this).filter(value => typeof value === 'object' && value.symbol);
  }
});
class BasicLoadingScreen {
  strategy;
  path;
  texture;
  ui;
  image;
  constructor() {
  }

  getClass() {
    return "BasicLoadingScreen";
  }

  guardInvariants() {
  }

  move(drivers, screenManager, dt) {
    let gDriver = drivers.getDriver("GraphicsDriver");
    if (this.image==null) {
      let assets = drivers.getDriver("AssetManager");
      let texSize = assets.getCompanion("Size2", this.texture, AssetCompanionType.SIZE);
      this.image = ImageView.create().setTexture(this.texture).setRegionFnc(UiRegionFncs.centerHeightSafe(400, texSize.aspect(), 0.8));
      this.ui.addComponent(this.image);
    }
    this.ui.move(dt);
    gDriver.clearBuffers(BufferId.COLOR, BufferId.DEPTH);
    let uiRenderer = gDriver.startRenderer("UiRenderer", UiEnvironment.DEFAULT);
    uiRenderer.render(this.ui);
    uiRenderer.end();
  }

  warmUp(drivers, screenManager) {
  }

  init(drivers, screenManager, properties) {
    let res = new ArrayList();
    let assets = drivers.getDriver("AssetManager");
    if (!assets.containsKey(this.texture)) {
      if (this.strategy.equals(BasicLoadingScreenLoadStrategy.DIRECT_FILE_TEXTURE)) {
        res.add(assets.resolveAsync(this.path, "Texture", TextureFncs.flipVertGamma(2.2)));
      }
      else if (this.strategy.equals(BasicLoadingScreenLoadStrategy.TAP_FILE)) {
        res.add(assets.resolveAsync(this.path));
      }
      else {
        throw "unknown loadStrategy: "+this.strategy;
      }
    }
    this.ui = StretchUi.create(UiSizeFncs.constantHeight(1600));
    this.ui.subscribe(drivers);
    return res;
  }

  leave(drivers) {
  }

  static simple(texturePath) {
    let res = new BasicLoadingScreen();
    res.strategy = BasicLoadingScreenLoadStrategy.DIRECT_FILE_TEXTURE;
    res.path = Path.of(texturePath);
    res.texture = TextureId.of(res.path.getPlainName());
    res.guardInvariants();
    return res;
  }

  static simpleTap(tapPath, textureId) {
    let res = new BasicLoadingScreen();
    res.strategy = BasicLoadingScreenLoadStrategy.TAP_FILE;
    res.path = Path.of(tapPath);
    res.texture = TextureId.of(textureId);
    res.guardInvariants();
    return res;
  }

}
class TyracornScreenAppScreenManager {
  nextScreen = null;
  leaveActions = new ArrayList();
  lock = new Object();
  constructor() {
  }

  getClass() {
    return "TyracornScreenAppScreenManager";
  }

  guardInvariants() {
  }

  showScreen(screen) {
    this.nextScreen = screen;
  }

  addLeaveAction(action) {
    Guard.notNull(action, "action cannot be null");
    this.leaveActions.add(action);
  }

  exitApp() {
    System.exit(0);
  }

  getNextScreen() {
    return this.nextScreen;
  }

  getLeaveActions() {
    return Dut.copyList(this.leaveActions);
  }

  static create() {
    let res = new TyracornScreenAppScreenManager();
    res.guardInvariants();
    return res;
  }

}
class TyracornScreenApp {
  properties;
  screenManager;
  loadingScreen;
  activeScreen;
  loadingFutures;
  resetNextDt = false;
  constructor() {
  }

  getClass() {
    return "TyracornScreenApp";
  }

  guardInvariants() {
  }

  init(drivers, properties) {
    this.properties = Dut.copyImmutableMap(properties);
    this.screenManager = TyracornScreenAppScreenManager.create();
    let res = this.loadingScreen.init(drivers, this.screenManager, this.properties);
    this.loadingFutures = this.activeScreen.init(drivers, this.screenManager, this.properties);
    return res;
  }

  move(drivers, dt) {
    if (this.loadingFutures.isEmpty()) {
      if (this.resetNextDt) {
        dt = 0;
        this.resetNextDt = false;
      }
      this.activeScreen.move(drivers, this.screenManager, dt);
      if (this.screenManager.getNextScreen()!=null) {
        for (let action of this.screenManager.getLeaveActions()) {
          action.run();
        }
        this.activeScreen = this.screenManager.getNextScreen();
        this.screenManager = TyracornScreenAppScreenManager.create();
        this.loadingFutures = this.activeScreen.init(drivers, this.screenManager, this.properties);
        if (this.loadingFutures.isEmpty()) {
          drivers.getDriver("AssetManager").syncToDrivers();
          this.activeScreen.warmUp(drivers, this.screenManager);
          this.resetNextDt = true;
        }
      }
    }
    else {
      this.loadingScreen.move(drivers, this.screenManager, dt);
      let futs = new ArrayList();
      for (let future of this.loadingFutures) {
        if (future.isDone()) {
          if (!future.isSuccess()) {
            System.err.print("Initialization failed");
            System.exit(1);
          }
        }
        else {
          futs.add(future);
        }
        this.loadingFutures = futs;
      }
      if (this.loadingFutures.isEmpty()) {
        drivers.getDriver("AssetManager").syncToDrivers();
        this.activeScreen.warmUp(drivers, this.screenManager);
        this.resetNextDt = true;
      }
    }
  }

  pause(drivers) {
    this.activeScreen.pause(drivers);
  }

  close(drivers) {
    this.activeScreen.leave(drivers);
    this.loadingScreen.leave(drivers);
  }

  static create(loadingScreen, startScreen) {
    let res = new TyracornScreenApp();
    res.loadingScreen = loadingScreen;
    res.activeScreen = startScreen;
    res.guardInvariants();
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
class BasicApp05 {
  box = MeshId.of("box");
  whiteBox = MeshId.of("white-box");
  shadow1 = ShadowBufferId.of("shadow1");
  shadow2 = ShadowBufferId.of("shadow2");
  shadow3 = ShadowBufferId.of("shadow3");
  time = 0;
  constructor() {
  }

  getClass() {
    return "BasicApp05";
  }

  move(drivers, dt) {
    let dirLightEnabled = true;
    let spotLight1Enabled = true;
    let spotLight2Enabled = true;
    this.time = this.time+dt;
    let gDriver = drivers.getDriver("GraphicsDriver");
    let aspect = gDriver.getScreenViewport().getAspect();
    let fovy = aspect>=1?FMath.toRadians(60):FMath.toRadians(90);
    let m = 2*FMath.sin(this.time/3);
    let cam = Camera.persp(fovy, aspect, 0.1, 1000.0).lookAt(Vec3.create(m, 2, 7), Vec3.create(0.0, 0.0, 0.0), Vec3.create(0, 1, 0));
    let dirLightColor = LightColor.create(Rgb.gray(0.4), Rgb.gray(0.6), Rgb.gray(0.6));
    let dirLightDir = Vec3.create(0.2*FMath.cos(this.time/4), -1, 0.4).normalize();
    let dirLightPos = Vec3.create(0, 5, 0);
    let dirLightShadowMap = ShadowMap.createDir(this.shadow1, dirLightPos, dirLightDir, 10, 10);
    let dirLight = Light.directional(dirLightColor, dirLightDir, dirLightShadowMap);
    let spotLight1Pos = Vec3.create(0, 2, 0);
    let spotLight1Dir = Vec3.create(0.4+m, -1, -0.2).normalize();
    let spotLight1Color = LightColor.create(Rgb.BLACK, Rgb.WHITE, Rgb.WHITE);
    let spotLight1Cone = LightCone.create(FMath.PI/9, FMath.PI/6);
    let spotLight1ShadowMap = ShadowMap.createSpot(this.shadow2, spotLight1Pos, spotLight1Dir, spotLight1Cone.getOutTheta(), 1, 8);
    let spotLight1 = Light.spotQuadratic(spotLight1Color, spotLight1Pos, spotLight1Dir, 8, spotLight1Cone, spotLight1ShadowMap);
    let spotLight2Pos = Vec3.create(0, 2, 0);
    let spotLight2Dir = Vec3.create(0.4, -1, -0.2+m/2).normalize();
    let spotLight2Color = LightColor.create(Rgb.BLACK, Rgb.WHITE, Rgb.WHITE);
    let spotLight2Cone = LightCone.create(FMath.PI/9, FMath.PI/6);
    let spotLight2ShadowMap = ShadowMap.createSpot(this.shadow3, spotLight2Pos, spotLight2Dir, spotLight2Cone.getOutTheta(), 1, 8);
    let spotLight2 = Light.spotQuadratic(spotLight2Color, spotLight2Pos, spotLight2Dir, 8, spotLight2Cone, spotLight2ShadowMap);
    let smapRndr = null;
    if (dirLightEnabled) {
      smapRndr = gDriver.startRenderer("ShadowMapRenderer", ShadowMapEnvironment.create(dirLight));
      smapRndr.render(this.box, Mat44.trans(0, -1, 0).mul(Mat44.scale(20, 1, 20)));
      smapRndr.render(this.box, Mat44.trans(-3, 0, 3));
      smapRndr.render(this.box, Mat44.trans(0, 0, 3));
      smapRndr.render(this.box, Mat44.trans(3, 0, 3));
      smapRndr.render(this.box, Mat44.trans(-3, 0, 0));
      smapRndr.render(this.box, Mat44.trans(0, 0, 0));
      smapRndr.render(this.box, Mat44.trans(3, 0, 0));
      smapRndr.render(this.box, Mat44.trans(-3, 0, -3));
      smapRndr.render(this.box, Mat44.trans(0, 0, -3));
      smapRndr.render(this.box, Mat44.trans(3, 0, -3));
      smapRndr.end();
    }
    if (spotLight1Enabled) {
      smapRndr = gDriver.startRenderer("ShadowMapRenderer", ShadowMapEnvironment.create(spotLight1));
      smapRndr.render(this.box, Mat44.trans(0, -1, 0).mul(Mat44.scale(20, 1, 20)));
      smapRndr.render(this.box, Mat44.trans(-3, 0, 3));
      smapRndr.render(this.box, Mat44.trans(0, 0, 3));
      smapRndr.render(this.box, Mat44.trans(3, 0, 3));
      smapRndr.render(this.box, Mat44.trans(-3, 0, 0));
      smapRndr.render(this.box, Mat44.trans(0, 0, 0));
      smapRndr.render(this.box, Mat44.trans(3, 0, 0));
      smapRndr.render(this.box, Mat44.trans(-3, 0, -3));
      smapRndr.render(this.box, Mat44.trans(0, 0, -3));
      smapRndr.render(this.box, Mat44.trans(3, 0, -3));
      smapRndr.end();
    }
    if (spotLight2Enabled) {
      smapRndr = gDriver.startRenderer("ShadowMapRenderer", ShadowMapEnvironment.create(spotLight2));
      smapRndr.render(this.box, Mat44.trans(0, -1, 0).mul(Mat44.scale(20, 1, 20)));
      smapRndr.render(this.box, Mat44.trans(-3, 0, 3));
      smapRndr.render(this.box, Mat44.trans(0, 0, 3));
      smapRndr.render(this.box, Mat44.trans(3, 0, 3));
      smapRndr.render(this.box, Mat44.trans(-3, 0, 0));
      smapRndr.render(this.box, Mat44.trans(0, 0, 0));
      smapRndr.render(this.box, Mat44.trans(3, 0, 0));
      smapRndr.render(this.box, Mat44.trans(-3, 0, -3));
      smapRndr.render(this.box, Mat44.trans(0, 0, -3));
      smapRndr.render(this.box, Mat44.trans(3, 0, -3));
      smapRndr.end();
    }
    gDriver.clearBuffers(BufferId.COLOR, BufferId.DEPTH);
    let lights = new ArrayList();
    if (dirLightEnabled) {
      lights.add(dirLight);
    }
    if (spotLight1Enabled) {
      lights.add(spotLight1);
    }
    if (spotLight2Enabled) {
      lights.add(spotLight2);
    }
    let objRnderer = gDriver.startRenderer("SceneRenderer", SceneEnvironment.create(cam, lights));
    objRnderer.render(this.box, Mat44.trans(0, -1, 0).mul(Mat44.scale(20, 1, 20)), Material.WHITE_PLASTIC.withAmbient(Rgb.gray(0.3)));
    objRnderer.render(this.box, Mat44.trans(-3, 0, 3), Material.GOLD);
    objRnderer.render(this.box, Mat44.trans(0, 0, 3), Material.SILVER);
    objRnderer.render(this.box, Mat44.trans(3, 0, 3), Material.COPPER);
    objRnderer.render(this.box, Mat44.trans(-3, 0, 0), Material.GOLD);
    objRnderer.render(this.box, Mat44.trans(0, 0, 0), Material.SILVER);
    objRnderer.render(this.box, Mat44.trans(3, 0, 0), Material.COPPER);
    objRnderer.render(this.box, Mat44.trans(-3, 0, -3), Material.GOLD);
    objRnderer.render(this.box, Mat44.trans(0, 0, -3), Material.SILVER);
    objRnderer.render(this.box, Mat44.trans(3, 0, -3), Material.WHITE_PLASTIC);
    objRnderer.end();
    let crndr = gDriver.startRenderer("ColorRenderer", BasicEnvironment.create(cam));
    crndr.render(this.whiteBox, Mat44.trans(spotLight1.getPos()).mul(Mat44.scale(0.05)));
    crndr.render(this.whiteBox, Mat44.trans(spotLight2.getPos()).mul(Mat44.scale(0.05)));
    crndr.end();
  }

  init(drivers, properties) {
    let assets = drivers.getDriver("AssetManager");
    assets.put(this.box, BoxMeshFactory.fabricBox());
    assets.put(this.whiteBox, BoxMeshFactory.rgbBox(1, 1, 1));
    assets.put(this.shadow1, ShadowBuffer.create(1024, 1024));
    assets.put(this.shadow2, ShadowBuffer.create(1024, 1024));
    assets.put(this.shadow3, ShadowBuffer.create(1024, 1024));
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
            drivers.displayDriver.onDisplayResize(viewport.getSize());
            drivers.touchDriver.onAreaSizeChange(viewport.getSize());
        }
    }
}

/**
 * Toggles fullscreen.
 */
function toggleFullscreen() {
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
 * Handles touch start.
 * 
 * @param {TouchEvent} evt event
 */
function handleTouchStart(evt) {
    evt.preventDefault();
    console.log("touchstart.");
    /*const el = document.getElementById("canvas");
     const ctx = el.getContext("2d");
     const touches = evt.changedTouches;
     
     for (let i = 0; i < touches.length; i++) {
     const touch = touches[i];
     log(`touchstart: ${i}.`);
     ongoingTouches.push(copyTouch(touch));
     const color = colorForTouch(touch);
     log(`color of touch with id ${touch.identifier} = ${color}`);
     ctx.beginPath();
     ctx.arc(touch.pageX, touch.pageY, 4, 0, 2 * Math.PI, false); // a circle at the start
     ctx.fillStyle = color;
     ctx.fill();
     }*/
}

/**
 * Handles touch move.
 * 
 * @param {TouchEvent} evt event
 */
function handleTouchMove(evt) {
    evt.preventDefault();
    console.log("touchmove.");
    /*
     const el = document.getElementById("canvas");
     const ctx = el.getContext("2d");
     const touches = evt.changedTouches;
     
     for (const touch of touches) {
     const color = colorForTouch(touch);
     const idx = ongoingTouchIndexById(touch.identifier);
     
     if (idx >= 0) {
     log(`continuing touch ${idx}`);
     ctx.beginPath();
     log(
     `ctx.moveTo( ${ongoingTouches[idx].pageX}, ${ongoingTouches[idx].pageY} );`,
     );
     ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
     log(`ctx.lineTo( ${touch.pageX}, ${touch.pageY} );`);
     ctx.lineTo(touch.pageX, touch.pageY);
     ctx.lineWidth = 4;
     ctx.strokeStyle = color;
     ctx.stroke();
     
     ongoingTouches.splice(idx, 1, copyTouch(touch)); // swap in the new touch record
     } else {
     log("can't figure out which touch to continue");
     }
     }
     */
}

/**
 * Handles touch cancel.
 * 
 * @param {TouchEvent} evt event
 */
function handleTouchCancel(evt) {
    evt.preventDefault();
    console.log("touchcancel.");
    /*
     const touches = evt.changedTouches;
     
     for (const touch of touches) {
     let idx = ongoingTouchIndexById(touches[i].identifier);
     ongoingTouches.splice(idx, 1); // remove it; we're done
     }
     */
}

/**
 * Handles touch move.
 * 
 * @param {TouchEvent} evt event
 */
function handleTouchEnd(evt) {
    evt.preventDefault();
    console.log("touchend");
    /*
     const el = document.getElementById("canvas");
     const ctx = el.getContext("2d");
     const touches = evt.changedTouches;
     
     for (const touch of touches) {
     const color = colorForTouch(touch);
     let idx = ongoingTouchIndexById(touch.identifier);
     
     if (idx >= 0) {
     ctx.lineWidth = 4;
     ctx.fillStyle = color;
     ctx.beginPath();
     ctx.moveTo(ongoingTouches[idx].pageX, ongoingTouches[idx].pageY);
     ctx.lineTo(touch.pageX, touch.pageY);
     ctx.fillRect(touch.pageX - 4, touch.pageY - 4, 8, 8); // and a square at the end
     ongoingTouches.splice(idx, 1); // remove it; we're done
     } else {
     log("can't figure out which touch to end");
     }
     }
     */
}

/**
 * Handles mouse down.
 * 
 * @param {MouseEvent} evt event
 */
function handleMouseDown(evt) {
    evt.preventDefault();
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    const x = evt.x - rect.left;
    const y = evt.y - rect.top;
    drivers.touchDriver.onMouseDown(x, y);
    //console.log("mouse down.");
}

/**
 * Handles mouse move.
 * 
 * @param {MouseEvent} evt event
 */
function handleMouseMove(evt) {
    evt.preventDefault();
    if (mouseDown) {
        const rect = canvas.getBoundingClientRect();
        const x = evt.x - rect.left;
        const y = evt.y - rect.top;
        drivers.touchDriver.onMouseDragged(x, y);
        mouseLastDragX = x;
        mouseLastDragY = y;
        //console.log("mouse move. " + x + " - " + y);
    }
}

/**
 * Handles mouse leave.
 * 
 * @param {TouchEvent} evt event
 */
function handleMouseLeave(evt) {
    evt.preventDefault();
    mouseDown = false;
    drivers.touchDriver.onMouseDragged(mouseLastDragX, mouseLastDragY, false);
    //console.log("mouse leave");
}

/**
 * Handles mouse up.
 * 
 * @param {MouseEvent} evt event
 */
function handleMouseUp(evt) {
    evt.preventDefault();
    mouseDown = false;
    const rect = canvas.getBoundingClientRect();
    const x = evt.x - rect.left;
    const y = evt.y - rect.top;
    drivers.touchDriver.onMouseUp(x, y, true);
    mouseLastDragX = x;
    mouseLastDragY = y;
    //console.log("mouse up");
}


/**
 * Initializes the web gl.
 */
function initWebGl() {
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
    canvas = document.getElementById('glCanvas');
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
    tyracornApp = new BasicApp05();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchcancel", handleTouchCancel);
    canvas.addEventListener("touchend", handleTouchEnd);

    appLoadingFutures = tyracornApp.init(drivers, new HashMap());
    if (appLoadingFutures.isEmpty()) {
        drivers.getDriver("AssetManager").syncToDrivers();
    }
    appLoop();
}


// -------------------------------------
// Start the app when the page loads
// -------------------------------------
window.addEventListener('load', main); 