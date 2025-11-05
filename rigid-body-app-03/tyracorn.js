"use strict";
// -------------------------------------
// Global variables
// -------------------------------------
let gl;
let tyracornApp;
let drivers;
let appLoadingFutures;  // List<Future<?>>
let time = 0.0;
const baseUrl = ".";
const localStoragePrefix = "rigid-body-app-03.";
let mouseDown = false;
let mouseLastDragX = 0;
let mouseLastDragY = 0;
let canvas;
const classRegistry = {};
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

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

    static notEmptyStringCollection() {
    }

}
// -------------------------------------
// Float
// -------------------------------------

class Float {
    static POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
    static NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;

    static isInfinite(a) {
        return !Number.isFinite(a);
    }
    
    static valueOf(str) {
        return Number.parseFloat(str);
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
        if (arguments.length > 1) {
            throw new Error("only single argument is supported, namely 'add(index, element)' overload is not supported");
        }
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
        this.mSize = 0;
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
        this.mSize++;

        // Resize if load factor exceeded
        if (this.mSize > this.capacity * this.loadFactor) {
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
                this.mSize--;
                return true; // Element was removed
            }
        }
        return false; // Element was not found
    }

    // Check if set is empty
    isEmpty() {
        return this.mSize === 0;
    }

    // Get current size
    size() {
        return this.mSize;
    }

    // Clear all elements
    clear() {
        this.buckets = new Array(this.capacity).fill(null).map(() => []);
        this.mSize = 0;
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
        this.mSize = 0;
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
        
        if (this.mSize !== other.mSize) {
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
    
    /**
     * Checks if two elements are equal. If "equals" method exists,
     * then it is used to determine equality. If not, then falls back to the equality for primitives.
     * 
     * @param {Any} element1 element 1
     * @param {Any} element2 element 2
     * @returns {Boolean} true if both elements are equal, false otherwise
     */
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
    
    put(key, value) {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        // Check if key already exists
        for (let i = 0; i < bucket.length; i++) {
            if (this.elementsEqual(bucket[i][0], key)) {
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
            if (this.elementsEqual(bucket[i][0], key)) {
                return bucket[i][1];
            }
        }
        return null;
    }

    getOrDefault(key, def) {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (this.elementsEqual(bucket[i][0], key)) {
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
            if (this.elementsEqual(bucket[i][0], key)) {
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

    // Check if value exists
    containsValue(value) {
        for (const bucket of this.buckets) {
            for (const [k, v] of bucket) {
                if (this.elementsEqual(v, value)) {
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
        const res = new HashSet();
        for (const bucket of this.buckets) {
            for (const [key, value] of bucket) {
                res.add(key);
            }
        }
        return res;
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
                if (otherValue === null || !this.elementsEqual(value, otherValue)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Checks if two elements are equal. If "equals" method exists,
     * then it is used to determine equality. If not, then falls back to the equality for primitives.
     * 
     * @param {Any} element1 element 1
     * @param {Any} element2 element 2
     * @returns {Boolean} true if both elements are equal, false otherwise
     */
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

}
/**
 * Floating point math utilities.
 * This is wrapper to match the java implementatino.
 */
class FMath {
    static E = Math.E;
    static PI = Math.PI;
    static PI_HALF = Math.PI / 2;
    static PI_THIRD = Math.PI / 3;
    static PI_QUARTER = Math.PI / 4;

    static trunc(a) {
        return Math.trunc(a);
    }

    static min(a, b) {
        return Math.min(a, b);
    }

    static max(a, b) {
        return Math.max(a, b);
    }

    static clamp(x, min, max) {
        return Math.max(min, Math.min(max, x));
    }

    static signum(x) {
        return Math.sign(x);
    }

    static abs(a) {
        return Math.abs(a);
    }

    static sin(x) {
        return Math.sin(x);
    }

    static asin(x) {
        return Math.asin(x);
    }

    static cos(x) {
        return Math.cos(x);
    }

    static acos(x) {
        return Math.acos(x);
    }

    static tan(x) {
        return Math.tan(x);
    }

    static atan2(y, x) {
        return Math.atan2(y, x);
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
        if (str === null || str === undefined) {
            return '';
        }
        return str.toString().trim();
    }

    /**
     * Returns whether string is empty.
     * 
     * @param {String} str tested string
     * @returns {boolean} whether string is empty
     */
    static isEmpty(str) {
        if (str === null || str === undefined) {
            return true;
        }
        return str.length === 0;
    }

    /**
     * Returns whether string is not empty.
     * 
     * @param {String} str tested string
     * @returns {boolean} whether string is not empty
     */
    static isNotEmpty(str) {
        if (str === null || str === undefined) {
            return false;
        }
        return str.length > 0;
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
     * Placeholder for unmodifiable list.
     * 
     * @param {ArrayList} list input list
     * @returns {ArrayList} unmodifiable list
     */
    static unmodifiableList(list) {
        return list;
    }

    /**
     * Returns list with one item.
     * 
     * @param {Any} item
     * @returns {ArrayList} list with one item
     */
    static singletonList(item) {
        const res = new ArrayList();
        res.add(item);
        return res;
    }

    /**
     * Returns empty set.
     * 
     * @returns {HashSet} empty set
     */
    static emptySet() {
        let res = new HashSet();
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
     * @param {HashMap} map input map
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
        if (arguments.length === 1 && Array.isArray(arguments[0])) {
            const arr = arguments[0];
            for (let arg = 0; arg < arr.length; ++arg) {
                res.add(arr[arg]);
            }
        } else {
            for (let arg = 0; arg < arguments.length; ++arg) {
                res.add(arguments[arg]);
            }
        }
        return res;
    }

    static immutableList() {
        let res = new ArrayList();
        if (arguments.length === 1 && Array.isArray(arguments[0])) {
            const arr = arguments[0];
            for (let arg = 0; arg < arr.length; ++arg) {
                res.add(arr[arg]);
            }
        } else {
            for (let arg = 0; arg < arguments.length; ++arg) {
                res.add(arguments[arg]);
            }
        }
        return res;
    }

    static copyList(collection) {
        let res = new ArrayList();
        res.addAll(collection);
        return res;
    }

    static copyImmutableList(list) {
        let res = new ArrayList();
        for (let item of list) {
            res.add(item);
        }
        return res;
    }

    static immutableListPlusItem(collection, item) {
        let res = new ArrayList();
        res.addAll(collection);
        res.add(item);
        return res;
    }

    static immutableListPlusItems(collection, plusItems) {
        let res = new ArrayList();
        res.addAll(collection);
        res.addAll(plusItems);
        return res;
    }

    static set() {
        let res = new HashSet();
        if (arguments.length === 1 && Array.isArray(arguments[0])) {
            const arr = arguments[0];
            for (let arg = 0; arg < arr.length; ++arg) {
                res.add(arr[arg]);
            }
        } else {
            for (let arg = 0; arg < arguments.length; ++arg) {
                res.add(arguments[arg]);
            }
        }
        return res;
    }

    static immutableSet() {
        let res = new HashSet();
        if (arguments.length === 1 && Array.isArray(arguments[0])) {
            const arr = arguments[0];
            for (let arg = 0; arg < arr.length; ++arg) {
                res.add(arr[arg]);
            }
        } else {
            for (let arg = 0; arg < arguments.length; ++arg) {
                res.add(arguments[arg]);
            }
        }
        return res;
    }

    static copySet(collection) {
        let res = new HashSet();
        res.addAll(collection);
        return res;
    }

    static copyImmutableSet(collection) {
        let res = new HashSet();
        res.addAll(collection);
        return res;
    }

    static map() {
        let res = new HashMap();
        for (let arg = 0; arg < arguments.length; arg = arg + 2) {
            res.put(arguments[arg], arguments[arg + 1]);
        }
        return res;
    }

    static immutableMap() {
        let res = new HashMap();
        for (let arg = 0; arg < arguments.length; arg = arg + 2) {
            res.put(arguments[arg], arguments[arg + 1]);
        }
        return res;
    }

    static copyMap(map) {
        let res = new HashMap();
        if (map === null || map === undefined) {
            return res;
        }
        res.putAll(map);
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

    /**
     * Returns string representation of this object, dumping all fields.
     * This method uses reflection and makes the private fields accessible.
     *
     * @param {Any} obj object
     * @return {String} string representation
     */
    static reflectionToString(obj) {
        return "<placeholder>";
    }

}
/**
 * Utility class for formatting various things to string.
 *
 * @author radek.hecl
 */
class Formats {

    /**
     * Formats float number to fixed decimals.
     *
     * @param {Number} x number to format (float)
     * @param {Number} numDecimals number of decimals (integer)
     * @return {String} returned string
     */
    static floatToFixedDecimals(x, numDecimals) {
        return "" + x.toFixed(numDecimals);
    }

    /**
     * Parses boolean.
     *
     * @param {String} str string
     * @return {Boolean} boolean value
     */
    static parseBoolean(str) {
        if (str === "true") {
            return true;
        } else if (str === "false") {
            return false;
        } else {
            throw new Error("unknown value for boolean: " + str);
        }
    }

    /**
     * Parses integer.
     *
     * @param {String} str string
     * @return {Number} integer value
     */
    static parseInt(str) {
        return parseInt(str, 10);
    }

    /**
     * Parses float.
     *
     * @param {String} str string
     * @return {umber} float value
     */
    static parseFloat(str) {
        return parseFloat(str);
    }

}
/**
 * Utility class for producing the random numbers.
 *
 * @author radek.hecl
 */
class Randoms {

    /**
     * Returns a random integer within the specified range.
     *
     * @param {Number} start start number (inclusive)
     * @param {Number} end end number (exclusive)
     * @return {Number} random number
     */
    static nextInt(start, end) {
        return Math.floor(Math.random() * (end - start)) + start;
    }

    /**
     * Returns a random float within the specified range.
     *
     * @param {Number} start start number (inclusive)
     * @param {Number} end end number (exclusive)
     * @return {Number} random number
     */
    static nextFloat(start, end) {
        const rnd = Math.random();
        return rnd * (end - start) + start;
    }

    /**
     * Creates Random alphabetic string.
     *
     * @param {Number} count number of characters
     * @return {String} created string
     */
    static nextAlphabetic(count) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let res = '';
        for (let i = 0; i < count; i++) {
            res += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return res;
    }

}
/**
 * Utility class for working with reflections.
 *
 * @author radek.hecl
 */
class Reflections {

    /**
     * Creates class from the class.
     * This method looks for no arguments constructor or no arguments static method called create.
     *
     * @param {String} className class name
     * @return {Object} created instance
     */
    static createClass(className) {
        const parts = className.split('.');
        const pureClassName = parts[parts.length - 1];
        const clazz = classRegistry[pureClassName];
        if (!clazz) {
            throw new Error("class not found: " + className + " (i.e. " + pureClassName + ")");
        }
        if (typeof clazz.create === 'function') {
            return clazz.create();
        }
        return new clazz();
    }

    /**
     * Call the specified method if exits.
     * If object doesn't have the method, then does nothing.
     *
     * @param {Object} obj object to call method on
     * @param {String} methodName method name
     * @param {Object} param parameter passed to the method
     */
    static callInstanceMethodIfExists(obj, methodName, param) {
        if (typeof obj[methodName] === 'function') {
            obj[methodName](param);
        }
    }

}
/**
 * Id generator which produces ids in the sequence.
 *
 * @author radek.hecl
 */
class SequenceIdGenerator {

    /**
     * Prefix.
     */
    prefix;

    /**
     * Next number.
     */
    next = 1;

    /**
     * Creates new instance.
     */
    constructor() {
    }

    /**
     * Guards this object to be consistent. Throws exception if this is not the case.
     */
    guardInvariants() {
        Guard.notNull(this.prefix, "prefix cannot be null");
    }

    /**
     * Generates next id.
     * 
     * @return {String} id
     */
    generateId() {
        const res = this.prefix + this.next;
        ++this.next;
        return res;
    }

    toString() {
        return "SequenceIdGenerator"
    }

    /**
     * Creates new instance.
     *
     * @param {String|null} prefix prefix
     * @return {SequenceIdGenerator} created instance
     */
    static create(prefix) {
        const res = new SequenceIdGenerator();
        if (prefix === null || prefix === undefined) {
            res.prefix = "";
        } else {
            res.prefix = prefix;
        }
        res.guardInvariants();
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

    /**
     * Runs runnable.
     *
     * @param {Runnable} action runnable action to run
     */
    static runRunnable(action) {
        action();
    }

    /**
     * Returns whether the key matchers the matcher.
     *
     * @param {KeyCodeMatcher} matcher matcher to use
     * @param {KeyCode} keyCode key code
     * @return {Boolean} whether key code matches or not
     */
    static keyCodeMatches(matcher, keyCode) {
        return matcher(keyCode);
    }

    /**
     * Runs UI event action.
     * 
     * @param {UiEventAction} eventAction event action
     * @param {UiComponent} source source of the event
     */
    static runUiEventAction(eventAction, source) {
        eventAction(source);
    }

    /**
     * Runs actor action.
     *
     * @param {ActorAction} action action to run
     * @param {Actor} actor actor to run function on
     */
    static runActorAction(action, actor) {
        action(actor);
    }

}
/**
 * String builder.
 * 
 * @type StringBuilder
 */
class StringBuilder {
    res = "";

    /**
     * Creates nre instance.
     * 
     * @returns {StringBuilder} created instance
     */
    constructor() {
    }

    /**
     * Appends to the end.
     * 
     * @param {String} str string to append
     * @returns {StringBuilder} this instance
     */
    append(str) {
        this.res = this.res + str;
        return this;
    }

    /**
     * Return the string result.
     * 
     * @returns {String} result string
     */
    toString() {
        return this.res;
    }

}
/**
 * Utility class for working with json.
 *
 * @author radek.hecl
 */
class Jsons {

    /**
     * Decodes string map from the JSON string.
     *
     * @param {String} str input data in the {"hello" : "world", "hey" : "baby"} format
     * @return {HashMap} decoded map of String to String
     */
    static toStringMap(str) {
        const obj = JSON.parse(str);
        const res = new HashMap();
        for (const key in obj) {
            res.put(key, obj[key]);
        }
        return res;
    }

    /**
     * Decodes string list from the JSON string.
     *
     * @param {String} str data in the ["hello", "baby"] format
     * @return {ArrayList} decoded list of strings
     */
    static toStringList(str) {
        const items = JSON.parse(str);
        const res = new ArrayList();
        for (let i = 0; i < items.length; ++i) {
            res.add(items[i]);
        }
        return res;
    }

    /**
     * Decodes float list from the JSON string.
     *
     * @param {String} str data in the [1, 2, 3] format
     * @return {ArrayList} decoded list of floats
     */
    static toFloatList(str) {
        const items = JSON.parse(str);
        const res = new ArrayList();
        for (let i = 0; i < items.length; ++i) {
            res.add(items[i]);
        }
        return res;
    }

    /**
     * Converts JSON string to vector.
     *
     * @param {String} input input string
     * @return {Vec3} vector
     */
    static toVec3(input) {
        const fs = Jsons.toFloatList(input);
        return Vec3.create(fs.get(0), fs.get(1), fs.get(2));
    }

    /**
     * Converts JSON string to vector.
     *
     * @param {String} input input string
     * @return {Vec4} vector
     */
    static toVec4(input) {
        const fs = Jsons.toFloatList(input);
        return Vec4.create(fs.get(0), fs.get(1), fs.get(2), fs.get(3));
    }

    /**
     * Converts JSON string to quaternion.
     *
     * @param {String} input input string
     * @return {Quaternion} quaternion
     */
    static toQuaternion(input) {
        const fs = Jsons.toFloatList(input);
        return Quaternion.create(fs.get(0), fs.get(1), fs.get(2), fs.get(3));
    }

    /**
     * Converts JSON string to boundary.
     *
     * @param {String} input input string
     * @return {Aabb3} boundary
     */
    static toAabb3(input) {
        const fs = Jsons.toFloatList(input);
        return Aabb3.create(fs.get(0), fs.get(1), fs.get(2), fs.get(3), fs.get(4), fs.get(5));
    }

    /**
     * Converts JSON string to matrix.
     *
     * @param {String} input input string
     * @return {Mat33} matrix
     */
    static toMat33(input) {
        const fs = Jsons.toFloatList(input);
        return Mat33.create(
                fs.get(0), fs.get(1), fs.get(2),
                fs.get(3), fs.get(4), fs.get(5),
                fs.get(6), fs.get(7), fs.get(8));
    }

    /**
     * Converts JSON string to matrix.
     *
     * @param {String} input input string
     * @return {Mat44} matrix
     */
    static toMat44(input) {
        const fs = Jsons.toFloatList(input);
        return Mat44.create(
                fs.get(0), fs.get(1), fs.get(2), fs.get(3),
                fs.get(4), fs.get(5), fs.get(6), fs.get(7),
                fs.get(8), fs.get(9), fs.get(10), fs.get(11),
                fs.get(12), fs.get(13), fs.get(14), fs.get(15));
    }

    /**
     * Converts JSON string to RGB.
     *
     * @param {String} input input string
     * @return {Rgb} RGB color
     */
    static toRgb(input) {
        const fs = Jsons.toFloatList(input);
        return Rgb.create(fs.get(0), fs.get(1), fs.get(2));
    }

    /**
     * Converts JSON string to interpolatino.
     *
     * @param {String} input input string
     * @return {Interpolation} interpolation color
     */
    static toInterpolation(input) {
        const items = JSON.parse(input);
        return Interpolation.create(items[0], items[1], items[2]);
    }

}
/**
 * Utility class for working with json objects.
 *
 * @author radek.hecl
 */
class JsonObjects {

    /**
     * Converts JSON object to string.
     *
     * @param {JsonObject} obj json object
     * @return {String} string value
     */
    static toJson(obj) {
        const res = JsonObjects.toPlainJsonObject(obj);
        return JSON.stringify(res);
    }

    /**
     * Parses string to the json object.
     *
     * @param {String} str string that must be a representation of json object
     * @return {JsonObject} parsed JSON object
     */
    static parse(str) {
        const ojo = JSON.parse(str);
        return JsonObjects.fromPlainJsonObject(ojo);
    }

    /**
     * Converts org json object into a json object.
     *
     * @param {Object} ojo org json object
     * @return {JsonObject} json object
     */
    static fromPlainJsonObject(ojo) {
        let res = JsonObject.empty();
        for (let key in ojo) {
            const obj = ojo[key];
            if (typeof obj === 'boolean') {
                res = res.withBoolean(key, obj);
            } else if (typeof obj === 'number') {
                res = res.withFloat(key, obj);
            } else if (typeof obj === 'string') {
                res = res.withString(key, obj);
            } else if (Array.isArray(obj)) {
                res = res.withArray(key, JsonObjects.fromPlainJsonArray(obj));
            } else if (typeof obj === 'object') {
                res = res.withObject(key, JsonObjects.fromPlainJsonObject(obj));
            } else {
                throw new Error("unsuppoorted class");
            }
        }
        return res;
    }

    /**
     * Converts org json array into a json array.
     *
     * @param {Array} oja org json array
     * @return {JsonArray} json array
     */
    static fromPlainJsonArray(oja) {
        let res = JsonArray.empty();
        for (let i = 0; i < oja.length; ++i) {
            const obj = oja[i];
            if (typeof obj === 'boolean') {
                res = res.plusBoolean(obj);
            } else if (typeof obj === 'number') {
                res = res.plusFloat(obj);
            } else if (typeof obj === 'string') {
                res = res.plusString(obj);
            } else if (Array.isArray(obj)) {
                res = res.plusArray(JsonObjects.fromPlainJsonArray(obj));
            } else if (typeof obj === 'object') {
                res = res.plusObject(JsonObjects.fromPlainJsonObject(obj));
            } else {
                throw new Error("unsuppoorted class");
            }
        }
        return res;
    }

    /**
     * Converts object to org json object.
     *
     * @param {JsonObject} obj object
     * @return {Object} org json object
     */
    static toPlainJsonObject(obj) {
        const res = {};
        for (let key of obj.keySet()) {
            const val = obj.get(key);
            if (val instanceof JsonObject) {
                res[key] = JsonObjects.toPlainJsonObject(val);
            } else if (val instanceof JsonArray) {
                res[key] = JsonObjects.toPlainJsonArray(val);
            } else {
                res[key] = val;
            }
        }
        return res;
    }

    /**
     * Converts object to org json array.
     *
     * @param {JsonArray} arr array
     * @return {Array} org json array
     */
    static toPlainJsonArray(arr) {
        const res = [];
        for (let i = 0; i < arr.size(); ++i) {
            const val = arr.get(i);
            if (val instanceof JsonObject) {
                res.push(JsonObjects.toPlainJsonObject(val));
            } else if (val instanceof JsonArray) {
                res.push(JsonObjects.toPlainJsonArray(val));
            } else {
                res.push(val);
            }
        }
        return res;
    }

}
/**
 * Web platform driver.
 *
 * @author radek.hecl
 */
class WebPlatformDriver {

    /**
     * Creates new instance.
     */
    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
    }

    /**
     * Logs the info.
     * 
     * @param {String} str string
     */
    logInfo(str) {
        console.log(str);
    }

    /**
     * Logs the error.
     * 
     * @param {String} str string
     */
    logError(str) {
        console.error(str);
    }

    /**
     * Returns whether application can exit or not.
     *
     * @return {Boolean} whether the is can exit not
     */
    isExitable() {
        return false;
    }

    /**
     * Creates new instance.
     *
     * @return {WebPlatformDriver} created instance
     */
    static create() {
        const res = new WebPlatformDriver();
        res.guardInvariants();
        return res;
    }

}
/**
 * Data block definition.
 */
class DataBlock {
    data;
    view;
    constructor() {
    }

    getClass() {
        return "DataBlock";
    }

    guardInvaritants() {
        Guard.notNull(this.data, "data cannot be null");
        Guard.notNull(this.view, "view cannot be null");
    }

    size() {
        return this.data.byteLength;
    }

    checksum() {
        let res = 0;
        for (let i = 0; i < this.data.length; ++i) {
            res = res + this.data[i];
        }
        return res;
    }

    getByte(pos) {
        return this.view.getInt8(pos);
    }

    getInt(pos) {
        return this.view.getInt32(pos, false); // false = big-endian (java)
    }

    getFloat(pos) {
        return this.view.getFloat32(pos, false); // false = big-endian (java)
    }

    /**
     * Converts this block to the byte array.
     *
     * @return {Array} byte array
     */
    toByteArray() {
        return Arrays.copyOf(this.data, this.data.byteLength);
    }

    /**
     * Converts this block to the int array.
     *
     * @return {Array} int array
     */
    toIntArray() {
        const res = [];
        for (let idx = 0; idx < this.data.byteLength; idx = idx + 4) {
            res.push(this.getInt(idx));
        }
        return res;
    }

    /**
     * Converts this block to the int array.
     *
     * @return {Array} float array
     */
    toFloatArray() {
        const res = [];
        for (let idx = 0; idx < this.data.byteLength; idx = idx + 4) {
            res.push(this.getFloat(idx));
        }
        return res;
    }

    toBase64String() {
        const bytes = new Uint8Array(this.data);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    stream() {
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

    static fromByteArray(bytes) {
        let res = new DataBlock();
        res.data = Arrays.copyOf(bytes, bytes.length);
        res.view = new DataView(res.data);
        res.guardInvaritants();
        return res;
    }

    static fromByteList(bytes) {
        let res = new DataBlock();
        res.data = [];
        for (let i = 0; i < bytes.size(); ++i) {
            res.data[i] = bytes.get(i);
        }
        res.view = new DataView(res.data);
        res.guardInvaritants();
        return res;
    }

    static fromFloatValues(...floats) {
        if (Array.isArray(floats) && floats.length === 1 && Array.isArray(floats[0])) {
            floats = floats[0];
        }
        let res = new DataBlock();
        let writer = DataBlockStreamWriter.create(floats.length * 4);
        for (let f of floats) {
            writer.writeFloat(f);
        }
        res.data = writer.closeAndGet();
        res.view = new DataView(res.data);
        res.guardInvaritants();
        return res;
    }

    static fromFloatList(floats) {
        let res = new DataBlock();
        let writer = DataBlockStreamWriter.create(floats.size() * 4);
        for (let f of floats) {
            writer.writeFloat(f);
        }
        res.data = writer.closeAndGet();
        res.view = new DataView(res.data);
        res.guardInvaritants();
        return res;
    }

    static fromStreamWriter(writer) {
        let res = new DataBlock();
        res.data = writer.closeAndGet();
        res.view = new DataView(res.data);
        res.guardInvaritants();
        return res;
    }

    static fromRandomWriter(writer) {
        let res = new DataBlock();
        res.data = writer.closeAndGet();
        res.view = new DataView(res.data);
        res.guardInvaritants();
        return res;
    }

    static fromBase64String(base64Str) {
        const binaryString = atob(base64Str);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        let res = new DataBlock();
        res.data = bytes.buffer;
        res.view = new DataView(res.data);
        res.guardInvaritants();
        return res;
    }
}
/**
 * Data block stream writer.
 */
class DataBlockStreamWriter {
    data;
    view;
    offset;
    constructor() {
    }

    getClass() {
        return "DataBlockStreamWriter";
    }

    guardInvaritants() {
        Guard.notNull(this.data, "data cannot be null");
        Guard.notNull(this.view, "view cannot be null");
    }

    size() {
        return this.data.byteLength;
    }

    writeByte(x) {
        this.view.setUint8(this.offset, x); // false = big-endian (java)
        this.offset = this.offset + 1;
        return this;
    }

    writeInt(x) {
        this.view.setInt32(this.offset, x, false); // false = big-endian (java)
        this.offset = this.offset + 4;
        return this;
    }

    writeFloat(x) {
        this.view.setFloat32(this.offset, x, false); // false = big-endian (java)
        this.offset = this.offset + 4;
        return this;
    }

    copyBytes(source, sourcePos, size) {
        for (let i = 0; i < size; ++i) {
            this.view.setInt8(this.offset++, source.getByte(sourcePos + i));
        }
        return this;
    }

    toDataBlock() {
        return DataBlock.fromStreamWriter(this);
    }

    closeAndGet() {
        let res = this.data;
        this.data = null;
        return res;
    }

    toString() {
    }

    static create(size) {
        let res = new DataBlockStreamWriter();
        res.data = new ArrayBuffer(size);
        res.view = new DataView(res.data);
        res.offset = 0;
        res.guardInvaritants();
        return res;
    }

}
/**
 * Data block definition.
 */
class DataBlockRandomWriter {
    data;
    view;
    constructor() {
    }

    getClass() {
        return "DataBlockRandomWriter";
    }

    guardInvaritants() {
        Guard.notNull(this.data, "data cannot be null");
        Guard.notNull(this.view, "view cannot be null");
    }

    size() {
        return this.data.byteLength;
    }

    writeFloat(pos, x) {
        this.view.setFloat32(pos, x, false); // false = big-endian (java)
        return this;
    }

    copyBytes(targetPos, source, sourcePos, size) {
        for (let i = 0; i < size; ++i) {
            this.view.setInt8(targetPos + i, source.getByte(sourcePos + i));
        }
        return this;
    }

    toDataBlock() {
        return DataBlock.fromRandomWriter(this);
    }

    closeAndGet() {
        let res = this.data;
        this.data = null;
        return res;
    }

    toString() {
    }

    static create(size) {
        let res = new DataBlockRandomWriter();
        res.data = new ArrayBuffer(size);
        res.view = new DataView(res.data);
        res.guardInvaritants();
        return res;
    }

}
/**
 * Data block definition.
 */
class WebLocalDataStorage {

    prefix
    /**
     * Creates new instance.
     * 
     * @returns {WebLocalDataStorage}
     */
    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvaritants() {
        Guard.notNull(this.prefix, "prefix cannot be null");
    }

    /**
     * Returns whether there is an entry under the given key or not.
     *
     * @param {LocalDataKey} key entry key
     * @return {Boolean} whether there is an entry under the given key or not
     */
    exists(key) {
        const skey = this.prefix + key.key();
        return localStorage.getItem(skey) === null ? false : true;
    }

    /**
     * Loads data block.
     *
     * @param {LocalDataKey} key entry key
     * @return {DataBlock} data block
     */
    loadData(key) {
        const skey = this.prefix + key.key();
        const base64Str = localStorage.getItem(skey);
        if (base64Str === null) {
            throw new Error("key doesn't exists: " + key.key());
        }
        return DataBlock.fromBase64String(base64Str);
    }

    /**
     * Loads data block in a non strict manner.
     *
     * @param {LocalDataKey} key entry key
     * @return {DataBlock} data block or null
     */
    loadDataNonStrict(key) {
        const skey = this.prefix + key.key();
        const base64Str = localStorage.getItem(skey);
        if (base64Str === null) {
            return null;
        }
        return DataBlock.fromBase64String(base64Str);
    }

    /**
     * Saves data.
     *
     * @param {LocalDataKey} key entry key
     * @param {DataBlock} data data block
     */
    saveData(key, data) {
        const skey = this.prefix + key.key();
        localStorage.setItem(skey, data.toBase64String());
    }

    /**
     * Loads string value.
     *
     * @param {LocalDataKey} key entry key
     * @return {String} string value
     */
    loadString(key) {
        const skey = this.prefix + key.key();
        const res = localStorage.getItem(skey);
        if (res === null) {
            throw new Error("key doesn't exists: " + key.key());
        }
        return res;
    }

    /**
     * Loads string value in a non strict manner.
     *
     * @param {LocalDataKey} key entry key
     * @return {String} string value or null
     */
    loadStringNonStrict(key) {
        const skey = this.prefix + key.key();
        return localStorage.getItem(skey);
    }

    /**
     * Saves string value.
     *
     * @param {LocalDataKey} key entry key
     * @param {String} str string value
     */
    saveString(key, str) {
        const skey = this.prefix + key.key();
        localStorage.setItem(skey, str);
    }

    /**
     * Deletes entry from the storage.
     *
     * @param {LocalDataKey} key entry key
     */
    delete(key) {
        const skey = this.prefix + key.key();
        localStorage.removeItem(skey);
    }

    /**
     * Creates new instance.
     * 
     * @param {String} prefix prefix used for local storage
     * @returns {WebLocalDataStorage.create.res}
     */
    static create(prefix) {
        const res = new WebLocalDataStorage();
        res.prefix = prefix;
        res.guardInvaritants();
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

    readBoolean() {
        const res = this.dataView.getInt8(this.offset, false);
        this.offset += 1;
        return res > 0;
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

    /**
     * Reads data block of the given size.
     * The size number of bytes will be consumed.
     *
     * @param {Number} size size of the data block (integer)
     * @return {DataBlock} data block
     */
    readDataBlock(size) {
        const buf = this.dataView.buffer.slice(this.offset, this.offset + size);
        this.offset += size;
        return DataBlock.fromByteArray(buf);
    }

    close() {
        // nothing to do here
    }

    /**
     * Creates new instance.
     * 
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
            } else if (entry.getType().equals(TapEntryType.MATERIAL)) {
                const ag = TapMaterials.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.MESH)) {
                const ag = TapMeshes.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.MODEL)) {
                const ag = TapModels.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.PHYSICAL_MATERIAL)) {
                const ag = TapPhysicalMaterials.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.FONT)) {
                const ag = TapFonts.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.SOUND)) {
                const ag = TapSounds.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.PREFAB)) {
                const ag = TapPrefabs.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.CLIP_ANIMATION_COLLECTION)) {
                const ag = TapClipAnimationCollections.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else if (entry.getType().equals(TapEntryType.SCENE)) {
                const ag = TapScenes.toAssetGroup(entry);
                res = res.mergeStrict(ag);
            } else {
                throw new Error("unsupported entry type: " + entry.getType().toString());
            }
            /*
             else if (entry.getType().equals(TapEntryType.SPRITE)) {
             AssetGroup ag = TapSprites.toAssetGroup(entry);
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

                    // Convert to floating point array (0-1 range)
                    const numChannels = hasAlpha ? 4 : 3;
                    const totalPixels = img.width * img.height;
                    const buf = new ArrayBuffer(totalPixels * numChannels * 4);
                    const view = new DataView(buf);

                    let idx = 0;
                    for (let i = 0; i < pixelData.length; i += 4) {
                        // for all channels - false = big-endian (java)
                        // Red
                        view.setFloat32(idx, pixelData[i] / 255.0, false);
                        idx = idx + 4;
                        // Green
                        view.setFloat32(idx, pixelData[i + 1] / 255.0, false);
                        idx = idx + 4;
                        // Blue
                        view.setFloat32(idx, pixelData[i + 2] / 255.0, false);
                        idx = idx + 4;
                        // Alpha (only if image has transparency)
                        if (hasAlpha) {
                            view.setFloat32(idx, pixelData[i + 3] / 255.0, false);
                            idx = idx + 4;
                        }
                    }
                    let texture = hasAlpha ? Texture.create(TextureFormat.FLOAT, Texture.RGBA, img.width, img.height, DataBlock.fromByteArray(buf)) :
                            Texture.create(TextureFormat.FLOAT, Texture.RGB, img.width, img.height, DataBlock.fromByteArray(buf));
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
        } else if (path.getExtension().equals("png")) {
            let tid = TextureId.of(path.getPlainName());
            let texture = await this.loader.loadTexture(path);
            ag = ag.put(tid, texture);
        } else {
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
                throw "bank already contains " + key.toString();
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

    putCompanion(key, type, companion) {
        this.bank.putCompanion(key, type, companion);
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

    hasCompanion(key, type) {
        return this.bank.hasCompanion(key, type);
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
            let aabb = mesh.getAabb();
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

}
/**
 * GL mesh reference.
 */
class WebglMeshFrameRef {
    /**
     * Vertex buffer pointer.
     */
    vbo;

    /**
     * List of the vertex attributes.
     */
    vertexAttrs;

    /**
     * Vertex size.
     */
    vertexSize;
    constructor() {
    }

    guardInvariants() {
        Guard.notNullCollection(this.vertexAttrs, "vertexAttrs cannot have null element");
    }

    /**
     * Returns vertex buffer pointer.
     *
     * @return {Number} vertex buffer pointer (integer)
     */
    getVbo() {
        return this.vbo;
    }

    /**
     * Returns vertex attributes.
     *
     * @return {ArrayList of VertexAttr} vertex attributes
     */
    getVertexAttrs() {
        return this.vertexAttrs;
    }

    /**
     * Returns vertex size.
     *
     * @return (Number} vertex size (integer)
     */
    getVertexSize() {
        return this.vertexSize;
    }

    toString() {
    }

    /**
     * Creates new instance.
     *
     * @param {Number} vbo vertex buffer pointer (integer)
     * @param {List of VertexAttr} vertexAttrs vertex attributes
     * @return {WebglMeshFrameRef} created object
     */
    static create(vbo, vertexAttrs) {
        const res = new WebglMeshFrameRef();
        res.vbo = vbo;
        res.vertexAttrs = Dut.copyImmutableList(vertexAttrs);
        res.vertexSize = 0;
        for (let va of vertexAttrs) {
            res.vertexSize = res.vertexSize + va.getSize();
        }
        res.guardInvariants();
        return res;
    }

}

/**
 * GL mesh reference.
 */
class WebglMeshRef {
    /**
     * Vertex array object (integer).
     */
    vao;

    /**
     * Element buffer pointer (integer).
     */
    ebo;

    /**
     * Number of indices (integer).
     */
    numIndices;

    /**
     * Frames (ArrayList of JoglMeshFrameRef).
     */
    frames;

    /**
     * Creates new instance.
     */
    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        Guard.notNullCollection(this.frames, "frames cannot have null element");
        Guard.positive(this.frames.size(), "at least 1 frame is required");
    }

    /**
     * Returns vertex array pointer.
     *
     * @return {Number} vertex array pointer (integer)
     */
    getVao() {
        return this.vao;
    }

    /**
     * Returns element buffer pointer.
     *
     * @return {Number} element buffer pointer (integer)
     */
    getEbo() {
        return this.ebo;
    }

    /**
     * Returns number of indices.
     *
     * @return {Number} number of indices (integer)
     */
    getNumIndices() {
        return this.numIndices;
    }

    /**
     * Returns frames.
     *
     * @return {ArrayList of JoglMeshFrameRef} frames
     */
    getFrames() {
        return this.frames;
    }

    /**
     * Returns number of frames.
     *
     * @return {Number} number of frames (integer)
     */
    getNumFrames() {
        return this.frames.size();
    }

    toString() {
    }

    /**
     * Creates new instance.
     *
     * @param {Number} vao vertex array pointer (integer)
     * @param {Number} ebo element buffer pointer (integer)
     * @param {Number} numIndices number of indices (integer)
     * @param {ArrayList of JoglMeshFrameRef} frames frames
     * @return {WebglMeshRef} created object
     */
    static create(vao, ebo, numIndices, frames) {
        const res = new WebglMeshRef();
        res.vao = vao;
        res.ebo = ebo;
        res.numIndices = numIndices;
        res.frames = Dut.copyImmutableList(frames);
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
     * @param {Interpolation} interpolation mesh interpolation
     * @param {Mat44} mat transformation matric
     */
    render(mesh, interpolation, mat) {
        const m = this.refProvider.getMeshRef(mesh);

        if (m.getFrames().get(0).getVertexAttrs().equals(Dut.list(VertexAttr.POS3, VertexAttr.RGB))) {
            gl.disable(gl.BLEND);
            this.shader.use();
            this.shader.setUniformMat44("modelMat", mat);
            this.shader.setUniformMat44("viewMat", this.camera.getView());
            this.shader.setUniformMat44("projMat", this.camera.getProj());

            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getFrames().get(0).getVbo());

            // Position attribute (3 floats)
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.enableVertexAttribArray(0);

            // Color attribute (3 floats)
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * 4, 3 * 4);
            gl.enableVertexAttribArray(1);

            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);

        } else {
            throw "unsupported mesh in this method";
        }
    }

    /**
     * Renders a transparent mesh with the given transformation matrix.
     * 
     * @param {MeshId} mesh identifier
     * @param {Interpolation} interpolation mesh interpolation
     * @param {Mat44} mat transformation matric
     * @param {BlendType} blendType blending type
     */
    renderTransparent(mesh, interpolation, mat, blendType) {
        const m = this.refProvider.getMeshRef(mesh);

        if (m.getFrames().get(0).getVertexAttrs().equals(Dut.list(VertexAttr.POS3, VertexAttr.RGBA))) {
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
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getFrames().get(0).getVbo());

            // Position attribute (3 floats)
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 7 * 4, 0);
            gl.enableVertexAttribArray(0);

            // Color attribute (3 floats)
            gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
            gl.enableVertexAttribArray(1);

            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);

        } else {
            throw "unsupported mesh in this method";
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
        this.pos3Norm3VertexAttrs = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3);
        this.pos3Norm3Tex2VertexAttrs = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3, VertexAttr.TEX2);
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
        if (arguments.length === 3 && arguments[0] instanceof Model && arguments[1] instanceof Interpolation &&
                arguments[2] instanceof Mat44) {
            for (const part of arguments[0].getParts()) {
                this.renderMesh(part.getMesh(), arguments[1], arguments[2], part.getMaterial());
            }
        } else if (arguments.length === 4 && arguments[0] instanceof MeshId && arguments[1] instanceof Interpolation &&
                arguments[2] instanceof Mat44 && arguments[3] instanceof MaterialId) {
            this.renderMesh(arguments[0], arguments[1], arguments[2], arguments[3]);
        } else if (arguments.length === 4 && arguments[0] instanceof MeshId && arguments[1] instanceof Interpolation &&
                arguments[2] instanceof Mat44 && arguments[3] instanceof Material) {
            this.renderMesh(arguments[0], arguments[1], arguments[2], arguments[3]);
        } else {
            throw "unsupported arguments for rendering, implement me";
        }
    }

    /**
     * Renders mesh.
     * 
     * @param {MeshId} mesh mesh to render
     * @param {Interpolation} interpolation frame interpolation
     * @param {Mat44} mat matrix
     * @param {Material} material material
     */
    renderMesh(mesh, interpolation, mat, material) {
        if (material instanceof MaterialId) {
            material = this.assetBank.get("Material", material);
        }
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

        if (m.getNumFrames() === 1 && m.getFrames().get(0).getVertexAttrs().equals(this.pos3Norm3VertexAttrs)) {
            this.shader.setUniformFloat("t", 0);
            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getFrames().get(0).getVbo());
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
        } else {
            const frRef1 = m.getFrames().get(interpolation.startIdx());
            const frRef2 = m.getFrames().get(interpolation.endIdx());
            Guard.equals(this.pos3Norm3Tex2VertexAttrs, frRef1.getVertexAttrs(), "frame must have POS3, NORM3, TEX2 vertex attributes: %s", frRef1.getVertexAttrs());
            Guard.equals(this.pos3Norm3Tex2VertexAttrs, frRef2.getVertexAttrs(), "frame must have POS3, NORM3, TEX2 vertex attributes: %s", frRef2.getVertexAttrs());
            this.shader.setUniformFloat("t", interpolation.t());
            const vsize = frRef1.getVertexSize();
            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, frRef1.getVbo());
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, vsize * 4, 0);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(2, 3, gl.FLOAT, false, vsize * 4, 3 * 4);
            gl.enableVertexAttribArray(2);
            gl.bindBuffer(gl.ARRAY_BUFFER, frRef2.getVbo());
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, vsize * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(3, 3, gl.FLOAT, false, vsize * 4, 3 * 4);
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(4, 2, gl.FLOAT, false, vsize * 4, 6 * 4);
            gl.enableVertexAttribArray(4);
            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);
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
        this.pos3Norm3VertexAttrs = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3);
        this.pos3Norm3Tex2VertexAttrs = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3, VertexAttr.TEX2);
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
        if (arguments.length === 3 && arguments[0] instanceof MeshId && arguments[1] instanceof Interpolation &&
                arguments[2] instanceof Mat44) {
            this.renderMesh(arguments[0], arguments[1], arguments[2]);
        } else if (arguments.length === 3 && arguments[0] instanceof Model && arguments[1] instanceof Interpolation &&
                arguments[2] instanceof Mat44) {
            for (const part of arguments[0].getParts()) {
                this.renderMesh(part.getMesh(), arguments[1], arguments[2]);
            }
        } else {
            throw "unsupported arguments for rendering, implement me";
        }
    }

    /**
     * Renders mesh.
     * 
     * @param {MeshId} mesh mesh to render
     * @param {Interpolation} interpolation frame interpolation
     * @param {Mat44} mat matrix
     */
    renderMesh(mesh, interpolation, mat) {
        const m = this.refProvider.getMeshRef(mesh);
        gl.disable(gl.BLEND);
        this.shader.setUniformMat44("modelMat", mat);

        if (m.getNumFrames() === 1 && m.getFrames().get(0).getVertexAttrs().equals(this.pos3Norm3VertexAttrs)) {
            this.shader.setUniformFloat("t", 0);
            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, m.getFrames().get(0).getVbo());
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);
        } else {
            const frRef1 = m.getFrames().get(interpolation.startIdx());
            const frRef2 = m.getFrames().get(interpolation.endIdx());
            Guard.equals(this.pos3Norm3Tex2VertexAttrs, frRef1.getVertexAttrs(), "frame must have POS3, NORM3, TEX2 vertex attributes: %s", frRef1.getVertexAttrs());
            Guard.equals(this.pos3Norm3Tex2VertexAttrs, frRef2.getVertexAttrs(), "frame must have POS3, NORM3, TEX2 vertex attributes: %s", frRef2.getVertexAttrs());
            this.shader.setUniformFloat("t", interpolation.t());
            const vsize = frRef1.getVertexSize();
            gl.bindVertexArray(m.getVao());
            gl.bindBuffer(gl.ARRAY_BUFFER, frRef1.getVbo());
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, vsize * 4, 0);
            gl.enableVertexAttribArray(0);
            gl.bindBuffer(gl.ARRAY_BUFFER, frRef2.getVbo());
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, vsize * 4, 0);
            gl.enableVertexAttribArray(1);
            gl.drawElements(gl.TRIANGLES, m.getNumIndices(), gl.UNSIGNED_INT, 0);
            gl.bindVertexArray(null);
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
    vertBuf = new Float32Array(28);

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
        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteMesh.getFrames().get(0).getVbo());
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * 4, 0);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 3 * 4);
        gl.enableVertexAttribArray(1);
        gl.drawElements(gl.TRIANGLES, this.spriteMesh.getNumIndices(), gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    /**
     * Fills rectangle.
     *
     * @param {Rect2} rect rectangle
     * @param {Rgba} color color
     */
    fillRect(rect, color) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const modelMat = Mat44.create(
                2 * rect.width(), 0, 0, 2 * rect.centerX() - 1,
                0, 2 * rect.height(), 0, 1 - 2 * rect.centerY(),
                0, 0, 1, 0,
                0, 0, 0, 1);

        this.primitiveShader.use();
        this.primitiveShader.setUniformMat44("modelMat", modelMat);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.primitiveMesh.getFrames().get(0).getVbo());
        this.vertBuf[0] = -0.5;
        this.vertBuf[1] = -0.5;
        this.vertBuf[2] = 0;
        this.vertBuf[3] = color.r();
        this.vertBuf[4] = color.g();
        this.vertBuf[5] = color.b();
        this.vertBuf[6] = color.a();
        this.vertBuf[7] = 0.5;
        this.vertBuf[8] = -0.5;
        this.vertBuf[9] = 0;
        this.vertBuf[10] = color.r();
        this.vertBuf[11] = color.g();
        this.vertBuf[12] = color.b();
        this.vertBuf[13] = color.a();
        this.vertBuf[14] = 0.5;
        this.vertBuf[15] = 0.5;
        this.vertBuf[16] = 0;
        this.vertBuf[17] = color.r();
        this.vertBuf[18] = color.g();
        this.vertBuf[19] = color.b();
        this.vertBuf[20] = color.a();
        this.vertBuf[21] = -0.5;
        this.vertBuf[22] = 0.5;
        this.vertBuf[23] = 0;
        this.vertBuf[24] = color.r();
        this.vertBuf[25] = color.g();
        this.vertBuf[26] = color.b();
        this.vertBuf[27] = color.a();
        gl.bufferData(gl.ARRAY_BUFFER, this.vertBuf, gl.STATIC_DRAW);

        gl.bindVertexArray(this.primitiveMesh.getVao());
        gl.bindBuffer(gl.ARRAY_BUFFER, this.primitiveMesh.getFrames().get(0).getVbo());
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 7 * 4, 0);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
        gl.enableVertexAttribArray(1);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        gl.bindVertexArray(null);
    }

    /**
     * Draws line.
     *
     * @param {Vec2} start start point
     * @param {Vec2} end end point
     * @param {Rgba} color color
     */
    drawLine(start, end, color) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.primitiveShader.use();
        this.primitiveShader.setUniformMat44("modelMat", Mat44.IDENTITY);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.primitiveMesh.getFrames().get(0).getVbo());
        this.vertBuf[0] = start.x() * 2 - 1;
        this.vertBuf[1] = 1 - 2 * start.y();
        this.vertBuf[2] = 0;
        this.vertBuf[3] = color.r();
        this.vertBuf[4] = color.g();
        this.vertBuf[5] = color.b();
        this.vertBuf[6] = color.a();
        this.vertBuf[7] = end.x() * 2 - 1;
        this.vertBuf[8] = 1 - 2 * end.y();
        this.vertBuf[9] = 0;
        this.vertBuf[10] = color.r();
        this.vertBuf[11] = color.g();
        this.vertBuf[12] = color.b();
        this.vertBuf[13] = color.a();
        gl.bufferData(gl.ARRAY_BUFFER, this.vertBuf, gl.STATIC_DRAW);

        gl.bindVertexArray(this.primitiveMesh.getVao());
        gl.bindBuffer(gl.ARRAY_BUFFER, this.primitiveMesh.getFrames().get(0).getVbo());
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 7 * 4, 0);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 7 * 4, 3 * 4);
        gl.enableVertexAttribArray(1);
        gl.drawArrays(gl.LINE_STRIP, 0, 2);
        gl.bindVertexArray(null);
    }

    /**
     * Sets the clip rectangle. After calling this command, only drawings into the rectangle will be shown.
     * Everything that falls outside will not be shown. This is useful for example when
     * drawing the UI containers that has child elements going beyond the border.
     * <p>
     * Please note that the underline process involves multiplication of floating point numbers,
     * which might come up with some errors and rasterization to the pixels. Then the clipping might have 1 - 2 pixels error.
     * Therefore it is typically good idea to use things like borders to cover those nicely.
     *
     * @param {Rect2} rect clip rectangle
     */
    setClipRect(rect) {
        const viewport = this.refProvider.getScreenViewport();
        const wf = rect.width() * viewport.getWidth();
        const hf = rect.height() * viewport.getHeight();
        let w = FMath.trunc(wf);
        if (w < wf) {
            w = w + 1;
        }
        let h = FMath.trunc(hf);
        if (h < hf) {
            h = h + 1;
        }
        const x = FMath.trunc(rect.x() * viewport.getWidth());
        const y = FMath.trunc(viewport.getHeight() - rect.height() * viewport.getHeight() - rect.y() * viewport.getHeight());
        gl.scissor(x, y, w, h);
        gl.enable(gl.SCISSOR_TEST);
    }

    /**
     * Unset the clip rectangle. After calling this command everything will be drawn as usually.
     */
    unsetClipRect() {
        gl.disable(gl.SCISSOR_TEST);
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
        const dbgPlane = UnpackedMesh.singleFrame(
                UnpackedMeshFrame.create(
                        Dut.list(VertexAttr.POS3, VertexAttr.TEX2),
                        Dut.list(
                                Vertex.create(-1, -1, 0, 0, 0),
                                Vertex.create(1, -1, 0, 1, 0),
                                Vertex.create(1, 1, 0, 1, 1),
                                Vertex.create(-1, 1, 0, 0, 1))),
                Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3))).toMesh();
        this.debugRectMesh = this.pushMeshToGraphicCard(dbgPlane);

        // Create sprite plane mesh
        const spritePlane = UnpackedMesh.singleFrame(
                UnpackedMeshFrame.create(
                        Dut.immutableList(VertexAttr.POS3, VertexAttr.TEX2),
                        Dut.list(
                                Vertex.create(-0.5, -0.5, 0, 0, 0),
                                Vertex.create(0.5, -0.5, 0, 1, 0),
                                Vertex.create(0.5, 0.5, 0, 1, 1),
                                Vertex.create(-0.5, 0.5, 0, 0, 1))),
                Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3))).toMesh();
        this.spriteRectMesh = this.pushMeshToGraphicCard(spritePlane);

        // Create primitive mesh
        const primitive = UnpackedMesh.singleFrame(
                UnpackedMeshFrame.create(
                        Dut.immutableList(VertexAttr.POS3, VertexAttr.RGBA),
                        Dut.list(
                                Vertex.create(0, 0, 0, 0, 0, 0, 1),
                                Vertex.create(0, 0, 0, 0, 0, 0, 1),
                                Vertex.create(0, 0, 0, 0, 0, 0, 1))
                        ),
                Dut.list(Face.create(0, 1, 2))).toMesh();
        this.primitivesMesh = this.pushMeshToGraphicCard(primitive);

        // Create default texture
        const tex = Texture.rgbFloatConstant(1, 1, Rgb.BLACK);
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
     * Disposes shadow buffer from the graphics card memory.
     *
     * @param {ShadowBufferId} id identifier
     */
    disposeShadowBuffer(id) {
        const ptr = this.shadowBuffers.remove(id);
        if (ptr === null) {
            return;
        }
        gl.deleteFramebuffer(ptr.getFbo());
        gl.deleteTexture(ptr.getTextureId());
    }

    /**
     * Pushes mesh to graphics card.
     * 
     * @param {Mesh} mesh mesh
     * @returns {WebglMeshRef} mesh reference
     */
    pushMeshToGraphicCard(mesh) {
        const numFrames = mesh.getNumFrames();
        let iarr = new Uint32Array(mesh.getFacesBlock().toIntArray());
        let ibuf = null;
        let vao = null;
        const frameRefs = new ArrayList();

        try {
            vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            const frameVertexAttrs = mesh.getVertexAttrs();
            for (let i = 0; i < numFrames; ++i) {
                const frame = mesh.getFrame(i);
                const varr = new Float32Array(frame.getVerticesBlock().toFloatArray());
                const vbuf = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
                gl.bufferData(gl.ARRAY_BUFFER, varr, gl.STATIC_DRAW);
                frameRefs.add(WebglMeshFrameRef.create(vbuf, frameVertexAttrs));
            }

            ibuf = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iarr, gl.STATIC_DRAW);

            gl.bindVertexArray(null);
        } catch (e) {
            console.error(e);
            if (vao !== null) {
                gl.deleteVertexArray(vao);
            }
            for (const fr of frameRefs) {
                gl.deleteBuffer(fr.getVbo());
            }
            if (ibuf !== null) {
                gl.deleteBuffer(ibuf);
            }
            throw "error during pushing mesh to the driver";
        }
        return WebglMeshRef.create(vao, ibuf, mesh.getFacesBlock().size() / 4, frameRefs);
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
        if (texture.getFormat().equals(TextureFormat.FLOAT)) {
            // convert from big endian (java) to little endian (webgl)
            const textData = texture.getData();
            const numVals = texture.getWidth() * texture.getHeight() * texture.getChannels().size();
            const buf = new ArrayBuffer(texture.getData().size());
            const bufView = new DataView(buf);
            for (let i = 0; i < numVals; ++i) {
                const val = textData.getFloat(i * 4);
                bufView.setFloat32(i * 4, val, true); // true = little-endian (webgl)
            }
            const arr = new Float32Array(buf);

            gl.bindTexture(gl.TEXTURE_2D, ptr);

            if (texture.getChannels().equals(Texture.RGB)) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, texture.getWidth(), texture.getHeight(), 0, gl.RGB, gl.FLOAT, arr);
            } else if (texture.getChannels().equals(Texture.RGBA)) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, texture.getWidth(), texture.getHeight(), 0, gl.RGBA, gl.FLOAT, arr);
            } else {
                throw "unsupported texture channels: " + texture;
            }
        } else if (texture.getFormat().equals(TextureFormat.UNSIGNED_BYTE)) {
            // here just wrap data in the typed array as no conversion is necessary
            const textData = texture.getData();
            const arr = new Uint8Array(textData.data);

            gl.bindTexture(gl.TEXTURE_2D, ptr);

            if (texture.getChannels().equals(Texture.RGB)) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, texture.getWidth(), texture.getHeight(), 0, gl.RGB, gl.UNSIGNED_BYTE, arr);
            } else if (texture.getChannels().equals(Texture.RGBA)) {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, texture.getWidth(), texture.getHeight(), 0, gl.RGBA, gl.UNSIGNED_BYTE, arr);
            } else {
                throw "unsupported texture channels: " + texture;
            }
        } else {
            throw new Error("unsupported texture format: " + texture.getFormat().toString());
        }

        if (mipmap) {
            // Currently mipmaps are not working. Leaving them up until I can figure out how to make them work.
            // gl.generateMipmap(gl.TEXTURE_2D);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        return WebglTextureRef.create(ptr, texture);
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
        if (meshRef === null || meshRef === undefined) {
            return;
        }
        const numFrames = meshRef.getFrames().size();
        for (let i = 0; i < numFrames; ++i) {
            gl.deleteBuffer(meshRef.getFrames().get(i).getVbo());
        }
        gl.deleteBuffer(meshRef.getEbo());
        gl.deleteVertexArray(meshRef.getVao());
    }

    /**
     * Disposes texture from graphics card.
     */
    disposeTextureFromGraphicCard(textureRef) {
        if (textureRef === null || textureRef === undefined) {
            return;
        }
        gl.deleteTexture(textureRef.textureId);
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
 * Web playback control.
 */
class WebPlaybackControl {
    /**
     * Playback id.
     * 
     * @type PlaybackId
     */
    playbackId;

    /**
     * Audio mixer.
     * 
     * @type AudioMixer
     */
    audioMixer;

    /**
     * audio buffer.
     * 
     * @type AudioBuffer
     */
    audioBuffer;

    /**
     * Volume as float [0..1].
     * 
     * @type Number
     */
    volume = 1.0;

    /**
     * Whether this sound plays in the loop or not.
     * 
     * @type Boolean
     */
    loop = false;

    /**
     * Whether this playback is playing.
     * 
     * @type Boolean
     */
    playing = false;

    /**
     * Whether this control is ended.
     * 
     * @type Boolean
     */
    ended = false;

    /**
     * Audio source.
     * 
     * @type AudioSource
     */
    source = null;

    /**
     * Gain node.
     * 
     * @type GainNode
     */
    gainNode = null;

    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        Guard.notNull(this.id, "id cannot be null");
        Guard.notNull(this.audioMixer, "audioMixer cannot be null");
        Guard.notNull(this.audioBuffer, "audioBuffer cannot be null");
    }

    /**
     * Returns the volume of this playback.
     * This should be number in [0, 1] interval
     *
     * @return {Number} volume of this playback inside [0, 1] interval
     */
    getVolume() {
        return this.volume;
    }

    /**
     * Sets volume of this playback.
     *
     * @param {Number} volume volume in [0, 1] interval
     * @return {WebPlaybackControl} this instance
     */
    setVolume(volume) {
        this.volume = volume;
        if (this.gainNode !== null) {
            this.gainNode.gain.value = volume;
        }
        return this;
    }

    /**
     * Whether this playback plays in a loop or not.
     *
     * @return {Boolean} whether this playback plays in a loop or not
     */
    isLoop() {
        return this.loop;
    }

    /**
     * Sets whether this playback should play in loop or not.
     *
     * @param {boolean} loop whether this playback should play in loop or not
     * @return {WebPlaybackControl} this instance
     */
    setLoop(loop) {
        this.loop = loop;
        if (this.source !== null) {
            this.source.loop = loop;
        }
        return this;
    }

    /**
     * Starts playing this playback.
     *
     * @return {WebPlaybackControl} this instance
     */
    play() {
        if (this.ended) {
            throw new Error("Playback already ended");
        }
        if (this.playing) {
            // already playing, no need to do anything
            return;
        }
        // Create source node
        const audioContext = this.audioMixer.getAudioContext();
        const masterGain = this.audioMixer.getMasterGain();
        const source = audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.loop = this.loop;

        // Create gain node for individual volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = this.volume;

        // Connect nodes
        source.connect(gainNode);
        gainNode.connect(masterGain);

        // start and set up cleaning
        source.start(audioContext.currentTime, 0);
        source.onended = () => {
            // this is triggered on toal end, doesn't get triggered when there is a loop
            this.cleanUp();
        };

        this.source = source;
        this.gainNode = gainNode;
        this.playing = true;

        return this;
    }

    /**
     * Stops this playback. Call of this method moves playback to the ended state.
     * Ended state is final and playback can be removed from system at any time.
     *
     * @return {WebPlaybackControl} this instance
     */
    stop() {
        try {
            this.source.stop();
        } catch (e) {
            // do nothing here
        }
        this.cleanUp;
    }

    /**
     * Returns whether this playback is ended.
     * Ended playbacks are done and can be removed from system.
     *
     * @return {Boolean} whether this playback is ended or not
     */
    isEnded() {
        return this.ended;
    }

    /**
     * Returns whether this playback is playing.
     * Playing means actually progressing.
     *
     * @return {Boolean} whether this playback is playing
     */
    isPlaying() {
        return this.playing;
    }

    /**
     * Performs the clean up.
     */
    cleanUp() {
        this.playing = false;
        this.ended = true;
        if (this.gainNode !== null) {
            this.gainNode.disconnect(this.audioMixer.getMasterGain());
            this.source = null;
            this.gainNode = null;
        }
        this.audioMixer.removePlayback(this.playbackId);
    }

    /**
     * Creates new instance.
     * 
     * @param {PlaybackId} playbackId playback identifier
     * @param {AudioMixer} audioMixer mixer
     * @param {AudioBuffer} audioBuffer audio buffer
     * @returns {WebPlayback} created playback
     */
    static create(playbackId, audioMixer, audioBuffer) {
        const res = new WebPlaybackControl();
        res.playbackId = playbackId;
        res.audioMixer = audioMixer;
        res.audioBuffer = audioBuffer;
        res.guardInvariants();
        return res;
    }
}
/**
 * Web audio mixer.
 */
class WebAudioMixer {
    /**
     * Audio driver.
     * 
     * @type WebAudioDriver
     */
    audioDriver;
    /**
     * Playback map.
     * 
     * @type HashMap of PlaybackId to WebPlaybackControl
     */
    playbacks = new HashMap();
    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        Guard.notNull(this.audioDriver, "audioDriver cannot be null");
    }

    /**
     * Prepares playback to be played. Returns con
     *
     * @param {PlaybackId} id playback identifier for later reference
     * @param {SoundId} soundId identifier of the sound which will be played
     * @return {PlaybackControl} control for further actions
     */
    prepare(id, soundId) {
        if (this.playbacks.containsKey(id)) {
            throw new Error("playback id is already taken: " + id.toString());
        }
        const res = WebPlaybackControl.create(id, this, this.audioDriver.getAudioBuffer(soundId));
        this.playbacks.put(id, res);
        return res;
    }

    /**
     * Returns control of the specified playback.
     * Returns null if given playback is not found. For example, playback might be removed after it's done.
     *
     * @param {PlaybackId} playbackId playback id
     * @return {WebPlaybackControl} control of the specified playback, or null if playback doesn't exists
     */
    getControlNonStrict(playbackId) {
        return this.playbacks.get(playbackId);
    }

    /**
     * Stops all playbacks. This can put all the existing playbacks into an unusable state and possibly remove them.
     * Use case for this method is for example when user is leaving one screen so all the sounds should be stopped and existing playbacks
     * references are not going to be used anymore.
     */
    stop() {
        const oldPlaybacks = this.playbacks;
        this.playbacks = new HashMap();
        for (const playbackId of oldPlaybacks.keySet()) {
            const pb = oldPlaybacks.get(playbackId);
            pb.stop();
        }
    }

    /**
     * Removes playback 
     * @param {PlaybackId} id playback identifier
     */
    removePlayback(id) {
        this.playbacks.remove(id);
    }

    /**
     * Returns audio context.
     * 
     * @returns {AudioContext} audio context
     */
    getAudioContext() {
        return this.audioDriver.getAudioContext();
    }

    /**
     * Returns master gain.
     * 
     * @returns {MasterGain} masrter gain
     */
    getMasterGain() {
        return this.audioDriver.getMasterGain();
    }

    /**
     * Creates new instance.
     * 
     * @param {AudioDriver} audioDriver audio driver
     * @returns {WebAudioMixer} created mixer
     */
    static create(audioDriver) {
        const res = new WebAudioMixer();
        res.audioDriver = audioDriver;
        res.guardInvariants();
        return res;
    }
}
/**
 * Web audio driver.
 */
class WebAudioDriver {
    audioContext;
    masterGain;
    soundIds;
    /**
     * Map with audio buffer for each sound.
     * 
     * @type HashMap audio buffers (SoundId -> AudioBuffer)
     */
    audioBuffers = new HashMap();
    constructor() {
    }

    /**
     * Guards this object to be consistent.
     */
    guardInvariants() {
        Guard.notNull(this.audioContext, "audioContext cannot be null");
        Guard.notNull(this.masterGain, "masterGain cannot be null");
        Guard.notNull(this.soundIds, "soundIds cannot be null");
    }

    /**
     * Loads sound into an audio memory.
     *
     * @param {SoundId} id sound identifier
     * @param {Sound} sound sound
     */
    loadSound(id, sound) {
        const track = sound.getTrack();
        if (track.getFormat().equals(SoundTrackFormat.FLOAT)) {
            // create a native float buffer
            const floatBuf = new Float32Array(track.getNumSamples());
            if (track.getRange().min() === -1 || track.getRange().max() === 1) {
                for (let i = 0; i < track.getNumSamples(); ++i) {
                    floatBuf[i] = track.getFloatSample(i);
                }
            } else {
                //
                //const range = maxValue - minValue;
                //for (let i = 0; i < floatSamples.length; i++) {
                //    floatSamples[i] = ((floatSamples[i] - minValue) / range) * 2 - 1;
                //}
                throw Error("only normalized track is supported at the moment, implement me");
            }

            const audioBuffer = this.audioContext.createBuffer(1, track.getNumSamples(), track.getSampleRate());
            const channelData = audioBuffer.getChannelData(0);
            for (let i = 0; i < track.getNumSamples(); i++) {
                channelData[i] = floatBuf[i];
            }

            this.audioBuffers.put(id, audioBuffer);
            this.soundIds.add(id);
        } else {
            throw new Error("unsupported sound track format: " + track.getFormat().toString());
        }


    }

    /**
     * Returns sound ids.
     * 
     * @returns {Set of SoundId} sound ids
     */
    getSounds() {
        return Dut.copyImmutableSet(this.soundIds);
    }

    /**
     * Returns the audio mixer.
     *
     * @return {AudioMixer} mixer provided by system
     */
    getMixer() {
        return WebAudioMixer.create(this);
    }

    /**
     * Returns audio context.
     * 
     * @returns {AudioContext} audio context
     */
    getAudioContext() {
        return this.audioContext;
    }

    /**
     * Returns audio buffer for a given sound.
     * 
     * @param {SoundId} soundId sound identifier
     * @returns {AudioBuffer} audio buffer
     */
    getAudioBuffer(soundId) {
        const res = this.audioBuffers.get(soundId);
        if (res === null || res === undefined) {
            throw new Error("no sound for: " + soundId.toString());
        }
        return res;
    }

    /**
     * Returns master gain.
     * 
     * @returns {MasterGain} masrter gain
     */
    getMasterGain() {
        return this.masterGain;
    }

    /**
     * Creates new instance.
     * 
     * @param {AudioContext} audioContext audio context
     * @returns {WebAudioDriver} created driver
     */
    static create(audioContext) {
        const res = new WebAudioDriver();
        res.audioContext = audioContext;
        res.masterGain = res.audioContext.createGain();
        res.masterGain.connect(res.audioContext.destination);
        res.masterGain.gain.value = 1.0;
        res.soundIds = new HashSet();
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
    
    onTouchStart(id, x, y) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchStart(id, pos, this.size);
        }        
    }

    onTouchMove(id, x, y) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchMove(id, pos, this.size);
        }        
    }

    onTouchEnd(id, x, y, cancel) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchEnd(id, pos, this.size, cancel);
        }        
    }

    onMouseDown(x, y) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchStart(MouseTouches.MOUSE_TOUCH_ID, pos, this.size);
        }
    }

    onMouseUp(x, y, cancel) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchEnd(MouseTouches.MOUSE_TOUCH_ID, pos, this.size, cancel);
        }
    }

    onMouseDragged(x, y) {
        const pos = Pos2.create(x, y);
        for (const listener of this.listeners) {
            listener.onTouchMove(MouseTouches.MOUSE_TOUCH_ID, pos, this.size);
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
/**
 * Touch driver implemented for AWT events.
 *
 * @author radek.hecl
 */
class WebKeyboardDriver {

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
        Guard.notNullCollection(this.listeners, "listeners cannot have null element");
    }

    /**
     * Adds key listener.
     *
     * @param {KeyboardListener} listener listener
     */
    addKeyListener(listener) {
        Guard.notNull(listener, "listener cannot be null");
        this.listeners.add(listener);

    }

    /**
     * Removes key listener.
     *
     * @param {KeyboardListener} listener listener
     */
    removeKeyListener(listener) {
        this.listeners.remove(listener);

    }

    /**
     * Called when key is pressed.
     *
     * @param {KeyCode} key key identifier
     */
    onKeyPressed(key) {
        for (const listener of this.listeners) {
            listener.onKeyPressed(key);
        }

    }

    /**
     * Called when key is released.
     *
     * @param {KeyCode} key key identifier
     */
    onKeyReleased(key) {
        for (const listener of this.listeners) {
            listener.onKeyReleased(key);
        }
    }

    /**
     * Creates new instance.
     *
     * @return {WebTouchDriver} created instance
     */
    static create() {
        const res = new WebKeyboardDriver();
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

    plaformDriver = WebPlatformDriver.create();
    assetBank = DefaultAssetBank.create();
    assetLoader = WebAssetLoader.create();
    executor = AsyncTaskExecutor.create();
    assetManager = WebAssetManager.create(this, this.executor, this.assetLoader, this.assetBank);
    displayDriver = ProxyDisplayDriver.create();
    graphicsDriver = WebglGraphicsDriver.create(this.assetManager);
    audioDriver = WebAudioDriver.create(audioContext);
    touchDriver = WebTouchDriver.create();
    keyboardDriver = WebKeyboardDriver.create();
    localDataStorage = WebLocalDataStorage.create(localStoragePrefix);

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
        } else if (driver === "KeyboardDriver") {
            return true;
        } else if (driver === "AssetManager") {
            return true;
        } else if (driver === "AssetProvider") {
            return true;
        } else if (driver === "PlatformDriver") {
            return true;
        } else if (driver === "LocalDataStorage") {
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
        } else if (driver === "KeyboardDriver") {
            return this.keyboardDriver;
        } else if (driver === "AssetManager") {
            return this.assetManager;
        } else if (driver === "AssetProvider") {
            return this.assetManager;
        } else if (driver === "PlatformDriver") {
            return this.plaformDriver;
        } else if (driver === "LocalDataStorage") {
            return this.localDataStorage;
        }
        throw "driver doesn't exists:" + driver;
        return null;
    }

    /**
     * Returns the platform driver.
     *
     * @return platform driver
     */
    getPlatform() {
        return this.plaformDriver;
    }

}


// -------------------------------------
// Translated framework code
// -------------------------------------

class JsonObject {
  entries;
  constructor() {
  }

  getClass() {
    return "JsonObject";
  }

  guardInvariants() {
  }

  containsKey(key) {
    return this.entries.containsKey(key);
  }

  keySet() {
    return this.entries.keySet();
  }

  get(key) {
    if (this.entries.containsKey(key)) {
      return this.entries.get(key);
    }
    throw new Error("key doesn't exists: "+key);
  }

  getBoolean(key) {
    if (this.entries.containsKey(key)) {
      return this.entries.get(key);
    }
    throw new Error("key doesn't exists: "+key);
  }

  getString(key) {
    if (this.entries.containsKey(key)) {
      return this.entries.get(key);
    }
    throw new Error("key doesn't exists: "+key);
  }

  getInt(key) {
    if (this.entries.containsKey(key)) {
      return FMath.trunc(this.entries.get(key));
    }
    throw new Error("key doesn't exists: "+key);
  }

  getFloat(key) {
    if (this.entries.containsKey(key)) {
      return this.entries.get(key);
    }
    throw new Error("key doesn't exists: "+key);
  }

  getJsonObject(key) {
    if (this.entries.containsKey(key)) {
      return this.entries.get(key);
    }
    throw new Error("key doesn't exists: "+key);
  }

  getJsonArray(key) {
    if (this.entries.containsKey(key)) {
      return this.entries.get(key);
    }
    throw new Error("key doesn't exists: "+key);
  }

  withBoolean(key, val) {
    let resEnts = new HashMap();
    resEnts.putAll(this.entries);
    resEnts.put(key, val);
    let res = new JsonObject();
    res.entries = Collections.unmodifiableMap(resEnts);
    res.guardInvariants();
    return res;
  }

  withInt(key, val) {
    let resEnts = new HashMap();
    resEnts.putAll(this.entries);
    resEnts.put(key, val);
    let res = new JsonObject();
    res.entries = Collections.unmodifiableMap(resEnts);
    res.guardInvariants();
    return res;
  }

  withFloat(key, val) {
    let resEnts = new HashMap();
    resEnts.putAll(this.entries);
    resEnts.put(key, val);
    let res = new JsonObject();
    res.entries = Collections.unmodifiableMap(resEnts);
    res.guardInvariants();
    return res;
  }

  withString(key, val) {
    let resEnts = new HashMap();
    resEnts.putAll(this.entries);
    resEnts.put(key, val);
    let res = new JsonObject();
    res.entries = Collections.unmodifiableMap(resEnts);
    res.guardInvariants();
    return res;
  }

  withObject(key, val) {
    let resEnts = new HashMap();
    resEnts.putAll(this.entries);
    resEnts.put(key, val);
    let res = new JsonObject();
    res.entries = Collections.unmodifiableMap(resEnts);
    res.guardInvariants();
    return res;
  }

  withArray(key, val) {
    let resEnts = new HashMap();
    resEnts.putAll(this.entries);
    resEnts.put(key, val);
    let res = new JsonObject();
    res.entries = Collections.unmodifiableMap(resEnts);
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
    let res = new JsonObject();
    res.entries = Collections.emptyMap();
    res.guardInvariants();
    return res;
  }

}
classRegistry.JsonObject = JsonObject;
class JsonArray {
  items;
  constructor() {
  }

  getClass() {
    return "JsonArray";
  }

  guardInvariants() {
  }

  size() {
    return this.items.size();
  }

  get(idx) {
    return this.items.get(idx);
  }

  getBoolean(idx) {
    return this.items.get(idx);
  }

  getString(idx) {
    return this.items.get(idx);
  }

  getInt(idx) {
    return FMath.trunc(this.items.get(idx));
  }

  getFloat(idx) {
    return this.items.get(idx);
  }

  getJsonObject(idx) {
    return this.items.get(idx);
  }

  getJsonArray(idx) {
    return this.items.get(idx);
  }

  plusBoolean(val) {
    let resItems = new ArrayList();
    resItems.addAll(this.items);
    resItems.add(val);
    let res = new JsonArray();
    res.items = Collections.unmodifiableList(resItems);
    res.guardInvariants();
    return res;
  }

  plusInt(val) {
    let resItems = new ArrayList();
    resItems.addAll(this.items);
    resItems.add(val);
    let res = new JsonArray();
    res.items = Collections.unmodifiableList(resItems);
    res.guardInvariants();
    return res;
  }

  plusFloat(val) {
    let resItems = new ArrayList();
    resItems.addAll(this.items);
    resItems.add(val);
    let res = new JsonArray();
    res.items = Collections.unmodifiableList(resItems);
    res.guardInvariants();
    return res;
  }

  plusString(val) {
    let resItems = new ArrayList();
    resItems.addAll(this.items);
    resItems.add(val);
    let res = new JsonArray();
    res.items = Collections.unmodifiableList(resItems);
    res.guardInvariants();
    return res;
  }

  plusObject(val) {
    let resItems = new ArrayList();
    resItems.addAll(this.items);
    resItems.add(val);
    let res = new JsonArray();
    res.items = Collections.unmodifiableList(resItems);
    res.guardInvariants();
    return res;
  }

  plusArray(val) {
    let resItems = new ArrayList();
    resItems.addAll(this.items);
    resItems.add(val);
    let res = new JsonArray();
    res.items = Collections.unmodifiableList(resItems);
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
    let res = new JsonArray();
    res.items = Collections.emptyList();
    res.guardInvariants();
    return res;
  }

}
classRegistry.JsonArray = JsonArray;
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
      throw new Error("ambiguous overload");
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
classRegistry.Vec2 = Vec2;
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
      throw new Error("ambiguous overload");
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
classRegistry.Vec3 = Vec3;
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
classRegistry.Vec4 = Vec4;
class Interval2 {
  mMin;
  mMax;
  constructor() {
  }

  getClass() {
    return "Interval2";
  }

  guardInvariants() {
  }

  min() {
    return this.mMin;
  }

  max() {
    return this.mMax;
  }

  length() {
    return this.mMax-this.mMin;
  }

  hashCode() {
    return this.mMin+13*this.mMax;
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Interval2)) {
      return false;
    }
    let ob = obj;
    return ob.mMin==this.mMin&&ob.mMax==this.mMax;
  }

  toString() {
  }

  static create(min, max) {
    let res = new Interval2();
    res.mMin = min;
    res.mMax = max;
    res.guardInvariants();
    return res;
  }

}
classRegistry.Interval2 = Interval2;
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
      throw new Error("idx can be only 0, 1 or 2: "+idx);
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
      throw new Error("matrix inversion doesn't exists: "+this);
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
classRegistry.Mat33 = Mat33;
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
      throw new Error("ambiguous overload");
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
      throw new Error("matrix inversion doesn't exists: "+determinant+", "+this.toString());
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
classRegistry.Mat44 = Mat44;
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
      throw new Error("ambiguous overload");
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
classRegistry.Pos2 = Pos2;
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
classRegistry.Size2 = Size2;
class Size3 {
  mWidth;
  mHeight;
  mDepth;
  constructor() {
  }

  getClass() {
    return "Size3";
  }

  guardInvariants() {
  }

  width() {
    return this.mWidth;
  }

  height() {
    return this.mHeight;
  }

  getDepth() {
    return this.mDepth;
  }

  scale(s) {
    return Size3.create(this.mWidth*s, this.mHeight*s, this.mDepth*s);
  }

  hashCode() {
    return FMath.trunc(this.mWidth*7+this.mHeight*11+this.mDepth*13);
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Size3)) {
      return false;
    }
    let other = obj;
    return this.mWidth==other.mWidth&&this.mHeight==other.mHeight&&this.mDepth==other.mDepth;
  }

  toString() {
  }

  static create(width, height, depth) {
    let res = new Size3();
    res.mWidth = width;
    res.mHeight = height;
    res.mDepth = depth;
    res.guardInvariants();
    return res;
  }

}
classRegistry.Size3 = Size3;
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
classRegistry.Rect2 = Rect2;
class Aabb3 {
  static ZERO = Aabb3.create(Vec3.ZERO, Vec3.ZERO);
  mMin;
  mMax;
  constructor() {
  }

  getClass() {
    return "Aabb3";
  }

  guardInvariants() {
  }

  min() {
    return this.mMin;
  }

  max() {
    return this.mMax;
  }

  size() {
    return Size3.create(this.mMax.x()-this.mMin.x(), this.mMax.y()-this.mMin.y(), this.mMax.z()-this.mMin.z());
  }

  isInside(pt) {
    return pt.x()>=this.mMin.x()&&pt.x()<=this.mMax.x()&&pt.y()>=this.mMin.y()&&pt.y()<=this.mMax.y()&&pt.z()>=this.mMin.z()&&pt.z()<=this.mMax.z();
  }

  isIntersect(other) {
    return !(this.mMin.x()>other.mMax.x()||this.mMax.x()<other.mMin.x()||this.mMin.y()>other.mMax.y()||this.mMax.y()<other.mMin.y()||this.mMin.z()>other.mMax.z()||this.mMax.z()<other.mMin.z());
  }

  expand() {
    if (arguments.length===1&&arguments[0] instanceof Aabb3) {
      return this.expand_1_Aabb3(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="number") {
      return this.expand_1_number(arguments[0]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  expand_1_Aabb3(other) {
    let minX = FMath.min(this.mMin.x(), other.mMin.x());
    let minY = FMath.min(this.mMin.y(), other.mMin.y());
    let minZ = FMath.min(this.mMin.z(), other.mMin.z());
    let maxX = FMath.max(this.mMax.x(), other.mMax.x());
    let maxY = FMath.max(this.mMax.y(), other.mMax.y());
    let maxZ = FMath.max(this.mMax.z(), other.mMax.z());
    if (minX==this.mMin.x()&&minY==this.mMin.y()&&minZ==this.mMin.z()&&maxX==this.mMax.x()&&maxY==this.mMax.y()&&maxZ==this.mMax.z()) {
      return this;
    }
    return Aabb3.create(minX, minY, minZ, maxX, maxY, maxZ);
  }

  expand_1_number(delta) {
    if (delta==0) {
      return this;
    }
    return Aabb3.create(this.mMin.x()-delta, this.mMin.y()-delta, this.mMin.z()-delta, this.mMax.x()+delta, this.mMax.y()+delta, this.mMax.z()+delta);
  }

  transform(mat) {
    let p1 = this.mMin;
    let p2 = Vec3.create(this.mMin.x(), this.mMin.y(), this.mMax.z());
    let p3 = Vec3.create(this.mMin.x(), this.mMax.y(), this.mMin.z());
    let p4 = Vec3.create(this.mMax.x(), this.mMin.y(), this.mMin.z());
    let p5 = Vec3.create(this.mMax.x(), this.mMax.y(), this.mMin.z());
    let p6 = Vec3.create(this.mMax.x(), this.mMin.y(), this.mMax.z());
    let p7 = Vec3.create(this.mMin.x(), this.mMax.y(), this.mMax.z());
    let p8 = this.mMax;
    p1 = mat.mul(p1);
    p2 = mat.mul(p2);
    p3 = mat.mul(p3);
    p4 = mat.mul(p4);
    p5 = mat.mul(p5);
    p6 = mat.mul(p6);
    p7 = mat.mul(p7);
    p8 = mat.mul(p8);
    return Aabb3.wrap(p1, p2, p3, p4, p5, p6, p7, p8);
  }

  hashCode() {
    return (this.mMin.x()*this.mMin.y()*this.mMin.z()*this.mMax.x()*this.mMax.y()*this.mMax.z());
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Aabb3)) {
      return false;
    }
    let other = obj;
    return this.mMin.equals(other.mMin)&&this.mMax.equals(other.mMax);
  }

  toString() {
  }

  static create() {
    if (arguments.length===2&&arguments[0] instanceof Vec3&&arguments[1] instanceof Vec3) {
      return Aabb3.create_2_Vec3_Vec3(arguments[0], arguments[1]);
    }
    else if (arguments.length===6&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number"&& typeof arguments[3]==="number"&& typeof arguments[4]==="number"&& typeof arguments[5]==="number") {
      return Aabb3.create_6_number_number_number_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static create_2_Vec3_Vec3(min, max) {
    let res = new Aabb3();
    res.mMin = min;
    res.mMax = max;
    res.guardInvariants();
    return res;
  }

  static create_6_number_number_number_number_number_number(minX, minY, minZ, maxX, maxY, maxZ) {
    let res = new Aabb3();
    res.mMin = Vec3.create(minX, minY, minZ);
    res.mMax = Vec3.create(maxX, maxY, maxZ);
    res.guardInvariants();
    return res;
  }

  static wrap(...vecs) {
    if (Array.isArray(vecs)&&vecs.length===1&&Array.isArray(vecs[0])) {
      vecs = vecs[0];
    }
    let minX = vecs[0].x();
    let minY = vecs[0].y();
    let minZ = vecs[0].z();
    let maxX = vecs[0].x();
    let maxY = vecs[0].y();
    let maxZ = vecs[0].z();
    for (let i = 1; i<vecs.length; ++i) {
      let v = vecs[i];
      minX = FMath.min(minX, v.x());
      minY = FMath.min(minY, v.y());
      minZ = FMath.min(minZ, v.z());
      maxX = FMath.max(maxX, v.x());
      maxY = FMath.max(maxY, v.y());
      maxZ = FMath.max(maxZ, v.z());
    }
    return Aabb3.create(minX, minY, minZ, maxX, maxY, maxZ);
  }

}
classRegistry.Aabb3 = Aabb3;
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

  negate() {
    return Quaternion.create(-this.mA, -this.mB, -this.mC, -this.mD);
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
      throw new Error("ambiguous overload");
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
classRegistry.Quaternion = Quaternion;
class Geometry3 {
  constructor() {
  }

  getClass() {
    return "Geometry3";
  }

  static projectToLine(linePt, lineDir, pt) {
    let dx = pt.x()-linePt.x();
    let dy = pt.y()-linePt.y();
    let dz = pt.z()-linePt.z();
    let t = dx*lineDir.x()+dy*lineDir.y()+dz*lineDir.z();
    return linePt.addScaled(lineDir, t);
  }

}
classRegistry.Geometry3 = Geometry3;
class Interpolation {
  static ZERO = Interpolation.create(0, 0, 0);
  mStartIdx;
  mEndIdx;
  mT;
  constructor() {
  }

  getClass() {
    return "Interpolation";
  }

  guardInvaritants() {
    Guard.beTrue(this.mT>=0&&this.mT<=1, "t must be in [0, 1]: %f", this.mT);
  }

  startIdx() {
    return this.mStartIdx;
  }

  endIdx() {
    return this.mEndIdx;
  }

  t() {
    return this.mT;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(startIdx, endIdx, t) {
    let res = new Interpolation();
    res.mStartIdx = startIdx;
    res.mEndIdx = endIdx;
    res.mT = t;
    res.guardInvaritants();
    return res;
  }

}
classRegistry.Interpolation = Interpolation;
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
classRegistry.RefIdType = RefIdType;
class TyracornApp {
  getClass() {
    return "TyracornApp";
  }

  init(drivers, properties) {
  }

  move(drivers, dt) {
  }

  pause(drivers) {
  }

  close(drivers) {
  }

}
classRegistry.TyracornApp = TyracornApp;
class TyracornScreen {
  getClass() {
    return "TyracornScreen";
  }

  load(drivers, screenManager, properties) {
  }

  init(drivers, screenManager, properties) {
  }

  move(drivers, screenManager, dt) {
  }

  pause(drivers) {
  }

  leave(drivers) {
  }

}
classRegistry.TyracornScreen = TyracornScreen;
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
classRegistry.Path = Path;
class LocalDataKey {
  mKey;
  constructor() {
  }

  getClass() {
    return "LocalDataKey";
  }

  guardInvariants() {
  }

  key() {
    return this.mKey;
  }

  hashCode() {
    return this.mKey.hashCode();
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof LocalDataKey)) {
      return false;
    }
    let other = obj;
    return other.mKey.equals(this.mKey);
  }

  toString() {
  }

  static of(key) {
    let res = new LocalDataKey();
    res.mKey = key;
    res.guardInvariants();
    return res;
  }

}
classRegistry.LocalDataKey = LocalDataKey;
class PropertyKey {
  mKey;
  constructor() {
  }

  getClass() {
    return "PropertyKey";
  }

  guardInvariants() {
  }

  key() {
    return this.mKey;
  }

  hashCode() {
    return this.mKey.hashCode();
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof PropertyKey)) {
      return false;
    }
    let other = obj;
    return other.mKey.equals(this.mKey);
  }

  toString() {
  }

  static of(key) {
    let res = new PropertyKey();
    res.mKey = key;
    res.guardInvariants();
    return res;
  }

}
classRegistry.PropertyKey = PropertyKey;
class PropertyKeyNaturalComparator {
  constructor() {
  }

  getClass() {
    return "PropertyKeyNaturalComparator";
  }

  compare(o1, o2) {
    Guard.notNull(o1, "o1 is null which is not supported");
    Guard.notNull(o2, "o2 is null which is not supported");
    if (o1.equals(o2)) {
      return 0;
    }
    return o1.key().compareTo(o2.key());
  }

  toString() {
  }

  static create() {
    return new PropertyKeyNaturalComparator();
  }

}
classRegistry.PropertyKeyNaturalComparator = PropertyKeyNaturalComparator;
class LocalDataConfigProperties {
  storage;
  dataKey;
  properties;
  defaults;
  constructor() {
  }

  getClass() {
    return "LocalDataConfigProperties";
  }

  guardInvariants() {
  }

  getString() {
    if (arguments.length===1&&arguments[0] instanceof PropertyKey) {
      return this.getString_1_PropertyKey(arguments[0]);
    }
    else if (arguments.length===2&&arguments[0] instanceof PropertyKey&& typeof arguments[1]==="string") {
      return this.getString_2_PropertyKey_string(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getString_1_PropertyKey(key) {
    if (this.properties.containsKey(key)) {
      return this.properties.get(key);
    }
    if (this.defaults.containsKey(key)) {
      return this.defaults.get(key);
    }
    throw new Error("property not found: "+key);
  }

  getString_2_PropertyKey_string(key, def) {
    if (this.properties.containsKey(key)) {
      return this.properties.get(key);
    }
    if (this.defaults.containsKey(key)) {
      return this.defaults.get(key);
    }
    return def;
  }

  getBoolean() {
    if (arguments.length===1&&arguments[0] instanceof PropertyKey) {
      return this.getBoolean_1_PropertyKey(arguments[0]);
    }
    else if (arguments.length===2&&arguments[0] instanceof PropertyKey&& typeof arguments[1]==="boolean") {
      return this.getBoolean_2_PropertyKey_boolean(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getBoolean_1_PropertyKey(key) {
    return Formats.parseBoolean(this.getString(key));
  }

  getBoolean_2_PropertyKey_boolean(key, def) {
    if (this.properties.containsKey(key)||this.defaults.containsKey(key)) {
      return Formats.parseBoolean(this.getString(key));
    }
    return def;
  }

  getInt() {
    if (arguments.length===1&&arguments[0] instanceof PropertyKey) {
      return this.getInt_1_PropertyKey(arguments[0]);
    }
    else if (arguments.length===2&&arguments[0] instanceof PropertyKey&& typeof arguments[1]==="number") {
      return this.getInt_2_PropertyKey_number(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getInt_1_PropertyKey(key) {
    return Formats.parseInt(this.getString(key));
  }

  getInt_2_PropertyKey_number(key, def) {
    if (this.properties.containsKey(key)||this.defaults.containsKey(key)) {
      return Formats.parseInt(this.getString(key));
    }
    return def;
  }

  getFloat() {
    if (arguments.length===1&&arguments[0] instanceof PropertyKey) {
      return this.getFloat_1_PropertyKey(arguments[0]);
    }
    else if (arguments.length===2&&arguments[0] instanceof PropertyKey&& typeof arguments[1]==="number") {
      return this.getFloat_2_PropertyKey_number(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getFloat_1_PropertyKey(key) {
    return Formats.parseFloat(this.getString(key));
  }

  getFloat_2_PropertyKey_number(key, def) {
    if (this.properties.containsKey(key)||this.defaults.containsKey(key)) {
      return Formats.parseFloat(this.getString(key));
    }
    return def;
  }

  put(key, value) {
    Guard.notNull(key, "key cannot be null");
    Guard.notNull(value, "value cannot be null");
    this.properties.put(key, ""+value);
    this.save();
  }

  remove(key) {
    this.properties.remove(key);
    this.save();
  }

  removeAll() {
    this.properties.clear();
    this.save();
  }

  withDefaults(defaults) {
    let res = new LocalDataConfigProperties();
    res.storage = this.storage;
    res.dataKey = this.dataKey;
    res.properties = this.properties;
    res.defaults = Dut.copyImmutableMap(defaults);
    res.guardInvariants();
    return res;
  }

  load() {
    if (!this.storage.exists(this.dataKey)) {
      return ;
    }
    let str = this.storage.loadString(this.dataKey);
    let lines = Dut.list(str.split("\n"));
    for (let line of lines) {
      if (StringUtils.isEmpty(line)) {
        continue;
      }
      let parts = line.split("=", 2);
      this.properties.put(PropertyKey.of(parts[0]), parts[1]);
    }
  }

  save() {
    let str = new StringBuilder();
    for (let key of this.properties.keySet()) {
      let val = this.properties.get(key);
      str.append(key.key()).append("=").append(val).append("\n");
    }
    this.storage.saveString(this.dataKey, str.toString());
  }

  toString() {
  }

  static create(storage, dataKey) {
    let res = new LocalDataConfigProperties();
    res.storage = storage;
    res.dataKey = dataKey;
    res.properties = new HashMap();
    res.defaults = Collections.emptyMap();
    res.guardInvariants();
    res.load();
    return res;
  }

}
classRegistry.LocalDataConfigProperties = LocalDataConfigProperties;
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
classRegistry.Rgb = Rgb;
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
classRegistry.Rgba = Rgba;
const createTextureFormat = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
const TextureFormat = Object.freeze({
  FLOAT: createTextureFormat("FLOAT"),
  UNSIGNED_BYTE: createTextureFormat("UNSIGNED_BYTE"),

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
const createTextureChannel = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
  format;
  channels;
  width;
  height;
  data;
  constructor() {
  }

  getClass() {
    return "Texture";
  }

  guardInvaritants() {
    Guard.notNull(this.format, "format cannot be null");
    Guard.notNullCollection(this.channels, "channels cannot have a null element");
    Guard.positive(this.width, "width must be positive");
    Guard.positive(this.height, "height must be positive");
    Guard.notNull(this.data, "buf cannot be null");
    if (this.format.equals(TextureFormat.FLOAT)) {
      Guard.beTrue(this.data.size()==this.channels.size()*this.width*this.height*4, "buf.lenght must be equal to numChannels * width * height * 4 for FLOAT format");
    }
    else if (this.format.equals(TextureFormat.UNSIGNED_BYTE)) {
      Guard.beTrue(this.data.size()==this.channels.size()*this.width*this.height, "buf.lenght must be equal to numChannels * width * height for UNSIGNED_BYTE format");
    }
    else {
      throw new Error("unsupported texture format: "+this.format.toString());
    }
  }

  getFormat() {
    return this.format;
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

  getData() {
    return this.data;
  }

  flipVert() {
    let bpp = this.getBytesPerPixel();
    let writer = DataBlockRandomWriter.create(this.data.size());
    for (let y = 0; y<this.height; ++y) {
      for (let x = 0; x<this.width; ++x) {
        let srcPos = (y*this.width+x)*bpp;
        let dstPos = ((this.height-1-y)*this.width+x)*bpp;
        writer.copyBytes(dstPos, this.data, srcPos, bpp);
      }
    }
    return Texture.create(this.format, this.channels, this.width, this.height, writer.toDataBlock());
  }

  crop(x, y, w, h) {
    let bpp = this.getBytesPerPixel();
    let writer = DataBlockStreamWriter.create(w*h*bpp);
    for (let wy = 0; wy<h; ++wy) {
      for (let wx = 0; wx<w; ++wx) {
        let srcPos = (((wy+y)*this.width)+x+wx)*bpp;
        writer.copyBytes(this.data, srcPos, bpp);
      }
    }
    return Texture.create(this.format, this.channels, w, h, writer.toDataBlock());
  }

  powRgb(p) {
    let rgbChannels = Dut.set(TextureChannel.RED, TextureChannel.GREEN, TextureChannel.BLUE);
    if (this.format.equals(TextureFormat.FLOAT)) {
      let writer = DataBlockStreamWriter.create(this.data.size());
      let nch = this.channels.size();
      let pos = 0;
      for (let y = 0; y<this.height; ++y) {
        for (let x = 0; x<this.width; ++x) {
          for (let i = 0; i<nch; ++i,pos=pos+4) {
            if (rgbChannels.contains(this.channels.get(i))) {
              let val = this.data.getFloat(pos);
              writer.writeFloat(FMath.pow(val, p));
            }
            else {
              writer.copyBytes(this.data, pos, 4);
            }
          }
        }
      }
      return Texture.create(this.format, this.channels, this.width, this.height, writer.toDataBlock());
    }
    else {
      throw new Error("only FLOAT format is supported for powRgb operation, implement me");
    }
  }

  toFormat(targetFormat) {
    if (this.format.equals(targetFormat)) {
      return this;
    }
    if (this.format.equals(TextureFormat.FLOAT)&&targetFormat.equals(TextureFormat.UNSIGNED_BYTE)) {
      let writer = DataBlockStreamWriter.create(this.data.size()/4);
      for (let idx = 0; idx<this.data.size(); idx=idx+4) {
        let f = FMath.clamp(this.data.getFloat(idx), 0, 1);
        let ubyte = FMath.trunc(f*255);
        let b = ubyte;
        writer.writeByte(b);
      }
      let res = new Texture();
      res.format = TextureFormat.UNSIGNED_BYTE;
      res.channels = this.channels;
      res.width = this.width;
      res.height = this.height;
      res.data = writer.toDataBlock();
      res.guardInvaritants();
      return res;
    }
    else {
      throw new Error("unsupported format conversion, implement me");
    }
  }

  isCompatible(other) {
    if (!this.format.equals(other.format)) {
      return false;
    }
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

  getBytesPerPixel() {
    let fact = 1;
    if (this.format.equals(TextureFormat.FLOAT)) {
      fact = 4;
    }
    else if (this.format.equals(TextureFormat.UNSIGNED_BYTE)) {
      fact = 1;
    }
    else {
      throw new Error("unsupported format: "+this.format.toString());
    }
    return fact*this.channels.size();
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(format, channels, width, height, data) {
    let res = new Texture();
    res.format = format;
    res.channels = Dut.copyImmutableList(channels);
    res.width = width;
    res.height = height;
    res.data = data;
    res.guardInvaritants();
    return res;
  }

  static floatValues(channels, width, height, ...buf) {
    if (Array.isArray(buf)&&buf.length===1&&Array.isArray(buf[0])) {
      buf = buf[0];
    }
    let res = new Texture();
    res.format = TextureFormat.FLOAT;
    res.channels = Dut.copyImmutableList(channels);
    res.width = width;
    res.height = height;
    res.data = DataBlock.fromFloatValues(buf);
    res.guardInvaritants();
    return res;
  }

  static rgbFloatValues(width, height, ...buf) {
    if (Array.isArray(buf)&&buf.length===1&&Array.isArray(buf[0])) {
      buf = buf[0];
    }
    let res = new Texture();
    res.format = TextureFormat.FLOAT;
    res.channels = Texture.RGB;
    res.width = width;
    res.height = height;
    res.data = DataBlock.fromFloatValues(buf);
    res.guardInvaritants();
    return res;
  }

  static rgbFloatPixels(width, height, ...pixels) {
    if (Array.isArray(pixels)&&pixels.length===1&&Array.isArray(pixels[0])) {
      pixels = pixels[0];
    }
    let res = new Texture();
    res.format = TextureFormat.FLOAT;
    res.channels = Texture.RGB;
    res.width = width;
    res.height = height;
    let writer = DataBlockStreamWriter.create(width*height*3*4);
    for (let i = 0; i<pixels.length; ++i) {
      let p = pixels[i];
      writer.writeFloat(p.r());
      writer.writeFloat(p.g());
      writer.writeFloat(p.b());
    }
    res.data = writer.toDataBlock();
    res.guardInvaritants();
    return res;
  }

  static rgbaFloatValues(width, height, ...buf) {
    if (Array.isArray(buf)&&buf.length===1&&Array.isArray(buf[0])) {
      buf = buf[0];
    }
    let res = new Texture();
    res.format = TextureFormat.FLOAT;
    res.channels = Texture.RGBA;
    res.width = width;
    res.height = height;
    res.data = DataBlock.fromFloatValues(buf);
    res.guardInvaritants();
    return res;
  }

  static rgbaFloatPixels(width, height, ...pixels) {
    if (Array.isArray(pixels)&&pixels.length===1&&Array.isArray(pixels[0])) {
      pixels = pixels[0];
    }
    let res = new Texture();
    res.format = TextureFormat.FLOAT;
    res.channels = Texture.RGBA;
    res.width = width;
    res.height = height;
    let writer = DataBlockStreamWriter.create(width*height*4*4);
    for (let i = 0; i<pixels.length; ++i) {
      let p = pixels[i];
      writer.writeFloat(p.r());
      writer.writeFloat(p.g());
      writer.writeFloat(p.b());
      writer.writeFloat(p.a());
    }
    res.data = writer.toDataBlock();
    res.guardInvaritants();
    return res;
  }

  static rgbFloatConstant(width, height, color) {
    let res = new Texture();
    res.format = TextureFormat.FLOAT;
    res.channels = Texture.RGB;
    res.width = width;
    res.height = height;
    let writer = DataBlockStreamWriter.create(width*height*3*4);
    for (let i = 0; i<width*height; ++i) {
      writer.writeFloat(color.r());
      writer.writeFloat(color.g());
      writer.writeFloat(color.b());
    }
    res.data = writer.toDataBlock();
    res.guardInvaritants();
    return res;
  }

  static rgbaFloatConstant(width, height, color) {
    let res = new Texture();
    res.format = TextureFormat.FLOAT;
    res.channels = Texture.RGBA;
    res.width = width;
    res.height = height;
    let writer = DataBlockStreamWriter.create(width*height*4*4);
    for (let i = 0; i<width*height; ++i) {
      writer.writeFloat(color.r());
      writer.writeFloat(color.g());
      writer.writeFloat(color.b());
      writer.writeFloat(color.a());
    }
    res.data = writer.toDataBlock();
    res.guardInvaritants();
    return res;
  }

}
classRegistry.Texture = Texture;
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
classRegistry.TextureId = TextureId;
const createTextureType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
classRegistry.TextureAttachment = TextureAttachment;
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

  static flipVertGammaToUnsignedByte(gamma) {
    return (tex) => {
      return tex.flipVert().powRgb(gamma).toFormat(TextureFormat.UNSIGNED_BYTE);
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

  static toFormat(format) {
    return (tex) => {
      return tex.toFormat(format);
    };
  }

}
classRegistry.TextureFncs = TextureFncs;
const createVertexAttrType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
classRegistry.VertexAttr = VertexAttr;
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
classRegistry.Vertex = Vertex;
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

  getIndex(idx) {
    return this.indices.get(idx);
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
classRegistry.Face = Face;
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
    let other = obj;
    return other.mId.equals(this.mId);
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
classRegistry.MaterialId = MaterialId;
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
classRegistry.MaterialBase = MaterialBase;
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
      throw new Error("ambiguous overload");
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
classRegistry.Material = Material;
class MeshFrame {
  aabb;
  vertexAttrs;
  verticesBlock;
  constructor() {
  }

  getClass() {
    return "MeshFrame";
  }

  guardInvariants() {
  }

  getAabb() {
    return this.aabb;
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
    return this.verticesBlock.size()/4/this.getVertexSize();
  }

  getVerticesBlock() {
    return this.verticesBlock;
  }

  isCompatible(other) {
    if (!this.vertexAttrs.equals(other.vertexAttrs)) {
      return false;
    }
    return this.verticesBlock.size()==other.verticesBlock.size();
  }

  toUnpackedMeshFrame() {
    let vertexSize = this.getVertexSize();
    let vertexByteSize = vertexSize*4;
    let numVertices = this.getNumVertices();
    let vertices = new ArrayList();
    for (let i = 0; i<numVertices; ++i) {
      let varr = [];
      for (let j = 0; j<vertexSize; ++j) {
        varr[j] = this.verticesBlock.getFloat(i*vertexByteSize+j*4);
      }
      vertices.add(Vertex.create(varr));
    }
    return UnpackedMeshFrame.create(this.vertexAttrs, vertices);
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(aabb, vertexAttrs, verticesBlock) {
    let res = new MeshFrame();
    res.aabb = aabb;
    res.vertexAttrs = Dut.copyImmutableList(vertexAttrs);
    res.verticesBlock = verticesBlock;
    res.guardInvariants();
    return res;
  }

  static fabric(aabb, verticesBlock) {
    let res = new MeshFrame();
    res.aabb = aabb;
    res.vertexAttrs = Meshes.FABRIC_VERTEX_ATTRS;
    res.verticesBlock = verticesBlock;
    res.guardInvariants();
    return res;
  }

  static model(aabb, verticesBlock) {
    let res = new MeshFrame();
    res.aabb = aabb;
    res.vertexAttrs = Meshes.MODEL_VERTEX_ATTRS;
    res.verticesBlock = verticesBlock;
    res.guardInvariants();
    return res;
  }

}
classRegistry.MeshFrame = MeshFrame;
class Mesh {
  aabb;
  frames;
  facesBlock;
  constructor() {
  }

  getClass() {
    return "Mesh";
  }

  guardInvariants() {
  }

  getAabb() {
    return this.aabb;
  }

  getVertexAttrs() {
    return this.frames.get(0).getVertexAttrs();
  }

  getVertexSize() {
    return this.frames.get(0).getVertexSize();
  }

  getNumVertices() {
    return this.frames.get(0).getNumVertices();
  }

  getNumFrames() {
    return this.frames.size();
  }

  getFrame(idx) {
    return this.frames.get(idx);
  }

  getFrames() {
    return this.frames;
  }

  getNumFaces() {
    return this.facesBlock.size()/12;
  }

  getFacesBlock() {
    return this.facesBlock;
  }

  plusMeshFrames(other) {
    Guard.equals(this.facesBlock, other.facesBlock, "faces in both meshes must be same");
    let res = new Mesh();
    res.aabb = this.aabb.expand(other.aabb);
    res.frames = Dut.immutableListPlusItems(this.frames, other.frames);
    res.facesBlock = this.facesBlock;
    res.guardInvariants();
    return res;
  }

  toUnpackedMesh() {
    let resFrames = new ArrayList();
    for (let mf of this.frames) {
      resFrames.add(mf.toUnpackedMeshFrame());
    }
    let faces = new ArrayList();
    for (let i = 0; i<this.facesBlock.size(); i=i+12) {
      faces.add(Face.triangle(this.facesBlock.getInt(i), this.facesBlock.getInt(i+4), this.facesBlock.getInt(i+8)));
    }
    return UnpackedMesh.create(resFrames, faces);
  }

  hashCode() {
    return Reflections.hashCode(this);
  }

  equals(obj) {
    return Reflections.equals(this, obj);
  }

  toString() {
  }

  static create(aabb, frames, facesBlock) {
    let res = new Mesh();
    res.aabb = aabb;
    res.frames = Dut.copyImmutableList(frames);
    res.facesBlock = facesBlock;
    res.guardInvariants();
    return res;
  }

  static singleFrame(aabb, frame, facesBlock) {
    let res = new Mesh();
    res.aabb = aabb;
    res.frames = Dut.immutableList(frame);
    res.facesBlock = facesBlock;
    res.guardInvariants();
    return res;
  }

}
classRegistry.Mesh = Mesh;
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
classRegistry.MeshId = MeshId;
class UnpackedMeshFrame {
  vertexAttrs;
  vertices;
  constructor() {
  }

  getClass() {
    return "UnpackedMeshFrame";
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

  calculateAabb() {
    if (this.vertices.isEmpty()||!this.vertexAttrs.contains(VertexAttr.POS3)) {
      return Aabb3.ZERO;
    }
    let minX = Float.POSITIVE_INFINITY;
    let minY = Float.POSITIVE_INFINITY;
    let minZ = Float.POSITIVE_INFINITY;
    let maxX = Float.NEGATIVE_INFINITY;
    let maxY = Float.NEGATIVE_INFINITY;
    let maxZ = Float.NEGATIVE_INFINITY;
    for (let vertex of this.vertices) {
      let offset = 0;
      for (let attr of this.vertexAttrs) {
        if (attr.equals(VertexAttr.POS3)) {
          let x = vertex.coord(offset);
          let y = vertex.coord(offset+1);
          let z = vertex.coord(offset+2);
          minX = FMath.min(minX, x);
          minY = FMath.min(minY, y);
          minZ = FMath.min(minZ, z);
          maxX = FMath.max(maxX, x);
          maxY = FMath.max(maxY, y);
          maxZ = FMath.max(maxZ, z);
        }
        offset = offset+attr.getSize();
      }
    }
    return Aabb3.create(Vec3.create(minX, minY, minZ), Vec3.create(maxX, maxY, maxZ));
  }

  isCompatible(other) {
    if (!this.vertexAttrs.equals(other.vertexAttrs)) {
      return false;
    }
    return this.vertices.size()==other.vertices.size();
  }

  toMeshFrame() {
    let writer = DataBlockStreamWriter.create(this.getVertexSize()*this.getNumVertices()*4);
    for (let ver of this.vertices) {
      for (let i = 0; i<ver.dim(); ++i) {
        writer.writeFloat(ver.coord(i));
      }
    }
    let aabb = this.calculateAabb();
    return MeshFrame.create(aabb, this.vertexAttrs, writer.toDataBlock());
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(vertexAttrs, vertices) {
    let res = new UnpackedMeshFrame();
    res.vertexAttrs = Dut.copyImmutableList(vertexAttrs);
    res.vertices = Dut.copyImmutableList(vertices);
    res.guardInvariants();
    return res;
  }

  static fabric(vertices) {
    let res = new UnpackedMeshFrame();
    res.vertexAttrs = Meshes.FABRIC_VERTEX_ATTRS;
    res.vertices = Dut.copyImmutableList(vertices);
    res.guardInvariants();
    return res;
  }

  static model(vertices) {
    let res = new UnpackedMeshFrame();
    res.vertexAttrs = Meshes.MODEL_VERTEX_ATTRS;
    res.vertices = Dut.copyImmutableList(vertices);
    res.guardInvariants();
    return res;
  }

}
classRegistry.UnpackedMeshFrame = UnpackedMeshFrame;
class UnpackedMesh {
  frames;
  faces;
  constructor() {
  }

  getClass() {
    return "UnpackedMesh";
  }

  guardInvariants() {
  }

  getVertexAttrs() {
    return this.frames.get(0).getVertexAttrs();
  }

  getVertexSize() {
    return this.frames.get(0).getVertexSize();
  }

  getNumVertices() {
    return this.frames.get(0).getNumVertices();
  }

  getNumFrames() {
    return this.frames.size();
  }

  getFrame(idx) {
    return this.frames.get(idx);
  }

  getFrames() {
    return this.frames;
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

  plusFrame(frame) {
    let res = new UnpackedMesh();
    res.frames = Dut.immutableListPlusItem(this.frames, frame);
    res.faces = this.faces;
    res.guardInvariants();
    return res;
  }

  plusUnpackedMeshFrames(other) {
    Guard.equals(this.faces, other.faces, "faces in both meshes must be same");
    let res = new UnpackedMesh();
    res.frames = Dut.immutableListPlusItems(this.frames, other.frames);
    res.faces = this.faces;
    res.guardInvariants();
    return res;
  }

  calculateAabb() {
    if (this.frames.isEmpty()) {
      return Aabb3.ZERO;
    }
    let res = this.frames.get(0).calculateAabb();
    for (let frame of this.frames) {
      res = res.expand(frame.calculateAabb());
    }
    return res;
  }

  toMesh() {
    let resFrames = new ArrayList();
    for (let mf of this.frames) {
      resFrames.add(mf.toMeshFrame());
    }
    let facesWriter = DataBlockStreamWriter.create(12*this.faces.size());
    for (let face of this.faces) {
      Guard.equals(3, face.getNumIndices(), "only triangle faces are supported");
      facesWriter.writeInt(face.getIndex(0));
      facesWriter.writeInt(face.getIndex(1));
      facesWriter.writeInt(face.getIndex(2));
    }
    let aabb = this.calculateAabb();
    return Mesh.create(aabb, resFrames, facesWriter.toDataBlock());
  }

  hashCode() {
    return Reflections.hashCode(this);
  }

  equals(obj) {
    return Reflections.equals(this, obj);
  }

  toString() {
  }

  static create(frames, faces) {
    let res = new UnpackedMesh();
    res.frames = Dut.copyImmutableList(frames);
    res.faces = Dut.copyImmutableList(faces);
    res.guardInvariants();
    return res;
  }

  static singleFrame(frame, faces) {
    let res = new UnpackedMesh();
    res.frames = Dut.immutableList(frame);
    res.faces = Dut.copyImmutableList(faces);
    res.guardInvariants();
    return res;
  }

  static singleFrameModelTriangles(vertices, merge) {
    Guard.positive(vertices.size(), "at least one vertex must be defined");
    Guard.beTrue(vertices.size()%3==0, "number of verftices must be multiplication of 3");
    let keepAllVerts = !merge;
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
    let res = new UnpackedMesh();
    res.frames = Dut.immutableList(UnpackedMeshFrame.model(vts));
    res.faces = Dut.copyImmutableList(fcs);
    res.guardInvariants();
    return res;
  }

}
classRegistry.UnpackedMesh = UnpackedMesh;
class Meshes {
  static FABRIC_VERTEX_ATTRS = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3);
  static MODEL_VERTEX_ATTRS = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3, VertexAttr.TEX2);
  constructor() {
  }

  getClass() {
    return "Meshes";
  }

}
classRegistry.Meshes = Meshes;
class ModelPart {
  mesh;
  material;
  constructor() {
  }

  getClass() {
    return "ModelPart";
  }

  guardInvariants() {
  }

  getMesh() {
    return this.mesh;
  }

  getMaterial() {
    return this.material;
  }

  withMesh(mesh) {
    return ModelPart.of(mesh, this.material);
  }

  withMaterial(material) {
    return ModelPart.of(this.mesh, material);
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static of(mesh, material) {
    let res = new ModelPart();
    res.mesh = mesh;
    res.material = material;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ModelPart = ModelPart;
class Model {
  parts;
  constructor() {
  }

  getClass() {
    return "Model";
  }

  guardInvariants() {
  }

  getParts() {
    return this.parts;
  }

  transformMeshes(fnc) {
    let prts = new ArrayList();
    for (let part of this.parts) {
      prts.add(part.withMesh(fnc(part.getMesh())));
    }
    return Model.of(prts);
  }

  transformMaterials(fnc) {
    let prts = new ArrayList();
    for (let part of this.parts) {
      prts.add(part.withMaterial(fnc(part.getMaterial())));
    }
    return Model.of(prts);
  }

  addPart(part) {
    let prts = Dut.copyList(this.parts);
    prts.add(part);
    return Model.of(prts);
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
    let res = new Model();
    res.parts = Collections.emptyList();
    res.guardInvariants();
    return res;
  }

  static simple(mesh, material) {
    let res = new Model();
    res.parts = Dut.immutableList(ModelPart.of(mesh, material));
    res.guardInvariants();
    return res;
  }

  static of(parts) {
    let res = new Model();
    res.parts = Dut.copyImmutableList(parts);
    res.guardInvariants();
    return res;
  }

}
classRegistry.Model = Model;
class ModelId extends RefId {
  static TYPE = RefIdType.of("MODEL_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "ModelId";
  }

  guardInvariants() {
  }

  type() {
    return ModelId.TYPE;
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
    if (!(obj instanceof ModelId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new ModelId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ModelId = ModelId;
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
      throw new Error("not supported for this case, implement me if you want: "+this);
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
classRegistry.Attenuation = Attenuation;
const createLightType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
classRegistry.LightColor = LightColor;
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
classRegistry.LightCone = LightCone;
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
classRegistry.Light = Light;
const createShadowMapPcfType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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

  withPcfType(pcfType) {
    let res = new ShadowMap();
    res.shadowBuffer = this.shadowBuffer;
    res.pcfType = pcfType;
    res.camera = this.camera;
    res.guardInvaritants();
    return res;
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

  static createDir(shadowBuffer, pos, dir, r, range) {
    let res = new ShadowMap();
    res.shadowBuffer = shadowBuffer;
    res.pcfType = ShadowMapPcfType.GAUSS_55;
    res.camera = Camera.ortho(r*2, r*2, 0, range).lookAt(pos, pos.add(dir), ShadowMap.perp(dir));
    res.guardInvaritants();
    return res;
  }

  static createSpot(shadowBuffer, pos, dir, outTheta, near, range) {
    let res = new ShadowMap();
    res.shadowBuffer = shadowBuffer;
    res.pcfType = ShadowMapPcfType.GAUSS_55;
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
classRegistry.ShadowMap = ShadowMap;
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
classRegistry.BufferId = BufferId;
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
classRegistry.ShadowBufferId = ShadowBufferId;
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
classRegistry.ShadowBuffer = ShadowBuffer;
const createCameraType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
const CameraType = Object.freeze({
  PERSPECTIVE: createCameraType("PERSPECTIVE"),
  ORTHOGRAPHIC: createCameraType("ORTHOGRAPHIC"),
  CUSTOM: createCameraType("CUSTOM"),

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
classRegistry.Camera = Camera;
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
classRegistry.ProxyDisplayDriver = ProxyDisplayDriver;
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
classRegistry.UiPosFncs = UiPosFncs;
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
classRegistry.UiSizeFncs = UiSizeFncs;
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
classRegistry.UiRegionFncs = UiRegionFncs;
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

  static previousPage(pageList) {
    return (evtSource) => {
      pageList.previousPage();
    };
  }

  static nextPage(pageList) {
    return (evtSource) => {
      pageList.nextPage();
    };
  }

  static exitApp(screenManager) {
    return (evtSource) => {
      screenManager.exitApp();
    };
  }

}
classRegistry.UiEventActions = UiEventActions;
class UiActions {
  constructor() {
  }

  getClass() {
    return "UiActions";
  }

  static removeDisplayListener(drivers, listener) {
    return () => {
      drivers.getDriver("DisplayDriver").removeDisplayListener(listener);
    };
  }

}
classRegistry.UiActions = UiActions;
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
      throw new Error("unsupprted horizontal alignment: "+alignment.getHorizontal());
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
      throw new Error("unsupprted vertical alignment: "+alignment.getVertical());
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
classRegistry.UiPainters = UiPainters;
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
      throw new Error("ambiguous overload");
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
classRegistry.StretchUiPainter = StretchUiPainter;
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
    if (drivers.isDriverAvailable("MouseDriver")) {
      drivers.getDriver("MouseDriver").addMouseListener(this);
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
    if (drivers.isDriverAvailable("MouseDriver")) {
      drivers.getDriver("MouseDriver").removeMouseListener(this);
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
    if (!target.isFocusable()) {
      throw new Error("trying to focus on a component that is not focusable");
    }
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
      if (cmp.onKeyPressed(key)) {
        break;
      }
    }
  }

  onKeyReleased(key) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onKeyReleased(key)) {
        break;
      }
    }
  }

  onMouseMove(pos, locked) {
    let hx = pos.x()*this.size.width()/this.size.width();
    let hy = pos.y()*this.size.height()/this.size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onMouseMove(hpos, locked)) {
        break;
      }
    }
  }

  onMouseDown(button, pos) {
    let hx = pos.x()*this.size.width()/this.size.width();
    let hy = pos.y()*this.size.height()/this.size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onMouseDown(button, hpos)) {
        break;
      }
    }
  }

  onMouseUp(button, pos, cancel) {
    let hx = pos.x()*this.size.width()/this.size.width();
    let hy = pos.y()*this.size.height()/this.size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onMouseUp(button, hpos, cancel)) {
        break;
      }
    }
  }

  onTouchStart(id, pos, size) {
    let hx = pos.x()*this.size.width()/size.width();
    let hy = pos.y()*this.size.height()/size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onTouchStart(id, hpos, size)) {
        break;
      }
    }
  }

  onTouchMove(id, pos, size) {
    let hx = pos.x()*this.size.width()/size.width();
    let hy = pos.y()*this.size.height()/size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onTouchMove(id, hpos, size)) {
        break;
      }
    }
  }

  onTouchEnd(id, pos, size, cancel) {
    let hx = pos.x()*this.size.width()/size.width();
    let hy = pos.y()*this.size.height()/size.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onTouchEnd(id, hpos, size, cancel)) {
        break;
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
classRegistry.StretchUi = StretchUi;
class UiComponent {
  hash = Randoms.nextInt(0, 10000000);
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

  isFocusable() {
    return false;
  }

  onFocus() {
  }

  onFocusLost() {
  }

  onKeyPressed(key) {
    return false;
  }

  onKeyReleased(key) {
    return false;
  }

  onMouseMove(pos, locked) {
    return false;
  }

  onMouseDown(button, pos) {
    return false;
  }

  onMouseUp(button, pos, cancel) {
    return false;
  }

  onTouchStart(id, pos, size) {
    return false;
  }

  onTouchMove(id, pos, size) {
    return false;
  }

  onTouchEnd(id, pos, size, cancel) {
    return false;
  }

  hashCode() {
    return this.hash;
  }

  equals(obj) {
    return super.equals(obj);
  }

}
classRegistry.UiComponent = UiComponent;
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
      throw new Error("ambiguous overload");
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
classRegistry.ImageView = ImageView;
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
  downTouch = false;
  trackedTouch = null;
  downKey = false;
  keyCodeMatchers = new ArrayList();
  matchingKeyCodes = new ArrayList();
  pressedKeys = new HashSet();
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
    else if (this.downTouch||this.downKey) {
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
      this.downTouch = true;
    }
    return inside;
  }

  onTouchMove(id, pos, size) {
    if (this.disabled) {
      return false;
    }
    if (this.trackedTouch==null||!id.equals(this.trackedTouch)) {
      return false;
    }
    this.downTouch = this.region.isInside(pos.x(), pos.y());
    return true;
  }

  onTouchEnd(id, pos, size, cancel) {
    if (this.disabled) {
      return false;
    }
    if (this.trackedTouch==null||!id.equals(this.trackedTouch)) {
      return false;
    }
    this.trackedTouch = null;
    this.downTouch = false;
    if (this.region.isInside(pos)&&!cancel&&!this.downKey) {
      for (let action of this.onClickActions) {
        Functions.runUiEventAction(action, this);
      }
    }
    return true;
  }

  onKeyPressed(key) {
    if (this.keyCodeMatchers.isEmpty()||this.pressedKeys.contains(key)) {
      return false;
    }
    this.pressedKeys.add(key);
    if (this.matchingKeyCodes.size()<this.keyCodeMatchers.size()) {
      let mtch = this.keyCodeMatchers.get(this.matchingKeyCodes.size());
      if (Functions.keyCodeMatches(mtch, key)) {
        this.matchingKeyCodes.add(key);
        if (this.matchingKeyCodes.size()==this.keyCodeMatchers.size()) {
          this.downKey = true;
        }
      }
    }
    return false;
  }

  onKeyReleased(key) {
    this.pressedKeys.remove(key);
    if (this.matchingKeyCodes.isEmpty()) {
      return false;
    }
    if (this.downKey&&key.equals(this.matchingKeyCodes.get(this.matchingKeyCodes.size()-1))) {
      if (!this.downTouch) {
        for (let action of this.onClickActions) {
          Functions.runUiEventAction(action, this);
        }
      }
    }
    if (key.equals(this.matchingKeyCodes.get(this.matchingKeyCodes.size()-1))) {
      let newMkc = new ArrayList();
      for (let i = 0; i<this.matchingKeyCodes.size()-1; ++i) {
        newMkc.add(this.matchingKeyCodes.get(i));
      }
      this.matchingKeyCodes = newMkc;
      this.downKey = false;
    }
    else if (this.matchingKeyCodes.contains(key)) {
      this.matchingKeyCodes = new ArrayList();
      this.downKey = false;
    }
    return false;
  }

  onContainerResize(size) {
    this.containerSize = size;
    this.region = Functions.apply(this.regionFnc, size);
  }

  isDown() {
    return this.downTouch||this.downKey;
  }

  isDisabled() {
    return this.disabled;
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.trackedTouch = null;
    if (disabled) {
      this.downTouch = false;
      this.downKey = false;
    }
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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

  setKeyCodeMatchers(keyCodeMatchers) {
    this.keyCodeMatchers = Dut.copyImmutableList(keyCodeMatchers);
    this.matchingKeyCodes = new ArrayList();
    this.downKey = false;
    return this;
  }

  setKeyCodeMatcher(keyCodeMatcher) {
    this.keyCodeMatchers = Dut.immutableList(keyCodeMatcher);
    this.matchingKeyCodes = new ArrayList();
    this.downKey = false;
    return this;
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
classRegistry.ImageButton = ImageButton;
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
  keyCodeMatchers = new ArrayList();
  matchingKeyCodes = new ArrayList();
  pressedKeys = new HashSet();
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
    if (this.trackedTouch==null||!id.equals(this.trackedTouch)) {
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
    if (this.trackedTouch==null||!id.equals(this.trackedTouch)) {
      return false;
    }
    this.trackedTouch = null;
    if (this.region.isInside(pos.x(), pos.y())&&!cancel) {
      this.toggledDown = !this.toggledDown;
      this.down = this.toggledDown;
      for (let action of this.onToggleActions) {
        Functions.runUiEventAction(action, this);
      }
    }
    this.down = this.toggledDown;
    return true;
  }

  onKeyPressed(key) {
    if (this.keyCodeMatchers.isEmpty()||this.pressedKeys.contains(key)) {
      return false;
    }
    this.pressedKeys.add(key);
    if (this.matchingKeyCodes.size()<this.keyCodeMatchers.size()) {
      let mtch = this.keyCodeMatchers.get(this.matchingKeyCodes.size());
      if (Functions.keyCodeMatches(mtch, key)) {
        this.matchingKeyCodes.add(key);
        if (this.matchingKeyCodes.size()==this.keyCodeMatchers.size()) {
          this.toggledDown = !this.toggledDown;
          this.down = this.toggledDown;
          for (let action of this.onToggleActions) {
            Functions.runUiEventAction(action, this);
          }
        }
      }
    }
    return false;
  }

  onKeyReleased(key) {
    this.pressedKeys.remove(key);
    if (this.matchingKeyCodes.isEmpty()) {
      return false;
    }
    if (key.equals(this.matchingKeyCodes.get(this.matchingKeyCodes.size()-1))) {
      let newMkc = new ArrayList();
      for (let i = 0; i<this.matchingKeyCodes.size()-1; ++i) {
        newMkc.add(this.matchingKeyCodes.get(i));
      }
      this.matchingKeyCodes = newMkc;
    }
    else if (this.matchingKeyCodes.contains(key)) {
      this.matchingKeyCodes = new ArrayList();
    }
    return false;
  }

  onContainerResize(size) {
    this.containerSize = size;
    this.region = Functions.apply(this.regionFnc, size);
  }

  toggleDown() {
    if (this.toggledDown) {
      return ;
    }
    this.toggledDown = true;
    this.down = true;
    this.trackedTouch = null;
    for (let action of this.onToggleActions) {
      Functions.runUiEventAction(action, this);
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
      Functions.runUiEventAction(action, this);
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
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

  setKeyCodeMatchers(keyCodeMatchers) {
    this.keyCodeMatchers = Dut.copyImmutableList(keyCodeMatchers);
    this.matchingKeyCodes = new ArrayList();
    return this;
  }

  setKeyCodeMatcher(keyCodeMatcher) {
    this.keyCodeMatchers = Dut.immutableList(keyCodeMatcher);
    this.matchingKeyCodes = new ArrayList();
    return this;
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
    res.region = Functions.apply(res.regionFnc, res.containerSize);
    res.onToggleActions = new HashSet();
    res.guardInvariants();
    return res;
  }

}
classRegistry.ImageToggleButton = ImageToggleButton;
class Joystick extends UiComponent {
  baseTexture;
  topTexture;
  regionFnc;
  containerSize;
  region;
  radius;
  trackedTouch = null;
  dirTouch = Vec2.ZERO;
  upKeyCodeMatcher = null;
  downKeyCodeMatcher = null;
  leftKeyCodeMatcher = null;
  rightKeyCodeMatcher = null;
  dirKey = Vec2.ZERO;
  pressedKeys = new HashSet();
  constructor() {
    super();
  }

  getClass() {
    return "Joystick";
  }

  guardInvariants() {
  }

  move(dt) {
  }

  draw(painter) {
    let dir = this.getDir();
    painter.drawImage(this.baseTexture, this.region, TextureStyle.PIXEL_EDGE);
    let inreg = Rect2.create(this.region.x()+this.region.width()*0.125+dir.x()*this.radius.x(), this.region.y()+this.region.height()*0.125-dir.y()*this.radius.y(), this.region.width()*0.75, this.region.height()*0.75);
    painter.drawImage(this.topTexture, inreg, TextureStyle.PIXEL_EDGE);
  }

  onTouchStart(id, pos, size) {
    if (this.trackedTouch!=null) {
      return false;
    }
    if (!this.region.isInside(pos)) {
      return false;
    }
    this.trackedTouch = id;
    this.dirTouch = this.calculateDirectionTouch(pos);
    return true;
  }

  onTouchMove(id, pos, size) {
    if (this.trackedTouch==null||!id.equals(this.trackedTouch)) {
      return false;
    }
    this.dirTouch = this.calculateDirectionTouch(pos);
    return true;
  }

  onTouchEnd(id, pos, size, cancel) {
    if (this.trackedTouch==null||!id.equals(this.trackedTouch)) {
      return false;
    }
    this.trackedTouch = null;
    this.dirTouch = Vec2.ZERO;
    return true;
  }

  onKeyPressed(key) {
    if (this.pressedKeys.contains(key)) {
      return false;
    }
    this.pressedKeys.add(key);
    this.dirKey = this.calculateDirectionKeys(this.pressedKeys);
    return false;
  }

  onKeyReleased(key) {
    this.pressedKeys.remove(key);
    this.dirKey = this.calculateDirectionKeys(this.pressedKeys);
    return false;
  }

  getDir() {
    return this.dirKey.equals(Vec2.ZERO)?this.dirTouch:this.dirKey;
  }

  onContainerResize(size) {
    this.containerSize = size;
    this.region = Functions.apply(this.regionFnc, size);
    this.radius = Vec2.create(this.region.width()*0.25, this.region.height()*0.25);
  }

  setBaseTexture() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return this.setBaseTexture_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.setBaseTexture_1_string(arguments[0]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setBaseTexture_1_TextureId(baseTexture) {
    this.baseTexture = baseTexture;
    return this;
  }

  setBaseTexture_1_string(baseTexture) {
    return this.setBaseTexture(TextureId.of(baseTexture));
  }

  setTopTexture() {
    if (arguments.length===1&&arguments[0] instanceof TextureId) {
      return this.setTopTexture_1_TextureId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.setTopTexture_1_string(arguments[0]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setTopTexture_1_TextureId(topTexture) {
    this.topTexture = topTexture;
    return this;
  }

  setTopTexture_1_string(topTexture) {
    return this.setTopTexture(TextureId.of(topTexture));
  }

  setRegionFnc(regionFnc) {
    Guard.notNull(regionFnc, "regionFnc cannot be null");
    this.regionFnc = regionFnc;
    this.onContainerResize(this.containerSize);
    return this;
  }

  setKeyCodeMatchers(upKeyCodeMatcher, downKeyCodeMatcher, leftKeyCodeMatcher, rightKeyCodeMatcher) {
    if (upKeyCodeMatcher==null) {
      Guard.beNull(upKeyCodeMatcher, "all or no matchers have to be null");
      Guard.beNull(downKeyCodeMatcher, "all or no matchers have to be null");
      Guard.beNull(leftKeyCodeMatcher, "all or no matchers have to be null");
      Guard.beNull(rightKeyCodeMatcher, "all or no matchers have to be null");
    }
    else {
      Guard.notNull(upKeyCodeMatcher, "all or no matchers have to be null");
      Guard.notNull(downKeyCodeMatcher, "all or no matchers have to be null");
      Guard.notNull(leftKeyCodeMatcher, "all or no matchers have to be null");
      Guard.notNull(rightKeyCodeMatcher, "all or no matchers have to be null");
    }
    this.upKeyCodeMatcher = upKeyCodeMatcher;
    this.downKeyCodeMatcher = downKeyCodeMatcher;
    this.leftKeyCodeMatcher = leftKeyCodeMatcher;
    this.rightKeyCodeMatcher = rightKeyCodeMatcher;
    return this;
  }

  calculateDirectionTouch(pos) {
    let cx = this.region.centerX();
    let cy = this.region.centerY();
    let res = Vec2.create((pos.x()-cx)/this.radius.x(), (cy-pos.y())/this.radius.y());
    if (res.mag()>1) {
      res = res.normalize();
    }
    return res;
  }

  calculateDirectionKeys(keys) {
    if (keys.isEmpty()||this.upKeyCodeMatcher==null) {
      return Vec2.ZERO;
    }
    let res = Vec2.ZERO;
    for (let key of keys) {
      if (Functions.keyCodeMatches(this.upKeyCodeMatcher, key)) {
        res = res.add(Vec2.create(0, 1));
        break;
      }
    }
    for (let key of keys) {
      if (Functions.keyCodeMatches(this.downKeyCodeMatcher, key)) {
        res = res.add(Vec2.create(0, -1));
        break;
      }
    }
    for (let key of keys) {
      if (Functions.keyCodeMatches(this.leftKeyCodeMatcher, key)) {
        res = res.add(Vec2.create(-1, 0));
        break;
      }
    }
    for (let key of keys) {
      if (Functions.keyCodeMatches(this.rightKeyCodeMatcher, key)) {
        res = res.add(Vec2.create(1, 0));
        break;
      }
    }
    if (res.mag()>1) {
      res = res.normalize();
    }
    return res;
  }

  toString() {
  }

  static create() {
    let res = new Joystick();
    res.baseTexture = TextureId.of("joystick-base");
    res.topTexture = TextureId.of("joystick-top");
    res.regionFnc = UiRegionFncs.center(100, 25);
    res.containerSize = Size2.create(1, 1);
    res.region = Functions.apply(res.regionFnc, res.containerSize);
    res.radius = Vec2.create(res.region.width()*0.25, res.region.height()*0.25);
    res.guardInvariants();
    return res;
  }

}
classRegistry.Joystick = Joystick;
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
classRegistry.Label = Label;
class PanelPainter {
  target;
  region;
  innerSize;
  clipRegion = true;
  fullyClipped = false;
  constructor() {
  }

  getClass() {
    return "PanelPainter";
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
      throw new Error("ambiguous overload");
    }
  }

  drawImage_6_TextureId_number_number_number_number_TextureStyle(img, x, y, width, height, style) {
    if (this.fullyClipped||this.innerSize.width()==0||this.innerSize.height()==0) {
      return ;
    }
    let nx = this.region.x()+x*this.region.width()/this.innerSize.width();
    let ny = this.region.y()+y*this.region.height()/this.innerSize.height();
    let nw = width*this.region.width()/this.innerSize.width();
    let nh = height*this.region.height()/this.innerSize.height();
    this.target.drawImage(img, nx, ny, nw, nh, style);
  }

  drawImage_3_TextureId_Rect2_TextureStyle(img, region, style) {
    this.drawImage(img, region.x(), region.y(), region.width(), region.height(), style);
  }

  drawText(text, font, pos, alignment) {
    UiPainters.drawText(this, text, font, pos, alignment);
  }

  fillRect(rect, color) {
    if (this.fullyClipped||this.innerSize.width()==0||this.innerSize.height()==0) {
      return ;
    }
    let normRect = Rect2.create(this.region.x()+rect.x()*this.region.width()/this.innerSize.width(), this.region.y()+rect.y()*this.region.height()/this.innerSize.height(), rect.width()*this.region.width()/this.innerSize.width(), rect.height()*this.region.height()/this.innerSize.height());
    this.target.fillRect(normRect, color);
  }

  drawLine(start, end, color) {
    if (this.fullyClipped||this.innerSize.width()==0||this.innerSize.height()==0) {
      return ;
    }
    let normStart = Vec2.create(this.region.x()+start.x()*this.region.width()/this.innerSize.width(), this.region.y()+start.y()*this.region.height()/this.innerSize.height());
    let normEnd = Vec2.create(this.region.x()+end.x()*this.region.width()/this.innerSize.width(), this.region.y()+end.y()*this.region.height()/this.innerSize.height());
    this.target.drawLine(normStart, normEnd, color);
  }

  setClipRect(rect) {
    let normRect = Rect2.create(this.region.x()+rect.x()*this.region.width()/this.innerSize.width(), this.region.y()+rect.y()*this.region.height()/this.innerSize.height(), rect.width()*this.region.width()/this.innerSize.width(), rect.height()*this.region.height()/this.innerSize.height());
    if (this.clipRegion) {
      if (this.region.isIntersect(normRect)) {
        this.fullyClipped = false;
        this.target.setClipRect(this.region.intersect(normRect));
      }
      else {
        this.fullyClipped = true;
      }
    }
    else {
      this.fullyClipped = false;
      this.target.setClipRect(normRect);
    }
  }

  unsetClipRect() {
    this.fullyClipped = false;
    if (this.clipRegion) {
      this.target.setClipRect(this.region);
    }
    else {
      this.target.unsetClipRect();
    }
  }

  getFont(id) {
    return this.target.getFont(id);
  }

  toString() {
  }

  static create(target, region, innerSize, clipRegion) {
    let res = new PanelPainter();
    res.target = target;
    res.region = region;
    res.innerSize = innerSize;
    res.clipRegion = clipRegion;
    res.guardInvariants();
    return res;
  }

}
classRegistry.PanelPainter = PanelPainter;
class Panel extends UiComponent {
  controller;
  borderColor;
  bgColor;
  clipRegion = true;
  doubleClickInterval;
  regionFnc;
  innerSizeFnc;
  containerSize;
  region;
  innerSize;
  components = new ArrayList();
  trackedTouches = new HashSet();
  lastClickTime = 0;
  onClickActions = new HashSet();
  onDoubleClickActions = new HashSet();
  time = 0;
  constructor() {
    super();
  }

  getClass() {
    return "Panel";
  }

  guardInvariants() {
  }

  init(controller) {
    this.controller = controller;
  }

  move(dt) {
    this.time = this.time+dt;
    for (let cmp of this.components) {
      cmp.move(dt);
    }
  }

  draw(painter) {
    let painterWrapper = PanelPainter.create(painter, this.region, this.innerSize, this.clipRegion);
    if (this.bgColor.a()>0) {
      painter.fillRect(this.region, this.bgColor);
    }
    if (this.clipRegion) {
      painter.setClipRect(this.region);
    }
    for (let cmp of this.components) {
      cmp.draw(painterWrapper);
    }
    if (this.clipRegion) {
      painter.unsetClipRect();
    }
    let p1 = Vec2.create(this.region.x(), this.region.y());
    let p2 = Vec2.create(this.region.x()+this.region.width(), this.region.y());
    let p3 = Vec2.create(this.region.x()+this.region.width(), this.region.y()+this.region.height());
    let p4 = Vec2.create(this.region.x(), this.region.y()+this.region.height());
    if (this.borderColor.a()>0) {
      painter.drawLine(p1, p2, this.borderColor);
      painter.drawLine(p2, p3, this.borderColor);
      painter.drawLine(p3, p4, this.borderColor);
      painter.drawLine(p4, p1, this.borderColor);
    }
  }

  onContainerResize(size) {
    this.containerSize = size;
    this.region = Functions.apply(this.regionFnc, size);
    this.innerSize = Functions.apply(this.innerSizeFnc, this.region.size());
    for (let cmp of this.components) {
      cmp.onContainerResize(this.innerSize);
    }
  }

  requestFocus(target) {
    return this.controller.requestFocus(target);
  }

  getFocused() {
    return this.controller.getFocused();
  }

  onKeyPressed(key) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onKeyPressed(key)) {
        return true;
      }
    }
    return false;
  }

  onKeyReleased(key) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onKeyReleased(key)) {
        return true;
      }
    }
    return false;
  }

  onTouchStart(id, pos, size) {
    let hx = (pos.x()-this.region.x())*this.innerSize.width()/this.region.width();
    let hy = (pos.y()-this.region.y())*this.innerSize.height()/this.region.height();
    let hpos = Pos2.create(hx, hy);
    let inside = this.region.isInside(pos);
    let res = false;
    if (inside) {
      if (inside) {
        this.trackedTouches.add(id);
        res = true;
      }
      for (let i = this.components.size()-1; i>=0; --i) {
        let cmp = this.components.get(i);
        if (cmp.onTouchStart(id, hpos, this.innerSize)) {
          return true;
        }
      }
    }
    return res;
  }

  onTouchMove(id, pos, size) {
    if (!this.trackedTouches.contains(id)) {
      return false;
    }
    let hx = (pos.x()-this.region.x())*this.innerSize.width()/this.region.width();
    let hy = (pos.y()-this.region.y())*this.innerSize.height()/this.region.height();
    let hpos = Pos2.create(hx, hy);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onTouchMove(id, hpos, this.innerSize)) {
        return true;
      }
    }
    return false;
  }

  onTouchEnd(id, pos, size, cancel) {
    if (!this.trackedTouches.contains(id)) {
      return false;
    }
    if (!this.region.isInside(pos)) {
      cancel = true;
    }
    let hx = (pos.x()-this.region.x())*this.innerSize.width()/this.region.width();
    let hy = (pos.y()-this.region.y())*this.innerSize.height()/this.region.height();
    let hpos = Pos2.create(hx, hy);
    this.trackedTouches.remove(id);
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onTouchEnd(id, hpos, this.innerSize, cancel)) {
        return true;
      }
    }
    if (this.region.isInside(pos)&&!cancel) {
      for (let action of this.onClickActions) {
        Functions.runUiEventAction(action, this);
      }
      let diff = this.time-this.lastClickTime;
      this.lastClickTime = this.time;
      if (diff<this.doubleClickInterval) {
        for (let action of this.onDoubleClickActions) {
          Functions.runUiEventAction(action, this);
        }
      }
      return true;
    }
    return false;
  }

  setBorderColor(borderColor) {
    Guard.notNull(borderColor, "borderColor cannot be null");
    this.borderColor = borderColor;
    return this;
  }

  setBgColor(bgColor) {
    Guard.notNull(bgColor, "bgColor cannot be null");
    this.bgColor = bgColor;
    return this;
  }

  setClipRegion(clipRegion) {
    this.clipRegion = clipRegion;
    return this;
  }

  setRegionFnc(regionFnc) {
    Guard.notNull(regionFnc, "regionFnc cannot be null");
    this.regionFnc = regionFnc;
    this.onContainerResize(this.containerSize);
    return this;
  }

  setInnerSizeFnc(innerSizeFnc) {
    Guard.notNull(innerSizeFnc, "innerSizeFnc cannot be null");
    this.innerSizeFnc = innerSizeFnc;
    this.onContainerResize(this.containerSize);
    return this;
  }

  addComponent(component) {
    Guard.notNull(component, "component cannot be null");
    this.components.add(component);
    component.init(this);
    component.onContainerResize(this.innerSize);
    return this;
  }

  removeComponent(component) {
    this.components.remove(component);
    return this;
  }

  empty() {
    this.components.clear();
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

  addOnDoubleClickAction(action) {
    Guard.notNull(action, "action cannot be null");
    this.onDoubleClickActions.add(action);
    return this;
  }

  removeOnDoubleClickAction(action) {
    this.onDoubleClickActions.remove(action);
    return this;
  }

  toString() {
  }

  static create() {
    let res = new Panel();
    res.borderColor = Rgba.create(0.8, 0.8, 0.8, 1);
    res.bgColor = Rgba.create(0.2, 0.2, 0.2, 1);
    res.clipRegion = true;
    res.doubleClickInterval = 0.5;
    res.regionFnc = UiRegionFncs.center(100, 25);
    res.innerSizeFnc = UiSizeFncs.identity();
    res.containerSize = Size2.create(1, 1);
    res.region = Functions.apply(res.regionFnc, res.containerSize);
    res.innerSize = Functions.apply(res.innerSizeFnc, res.region.size());
    res.guardInvariants();
    return res;
  }

}
classRegistry.Panel = Panel;
class Page extends UiComponent {
  controller;
  containerSize;
  components = new ArrayList();
  lock = new Object();
  constructor() {
    super();
  }

  getClass() {
    return "Page";
  }

  guardInvariants() {
  }

  addComponent(component) {
    Guard.notNull(component, "component cannot be null");
    this.components.add(component);
    component.init(this);
    component.onContainerResize(this.containerSize);
    return this;
  }

  removeComponent(component) {
    this.components.remove(component);
    return this;
  }

  init(controller) {
    this.controller = controller;
  }

  move(dt) {
    for (let cmp of this.components) {
      cmp.move(dt);
    }
  }

  draw(painter) {
    for (let cmp of this.components) {
      cmp.draw(painter);
    }
  }

  requestFocus(target) {
    return this.controller.requestFocus(target);
  }

  getFocused() {
    return this.controller.getFocused();
  }

  onKeyPressed(key) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onKeyPressed(key)) {
        return true;
      }
    }
    return false;
  }

  onKeyReleased(key) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onKeyReleased(key)) {
        return true;
      }
    }
    return false;
  }

  onTouchStart(id, pos, size) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onTouchStart(id, pos, size)) {
        return true;
      }
    }
    return false;
  }

  onTouchMove(id, pos, size) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onTouchMove(id, pos, size)) {
        return true;
      }
    }
    return false;
  }

  onTouchEnd(id, pos, size, cancel) {
    for (let i = this.components.size()-1; i>=0; --i) {
      let cmp = this.components.get(i);
      if (cmp.onTouchEnd(id, pos, size, cancel)) {
        return true;
      }
    }
    return false;
  }

  onContainerResize(size) {
    this.containerSize = size;
    for (let cmp of this.components) {
      cmp.onContainerResize(this.containerSize);
    }
  }

  toString() {
  }

  static create() {
    let res = new Page();
    res.containerSize = Size2.create(1, 1);
    res.guardInvariants();
    return res;
  }

}
classRegistry.Page = Page;
class PageList extends UiComponent {
  controller;
  pages = new ArrayList();
  active = 0;
  containerSize = Size2.create(1, 1);
  trackedTouches = new HashSet();
  constructor() {
    super();
  }

  getClass() {
    return "PageList";
  }

  guardInvariants() {
  }

  init(controller) {
    this.controller = controller;
  }

  move(dt) {
    if (this.pages.isEmpty()) {
      return ;
    }
    this.pages.get(this.active).move(dt);
  }

  draw(painter) {
    if (this.pages.isEmpty()) {
      return ;
    }
    this.pages.get(this.active).draw(painter);
  }

  requestFocus(target) {
    return this.controller.requestFocus(target);
  }

  getFocused() {
    return this.controller.getFocused();
  }

  onTouchStart(id, pos, size) {
    if (this.pages.isEmpty()) {
      return false;
    }
    this.trackedTouches.add(id);
    return this.pages.get(this.active).onTouchStart(id, pos, size);
  }

  onTouchMove(id, pos, size) {
    if (this.pages.isEmpty()) {
      return false;
    }
    return this.pages.get(this.active).onTouchMove(id, pos, size);
  }

  onTouchEnd(id, pos, size, cancel) {
    if (this.pages.isEmpty()) {
      return false;
    }
    this.trackedTouches.remove(id);
    return this.pages.get(this.active).onTouchEnd(id, pos, size, cancel);
  }

  onKeyPressed(key) {
    if (this.pages.isEmpty()) {
      return false;
    }
    return this.pages.get(this.active).onKeyPressed(key);
  }

  onKeyReleased(key) {
    if (this.pages.isEmpty()) {
      return false;
    }
    return this.pages.get(this.active).onKeyReleased(key);
  }

  onContainerResize(size) {
    this.containerSize = size;
    if (this.pages.isEmpty()) {
      return ;
    }
    this.pages.get(this.active).onContainerResize(size);
  }

  addPage(page) {
    this.pages.add(page);
    page.init(this);
    return this;
  }

  getPage(idx) {
    return this.pages.get(idx);
  }

  getActivePage() {
    if (this.pages.isEmpty()) {
      return null;
    }
    return this.pages.get(this.active);
  }

  setActivePage(idx) {
    this.cancelTrackedTouches();
    this.active = idx;
    this.pages.get(this.active).onContainerResize(this.containerSize);
  }

  previousPage() {
    if (this.pages.isEmpty()) {
      return ;
    }
    this.cancelTrackedTouches();
    this.active = this.active-1;
    if (this.active<0) {
      this.active = this.pages.size()-1;
    }
    this.pages.get(this.active).onContainerResize(this.containerSize);
  }

  nextPage() {
    if (this.pages.isEmpty()) {
      return ;
    }
    this.cancelTrackedTouches();
    this.active = this.active+1;
    if (this.active>=this.pages.size()) {
      this.active = 0;
    }
    this.pages.get(this.active).onContainerResize(this.containerSize);
  }

  cancelTrackedTouches() {
    if (this.getActivePage()==null) {
      return ;
    }
    for (let id of this.trackedTouches) {
      this.getActivePage().onTouchEnd(id, Pos2.ZERO, this.containerSize, true);
    }
    this.trackedTouches.clear();
  }

  toString() {
  }

  static create() {
    let res = new PageList();
    res.guardInvariants();
    return res;
  }

}
classRegistry.PageList = PageList;
const createTextAlignmentHorizontal = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
    name() {
      return this.symbol.description;
    },
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
classRegistry.TextAlignment = TextAlignment;
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
      throw new Error("ambiguous overload");
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
classRegistry.Character = Character;
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
classRegistry.FontId = FontId;
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
      throw new Error("character is registered in the font: "+ch);
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
classRegistry.Font = Font;
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
    let dataBlock = loader.loadFile(file);
    let doc = null;
    let is = dataBlock.createStream();
    try {
      let fact = DocumentBuilderFactory.newInstance();
      let bld = fact.newDocumentBuilder();
      doc = bld.parse(is);
      is.close();
      is = null;
    }
    catch (e) {
      throw new Error(e);
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
classRegistry.Fonts = Fonts;
class Clip {
  frames;
  constructor() {
  }

  getClass() {
    return "Clip";
  }

  guardInvaritants() {
    Guard.notNullCollection(this.frames, "frames cannot have null element");
    Guard.beTrue(this.frames.size()>=2, "at least 2 frames must be defined");
  }

  getNumFrames() {
    return this.frames.size();
  }

  getFrames() {
    return this.frames;
  }

  getFrame(idx) {
    return this.frames.get(idx);
  }

  hashCode() {
    return this.frames.hashCode();
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof Clip)) {
      return false;
    }
    let other = obj;
    return this.frames.equals(other.frames);
  }

  toString() {
  }

  static create(frames) {
    let res = new Clip();
    res.frames = Dut.copyImmutableList(frames);
    res.guardInvaritants();
    return res;
  }

  static simple(...frames) {
    if (Array.isArray(frames)&&frames.length===1&&Array.isArray(frames[0])) {
      frames = frames[0];
    }
    let list = new ArrayList(frames.length);
    for (let f of frames) {
      list.add(f);
    }
    return Clip.create(list);
  }

}
classRegistry.Clip = Clip;
class ClipAnimationTrigger {
  time;
  triggers;
  constructor() {
  }

  getClass() {
    return "ClipAnimationTrigger";
  }

  guardInvaritants() {
    Guard.notNegative(this.time, "time cannot be negative");
    Guard.notEmptyStringCollection(this.triggers, "triggers cannot have empty element");
  }

  getTime() {
    return this.time;
  }

  getTriggers() {
    return this.triggers;
  }

  merge(other) {
    Guard.equals(this.time, other.time, "triggers must have same time, otherwise cannot merge");
    let res = new ClipAnimationTrigger();
    res.time = this.time;
    let trgs = new HashSet();
    trgs.addAll(this.triggers);
    trgs.addAll(other.triggers);
    res.triggers = Collections.unmodifiableSet(trgs);
    res.guardInvaritants();
    return res;
  }

  hashCode() {
    return (7*this.time)+13*this.triggers.hashCode();
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof ClipAnimationTrigger)) {
      return false;
    }
    let other = obj;
    return this.time==other.time&&this.triggers.equals(other.triggers);
  }

  toString() {
  }

  static single(time, trigger) {
    let res = new ClipAnimationTrigger();
    res.time = time;
    res.triggers = Dut.immutableSet(trigger);
    res.guardInvaritants();
    return res;
  }

  static multiple(time, triggers) {
    let res = new ClipAnimationTrigger();
    res.time = time;
    res.triggers = Dut.copyImmutableSet(triggers);
    res.guardInvaritants();
    return res;
  }

}
classRegistry.ClipAnimationTrigger = ClipAnimationTrigger;
class ClipAnimation {
  clip;
  duration;
  loop;
  triggers;
  constructor() {
  }

  getClass() {
    return "ClipAnimation";
  }

  guardInvariants() {
  }

  getClip() {
    return this.clip;
  }

  isLoop() {
    return this.loop;
  }

  getDuration() {
    return this.duration;
  }

  getTriggers() {
    if (arguments.length===0) {
      return this.getTriggers_0();
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return this.getTriggers_2_number_number(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getTriggers_0() {
    return this.triggers;
  }

  getTriggers_2_number_number(tStart, tEnd) {
    if (this.triggers.isEmpty()) {
      return Collections.emptySet();
    }
    if (tStart<0||tEnd<0||tEnd<tStart) {
      throw new Error("tStart or tEnd cannot be negative, and tStart must be <= tEnd: "+tStart+", "+tEnd);
    }
    if (this.loop) {
      if (tEnd-tStart>=this.duration) {
        let res = new HashSet();
        for (let t of this.triggers) {
          res.addAll(t.getTriggers());
        }
        return res;
      }
      tStart = tStart%this.duration;
      tEnd = tEnd%this.duration;
    }
    if (tEnd<=tStart) {
      let res = new HashSet();
      for (let t of this.triggers) {
        if (t.getTime()<tEnd||t.getTime()>=tStart) {
          res.addAll(t.getTriggers());
        }
      }
      return res;
    }
    else {
      let res = new HashSet();
      for (let t of this.triggers) {
        if (t.getTime()>=tStart&&t.getTime()<tEnd) {
          res.addAll(t.getTriggers());
        }
      }
      return res;
    }
  }

  interpolate(t) {
    if (this.loop) {
      t = t%this.duration;
      t = t<0?t+this.duration:t;
    }
    Guard.beTrue(t>=0&&t<=this.duration, "t must be in [0, duration] interval");
    if (t==0) {
      let frame = this.clip.getFrame(0);
      return Interpolation.create(frame, frame, 0);
    }
    if (t==this.duration) {
      let frame = this.clip.getFrame(this.clip.getNumFrames()-1);
      return Interpolation.create(frame, frame, 0);
    }
    let frameTime = this.duration/(this.clip.getNumFrames()-1);
    let sfidx = FMath.trunc(t/frameTime);
    let intt = (t-(frameTime*sfidx))/frameTime;
    intt = intt<0?0:(intt>1?1:intt);
    return Interpolation.create(this.clip.getFrame(sfidx), this.clip.getFrame(sfidx+1), intt);
  }

  withAddedTrigger() {
    if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="string") {
      return this.withAddedTrigger_2_number_string(arguments[0], arguments[1]);
    }
    else if (arguments.length===1&&arguments[0] instanceof ClipAnimationTrigger) {
      return this.withAddedTrigger_1_ClipAnimationTrigger(arguments[0]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  withAddedTrigger_2_number_string(time, trigger) {
    return this.withAddedTrigger(ClipAnimationTrigger.single(time, trigger));
  }

  withAddedTrigger_1_ClipAnimationTrigger(trigger) {
    let added = false;
    let trgs = new ArrayList();
    for (let tr of this.triggers) {
      if (!added&&trigger.getTime()<tr.getTime()) {
        trgs.add(trigger);
        trgs.add(tr);
        added = true;
      }
      else if (!added&&tr.getTime()==trigger.getTime()) {
        trgs.add(tr.merge(trigger));
        added = true;
      }
      else {
        trgs.add(tr);
      }
    }
    if (!added) {
      trgs.add(trigger);
    }
    let res = new ClipAnimation();
    res.clip = this.clip;
    res.duration = this.duration;
    res.loop = this.loop;
    res.triggers = Collections.unmodifiableList(trgs);
    res.guardInvariants();
    return res;
  }

  withAddedTriggers(triggers) {
    let res = this;
    for (let tr of triggers) {
      res = res.withAddedTrigger(tr);
    }
    return res;
  }

  hashCode() {
    return this.clip.hashCode()+(7*this.duration)+13*this.triggers.hashCode();
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof ClipAnimation)) {
      return false;
    }
    let other = obj;
    return this.clip.equals(other.clip)&&this.duration==other.duration&&this.loop==other.loop&&this.triggers.equals(other.triggers);
  }

  toString() {
  }

  static create(clip, duration, loop) {
    let res = new ClipAnimation();
    res.clip = clip;
    res.duration = duration;
    res.loop = loop;
    res.triggers = Collections.emptyList();
    res.guardInvariants();
    return res;
  }

}
classRegistry.ClipAnimation = ClipAnimation;
class ClipAnimationCollectionId extends RefId {
  static TYPE = RefIdType.of("CLIP_ANIMATION_COLLECTION_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "ClipAnimationCollectionId";
  }

  guardInvariants() {
  }

  type() {
    return ClipAnimationCollectionId.TYPE;
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
    if (!(obj instanceof ClipAnimationCollectionId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new ClipAnimationCollectionId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ClipAnimationCollectionId = ClipAnimationCollectionId;
class ClipAnimationCollection {
  animations;
  constructor() {
  }

  getClass() {
    return "ClipAnimationCollection";
  }

  guardInvariants() {
  }

  getAnimations() {
    return this.animations;
  }

  getAnimation(key) {
    let res = this.animations.get(key);
    Guard.notNull(res, "no animation under key: "+key);
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

  static create(animations) {
    let res = new ClipAnimationCollection();
    res.animations = Dut.copyImmutableMap(animations);
    res.guardInvariants();
    return res;
  }

}
classRegistry.ClipAnimationCollection = ClipAnimationCollection;
class ClipAnimationPlayer {
  collection;
  animationKey = null;
  animation = null;
  time = 0;
  constructor() {
  }

  getClass() {
    return "ClipAnimationPlayer";
  }

  guardInvariants() {
  }

  move(dt) {
    let st = this.time;
    this.time = this.time+dt;
    let triggers = this.animation.getTriggers(st, this.time);
    return triggers;
  }

  play(key) {
    if (this.animationKey.equals(key)) {
      return ;
    }
    this.animationKey = key;
    this.animation = this.collection.getAnimation(key);
    this.time = 0;
  }

  playFromStart(key) {
    this.animationKey = key;
    this.animation = this.collection.getAnimation(key);
    this.time = 0;
  }

  isAnimationEnd() {
    if (this.animation.isLoop()) {
      return false;
    }
    return this.time>=this.animation.getDuration();
  }

  getAnimationKey() {
    return this.animationKey;
  }

  getTime() {
    return this.time;
  }

  getInterpolation() {
    if (!this.animation.isLoop()&&this.time>this.animation.getDuration()) {
      return this.animation.interpolate(this.animation.getDuration());
    }
    return this.animation.interpolate(this.time);
  }

  toString() {
  }

  static create(start, collection) {
    let res = new ClipAnimationPlayer();
    res.collection = collection;
    res.animationKey = start;
    res.animation = collection.getAnimation(start);
    res.time = 0;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ClipAnimationPlayer = ClipAnimationPlayer;
const createTextureWrapType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
    name() {
      return this.symbol.description;
    },
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
classRegistry.TextureStyle = TextureStyle;
const createBlendType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
classRegistry.Viewport = Viewport;
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
classRegistry.BasicEnvironment = BasicEnvironment;
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
      throw new Error("ambiguous overload");
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
classRegistry.SceneEnvironment = SceneEnvironment;
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
classRegistry.ShadowMapEnvironment = ShadowMapEnvironment;
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
classRegistry.UiEnvironment = UiEnvironment;
class PlaybackId extends RefId {
  static TYPE = RefIdType.of("PLAYBACK_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "PlaybackId";
  }

  guardInvariants() {
  }

  type() {
    return PlaybackId.TYPE;
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
    if (!(obj instanceof PlaybackId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new PlaybackId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
classRegistry.PlaybackId = PlaybackId;
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
    let other = obj;
    return other.mId.equals(this.mId);
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
classRegistry.SoundId = SoundId;
const createSoundTrackFormat = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
const SoundTrackFormat = Object.freeze({
  FLOAT: createSoundTrackFormat("FLOAT"),

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
class SoundTrack {
  format;
  sampleRate;
  range;
  data;
  constructor() {
  }

  getClass() {
    return "SoundTrack";
  }

  guardInvariants() {
  }

  getFormat() {
    return this.format;
  }

  getSampleRate() {
    return this.sampleRate;
  }

  getRange() {
    return this.range;
  }

  getNumSamples() {
    if (this.format.equals(SoundTrackFormat.FLOAT)) {
      return this.data.size()/4;
    }
    else {
      throw new Error("unsupported format, implement me: "+this.format);
    }
  }

  getFloatSample(idx) {
    if (this.format.equals(SoundTrackFormat.FLOAT)) {
      return this.data.getFloat(idx*4);
    }
    else {
      throw new Error("unsupported format, implement me: "+this.format);
    }
  }

  getDuration() {
    if (this.format.equals(SoundTrackFormat.FLOAT)) {
      let numSamples = this.data.size()/4;
      return numSamples/this.sampleRate;
    }
    else {
      throw new Error("unsupported format, implement me: "+this.format);
    }
  }

  hashCode() {
    return HashCodeBuilder.reflectionHashCode(this);
  }

  equals(obj) {
    return EqualsBuilder.reflectionEquals(this, obj);
  }

  toString() {
  }

  static rangedFloatValues(sampleRate, range, ...samples) {
    if (Array.isArray(samples)&&samples.length===1&&Array.isArray(samples[0])) {
      samples = samples[0];
    }
    let res = new SoundTrack();
    res.format = SoundTrackFormat.FLOAT;
    res.sampleRate = sampleRate;
    res.range = range;
    res.data = DataBlock.fromFloatValues(samples);
    res.guardInvariants();
    return res;
  }

  static rangedFloatList(sampleRate, range, samples) {
    let res = new SoundTrack();
    res.format = SoundTrackFormat.FLOAT;
    res.sampleRate = sampleRate;
    res.range = range;
    res.data = DataBlock.fromFloatList(samples);
    res.guardInvariants();
    return res;
  }

  static normalizedFloatValues(sampleRate, ...samples) {
    if (Array.isArray(samples)&&samples.length===1&&Array.isArray(samples[0])) {
      samples = samples[0];
    }
    let res = new SoundTrack();
    res.format = SoundTrackFormat.FLOAT;
    res.sampleRate = sampleRate;
    res.range = Interval2.create(-1, 1);
    res.data = DataBlock.fromFloatValues(samples);
    res.guardInvariants();
    return res;
  }

  static normalizedFloatList(sampleRate, samples) {
    let res = new SoundTrack();
    res.format = SoundTrackFormat.FLOAT;
    res.sampleRate = sampleRate;
    res.range = Interval2.create(-1, 1);
    res.data = DataBlock.fromFloatList(samples);
    res.guardInvariants();
    return res;
  }

  static avg(tracks) {
    Guard.beFalse(tracks.isEmpty(), "at least single track is required");
    if (tracks.size()==1) {
      return tracks.get(0);
    }
    for (let track of tracks) {
      Guard.equals(SoundTrackFormat.FLOAT, track.getFormat(), "only FLOAT tracks are supported");
      Guard.equals(tracks.get(0).getSampleRate(), track.getSampleRate(), "all tracks must have same sampleRate");
      Guard.equals(tracks.get(0).getNumSamples(), track.getNumSamples(), "all tracks must have same number of samples");
      Guard.equals(tracks.get(0).getRange(), track.getRange(), "all tracks must have same range");
    }
    let res = new SoundTrack();
    res.format = SoundTrackFormat.FLOAT;
    res.sampleRate = tracks.get(0).sampleRate;
    res.range = tracks.get(0).range;
    let writer = DataBlockStreamWriter.create(tracks.get(0).getNumSamples()*4);
    for (let i = 0; i<tracks.get(0).getNumSamples(); ++i) {
      let d = 0;
      for (let track of tracks) {
        d = d+track.getFloatSample(i);
      }
      d = d/tracks.size();
      writer.writeFloat(FMath.clamp(d, res.range.min(), res.range.max()));
    }
    res.data = writer.toDataBlock();
    res.guardInvariants();
    return res;
  }

}
classRegistry.SoundTrack = SoundTrack;
class Sound {
  priority;
  track;
  constructor() {
  }

  getClass() {
    return "Sound";
  }

  guardInvariants() {
  }

  getPriority() {
    return this.priority;
  }

  getTrack() {
    return this.track;
  }

  hashCode() {
    return HashCodeBuilder.reflectionHashCode(this);
  }

  equals(obj) {
    return EqualsBuilder.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create() {
    if (arguments.length===1&&arguments[0] instanceof SoundTrack) {
      return Sound.create_1_SoundTrack(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&&arguments[1] instanceof SoundTrack) {
      return Sound.create_2_number_SoundTrack(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static create_1_SoundTrack(track) {
    let res = new Sound();
    res.track = track;
    res.priority = 0;
    res.guardInvariants();
    return res;
  }

  static create_2_number_SoundTrack(priority, track) {
    let res = new Sound();
    res.priority = priority;
    res.track = track;
    res.guardInvariants();
    return res;
  }

}
classRegistry.Sound = Sound;
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
classRegistry.AssetPlaceholder = AssetPlaceholder;
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
      throw new Error("ambiguous overload");
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
      throw new Error("ambiguous overload");
    }
  }

  get_1_RefId(key) {
    if (!this.cache.containsKey(key)) {
      throw new Error("no asset under "+key);
    }
    return this.cache.get(key);
  }

  get_2_string_RefId(clazz, key) {
    if (!this.cache.containsKey(key)) {
      throw new Error("no asset under "+key);
    }
    return this.cache.get(key);
  }

  getAsAssetGroup(key) {
    if (!this.cache.containsKey(key)) {
      throw new Error("no asset under "+key);
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
        throw new Error("key is presented in both groups: "+key);
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
      throw new Error("ambiguous overload");
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
        throw new Error("bank already contains "+key.toString());
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
classRegistry.AssetGroup = AssetGroup;
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
      throw new Error("ambiguous overload");
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
      let tapJson = JsonObjects.parse(new String(loader.loadFile(descriptor).toByteArray(), Charset.forName("utf-8")));
      let docType = tapJson.getString("docType");
      let schemaVersion = tapJson.getInt("schemaVersion");
      Guard.equals("Tyracorn Asset Package Descriptor", docType, "docType is not \"Tyracorn Asset Package Descriptor\"");
      if (schemaVersion==1) {
        let tasksJson = tapJson.containsKey("tasks")?tapJson.getJsonArray("tasks"):JsonArray.empty();
        for (let i = 0; i<tasksJson.size(); ++i) {
          let taskJson = tasksJson.getJsonObject(i);
          let type = taskJson.getString("type");
          if (type.equals("LOAD_ALL")) {
            let exclusionsJson = taskJson.containsKey("exclusions")?taskJson.getJsonArray("exclusions"):JsonArray.empty();
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
            let filesJson = taskJson.getJsonArray("files");
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
          else if (type.equals("TEXTURE_FORMAT")) {
            let format = TextureFormat.valueOf(taskJson.getString("format"));
            res = res.transform("Texture", TextureFncs.toFormat(format));
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
            throw new Error("unsupported task type, fix the file or implement: "+type);
          }
        }
      }
      else {
        throw new Error("unknown version: "+schemaVersion);
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
        let dataBlock = loader.loadFile(file);
        let tap = Taps.fromDataBlock(dataBlock);
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
    for (let j = 0; j<jsonArray.size(); ++j) {
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
    let animsJson = taskJson.getJsonObject("animations");
    for (let key of animsJson.keySet()) {
      let animJson = animsJson.getJsonObject(key);
      let clip = Assets.parseClip(animJson.getJsonArray("clip"));
      let dur = Float.valueOf(animJson.getString("duration"));
      let loop = animJson.getBoolean("loop");
      let triggers = animJson.containsKey("triggers")?Assets.parseClipAnimationTriggers(animJson.getJsonArray("triggers")):Collections.emptyList();
      animations.put(key, ClipAnimation.create(clip, dur, loop).withAddedTriggers(triggers));
    }
    let res = ClipAnimationCollection.create(animations);
    return AssetGroup.of(id, res);
  }

  static parseCreatePhysicalMaterialTask(taskJson) {
    let id = PhysicalMaterialId.of(taskJson.getString("physicalMaterialId"));
    let pmJson = taskJson.getJsonObject("physicalMaterial");
    let bounciness = pmJson.getFloat("bounciness");
    let bouninessCombineType = PhysicalMaterialCombineType.valueOf(pmJson.getString("bouninessCombineType"));
    let staticFriction = pmJson.getFloat("staticFriction");
    let dynamicFriction = pmJson.getFloat("dynamicFriction");
    let frictionCombineType = PhysicalMaterialCombineType.valueOf(pmJson.getString("frictionCombineType"));
    let res = PhysicalMaterial.create(bounciness, bouninessCombineType, staticFriction, dynamicFriction, frictionCombineType);
    return AssetGroup.of(id, res);
  }

  static createSprites(taskJson, assets) {
    let res = assets;
    let spritesJson = taskJson.getJsonObject("sprites");
    for (let key of spritesJson.keySet()) {
      let spriteJson = spritesJson.getJsonObject(key);
      let tid = Assets.findSpriteTexture(key, assets);
      let sheet = SpriteSheet.create(key, assets.get("Texture", tid), Assets.getNumStripFrames(tid), 1);
      let dur = Float.valueOf(spriteJson.getString("duration"));
      let loop = spriteJson.getBoolean("loop");
      let triggers = spriteJson.containsKey("triggers")?Assets.parseSpriteTriggers(spriteJson.getJsonArray("triggers")):Collections.emptyList();
      let sprite = sheet.createSprite(dur, loop).withAddedTriggers(triggers);
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
    for (let i = 0; i<array.size(); ++i) {
      frames.add(array.getInt(i));
    }
    return Clip.create(frames);
  }

  static parseClipAnimationTriggers(array) {
    let res = new ArrayList();
    for (let i = 0; i<array.size(); ++i) {
      let tJson = array.getJsonObject(i);
      let t = Float.valueOf(tJson.getString("t"));
      let trgsJson = tJson.getJsonArray("triggers");
      let triggers = new HashSet();
      for (let j = 0; j<trgsJson.size(); ++j) {
        triggers.add(trgsJson.getString(j));
      }
      res.add(ClipAnimationTrigger.multiple(t, triggers));
    }
    return res;
  }

  static parseSpriteTriggers(array) {
    let res = new ArrayList();
    for (let i = 0; i<array.size(); ++i) {
      let tJson = array.getJsonObject(i);
      let t = Float.valueOf(tJson.getString("t"));
      let trgsJson = tJson.getJsonArray("triggers");
      let triggers = new HashSet();
      for (let j = 0; j<trgsJson.size(); ++j) {
        triggers.add(trgsJson.getString(j));
      }
      res.add(SpriteTrigger.create(t, triggers));
    }
    return res;
  }

}
classRegistry.Assets = Assets;
const createAssetCompanionType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
      throw new Error("no asset under "+key.id());
    }
    let res = this.assets.get(key);
    if (AssetPlaceholder.INSTANCE.equals(res)) {
      throw new Error("asset is dematerialized (e.g. pushed to the hardware) "+key);
    }
    return res;
  }

  hasCompanion(key, type) {
    if (!this.companions.containsKey(key)) {
      return false;
    }
    return this.companions.get(key).containsKey(type);
  }

  getCompanion(clazz, key, type) {
    if (!this.companions.containsKey(key)) {
      throw new Error("no asset under "+key.id());
    }
    let res = this.companions.get(key).get(type);
    if (res==null) {
      throw new Error("asset "+key+" does not have companion "+type.toString());
    }
    return res;
  }

  markSynced(id) {
    this.assets.put(id, AssetPlaceholder.INSTANCE);
  }

  isSynced(key) {
    if (!this.assets.containsKey(key)) {
      throw new Error("no asset under "+key.id());
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
classRegistry.DefaultAssetBank = DefaultAssetBank;
const createTapEntryType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
    return this.data;
  }

  createDataStream() {
    return this.data.createStream();
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
    res.data = data;
    res.guardInvariants();
    return res;
  }

}
classRegistry.TapEntry = TapEntry;
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
classRegistry.Tap = Tap;
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
      bos.write(TapBytes.stringToBytes(texture.getFormat().name()));
      bos.write(TapBytes.intToBytes(texture.getChannels().size()));
      for (let ch of texture.getChannels()) {
        bos.write(TapBytes.stringToBytes(ch.name()));
      }
      bos.write(TapBytes.intToBytes(texture.getWidth()));
      bos.write(TapBytes.intToBytes(texture.getHeight()));
      bos.write(TapBytes.intToBytes(texture.getData().size()));
      bos.write(texture.getData().toByteArray());
      buf = bos.toByteArray();
      bos.close();
      bos = null;
    }
    catch (e) {
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.TEXTURE, id.id(), 2, DataBlock.fromByteArray(buf));
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
        let data = reader.readDataBlock(numChannels*w*h*4);
        texture = Texture.create(TextureFormat.FLOAT, channels, w, h, data);
      }
      finally {
        reader.close();
      }
      return AssetGroup.of(TextureId.of(entry.getId()), texture);
    }
    else if (entry.getVersion()==2) {
      let texture = null;
      let reader = TapBufferReader.create(entry);
      try {
        let format = TextureFormat.valueOf(reader.readString());
        let numChannels = reader.readInt();
        let channels = new ArrayList(numChannels);
        for (let i = 0; i<numChannels; ++i) {
          channels.add(TextureChannel.valueOf(reader.readString()));
        }
        let w = reader.readInt();
        let h = reader.readInt();
        let dataSize = reader.readInt();
        let data = reader.readDataBlock(dataSize);
        texture = Texture.create(format, channels, w, h, data);
      }
      finally {
        reader.close();
      }
      return AssetGroup.of(TextureId.of(entry.getId()), texture);
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

}
classRegistry.TapTextures = TapTextures;
class TapMaterials {
  constructor() {
  }

  getClass() {
    return "TapMaterials";
  }

  static toEntry(id, material) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.floatToBytes(material.getAmbient().r()));
      bos.write(TapBytes.floatToBytes(material.getAmbient().g()));
      bos.write(TapBytes.floatToBytes(material.getAmbient().b()));
      bos.write(TapBytes.floatToBytes(material.getDiffuse().r()));
      bos.write(TapBytes.floatToBytes(material.getDiffuse().g()));
      bos.write(TapBytes.floatToBytes(material.getDiffuse().b()));
      bos.write(TapBytes.floatToBytes(material.getSpecular().r()));
      bos.write(TapBytes.floatToBytes(material.getSpecular().g()));
      bos.write(TapBytes.floatToBytes(material.getSpecular().b()));
      bos.write(TapBytes.floatToBytes(material.getShininess()));
      bos.write(TapBytes.intToBytes(material.getTextures().size()));
      for (let tex of material.getTextures()) {
        bos.write(TapBytes.stringToBytes(tex.getType().name()));
        bos.write(TapBytes.stringToBytes(tex.getTexture().id()));
        bos.write(TapBytes.stringToBytes(tex.getStyle().getHorizWrapType().name()));
        bos.write(TapBytes.stringToBytes(tex.getStyle().getVertWrapType().name()));
        bos.write(TapBytes.floatToBytes(tex.getStyle().getBorderColor().r()));
        bos.write(TapBytes.floatToBytes(tex.getStyle().getBorderColor().g()));
        bos.write(TapBytes.floatToBytes(tex.getStyle().getBorderColor().b()));
        bos.write(TapBytes.floatToBytes(tex.getStyle().getBorderColor().a()));
        bos.write(TapBytes.stringToBytes(tex.getStyle().getMinFilterType().name()));
        bos.write(TapBytes.stringToBytes(tex.getStyle().getMagFilterType().name()));
      }
      buf = bos.toByteArray();
    }
    catch (e) {
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.MATERIAL, id.id(), 1, DataBlock.fromByteArray(buf));
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.MATERIAL, "entry must be a material type");
    if (entry.getVersion()==1) {
      let reader = TapBufferReader.create(entry);
      try {
        let mb = MaterialBase.create(Rgb.create(reader.readFloat(), reader.readFloat(), reader.readFloat()), Rgb.create(reader.readFloat(), reader.readFloat(), reader.readFloat()), Rgb.create(reader.readFloat(), reader.readFloat(), reader.readFloat()), reader.readFloat());
        let numAttch = reader.readInt();
        let tas = new ArrayList();
        for (let i = 0; i<numAttch; ++i) {
          let type = TextureType.valueOf(reader.readString());
          let id = TextureId.of(reader.readString());
          let style = TextureStyle.create(TextureWrapType.valueOf(reader.readString()), TextureWrapType.valueOf(reader.readString()), Rgba.create(reader.readFloat(), reader.readFloat(), reader.readFloat(), reader.readFloat()), TextureFilterType.valueOf(reader.readString()), TextureFilterType.valueOf(reader.readString()));
          tas.add(TextureAttachment.create(type, id, style));
        }
        let mat = Material.create(mb, tas);
        return AssetGroup.of(MaterialId.of(entry.getId()), mat);
      }
      finally {
        reader.close();
      }
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

}
classRegistry.TapMaterials = TapMaterials;
class TapMeshes {
  constructor() {
  }

  getClass() {
    return "TapMeshes";
  }

  static toEntry(id, mesh) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.floatToBytes(mesh.getAabb().min().x()));
      bos.write(TapBytes.floatToBytes(mesh.getAabb().min().y()));
      bos.write(TapBytes.floatToBytes(mesh.getAabb().min().z()));
      bos.write(TapBytes.floatToBytes(mesh.getAabb().max().x()));
      bos.write(TapBytes.floatToBytes(mesh.getAabb().max().y()));
      bos.write(TapBytes.floatToBytes(mesh.getAabb().max().z()));
      bos.write(TapBytes.intToBytes(mesh.getNumFrames()));
      bos.write(TapBytes.intToBytes(mesh.getVertexAttrs().size()));
      for (let attr of mesh.getVertexAttrs()) {
        bos.write(TapBytes.stringToBytes(attr.getType().name()));
        bos.write(TapBytes.intToBytes(attr.getSize()));
      }
      for (let frame of mesh.getFrames()) {
        bos.write(TapBytes.floatToBytes(frame.getAabb().min().x()));
        bos.write(TapBytes.floatToBytes(frame.getAabb().min().y()));
        bos.write(TapBytes.floatToBytes(frame.getAabb().min().z()));
        bos.write(TapBytes.floatToBytes(frame.getAabb().max().x()));
        bos.write(TapBytes.floatToBytes(frame.getAabb().max().y()));
        bos.write(TapBytes.floatToBytes(frame.getAabb().max().z()));
        bos.write(TapBytes.intToBytes(frame.getVerticesBlock().size()));
        bos.write(frame.getVerticesBlock().toByteArray());
      }
      bos.write(TapBytes.intToBytes(mesh.getFacesBlock().size()));
      bos.write(mesh.getFacesBlock().toByteArray());
      buf = bos.toByteArray();
    }
    catch (e) {
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.MESH, id.id(), 2, DataBlock.fromByteArray(buf));
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.MESH, "entry must be a mesh type");
    if (entry.getVersion()==1) {
      let reader = TapBufferReader.create(entry);
      try {
        let attrs = new ArrayList();
        let verts = new ArrayList();
        let faces = new ArrayList();
        let numAttrs = reader.readInt();
        for (let i = 0; i<numAttrs; ++i) {
          let type = VertexAttrType.valueOf(reader.readString());
          let size = reader.readInt();
          attrs.add(VertexAttr.create(type, size));
        }
        let vertSize = TapMeshes.getVertexSize(attrs);
        let numVerts = reader.readInt();
        let vbuf = [];
        for (let i = 0; i<numVerts; ++i) {
          for (let j = 0; j<vertSize; ++j) {
            vbuf[j] = reader.readFloat();
          }
          verts.add(Vertex.create(vbuf));
        }
        let numFaces = reader.readInt();
        for (let i = 0; i<numFaces; ++i) {
          let numIdxs = reader.readInt();
          let idxs = [];
          for (let j = 0; j<numIdxs; ++j) {
            idxs[j] = reader.readInt();
          }
          faces.add(Face.create(idxs));
        }
        let unpackedMesh = UnpackedMesh.singleFrame(UnpackedMeshFrame.create(attrs, verts), faces);
        return AssetGroup.of(MeshId.of(entry.getId()), unpackedMesh.toMesh());
      }
      finally {
        reader.close();
      }
    }
    else if (entry.getVersion()==2) {
      let reader = TapBufferReader.create(entry);
      try {
        let meshAabb = Aabb3.create(reader.readFloat(), reader.readFloat(), reader.readFloat(), reader.readFloat(), reader.readFloat(), reader.readFloat());
        let numFrames = reader.readInt();
        let numVertexAttrs = reader.readInt();
        let vertexAttrs = new ArrayList();
        for (let i = 0; i<numVertexAttrs; ++i) {
          vertexAttrs.add(VertexAttr.create(VertexAttrType.valueOf(reader.readString()), reader.readInt()));
        }
        let frames = new ArrayList();
        for (let i = 0; i<numFrames; ++i) {
          let frameAabb = Aabb3.create(reader.readFloat(), reader.readFloat(), reader.readFloat(), reader.readFloat(), reader.readFloat(), reader.readFloat());
          let vertDataSize = reader.readInt();
          let vertData = reader.readDataBlock(vertDataSize);
          frames.add(MeshFrame.create(frameAabb, vertexAttrs, vertData));
        }
        let facesDataSieze = reader.readInt();
        let facesData = reader.readDataBlock(facesDataSieze);
        return AssetGroup.of(MeshId.of(entry.getId()), Mesh.create(meshAabb, frames, facesData));
      }
      finally {
        reader.close();
      }
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

  static getVertexSize(attrs) {
    let res = 0;
    for (let attr of attrs) {
      res = res+attr.getSize();
    }
    return res;
  }

}
classRegistry.TapMeshes = TapMeshes;
class TapModels {
  constructor() {
  }

  getClass() {
    return "TapModels";
  }

  static toEntry(id, model) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.intToBytes(model.getParts().size()));
      for (let part of model.getParts()) {
        bos.write(TapBytes.stringToBytes(part.getMesh().id()));
        bos.write(TapBytes.stringToBytes(part.getMaterial().id()));
      }
      buf = bos.toByteArray();
    }
    catch (e) {
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.MODEL, id.id(), 1, DataBlock.fromByteArray(buf));
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.MODEL, "entry must be a model type");
    if (entry.getVersion()==1) {
      let model = Model.empty();
      let reader = TapBufferReader.create(entry);
      try {
        let num = reader.readInt();
        for (let i = 0; i<num; ++i) {
          let mesh = reader.readString();
          let mat = reader.readString();
          model = model.addPart(ModelPart.of(MeshId.of(mesh), MaterialId.of(mat)));
        }
      }
      finally {
        reader.close();
      }
      return AssetGroup.of(ModelId.of(entry.getId()), model);
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

}
classRegistry.TapModels = TapModels;
class TapClipAnimationCollections {
  constructor() {
  }

  getClass() {
    return "TapClipAnimationCollections";
  }

  static toEntry(id, collection) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.intToBytes(collection.getAnimations().size()));
      for (let aid of Dut.copySortedSet(collection.getAnimations().keySet())) {
        let anim = collection.getAnimation(aid);
        bos.write(TapBytes.stringToBytes(aid));
        bos.write(TapBytes.intToBytes(anim.getClip().getNumFrames()));
        for (let idx of anim.getClip().getFrames()) {
          bos.write(TapBytes.intToBytes(idx));
        }
        bos.write(TapBytes.floatToBytes(anim.getDuration()));
        bos.write(TapBytes.booleanToBytes(anim.isLoop()));
        bos.write(TapBytes.intToBytes(anim.getTriggers().size()));
        for (let t of anim.getTriggers()) {
          bos.write(TapBytes.floatToBytes(t.getTime()));
          bos.write(TapBytes.intToBytes(t.getTriggers().size()));
          for (let trigger of Dut.copySortedSet(t.getTriggers())) {
            bos.write(TapBytes.stringToBytes(trigger));
          }
        }
      }
      buf = bos.toByteArray();
    }
    catch (e) {
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.CLIP_ANIMATION_COLLECTION, id.id(), 1, DataBlock.fromByteArray(buf));
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.CLIP_ANIMATION_COLLECTION, "entry must be a CLIP_ANIMATION_COLLECTION type");
    if (entry.getVersion()==1) {
      let reader = TapBufferReader.create(entry);
      try {
        let animations = new HashMap();
        let numAnims = reader.readInt();
        for (let i = 0; i<numAnims; ++i) {
          let key = reader.readString();
          let numFrames = reader.readInt();
          let frames = new ArrayList();
          for (let f = 0; f<numFrames; ++f) {
            frames.add(reader.readInt());
          }
          let duration = reader.readFloat();
          let loop = reader.readBoolean();
          let anim = ClipAnimation.create(Clip.create(frames), duration, loop);
          let numTriggerTimes = reader.readInt();
          for (let tt = 0; tt<numTriggerTimes; ++tt) {
            let t = reader.readFloat();
            let numTriggers = reader.readInt();
            let tTriggers = new HashSet();
            for (let tr = 0; tr<numTriggers; ++tr) {
              tTriggers.add(reader.readString());
            }
            anim = anim.withAddedTrigger(ClipAnimationTrigger.multiple(t, tTriggers));
          }
          animations.put(key, anim);
        }
        return AssetGroup.of(ClipAnimationCollectionId.of(entry.getId()), ClipAnimationCollection.create(animations));
      }
      finally {
        reader.close();
      }
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

}
classRegistry.TapClipAnimationCollections = TapClipAnimationCollections;
class TapPhysicalMaterials {
  constructor() {
  }

  getClass() {
    return "TapPhysicalMaterials";
  }

  static toEntry(id, material) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.floatToBytes(material.getBounciness()));
      bos.write(TapBytes.stringToBytes(material.getBouninessCombineType().name()));
      bos.write(TapBytes.floatToBytes(material.getStaticFriction()));
      bos.write(TapBytes.floatToBytes(material.getDynamicFriction()));
      bos.write(TapBytes.stringToBytes(material.getFrictionCombineType().name()));
      buf = bos.toByteArray();
    }
    catch (e) {
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.PHYSICAL_MATERIAL, id.id(), 1, DataBlock.fromByteArray(buf));
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.PHYSICAL_MATERIAL, "entry must be a PHYSICAL_MATERIAL type");
    if (entry.getVersion()==1) {
      let reader = TapBufferReader.create(entry);
      try {
        let bounciness = reader.readFloat();
        let bct = PhysicalMaterialCombineType.valueOf(reader.readString());
        let statfric = reader.readFloat();
        let dynfric = reader.readFloat();
        let fricct = PhysicalMaterialCombineType.valueOf(reader.readString());
        let mat = PhysicalMaterial.create(bounciness, bct, statfric, dynfric, fricct);
        return AssetGroup.of(PhysicalMaterialId.of(entry.getId()), mat);
      }
      finally {
        reader.close();
      }
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

}
classRegistry.TapPhysicalMaterials = TapPhysicalMaterials;
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
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.FONT, id.id(), 1, DataBlock.fromByteArray(buf));
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
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

}
classRegistry.TapFonts = TapFonts;
class TapSounds {
  constructor() {
  }

  getClass() {
    return "TapSounds";
  }

  static toEntry(id, sound) {
    let track = sound.getTrack();
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.intToBytes(sound.getPriority()));
      bos.write(TapBytes.intToBytes(track.getSampleRate()));
      bos.write(TapBytes.floatToBytes(track.getRange().min()));
      bos.write(TapBytes.floatToBytes(track.getRange().max()));
      bos.write(TapBytes.intToBytes(track.getNumSamples()));
      for (let i = 0; i<track.getNumSamples(); ++i) {
        bos.write(TapBytes.floatToBytes(track.getFloatSample(i)));
      }
      buf = bos.toByteArray();
    }
    catch (e) {
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.SOUND, id.id(), 1, DataBlock.fromByteArray(buf));
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.SOUND, "entry must be a SOUND type");
    if (entry.getVersion()==1) {
      let sound = null;
      let reader = TapBufferReader.create(entry);
      try {
        let priority = reader.readInt();
        let sampleRate = reader.readInt();
        let min = reader.readFloat();
        let max = reader.readFloat();
        let numSamples = reader.readInt();
        let samples = [];
        for (let i = 0; i<numSamples; ++i) {
          samples[i] = reader.readFloat();
        }
        sound = Sound.create(priority, SoundTrack.rangedFloatValues(sampleRate, Interval2.create(min, max), samples));
      }
      finally {
        reader.close();
      }
      return AssetGroup.of(SoundId.of(entry.getId()), sound);
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

}
classRegistry.TapSounds = TapSounds;
class TapPrefabs {
  constructor() {
  }

  getClass() {
    return "TapPrefabs";
  }

  static toEntry(id, prefab) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      TapPrefabs.writePrefab(prefab, bos);
      buf = bos.toByteArray();
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
    return TapEntry.create(TapEntryType.PREFAB, id.id(), 2, DataBlock.fromByteArray(buf));
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.PREFAB, "entry must be a PREFAB type");
    if (entry.getVersion()==1) {
      let reader = TapBufferReader.create(entry);
      try {
        let prefab = TapPrefabs.readPrefabV1(reader);
        return AssetGroup.of(ActorPrefabId.of(entry.getId()), prefab);
      }
      finally {
        reader.close();
      }
    }
    else if (entry.getVersion()==2) {
      let reader = TapBufferReader.create(entry);
      try {
        let prefab = TapPrefabs.readPrefab(reader);
        return AssetGroup.of(ActorPrefabId.of(entry.getId()), prefab);
      }
      finally {
        reader.close();
      }
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

  static writePrefab(prefab, os) {
    try {
      os.write(TapBytes.stringToBytes(prefab.getId()));
      os.write(TapBytes.stringToBytes(prefab.getName()));
      os.write(TapBytes.stringToBytes(Jsons.stringListToJson(Dut.copyList(Dut.copySortedSet(prefab.getTags())))));
      os.write(TapBytes.intToBytes(prefab.getComponents().size()));
      for (let cp of prefab.getComponents()) {
        os.write(TapBytes.stringToBytes(cp.getType().name()));
        os.write(TapBytes.stringToBytes(cp.getKey()));
        os.write(TapBytes.intToBytes(cp.getVersion()));
        os.write(TapBytes.stringToBytes(Jsons.stringMapToJson(cp.getProperties())));
      }
      os.write(TapBytes.intToBytes(prefab.getChildren().size()));
      for (let child of prefab.getChildren()) {
        TapPrefabs.writePrefab(child, os);
      }
    }
    catch (e) {
      throw new Error(e);
    }
  }

  static readPrefab(reader) {
    let id = reader.readString();
    let name = reader.readString();
    let tags = Jsons.toStringList(reader.readString());
    let numCmps = reader.readInt();
    let cmps = new ArrayList();
    for (let i = 0; i<numCmps; ++i) {
      let cmpType = ComponentPrefabType.valueOf(reader.readString());
      let key = reader.readString();
      let cmpVersion = reader.readInt();
      let cmpProps = Jsons.toStringMap(reader.readString());
      cmps.add(ComponentPrefab.create(cmpType, key, cmpVersion, cmpProps));
    }
    let numChildren = reader.readInt();
    let children = new ArrayList();
    for (let i = 0; i<numChildren; ++i) {
      let child = TapPrefabs.readPrefab(reader);
      children.add(child);
    }
    return ActorPrefab.create(id, name).withTags(tags).withComponents(cmps).withChildren(children);
  }

  static readPrefabV1(reader) {
    let id = reader.readString();
    let name = reader.readString();
    let tags = Jsons.toStringList(reader.readString());
    let numCmps = reader.readInt();
    let cmps = new ArrayList();
    for (let i = 0; i<numCmps; ++i) {
      let cmpType = ComponentPrefabType.valueOf(reader.readString());
      let cmpVersion = reader.readInt();
      let cmpProps = Jsons.toStringMap(reader.readString());
      cmps.add(ComponentPrefab.create(cmpType, "", cmpVersion, cmpProps));
    }
    let numChildren = reader.readInt();
    let children = new ArrayList();
    for (let i = 0; i<numChildren; ++i) {
      let child = TapPrefabs.readPrefabV1(reader);
      children.add(child);
    }
    return ActorPrefab.create(id, name).withTags(tags).withComponents(cmps).withChildren(children);
  }

}
classRegistry.TapPrefabs = TapPrefabs;
class TapScenes {
  constructor() {
  }

  getClass() {
    return "TapScenes";
  }

  static toEntry(id, scene) {
    let buf = null;
    let bos = new ByteArrayOutputStream();
    try {
      bos.write(TapBytes.stringToBytes(scene.getName()));
      bos.write(TapBytes.intToBytes(scene.getObjects().size()));
      for (let obj of scene.getObjects()) {
        bos.write(TapBytes.stringToBytes(obj.getName()));
        bos.write(TapBytes.stringToBytes(obj.getPrefabId().id()));
        bos.write(TapBytes.stringToBytes(obj.getActorId()==null?"":obj.getActorId().id()));
        bos.write(TapBytes.floatToBytes(obj.getPos().x()));
        bos.write(TapBytes.floatToBytes(obj.getPos().y()));
        bos.write(TapBytes.floatToBytes(obj.getPos().z()));
        bos.write(TapBytes.floatToBytes(obj.getRot().a()));
        bos.write(TapBytes.floatToBytes(obj.getRot().b()));
        bos.write(TapBytes.floatToBytes(obj.getRot().c()));
        bos.write(TapBytes.floatToBytes(obj.getRot().d()));
      }
      buf = bos.toByteArray();
    }
    catch (e) {
      throw new Error(e);
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
    return TapEntry.create(TapEntryType.SCENE, id.id(), 1, DataBlock.fromByteArray(buf));
  }

  static toAssetGroup(entry) {
    Guard.equals(entry.getType(), TapEntryType.SCENE, "entry must be a SCENEs type");
    if (entry.getVersion()==1) {
      let reader = TapBufferReader.create(entry);
      try {
        let scname = reader.readString();
        let scene = Scene.create(scname);
        let numObjs = reader.readInt();
        for (let i = 0; i<numObjs; ++i) {
          let name = reader.readString();
          let pid = reader.readString();
          let aidh = reader.readString();
          let aid = StringUtils.isEmpty(aidh)?null:ActorId.of(aidh);
          let x = reader.readFloat();
          let y = reader.readFloat();
          let z = reader.readFloat();
          let a = reader.readFloat();
          let b = reader.readFloat();
          let c = reader.readFloat();
          let d = reader.readFloat();
          let sceneObject = SceneObject.create(name, ActorPrefabId.of(pid)).withActorId(aid).withPos(Vec3.create(x, y, z)).withRot(Quaternion.create(a, b, c, d));
          scene = scene.withAddedObject(sceneObject);
        }
        return AssetGroup.of(SceneId.of(entry.getId()), scene);
      }
      finally {
        reader.close();
      }
    }
    else {
      throw new Error("unsupported version, implement me: "+entry.getVersion());
    }
  }

}
classRegistry.TapScenes = TapScenes;
class MouseTouches {
  static MOUSE_TOUCH_ID = "MOUSE";
  constructor() {
  }

  getClass() {
    return "MouseTouches";
  }

}
classRegistry.MouseTouches = MouseTouches;
class MouseButton {
  static BUTTON_0 = MouseButton.create("BUTTON_0");
  code;
  constructor() {
  }

  getClass() {
    return "MouseButton";
  }

  getCode() {
    return this.code;
  }

  hashCode() {
    return this.code.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    else if (!(obj instanceof MouseButton)) {
      return false;
    }
    let ob = obj;
    return ob.code.equals(this.code);
  }

  toString() {
  }

  static create(code) {
    let res = new MouseButton();
    res.code = code;
    return res;
  }

}
classRegistry.MouseButton = MouseButton;
class KeyCode {
  static ENTER = KeyCode.create("ENTER");
  static ESCAPE = KeyCode.create("ESCAPE");
  static BACKSPACE = KeyCode.create("BACKSPACE");
  static TAB = KeyCode.create("TAB");
  static SHIFT = KeyCode.create("SHIFT");
  static SHIFT_LEFT = KeyCode.create("SHIFT_LEFT");
  static SHIFT_RIGHT = KeyCode.create("SHIFT_RIGHT");
  static CONTROL = KeyCode.create("CONTROL");
  static CONTROL_LEFT = KeyCode.create("CONTROL_LEFT");
  static CONTROL_RIGHT = KeyCode.create("CONTROL_RIGHT");
  static ALT = KeyCode.create("ALT");
  static ALT_LEFT = KeyCode.create("ALT_LEFT");
  static ALT_RIGHT = KeyCode.create("ALT_RIGHT");
  static SPACE = KeyCode.create("SPACE");
  static HOME = KeyCode.create("HOME");
  static END = KeyCode.create("END");
  static ARROW_LEFT = KeyCode.create("ARROW_LEFT");
  static ARROW_UP = KeyCode.create("ARROW_UP");
  static ARROW_RIGHT = KeyCode.create("ARROW_RIGHT");
  static ARROW_DOWN = KeyCode.create("ARROW_DOWN");
  key;
  constructor() {
  }

  getClass() {
    return "KeyCode";
  }

  getKey() {
    return this.key;
  }

  getUpperKey() {
    return this.key.toUpperCase();
  }

  isEnter() {
    return KeyCode.ENTER.equals(this);
  }

  isBackspace() {
    return KeyCode.BACKSPACE.equals(this);
  }

  isShift() {
    return KeyCode.SHIFT.equals(this)||KeyCode.SHIFT_LEFT.equals(this)||KeyCode.SHIFT_RIGHT.equals(this);
  }

  isConrol() {
    return KeyCode.CONTROL.equals(this)||KeyCode.CONTROL_LEFT.equals(this)||KeyCode.CONTROL_RIGHT.equals(this);
  }

  isSpace() {
    return KeyCode.SPACE.equals(this);
  }

  isArrowLeft() {
    return KeyCode.ARROW_LEFT.equals(this);
  }

  isArrowUp() {
    return KeyCode.ARROW_UP.equals(this);
  }

  isArrowRight() {
    return KeyCode.ARROW_RIGHT.equals(this);
  }

  isArrowDown() {
    return KeyCode.ARROW_DOWN.equals(this);
  }

  hashCode() {
    return this.key.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (this==obj) {
      return true;
    }
    if (!(obj instanceof KeyCode)) {
      return false;
    }
    let ob = obj;
    return ob.key.equals(this.key);
  }

  toString() {
  }

  static create(key) {
    let res = new KeyCode();
    res.key = key;
    return res;
  }

}
classRegistry.KeyCode = KeyCode;
class KeyCodeMatchers {
  constructor() {
  }

  getClass() {
    return "KeyCodeMatchers";
  }

  static control() {
    return (keyCode) => {
      return keyCode.isConrol();
    };
  }

  static shift() {
    return (keyCode) => {
      return keyCode.isShift();
    };
  }

  static space() {
    return (keyCode) => {
      return keyCode.isSpace();
    };
  }

  static arrowUpOrW() {
    return (keyCode) => {
      return keyCode.isArrowUp()||keyCode.getUpperKey().equals("W");
    };
  }

  static arrowDownOrS() {
    return (keyCode) => {
      return keyCode.isArrowDown()||keyCode.getUpperKey().equals("S");
    };
  }

  static arrowLeftOrA() {
    return (keyCode) => {
      return keyCode.isArrowLeft()||keyCode.getUpperKey().equals("A");
    };
  }

  static arrowRightOrD() {
    return (keyCode) => {
      return keyCode.isArrowRight()||keyCode.getUpperKey().equals("D");
    };
  }

  static upperKey(upperKey) {
    Guard.notEmpty(upperKey, "upperKey cannot be empty");
    return (keyCode) => {
      return keyCode.getUpperKey().equals(upperKey);
    };
  }

}
classRegistry.KeyCodeMatchers = KeyCodeMatchers;
const createBasicLoadingScreenLoadStrategy = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
class BasicLoadingScreen extends TyracornScreen {
  strategy;
  path;
  texture;
  ui;
  image;
  constructor() {
    super();
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

  init(drivers, screenManager, properties) {
    this.ui = StretchUi.create(UiSizeFncs.constantHeight(1600));
    this.ui.subscribe(drivers);
  }

  load(drivers, screenManager, properties) {
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
        throw new Error("unknown loadStrategy: "+this.strategy);
      }
    }
    return res;
  }

  leave(drivers) {
    this.ui.unsubscribe(drivers);
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
classRegistry.BasicLoadingScreen = BasicLoadingScreen;
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
classRegistry.TyracornScreenAppScreenManager = TyracornScreenAppScreenManager;
class TyracornScreenApp extends TyracornApp {
  properties;
  screenManager;
  loadingScreen;
  activeScreen;
  loadingFutures;
  resetNextDt = false;
  loadinScreenInitialized = false;
  constructor() {
    super();
  }

  getClass() {
    return "TyracornScreenApp";
  }

  guardInvariants() {
  }

  init(drivers, properties) {
    this.properties = Dut.copyImmutableMap(properties);
    this.screenManager = TyracornScreenAppScreenManager.create();
    let res = this.loadingScreen.load(drivers, this.screenManager, this.properties);
    this.loadingFutures = this.activeScreen.load(drivers, this.screenManager, this.properties);
    if (this.loadingFutures.isEmpty()) {
      drivers.getDriver("AssetManager").syncToDrivers();
      this.activeScreen.init(drivers, this.screenManager, properties);
      drivers.getDriver("AssetManager").syncToDrivers();
      this.resetNextDt = true;
    }
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
          Functions.runRunnable(action);
        }
        this.activeScreen.leave(drivers);
        this.activeScreen = this.screenManager.getNextScreen();
        this.screenManager = TyracornScreenAppScreenManager.create();
        this.loadingFutures = this.activeScreen.load(drivers, this.screenManager, this.properties);
        if (this.loadingFutures.isEmpty()) {
          drivers.getDriver("AssetManager").syncToDrivers();
          this.activeScreen.init(drivers, this.screenManager, this.properties);
          drivers.getDriver("AssetManager").syncToDrivers();
          this.resetNextDt = true;
        }
      }
    }
    else {
      if (this.loadinScreenInitialized) {
        this.loadingScreen.move(drivers, this.screenManager, dt);
      }
      else {
        this.loadingScreen.init(drivers, this.screenManager, this.properties);
        this.loadinScreenInitialized = true;
      }
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
        this.activeScreen.init(drivers, this.screenManager, this.properties);
        drivers.getDriver("AssetManager").syncToDrivers();
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
classRegistry.TyracornScreenApp = TyracornScreenApp;
class InMemoryActorTreeNode {
  parent;
  actor;
  constructor() {
  }

  getClass() {
    return "InMemoryActorTreeNode";
  }

  guardInvariants() {
  }

  getParent() {
    return this.parent;
  }

  getActor() {
    return this.actor;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(parent, actor) {
    let res = new InMemoryActorTreeNode();
    res.parent = parent;
    res.actor = actor;
    res.guardInvariants();
    return res;
  }

}
classRegistry.InMemoryActorTreeNode = InMemoryActorTreeNode;
class InMemoryActorTree {
  world;
  observer;
  rootId;
  actors = new HashMap();
  childrenActors = new HashMap();
  constructor() {
  }

  getClass() {
    return "InMemoryActorTree";
  }

  guardInvariants() {
  }

  add() {
    if (arguments.length===1&&arguments[0] instanceof Actor) {
      this.add_1_Actor(arguments[0]);
    }
    else if (arguments.length===2&&arguments[0] instanceof ActorId&&arguments[1] instanceof Actor) {
      this.add_2_ActorId_Actor(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  add_1_Actor(actor) {
    this.add(ActorId.ROOT, actor);
  }

  add_2_ActorId_Actor(parentId, actor) {
    Guard.beFalse(actor.getId().equals(parentId), "actor cannot have itself as a parent");
    Guard.beFalse(this.actors.containsKey(actor.getId()), "id is already taken: %s", actor.getId());
    Guard.beTrue(this.actors.containsKey(parentId), "parent does not exists: %s", parentId);
    this.actors.put(actor.getId(), InMemoryActorTreeNode.create(parentId, actor));
    this.childrenActors.get(parentId).add(actor);
    this.childrenActors.put(actor.getId(), new ArrayList());
    actor.init(this.world);
    this.observer.addActor(actor);
  }

  remove(id) {
    Guard.beFalse(id.equals(this.rootId), "cannot remove root node: %s", id);
    if (!this.childrenActors.containsKey(id)) {
      return ;
    }
    if (!this.childrenActors.get(id).isEmpty()) {
      let chs = Dut.copyList(this.childrenActors.get(id));
      for (let ch of chs) {
        this.remove(ch.getId());
      }
    }
    let nd = this.actors.get(id);
    this.childrenActors.get(nd.getParent()).remove(nd.getActor());
    this.observer.removeActor(id);
    this.actors.remove(id);
    this.childrenActors.remove(id);
  }

  exists(id) {
    return this.actors.containsKey(id);
  }

  root() {
    return this.actors.get(this.rootId).getActor();
  }

  get(id) {
    let node = this.actors.get(id);
    if (node==null) {
      throw new Error("id does not exists: "+id);
    }
    return node.getActor();
  }

  parent(id) {
    return this.actors.get(this.actors.get(id).getParent()).getActor();
  }

  children(id) {
    return Collections.unmodifiableList(this.childrenActors.get(id));
  }

  forEach(id, action) {
    let act = this.actors.get(id).getActor();
    Functions.runActorAction(action, act);
    let chs = this.childrenActors.get(id);
    for (let i = 0; i<chs.size(); ++i) {
      this.forEach(chs.get(i).getId(), action);
    }
  }

  toString() {
  }

  static crete(world, observer) {
    let res = new InMemoryActorTree();
    res.world = world;
    res.rootId = ActorId.ROOT;
    res.observer = observer;
    let rootAct = Actor.create(ActorId.ROOT);
    res.actors.put(ActorId.ROOT, InMemoryActorTreeNode.create(ActorId.ROOT, rootAct));
    res.childrenActors.put(ActorId.ROOT, new ArrayList());
    rootAct.init(res.world);
    observer.addActor(rootAct);
    res.guardInvariants();
    return res;
  }

}
classRegistry.InMemoryActorTree = InMemoryActorTree;
class QueuedActorTreeItem {
  static TYPE_ADD = 1;
  static TYPE_REMOVE = 2;
  type;
  id;
  actor;
  constructor() {
  }

  getClass() {
    return "QueuedActorTreeItem";
  }

  isAdd() {
    return this.type==QueuedActorTreeItem.TYPE_ADD;
  }

  isRemove() {
    return this.type==QueuedActorTreeItem.TYPE_REMOVE;
  }

  getParentId() {
    return this.id;
  }

  getId() {
    return this.id;
  }

  getActor() {
    return this.actor;
  }

  static createAdd(parentId, actor) {
    let res = new QueuedActorTreeItem();
    res.type = QueuedActorTreeItem.TYPE_ADD;
    res.id = parentId;
    res.actor = actor;
    return res;
  }

  static createRemove(id) {
    let res = new QueuedActorTreeItem();
    res.type = QueuedActorTreeItem.TYPE_REMOVE;
    res.id = id;
    return res;
  }

}
classRegistry.QueuedActorTreeItem = QueuedActorTreeItem;
class QueuedActorTree {
  target;
  queue = new ArrayList();
  lock = new Object();
  iterators = 0;
  constructor() {
  }

  getClass() {
    return "QueuedActorTree";
  }

  guardInvariants() {
  }

  add() {
    if (arguments.length===1&&arguments[0] instanceof Actor) {
      this.add_1_Actor(arguments[0]);
    }
    else if (arguments.length===2&&arguments[0] instanceof ActorId&&arguments[1] instanceof Actor) {
      this.add_2_ActorId_Actor(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  add_1_Actor(actor) {
    this.add(ActorId.ROOT, actor);
  }

  add_2_ActorId_Actor(parentId, actor) {
    this.target.add(parentId, actor);
  }

  remove(id) {
    if (this.iterators==0) {
      this.target.remove(id);
    }
    else {
      this.queue.add(QueuedActorTreeItem.createRemove(id));
    }
  }

  exists(id) {
    return this.target.exists(id);
  }

  root() {
    return this.target.root();
  }

  get(id) {
    return this.target.get(id);
  }

  parent(id) {
    return this.target.parent(id);
  }

  children(id) {
    return this.target.children(id);
  }

  forEach(id, action) {
    this.iterators = this.iterators+1;
    try {
      this.target.forEach(id, action);
    }
    finally {
      this.iterators = this.iterators-1;
      if (this.iterators==0) {
        this.flushQueue();
      }
    }
  }

  flushQueue() {
    for (let item of this.queue) {
      if (item.isAdd()) {
        this.target.add(item.getParentId(), item.getActor());
      }
      else if (item.isRemove()) {
        this.target.remove(item.getId());
      }
      else {
        throw new Error("unsupported item type");
      }
    }
    this.queue = new ArrayList();
  }

  toString() {
  }

  static create(target) {
    let res = new QueuedActorTree();
    res.target = target;
    res.guardInvariants();
    return res;
  }

}
classRegistry.QueuedActorTree = QueuedActorTree;
class ActorId extends RefId {
  static TYPE = RefIdType.of("ACTOR_ID");
  static ROOT = ActorId.of("ROOT");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "ActorId";
  }

  guardInvariants() {
  }

  type() {
    return ActorId.TYPE;
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
    if (!(obj instanceof ActorId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new ActorId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ActorId = ActorId;
class Actor {
  id;
  name;
  components = new ArrayList();
  listeners = new HashSet();
  tags = new HashSet();
  immutableComponents = Collections.unmodifiableList(this.components);
  mWorld;
  hash = Randoms.nextInt(0, 10000000);
  constructor() {
  }

  getClass() {
    return "Actor";
  }

  guardInvariants() {
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  setName(name) {
    Guard.notNull(name, "name cannot be null");
    this.name = name;
    return this;
  }

  hasEffect(effect) {
    for (let i = 0; i<this.components.size(); ++i) {
      if (this.components.get(i).getEffects().contains(effect)) {
        return true;
      }
    }
    return false;
  }

  getComponents() {
    return this.immutableComponents;
  }

  hasComponent(clazz) {
    for (let i = 0; i<this.components.size(); ++i) {
      if (clazz.equals(this.components.get(i).getClass())) {
        return true;
      }
    }
    return false;
  }

  getComponent(clazz) {
    let res = null;
    for (let i = 0; i<this.components.size(); ++i) {
      let comp = this.components.get(i);
      if (comp.getClass().equals(clazz)) {
        if (res!=null) {
          throw new Error("actor has more than a single component: "+this.name+" - "+clazz.getName());
        }
        res = comp;
      }
    }
    if (res==null) {
      throw new Error("actor "+this.id.id()+"  doesn't have a requested compoent: "+this.name+" - "+clazz.getName());
    }
    return res;
  }

  getComponentNonStrict(clazz) {
    let res = null;
    for (let i = 0; i<this.components.size(); ++i) {
      let comp = this.components.get(i);
      if (comp.getClass().equals(clazz)) {
        if (res!=null) {
          throw new Error("actor has more than a single component: "+this.name+" - "+clazz.getName());
        }
        res = comp;
      }
    }
    return res;
  }

  getComponentByKey(clazz, key) {
    for (let i = 0; i<this.components.size(); ++i) {
      let comp = this.components.get(i);
      if (comp.getKey().equals(key)) {
        return comp;
      }
    }
    throw new Error("actor "+this.id.id()+"("+this.name+") doesn't have a requested compoent with a key: "+key);
  }

  getComponentByKeyNonStrict(clazz, key) {
    for (let i = 0; i<this.components.size(); ++i) {
      let comp = this.components.get(i);
      if (comp.getKey().equals(key)) {
        return comp;
      }
    }
    return null;
  }

  addComponent(component) {
    this.components.add(component);
    if (this.mWorld!=null) {
      component.registerActor(this);
    }
    for (let list of this.listeners) {
      list.onComponentAdded(this, component);
    }
    return this;
  }

  removeComponent(component) {
    if (!this.components.contains(component)) {
      return this;
    }
    component.onRemove();
    this.components.remove(component);
    for (let list of this.listeners) {
      list.onComponentRemoved(this, component);
    }
    return this;
  }

  addListener(listener) {
    this.listeners.add(listener);
    return this;
  }

  removeListener(listener) {
    this.listeners.remove(listener);
    return this;
  }

  hasTag(tag) {
    return this.tags.contains(tag);
  }

  addTag(tag) {
    Guard.notEmpty(tag, "tag cannot be empty");
    this.tags.add(tag);
    return this;
  }

  addTags(tags) {
    Guard.notEmptyStringCollection(tags, "tag cannot have empty element");
    this.tags.addAll(tags);
    return this;
  }

  removeTag(tag) {
    this.tags.remove(tag);
    return this;
  }

  world() {
    return this.mWorld;
  }

  init(world) {
    Guard.notNull(world, "world cannot be null");
    Guard.beNull(this.mWorld, "actor can be placed only in a single world");
    this.mWorld = world;
    for (let comp of this.components) {
      comp.registerActor(this);
    }
    return this;
  }

  broadcastDomainUpdate(source, domain, upward, downward) {
    for (let i = 0; i<this.components.size(); ++i) {
      if (this.components.get(i).equals(source)) {
        continue;
      }
      this.components.get(i).onDomainEvent(domain, PropagationType.LOCAL);
    }
    if (upward) {
      if (!this.id.equals(ActorId.ROOT)) {
        this.mWorld.actors().parent(this.id).broadcastDomainUpdateUpward(source, domain);
      }
    }
    if (downward) {
      let childrens = this.mWorld.actors().children(this.id);
      for (let i = 0; i<childrens.size(); ++i) {
        childrens.get(i).broadcastDomainUpdateDownward(source, domain);
      }
    }
    for (let list of this.listeners) {
      list.onDomainUpdate(this, domain);
    }
    return this;
  }

  broadcastDomainUpdateUpward(source, domain) {
    let ok = true;
    for (let i = 0; i<this.components.size()&&ok; ++i) {
      if (this.components.get(i).equals(source)) {
        continue;
      }
      ok = !this.components.get(i).onDomainEvent(domain, PropagationType.UPWARD);
    }
    if (ok&&!this.id.equals(ActorId.ROOT)) {
      this.mWorld.actors().parent(this.id).broadcastDomainUpdateUpward(source, domain);
    }
  }

  broadcastDomainUpdateDownward(source, domain) {
    let ok = true;
    for (let i = 0; i<this.components.size()&&ok; ++i) {
      if (this.components.get(i).equals(source)) {
        continue;
      }
      ok = !this.components.get(i).onDomainEvent(domain, PropagationType.DOWNWARD);
    }
    if (ok) {
      let childrens = this.mWorld.actors().children(this.id);
      for (let i = 0; i<childrens.size(); ++i) {
        childrens.get(i).broadcastDomainUpdateDownward(source, domain);
      }
    }
  }

  broadcastEvent(type, event) {
    for (let i = 0; i<this.components.size(); ++i) {
      this.components.get(i).onEvent(type, event);
    }
    return this;
  }

  hashCode() {
    return this.hash;
  }

  equals(obj) {
    return this==obj;
  }

  toString() {
  }

  static create() {
    if (arguments.length===1&&arguments[0] instanceof ActorId) {
      return Actor.create_1_ActorId(arguments[0]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return Actor.create_1_string(arguments[0]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static create_1_ActorId(id) {
    let res = new Actor();
    res.id = id;
    res.name = "";
    res.guardInvariants();
    return res;
  }

  static create_1_string(id) {
    return Actor.create(ActorId.of(id));
  }

}
classRegistry.Actor = Actor;
class Actors {
  constructor() {
  }

  getClass() {
    return "Actors";
  }

}
classRegistry.Actors = Actors;
class ActorEventType {
  static OUTSPACE = ActorEventType.create("OUTSPACE");
  type;
  constructor() {
  }

  getClass() {
    return "ActorEventType";
  }

  guardInvariants() {
  }

  getType() {
    return this.type;
  }

  hashCode() {
    return this.type.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof ActorEventType)) {
      return false;
    }
    let other = obj;
    return other.type.equals(this.type);
  }

  toString() {
  }

  static create(type) {
    let res = new ActorEventType();
    res.type = type;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ActorEventType = ActorEventType;
class ActorActions {
  constructor() {
  }

  getClass() {
    return "ActorActions";
  }

  static move(dt, inputs) {
    return (actor) => {
      for (let comp of actor.getComponents()) {
        if (comp instanceof Behavior) {
          let bhv = comp;
          bhv.move(dt, inputs);
        }
      }
    };
  }

  static lateMove(dt, inputs) {
    return (actor) => {
      for (let comp of actor.getComponents()) {
        if (comp instanceof Behavior) {
          let bhv = comp;
          bhv.lateMove(dt, inputs);
        }
      }
    };
  }

}
classRegistry.ActorActions = ActorActions;
class ActorDomain {
  static TRANSFORM = ActorDomain.create("TRANSFORM");
  static VISUAL = ActorDomain.create("VISUAL");
  static COLLISION = ActorDomain.create("COLLISION");
  static COLLISION_EXCLUSION = ActorDomain.create("COLLISION_EXCLUSION");
  mDomain;
  constructor() {
  }

  getClass() {
    return "ActorDomain";
  }

  guardInvariants() {
  }

  domain() {
    return this.mDomain;
  }

  hashCode() {
    return this.mDomain.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof ActorDomain)) {
      return false;
    }
    let other = obj;
    return other.mDomain.equals(this.mDomain);
  }

  toString() {
  }

  static create(domain) {
    let res = new ActorDomain();
    res.mDomain = domain;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ActorDomain = ActorDomain;
const createPropagationType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
const PropagationType = Object.freeze({
  LOCAL: createPropagationType("LOCAL"),
  UPWARD: createPropagationType("UPWARD"),
  DOWNWARD: createPropagationType("DOWNWARD"),

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
class ActorPrefabId extends RefId {
  static TYPE = RefIdType.of("ACTOR_PREFAB_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "ActorPrefabId";
  }

  guardInvariants() {
  }

  type() {
    return ActorPrefabId.TYPE;
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
    if (!(obj instanceof ActorPrefabId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new ActorPrefabId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ActorPrefabId = ActorPrefabId;
class ActorPrefab {
  id;
  name;
  tags;
  components;
  children;
  constructor() {
  }

  getClass() {
    return "ActorPrefab";
  }

  guardInvariants() {
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getTags() {
    return this.tags;
  }

  hasTag(tag) {
    return this.tags.contains(tag);
  }

  getComponents() {
    return this.components;
  }

  getChildren() {
    return this.children;
  }

  withName(name) {
    let res = new ActorPrefab();
    res.id = this.id;
    res.name = name;
    res.tags = this.tags;
    res.components = this.components;
    res.children = this.children;
    res.guardInvariants();
    return res;
  }

  withTags(tags) {
    let res = new ActorPrefab();
    res.id = this.id;
    res.name = this.name;
    res.tags = Dut.copyImmutableSet(tags);
    res.components = this.components;
    res.children = this.children;
    res.guardInvariants();
    return res;
  }

  withId(id) {
    let res = new ActorPrefab();
    res.id = id;
    res.name = this.name;
    res.tags = this.tags;
    res.components = this.components;
    res.children = this.children;
    res.guardInvariants();
    return res;
  }

  withComponents(components) {
    let res = new ActorPrefab();
    res.id = this.id;
    res.name = this.name;
    res.tags = this.tags;
    res.components = Dut.copyImmutableList(components);
    res.children = this.children;
    res.guardInvariants();
    return res;
  }

  withAddedComponent(component) {
    let res = new ActorPrefab();
    res.id = this.id;
    res.name = this.name;
    res.tags = this.tags;
    res.components = new ArrayList();
    res.components.addAll(this.components);
    res.components.add(component);
    res.components = Collections.unmodifiableList(res.components);
    res.children = this.children;
    res.guardInvariants();
    return res;
  }

  withUpdatedComponent(idx, component) {
    let res = new ActorPrefab();
    res.id = this.id;
    res.name = this.name;
    res.tags = this.tags;
    res.components = new ArrayList();
    for (let i = 0; i<this.components.size(); ++i) {
      res.components.add(i==idx?component:this.components.get(i));
    }
    res.components = Collections.unmodifiableList(res.components);
    res.children = this.children;
    res.guardInvariants();
    return res;
  }

  withRemovedComponent(idx) {
    let res = new ActorPrefab();
    res.id = this.id;
    res.name = this.name;
    res.tags = this.tags;
    res.components = new ArrayList();
    for (let i = 0; i<this.components.size(); ++i) {
      if (i!=idx) {
        res.components.add(this.components.get(i));
      }
    }
    res.components = Collections.unmodifiableList(res.components);
    res.children = this.children;
    res.guardInvariants();
    return res;
  }

  withChildren(children) {
    let res = new ActorPrefab();
    res.id = this.id;
    res.name = this.name;
    res.tags = this.tags;
    res.components = this.components;
    res.children = Dut.copyImmutableList(children);
    res.guardInvariants();
    return res;
  }

  isIdUsed(testedId) {
    if (this.id.equals(testedId)) {
      return true;
    }
    for (let child of this.children) {
      if (child.isIdUsed(testedId)) {
        return true;
      }
    }
    return false;
  }

  toLatestVersion() {
    let res = new ActorPrefab();
    res.id = this.id;
    res.name = this.name;
    res.tags = this.tags;
    res.components = new ArrayList();
    for (let comp of this.components) {
      res.components.add(comp.toLatestVersion());
    }
    res.components = Collections.unmodifiableList(res.components);
    res.children = new ArrayList();
    for (let child of this.children) {
      res.children.add(child.toLatestVersion());
    }
    res.children = Collections.unmodifiableList(res.children);
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

  static create(id, name) {
    let res = new ActorPrefab();
    res.id = id;
    res.name = name;
    res.tags = Collections.emptySet();
    res.components = Collections.emptyList();
    res.children = Collections.emptyList();
    res.guardInvariants();
    return res;
  }

}
classRegistry.ActorPrefab = ActorPrefab;
class ActorPrefabs {
  constructor() {
  }

  getClass() {
    return "ActorPrefabs";
  }

  static findAllByTag(assets, tag) {
    let res = new ArrayList();
    for (let id of assets.getKeys(ActorPrefabId.TYPE)) {
      let prefab = assets.get("ActorPrefab", id);
      if (prefab.hasTag(tag)) {
        res.add(prefab);
      }
    }
    return res;
  }

}
classRegistry.ActorPrefabs = ActorPrefabs;
class CreateActorRequest {
  prefab;
  actorId;
  pos;
  rot;
  constructor() {
  }

  getClass() {
    return "CreateActorRequest";
  }

  guardInvariants() {
  }

  getPrefab() {
    return this.prefab;
  }

  getActorId() {
    return this.actorId;
  }

  getPos() {
    return this.pos;
  }

  getRot() {
    return this.rot;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(prefab, actorId, pos, rot) {
    let res = new CreateActorRequest();
    res.actorId = actorId;
    res.prefab = prefab;
    res.pos = pos;
    res.rot = rot;
    res.guardInvariants();
    return res;
  }

}
classRegistry.CreateActorRequest = CreateActorRequest;
class ComponentEffect {
  static ABSOLUTE_COORDINATES = ComponentEffect.create("ABSOLUTE_COORDINATES");
  mEffect;
  constructor() {
  }

  getClass() {
    return "ComponentEffect";
  }

  guardInvariants() {
  }

  effect() {
    return this.mEffect;
  }

  hashCode() {
    return this.mEffect.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof ComponentEffect)) {
      return false;
    }
    let other = obj;
    return other.mEffect.equals(this.mEffect);
  }

  toString() {
  }

  static create(effect) {
    let res = new ComponentEffect();
    res.mEffect = effect;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ComponentEffect = ComponentEffect;
class ComponentFeature {
  static AABB_PRODUCER = ComponentFeature.create("AABB_PRODUCER");
  static COLLIDER = ComponentFeature.create("COLLIDER");
  static COLLISION_EXCLUSION_PRODUCER = ComponentFeature.create("COLLISION_EXCLUSION_PRODUCER");
  static RIGID_BODY_JOINT = ComponentFeature.create("RIGID_BODY_JOINT");
  mFeature;
  constructor() {
  }

  getClass() {
    return "ComponentFeature";
  }

  guardInvariants() {
  }

  feature() {
    return this.mFeature;
  }

  hashCode() {
    return this.mFeature.hashCode();
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof ComponentFeature)) {
      return false;
    }
    let other = obj;
    return other.mFeature.equals(this.mFeature);
  }

  toString() {
  }

  static create(feature) {
    let res = new ComponentFeature();
    res.mFeature = feature;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ComponentFeature = ComponentFeature;
class Component {
  mActor = null;
  mKey = "";
  hash = Randoms.nextInt(0, 10000000);
  constructor() {
  }

  getClass() {
    return "Component";
  }

  registerActor(actor) {
    Guard.beNull(this.mActor, "component can be added to the actor only once");
    this.mActor = actor;
    if (StringUtils.isNotEmpty(this.mKey)) {
      let compByKey = actor.getComponentByKeyNonStrict("Component", this.mKey);
      if (compByKey!=null&&!compByKey.equals(this)) {
        throw new Error("component key is duplicated: "+this.mKey);
      }
    }
    this.init();
  }

  init() {
  }

  getEffects() {
    return Collections.emptySet();
  }

  getFeatures() {
    return Collections.emptySet();
  }

  hasFeature(feature) {
    return this.getFeatures().contains(feature);
  }

  onDomainEvent(domain, propagationType) {
    return false;
  }

  onRemove() {
  }

  onEvent(type, event) {
  }

  actor() {
    return this.mActor;
  }

  world() {
    return this.mActor.world();
  }

  getKey() {
    return this.mKey;
  }

  setKey(key) {
    Guard.notNull(key, "key cannot be null");
    if (this.mActor!=null&&StringUtils.isNotEmpty(key)) {
      if (this.mActor.getComponentByKeyNonStrict("Component", key)!=null) {
        throw new Error("component key is duplicated: "+key);
      }
    }
    this.mKey = key;
    return this;
  }

  broadcastDomainUpdate(domain, upward, downward) {
    if (this.mActor!=null) {
      this.mActor.broadcastDomainUpdate(this, domain, upward, downward);
    }
  }

  sendEvent(targetId, type, event) {
    if (this.world().actors().exists(targetId)) {
      this.world().actors().get(targetId).broadcastEvent(type, event);
    }
  }

  hashCode() {
    return this.hash;
  }

  equals(obj) {
    return this==obj;
  }

}
classRegistry.Component = Component;
class Behavior extends Component {
  constructor() {
    super();
  }

  getClass() {
    return "Behavior";
  }

  move(dt, inputs) {
  }

  lateMove(dt, inputs) {
  }

}
classRegistry.Behavior = Behavior;
class TransformComponent extends Component {
  pos = Vec3.ZERO;
  rot = Quaternion.ZERO_ROT;
  localMat = null;
  globalMat = null;
  globalMatInv = null;
  localAabb = null;
  globalAabb = null;
  constructor() {
    super();
  }

  getClass() {
    return "TransformComponent";
  }

  onDomainEvent(domain, propagationType) {
    if (domain.equals(ActorDomain.TRANSFORM)) {
      if (this.actor().hasEffect(ComponentEffect.ABSOLUTE_COORDINATES)) {
        return true;
      }
      this.globalMat = null;
      this.globalMatInv = null;
      this.globalAabb = null;
    }
    else if (domain.equals(ActorDomain.VISUAL)||domain.equals(ActorDomain.COLLISION)) {
      this.localAabb = null;
      this.globalAabb = null;
    }
    return false;
  }

  isAbsolute() {
    return this.actor().hasEffect(ComponentEffect.ABSOLUTE_COORDINATES);
  }

  getPos() {
    return this.pos;
  }

  setPos() {
    if (arguments.length===1&&arguments[0] instanceof Vec3) {
      return this.setPos_1_Vec3(arguments[0]);
    }
    else if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return this.setPos_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setPos_1_Vec3(pos) {
    this.pos = pos;
    this.localMat = null;
    this.globalMat = null;
    this.globalMatInv = null;
    this.globalAabb = null;
    this.broadcastDomainUpdate(ActorDomain.TRANSFORM, false, true);
    return this;
  }

  setPos_3_number_number_number(x, y, z) {
    return this.setPos(Vec3.create(x, y, z));
  }

  getRot() {
    return this.rot;
  }

  setRot(rot) {
    this.rot = rot;
    this.localMat = null;
    this.globalMat = null;
    this.globalMatInv = null;
    this.globalAabb = null;
    this.broadcastDomainUpdate(ActorDomain.TRANSFORM, false, true);
    return this;
  }

  move() {
    if (arguments.length===1&&arguments[0] instanceof Vec3) {
      return this.move_1_Vec3(arguments[0]);
    }
    else if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return this.move_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  move_1_Vec3(delta) {
    if (delta.equals(Vec3.ZERO)) {
      return this;
    }
    this.pos = this.pos.add(delta);
    this.localMat = null;
    this.globalMat = null;
    this.globalMatInv = null;
    this.globalAabb = null;
    this.broadcastDomainUpdate(ActorDomain.TRANSFORM, false, true);
    return this;
  }

  move_3_number_number_number(dx, dy, dz) {
    if (dx==0&&dy==0&&dz==0) {
      return this;
    }
    this.pos = this.pos.add(dx, dy, dz);
    this.localMat = null;
    this.globalMat = null;
    this.globalMatInv = null;
    this.globalAabb = null;
    this.broadcastDomainUpdate(ActorDomain.TRANSFORM, false, true);
    return this;
  }

  rotate(dt, w) {
    if (w.equals(Vec3.ZERO)) {
      return this;
    }
    let wq = Quaternion.create(0, w.x(), w.y(), w.z());
    this.rot = this.rot.add(wq.mul(this.rot).scale(dt*0.5)).normalize();
    this.localMat = null;
    this.globalMat = null;
    this.globalMatInv = null;
    this.globalAabb = null;
    this.broadcastDomainUpdate(ActorDomain.TRANSFORM, false, true);
    return this;
  }

  lookAt() {
    if (arguments.length===3&&arguments[0] instanceof Vec3&&arguments[1] instanceof Vec3&&arguments[2] instanceof Vec3) {
      return this.lookAt_3_Vec3_Vec3_Vec3(arguments[0], arguments[1], arguments[2]);
    }
    else if (arguments.length===2&&arguments[0] instanceof Vec3&&arguments[1] instanceof Vec3) {
      return this.lookAt_2_Vec3_Vec3(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  lookAt_3_Vec3_Vec3_Vec3(pos, target, upDir) {
    let fwd = target.sub(pos).normalize();
    let fwdxz = Vec2.create(fwd.x(), fwd.z()).normalize();
    let rotX = FMath.asin(fwd.y());
    let rotY = fwdxz.x()>=0?-FMath.acos(-fwdxz.y()):FMath.acos(-fwdxz.y());
    let rx = Quaternion.rot(1, 0, 0, rotX);
    let ry = Quaternion.rot(0, 1, 0, rotY);
    this.pos = pos;
    this.rot = ry.mul(rx);
    this.localMat = null;
    this.globalMat = null;
    this.globalMatInv = null;
    this.globalAabb = null;
    this.broadcastDomainUpdate(ActorDomain.TRANSFORM, false, true);
    return this;
  }

  lookAt_2_Vec3_Vec3(target, upDir) {
    return this.lookAt(this.pos, target, upDir);
  }

  getMat() {
    this.syncCache(false);
    return this.localMat;
  }

  getGlobalMat() {
    this.syncCache(false);
    return this.globalMat;
  }

  toGlobal(pt) {
    this.syncCache(false);
    return this.globalMat.mul(pt);
  }

  toGlobalRot(dir) {
    this.syncCache(false);
    let x = this.globalMat.m00()*dir.x()+this.globalMat.m01()*dir.y()+this.globalMat.m02()*dir.z();
    let y = this.globalMat.m10()*dir.x()+this.globalMat.m11()*dir.y()+this.globalMat.m12()*dir.z();
    let z = this.globalMat.m20()*dir.x()+this.globalMat.m21()*dir.y()+this.globalMat.m22()*dir.z();
    return Vec3.create(x, y, z);
  }

  toLocal(pt) {
    this.syncCache(true);
    return this.globalMatInv.mul(pt);
  }

  toLocalRot(dir) {
    this.syncCache(false);
    let x = this.globalMatInv.m00()*dir.x()+this.globalMatInv.m01()*dir.y()+this.globalMatInv.m02()*dir.z();
    let y = this.globalMatInv.m10()*dir.x()+this.globalMatInv.m11()*dir.y()+this.globalMatInv.m12()*dir.z();
    let z = this.globalMatInv.m20()*dir.x()+this.globalMatInv.m21()*dir.y()+this.globalMatInv.m22()*dir.z();
    return Vec3.create(x, y, z);
  }

  getGlobalAabb() {
    this.syncCache(false);
    if (this.localAabb==null) {
      this.localAabb = Aabb3.create(Vec3.ZERO, Vec3.ZERO);
      let cmps = this.actor().getComponents();
      for (let i = 0; i<cmps.size(); ++i) {
        let cmp = cmps.get(i);
        if (cmp.hasFeature(ComponentFeature.AABB_PRODUCER)) {
          let cmpLocalAabb = (cmp).getLocalAabb();
          this.localAabb = this.localAabb.expand(cmpLocalAabb);
        }
      }
    }
    if (this.globalAabb==null&&this.localAabb!=null) {
      this.globalAabb = this.localAabb.transform(this.globalMat).expand(0.01);
    }
    return this.globalAabb;
  }

  syncCache(globalMatInvReq) {
    if (this.localMat==null) {
      this.localMat = Mat44.transofm(this.pos, this.rot);
    }
    if (this.globalMat==null) {
      this.globalMat = this.localMat;
      let act = this.actor();
      if (!act.hasEffect(ComponentEffect.ABSOLUTE_COORDINATES)&&!act.getId().equals(ActorId.ROOT)) {
        let parent = this.world().actors().parent(act.getId());
        if (parent.hasComponent("TransformComponent")) {
          let parentGlobalMat = parent.getComponent("TransformComponent").getGlobalMat();
          this.globalMat = parentGlobalMat.mul(this.localMat);
        }
      }
    }
    if (globalMatInvReq&&this.globalMatInv==null) {
      this.globalMatInv = this.globalMat.inv();
    }
  }

  toString() {
  }

  static create() {
    return new TransformComponent();
  }

}
classRegistry.TransformComponent = TransformComponent;
class AutoRotateComponent extends Behavior {
  angularVelocity = Vec3.ZERO;
  transform;
  constructor() {
    super();
  }

  getClass() {
    return "AutoRotateComponent";
  }

  guardInvariants() {
  }

  init() {
    this.transform = this.actor().getComponent("TransformComponent");
  }

  getAngularVelocity() {
    return this.angularVelocity;
  }

  setAngularVelocity(angularVelocity) {
    Guard.notNull(angularVelocity, "angularVelocity cannot be null");
    this.angularVelocity = angularVelocity;
    return this;
  }

  move(dt, inputs) {
    this.transform.rotate(dt, this.angularVelocity);
  }

  toString() {
  }

  static create() {
    let res = new AutoRotateComponent();
    res.guardInvariants();
    return res;
  }

}
classRegistry.AutoRotateComponent = AutoRotateComponent;
class ModelComponent extends Component {
  static FEATURES = Dut.immutableSet(ComponentFeature.AABB_PRODUCER);
  modelId;
  transform;
  interpolation;
  visible = true;
  castShadows = true;
  receiveShadows = true;
  transformComp;
  globalMat = null;
  localAabb = null;
  constructor() {
    super();
  }

  getClass() {
    return "ModelComponent";
  }

  guardInvariants() {
  }

  init() {
    this.transformComp = this.actor().getComponent("TransformComponent");
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
  }

  getFeatures() {
    return ModelComponent.FEATURES;
  }

  onDomainEvent(domain, propagationType) {
    if (domain.equals(ActorDomain.TRANSFORM)) {
      this.globalMat = null;
    }
    return false;
  }

  getModelId() {
    return this.modelId;
  }

  setModelId(modelId) {
    Guard.notNull(modelId, "modelId cannot be null");
    this.modelId = modelId;
    this.localAabb = null;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  getTransform() {
    return this.transform;
  }

  setTransform(transform) {
    Guard.notNull(transform, "transform cannot be null");
    this.transform = transform;
    this.localAabb = null;
    this.globalMat = null;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  getInterpolation() {
    return this.interpolation;
  }

  setInterpolation(interpolation) {
    Guard.notNull(interpolation, "interpolation cannot be null");
    this.interpolation = interpolation;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  isVisible() {
    return this.visible;
  }

  setVisible(visible) {
    this.visible = visible;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  isCastShadows() {
    return this.castShadows;
  }

  setCastShadows(castShadows) {
    this.castShadows = castShadows;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  isReceiveShadows() {
    return this.receiveShadows;
  }

  setReceiveShadows(receiveShadows) {
    this.receiveShadows = receiveShadows;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  getModel() {
    return this.world().assets().get("Model", this.modelId);
  }

  getLocalAabb() {
    if (this.localAabb==null) {
      let modelAabb = this.world().assets().getCompanion("Aabb3", this.modelId, AssetCompanionType.BOUNDING_AABB);
      this.localAabb = modelAabb.transform(this.transform);
    }
    return this.localAabb;
  }

  getGlobalMat() {
    this.syncCache();
    return this.globalMat;
  }

  toGlobal(pt) {
    this.syncCache();
    return this.globalMat.mul(pt);
  }

  syncCache() {
    if (this.globalMat==null) {
      let tcGlobal = this.transformComp.getGlobalMat();
      if (this.transform.equals(Mat44.IDENTITY)) {
        this.globalMat = tcGlobal;
      }
      else {
        this.globalMat = tcGlobal.mul(this.transform);
      }
    }
  }

  toString() {
  }

  static create() {
    let res = new ModelComponent();
    res.modelId = ModelId.of("empty");
    res.transform = Mat44.IDENTITY;
    res.interpolation = Interpolation.create(0, 0, 0);
    res.guardInvariants();
    return res;
  }

}
classRegistry.ModelComponent = ModelComponent;
class LightComponent extends Component {
  enabled;
  type;
  shadow;
  color;
  constructor() {
    super();
  }

  getClass() {
    return "LightComponent";
  }

  guardInvariants() {
  }

  isEnabled() {
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    return this;
  }

  getType() {
    return this.type;
  }

  setType(type) {
    Guard.beTrue(type==LightType.DIRECTIONAL, "only DIRECTIONAL is supported at the moment");
    this.type = type;
    return this;
  }

  isShadow() {
    return this.shadow;
  }

  setShadow(shadow) {
    this.shadow = shadow;
    return this;
  }

  getColor() {
    return this.color;
  }

  setColor(color) {
    this.color = color;
    return this;
  }

  getAmbient() {
    return this.color.getAmbient();
  }

  setAmbient(ambient) {
    this.color = this.color.withAmbient(ambient);
    return this;
  }

  getDiffuse() {
    return this.color.getDiffuse();
  }

  setDiffuse(diffuse) {
    this.color = this.color.withDiffuse(diffuse);
    return this;
  }

  getSpecular() {
    return this.color.getSpecular();
  }

  setSpecular(specular) {
    this.color = this.color.withSpecular(specular);
    return this;
  }

  toString() {
  }

  static create() {
    let res = new LightComponent();
    res.enabled = true;
    res.type = LightType.DIRECTIONAL;
    res.shadow = false;
    res.color = LightColor.create(Rgb.gray(0.5), Rgb.gray(0.5), Rgb.WHITE);
    res.guardInvariants();
    return res;
  }

}
classRegistry.LightComponent = LightComponent;
class CameraComponent extends Component {
  static FWD = Vec3.create(0, 0, -1);
  static UP = Vec3.create(0, 1, 0);
  type;
  fovy;
  aspect;
  near;
  far;
  skyboxNear;
  skyboxFar;
  customCamera = Camera.persp(this.fovy, this.aspect, 1.0, 50.0).lookAt(Vec3.create(0, 2, 7), Vec3.ZERO, Vec3.create(0, 1, 0));
  cameraCache = null;
  skyboxCameraCache = null;
  transformComp;
  tcGlobalMatCache = Mat44.IDENTITY;
  constructor() {
    super();
  }

  getClass() {
    return "CameraComponent";
  }

  guardInvariants() {
  }

  init() {
    this.transformComp = this.actor().getComponent("TransformComponent");
  }

  getType() {
    return this.type;
  }

  setType(type) {
    Guard.notNull(type, "type cannot be null");
    this.type = type;
    this.tcGlobalMatCache = null;
    return this;
  }

  getFovy() {
    return this.fovy;
  }

  setFovy(fovy) {
    this.fovy = fovy;
    this.tcGlobalMatCache = null;
    return this;
  }

  getAspect() {
    return this.aspect;
  }

  setAspect(aspect) {
    this.aspect = aspect;
    this.tcGlobalMatCache = null;
    return this;
  }

  getNear() {
    return this.near;
  }

  setNear(near) {
    this.near = near;
    this.tcGlobalMatCache = null;
    return this;
  }

  getFar() {
    return this.far;
  }

  setFar(far) {
    this.far = far;
    this.tcGlobalMatCache = null;
    return this;
  }

  getSkyboxNear() {
    return this.skyboxNear;
  }

  setSkyboxNear(skyboxNear) {
    this.skyboxNear = skyboxNear;
    return this;
  }

  getSkyboxFar() {
    return this.skyboxFar;
  }

  setSkyboxFar(skyboxFar) {
    this.skyboxFar = skyboxFar;
    return this;
  }

  setPersp() {
    if (arguments.length===6&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number"&& typeof arguments[3]==="number"&& typeof arguments[4]==="number"&& typeof arguments[5]==="number") {
      return this.setPersp_6_number_number_number_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    }
    else if (arguments.length===4&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number"&& typeof arguments[3]==="number") {
      return this.setPersp_4_number_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setPersp_6_number_number_number_number_number_number(fovy, aspect, near, far, skyboxNear, skyboxFar) {
    this.type = CameraType.PERSPECTIVE;
    this.fovy = fovy;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.skyboxNear = skyboxNear;
    this.skyboxFar = skyboxFar;
    this.tcGlobalMatCache = null;
    return this;
  }

  setPersp_4_number_number_number_number(fovy, aspect, near, far) {
    return this.setPersp(fovy, aspect, near, far, far/2, far*100);
  }

  setCustomCamera(customCamera) {
    this.type = CameraType.CUSTOM;
    this.customCamera = customCamera;
    this.tcGlobalMatCache = null;
    return this;
  }

  getCamera() {
    if (this.type.equals(CameraType.PERSPECTIVE)) {
      this.syncCache();
      return this.cameraCache;
    }
    else if (this.type.equals(CameraType.CUSTOM)) {
      return this.customCamera;
    }
    else {
      throw new Error("unsupported camera type: "+this.type);
    }
  }

  getSkyboxCamera() {
    if (this.type.equals(CameraType.PERSPECTIVE)) {
      this.syncCache();
      return this.skyboxCameraCache;
    }
    else if (this.type.equals(CameraType.CUSTOM)) {
      return this.customCamera;
    }
    else {
      throw new Error("unsupported camera type: "+this.type);
    }
  }

  syncCache() {
    let tcGlobal = this.transformComp.getGlobalMat();
    if (tcGlobal==this.tcGlobalMatCache||tcGlobal.equals(this.tcGlobalMatCache)) {
      return ;
    }
    this.tcGlobalMatCache = tcGlobal;
    let pos = this.transformComp.toGlobal(Vec3.ZERO);
    let lookAt = this.transformComp.toGlobal(CameraComponent.FWD);
    let upPt = this.transformComp.toGlobal(CameraComponent.UP);
    this.cameraCache = Camera.persp(this.fovy, this.aspect, this.near, this.far).lookAt(pos, lookAt, upPt.sub(pos));
    this.skyboxCameraCache = Camera.persp(this.fovy, this.aspect, this.skyboxNear, this.skyboxFar).lookAt(pos, lookAt, upPt.sub(pos));
  }

  toString() {
  }

  static create() {
    let res = new CameraComponent();
    res.type = CameraType.PERSPECTIVE;
    res.fovy = FMath.toRadians(60);
    res.aspect = 1;
    res.near = 0.1;
    res.far = 100.0;
    res.skyboxNear = 50;
    res.skyboxFar = 10000;
    res.guardInvariants();
    return res;
  }

}
classRegistry.CameraComponent = CameraComponent;
class CameraFovyComponent extends Behavior {
  displaySizeInputKey = "display.size";
  fovyLandscape = FMath.toRadians(60);
  fovyPortrait = FMath.toRadians(90);
  displaySize = Size2.create(1, 1);
  camera;
  constructor() {
    super();
  }

  getClass() {
    return "CameraFovyComponent";
  }

  guardInvariants() {
  }

  init() {
    this.camera = this.actor().getComponent("CameraComponent");
  }

  move(dt, inputs) {
    let newSize = inputs.getSize2(this.displaySizeInputKey, this.displaySize);
    if (newSize.equals(this.displaySize)) {
      return ;
    }
    this.displaySize = newSize;
    let aspect = this.displaySize.aspect();
    let fovy = aspect>=1?this.fovyLandscape:this.fovyPortrait;
    this.camera.setFovy(fovy).setAspect(aspect);
  }

  getDisplaySizeInputKey() {
    return this.displaySizeInputKey;
  }

  setDisplaySizeInputKey(displaySizeInputKey) {
    Guard.notEmpty(displaySizeInputKey, "displaySizeInputKey cannot be empty");
    this.displaySizeInputKey = displaySizeInputKey;
    return this;
  }

  getFovyLandscape() {
    return this.fovyLandscape;
  }

  setFovyLandscape(fovyLandscape) {
    Guard.beTrue(0<fovyLandscape&&fovyLandscape<=FMath.PI, "fovyLandscape must be in (0, PI]");
    this.fovyLandscape = fovyLandscape;
    return this;
  }

  getFovyPortrait() {
    return this.fovyPortrait;
  }

  setFovyPortrait(fovyPortrait) {
    Guard.beTrue(0<fovyPortrait&&fovyPortrait<=FMath.PI, "fovyPortrait must be in (0, PI]");
    this.fovyPortrait = fovyPortrait;
    return this;
  }

  static create() {
    let res = new CameraFovyComponent();
    res.guardInvariants();
    return res;
  }

}
classRegistry.CameraFovyComponent = CameraFovyComponent;
class SkyboxComponent extends Component {
  modelId;
  transform;
  visible = true;
  transformComp;
  globalMat = null;
  constructor() {
    super();
  }

  getClass() {
    return "SkyboxComponent";
  }

  guardInvariants() {
  }

  init() {
    this.transformComp = this.actor().getComponent("TransformComponent");
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
  }

  onDomainEvent(domain, propagationType) {
    if (domain.equals(ActorDomain.TRANSFORM)) {
      this.globalMat = null;
    }
    return false;
  }

  getModelId() {
    return this.modelId;
  }

  setModelId(modelId) {
    Guard.notNull(modelId, "modelId cannot be null");
    this.modelId = modelId;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  getTransform() {
    return this.transform;
  }

  setTransform(transform) {
    Guard.notNull(transform, "transform cannot be null");
    this.transform = transform;
    this.globalMat = null;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  isVisible() {
    return this.visible;
  }

  setVisible(visible) {
    this.visible = visible;
    this.broadcastDomainUpdate(ActorDomain.VISUAL, false, false);
    return this;
  }

  getModel() {
    return this.world().assets().get("Model", this.modelId);
  }

  getGlobalMat() {
    this.syncCache();
    return this.globalMat;
  }

  toGlobal(pt) {
    this.syncCache();
    return this.globalMat.mul(pt);
  }

  syncCache() {
    if (this.globalMat==null) {
      let tcGlobal = this.transformComp.getGlobalMat();
      if (this.transform.equals(Mat44.IDENTITY)) {
        this.globalMat = tcGlobal;
      }
      else {
        this.globalMat = tcGlobal.mul(this.transform);
      }
    }
  }

  toString() {
  }

  static create() {
    let res = new SkyboxComponent();
    res.modelId = ModelId.of("empty");
    res.transform = Mat44.IDENTITY;
    res.guardInvariants();
    return res;
  }

}
classRegistry.SkyboxComponent = SkyboxComponent;
class WorldComponent extends Behavior {
  gravity;
  drag = 0.5;
  angularDrag = 0.5;
  boundary = Aabb3.create(-1000, -1000, -1000, 1000, 1000, 1000);
  action;
  constructor() {
    super();
  }

  getClass() {
    return "WorldComponent";
  }

  guardInvariants() {
  }

  move(dt, inputs) {
    this.world().actors().forEach(ActorId.ROOT, this.action);
  }

  getGravity() {
    return this.gravity;
  }

  setGravity(gravity) {
    Guard.notNull(gravity, "gravity cannot be null");
    this.gravity = gravity;
    this.action = this.createActorAction();
    return this;
  }

  getDrag() {
    return this.drag;
  }

  setDrag(drag) {
    this.drag = drag;
    this.action = this.createActorAction();
    return this;
  }

  getAngularDrag() {
    return this.angularDrag;
  }

  setAngularDrag(angularDrag) {
    this.angularDrag = angularDrag;
    this.action = this.createActorAction();
    return this;
  }

  getBoundary() {
    return this.boundary;
  }

  setBoundary(boundary) {
    this.boundary = boundary;
    return this;
  }

  createActorAction() {
    return (fncActor) => {
      let rb = fncActor.getComponentNonStrict("RigidBodyComponent");
      if (rb!=null) {
        if (!rb.isKinematic()) {
          let gForce = this.gravity.scale(rb.getMass());
          rb.applyForce(rb.getPos(), gForce);
          let dragForce = rb.getVelocity().scale(-this.drag);
          rb.applyForce(rb.getPos(), dragForce);
          let dragTorque = rb.getAngularVelocity().scale(-this.angularDrag);
          rb.applyTorque(dragTorque);
        }
        if (!this.boundary.isInside(rb.getPos())) {
          fncActor.broadcastEvent(ActorEventType.OUTSPACE, null);
        }
      }
      else {
        let tc = fncActor.getComponentNonStrict("TransformComponent");
        if (tc!=null) {
          let pos = tc.toGlobal(Vec3.ZERO);
          if (!this.boundary.isInside(pos)) {
            fncActor.broadcastEvent(ActorEventType.OUTSPACE, null);
          }
        }
      }
    };
  }

  static create() {
    let res = new WorldComponent();
    res.gravity = Vec3.create(0, -9.81, 0);
    res.drag = 0.5;
    res.angularDrag = 0.5;
    res.boundary = Aabb3.create(-1000, -1000, -1000, 1000, 1000, 1000);
    res.guardInvariants();
    res.action = res.createActorAction();
    return res;
  }

}
classRegistry.WorldComponent = WorldComponent;
class ColliderComponent extends Component {
  static FEATURES = Dut.immutableSet(ComponentFeature.AABB_PRODUCER, ComponentFeature.COLLIDER);
  active = true;
  trigger = false;
  layer;
  materialId;
  pos = Vec3.ZERO;
  rot = Quaternion.ZERO_ROT;
  shape = ColliderShape.SPHERE;
  radius = 1;
  ex = 0.5;
  ey = 0.5;
  ez = 0.5;
  height = 2;
  localMat = Mat44.IDENTITY;
  transformComp;
  globalMat = null;
  volume = null;
  localAabb = null;
  constructor() {
    super();
  }

  getClass() {
    return "ColliderComponent";
  }

  guardInvariants() {
  }

  init() {
    this.transformComp = this.actor().getComponent("TransformComponent");
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
  }

  getFeatures() {
    return ColliderComponent.FEATURES;
  }

  onDomainEvent(domain, propagationType) {
    if (domain.equals(ActorDomain.TRANSFORM)) {
      this.globalMat = null;
      this.volume = null;
    }
    return false;
  }

  isActive() {
    return this.active;
  }

  setActive(active) {
    this.active = active;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  isTrigger() {
    return this.trigger;
  }

  setTrigger(trigger) {
    this.trigger = trigger;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  getLayer() {
    return this.layer;
  }

  setLayer(layer) {
    Guard.notNull(layer, "layer cannot be null");
    this.layer = layer;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  getGlobalAabb() {
    this.syncCache();
    return this.transformComp.getGlobalAabb();
  }

  getMaterialId() {
    return this.materialId;
  }

  setMaterialId(materialId) {
    Guard.notNull(materialId, "materialId cannot be null");
    this.materialId = materialId;
    return this;
  }

  getMaterial() {
    return this.world().assets().get("PhysicalMaterial", this.materialId);
  }

  getPos() {
    return this.pos;
  }

  setPos() {
    if (arguments.length===1&&arguments[0] instanceof Vec3) {
      return this.setPos_1_Vec3(arguments[0]);
    }
    else if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return this.setPos_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setPos_1_Vec3(pos) {
    this.pos = pos;
    this.localMat = null;
    this.globalMat = null;
    this.volume = null;
    this.localAabb = null;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  setPos_3_number_number_number(x, y, z) {
    return this.setPos(Vec3.create(x, y, z));
  }

  getRot() {
    return this.rot;
  }

  setRot(rot) {
    this.rot = rot;
    this.localMat = null;
    this.globalMat = null;
    this.volume = null;
    this.localAabb = null;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  getShape() {
    return this.shape;
  }

  setShape(shape) {
    this.shape = shape;
    this.volume = null;
    this.localAabb = null;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  getRadius() {
    return this.radius;
  }

  setRadius(radius) {
    this.radius = radius;
    this.volume = null;
    this.localAabb = null;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  getSize() {
    return Vec3.create(this.ex*2, this.ey*2, this.ez*2);
  }

  setSize() {
    if (arguments.length===1&&arguments[0] instanceof Vec3) {
      return this.setSize_1_Vec3(arguments[0]);
    }
    else if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return this.setSize_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setSize_1_Vec3(size) {
    this.ex = size.x()/2;
    this.ey = size.y()/2;
    this.ez = size.z()/2;
    this.volume = null;
    this.localAabb = null;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  setSize_3_number_number_number(sx, sy, sz) {
    return this.setSize(Vec3.create(sx, sy, sz));
  }

  getHeight() {
    return this.height;
  }

  setHeight(height) {
    this.height = height;
    this.volume = null;
    this.localAabb = null;
    this.broadcastDomainUpdate(ActorDomain.COLLISION, false, false);
    return this;
  }

  getVolume() {
    this.syncCache();
    return this.volume;
  }

  toGlobal(pt) {
    this.syncCache();
    return this.globalMat.mul(pt);
  }

  getLocalAabb() {
    this.syncCache();
    return this.localAabb;
  }

  randomPoint() {
    this.syncCache();
    if (this.shape.equals(ColliderShape.SPHERE)) {
      let r = RandomUtils.nextFloat(0, this.radius);
      let nx = RandomUtils.nextFloat(0, 1)-1;
      let ny = RandomUtils.nextFloat(0, 1)-1;
      let nz = RandomUtils.nextFloat(0, 1)-1;
      let mag = FMath.sqrt(nx*nx+ny*ny+nz*nz);
      nx = nx/mag;
      ny = ny/mag;
      nz = nz/mag;
      return this.globalMat.mul(nx*this.radius, ny*this.radius, nz*this.radius);
    }
    else if (this.shape.equals(ColliderShape.BOX)) {
      let x = RandomUtils.nextFloat(-this.ex, this.ex);
      let y = RandomUtils.nextFloat(-this.ey, this.ey);
      let z = RandomUtils.nextFloat(-this.ez, this.ez);
      return this.globalMat.mul(x, y, z);
    }
    else if (this.shape.equals(ColliderShape.CAPSULE)) {
      throw new Error("TODO");
    }
    else {
      throw new Error("unsupported shape: "+this.shape);
    }
  }

  syncCache() {
    if (this.localMat==null) {
      if (this.pos.equals(Vec3.ZERO)&&this.rot.equals(Quaternion.ZERO_ROT)) {
        this.localMat = Mat44.IDENTITY;
        this.globalMat = this.transformComp.getGlobalMat();
      }
      else {
        this.localMat = Mat44.transofm(this.pos, this.rot);
        this.globalMat = this.transformComp.getGlobalMat().mul(this.localMat);
      }
    }
    if (this.globalMat==null) {
      this.globalMat = this.transformComp.getGlobalMat().mul(this.localMat);
    }
    if (this.volume==null) {
      if (this.shape.equals(ColliderShape.SPHERE)) {
        let p = Vec3.create(this.globalMat.m03(), this.globalMat.m13(), this.globalMat.m23());
        this.volume = CollisionSphere.create(p, this.radius);
      }
      else if (this.shape.equals(ColliderShape.BOX)) {
        let p = Vec3.create(this.globalMat.m03(), this.globalMat.m13(), this.globalMat.m23());
        let dirX = Vec3.create(this.globalMat.m00(), this.globalMat.m10(), this.globalMat.m20());
        let dirY = Vec3.create(this.globalMat.m01(), this.globalMat.m11(), this.globalMat.m21());
        let dirZ = Vec3.create(this.globalMat.m02(), this.globalMat.m12(), this.globalMat.m22());
        this.volume = CollisionBox.create(p, dirX, dirY, dirZ, this.ex, this.ey, this.ez);
      }
      else if (this.shape.equals(ColliderShape.CAPSULE)) {
        let p1 = this.globalMat.mul(Vec3.create(0, this.height/2-this.radius, 0));
        let p2 = this.globalMat.mul(Vec3.create(0, this.radius-this.height/2, 0));
        this.volume = CollisionCapsule.create(p1, p2, this.radius);
      }
      else {
        throw new Error("unsupported shape: "+this.shape);
      }
    }
    if (this.localAabb==null) {
      let baseAabb = null;
      if (this.shape.equals(ColliderShape.SPHERE)) {
        baseAabb = Aabb3.create(-this.radius, -this.radius, -this.radius, this.radius, this.radius, this.radius);
      }
      else if (this.shape.equals(ColliderShape.BOX)) {
        baseAabb = Aabb3.create(-this.ex, -this.ey, -this.ez, this.ex, this.ey, this.ez);
      }
      else if (this.shape.equals(ColliderShape.CAPSULE)) {
        baseAabb = Aabb3.create(-this.radius, -this.height/2, -this.radius, this.radius, this.height/2, this.radius);
      }
      else {
        throw new Error("unsupported shape: "+this.shape);
      }
      this.localAabb = this.localMat.equals(Mat44.IDENTITY)?baseAabb:baseAabb.transform(this.localMat);
    }
  }

  toString() {
  }

  static create() {
    let res = new ColliderComponent();
    res.layer = CollisionLayer.OBJECT;
    res.materialId = PhysicalMaterialId.of("default");
    res.shape = ColliderShape.SPHERE;
    res.pos = Vec3.ZERO;
    res.rot = Quaternion.ZERO_ROT;
    res.radius = 1;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ColliderComponent = ColliderComponent;
class RigidBodyComponent extends Component {
  static RB_EFFECTS = Dut.immutableSet(ComponentEffect.ABSOLUTE_COORDINATES);
  kinematic = false;
  mass = 1;
  inverseMass = 1/this.mass;
  localInertia = null;
  inverseInertia = null;
  rotationLock = false;
  damp = 0.995;
  angularDamp = 0.995;
  velocity = Vec3.ZERO;
  angularVelocity = Vec3.ZERO;
  forceAccum = Vec3.ZERO;
  torqueAccum = Vec3.ZERO;
  transform;
  constructor() {
    super();
  }

  getClass() {
    return "RigidBodyComponent";
  }

  guardInvariants() {
  }

  init() {
    this.transform = this.actor().getComponent("TransformComponent");
    this.localInertia = null;
  }

  onDomainEvent(domain, propagationType) {
    if (domain.equals(ActorDomain.TRANSFORM)) {
      this.inverseInertia = null;
    }
    else if (domain.equals(ActorDomain.COLLISION)) {
      this.localInertia = null;
      this.inverseInertia = null;
    }
    return false;
  }

  getEffects() {
    return RigidBodyComponent.RB_EFFECTS;
  }

  isKinematic() {
    return this.kinematic;
  }

  getInverseMass() {
    return this.kinematic?0:this.inverseMass;
  }

  getInverseInertia() {
    if (this.kinematic||this.rotationLock) {
      return Mat33.ZERO;
    }
    if (this.localInertia==null) {
      this.localInertia = this.calculateLocalInertia();
      this.inverseInertia = null;
    }
    if (this.inverseInertia==null) {
      this.inverseInertia = Inertias.toWorldCoords(this.localInertia, this.transform.getRot()).inv();
    }
    return this.inverseInertia;
  }

  setKinematic(kinematic) {
    this.kinematic = kinematic;
    return this;
  }

  getMass() {
    return this.mass;
  }

  setMass(mass) {
    Guard.positive(mass, "mass must be positive");
    this.mass = mass;
    this.inverseMass = 1/mass;
    this.localInertia = null;
    this.inverseInertia = null;
    return this;
  }

  isRotationLock() {
    return this.rotationLock;
  }

  setRotationLock(rotationLock) {
    this.rotationLock = rotationLock;
    return this;
  }

  getDamp() {
    return this.damp;
  }

  setDamp(damp) {
    this.damp = damp;
    return this;
  }

  getAngularDamp() {
    return this.angularDamp;
  }

  setAngularDamp(angularDamp) {
    this.angularDamp = angularDamp;
    return this;
  }

  getVelocity() {
    return this.velocity;
  }

  setVelocity(velocity) {
    Guard.notNull(velocity, "velocity cannot be null");
    this.velocity = velocity;
    return this;
  }

  getAngularVelocity() {
    return this.angularVelocity;
  }

  setAngularVelocity(angularVelocity) {
    Guard.notNull(angularVelocity, "angularVelocity cannot be null");
    this.angularVelocity = angularVelocity;
    return this;
  }

  getPointVelocity(point) {
    if (this.kinematic) {
      return Vec3.ZERO;
    }
    if (this.rotationLock) {
      return this.velocity;
    }
    let r = point.sub(this.transform.getPos());
    let c = Vec3.cross(this.angularVelocity, r);
    return this.velocity.add(c);
  }

  applyForce(pos, f) {
    if (this.kinematic) {
      return ;
    }
    this.forceAccum = this.forceAccum.add(f);
    if (this.rotationLock) {
      return ;
    }
    let r = pos.sub(this.transform.getPos());
    this.torqueAccum = this.torqueAccum.add(Vec3.cross(r, f));
  }

  applyTorque(t) {
    if (this.kinematic||this.rotationLock) {
      return ;
    }
    this.torqueAccum = this.torqueAccum.add(t);
  }

  getImpulseEffectOnPoint(impulsePos, impulse, targetPos) {
    if (this.kinematic) {
      return Vec3.ZERO;
    }
    let mef = impulse.scale(this.inverseMass);
    if (this.rotationLock) {
      return mef;
    }
    let applyR = impulsePos.sub(this.transform.getPos());
    let angveldif = this.getInverseInertia().mul(Vec3.cross(applyR, impulse));
    let targetR = targetPos.sub(this.transform.getPos());
    let ref = Vec3.cross(angveldif, targetR);
    return mef.add(ref);
  }

  applyImpulse(pos, im) {
    if (this.kinematic) {
      return ;
    }
    this.velocity = this.velocity.addScaled(im, this.inverseMass);
    if (this.rotationLock) {
      return ;
    }
    let r = pos.sub(this.transform.getPos());
    this.angularVelocity = this.angularVelocity.add(this.getInverseInertia().mul(Vec3.cross(r, im)));
  }

  getTorqueImpulseEffect(tim) {
    if (this.kinematic||this.rotationLock) {
      return Vec3.ZERO;
    }
    return this.getInverseInertia().mul(tim);
  }

  applyTorqueImpulse(tim) {
    if (this.kinematic||this.rotationLock) {
      return ;
    }
    this.angularVelocity = this.angularVelocity.add(this.getInverseInertia().mul(tim));
  }

  isAbsolute() {
    return true;
  }

  getPos() {
    return this.transform.getPos();
  }

  getRot() {
    return this.transform.getRot();
  }

  toGlobal(pt) {
    return this.transform.toGlobal(pt);
  }

  toGlobalRot(dir) {
    return this.transform.toGlobalRot(dir);
  }

  toLocal(pt) {
    return this.transform.toLocal(pt);
  }

  toLocalRot(dir) {
    return this.transform.toLocalRot(dir);
  }

  integrate(dt) {
    if (this.kinematic) {
      return ;
    }
    this.transform.move(this.velocity.scale(dt));
    this.velocity = this.velocity.add(this.forceAccum.scale(dt*this.inverseMass));
    this.velocity = this.velocity.scale(FMath.pow(this.damp, dt));
    if (!this.rotationLock) {
      let ininv = this.getInverseInertia();
      this.transform.rotate(dt, this.angularVelocity);
      this.angularVelocity = this.angularVelocity.add(ininv.mul(this.torqueAccum).scale(dt));
      this.angularVelocity = this.angularVelocity.scale(FMath.pow(this.angularDamp, dt));
    }
  }

  clearAccums() {
    this.forceAccum = Vec3.ZERO;
    this.torqueAccum = Vec3.ZERO;
  }

  calculateLocalInertia() {
    let numColliders = 0;
    let res = Mat33.ZERO;
    for (let component of this.actor().getComponents()) {
      if (component instanceof ColliderComponent) {
        let collider = component;
        if (!collider.isActive()||collider.isTrigger()) {
          continue;
        }
        if (collider.getShape().equals(ColliderShape.SPHERE)) {
          res = res.add(Inertias.sphere(this.mass, collider.getRadius()));
          numColliders = numColliders+1;
        }
        else if (collider.getShape().equals(ColliderShape.CAPSULE)) {
          res = res.add(Inertias.cylinder(this.mass, collider.getRadius(), collider.getHeight()));
          numColliders = numColliders+1;
        }
        else if (collider.getShape().equals(ColliderShape.BOX)) {
          res = res.add(Inertias.box(this.mass, collider.getSize().x(), collider.getSize().y(), collider.getSize().z()));
          numColliders = numColliders+1;
        }
        else {
          throw new Error("unsupported collider shape, implement me: "+collider.getShape());
        }
      }
    }
    res = numColliders>0?res.mulel(1/numColliders):Inertias.sphere(this.mass, 1);
    return res;
  }

  toString() {
  }

  static create() {
    let res = new RigidBodyComponent();
    res.guardInvariants();
    return res;
  }

}
classRegistry.RigidBodyComponent = RigidBodyComponent;
class BallSocketJointConfig {
  actorA;
  actorB;
  pos;
  constructor() {
  }

  getClass() {
    return "BallSocketJointConfig";
  }

  guardInvariants() {
  }

  getActorA() {
    return this.actorA;
  }

  getActorB() {
    return this.actorB;
  }

  getPos() {
    return this.pos;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(actorA, actorB, pos) {
    let res = new BallSocketJointConfig();
    res.actorA = actorA;
    res.actorB = actorB;
    res.pos = pos;
    res.guardInvariants();
    return res;
  }

}
classRegistry.BallSocketJointConfig = BallSocketJointConfig;
class BallSocketJointComponent extends Behavior {
  static FEATURES = Dut.immutableSet(ComponentFeature.COLLISION_EXCLUSION_PRODUCER, ComponentFeature.RIGID_BODY_JOINT);
  localPosA;
  localPosB;
  rigidBodyA;
  rigidBodyB;
  collisionExclusions;
  initDone = false;
  config;
  constructor() {
    super();
  }

  getClass() {
    return "BallSocketJointComponent";
  }

  guardInvariants() {
  }

  init() {
    this.initDone = true;
    if (this.config==null) {
      return ;
    }
    let actA = this.world().actors().get(this.config.getActorA());
    let actB = this.world().actors().get(this.config.getActorB());
    this.rigidBodyA = actA.getComponent("RigidBodyComponent");
    this.rigidBodyB = actB.getComponent("RigidBodyComponent");
    this.localPosA = this.rigidBodyA.toLocal(this.config.getPos());
    this.localPosB = this.rigidBodyB.toLocal(this.config.getPos());
    this.collisionExclusions = Dut.immutableSet(CollisionExclusion.create(this.config.getActorA(), this.config.getActorB()));
    this.broadcastDomainUpdate(ActorDomain.COLLISION_EXCLUSION, false, false);
    this.config = null;
  }

  getFeatures() {
    return BallSocketJointComponent.FEATURES;
  }

  move(dt, inputs) {
  }

  getCollisionExclusions() {
    return this.collisionExclusions;
  }

  getRigidBodyA() {
    return this.rigidBodyA;
  }

  getRigidBodyB() {
    return this.rigidBodyB;
  }

  solveVelocities(configuration, iteration) {
    let posA = this.rigidBodyA.toGlobal(this.localPosA);
    let posB = this.rigidBodyB.toGlobal(this.localPosB);
    let va = this.rigidBodyA.getPointVelocity(posA);
    let vb = this.rigidBodyB.getPointVelocity(posB);
    let vDiffCurrent = vb.sub(va);
    let vDiffWanted = posA.subAndScale(posB, 1/configuration.getTimeStep());
    let vDiff = vDiffWanted.sub(vDiffCurrent);
    let mag = vDiff.mag();
    if (mag<configuration.getVelError()) {
      return false;
    }
    let normal = vDiff.normalize();
    let uinefA = this.rigidBodyA.getImpulseEffectOnPoint(posA, normal, posA);
    let uinefB = this.rigidBodyB.getImpulseEffectOnPoint(posB, normal, posB);
    let uinefnorm1 = normal.dot(uinefA);
    let uinefnorm2 = normal.dot(uinefB);
    let uinefnorm = uinefnorm1+uinefnorm2;
    let immag = mag/uinefnorm;
    Guard.notNegative(immag, "immag cannot be negative: %s", immag);
    this.rigidBodyA.applyImpulse(posA, normal.scale(-immag));
    this.rigidBodyB.applyImpulse(posB, normal.scale(immag));
    return immag>configuration.getImpulseError();
  }

  setJoint() {
    if (arguments.length===1&&arguments[0] instanceof BallSocketJointConfig) {
      return this.setJoint_1_BallSocketJointConfig(arguments[0]);
    }
    else if (arguments.length===3&& typeof arguments[0]==="string"&& typeof arguments[1]==="string"&&arguments[2] instanceof Vec3) {
      return this.setJoint_3_string_string_Vec3(arguments[0], arguments[1], arguments[2]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setJoint_1_BallSocketJointConfig(config) {
    this.config = config;
    if (this.initDone) {
      this.init();
    }
    return this;
  }

  setJoint_3_string_string_Vec3(actorA, actorB, pos) {
    return this.setJoint(BallSocketJointConfig.create(ActorId.of(actorA), ActorId.of(actorB), pos));
  }

  renderDebug(gDriver, request, camera) {
    if (!request.hasDebugRenderRealm(DebugRenderRealm.JOINT)) {
      return ;
    }
    let prend = gDriver.startRenderer("PrimitiveRenderer", BasicEnvironment.create(camera));
    DebugRendering.sphere(prend, this.rigidBodyA.toGlobal(this.localPosA), 0.3, Rgb.BLUE);
    DebugRendering.sphere(prend, this.rigidBodyB.toGlobal(this.localPosB), 0.3, Rgb.BLUE);
  }

  toString() {
  }

  static create() {
    let res = new BallSocketJointComponent();
    res.guardInvariants();
    return res;
  }

}
classRegistry.BallSocketJointComponent = BallSocketJointComponent;
class HingeJointConfig {
  actorA;
  actorB;
  pos;
  axis;
  constructor() {
  }

  getClass() {
    return "HingeJointConfig";
  }

  guardInvariants() {
  }

  getActorA() {
    return this.actorA;
  }

  getActorB() {
    return this.actorB;
  }

  getPos() {
    return this.pos;
  }

  getAxis() {
    return this.axis;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(actorA, actorB, pos, axis) {
    let res = new HingeJointConfig();
    res.actorA = actorA;
    res.actorB = actorB;
    res.pos = pos;
    res.axis = axis;
    res.guardInvariants();
    return res;
  }

}
classRegistry.HingeJointConfig = HingeJointConfig;
class HingeJointComponent extends Behavior {
  static FEATURES = Dut.immutableSet(ComponentFeature.COLLISION_EXCLUSION_PRODUCER, ComponentFeature.RIGID_BODY_JOINT);
  rigidBodyA;
  rigidBodyB;
  collisionExclusions = Collections.emptySet();
  initDone = false;
  config;
  localPosA;
  localAxisA;
  localPosB;
  localAxisB;
  q0Conjs = Collections.emptyList();
  constructor() {
    super();
  }

  getClass() {
    return "HingeJointComponent";
  }

  guardInvariants() {
  }

  init() {
    this.initDone = true;
    if (this.config==null) {
      return ;
    }
    let actA = this.world().actors().get(this.config.getActorA());
    let actB = this.world().actors().get(this.config.getActorB());
    this.rigidBodyA = actA.getComponent("RigidBodyComponent");
    this.rigidBodyB = actB.getComponent("RigidBodyComponent");
    this.localPosA = this.rigidBodyA.toLocal(this.config.getPos());
    this.localAxisA = this.rigidBodyA.toLocalRot(this.config.getAxis()).normalize();
    this.localPosB = this.rigidBodyB.toLocal(this.config.getPos());
    this.localAxisB = this.rigidBodyB.toLocalRot(this.config.getAxis()).normalize();
    this.q0Conjs = new ArrayList();
    for (let i = 0; i<8; ++i) {
      let rot = Quaternion.rot(this.config.getAxis(), FMath.PI_HALF*i);
      this.q0Conjs.add(this.rigidBodyA.getRot().conj().mul(this.rigidBodyB.getRot().mul(rot)));
    }
    this.collisionExclusions = Dut.immutableSet(CollisionExclusion.create(this.config.getActorA(), this.config.getActorB()));
    this.broadcastDomainUpdate(ActorDomain.COLLISION_EXCLUSION, false, false);
    this.config = null;
  }

  getFeatures() {
    return HingeJointComponent.FEATURES;
  }

  move(dt, inputs) {
  }

  getCollisionExclusions() {
    return this.collisionExclusions;
  }

  getRigidBodyA() {
    return this.rigidBodyA;
  }

  getRigidBodyB() {
    return this.rigidBodyB;
  }

  solveVelocities(configuration, iteration) {
    let res = false;
    let qA = this.rigidBodyA.getRot();
    let qB = this.rigidBodyB.getRot();
    let dq1 = qA.conj().mul(qB);
    let dr = dq1.mul(this.q0Conjs.get(0));
    if (dr.a()<0) {
      dr = dr.scale(-1);
    }
    for (let i = 1; i<this.q0Conjs.size(); ++i) {
      let drCand = dq1.mul(this.q0Conjs.get(i));
      if (drCand.a()<0) {
        drCand = drCand.scale(-1);
      }
      if (FMath.abs(drCand.a())>FMath.abs(dr.a())) {
        dr = drCand;
      }
    }
    let wBaum = HingeJointComponent.getAngularVelocity(configuration.getTimeStep(), Quaternion.ZERO_ROT, dr).scale(configuration.getJointBaumgarte());
    let wA = this.rigidBodyA.getAngularVelocity();
    let wB = this.rigidBodyB.getAngularVelocity();
    let axisWorld = this.rigidBodyA.toGlobalRot(this.localAxisA);
    let wAmB = wA.sub(wB).sub(wBaum);
    let wRem = wAmB.subScaled(axisWorld, wAmB.dot(axisWorld));
    let iA = this.rigidBodyA.getInverseInertia();
    let iB = this.rigidBodyB.getInverseInertia();
    let angFact = iA.add(iB).inv();
    let angIm = angFact.mul(wRem);
    this.rigidBodyA.applyTorqueImpulse(angIm.scale(-1));
    this.rigidBodyB.applyTorqueImpulse(angIm);
    res = res|angIm.mag()>configuration.getImpulseError();
    let pA = this.rigidBodyA.toGlobal(this.localPosA);
    let pB = this.rigidBodyB.toGlobal(this.localPosB);
    let vBaum = pA.subAndScale(pB, configuration.getJointBaumgarte()/configuration.getTimeStep());
    let vA = this.rigidBodyA.getPointVelocity(pA);
    let vB = this.rigidBodyB.getPointVelocity(pB);
    let vAmB = vA.sub(vB);
    let mA = Mat33.diagonal(this.rigidBodyA.getInverseMass());
    let mB = Mat33.diagonal(this.rigidBodyB.getInverseMass());
    let lFact = mA.add(mB).inv();
    let im = lFact.mul(vAmB.add(vBaum));
    this.rigidBodyA.applyImpulse(this.rigidBodyA.getPos(), im.scale(-1));
    this.rigidBodyB.applyImpulse(this.rigidBodyB.getPos(), im);
    res = res|im.mag()>configuration.getImpulseError();
    return res;
  }

  setJoint() {
    if (arguments.length===1&&arguments[0] instanceof HingeJointConfig) {
      return this.setJoint_1_HingeJointConfig(arguments[0]);
    }
    else if (arguments.length===4&& typeof arguments[0]==="string"&& typeof arguments[1]==="string"&&arguments[2] instanceof Vec3&&arguments[3] instanceof Vec3) {
      return this.setJoint_4_string_string_Vec3_Vec3(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setJoint_1_HingeJointConfig(config) {
    this.config = config;
    if (this.initDone) {
      this.init();
    }
    return this;
  }

  setJoint_4_string_string_Vec3_Vec3(actorA, actorB, pos, axis) {
    return this.setJoint(HingeJointConfig.create(ActorId.of(actorA), ActorId.of(actorB), pos, axis));
  }

  toString() {
  }

  static create() {
    let res = new HingeJointComponent();
    res.guardInvariants();
    return res;
  }

  static getAngularVelocity(dt, q1, q2) {
    let sub = q2.sub(q1);
    let wRecQ = sub.scale(1/(dt*0.5)).mul(q1.conj());
    return Vec3.create(wRecQ.b(), wRecQ.c(), wRecQ.d());
  }

}
classRegistry.HingeJointComponent = HingeJointComponent;
class PrismaticJointConfig {
  actorA;
  actorB;
  pos;
  dir;
  constructor() {
  }

  getClass() {
    return "PrismaticJointConfig";
  }

  guardInvariants() {
  }

  getActorA() {
    return this.actorA;
  }

  getActorB() {
    return this.actorB;
  }

  getPos() {
    return this.pos;
  }

  getDir() {
    return this.dir;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(actorA, actorB, pos, dir) {
    let res = new PrismaticJointConfig();
    res.actorA = actorA;
    res.actorB = actorB;
    res.pos = pos;
    res.dir = dir;
    res.guardInvariants();
    return res;
  }

}
classRegistry.PrismaticJointConfig = PrismaticJointConfig;
class PrismaticJointComponent extends Behavior {
  static FEATURES = Dut.immutableSet(ComponentFeature.COLLISION_EXCLUSION_PRODUCER, ComponentFeature.RIGID_BODY_JOINT);
  rigidBodyA;
  rigidBodyB;
  collisionExclusions;
  initDone = false;
  config;
  localPosA;
  localDirA;
  localPosB;
  localDirB;
  q0;
  constructor() {
    super();
  }

  getClass() {
    return "PrismaticJointComponent";
  }

  guardInvariants() {
  }

  init() {
    this.initDone = true;
    if (this.config==null) {
      return ;
    }
    let actA = this.world().actors().get(this.config.getActorA());
    let actB = this.world().actors().get(this.config.getActorB());
    this.rigidBodyA = actA.getComponent("RigidBodyComponent");
    this.rigidBodyB = actB.getComponent("RigidBodyComponent");
    this.localPosA = this.rigidBodyA.toLocal(this.config.getPos());
    this.localDirA = this.rigidBodyA.toLocalRot(this.config.getDir()).normalize();
    this.localPosB = this.rigidBodyB.toLocal(this.config.getPos());
    this.localDirB = this.rigidBodyB.toLocalRot(this.config.getDir()).normalize();
    this.q0 = this.rigidBodyA.getRot().conj().mul(this.rigidBodyB.getRot());
    this.collisionExclusions = Dut.immutableSet(CollisionExclusion.create(this.config.getActorA(), this.config.getActorB()));
    this.broadcastDomainUpdate(ActorDomain.COLLISION_EXCLUSION, false, false);
    this.config = null;
  }

  getFeatures() {
    return PrismaticJointComponent.FEATURES;
  }

  move(dt, inputs) {
  }

  getCollisionExclusions() {
    return this.collisionExclusions;
  }

  getRigidBodyA() {
    return this.rigidBodyA;
  }

  getRigidBodyB() {
    return this.rigidBodyB;
  }

  solveVelocities(configuration, iteration) {
    let res = false;
    let qA = this.rigidBodyA.getRot();
    let qB = this.rigidBodyB.getRot();
    let dq1 = qA.conj().mul(qB);
    let dr = dq1.mul(this.q0.conj());
    let wBaum = PrismaticJointComponent.getAngularVelocity(configuration.getTimeStep(), Quaternion.ZERO_ROT, dr).scale(configuration.getJointBaumgarte());
    let wA = this.rigidBodyA.getAngularVelocity();
    let wB = this.rigidBodyB.getAngularVelocity();
    let wAmB = wA.sub(wB).sub(wBaum);
    let iA = this.rigidBodyA.getInverseInertia();
    let iB = this.rigidBodyB.getInverseInertia();
    let angFact = iA.add(iB).inv();
    let angIm = angFact.mul(wAmB);
    this.rigidBodyA.applyTorqueImpulse(angIm.scale(-1));
    this.rigidBodyB.applyTorqueImpulse(angIm);
    res = res|angIm.mag()>configuration.getImpulseError();
    let dirWorld = this.rigidBodyA.toGlobalRot(this.localDirA);
    let pA = this.rigidBodyA.toGlobal(this.localPosA);
    let pB = this.rigidBodyB.toGlobal(this.localPosB);
    let vA = this.rigidBodyA.getPointVelocity(pA);
    let vB = this.rigidBodyB.getPointVelocity(pB);
    let vAmB = vA.sub(vB);
    let vBaum = pA.subAndScale(pB, configuration.getJointBaumgarte()/configuration.getTimeStep());
    let vBaumFix = vBaum.subScaled(dirWorld, vBaum.dot(dirWorld));
    let vFix = vAmB.subScaled(dirWorld, vAmB.dot(dirWorld));
    let mA = Mat33.diagonal(this.rigidBodyA.getInverseMass());
    let mB = Mat33.diagonal(this.rigidBodyB.getInverseMass());
    let lFact = mA.add(mB).inv();
    let im = lFact.mul(vFix.add(vBaumFix));
    this.rigidBodyA.applyImpulse(this.rigidBodyA.getPos(), im.scale(-1));
    this.rigidBodyB.applyImpulse(this.rigidBodyB.getPos(), im);
    res = res|im.mag()>configuration.getImpulseError();
    return res;
  }

  setJoint() {
    if (arguments.length===1&&arguments[0] instanceof PrismaticJointConfig) {
      return this.setJoint_1_PrismaticJointConfig(arguments[0]);
    }
    else if (arguments.length===4&& typeof arguments[0]==="string"&& typeof arguments[1]==="string"&&arguments[2] instanceof Vec3&&arguments[3] instanceof Vec3) {
      return this.setJoint_4_string_string_Vec3_Vec3(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setJoint_1_PrismaticJointConfig(config) {
    this.config = config;
    if (this.initDone) {
      this.init();
    }
    return this;
  }

  setJoint_4_string_string_Vec3_Vec3(actorA, actorB, pos, dir) {
    return this.setJoint(PrismaticJointConfig.create(ActorId.of(actorA), ActorId.of(actorB), pos, dir));
  }

  toString() {
  }

  static create() {
    let res = new PrismaticJointComponent();
    res.guardInvariants();
    return res;
  }

  static getAngularVelocity(dt, q1, q2) {
    let sub = q2.sub(q1);
    let wRecQ = sub.scale(1/(dt*0.5)).mul(q1.conj());
    return Vec3.create(wRecQ.b(), wRecQ.c(), wRecQ.d());
  }

}
classRegistry.PrismaticJointComponent = PrismaticJointComponent;
class FixedJointConfig {
  actorA;
  actorB;
  pos;
  constructor() {
  }

  getClass() {
    return "FixedJointConfig";
  }

  guardInvariants() {
  }

  getActorA() {
    return this.actorA;
  }

  getActorB() {
    return this.actorB;
  }

  getPos() {
    return this.pos;
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
    if (arguments.length===3&&arguments[0] instanceof ActorId&&arguments[1] instanceof ActorId&&arguments[2] instanceof Vec3) {
      return FixedJointConfig.create_3_ActorId_ActorId_Vec3(arguments[0], arguments[1], arguments[2]);
    }
    else if (arguments.length===2&&arguments[0] instanceof ActorId&&arguments[1] instanceof ActorId) {
      return FixedJointConfig.create_2_ActorId_ActorId(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static create_3_ActorId_ActorId_Vec3(actorA, actorB, pos) {
    let res = new FixedJointConfig();
    res.actorA = actorA;
    res.actorB = actorB;
    res.pos = pos;
    res.guardInvariants();
    return res;
  }

  static create_2_ActorId_ActorId(actorA, actorB) {
    let res = new FixedJointConfig();
    res.actorA = actorA;
    res.actorB = actorB;
    res.guardInvariants();
    return res;
  }

}
classRegistry.FixedJointConfig = FixedJointConfig;
class FixedJointComponent extends Behavior {
  static FEATURES = Dut.immutableSet(ComponentFeature.COLLISION_EXCLUSION_PRODUCER, ComponentFeature.RIGID_BODY_JOINT);
  actorA;
  actorB;
  rigidBodyA;
  rigidBodyB;
  collisionExclusions;
  initDone = false;
  config;
  localPosA;
  localPosB;
  q0;
  constructor() {
    super();
  }

  getClass() {
    return "FixedJointComponent";
  }

  guardInvariants() {
  }

  init() {
    this.initDone = true;
    if (this.config==null) {
      return ;
    }
    this.actorA = this.config.getActorA();
    this.actorB = this.config.getActorB();
    let actA = this.world().actors().get(this.actorA);
    let actB = this.world().actors().get(this.actorB);
    this.rigidBodyA = actA.getComponent("RigidBodyComponent");
    this.rigidBodyB = actB.getComponent("RigidBodyComponent");
    let pos = this.config.getPos()!=null?this.config.getPos():this.rigidBodyA.toGlobal(Vec3.ZERO).add(this.rigidBodyB.toGlobal(Vec3.ZERO)).scale(0.5);
    this.localPosA = this.rigidBodyA.toLocal(pos);
    this.localPosB = this.rigidBodyB.toLocal(pos);
    this.q0 = this.rigidBodyA.getRot().conj().mul(this.rigidBodyB.getRot());
    this.collisionExclusions = Dut.immutableSet(CollisionExclusion.create(this.actorA, this.actorB));
    this.broadcastDomainUpdate(ActorDomain.COLLISION_EXCLUSION, false, false);
    this.config = null;
  }

  getFeatures() {
    return FixedJointComponent.FEATURES;
  }

  move(dt, inputs) {
  }

  getCollisionExclusions() {
    return this.collisionExclusions;
  }

  getRigidBodyA() {
    return this.rigidBodyA;
  }

  getRigidBodyB() {
    return this.rigidBodyB;
  }

  solveVelocities(configuration, iteration) {
    if (!this.world().actors().exists(this.actorA)||!this.world().actors().exists(this.actorB)||(this.rigidBodyA.isKinematic()&&this.rigidBodyB.isKinematic())) {
      return false;
    }
    let res = false;
    let posA = this.rigidBodyA.toGlobal(this.localPosA);
    let posB = this.rigidBodyB.toGlobal(this.localPosB);
    let va = this.rigidBodyA.getPointVelocity(posA);
    let vb = this.rigidBodyB.getPointVelocity(posB);
    let vDiffCurrent = vb.sub(va);
    let vDiffWanted = posA.subAndScale(posB, 1/configuration.getTimeStep());
    let vDiff = vDiffWanted.sub(vDiffCurrent);
    let mag = vDiff.mag();
    if (mag<configuration.getVelError()) {
      return false;
    }
    let normal = vDiff.normalize();
    let uinefA = this.rigidBodyA.getImpulseEffectOnPoint(posA, normal, posA);
    let uinefB = this.rigidBodyB.getImpulseEffectOnPoint(posB, normal, posB);
    let uinefnorm1 = normal.dot(uinefA);
    let uinefnorm2 = normal.dot(uinefB);
    let uinefnorm = uinefnorm1+uinefnorm2;
    let immag = mag/uinefnorm;
    Guard.notNegative(immag, "immag cannot be negative: %s", immag);
    this.rigidBodyA.applyImpulse(posA, normal.scale(-immag));
    this.rigidBodyB.applyImpulse(posB, normal.scale(immag));
    res = res|(immag>configuration.getImpulseError());
    let qA = this.rigidBodyA.getRot();
    let qB = this.rigidBodyB.getRot();
    let dq1 = qA.conj().mul(qB);
    let dr = dq1.mul(this.q0.conj());
    let wBaum = Vec3.ZERO;
    let wA = this.rigidBodyA.getAngularVelocity();
    let wB = this.rigidBodyB.getAngularVelocity();
    let wAmB = wA.sub(wB).sub(wBaum);
    let iA = this.rigidBodyA.getInverseInertia();
    let iB = this.rigidBodyB.getInverseInertia();
    let angFact = iA.add(iB).inv();
    let angIm = angFact.mul(wAmB);
    this.rigidBodyA.applyTorqueImpulse(angIm.scale(-1));
    this.rigidBodyB.applyTorqueImpulse(angIm);
    res = res|(angIm.mag()>configuration.getImpulseError());
    return res;
  }

  setJoint() {
    if (arguments.length===1&&arguments[0] instanceof FixedJointConfig) {
      return this.setJoint_1_FixedJointConfig(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="string"&& typeof arguments[1]==="string") {
      return this.setJoint_2_string_string(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setJoint_1_FixedJointConfig(config) {
    this.config = config;
    if (this.initDone) {
      this.init();
    }
    return this;
  }

  setJoint_2_string_string(actorA, actorB) {
    return this.setJoint(FixedJointConfig.create(ActorId.of(actorA), ActorId.of(actorB)));
  }

  renderDebug(gDriver, request, camera) {
    if (!request.hasDebugRenderRealm(DebugRenderRealm.JOINT)) {
      return ;
    }
    let prend = gDriver.startRenderer("PrimitiveRenderer", BasicEnvironment.create(camera));
    let pA = this.rigidBodyA.toGlobal(this.localPosA);
    let pB = this.rigidBodyB.toGlobal(this.localPosB);
    DebugRendering.sphere(prend, pA, 0.3, Rgb.BLUE);
    DebugRendering.sphere(prend, pB, 0.3, Rgb.BLUE);
    DebugRendering.line(prend, pA, pB, Rgb.BLUE);
  }

  toString() {
  }

  static create() {
    let res = new FixedJointComponent();
    res.guardInvariants();
    return res;
  }

  static getAngularVelocity(dt, q1, q2) {
    let sub = q2.sub(q1);
    let wRecQ = sub.scale(1/(dt*0.5)).mul(q1.conj());
    return Vec3.create(wRecQ.b(), wRecQ.c(), wRecQ.d());
  }

}
classRegistry.FixedJointComponent = FixedJointComponent;
class RemoveOnOutspaceComponent extends Component {
  constructor() {
    super();
  }

  getClass() {
    return "RemoveOnOutspaceComponent";
  }

  guardInvariants() {
  }

  onEvent(type, event) {
    if (type.equals(ActorEventType.OUTSPACE)) {
      this.world().actors().remove(this.actor().getId());
    }
  }

  static create() {
    let res = new RemoveOnOutspaceComponent();
    res.guardInvariants();
    return res;
  }

}
classRegistry.RemoveOnOutspaceComponent = RemoveOnOutspaceComponent;
class LifetimeComponent extends Behavior {
  active;
  remaining;
  constructor() {
    super();
  }

  getClass() {
    return "LifetimeComponent";
  }

  guardInvariants() {
  }

  move(dt, inputs) {
    if (!this.active) {
      return ;
    }
    this.remaining = this.remaining-dt;
    if (this.remaining<=0) {
      this.world().actors().remove(this.actor().getId());
    }
  }

  isActive() {
    return this.active;
  }

  setActive(active) {
    this.active = active;
    return this;
  }

  getRemaining() {
    return this.remaining;
  }

  setRemaining() {
    if (arguments.length===1&& typeof arguments[0]==="number") {
      return this.setRemaining_1_number(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return this.setRemaining_2_number_number(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  setRemaining_1_number(remaining) {
    Guard.notNegative(remaining, "remaining cannot be negative");
    this.remaining = remaining;
    return this;
  }

  setRemaining_2_number_number(remaining, random) {
    Guard.notNegative(remaining, "remaining cannot be negative");
    Guard.notNegative(random, "random cannot be negative");
    this.remaining = remaining+(random>0?Randoms.nextFloat(0, random):0);
    return this;
  }

  static create() {
    let res = new LifetimeComponent();
    res.active = true;
    res.remaining = 1;
    res.guardInvariants();
    return res;
  }

}
classRegistry.LifetimeComponent = LifetimeComponent;
const createComponentPrefabType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
const ComponentPrefabType = Object.freeze({
  TRANSFORM: createComponentPrefabType("TRANSFORM"),
  RIGID_BODY: createComponentPrefabType("RIGID_BODY"),
  MODEL: createComponentPrefabType("MODEL"),
  SPHERE_COLLIDER: createComponentPrefabType("SPHERE_COLLIDER"),
  BOX_COLLIDER: createComponentPrefabType("BOX_COLLIDER"),
  CAPSULE_COLLIDER: createComponentPrefabType("CAPSULE_COLLIDER"),
  DIR_LIGHT: createComponentPrefabType("DIR_LIGHT"),
  PERSPECTIVE_CAMERA: createComponentPrefabType("PERSPECTIVE_CAMERA"),
  PERSPECTIVE_CAMERA_FOVY: createComponentPrefabType("PERSPECTIVE_CAMERA_FOVY"),
  WORLD: createComponentPrefabType("WORLD"),
  AUTO_ROTATE: createComponentPrefabType("AUTO_ROTATE"),
  LIFETIME: createComponentPrefabType("LIFETIME"),
  REMOVE_ON_OUTSPACE: createComponentPrefabType("REMOVE_ON_OUTSPACE"),
  POI: createComponentPrefabType("POI"),
  RP_GENERATOR: createComponentPrefabType("RP_GENERATOR"),
  SKYBOX: createComponentPrefabType("SKYBOX"),
  SCRIPT: createComponentPrefabType("SCRIPT"),

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
class ComponentPrefab {
  type;
  key;
  version;
  properties;
  constructor() {
  }

  getClass() {
    return "ComponentPrefab";
  }

  guardInvariants() {
  }

  getType() {
    return this.type;
  }

  getKey() {
    return this.key;
  }

  getVersion() {
    return this.version;
  }

  getProperties() {
    return this.properties;
  }

  getBoolean(key) {
    return Formats.parseBoolean(this.properties.get(key));
  }

  getInteger(key) {
    return Formats.parseInt(this.properties.get(key));
  }

  getFloat() {
    if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.getFloat_1_string(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="string"&& typeof arguments[1]==="number") {
      return this.getFloat_2_string_number(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getFloat_1_string(key) {
    return Formats.parseFloat(this.properties.get(key));
  }

  getFloat_2_string_number(key, def) {
    return this.properties.containsKey(key)?Formats.parseFloat(this.properties.get(key)):def;
  }

  getString(key) {
    return this.properties.get(key);
  }

  getVec3() {
    if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.getVec3_1_string(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="string"&&arguments[1] instanceof Vec3) {
      return this.getVec3_2_string_Vec3(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getVec3_1_string(key) {
    return Jsons.toVec3(this.properties.get(key));
  }

  getVec3_2_string_Vec3(key, def) {
    if (this.properties.containsKey(key)) {
      return Jsons.toVec3(this.properties.get(key));
    }
    else {
      return def;
    }
  }

  getQuaternion() {
    if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.getQuaternion_1_string(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="string"&&arguments[1] instanceof Quaternion) {
      return this.getQuaternion_2_string_Quaternion(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getQuaternion_1_string(key) {
    return Jsons.toQuaternion(this.properties.get(key));
  }

  getQuaternion_2_string_Quaternion(key, def) {
    if (this.properties.containsKey(key)) {
      return Jsons.toQuaternion(this.properties.get(key));
    }
    else {
      return def;
    }
  }

  getAabb3(key) {
    return Jsons.toAabb3(this.properties.get(key));
  }

  getMat33(key) {
    return Jsons.toMat33(this.properties.get(key));
  }

  getMat44(key) {
    return Jsons.toMat44(this.properties.get(key));
  }

  getRgb(key) {
    return Jsons.toRgb(this.properties.get(key));
  }

  getInterpolation() {
    if (arguments.length===1&& typeof arguments[0]==="string") {
      return this.getInterpolation_1_string(arguments[0]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="string"&&arguments[1] instanceof Interpolation) {
      return this.getInterpolation_2_string_Interpolation(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getInterpolation_1_string(key) {
    return Jsons.toInterpolation(this.properties.get(key));
  }

  getInterpolation_2_string_Interpolation(key, def) {
    if (this.properties.containsKey(key)) {
      return Jsons.toInterpolation(this.properties.get(key));
    }
    else {
      return def;
    }
  }

  getCollisionLayer(key) {
    return CollisionLayer.of(this.properties.get(key));
  }

  getPhysicalMaterialId(key) {
    return PhysicalMaterialId.of(this.properties.get(key));
  }

  withKey(key) {
    let res = new ComponentPrefab();
    res.type = this.type;
    res.version = this.version;
    res.key = key;
    res.properties = this.properties;
    res.guardInvariants();
    return res;
  }

  withProperty(key, val) {
    let strVal = null;
    if (val instanceof Boolean) {
      strVal = (val).this.toString();
    }
    else if (val instanceof Integer) {
      strVal = (val).this.toString();
    }
    else if (val instanceof Float) {
      strVal = (val).this.toString();
    }
    else if (val instanceof String) {
      strVal = (val);
    }
    else if (val instanceof Vec3) {
      strVal = Jsons.toJson(val);
    }
    else if (val instanceof Quaternion) {
      strVal = Jsons.toJson(val);
    }
    else if (val instanceof Aabb3) {
      strVal = Jsons.toJson(val);
    }
    else if (val instanceof Mat33) {
      strVal = Jsons.toJson(val);
    }
    else if (val instanceof Mat44) {
      strVal = Jsons.toJson(val);
    }
    else if (val instanceof Rgb) {
      strVal = Jsons.toJson(val);
    }
    else if (val instanceof Interpolation) {
      strVal = Jsons.toJson(val);
    }
    else {
      throw new Error("unsupported value type, implement me: "+val);
    }
    let res = new ComponentPrefab();
    res.type = this.type;
    res.version = this.version;
    res.key = this.key;
    res.properties = new HashMap();
    res.properties.putAll(this.properties);
    res.properties.put(key, strVal);
    res.properties = Collections.unmodifiableMap(res.properties);
    res.guardInvariants();
    return res;
  }

  toLatestVersion() {
    if (this.type.equals(ComponentPrefabType.SPHERE_COLLIDER)&&this.version==1) {
      return ComponentPrefab.sphereCollider(true, this.getBoolean("trigger"), this.getCollisionLayer("layer"), this.getPhysicalMaterialId("materialId"), this.getVec3("pos", Vec3.ZERO), this.getQuaternion("rot", Quaternion.ZERO_ROT), this.getFloat("radius")).withKey(this.key);
    }
    if (this.type.equals(ComponentPrefabType.BOX_COLLIDER)&&this.version==1) {
      return ComponentPrefab.boxCollider(true, this.getBoolean("trigger"), this.getCollisionLayer("layer"), this.getPhysicalMaterialId("materialId"), this.getVec3("pos", Vec3.ZERO), this.getQuaternion("rot", Quaternion.ZERO_ROT), this.getVec3("size")).withKey(this.key);
    }
    if (this.type.equals(ComponentPrefabType.CAPSULE_COLLIDER)&&this.version==1) {
      return ComponentPrefab.capsuleCollider(true, this.getBoolean("trigger"), this.getCollisionLayer("layer"), this.getPhysicalMaterialId("materialId"), this.getVec3("pos", Vec3.ZERO), this.getQuaternion("rot", Quaternion.ZERO_ROT), this.getFloat("height"), this.getFloat("radius")).withKey(this.key);
    }
    return this;
  }

  toComponent() {
    if (this.type.equals(ComponentPrefabType.TRANSFORM)) {
      if (this.version==1) {
        return TransformComponent.create().setPos(Jsons.toVec3(this.properties.get("pos"))).setRot(Jsons.toQuaternion(this.properties.get("rot"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.RIGID_BODY)) {
      if (this.version==1) {
        return RigidBodyComponent.create().setKinematic(Formats.parseBoolean(this.properties.get("kinematic"))).setRotationLock(Formats.parseBoolean(this.properties.get("rotationLock"))).setMass(Formats.parseFloat(this.properties.get("mass"))).setDamp(Formats.parseFloat(this.properties.get("damp"))).setAngularDamp(Formats.parseFloat(this.properties.get("angularDamp"))).setVelocity(this.properties.containsKey("velocity")?Jsons.toVec3(this.properties.get("velocity")):Vec3.ZERO).setAngularVelocity(this.properties.containsKey("angularVelocity")?Jsons.toVec3(this.properties.get("angularVelocity")):Vec3.ZERO).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.MODEL)) {
      if (this.version==1) {
        let trans = Mat44.IDENTITY;
        let scale = this.getVec3("scale");
        trans = Mat44.scale(scale.x(), scale.y(), scale.z()).mul(trans);
        let rot = this.getQuaternion("rot");
        trans = Mat44.rot(rot).mul(trans);
        let pos = this.getVec3("pos");
        trans = Mat44.trans(pos).mul(trans);
        return ModelComponent.create().setModelId(ModelId.of(this.properties.get("modelId"))).setTransform(trans).setInterpolation(this.getInterpolation("interpolation", Interpolation.create(0, 0, 0))).setVisible(Formats.parseBoolean(this.properties.get("visible"))).setCastShadows(Formats.parseBoolean(this.properties.get("castShadows"))).setReceiveShadows(Formats.parseBoolean(this.properties.get("receiveShadows"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.SPHERE_COLLIDER)) {
      if (this.version==1) {
        let pos = this.getVec3("pos", Vec3.ZERO);
        let rot = this.getQuaternion("rot", Quaternion.ZERO_ROT);
        return ColliderComponent.create().setShape(ColliderShape.SPHERE).setActive(true).setTrigger(Formats.parseBoolean(this.properties.get("trigger"))).setLayer(CollisionLayer.of(this.properties.get("layer"))).setMaterialId(PhysicalMaterialId.of(this.properties.get("materialId"))).setPos(pos).setRot(rot).setRadius(Formats.parseFloat(this.properties.get("radius"))).setKey(this.key);
      }
      else if (this.version==2) {
        let pos = this.getVec3("pos", Vec3.ZERO);
        let rot = this.getQuaternion("rot", Quaternion.ZERO_ROT);
        return ColliderComponent.create().setShape(ColliderShape.SPHERE).setActive(Formats.parseBoolean(this.properties.get("active"))).setTrigger(Formats.parseBoolean(this.properties.get("trigger"))).setLayer(CollisionLayer.of(this.properties.get("layer"))).setMaterialId(PhysicalMaterialId.of(this.properties.get("materialId"))).setPos(pos).setRot(rot).setRadius(Formats.parseFloat(this.properties.get("radius"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.BOX_COLLIDER)) {
      if (this.version==1) {
        let pos = this.getVec3("pos", Vec3.ZERO);
        let rot = this.getQuaternion("rot", Quaternion.ZERO_ROT);
        return ColliderComponent.create().setShape(ColliderShape.BOX).setActive(true).setTrigger(Formats.parseBoolean(this.properties.get("trigger"))).setLayer(CollisionLayer.of(this.properties.get("layer"))).setMaterialId(PhysicalMaterialId.of(this.properties.get("materialId"))).setPos(pos).setRot(rot).setSize(Jsons.toVec3(this.properties.get("size"))).setKey(this.key);
      }
      else if (this.version==2) {
        let pos = this.getVec3("pos", Vec3.ZERO);
        let rot = this.getQuaternion("rot", Quaternion.ZERO_ROT);
        return ColliderComponent.create().setShape(ColliderShape.BOX).setActive(Formats.parseBoolean(this.properties.get("active"))).setTrigger(Formats.parseBoolean(this.properties.get("trigger"))).setLayer(CollisionLayer.of(this.properties.get("layer"))).setMaterialId(PhysicalMaterialId.of(this.properties.get("materialId"))).setPos(pos).setRot(rot).setSize(Jsons.toVec3(this.properties.get("size"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.CAPSULE_COLLIDER)) {
      if (this.version==1) {
        let pos = this.getVec3("pos", Vec3.ZERO);
        let rot = this.getQuaternion("rot", Quaternion.ZERO_ROT);
        return ColliderComponent.create().setShape(ColliderShape.CAPSULE).setActive(true).setTrigger(Formats.parseBoolean(this.properties.get("trigger"))).setLayer(CollisionLayer.of(this.properties.get("layer"))).setMaterialId(PhysicalMaterialId.of(this.properties.get("materialId"))).setPos(pos).setRot(rot).setHeight(Formats.parseFloat(this.properties.get("height"))).setRadius(Formats.parseFloat(this.properties.get("radius"))).setKey(this.key);
      }
      else if (this.version==2) {
        let pos = this.getVec3("pos", Vec3.ZERO);
        let rot = this.getQuaternion("rot", Quaternion.ZERO_ROT);
        return ColliderComponent.create().setShape(ColliderShape.CAPSULE).setActive(Formats.parseBoolean(this.properties.get("active"))).setTrigger(Formats.parseBoolean(this.properties.get("trigger"))).setLayer(CollisionLayer.of(this.properties.get("layer"))).setMaterialId(PhysicalMaterialId.of(this.properties.get("materialId"))).setPos(pos).setRot(rot).setHeight(Formats.parseFloat(this.properties.get("height"))).setRadius(Formats.parseFloat(this.properties.get("radius"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.DIR_LIGHT)) {
      if (this.version==1) {
        return LightComponent.create().setType(LightType.DIRECTIONAL).setEnabled(Formats.parseBoolean(this.properties.get("enabled"))).setShadow(Formats.parseBoolean(this.properties.get("shadow"))).setAmbient(Jsons.toRgb(this.properties.get("ambient"))).setDiffuse(Jsons.toRgb(this.properties.get("diffuse"))).setSpecular(Jsons.toRgb(this.properties.get("specular"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.PERSPECTIVE_CAMERA)) {
      if (this.version==1) {
        return CameraComponent.create().setType(CameraType.PERSPECTIVE).setFovy(Formats.parseFloat(this.properties.get("fovy"))).setAspect(Formats.parseFloat(this.properties.get("aspect"))).setNear(Formats.parseFloat(this.properties.get("near"))).setFar(Formats.parseFloat(this.properties.get("far"))).setKey(this.key);
      }
      else if (this.version==2) {
        return CameraComponent.create().setType(CameraType.PERSPECTIVE).setFovy(Formats.parseFloat(this.properties.get("fovy"))).setAspect(Formats.parseFloat(this.properties.get("aspect"))).setNear(Formats.parseFloat(this.properties.get("near"))).setFar(Formats.parseFloat(this.properties.get("far"))).setSkyboxNear(Formats.parseFloat(this.properties.get("skyboxNear"))).setSkyboxFar(Formats.parseFloat(this.properties.get("skyboxFar"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.PERSPECTIVE_CAMERA_FOVY)) {
      if (this.version==1) {
        return CameraFovyComponent.create().setDisplaySizeInputKey(this.properties.get("displaySizeInputKey")).setFovyLandscape(this.getFloat("fovyLandscape")).setFovyPortrait(this.getFloat("fovyPortrait")).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.SKYBOX)) {
      if (this.version==1) {
        let trans = Mat44.IDENTITY;
        let scale = this.getVec3("scale");
        trans = Mat44.scale(scale.x(), scale.y(), scale.z()).mul(trans);
        let rot = this.getQuaternion("rot");
        trans = Mat44.rot(rot).mul(trans);
        let pos = this.getVec3("pos");
        trans = Mat44.trans(pos).mul(trans);
        return SkyboxComponent.create().setModelId(ModelId.of(this.properties.get("modelId"))).setTransform(trans).setVisible(Formats.parseBoolean(this.properties.get("visible"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.WORLD)) {
      if (this.version==1) {
        return WorldComponent.create().setGravity(Jsons.toVec3(this.properties.get("gravity"))).setDrag(Formats.parseFloat(this.properties.get("drag"))).setAngularDrag(Formats.parseFloat(this.properties.get("angularDrag"))).setBoundary(Jsons.toAabb3(this.properties.get("boundary"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.AUTO_ROTATE)) {
      if (this.version==1) {
        return AutoRotateComponent.create().setAngularVelocity(Jsons.toVec3(this.properties.get("angularVelocity"))).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.LIFETIME)) {
      if (this.version==1) {
        return LifetimeComponent.create().setActive(this.getBoolean("active")).setRemaining(this.getFloat("remaining"), this.getFloat("random")).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.REMOVE_ON_OUTSPACE)) {
      if (this.version==1) {
        return RemoveOnOutspaceComponent.create().setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.POI)) {
      if (this.version==1) {
        return PoiComponent.create().setPos(this.getVec3("pos")).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.RP_GENERATOR)) {
      if (this.version==1) {
        return RpGeneratorComponent.create().setActive(this.getBoolean("active")).setWeight(this.getFloat("weight")).setGroups(Dut.copySet(Json.decodeStringList(this.getString("groups")))).setShape(RpGeneratorShape.valueOf(this.getString("shape"))).setPos(this.getVec3("pos")).setRot(this.getQuaternion("rot")).setRadius(this.getFloat("radius")).setSize(this.getVec3("size")).setKey(this.key);
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else if (this.type.equals(ComponentPrefabType.SCRIPT)) {
      if (this.version==1) {
        let res = Reflections.createClass(this.properties.get("className"));
        res.setKey(this.key);
        Reflections.callInstanceMethodIfExists(res, "setProperties", Jsons.toStringMap(this.properties.get("properties")));
        return res;
      }
      else {
        throw new Error("unsupported version: "+this.type+"; "+this.version);
      }
    }
    else {
      throw new Error("unsupported type: "+this.type);
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

  static create(type, key, version, properties) {
    let res = new ComponentPrefab();
    res.type = type;
    res.key = key;
    res.version = version;
    res.properties = Dut.copyImmutableMap(properties);
    res.guardInvariants();
    return res;
  }

  static transform(pos, rot) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.TRANSFORM;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("pos", Jsons.toJson(pos), "rot", Jsons.toJson(rot));
    res.guardInvariants();
    return res;
  }

  static rigidBody(kinematic, rotationLock, mass, damp, angularDamp) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.RIGID_BODY;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("kinematic", String.valueOf(kinematic), "rotationLock", String.valueOf(rotationLock), "mass", String.valueOf(mass), "damp", String.valueOf(damp), "angularDamp", String.valueOf(angularDamp));
    res.guardInvariants();
    return res;
  }

  static model(modelId, pos, rot, scale, visible, castShadows, receiveShadows) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.MODEL;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("modelId", modelId.id(), "pos", Jsons.toJson(pos), "rot", Jsons.toJson(rot), "scale", Jsons.toJson(scale), "visible", String.valueOf(visible), "castShadows", String.valueOf(castShadows), "receiveShadows", String.valueOf(receiveShadows), "interpolation", Jsons.toJson(Interpolation.create(0, 0, 0)));
    res.guardInvariants();
    return res;
  }

  static sphereCollider(active, trigger, layer, materialId, pos, rot, radius) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.SPHERE_COLLIDER;
    res.key = "";
    res.version = 2;
    res.properties = Dut.immutableMap("active", String.valueOf(active), "trigger", String.valueOf(trigger), "layer", layer.id(), "materialId", materialId.id(), "pos", Jsons.toJson(pos), "rot", Jsons.toJson(rot), "radius", String.valueOf(radius));
    res.guardInvariants();
    return res;
  }

  static boxCollider(active, trigger, layer, materialId, pos, rot, size) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.BOX_COLLIDER;
    res.key = "";
    res.version = 2;
    res.properties = Dut.immutableMap("active", String.valueOf(active), "trigger", String.valueOf(trigger), "layer", layer.id(), "materialId", materialId.id(), "pos", Jsons.toJson(pos), "rot", Jsons.toJson(rot), "size", Jsons.toJson(size));
    res.guardInvariants();
    return res;
  }

  static capsuleCollider(active, trigger, layer, materialId, pos, rot, height, radius) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.CAPSULE_COLLIDER;
    res.key = "";
    res.version = 2;
    res.properties = Dut.immutableMap("active", String.valueOf(active), "trigger", String.valueOf(trigger), "layer", layer.id(), "materialId", materialId.id(), "pos", Jsons.toJson(pos), "rot", Jsons.toJson(rot), "height", String.valueOf(height), "radius", String.valueOf(radius));
    res.guardInvariants();
    return res;
  }

  static dirLight(enabled, shadow, ambient, diffuse, specular) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.DIR_LIGHT;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("enabled", String.valueOf(enabled), "shadow", String.valueOf(shadow), "ambient", Jsons.toJson(ambient), "diffuse", Jsons.toJson(diffuse), "specular", Jsons.toJson(specular));
    res.guardInvariants();
    return res;
  }

  static perspectiveCamera(fovy, aspect, near, far, skyboxNear, skyboxFar) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.PERSPECTIVE_CAMERA;
    res.key = "";
    res.version = 2;
    res.properties = Dut.immutableMap("fovy", String.valueOf(fovy), "aspect", String.valueOf(aspect), "near", String.valueOf(near), "far", String.valueOf(far), "skyboxNear", String.valueOf(skyboxNear), "skyboxFar", String.valueOf(skyboxFar));
    res.guardInvariants();
    return res;
  }

  static perspectiveCameraFovy(displaySizeInputKey, fovyLandscape, fovyPortrait) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.PERSPECTIVE_CAMERA_FOVY;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("displaySizeInputKey", displaySizeInputKey, "fovyLandscape", String.valueOf(fovyLandscape), "fovyPortrait", String.valueOf(fovyPortrait));
    res.guardInvariants();
    return res;
  }

  static skybox(modelId, pos, rot, scale, visible) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.SKYBOX;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("modelId", modelId.id(), "pos", Jsons.toJson(pos), "rot", Jsons.toJson(rot), "scale", Jsons.toJson(scale), "visible", String.valueOf(visible));
    res.guardInvariants();
    return res;
  }

  static world(gravity, drag, angularDrag, boundary) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.WORLD;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("gravity", Jsons.toJson(gravity), "drag", String.valueOf(drag), "angularDrag", String.valueOf(angularDrag), "boundary", Jsons.toJson(boundary));
    res.guardInvariants();
    return res;
  }

  static autoRotate(angularVelocity) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.AUTO_ROTATE;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("angularVelocity", Jsons.toJson(angularVelocity));
    res.guardInvariants();
    return res;
  }

  static lifetime(active, remaining, random) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.LIFETIME;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("active", String.valueOf(active), "remaining", String.valueOf(remaining), "random", String.valueOf(random));
    res.guardInvariants();
    return res;
  }

  static removeOnOutspace() {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.REMOVE_ON_OUTSPACE;
    res.key = "";
    res.version = 1;
    res.properties = Collections.emptyMap();
    res.guardInvariants();
    return res;
  }

  static poi(pos) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.POI;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("pos", Jsons.toJson(pos));
    res.guardInvariants();
    return res;
  }

  static rpGenerator(active, weight, groups, shape, pos, rot, radius, size) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.RP_GENERATOR;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("active", String.valueOf(active), "weight", String.valueOf(weight), "groups", Json.encodeStringList(Dut.copyImmutableList(Dut.copySortedSet(groups))), "shape", shape.name(), "pos", Jsons.toJson(pos), "rot", Jsons.toJson(rot), "radius", String.valueOf(radius), "size", Jsons.toJson(size));
    res.guardInvariants();
    return res;
  }

  static script(className, properties) {
    let res = new ComponentPrefab();
    res.type = ComponentPrefabType.SCRIPT;
    res.key = "";
    res.version = 1;
    res.properties = Dut.immutableMap("className", className, "properties", Json.encodeStringMap(properties));
    res.guardInvariants();
    return res;
  }

}
classRegistry.ComponentPrefab = ComponentPrefab;
class CollisionGeometry {
  constructor() {
  }

  getClass() {
    return "CollisionGeometry";
  }

  static lineProjectedDst(start, dir, pt) {
    let dx = pt.x()-start.x();
    let dy = pt.y()-start.y();
    let dz = pt.z()-start.z();
    return dx*dir.x()+dy*dir.y()+dz*dir.z();
  }

  static lineSegmentClosest(start, end, pt) {
    let diff = end.sub(start);
    let ptdiff = pt.sub(start);
    let t = FMath.clamp(diff.dot(ptdiff)/diff.dot(diff), 0, 1);
    return start.addScaled(diff, t);
  }

  static edgeEdgeContactPoint(aCenter, a1, a2, b1, b2, bShift, maxSep, maxPen, parThres) {
    let adir = a2.subAndNormalize(a1);
    let bdir = b2.subAndNormalize(b1);
    let n = Vec3.cross(adir, bdir);
    if (n.sqrMag()<parThres) {
      return null;
    }
    n = n.normalize();
    let bToa = a1.sub(b1);
    let sab = adir.dot(bdir);
    let ra = bToa.dot(adir);
    let rb = bToa.dot(bdir);
    let t1 = (ra-sab*rb)/(sab*sab-1);
    let t2 = (-rb+ra*sab)/(sab*sab-1);
    if (t1<0||t1*t1>a2.sqrDist(a1)||t2<0||t2*t2>b2.sqrDist(b1)) {
      return null;
    }
    let ap = a1.addScaled(adir, t1);
    let bp = b1.addScaled(bdir, t2);
    let centerToAp = ap.sub(aCenter);
    let negN = n.scale(-1);
    if (centerToAp.dot(negN)>centerToAp.dot(n)) {
      n = negN;
    }
    if (bShift!=0) {
      bp = bp.addScaled(n, -bShift);
    }
    let depth = ap.dot(n)-bp.dot(n);
    let depthSqr = depth*depth;
    if (depth>=0) {
      if (depthSqr>maxPen) {
        return null;
      }
    }
    else {
      if (depthSqr>maxSep) {
        return null;
      }
    }
    return ContactPoint.create(ap, bp, n, depth);
  }

}
classRegistry.CollisionGeometry = CollisionGeometry;
const createColliderShape = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
const ColliderShape = Object.freeze({
  SPHERE: createColliderShape("SPHERE"),
  BOX: createColliderShape("BOX"),
  CAPSULE: createColliderShape("CAPSULE"),

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
class CollisionSphere {
  pos;
  radius;
  constructor() {
  }

  getClass() {
    return "CollisionSphere";
  }

  guardInvariants() {
  }

  getPos() {
    return this.pos;
  }

  getRadius() {
    return this.radius;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(pos, radius) {
    let res = new CollisionSphere();
    res.pos = pos;
    res.radius = radius;
    res.guardInvariants();
    return res;
  }

}
classRegistry.CollisionSphere = CollisionSphere;
class CollisionCapsule {
  pivot1;
  pivot2;
  radius;
  dir;
  pivotDst;
  constructor() {
  }

  getClass() {
    return "CollisionCapsule";
  }

  guardInvariants() {
  }

  initialize() {
    let sub = this.pivot2.sub(this.pivot1);
    this.dir = sub.normalize();
    this.pivotDst = sub.mag();
  }

  getPivot1() {
    return this.pivot1;
  }

  getPivot2() {
    return this.pivot2;
  }

  getRadius() {
    return this.radius;
  }

  getDir() {
    return this.dir;
  }

  getPivotDst() {
    return this.pivotDst;
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(pivot1, pivot2, radius) {
    let res = new CollisionCapsule();
    res.pivot1 = pivot1;
    res.pivot2 = pivot2;
    res.radius = radius;
    res.guardInvariants();
    res.initialize();
    return res;
  }

}
classRegistry.CollisionCapsule = CollisionCapsule;
class CollisionBox {
  pos;
  ux;
  uy;
  uz;
  ex;
  ey;
  ez;
  point1;
  point2;
  point3;
  point4;
  point5;
  point6;
  point7;
  point8;
  constructor() {
  }

  getClass() {
    return "CollisionBox";
  }

  guardInvariants() {
  }

  initPoints() {
    let dx = this.ux.scale(this.ex);
    let dy = this.uy.scale(this.ey);
    let dz = this.uz.scale(this.ez);
    this.point1 = this.pos.sub(dx).sub(dy).sub(dz);
    this.point2 = this.pos.sub(dx).sub(dy).add(dz);
    this.point3 = this.pos.add(dx).sub(dy).add(dz);
    this.point4 = this.pos.add(dx).sub(dy).sub(dz);
    this.point5 = this.pos.sub(dx).add(dy).sub(dz);
    this.point6 = this.pos.add(dx).add(dy).sub(dz);
    this.point7 = this.pos.add(dx).add(dy).add(dz);
    this.point8 = this.pos.sub(dx).add(dy).add(dz);
  }

  getPos() {
    return this.pos;
  }

  getUx() {
    return this.ux;
  }

  getUy() {
    return this.uy;
  }

  getUz() {
    return this.uz;
  }

  getEx() {
    return this.ex;
  }

  getEy() {
    return this.ey;
  }

  getEz() {
    return this.ez;
  }

  getPoint1() {
    return this.point1;
  }

  getPoint2() {
    return this.point2;
  }

  getPoint3() {
    return this.point3;
  }

  getPoint4() {
    return this.point4;
  }

  getPoint5() {
    return this.point5;
  }

  getPoint6() {
    return this.point6;
  }

  getPoint7() {
    return this.point7;
  }

  getPoint8() {
    return this.point8;
  }

  closestPoint(pt) {
    let d = pt.sub(this.pos);
    let dx = d.dot(this.ux);
    let dy = d.dot(this.uy);
    let dz = d.dot(this.uz);
    if (dx>=-this.ex&&dx<=this.ex&&dy>=-this.ey&&dy<=this.ey&&dz>=-this.ez&&dz<=this.ez) {
      return pt;
    }
    if (dx>this.ex) {
      dx = this.ex;
    }
    if (dx<-this.ex) {
      dx = -this.ex;
    }
    if (dy>this.ey) {
      dy = this.ey;
    }
    if (dy<-this.ey) {
      dy = -this.ey;
    }
    if (dz>this.ez) {
      dz = this.ez;
    }
    if (dz<-this.ez) {
      dz = -this.ez;
    }
    return this.pos.add(this.ux.scale(dx)).add(this.uy.scale(dy)).add(this.uz.scale(dz));
  }

  collides(center, radius) {
    let d = center.sub(this.pos);
    let dx = FMath.abs(d.dot(this.ux));
    let dy = FMath.abs(d.dot(this.uy));
    let dz = FMath.abs(d.dot(this.uz));
    return dx<=this.ex+radius&&dy<=this.ey+radius&&dz<=this.ez+radius;
  }

  projectToNormal(n) {
    let p = n.dot(this.point1);
    let max = p;
    let min = p;
    p = n.dot(this.point2);
    max = FMath.max(max, p);
    min = FMath.min(min, p);
    p = n.dot(this.point3);
    max = FMath.max(max, p);
    min = FMath.min(min, p);
    p = n.dot(this.point4);
    max = FMath.max(max, p);
    min = FMath.min(min, p);
    p = n.dot(this.point5);
    max = FMath.max(max, p);
    min = FMath.min(min, p);
    p = n.dot(this.point6);
    max = FMath.max(max, p);
    min = FMath.min(min, p);
    p = n.dot(this.point7);
    max = FMath.max(max, p);
    min = FMath.min(min, p);
    p = n.dot(this.point8);
    max = FMath.max(max, p);
    min = FMath.min(min, p);
    return Interval2.create(min, max);
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
    if (arguments.length===7&&arguments[0] instanceof Vec3&&arguments[1] instanceof Vec3&&arguments[2] instanceof Vec3&&arguments[3] instanceof Vec3&& typeof arguments[4]==="number"&& typeof arguments[5]==="number"&& typeof arguments[6]==="number") {
      return CollisionBox.create_7_Vec3_Vec3_Vec3_Vec3_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
    }
    else if (arguments.length===5&&arguments[0] instanceof Vec3&&arguments[1] instanceof Mat33&& typeof arguments[2]==="number"&& typeof arguments[3]==="number"&& typeof arguments[4]==="number") {
      return CollisionBox.create_5_Vec3_Mat33_number_number_number(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static create_7_Vec3_Vec3_Vec3_Vec3_number_number_number(pos, ux, uy, uz, ex, ey, ez) {
    let res = new CollisionBox();
    res.pos = pos;
    res.ux = ux;
    res.uy = uy;
    res.uz = uz;
    res.ex = ex;
    res.ey = ey;
    res.ez = ez;
    res.guardInvariants();
    res.initPoints();
    return res;
  }

  static create_5_Vec3_Mat33_number_number_number(pos, rot, ex, ey, ez) {
    let res = new CollisionBox();
    res.pos = pos;
    res.ux = rot.mul(Vec3.create(1, 0, 0)).normalize();
    res.uy = rot.mul(Vec3.create(0, 1, 0)).normalize();
    res.uz = rot.mul(Vec3.create(0, 0, 1)).normalize();
    res.ex = ex;
    res.ey = ey;
    res.ez = ez;
    res.guardInvariants();
    res.initPoints();
    return res;
  }

}
classRegistry.CollisionBox = CollisionBox;
class CollisionLayer {
  static WALL = CollisionLayer.of("WALL");
  static OBJECT = CollisionLayer.of("OBJECT");
  mId;
  constructor() {
  }

  getClass() {
    return "CollisionLayer";
  }

  guardInvariants() {
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
    if (!(obj instanceof CollisionLayer)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new CollisionLayer();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
classRegistry.CollisionLayer = CollisionLayer;
class CollisionLayerMatrix {
  def;
  matrix;
  constructor() {
  }

  getClass() {
    return "CollisionLayerMatrix";
  }

  guardInvariants() {
  }

  canCollide(l1, l2) {
    if (this.matrix.containsKey(l1)) {
      let map = this.matrix.get(l1);
      if (map.containsKey(l2)) {
        return map.get(l2);
      }
    }
    return this.def;
  }

  withDef(def) {
    let res = new CollisionLayerMatrix();
    res.def = def;
    res.matrix = this.matrix;
    res.guardInvariants();
    return res;
  }

  withValue(l1, l2, canCollide) {
    let res = new CollisionLayerMatrix();
    res.def = this.def;
    res.matrix = new HashMap();
    let col1 = false;
    let col2 = false;
    for (let layer of this.matrix.keySet()) {
      if (layer.equals(l1)) {
        col1 = true;
        let subl = Dut.copyMap(this.matrix.get(layer));
        subl.put(l2, canCollide);
        res.matrix.put(layer, Collections.unmodifiableMap(subl));
      }
      if (layer.equals(l2)) {
        col2 = true;
        let subl = Dut.copyMap(this.matrix.get(layer));
        subl.put(l1, canCollide);
        res.matrix.put(layer, Collections.unmodifiableMap(subl));
      }
      if (!layer.equals(l1)&&!layer.equals(l2)) {
        res.matrix.put(layer, this.matrix.get(layer));
      }
    }
    if (!col1) {
      res.matrix.put(l1, Dut.immutableMap(l2, canCollide));
    }
    if (!col2) {
      res.matrix.put(l2, Dut.immutableMap(l1, canCollide));
    }
    res.matrix = Collections.unmodifiableMap(res.matrix);
    res.guardInvariants();
    return res;
  }

  withDefValue(l1, l2) {
    let res = new CollisionLayerMatrix();
    res.def = this.def;
    res.matrix = new HashMap();
    for (let layer of this.matrix.keySet()) {
      if (layer.equals(l1)) {
        let subl = Dut.copyMap(this.matrix.get(layer));
        subl.remove(l2);
        if (!subl.isEmpty()) {
          res.matrix.put(layer, Collections.unmodifiableMap(subl));
        }
      }
      else if (layer.equals(l2)) {
        let subl = Dut.copyMap(this.matrix.get(layer));
        subl.remove(l1);
        if (!subl.isEmpty()) {
          res.matrix.put(layer, Collections.unmodifiableMap(subl));
        }
      }
      else {
        res.matrix.put(layer, this.matrix.get(layer));
      }
    }
    res.matrix = Collections.unmodifiableMap(res.matrix);
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

  static create() {
    let res = new CollisionLayerMatrix();
    res.def = true;
    res.matrix = Collections.emptyMap();
    res.guardInvariants();
    return res;
  }

  static standard() {
    return CollisionLayerMatrix.create().withDef(true).withValue(CollisionLayer.WALL, CollisionLayer.WALL, false).withValue(CollisionLayer.WALL, CollisionLayer.OBJECT, true).withValue(CollisionLayer.OBJECT, CollisionLayer.OBJECT, true);
  }

}
classRegistry.CollisionLayerMatrix = CollisionLayerMatrix;
class CollisionGridPlacement {
  minX;
  minY;
  minZ;
  maxX;
  maxY;
  maxZ;
  constructor() {
  }

  getClass() {
    return "CollisionGridPlacement";
  }

  guardInvariants() {
  }

  getMinX() {
    return this.minX;
  }

  getMinY() {
    return this.minY;
  }

  getMinZ() {
    return this.minZ;
  }

  getMaxX() {
    return this.maxX;
  }

  getMaxY() {
    return this.maxY;
  }

  getMaxZ() {
    return this.maxZ;
  }

  hashCode() {
    return this.minX+this.minY+this.minZ+this.maxX+this.maxY+this.maxZ;
  }

  equals(obj) {
    if (obj==null) {
      return false;
    }
    if (!(obj instanceof CollisionGridPlacement)) {
      return false;
    }
    let other = obj;
    return this.minX==other.minX&&this.minY==other.minY&&this.minZ==other.minZ&&this.maxX==other.maxX&&this.maxY==other.maxY&&this.maxZ==other.maxZ;
  }

  toString() {
  }

  static create(minX, minY, minZ, maxX, maxY, maxZ) {
    let res = new CollisionGridPlacement();
    res.minX = minX;
    res.minY = minY;
    res.minZ = minZ;
    res.maxX = maxX;
    res.maxY = maxY;
    res.maxZ = maxZ;
    res.guardInvariants();
    return res;
  }

}
classRegistry.CollisionGridPlacement = CollisionGridPlacement;
class CollisionCandidatePair {
  actorA;
  actorB;
  constructor() {
  }

  getClass() {
    return "CollisionCandidatePair";
  }

  guardInvariants() {
  }

  getActorA() {
    return this.actorA;
  }

  getActorB() {
    return this.actorB;
  }

  hashCode() {
    return this.actorA.hashCode()*this.actorB.hashCode();
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null||!(obj instanceof CollisionCandidatePair)) {
      return false;
    }
    let other = obj;
    return (this.actorA.equals(other.actorA)&&this.actorB.equals(other.actorB))||(this.actorA.equals(other.actorB)&&this.actorB.equals(other.actorA));
  }

  toString() {
  }

  static create() {
    if (arguments.length===2&&arguments[0] instanceof ActorId&&arguments[1] instanceof ActorId) {
      return CollisionCandidatePair.create_2_ActorId_ActorId(arguments[0], arguments[1]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="string"&& typeof arguments[1]==="string") {
      return CollisionCandidatePair.create_2_string_string(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static create_2_ActorId_ActorId(actorA, actorB) {
    let res = new CollisionCandidatePair();
    res.actorA = actorA;
    res.actorB = actorB;
    res.guardInvariants();
    return res;
  }

  static create_2_string_string(actorA, actorB) {
    let res = new CollisionCandidatePair();
    res.actorA = ActorId.of(actorA);
    res.actorB = ActorId.of(actorB);
    res.guardInvariants();
    return res;
  }

}
classRegistry.CollisionCandidatePair = CollisionCandidatePair;
class CollisionExclusion {
  actorA;
  actorB;
  constructor() {
  }

  getClass() {
    return "CollisionExclusion";
  }

  guardInvariants() {
  }

  getActorA() {
    return this.actorA;
  }

  getActorB() {
    return this.actorB;
  }

  hashCode() {
    return this.actorA.hashCode()*this.actorB.hashCode();
  }

  equals(obj) {
    if (this==obj) {
      return true;
    }
    if (obj==null||!(obj instanceof CollisionExclusion)) {
      return false;
    }
    let other = obj;
    return (this.actorA.equals(other.actorA)&&this.actorB.equals(other.actorB))||(this.actorA.equals(other.actorB)&&this.actorB.equals(other.actorA));
  }

  toString() {
  }

  static create(actorA, actorB) {
    let res = new CollisionExclusion();
    res.actorA = actorA;
    res.actorB = actorB;
    res.guardInvariants();
    return res;
  }

}
classRegistry.CollisionExclusion = CollisionExclusion;
class CollisionGrid {
  static GRID_COLOR = Rgb.create(0.2, 0.8, 0.5);
  cellSize;
  numCellsX;
  numCellsY;
  numCellsZ;
  numCellsXy;
  space;
  cells;
  placements;
  aabbs;
  constructor() {
  }

  getClass() {
    return "CollisionGrid";
  }

  guardInvariants() {
  }

  putActor(actorId, aabb) {
    let origPlacement = this.placements.get(actorId);
    let placement = this.calculatePlacement(aabb);
    this.aabbs.put(actorId, aabb);
    if (placement.equals(origPlacement)) {
      return ;
    }
    if (origPlacement!=null) {
      for (let x = origPlacement.getMinX(); x<=origPlacement.getMaxX(); ++x) {
        for (let y = origPlacement.getMinY(); y<=origPlacement.getMaxY(); ++y) {
          for (let z = origPlacement.getMinZ(); z<=origPlacement.getMaxZ(); ++z) {
            let idx = this.getCellIndex(x, y, z);
            this.cells.get(idx).remove(actorId);
          }
        }
      }
    }
    for (let x = placement.getMinX(); x<=placement.getMaxX(); ++x) {
      for (let y = placement.getMinY(); y<=placement.getMaxY(); ++y) {
        for (let z = placement.getMinZ(); z<=placement.getMaxZ(); ++z) {
          let idx = this.getCellIndex(x, y, z);
          this.cells.get(idx).add(actorId);
        }
      }
    }
    this.placements.put(actorId, placement);
  }

  copyActors(source) {
    for (let id of source.aabbs.keySet()) {
      this.putActor(id, source.aabbs.get(id));
    }
  }

  removeActor(actorId) {
    let placement = this.placements.get(actorId);
    if (placement==null) {
      return ;
    }
    for (let x = placement.getMinX(); x<=placement.getMaxX(); ++x) {
      for (let y = placement.getMinY(); y<=placement.getMaxY(); ++y) {
        for (let z = placement.getMinZ(); z<=placement.getMaxZ(); ++z) {
          let idx = this.getCellIndex(x, y, z);
          this.cells.get(idx).remove(actorId);
        }
      }
    }
    this.placements.remove(actorId);
    this.aabbs.remove(actorId);
  }

  getCandidatePairs() {
    let res = new HashSet();
    for (let cell of this.cells) {
      for (let i = 0; i<cell.size()-1; ++i) {
        let actA = cell.get(i);
        let aabbA = this.aabbs.get(actA);
        for (let j = i+1; j<cell.size(); ++j) {
          let actB = cell.get(j);
          if (aabbA.isIntersect(this.aabbs.get(actB))) {
            res.add(CollisionCandidatePair.create(actA, actB));
          }
        }
      }
    }
    return res;
  }

  getCandidates(aabb) {
    let spaceMin = this.space.min();
    let res = new HashSet();
    aabb = Aabb3.create(aabb.min().sub(spaceMin), aabb.max().sub(spaceMin));
    let minX = Math.min(this.numCellsX, Math.max(0, FMath.trunc(aabb.min().x()/this.cellSize)));
    let minY = Math.min(this.numCellsY, Math.max(0, FMath.trunc(aabb.min().y()/this.cellSize)));
    let minZ = Math.min(this.numCellsZ, Math.max(0, FMath.trunc(aabb.min().z()/this.cellSize)));
    let maxX = Math.min(this.numCellsX, Math.max(0, FMath.trunc(aabb.max().x()/this.cellSize)));
    let maxY = Math.min(this.numCellsY, Math.max(0, FMath.trunc(aabb.max().y()/this.cellSize)));
    let maxZ = Math.min(this.numCellsZ, Math.max(0, FMath.trunc(aabb.max().z()/this.cellSize)));
    for (let x = minX; x<=maxX; ++x) {
      for (let y = minY; y<=maxY; ++y) {
        for (let z = minZ; z<=maxZ; ++z) {
          res.addAll(this.cells.get(this.getCellIndex(x, y, z)));
        }
      }
    }
    return res;
  }

  renderDebug(gDriver, request, camera) {
    if (request.hasDebugRenderRealm(DebugRenderRealm.SPACE_PARTITIONING)) {
      let spaceMin = this.space.min();
      let spaceMax = this.space.max();
      let prend = gDriver.startRenderer("PrimitiveRenderer", BasicEnvironment.create(camera));
      for (let cy = 0; cy<=this.numCellsY; ++cy) {
        for (let cz = 0; cz<=this.numCellsZ; ++cz) {
          prend.line(Vec3.create(spaceMin.x(), spaceMin.y()+this.cellSize*cy, spaceMin.y()+this.cellSize*cz), Vec3.create(spaceMax.x(), spaceMin.y()+this.cellSize*cy, spaceMin.y()+this.cellSize*cz), CollisionGrid.GRID_COLOR);
        }
      }
      for (let cx = 0; cx<=this.numCellsX; ++cx) {
        for (let cz = 0; cz<=this.numCellsZ; ++cz) {
          prend.line(Vec3.create(spaceMin.x()+this.cellSize*cx, spaceMin.y(), spaceMin.y()+this.cellSize*cz), Vec3.create(spaceMin.x()+this.cellSize*cx, spaceMax.y(), spaceMin.y()+this.cellSize*cz), CollisionGrid.GRID_COLOR);
        }
      }
      for (let cx = 0; cx<=this.numCellsX; ++cx) {
        for (let cy = 0; cy<=this.numCellsY; ++cy) {
          prend.line(Vec3.create(spaceMin.x()+this.cellSize*cx, spaceMin.y()+this.cellSize*cy, spaceMin.y()), Vec3.create(spaceMin.x()+this.cellSize*cx, spaceMin.y()+this.cellSize*cy, spaceMax.y()), CollisionGrid.GRID_COLOR);
        }
      }
    }
  }

  getSpace() {
    return this.space;
  }

  getNumCellsX() {
    return this.numCellsX;
  }

  getNumCellsY() {
    return this.numCellsY;
  }

  getNumCellsZ() {
    return this.numCellsZ;
  }

  getPlacement(actorId) {
    return this.placements.get(actorId);
  }

  calculatePlacement(aabb) {
    let spaceMin = this.space.min();
    let minX = aabb.min().x()-spaceMin.x();
    let minY = aabb.min().y()-spaceMin.y();
    let minZ = aabb.min().z()-spaceMin.z();
    let maxX = aabb.max().x()-spaceMin.x();
    let maxY = aabb.max().y()-spaceMin.y();
    let maxZ = aabb.max().z()-spaceMin.z();
    if (minX<0||minY<0||minZ<0) {
      throw new Error("box is out of the grid in minimum");
    }
    let res = CollisionGridPlacement.create(FMath.trunc(minX/this.cellSize), FMath.trunc(minY/this.cellSize), FMath.trunc(minZ/this.cellSize), FMath.trunc(maxX/this.cellSize), FMath.trunc(maxY/this.cellSize), FMath.trunc(maxZ/this.cellSize));
    if (res.getMaxX()>=this.numCellsX||res.getMaxY()>=this.numCellsY||res.getMaxZ()>=this.numCellsZ) {
      throw new Error("box is out of the grid in maximum");
    }
    return res;
  }

  getCellIndex(cellX, cellY, cellZ) {
    return cellZ*this.numCellsXy+cellY*this.numCellsX+cellX;
  }

  toString() {
  }

  static create(cellSize, min, numCellsX, numCellsY, numCellsZ) {
    let res = new CollisionGrid();
    res.cellSize = cellSize;
    res.numCellsX = numCellsX;
    res.numCellsY = numCellsY;
    res.numCellsZ = numCellsZ;
    res.space = Aabb3.create(min, min.add(cellSize*numCellsX, cellSize*numCellsY, cellSize*numCellsZ));
    res.guardInvariants();
    let numCells = numCellsX*numCellsY*numCellsZ;
    res.numCellsXy = numCellsX*numCellsY;
    res.cells = new ArrayList(numCells);
    for (let i = 0; i<numCells; ++i) {
      res.cells.add(new ArrayList());
    }
    res.placements = new HashMap();
    res.aabbs = new HashMap();
    return res;
  }

}
classRegistry.CollisionGrid = CollisionGrid;
class CollisionGridBroadphaseManager {
  cellSize;
  cellSizeIncrement;
  cellBuffer;
  maxCells;
  grid;
  constructor() {
  }

  getClass() {
    return "CollisionGridBroadphaseManager";
  }

  guardInvariants() {
  }

  putActor(actorId, aabb) {
    this.ensureGrid(aabb);
    this.grid.putActor(actorId, aabb);
  }

  removeActor(actorId) {
    this.grid.removeActor(actorId);
  }

  getCandidatePairs() {
    return this.grid.getCandidatePairs();
  }

  getCandidates(aabb) {
    return this.grid.getCandidates(aabb);
  }

  renderDebug(gDriver, request, camera) {
    this.grid.renderDebug(gDriver, request, camera);
  }

  ensureGrid(aabb) {
    let gridMin = this.grid.getSpace().min();
    let gridMax = this.grid.getSpace().max();
    if (gridMin.x()<=aabb.min().x()&&gridMin.y()<=aabb.min().y()&&gridMin.z()<=aabb.min().z()&&gridMax.x()>aabb.max().x()&&gridMax.y()>aabb.max().y()&&gridMax.z()>aabb.max().z()) {
      return ;
    }
    let newGridMin = Vec3.create(FMath.min(gridMin.x(), aabb.min().x()-this.cellSize*this.cellBuffer), FMath.min(gridMin.y(), aabb.min().y()-this.cellSize*this.cellBuffer), FMath.min(gridMin.z(), aabb.min().z()-this.cellSize*this.cellBuffer));
    let newGridMax = Vec3.create(FMath.max(gridMax.x(), aabb.max().x()+this.cellSize*this.cellBuffer), FMath.max(gridMax.y(), aabb.max().y()+this.cellSize*this.cellBuffer), FMath.max(gridMax.z(), aabb.max().z()+this.cellSize*this.cellBuffer));
    let numCellsX = FMath.trunc((newGridMax.x()-newGridMin.x())/this.cellSize)+1;
    let numCellsY = FMath.trunc((newGridMax.x()-newGridMin.x())/this.cellSize)+1;
    let numCellsZ = FMath.trunc((newGridMax.x()-newGridMin.x())/this.cellSize)+1;
    while (numCellsX*numCellsY*numCellsZ>this.maxCells) {
      this.cellSize = this.cellSize+this.cellSizeIncrement;
      numCellsX = FMath.trunc((newGridMax.x()-newGridMin.x())/this.cellSize)+1;
      numCellsY = FMath.trunc((newGridMax.x()-newGridMin.x())/this.cellSize)+1;
      numCellsZ = FMath.trunc((newGridMax.x()-newGridMin.x())/this.cellSize)+1;
    }
    let newGrid = CollisionGrid.create(this.cellSize, newGridMin, numCellsX, numCellsY, numCellsZ);
    newGrid.copyActors(this.grid);
    this.grid = newGrid;
  }

  toString() {
  }

  static create(initCellSize) {
    let res = new CollisionGridBroadphaseManager();
    res.cellSize = initCellSize;
    res.cellSizeIncrement = initCellSize;
    res.cellBuffer = 5;
    res.maxCells = 10000;
    res.grid = CollisionGrid.create(initCellSize, Vec3.diagonal(-10), 10, 10, 10);
    res.guardInvariants();
    return res;
  }

}
classRegistry.CollisionGridBroadphaseManager = CollisionGridBroadphaseManager;
class BroadphaseCollisionManager {
  static RECALCULATE_TRIGGER_DOMAINS = Dut.immutableSet(ActorDomain.TRANSFORM, ActorDomain.COLLISION, ActorDomain.VISUAL);
  layerMatrix;
  detector;
  broadphase;
  actors = new HashMap();
  actorColliders = new HashMap();
  exclusions = new HashMap();
  actorExclusions = new HashMap();
  constructor() {
  }

  getClass() {
    return "BroadphaseCollisionManager";
  }

  guardInvariants() {
  }

  setLayerMatrix(layerMatrix) {
    Guard.notNull(layerMatrix, "layerMatrix cannot be null");
    this.layerMatrix = layerMatrix;
  }

  addActor(actor) {
    Guard.beFalse(this.actors.containsKey(actor.getId()), "actor with the same if is already registered");
    this.recalculateActorFully(actor);
    actor.addListener(this);
  }

  removeActor(id) {
    this.broadphase.removeActor(id);
    let actor = this.actors.remove(id);
    this.actorColliders.remove(id);
    let actExcls = this.actorExclusions.remove(id);
    if (actor!=null) {
      actor.removeListener(this);
    }
    if (actExcls!=null) {
      for (let excl of actExcls) {
        this.removeExclusion(excl);
      }
    }
  }

  onComponentAdded(actor, component) {
    this.recalculateActorFully(actor);
  }

  onComponentRemoved(actor, component) {
    this.recalculateActorFully(actor);
  }

  onDomainUpdate(actor, domain) {
    if (BroadphaseCollisionManager.RECALCULATE_TRIGGER_DOMAINS.contains(domain)) {
      let tc = actor.getComponent("TransformComponent");
      let aabb = tc.getGlobalAabb();
      this.broadphase.putActor(actor.getId(), aabb);
    }
    else if (domain.equals(ActorDomain.COLLISION_EXCLUSION)) {
      this.recalculateActorFully(actor);
    }
    else {
      throw new Error("unsupported domain: "+domain);
    }
  }

  getAllContacts() {
    let candidates = this.broadphase.getCandidatePairs();
    let excls = this.exclusions.keySet();
    let res = new ArrayList();
    for (let candidate of candidates) {
      if (excls.contains(CollisionExclusion.create(candidate.getActorA(), candidate.getActorB()))) {
        continue;
      }
      let colsA = this.actorColliders.get(candidate.getActorA());
      let colsB = this.actorColliders.get(candidate.getActorB());
      for (let i = 0; i<colsA.size(); ++i) {
        let ca = colsA.get(i);
        for (let j = 0; j<colsB.size(); ++j) {
          let cb = colsB.get(j);
          if (this.layerMatrix.canCollide(ca.getLayer(), cb.getLayer())) {
            let contactPoints = this.detector.getContactPoints(ca.getVolume(), cb.getVolume());
            if (!contactPoints.isEmpty()) {
              res.add(Contact.create(ca, cb, contactPoints));
            }
          }
        }
      }
    }
    return res;
  }

  withCollider(collider) {
    let candidates = this.broadphase.getCandidates(collider.getGlobalAabb());
    let excls = this.exclusions.keySet();
    let res = new ArrayList();
    for (let actorId of candidates) {
      if (excls.contains(CollisionExclusion.create(collider.actor().getId(), actorId))) {
        continue;
      }
      let cols = this.actorColliders.get(actorId);
      for (let i = 0; i<cols.size(); ++i) {
        let ca = cols.get(i);
        if (ca==collider||ca.actor().equals(collider.actor())) {
          continue;
        }
        if (this.layerMatrix.canCollide(ca.getLayer(), collider.getLayer())) {
          let col = this.detector.isCollision(collider.getVolume(), ca.getVolume());
          if (col) {
            res.add(ca);
          }
        }
      }
    }
    return res;
  }

  withColliderContacts(collider) {
    let candidates = this.broadphase.getCandidates(collider.getGlobalAabb());
    let excls = this.exclusions.keySet();
    let res = new ArrayList();
    for (let actorId of candidates) {
      if (excls.contains(CollisionExclusion.create(collider.actor().getId(), actorId))) {
        continue;
      }
      let cols = this.actorColliders.get(actorId);
      for (let i = 0; i<cols.size(); ++i) {
        let ca = cols.get(i);
        if (ca==collider||ca.actor().equals(collider.actor())) {
          continue;
        }
        if (this.layerMatrix.canCollide(ca.getLayer(), collider.getLayer())) {
          let cps = this.detector.getContactPoints(collider.getVolume(), ca.getVolume());
          if (!cps.isEmpty()) {
            res.add(Contact.create(collider, ca, cps));
          }
        }
      }
    }
    return Dut.copyList(res);
  }

  renderDebug(gDriver, request, camera) {
    if (this.broadphase instanceof DebugRenderable) {
      (this.broadphase).this.renderDebug(gDriver, request, camera);
    }
  }

  recalculateActorFully(actor) {
    let id = actor.getId();
    let actPreviousExcls = this.actorExclusions.remove(actor.getId());
    if (actPreviousExcls!=null) {
      for (let excl of actPreviousExcls) {
        this.removeExclusion(excl);
      }
    }
    let actColliders = new ArrayList();
    let actExclusions = new HashSet();
    for (let comp of actor.getComponents()) {
      if (comp.hasFeature(ComponentFeature.COLLIDER)) {
        let collider = comp;
        if (collider.isActive()) {
          actColliders.add(comp);
        }
      }
      if (comp.hasFeature(ComponentFeature.COLLISION_EXCLUSION_PRODUCER)) {
        let compExcls = (comp).getCollisionExclusions();
        actExclusions.addAll(compExcls);
      }
    }
    this.actors.put(id, actor);
    this.actorColliders.put(id, actColliders);
    this.actorExclusions.put(id, actExclusions);
    for (let excl of actExclusions) {
      this.addExclusion(excl);
    }
    let tc = actor.getComponentNonStrict("TransformComponent");
    if (tc!=null) {
      this.broadphase.putActor(id, tc.getGlobalAabb());
    }
    else {
      this.broadphase.removeActor(id);
    }
  }

  addExclusion(exclusion) {
    let num = this.exclusions.get(exclusion);
    if (num==null) {
      this.exclusions.put(exclusion, 1);
    }
    else {
      this.exclusions.put(exclusion, num+1);
    }
  }

  removeExclusion(exclusion) {
    let num = this.exclusions.get(exclusion);
    if (num==null||num<=1) {
      this.exclusions.remove(exclusion);
    }
    else {
      this.exclusions.put(exclusion, num-1);
    }
  }

  toString() {
  }

  static create(error) {
    let res = new BroadphaseCollisionManager();
    res.layerMatrix = CollisionLayerMatrix.standard();
    res.broadphase = CollisionGridBroadphaseManager.create(10);
    res.detector = PrimitiveCollisionDetector.create(error);
    res.actors = new HashMap();
    res.guardInvariants();
    return res;
  }

}
classRegistry.BroadphaseCollisionManager = BroadphaseCollisionManager;
class ContactPoint {
  posA;
  posB;
  normal;
  tangent1;
  tangent2;
  depth;
  constructor() {
  }

  getClass() {
    return "ContactPoint";
  }

  guardInvariants() {
  }

  getPosA() {
    return this.posA;
  }

  getPosB() {
    return this.posB;
  }

  getNormal() {
    return this.normal;
  }

  getTangent1() {
    return this.tangent1;
  }

  getTangent2() {
    return this.tangent2;
  }

  getDepth() {
    return this.depth;
  }

  swap() {
    let res = new ContactPoint();
    res.posA = this.posB;
    res.posB = this.posA;
    res.normal = this.normal.scale(-1);
    res.tangent1 = this.tangent1.scale(-1);
    res.tangent2 = this.tangent2.scale(-1);
    res.depth = this.depth;
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

  static create(posA, posB, normal, depth) {
    let res = new ContactPoint();
    res.posA = posA;
    res.posB = posB;
    res.normal = normal;
    if (FMath.abs(normal.x())>=0.57735) {
      res.tangent1 = Vec3.create(normal.y(), -normal.x(), 0.0).normalize();
    }
    else {
      res.tangent1 = Vec3.create(0, normal.z(), -normal.y()).normalize();
    }
    res.tangent2 = Vec3.cross(normal, res.tangent1);
    res.depth = depth;
    res.guardInvariants();
    return res;
  }

}
classRegistry.ContactPoint = ContactPoint;
class Contact {
  colliderA;
  colliderB;
  contactPoints;
  constructor() {
  }

  getClass() {
    return "Contact";
  }

  guardInvariants() {
  }

  getRigidBodyA() {
    return this.colliderA.actor().getComponent("RigidBodyComponent");
  }

  getRigidBodyB() {
    return this.colliderB.actor().getComponent("RigidBodyComponent");
  }

  getColliderA() {
    return this.colliderA;
  }

  getColliderB() {
    return this.colliderB;
  }

  getContactPoints() {
    return this.contactPoints;
  }

  swap() {
    let res = new Contact();
    res.colliderA = this.colliderB;
    res.colliderB = this.colliderA;
    res.contactPoints = new ArrayList();
    for (let cp of this.contactPoints) {
      res.contactPoints.add(cp.swap());
    }
    res.contactPoints = Collections.unmodifiableList(res.contactPoints);
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

  static create(colliderA, colliderB, contactPoints) {
    let res = new Contact();
    res.colliderA = colliderA;
    res.colliderB = colliderB;
    res.contactPoints = Dut.copyImmutableList(contactPoints);
    res.guardInvariants();
    return res;
  }

}
classRegistry.Contact = Contact;
class SphereSphereCollisions {
  constructor() {
  }

  getClass() {
    return "SphereSphereCollisions";
  }

  static isCollision(sphereA, sphereB, error) {
    let dst = sphereA.getPos().dist(sphereB.getPos());
    if (dst>sphereA.getRadius()+sphereB.getRadius()+error) {
      return false;
    }
    return true;
  }

  static getContactPoints(sphereA, sphereB, error) {
    let dst = sphereA.getPos().dist(sphereB.getPos());
    if (dst>sphereA.getRadius()+sphereB.getRadius()+error) {
      return Collections.emptyList();
    }
    let n = sphereB.getPos().sub(sphereA.getPos()).normalize();
    let d = sphereA.getRadius()+sphereB.getRadius()-dst;
    let posA = sphereA.getPos().addScaled(n, sphereA.getRadius());
    let posB = sphereB.getPos().addScaled(n, -sphereB.getRadius());
    let contactPoint = ContactPoint.create(posA, posB, n, d);
    return Dut.list(contactPoint);
  }

}
classRegistry.SphereSphereCollisions = SphereSphereCollisions;
class CapsuleSphereCollisions {
  constructor() {
  }

  getClass() {
    return "CapsuleSphereCollisions";
  }

  static isCollision(capsule, sphere, error) {
    let closest = CollisionGeometry.lineSegmentClosest(capsule.getPivot1(), capsule.getPivot2(), sphere.getPos());
    let dst = closest.dist(sphere.getPos());
    if (dst>capsule.getRadius()+sphere.getRadius()+error) {
      return false;
    }
    return true;
  }

  static getContactPoints(capsule, sphere, error) {
    let closest = CollisionGeometry.lineSegmentClosest(capsule.getPivot1(), capsule.getPivot2(), sphere.getPos());
    let dst = closest.dist(sphere.getPos());
    if (dst>capsule.getRadius()+sphere.getRadius()+error) {
      return Collections.emptyList();
    }
    let n = sphere.getPos().sub(closest).normalize();
    let depth = capsule.getRadius()+sphere.getRadius()-dst;
    let posA = closest.addScaled(n, capsule.getRadius());
    let posB = sphere.getPos().addScaled(n, -sphere.getRadius());
    let contactPoint = ContactPoint.create(posA, posB, n, depth);
    return Collections.singletonList(contactPoint);
  }

}
classRegistry.CapsuleSphereCollisions = CapsuleSphereCollisions;
class CapsuleCapsuleCollisions {
  constructor() {
  }

  getClass() {
    return "CapsuleCapsuleCollisions";
  }

  static isCollision(capsuleA, capsuleB, error, parallelError) {
    let n = Vec3.cross(capsuleA.getDir(), capsuleB.getDir());
    if (n.sqrMag()<parallelError) {
      let p1 = CollisionGeometry.lineSegmentClosest(capsuleA.getPivot1(), capsuleA.getPivot2(), capsuleB.getPivot1());
      let dst1 = p1.dist(capsuleB.getPivot1());
      let p2 = CollisionGeometry.lineSegmentClosest(capsuleA.getPivot1(), capsuleA.getPivot2(), capsuleB.getPivot2());
      let dst2 = p2.dist(capsuleB.getPivot2());
      let p3 = CollisionGeometry.lineSegmentClosest(capsuleB.getPivot1(), capsuleB.getPivot2(), capsuleA.getPivot1());
      let dst3 = p3.dist(capsuleA.getPivot1());
      let p4 = CollisionGeometry.lineSegmentClosest(capsuleB.getPivot1(), capsuleB.getPivot2(), capsuleA.getPivot2());
      let dst4 = p4.dist(capsuleA.getPivot2());
      if (dst1<=error||dst2<=error||dst3<=error||dst4<=error) {
        return false;
      }
      let cut = capsuleA.getRadius()+capsuleB.getRadius()+error;
      if (dst1>cut&&dst2>cut&&dst3>cut&&dst4>cut) {
        return false;
      }
      return true;
    }
    else {
      n = n.normalize();
      let n1 = Vec3.cross(capsuleA.getDir(), n);
      let n2 = Vec3.cross(capsuleB.getDir(), n);
      let t1 = capsuleB.getPivot1().sub(capsuleA.getPivot1()).dot(n2)/capsuleA.getDir().dot(n2);
      let t2 = capsuleA.getPivot1().sub(capsuleB.getPivot1()).dot(n1)/capsuleB.getDir().dot(n1);
      let p1 = capsuleA.getPivot1().add(capsuleA.getDir().scale(t1));
      let p2 = capsuleB.getPivot1().add(capsuleB.getDir().scale(t2));
      if (t1<0||t1>capsuleA.getPivotDst()) {
        t1 = FMath.clamp(t1, 0, capsuleA.getPivotDst());
        p1 = capsuleA.getPivot1().add(capsuleA.getDir().scale(t1));
        t2 = CollisionGeometry.lineProjectedDst(capsuleB.getPivot1(), capsuleB.getDir(), p1);
        p2 = capsuleB.getPivot1().add(capsuleB.getDir().scale(t2));
      }
      if (t2<0||t2>capsuleB.getPivotDst()) {
        t2 = FMath.clamp(t2, 0, capsuleB.getPivotDst());
        p2 = capsuleB.getPivot1().add(capsuleB.getDir().scale(t2));
        t1 = FMath.clamp(CollisionGeometry.lineProjectedDst(capsuleA.getPivot1(), capsuleA.getDir(), p2), 0, capsuleA.getPivotDst());
        p1 = capsuleA.getPivot1().add(capsuleA.getDir().scale(t1));
      }
      let dst = p1.dist(p2);
      if (dst<error) {
        return false;
      }
      if (dst>capsuleA.getRadius()+capsuleB.getRadius()+error) {
        return false;
      }
      return true;
    }
  }

  static getContactPoints(capsuleA, capsuleB, error, parallelError) {
    let n = Vec3.cross(capsuleA.getDir(), capsuleB.getDir());
    if (n.sqrMag()<parallelError) {
      let p1 = CollisionGeometry.lineSegmentClosest(capsuleA.getPivot1(), capsuleA.getPivot2(), capsuleB.getPivot1());
      let dst1 = p1.dist(capsuleB.getPivot1());
      let p2 = CollisionGeometry.lineSegmentClosest(capsuleA.getPivot1(), capsuleA.getPivot2(), capsuleB.getPivot2());
      let dst2 = p2.dist(capsuleB.getPivot2());
      let p3 = CollisionGeometry.lineSegmentClosest(capsuleB.getPivot1(), capsuleB.getPivot2(), capsuleA.getPivot1());
      let dst3 = p3.dist(capsuleA.getPivot1());
      let p4 = CollisionGeometry.lineSegmentClosest(capsuleB.getPivot1(), capsuleB.getPivot2(), capsuleA.getPivot2());
      let dst4 = p4.dist(capsuleA.getPivot2());
      if (dst1<=error||dst2<=error||dst3<=error||dst4<=error) {
        return Collections.emptyList();
      }
      let cut = capsuleA.getRadius()+capsuleB.getRadius()+error;
      if (dst1>cut&&dst2>cut&&dst3>cut&&dst4>cut) {
        return Collections.emptyList();
      }
      let res = new ArrayList();
      if (dst1<=cut) {
        let cn = capsuleB.getPivot1().sub(p1).normalize();
        let d = capsuleA.getRadius()+capsuleB.getRadius()-dst1;
        let posA = p1.addScaled(cn, capsuleA.getRadius());
        let posB = capsuleB.getPivot1().addScaled(cn, -capsuleB.getRadius());
        res.add(ContactPoint.create(posA, posB, cn, d));
      }
      if (dst2<=cut) {
        let cn = capsuleB.getPivot2().sub(p2).normalize();
        let d = capsuleA.getRadius()+capsuleB.getRadius()-dst2;
        let posA = p2.addScaled(cn, capsuleA.getRadius());
        let posB = capsuleB.getPivot2().addScaled(cn, -capsuleB.getRadius());
        res.add(ContactPoint.create(posA, posB, cn, d));
      }
      if (dst3<=cut) {
        let cn = p3.sub(capsuleA.getPivot1()).normalize();
        let d = capsuleA.getRadius()+capsuleB.getRadius()-dst3;
        let posA = capsuleA.getPivot1().addScaled(cn, capsuleA.getRadius());
        let posB = p3.addScaled(cn, -capsuleB.getRadius());
        res.add(ContactPoint.create(posA, posB, cn, d));
      }
      if (dst4<=cut) {
        let cn = p4.sub(capsuleA.getPivot2()).normalize();
        let d = capsuleA.getRadius()+capsuleB.getRadius()-dst4;
        let posA = capsuleA.getPivot2().addScaled(cn, capsuleA.getRadius());
        let posB = p4.addScaled(cn, -capsuleB.getRadius());
        res.add(ContactPoint.create(posA, posB, cn, d));
      }
      return res;
    }
    else {
      n = n.normalize();
      let n1 = Vec3.cross(capsuleA.getDir(), n);
      let n2 = Vec3.cross(capsuleB.getDir(), n);
      let t1 = capsuleB.getPivot1().sub(capsuleA.getPivot1()).dot(n2)/capsuleA.getDir().dot(n2);
      let t2 = capsuleA.getPivot1().sub(capsuleB.getPivot1()).dot(n1)/capsuleB.getDir().dot(n1);
      let p1 = capsuleA.getPivot1().add(capsuleA.getDir().scale(t1));
      let p2 = capsuleB.getPivot1().add(capsuleB.getDir().scale(t2));
      if (t1<0||t1>capsuleA.getPivotDst()) {
        t1 = FMath.clamp(t1, 0, capsuleA.getPivotDst());
        p1 = capsuleA.getPivot1().add(capsuleA.getDir().scale(t1));
        t2 = CollisionGeometry.lineProjectedDst(capsuleB.getPivot1(), capsuleB.getDir(), p1);
        p2 = capsuleB.getPivot1().add(capsuleB.getDir().scale(t2));
      }
      if (t2<0||t2>capsuleB.getPivotDst()) {
        t2 = FMath.clamp(t2, 0, capsuleB.getPivotDst());
        p2 = capsuleB.getPivot1().add(capsuleB.getDir().scale(t2));
        t1 = FMath.clamp(CollisionGeometry.lineProjectedDst(capsuleA.getPivot1(), capsuleA.getDir(), p2), 0, capsuleA.getPivotDst());
        p1 = capsuleA.getPivot1().add(capsuleA.getDir().scale(t1));
      }
      let dst = p1.dist(p2);
      if (dst<error) {
        return Collections.emptyList();
      }
      if (dst>capsuleA.getRadius()+capsuleB.getRadius()+error) {
        return Collections.emptyList();
      }
      let r1 = capsuleA.getRadius();
      let r2 = capsuleB.getRadius();
      let inter = r1/(r1+r2);
      let normal = p2.sub(p1).normalize();
      let d = capsuleA.getRadius()+capsuleB.getRadius()-dst;
      let posA = p1.addScaled(normal, capsuleA.getRadius());
      let posB = p2.addScaled(normal, -capsuleB.getRadius());
      return Collections.singletonList(ContactPoint.create(posA, posB, normal, d));
    }
  }

}
classRegistry.CapsuleCapsuleCollisions = CapsuleCapsuleCollisions;
class BoxSphereCollisions {
  constructor() {
  }

  getClass() {
    return "BoxSphereCollisions";
  }

  static isCollision(box, sphere, error) {
    let closest = box.closestPoint(sphere.getPos());
    let sub = closest.sub(sphere.getPos());
    if (sub.mag()<error) {
      return true;
    }
    let dst = sub.mag();
    if (dst>sphere.getRadius()+error) {
      return false;
    }
    return true;
  }

  static getContactPoints(box, sphere, error) {
    let closest = box.closestPoint(sphere.getPos());
    let sub = sphere.getPos().sub(closest);
    let dst = sub.mag();
    if (sub.mag()<error) {
      let d = sphere.getPos().sub(box.getPos());
      let dx = d.dot(box.getUx());
      let dy = d.dot(box.getUy());
      let dz = d.dot(box.getUz());
      let dxp = box.getEx()-dx;
      let dxm = box.getEx()+dx;
      let dyp = box.getEy()-dy;
      let dym = box.getEy()+dy;
      let dzp = box.getEz()-dz;
      let dzm = box.getEz()+dz;
      let min = dxp;
      let n = box.getUx();
      if (dxm<min) {
        min = dxm;
        n = box.getUx().scale(-1);
      }
      if (dyp<min) {
        min = dyp;
        n = box.getUy();
      }
      if (dym<min) {
        min = dym;
        n = box.getUy().scale(-1);
      }
      if (dzp<min) {
        min = dzp;
        n = box.getUz();
      }
      if (dzm<min) {
        min = dzm;
        n = box.getUz().scale(-1);
      }
      return Collections.singletonList(ContactPoint.create(closest.addScaled(n, min), sphere.getPos().addScaled(n, -sphere.getRadius()), n, sphere.getRadius()+min));
    }
    if (dst>sphere.getRadius()+error) {
      return Collections.emptyList();
    }
    let normal = sub.normalize();
    return Collections.singletonList(ContactPoint.create(closest, sphere.getPos().addScaled(normal, -sphere.getRadius()), normal, sphere.getRadius()-dst));
  }

}
classRegistry.BoxSphereCollisions = BoxSphereCollisions;
class BoxCapsuleCollisions {
  constructor() {
  }

  getClass() {
    return "BoxCapsuleCollisions";
  }

  static isCollision(box, capsule, error, parallelError) {
    return !(BoxCapsuleCollisions.getContactPoints(box, capsule, error, parallelError).isEmpty());
  }

  static getContactPoints(box, capsule, error, parallelError) {
    let res = new ArrayList();
    let closest = null;
    let sub = null;
    let dst = 0;
    closest = box.closestPoint(capsule.getPivot1());
    sub = capsule.getPivot1().sub(closest);
    dst = sub.mag();
    if (dst>error&&dst<=capsule.getRadius()+error) {
      let n = sub.normalize();
      res.add(ContactPoint.create(closest, capsule.getPivot1().addScaled(n, -capsule.getRadius()), n, capsule.getRadius()-dst));
    }
    closest = box.closestPoint(capsule.getPivot2());
    sub = capsule.getPivot2().sub(closest);
    dst = sub.mag();
    if (dst>error&&dst<=capsule.getRadius()+error) {
      let n = sub.normalize();
      res.add(ContactPoint.create(closest, capsule.getPivot2().addScaled(n, -capsule.getRadius()), n, capsule.getRadius()-dst));
    }
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint1(), box.getPoint2(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint2(), box.getPoint3(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint3(), box.getPoint4(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint4(), box.getPoint1(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint5(), box.getPoint6(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint6(), box.getPoint7(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint7(), box.getPoint8(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint8(), box.getPoint5(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint1(), box.getPoint5(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint2(), box.getPoint8(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint3(), box.getPoint7(), capsule, res, error, parallelError);
    BoxCapsuleCollisions.insertEdgeContact(box.getPos(), box.getPoint4(), box.getPoint6(), capsule, res, error, parallelError);
    return res;
  }

  static insertEdgeContact(boxPos, boxEdgeA, boxEdgeB, cap, outBuf, error, parallelError) {
    let c = CollisionGeometry.edgeEdgeContactPoint(boxPos, boxEdgeA, boxEdgeB, cap.getPivot1(), cap.getPivot2(), cap.getRadius(), error, cap.getRadius(), parallelError);
    if (c!=null) {
      outBuf.add(c);
    }
  }

}
classRegistry.BoxCapsuleCollisions = BoxCapsuleCollisions;
class BoxBoxSat {
  depth = Float.POSITIVE_INFINITY;
  normal = null;
  constructor() {
  }

  getClass() {
    return "BoxBoxSat";
  }

  isCollision() {
    return this.normal!=null;
  }

  getNormal() {
    return this.normal;
  }

  getDepth() {
    return this.depth;
  }

  calculateSat(v1, v2, error, crossError) {
    let testedDir = null;
    testedDir = v1.getUx();
    if (this.testSatAxis(v1, v2, testedDir, error)) {
      this.normal = null;
      return ;
    }
    testedDir = v1.getUy();
    if (this.testSatAxis(v1, v2, testedDir, error)) {
      this.normal = null;
      return ;
    }
    testedDir = v1.getUz();
    if (this.testSatAxis(v1, v2, testedDir, error)) {
      this.normal = null;
      return ;
    }
    testedDir = v2.getUx();
    if (this.testSatAxis(v1, v2, testedDir, error)) {
      this.normal = null;
      return ;
    }
    testedDir = v2.getUy();
    if (this.testSatAxis(v1, v2, testedDir, error)) {
      this.normal = null;
      return ;
    }
    testedDir = v2.getUz();
    if (this.testSatAxis(v1, v2, testedDir, error)) {
      this.normal = null;
      return ;
    }
    testedDir = Vec3.cross(v1.getUx(), v2.getUx());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
    testedDir = Vec3.cross(v1.getUx(), v2.getUy());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
    testedDir = Vec3.cross(v1.getUx(), v2.getUz());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
    testedDir = Vec3.cross(v1.getUy(), v2.getUx());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
    testedDir = Vec3.cross(v1.getUy(), v2.getUy());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
    testedDir = Vec3.cross(v1.getUy(), v2.getUz());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
    testedDir = Vec3.cross(v1.getUz(), v2.getUx());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
    testedDir = Vec3.cross(v1.getUz(), v2.getUy());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
    testedDir = Vec3.cross(v1.getUz(), v2.getUz());
    if (testedDir.mag()>crossError) {
      testedDir = testedDir.normalize();
      if (this.testSatAxis(v1, v2, testedDir, error)) {
        this.normal = null;
        return ;
      }
    }
  }

  testSatAxis(v1, v2, dir, error) {
    let int1 = v1.projectToNormal(dir);
    let int2 = v2.projectToNormal(dir);
    let diff = this.totalLength(int1, int2)-this.sumLength(int1, int2);
    if (diff>error) {
      return true;
    }
    let d1 = int1.max()-int2.min();
    let d2 = int2.max()-int1.min();
    if (d1<=d2) {
      if (d1<this.depth) {
        this.depth = d1;
        this.normal = dir;
      }
    }
    else {
      if (d2<this.depth) {
        this.depth = d2;
        this.normal = dir.scale(-1);
      }
    }
    return false;
  }

  totalLength(int1, int2) {
    return Math.max(int1.max(), int2.max())-Math.min(int1.min(), int2.min());
  }

  sumLength(int1, int2) {
    return int1.length()+int2.length();
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(box1, box2, error, crossError) {
    let res = new BoxBoxSat();
    res.calculateSat(box1, box2, error, crossError);
    return res;
  }

}
classRegistry.BoxBoxSat = BoxBoxSat;
class BoxBoxCollisions {
  constructor() {
  }

  getClass() {
    return "BoxBoxCollisions";
  }

  static isCollision(boxA, boxB, error, crossError) {
    let sat = BoxBoxSat.create(boxA, boxB, error, crossError);
    return sat.isCollision();
  }

  static getContactPoints(boxA, boxB, error, crossError) {
    let sat = BoxBoxSat.create(boxA, boxB, error, crossError);
    if (!sat.isCollision()) {
      return Collections.emptyList();
    }
    let res = new ArrayList();
    if (boxA.collides(boxB.getPoint1(), error)) {
      res.add(ContactPoint.create(boxB.getPoint1(), boxB.getPoint1(), sat.getNormal(), sat.getDepth()));
    }
    if (boxA.collides(boxB.getPoint2(), error)) {
      res.add(ContactPoint.create(boxB.getPoint2(), boxB.getPoint2(), sat.getNormal(), sat.getDepth()));
    }
    if (boxA.collides(boxB.getPoint3(), error)) {
      res.add(ContactPoint.create(boxB.getPoint3(), boxB.getPoint3(), sat.getNormal(), sat.getDepth()));
    }
    if (boxA.collides(boxB.getPoint4(), error)) {
      res.add(ContactPoint.create(boxB.getPoint4(), boxB.getPoint4(), sat.getNormal(), sat.getDepth()));
    }
    if (boxA.collides(boxB.getPoint5(), error)) {
      res.add(ContactPoint.create(boxB.getPoint5(), boxB.getPoint5(), sat.getNormal(), sat.getDepth()));
    }
    if (boxA.collides(boxB.getPoint6(), error)) {
      res.add(ContactPoint.create(boxB.getPoint6(), boxB.getPoint6(), sat.getNormal(), sat.getDepth()));
    }
    if (boxA.collides(boxB.getPoint7(), error)) {
      res.add(ContactPoint.create(boxB.getPoint7(), boxB.getPoint7(), sat.getNormal(), sat.getDepth()));
    }
    if (boxA.collides(boxB.getPoint8(), error)) {
      res.add(ContactPoint.create(boxB.getPoint8(), boxB.getPoint8(), sat.getNormal(), sat.getDepth()));
    }
    if (boxB.collides(boxA.getPoint1(), error)) {
      res.add(ContactPoint.create(boxA.getPoint1(), boxA.getPoint1(), sat.getNormal(), sat.getDepth()));
    }
    if (boxB.collides(boxA.getPoint2(), error)) {
      res.add(ContactPoint.create(boxA.getPoint2(), boxA.getPoint2(), sat.getNormal(), sat.getDepth()));
    }
    if (boxB.collides(boxA.getPoint3(), error)) {
      res.add(ContactPoint.create(boxA.getPoint3(), boxA.getPoint3(), sat.getNormal(), sat.getDepth()));
    }
    if (boxB.collides(boxA.getPoint4(), error)) {
      res.add(ContactPoint.create(boxA.getPoint4(), boxA.getPoint4(), sat.getNormal(), sat.getDepth()));
    }
    if (boxB.collides(boxA.getPoint5(), error)) {
      res.add(ContactPoint.create(boxA.getPoint5(), boxA.getPoint5(), sat.getNormal(), sat.getDepth()));
    }
    if (boxB.collides(boxA.getPoint6(), error)) {
      res.add(ContactPoint.create(boxA.getPoint6(), boxA.getPoint6(), sat.getNormal(), sat.getDepth()));
    }
    if (boxB.collides(boxA.getPoint7(), error)) {
      res.add(ContactPoint.create(boxA.getPoint7(), boxA.getPoint7(), sat.getNormal(), sat.getDepth()));
    }
    if (boxB.collides(boxA.getPoint8(), error)) {
      res.add(ContactPoint.create(boxA.getPoint8(), boxA.getPoint8(), sat.getNormal(), sat.getDepth()));
    }
    let edges1 = BoxBoxCollisions.getEdges(boxA);
    let edges2 = BoxBoxCollisions.getEdges(boxB);
    for (let edge1 of edges1) {
      for (let edge2 of edges2) {
        let mid = BoxBoxCollisions.cross(edge1.get(0), edge1.get(1), edge2.get(0), edge2.get(1), error);
        if (mid!=null&&boxA.collides(mid, error)&&boxB.collides(mid, error)) {
          res.add(ContactPoint.create(mid, mid, sat.getNormal(), sat.getDepth()));
        }
      }
    }
    return res;
  }

  static getEdges(box) {
    return Dut.list(Dut.list(box.getPoint1(), box.getPoint2()), Dut.list(box.getPoint2(), box.getPoint3()), Dut.list(box.getPoint3(), box.getPoint4()), Dut.list(box.getPoint4(), box.getPoint1()), Dut.list(box.getPoint5(), box.getPoint6()), Dut.list(box.getPoint6(), box.getPoint7()), Dut.list(box.getPoint7(), box.getPoint8()), Dut.list(box.getPoint8(), box.getPoint5()), Dut.list(box.getPoint1(), box.getPoint5()), Dut.list(box.getPoint2(), box.getPoint8()), Dut.list(box.getPoint3(), box.getPoint7()), Dut.list(box.getPoint4(), box.getPoint6()));
  }

  static cross(a1, a2, b1, b2, error) {
    let da = a2.sub(a1).normalize();
    let db = b2.sub(b1).normalize();
    let n = Vec3.cross(da, db);
    if (n.sqrMag()<0.01) {
      return null;
    }
    let na = Vec3.cross(da, n);
    let nb = Vec3.cross(db, n);
    let ca = a1.add(da.scale(b1.sub(a1).dot(nb)/da.dot(nb)));
    let cb = b1.add(db.scale(a1.sub(b1).dot(na)/db.dot(na)));
    if (ca.sqrDist(cb)>error*error) {
      return null;
    }
    return Vec3.interpolate(ca, cb, 0.5);
  }

}
classRegistry.BoxBoxCollisions = BoxBoxCollisions;
class PrimitiveCollisionDetector {
  error;
  parallelError;
  crossError;
  constructor() {
  }

  getClass() {
    return "PrimitiveCollisionDetector";
  }

  guardInvariants() {
  }

  isCollision(volumeA, volumeB) {
    if (volumeA instanceof CollisionSphere&&volumeB instanceof CollisionSphere) {
      return SphereSphereCollisions.isCollision(volumeA, volumeB, this.error);
    }
    else if (volumeA instanceof CollisionCapsule&&volumeB instanceof CollisionSphere) {
      return CapsuleSphereCollisions.isCollision(volumeA, volumeB, this.error);
    }
    else if (volumeA instanceof CollisionSphere&&volumeB instanceof CollisionCapsule) {
      return CapsuleSphereCollisions.isCollision(volumeB, volumeA, this.error);
    }
    else if (volumeA instanceof CollisionCapsule&&volumeB instanceof CollisionCapsule) {
      return CapsuleCapsuleCollisions.isCollision(volumeA, volumeB, this.error, this.parallelError);
    }
    else if (volumeA instanceof CollisionBox&&volumeB instanceof CollisionSphere) {
      return BoxSphereCollisions.isCollision(volumeA, volumeB, this.error);
    }
    else if (volumeA instanceof CollisionSphere&&volumeB instanceof CollisionBox) {
      return BoxSphereCollisions.isCollision(volumeB, volumeA, this.error);
    }
    else if (volumeA instanceof CollisionBox&&volumeB instanceof CollisionCapsule) {
      return BoxCapsuleCollisions.isCollision(volumeA, volumeB, this.error, this.parallelError);
    }
    else if (volumeA instanceof CollisionCapsule&&volumeB instanceof CollisionBox) {
      return BoxCapsuleCollisions.isCollision(volumeB, volumeA, this.error, this.parallelError);
    }
    else if (volumeA instanceof CollisionBox&&volumeB instanceof CollisionBox) {
      return BoxBoxCollisions.isCollision(volumeA, volumeB, this.error, this.crossError);
    }
    else {
      throw new Error("unsupported volume classes, implement me");
    }
  }

  getContactPoints(volumeA, volumeB) {
    if (volumeA instanceof CollisionSphere&&volumeB instanceof CollisionSphere) {
      return SphereSphereCollisions.getContactPoints(volumeA, volumeB, this.error);
    }
    else if (volumeA instanceof CollisionCapsule&&volumeB instanceof CollisionSphere) {
      return CapsuleSphereCollisions.getContactPoints(volumeA, volumeB, this.error);
    }
    else if (volumeA instanceof CollisionSphere&&volumeB instanceof CollisionCapsule) {
      return this.swapDirections(CapsuleSphereCollisions.getContactPoints(volumeB, volumeA, this.error));
    }
    else if (volumeA instanceof CollisionCapsule&&volumeB instanceof CollisionCapsule) {
      return CapsuleCapsuleCollisions.getContactPoints(volumeA, volumeB, this.error, this.parallelError);
    }
    else if (volumeA instanceof CollisionBox&&volumeB instanceof CollisionSphere) {
      return BoxSphereCollisions.getContactPoints(volumeA, volumeB, this.error);
    }
    else if (volumeA instanceof CollisionSphere&&volumeB instanceof CollisionBox) {
      return this.swapDirections(BoxSphereCollisions.getContactPoints(volumeB, volumeA, this.error));
    }
    else if (volumeA instanceof CollisionBox&&volumeB instanceof CollisionCapsule) {
      return BoxCapsuleCollisions.getContactPoints(volumeA, volumeB, this.error, this.parallelError);
    }
    else if (volumeA instanceof CollisionCapsule&&volumeB instanceof CollisionBox) {
      return this.swapDirections(BoxCapsuleCollisions.getContactPoints(volumeB, volumeA, this.error, this.parallelError));
    }
    else if (volumeA instanceof CollisionBox&&volumeB instanceof CollisionBox) {
      return BoxBoxCollisions.getContactPoints(volumeA, volumeB, this.error, this.crossError);
    }
    else {
      throw new Error("unsupported volume classes, implement me");
    }
  }

  swapDirections(cps) {
    let res = new ArrayList();
    for (let cp of cps) {
      res.add(cp.swap());
    }
    return res;
  }

  toString() {
  }

  static create(error) {
    let res = new PrimitiveCollisionDetector();
    res.error = error;
    res.parallelError = 0.01;
    res.crossError = 1e-5;
    res.guardInvariants();
    return res;
  }

}
classRegistry.PrimitiveCollisionDetector = PrimitiveCollisionDetector;
class Inertias {
  constructor() {
  }

  getClass() {
    return "Inertias";
  }

  static box(m, sx, sy, sz) {
    return Mat33.create(m*(sy*sy+sz*sz)/12, 0, 0, 0, m*(sx*sx+sz*sz)/12, 0, 0, 0, m*(sx*sx+sy*sy)/12);
  }

  static sphere(m, r) {
    return Mat33.create(m*r*r*2/5, 0, 0, 0, m*r*r*2/5, 0, 0, 0, m*r*r*2/5);
  }

  static cylinder(m, r, h) {
    return Mat33.create(m*h*h/12+m*r*r/4, 0, 0, 0, m*r*r/2, 0, 0, 0, m*h*h/12+m*r*r/4);
  }

  static toWorldCoords(local, rot) {
    let mat = Mat33.rot(rot);
    let mati = mat.transpose();
    return mat.mul(local.mul(mati));
  }

}
classRegistry.Inertias = Inertias;
const createPhysicalMaterialCombineType = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
const PhysicalMaterialCombineType = Object.freeze({
  AVG: createPhysicalMaterialCombineType("AVG"),
  MIN: createPhysicalMaterialCombineType("MIN"),
  MUL: createPhysicalMaterialCombineType("MUL"),
  MAX: createPhysicalMaterialCombineType("MAX"),

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
class PhysicalMaterialId extends RefId {
  static TYPE = RefIdType.of("PHYSICAL_MATERIAL_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "PhysicalMaterialId";
  }

  guardInvariants() {
  }

  type() {
    return PhysicalMaterialId.TYPE;
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
    if (!(obj instanceof PhysicalMaterialId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new PhysicalMaterialId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
classRegistry.PhysicalMaterialId = PhysicalMaterialId;
class PhysicalMaterial {
  static COMBINE_PRIORITY = Dut.immutableMap(PhysicalMaterialCombineType.AVG, 0, PhysicalMaterialCombineType.MIN, 1, PhysicalMaterialCombineType.MUL, 2, PhysicalMaterialCombineType.MAX, 3);
  bounciness;
  bouninessCombineType;
  staticFriction;
  dynamicFriction;
  frictionCombineType;
  constructor() {
  }

  getClass() {
    return "PhysicalMaterial";
  }

  guardInvariants() {
  }

  getBounciness() {
    return this.bounciness;
  }

  getBouninessCombineType() {
    return this.bouninessCombineType;
  }

  getStaticFriction() {
    if (arguments.length===0) {
      return this.getStaticFriction_0();
    }
    else if (arguments.length===1&&arguments[0] instanceof PhysicalMaterial) {
      return this.getStaticFriction_1_PhysicalMaterial(arguments[0]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getStaticFriction_0() {
    return this.staticFriction;
  }

  getStaticFriction_1_PhysicalMaterial(other) {
    return this.combine(this.staticFriction, this.frictionCombineType, other.staticFriction, other.frictionCombineType);
  }

  getDynamicFriction() {
    if (arguments.length===0) {
      return this.getDynamicFriction_0();
    }
    else if (arguments.length===1&&arguments[0] instanceof PhysicalMaterial) {
      return this.getDynamicFriction_1_PhysicalMaterial(arguments[0]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  getDynamicFriction_0() {
    return this.dynamicFriction;
  }

  getDynamicFriction_1_PhysicalMaterial(other) {
    return this.combine(this.dynamicFriction, this.frictionCombineType, other.dynamicFriction, other.frictionCombineType);
  }

  getFrictionCombineType() {
    return this.frictionCombineType;
  }

  getBounce(other) {
    return this.combine(this.bounciness, this.bouninessCombineType, other.bounciness, other.bouninessCombineType);
  }

  combine(v1, c1, v2, c2) {
    let p1 = PhysicalMaterial.COMBINE_PRIORITY.get(c1);
    Guard.notNull(p1, "unsupported combine type: %s", c1);
    let p2 = PhysicalMaterial.COMBINE_PRIORITY.get(c2);
    Guard.notNull(p2, "unsupported combine type: %s", c2);
    let c = p1>p2?c1:c2;
    if (c.equals(PhysicalMaterialCombineType.AVG)) {
      return (v1+v2)/2;
    }
    else if (c.equals(PhysicalMaterialCombineType.MIN)) {
      return FMath.min(v1, v2);
    }
    else if (c.equals(PhysicalMaterialCombineType.MUL)) {
      return v1*v2;
    }
    else if (c.equals(PhysicalMaterialCombineType.MAX)) {
      return FMath.max(v1, v2);
    }
    else {
      throw new Error("unsupported combine type: "+c);
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

  static create(bounciness, bouninessCombineType, staticFriction, dynamicFriction, frictionCombineType) {
    let res = new PhysicalMaterial();
    res.bounciness = bounciness;
    res.bouninessCombineType = bouninessCombineType;
    res.staticFriction = staticFriction;
    res.dynamicFriction = dynamicFriction;
    res.frictionCombineType = frictionCombineType;
    res.guardInvariants();
    return res;
  }

  static simple() {
    if (arguments.length===3&& typeof arguments[0]==="number"&& typeof arguments[1]==="number"&& typeof arguments[2]==="number") {
      return PhysicalMaterial.simple_3_number_number_number(arguments[0], arguments[1], arguments[2]);
    }
    else if (arguments.length===2&& typeof arguments[0]==="number"&& typeof arguments[1]==="number") {
      return PhysicalMaterial.simple_2_number_number(arguments[0], arguments[1]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static simple_3_number_number_number(bounciness, staticFriction, dynamicFriction) {
    let res = new PhysicalMaterial();
    res.bounciness = bounciness;
    res.bouninessCombineType = PhysicalMaterialCombineType.AVG;
    res.staticFriction = staticFriction;
    res.dynamicFriction = dynamicFriction;
    res.frictionCombineType = PhysicalMaterialCombineType.AVG;
    res.guardInvariants();
    return res;
  }

  static simple_2_number_number(bounciness, friction) {
    let res = new PhysicalMaterial();
    res.bounciness = bounciness;
    res.bouninessCombineType = PhysicalMaterialCombineType.AVG;
    res.staticFriction = friction;
    res.dynamicFriction = friction;
    res.frictionCombineType = PhysicalMaterialCombineType.AVG;
    res.guardInvariants();
    return res;
  }

}
classRegistry.PhysicalMaterial = PhysicalMaterial;
class RigidBodies {
  constructor() {
  }

  getClass() {
    return "RigidBodies";
  }

  static integerateAndClearAccums(dt, actors) {
    actors.forEach(ActorId.ROOT, (actor) => {
  let rb = actor.getComponentNonStrict("RigidBodyComponent");
  if (rb==null) {
    return ;
  }
  rb.integrate(dt);
  rb.clearAccums();
});
  }

  static getJoints(actors) {
    let res = new ArrayList();
    actors.forEach(ActorId.ROOT, (actor) => {
  let cmps = actor.getComponents();
  for (let i = 0; i<cmps.size(); ++i) {
    let comp = cmps.get(i);
    if (comp.hasFeature(ComponentFeature.RIGID_BODY_JOINT)) {
      res.add(comp);
    }
  }
});
    return res;
  }

}
classRegistry.RigidBodies = RigidBodies;
class Island {
  contacts;
  joints;
  constructor() {
  }

  getClass() {
    return "Island";
  }

  guardInvariants() {
  }

  getContacts() {
    return this.contacts;
  }

  getJoints() {
    return this.joints;
  }

  getNumContactPoints() {
    let res = 0;
    for (let contact of this.contacts) {
      res = res+contact.getContactPoints().size();
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

  static create(contacts, joints) {
    let res = new Island();
    res.contacts = Dut.copyImmutableList(contacts);
    res.joints = Dut.copyImmutableList(joints);
    res.guardInvariants();
    return res;
  }

}
classRegistry.Island = Island;
class Islands {
  getClass() {
    return "Islands";
  }

  static buildIslands(contacts, joints) {
    if (contacts.isEmpty()&&joints.isEmpty()) {
      return Collections.emptyList();
    }
    let islsContacts = new ArrayList();
    let islsJoints = new ArrayList();
    let islsBodies = new ArrayList();
    for (let contact of contacts) {
      if (contact.getRigidBodyA().isKinematic()&&contact.getRigidBodyB().isKinematic()) {
        continue;
      }
      let m1 = -1;
      let m2 = -1;
      for (let i = 0; i<islsBodies.size(); ++i) {
        let bodies = islsBodies.get(i);
        if (!contact.getRigidBodyA().isKinematic()&&bodies.contains(contact.getRigidBodyA())) {
          if (m1==-1) {
            m1 = i;
          }
          else {
            m2 = i;
            break;
          }
        }
        if (!contact.getRigidBodyB().isKinematic()&&bodies.contains(contact.getRigidBodyB())) {
          if (m1==-1) {
            m1 = i;
          }
          else {
            m2 = i;
            break;
          }
        }
      }
      if (m1==-1&&m2==-1) {
        let nContacts = new ArrayList();
        let nJoints = new ArrayList();
        let nBodies = new HashSet();
        nContacts.add(contact);
        nBodies.add(contact.getRigidBodyA());
        nBodies.add(contact.getRigidBodyB());
        islsContacts.add(nContacts);
        islsJoints.add(nJoints);
        islsBodies.add(nBodies);
      }
      else if (m2==-1||m2==m1) {
        islsContacts.get(m1).add(contact);
        islsBodies.get(m1).add(contact.getRigidBodyA());
        islsBodies.get(m1).add(contact.getRigidBodyB());
      }
      else {
        islsContacts.get(m1).addAll(islsContacts.get(m2));
        islsJoints.get(m1).addAll(islsJoints.get(m2));
        islsBodies.get(m1).addAll(islsBodies.get(m2));
        islsContacts.get(m1).add(contact);
        islsBodies.get(m1).add(contact.getRigidBodyA());
        islsBodies.get(m1).add(contact.getRigidBodyB());
        islsContacts.remove(m2);
        islsJoints.remove(m2);
        islsBodies.remove(m2);
      }
    }
    for (let joint of joints) {
      if (joint.getRigidBodyA().isKinematic()&&joint.getRigidBodyB().isKinematic()) {
        continue;
      }
      let m1 = -1;
      let m2 = -1;
      for (let i = 0; i<islsBodies.size(); ++i) {
        let bodies = islsBodies.get(i);
        if (!joint.getRigidBodyA().isKinematic()&&bodies.contains(joint.getRigidBodyA())) {
          if (m1==-1) {
            m1 = i;
          }
          else {
            m2 = i;
            break;
          }
        }
        if (!joint.getRigidBodyB().isKinematic()&&bodies.contains(joint.getRigidBodyB())) {
          if (m1==-1) {
            m1 = i;
          }
          else {
            m2 = i;
            break;
          }
        }
      }
      if (m1==-1&&m2==-1) {
        let nContacts = new ArrayList();
        let nJoints = new ArrayList();
        let nBodies = new HashSet();
        nJoints.add(joint);
        nBodies.add(joint.getRigidBodyA());
        nBodies.add(joint.getRigidBodyB());
        islsContacts.add(nContacts);
        islsJoints.add(nJoints);
        islsBodies.add(nBodies);
      }
      else if (m2==-1||m2==m1) {
        islsJoints.get(m1).add(joint);
        islsBodies.get(m1).add(joint.getRigidBodyA());
        islsBodies.get(m1).add(joint.getRigidBodyB());
      }
      else {
        islsContacts.get(m1).addAll(islsContacts.get(m2));
        islsJoints.get(m1).addAll(islsJoints.get(m2));
        islsBodies.get(m1).addAll(islsBodies.get(m2));
        islsJoints.get(m1).add(joint);
        islsBodies.get(m1).add(joint.getRigidBodyA());
        islsBodies.get(m1).add(joint.getRigidBodyB());
        islsContacts.remove(m2);
        islsJoints.remove(m2);
        islsBodies.remove(m2);
      }
    }
    let res = new ArrayList(islsBodies.size());
    for (let i = 0; i<islsBodies.size(); ++i) {
      res.add(Island.create(islsContacts.get(i), islsJoints.get(i)));
    }
    return res;
  }

}
classRegistry.Islands = Islands;
class SolverConfiguration {
  timeStep;
  maxIterations = 100;
  posError = 1e-3;
  velError = 5e-2;
  impulseError = 1e-6;
  contactBaumgarteDepth = 1e-3;
  contactBaumgarte = 0.05;
  contactBounceVel = 0.5;
  jointBaumgarte = 1;
  constructor() {
  }

  getClass() {
    return "SolverConfiguration";
  }

  guardInvariants() {
  }

  getTimeStep() {
    return this.timeStep;
  }

  getMaxIterations() {
    return this.maxIterations;
  }

  getPosError() {
    return this.posError;
  }

  getVelError() {
    return this.velError;
  }

  getImpulseError() {
    return this.impulseError;
  }

  getContactBaumgarteDepth() {
    return this.contactBaumgarteDepth;
  }

  getContactBaumgarte() {
    return this.contactBaumgarte;
  }

  getContactBounceVel() {
    return this.contactBounceVel;
  }

  getJointBaumgarte() {
    return this.jointBaumgarte;
  }

  static create(timeStep) {
    let res = new SolverConfiguration();
    res.timeStep = timeStep;
    res.guardInvariants();
    return res;
  }

}
classRegistry.SolverConfiguration = SolverConfiguration;
class SequentialSolverWorkBuffer {
  bounceVelocities = [];
  frictionCoefficients = [];
  normalEffects = [];
  normalSums = [];
  tangentSums = [];
  constructor() {
  }

  getClass() {
    return "SequentialSolverWorkBuffer";
  }

  getBounceVelocity(idx) {
    return this.bounceVelocities[idx];
  }

  setBounceVelocity(idx, bounceVelocity) {
    this.bounceVelocities[idx] = bounceVelocity;
  }

  getNormalSum(idx) {
    return this.normalSums[idx];
  }

  addNormalSum(idx, im) {
    this.normalSums[idx] = this.normalSums[idx]+im;
  }

  getNormalEffect(idx) {
    return this.normalEffects[idx];
  }

  setNormalEffect(idx, normalEffect) {
    this.normalEffects[idx] = normalEffect;
  }

  getFrictionCoefficient(idx) {
    return this.frictionCoefficients[idx];
  }

  setFrictionCoefficient(idx, coef) {
    this.frictionCoefficients[idx] = coef;
  }

  getTangentSum(idx) {
    return this.tangentSums[idx];
  }

  addScaledTangentSum(idx, v, s) {
    this.tangentSums[idx] = this.tangentSums[idx].addScaled(v, s);
  }

  reset(numContactPoints) {
    if (this.normalEffects.length<numContactPoints) {
      this.bounceVelocities = [];
      this.frictionCoefficients = [];
      this.normalEffects = [];
      this.normalSums = [];
      this.tangentSums = [];
    }
    for (let i = 0; i<numContactPoints; ++i) {
      this.bounceVelocities[i] = 0;
      this.frictionCoefficients[i] = 0;
      this.normalEffects[i] = 0;
      this.normalSums[i] = 0;
      this.tangentSums[i] = Vec3.ZERO;
    }
  }

  static create() {
    return new SequentialSolverWorkBuffer();
  }

}
classRegistry.SequentialSolverWorkBuffer = SequentialSolverWorkBuffer;
class SequentialSolver {
  configuration;
  buffer = SequentialSolverWorkBuffer.create();
  constructor() {
  }

  getClass() {
    return "SequentialSolver";
  }

  guardInvariants() {
  }

  solve(contacts, joints) {
    let islands = Islands.buildIslands(contacts, joints);
    for (let island of islands) {
      this.solveIsland(island);
    }
  }

  solveIsland(island) {
    let numCp = island.getNumContactPoints();
    this.buffer.reset(numCp);
    this.prapareBuffers(island.getContacts());
    let nextit = true;
    let needFriction = true;
    let normalPassed = false;
    let cpIdx = -1;
    for (let i = 0; i<this.configuration.getMaxIterations()&&(nextit||needFriction); ++i) {
      nextit = false;
      if (normalPassed) {
        cpIdx = -1;
        for (let contact of island.getContacts()) {
          let rb1 = contact.getRigidBodyA();
          let rb2 = contact.getRigidBodyB();
          for (let contactPoint of contact.getContactPoints()) {
            cpIdx = cpIdx+1;
            let normal = contactPoint.getNormal();
            let vA = rb1.getPointVelocity(contactPoint.getPosA());
            let vB = rb2.getPointVelocity(contactPoint.getPosB());
            let relVel = vA.sub(vB);
            let tgRelVel = relVel.subScaled(normal, relVel.dot(normal));
            if (tgRelVel.mag()<this.configuration.getVelError()) {
              continue;
            }
            let tg = tgRelVel.normalize();
            let tgUnitEf1 = rb1.getImpulseEffectOnPoint(contactPoint.getPosA(), tg, contactPoint.getPosA());
            let tgUnitEf2 = rb2.getImpulseEffectOnPoint(contactPoint.getPosB(), tg, contactPoint.getPosB());
            let tgUnitEfProj1 = tg.dot(tgUnitEf1);
            let tgUnitEfProj2 = tg.dot(tgUnitEf2);
            let tgUnitEfProj = tgUnitEfProj1+tgUnitEfProj2;
            let maxTotalMag = this.buffer.getNormalSum(cpIdx)*this.buffer.getFrictionCoefficient(cpIdx);
            let maxImpulse = SequentialSolver.maxTgMag(this.buffer.getTangentSum(cpIdx), tg, maxTotalMag);
            let impulse = Math.min(maxImpulse, tgRelVel.mag()/tgUnitEfProj);
            rb1.applyImpulse(contactPoint.getPosA(), tg.scale(-impulse));
            rb2.applyImpulse(contactPoint.getPosB(), tg.scale(impulse));
            this.buffer.addScaledTangentSum(cpIdx, tg, impulse);
            nextit = nextit|(FMath.abs(impulse)>this.configuration.getImpulseError());
          }
        }
        needFriction = false;
      }
      cpIdx = -1;
      for (let contact of island.getContacts()) {
        let rb1 = contact.getRigidBodyA();
        let rb2 = contact.getRigidBodyB();
        for (let contactPoint of contact.getContactPoints()) {
          cpIdx = cpIdx+1;
          let normal = contactPoint.getNormal();
          let v1 = rb1.getPointVelocity(contactPoint.getPosA());
          let v2 = rb2.getPointVelocity(contactPoint.getPosB());
          let nv1 = normal.dot(v1);
          let nv2 = normal.dot(v2);
          let sepvel = nv2-nv1;
          let impulse = (this.buffer.getBounceVelocity(cpIdx)-sepvel)/this.buffer.getNormalEffect(cpIdx);
          impulse = FMath.max(impulse, -this.buffer.getNormalSum(cpIdx));
          rb1.applyImpulse(contactPoint.getPosA(), normal.scale(-impulse));
          rb2.applyImpulse(contactPoint.getPosB(), normal.scale(impulse));
          this.buffer.addNormalSum(cpIdx, impulse);
          nextit = nextit|(FMath.abs(impulse)>this.configuration.getImpulseError());
        }
      }
      for (let joint of island.getJoints()) {
        let jointRes = joint.solveVelocities(this.configuration, i);
        nextit = nextit|jointRes;
      }
      if (!nextit) {
        normalPassed = true;
      }
    }
  }

  prapareBuffers(contacts) {
    let cidx = -1;
    for (let contact of contacts) {
      let col1 = contact.getColliderA();
      let rb1 = contact.getRigidBodyA();
      let col2 = contact.getColliderB();
      let rb2 = contact.getRigidBodyB();
      for (let contactPoint of contact.getContactPoints()) {
        cidx = cidx+1;
        let v1 = rb1.getPointVelocity(contactPoint.getPosA());
        let v2 = rb2.getPointVelocity(contactPoint.getPosB());
        let nv1 = contactPoint.getNormal().dot(v1);
        let nv2 = contactPoint.getNormal().dot(v2);
        let sepvel = nv2-nv1;
        let depth = contactPoint.getDepth();
        if (sepvel>-this.configuration.getVelError()&&depth<this.configuration.getPosError()) {
          this.buffer.setBounceVelocity(cidx, 0);
        }
        else {
          let bounceVel = 0;
          if (sepvel<-this.configuration.getContactBounceVel()) {
            bounceVel = -sepvel*col1.getMaterial().getBounce(col2.getMaterial());
          }
          if (depth>this.configuration.getContactBaumgarteDepth()) {
            bounceVel = bounceVel+this.configuration.getContactBaumgarte()*depth/this.configuration.getTimeStep();
          }
          this.buffer.setBounceVelocity(cidx, FMath.max(0, bounceVel));
        }
        let normal = contactPoint.getNormal();
        let uinef1 = rb1.getImpulseEffectOnPoint(contactPoint.getPosA(), normal, contactPoint.getPosA());
        let uinef2 = rb2.getImpulseEffectOnPoint(contactPoint.getPosB(), normal, contactPoint.getPosB());
        let uinefnorm1 = normal.dot(uinef1);
        let uinefnorm2 = normal.dot(uinef2);
        this.buffer.setNormalEffect(cidx, uinefnorm1+uinefnorm2);
        let relVel = v1.sub(v2);
        let tgRelVel = relVel.sub(normal.scale(relVel.dot(normal)));
        if (tgRelVel.mag()<this.configuration.getVelError()) {
          this.buffer.setFrictionCoefficient(cidx, col1.getMaterial().getStaticFriction(col2.getMaterial()));
        }
        else {
          this.buffer.setFrictionCoefficient(cidx, col1.getMaterial().getDynamicFriction(col2.getMaterial()));
        }
      }
    }
  }

  static maxTgMag(currSum, tgDir, maxMag) {
    let k = maxMag*maxMag;
    let a = tgDir.dot(tgDir);
    let b = 2*currSum.dot(tgDir);
    let c = currSum.dot(currSum)-k;
    let d = b*b-4*a*c;
    if (d<0) {
      return 0;
    }
    let res = (FMath.sqrt(d)-b)/2;
    return FMath.max(0, res);
  }

  toString() {
  }

  static create(timeStep) {
    let res = new SequentialSolver();
    res.configuration = SolverConfiguration.create(timeStep);
    res.guardInvariants();
    return res;
  }

}
classRegistry.SequentialSolver = SequentialSolver;
class ModelAabbs {
  constructor() {
  }

  getClass() {
    return "ModelAabbs";
  }

  static ensureModelAabbs(assets) {
    let modelsIds = assets.getKeys(ModelId.TYPE);
    for (let refId of modelsIds) {
      let modelId = refId;
      if (!assets.hasCompanion(modelId, AssetCompanionType.BOUNDING_AABB)) {
        let modelAabb = ModelAabbs.calculateModelAabb(modelId, assets);
        if (modelAabb!=null) {
          assets.putCompanion(modelId, AssetCompanionType.BOUNDING_AABB, modelAabb);
        }
      }
    }
  }

  static calculateModelAabb(modelId, assets) {
    let model = assets.get("Model", modelId);
    if (model.getParts().isEmpty()) {
      return null;
    }
    let res = null;
    for (let part of model.getParts()) {
      let meshId = part.getMesh();
      let meshAabb = assets.getCompanion("Aabb3", meshId, AssetCompanionType.BOUNDING_AABB);
      if (res==null) {
        res = meshAabb;
      }
      else {
        res = res.expand(meshAabb);
      }
    }
    return res;
  }

}
classRegistry.ModelAabbs = ModelAabbs;
class InputCache {
  buffer = new HashMap();
  lock = new Object();
  constructor() {
  }

  getClass() {
    return "InputCache";
  }

  guardInvariants() {
  }

  getBoolean(key, def) {
    if (!this.buffer.containsKey(key)) {
      return def;
    }
    return this.buffer.get(key);
  }

  getFloat(key, def) {
    if (!this.buffer.containsKey(key)) {
      return def;
    }
    return this.buffer.get(key);
  }

  getVec2(key, def) {
    if (!this.buffer.containsKey(key)) {
      return def;
    }
    return this.buffer.get(key);
  }

  getSize2(key, def) {
    if (!this.buffer.containsKey(key)) {
      return def;
    }
    return this.buffer.get(key);
  }

  put(key, object) {
    this.buffer.put(key, object);
  }

  remove(key) {
    this.buffer.remove(key);
  }

  clear() {
    this.buffer.clear();
  }

  toString() {
  }

  static create() {
    let res = new InputCache();
    res.guardInvariants();
    return res;
  }

}
classRegistry.InputCache = InputCache;
class InputCacheDisplayListener {
  static DEFAULT_KEY = "display.size";
  inputs;
  key;
  constructor() {
  }

  getClass() {
    return "InputCacheDisplayListener";
  }

  guardInvariants() {
  }

  onDisplayResize(size) {
    this.inputs.put(this.key, size);
  }

  static create(inputs) {
    let res = new InputCacheDisplayListener();
    res.inputs = inputs;
    res.key = InputCacheDisplayListener.DEFAULT_KEY;
    res.guardInvariants();
    return res;
  }

}
classRegistry.InputCacheDisplayListener = InputCacheDisplayListener;
class World {
  getClass() {
    return "World";
  }

  actors() {
  }

  constructActor(request) {
  }

  collisions() {
  }

  audio() {
  }

  assets() {
  }

}
classRegistry.World = World;
class RigidBodyWorld extends World {
  static FWD = Vec3.create(0, 0, -1);
  static UP = Vec3.create(0, 1, 0);
  static AMBIENT_LIGHTS = Dut.immutableList(Light.directional(LightColor.AMBIENT_WHITE, Vec3.DOWN));
  assetManager;
  gDriver;
  audioMixer;
  actorTree;
  actorFactory;
  collisionManager;
  contacts = Collections.emptyList();
  joints = Collections.emptyList();
  solver;
  timeStep;
  shadowBuffersIds;
  cumDt = 0;
  constructor() {
    super();
  }

  getClass() {
    return "RigidBodyWorld";
  }

  guardInvariants() {
  }

  destroy(drivers) {
    for (let id of this.shadowBuffersIds) {
      this.assetManager.remove(id);
    }
    this.shadowBuffersIds = null;
  }

  move(dt, inputs) {
    this.cumDt = this.cumDt+dt;
    while (this.cumDt>this.timeStep) {
      this.actorTree.forEach(ActorId.ROOT, ActorActions.move(this.timeStep, inputs));
      RigidBodies.integerateAndClearAccums(this.timeStep, this.actorTree);
      this.contacts = this.collisionManager.getAllContacts();
      let solvableContacts = new ArrayList();
      for (let contact of this.contacts) {
        if (!contact.getColliderA().isTrigger()&&!contact.getColliderB().isTrigger()) {
          solvableContacts.add(contact);
        }
      }
      this.joints = RigidBodies.getJoints(this.actorTree);
      if (!solvableContacts.isEmpty()||!this.joints.isEmpty()) {
        this.solver.solve(solvableContacts, this.joints);
      }
      this.actorTree.forEach(ActorId.ROOT, ActorActions.lateMove(this.timeStep, inputs));
      this.cumDt = this.cumDt-this.timeStep;
    }
  }

  render(request) {
    let cameras = this.getCameras(this.actorTree);
    let models = this.getRenderables(this.actorTree);
    let skyboxes = this.getSkyboxes(this.actorTree);
    for (let cidx = 0; cidx<cameras.size(); ++cidx) {
      this.gDriver.clearBuffers(BufferId.DEPTH);
      let camera = cameras.get(cidx).getCamera();
      let skyboxCamera = cameras.get(cidx).getSkyboxCamera();
      let lights = this.getLights(camera, models, this.actorTree);
      let shadowlessLights = this.getShadowlessLights(lights);
      for (let lidx = 0; lidx<lights.size(); ++lidx) {
        let light = lights.get(lidx);
        if (light.isShadow()) {
          let rndr = this.gDriver.startRenderer("ShadowMapRenderer", ShadowMapEnvironment.create(light));
          for (let r of models) {
            if (r.isCastShadows()) {
              rndr.render(r.getModel(), r.getInterpolation(), r.getGlobalMat());
            }
          }
          rndr.end();
        }
      }
      if (!skyboxes.isEmpty()) {
        this.gDriver.clearBuffers(BufferId.DEPTH);
        let scn = null;
        scn = this.gDriver.startRenderer("SceneRenderer", SceneEnvironment.create(skyboxCamera, RigidBodyWorld.AMBIENT_LIGHTS));
        for (let sb of skyboxes) {
          if (sb.isVisible()) {
            scn.render(sb.getModel(), Interpolation.ZERO, sb.getGlobalMat());
          }
        }
        scn.end();
      }
      this.gDriver.clearBuffers(BufferId.DEPTH);
      let scn = null;
      scn = this.gDriver.startRenderer("SceneRenderer", SceneEnvironment.create(camera, lights));
      for (let r of models) {
        if (r.isVisible()&&r.isReceiveShadows()) {
          scn.render(r.getModel(), r.getInterpolation(), r.getGlobalMat());
        }
      }
      scn.end();
      scn = this.gDriver.startRenderer("SceneRenderer", SceneEnvironment.create(camera, shadowlessLights));
      for (let r of models) {
        if (r.isVisible()&&!r.isReceiveShadows()) {
          scn.render(r.getModel(), r.getInterpolation(), r.getGlobalMat());
        }
      }
      scn.end();
      if (request.isDebugEnabled()) {
        DebugRendering.renderDebug(this.gDriver, request, camera, this.collisionManager, this.actorTree, this.contacts);
      }
    }
  }

  actors() {
    return this.actorTree;
  }

  constructActor(request) {
    return this.actorFactory.construct(request);
  }

  collisions() {
    return this.collisionManager;
  }

  audio() {
    return this.audioMixer;
  }

  assets() {
    return this.assetManager;
  }

  setCollisionLayerMatrix(matrix) {
    this.collisionManager.setLayerMatrix(matrix);
    return this;
  }

  getCameras(actors) {
    let res = new ArrayList();
    actors.forEach(ActorId.ROOT, (actor) => {
  if (!actor.hasComponent("CameraComponent")) {
    return ;
  }
  let cc = actor.getComponent("CameraComponent");
  res.add(cc);
});
    return res;
  }

  getLights(camera, models, actors) {
    let sbidx = new ArrayList();
    sbidx.add(0);
    let res = new ArrayList();
    actors.forEach(ActorId.ROOT, (actor) => {
  let cmps = actor.getComponents();
  for (let i = 0; i<cmps.size(); ++i) {
    let cmp = cmps.get(i);
    if (cmp instanceof LightComponent) {
      let lcmp = cmp;
      if (!lcmp.isEnabled()) {
        continue;
      }
      if (lcmp.getType().equals(LightType.DIRECTIONAL)) {
        let tc = actor.getComponent("TransformComponent");
        let pos = tc.toGlobal(Vec3.ZERO);
        let lookAt = tc.toGlobal(RigidBodyWorld.FWD);
        let dir = lookAt.subAndNormalize(pos);
        if (lcmp.isShadow()) {
          let sb = this.shadowBuffersIds.get(sbidx.get(0));
          sbidx.set(0, sbidx.get(0)+1);
          let smap = ShadowMap.createDir(sb, pos, dir, 80, 60);
          let light = Light.directional(lcmp.getColor(), dir, smap);
          res.add(light);
        }
        else {
          let light = Light.directional(lcmp.getColor(), dir);
          res.add(light);
        }
      }
      else {
        throw new Error("unsupported light type: "+lcmp.getType());
      }
    }
  }
});
    return res;
  }

  getShadowlessLights(lights) {
    let res = new ArrayList();
    for (let i = 0; i<lights.size(); ++i) {
      let light = lights.get(i);
      if (light.isShadow()) {
        res.add(light.withShadowMap(null));
      }
      else {
        res.add(light);
      }
    }
    return res;
  }

  getRenderables(actors) {
    let res = new ArrayList();
    actors.forEach(ActorId.ROOT, (actor) => {
  let cmps = actor.getComponents();
  for (let i = 0; i<cmps.size(); ++i) {
    let cmp = cmps.get(i);
    if (cmp instanceof ModelComponent) {
      res.add(cmp);
    }
  }
});
    return res;
  }

  getSkyboxes(actors) {
    let res = new ArrayList();
    actors.forEach(ActorId.ROOT, (actor) => {
  let cmps = actor.getComponents();
  for (let i = 0; i<cmps.size(); ++i) {
    let cmp = cmps.get(i);
    if (cmp instanceof SkyboxComponent) {
      res.add(cmp);
    }
  }
});
    return res;
  }

  static create(drivers) {
    let res = new RigidBodyWorld();
    res.assetManager = drivers.getDriver("AssetManager");
    res.collisionManager = BroadphaseCollisionManager.create(0.005);
    res.actorTree = QueuedActorTree.create(InMemoryActorTree.crete(res, res.collisionManager));
    res.actorFactory = RigidBodyWorldActorFactory.create(res.actorTree, SequenceIdGenerator.create());
    res.timeStep = 0.02;
    res.solver = SequentialSolver.create(res.timeStep);
    res.gDriver = drivers.getDriver("GraphicsDriver");
    res.audioMixer = drivers.getDriver("AudioDriver").getMixer();
    let shadow1 = ShadowBufferId.of("physicsWorld.shadow1");
    let shadow2 = ShadowBufferId.of("physicsWorld.shadow2");
    let shadow3 = ShadowBufferId.of("physicsWorld.shadow3");
    res.assetManager.put(shadow1, ShadowBuffer.create(2048, 2048));
    res.assetManager.put(shadow2, ShadowBuffer.create(2048, 2048));
    res.assetManager.put(shadow3, ShadowBuffer.create(2048, 2048));
    res.shadowBuffersIds = Dut.immutableList(shadow1, shadow2, shadow3);
    ModelAabbs.ensureModelAabbs(res.assetManager);
    res.guardInvariants();
    return res;
  }

}
classRegistry.RigidBodyWorld = RigidBodyWorld;
class RigidBodyWorldActorFactory {
  actors;
  idGenerator;
  constructor() {
  }

  getClass() {
    return "RigidBodyWorldActorFactory";
  }

  guardInvariants() {
  }

  construct(request) {
    return this.constructRoot(request.getPrefab(), request.getPos(), request.getRot(), request.getActorId());
  }

  constructRoot(prefab, pos, rot, rootId) {
    let id = rootId==null?ActorId.of(this.idGenerator.generateId()):rootId;
    let actor = Actor.create(id).setName(prefab.getName()).addTags(prefab.getTags());
    for (let cp of prefab.getComponents()) {
      actor.addComponent(cp.toComponent());
    }
    if (actor.hasComponent("TransformComponent")) {
      this.applyTransform(actor.getComponent("TransformComponent"), pos, rot);
    }
    this.actors.add(ActorId.ROOT, actor);
    for (let child of prefab.getChildren()) {
      this.constructActor(id, child, pos, rot);
    }
    return actor;
  }

  constructActor(parentId, prefab, pos, rot) {
    let id = ActorId.of(this.idGenerator.generateId());
    let actor = Actor.create(id).setName(prefab.getName()).addTags(prefab.getTags());
    for (let cp of prefab.getComponents()) {
      actor.addComponent(cp.toComponent());
    }
    if (actor.hasEffect(ComponentEffect.ABSOLUTE_COORDINATES)) {
      this.applyTransform(actor.getComponent("TransformComponent"), pos, rot);
    }
    this.actors.add(parentId, actor);
    for (let child of prefab.getChildren()) {
      this.constructActor(id, child, pos, rot);
    }
  }

  applyTransform(tc, pos, rot) {
    let lprot = rot.rotate(tc.getPos());
    tc.setPos(lprot.add(pos));
    tc.setRot(rot.mul(tc.getRot()));
  }

  toString() {
  }

  static create(actors, idGenerator) {
    let res = new RigidBodyWorldActorFactory();
    res.actors = actors;
    res.idGenerator = idGenerator;
    res.guardInvariants();
    return res;
  }

}
classRegistry.RigidBodyWorldActorFactory = RigidBodyWorldActorFactory;
const createDebugRenderRealm = (description) => {
  const symbol = Symbol(description);
  return {
    symbol: symbol,
    name() {
      return this.symbol.description;
    },
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
const DebugRenderRealm = Object.freeze({
  BOUNDING_VOLUME: createDebugRenderRealm("BOUNDING_VOLUME"),
  SPACE_PARTITIONING: createDebugRenderRealm("SPACE_PARTITIONING"),
  COLLIDER: createDebugRenderRealm("COLLIDER"),
  CONTACT_POINT: createDebugRenderRealm("CONTACT_POINT"),
  JOINT: createDebugRenderRealm("JOINT"),

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
class RenderRequest {
  static NORMAL = RenderRequest.create(Collections.emptySet());
  static DEBUG_LIGHT = RenderRequest.create(Dut.set(DebugRenderRealm.BOUNDING_VOLUME, DebugRenderRealm.COLLIDER));
  static DEBUG_JOINT = RenderRequest.create(Dut.set(DebugRenderRealm.JOINT));
  static DEBUG_FULL = RenderRequest.create(Dut.set(DebugRenderRealm.BOUNDING_VOLUME, DebugRenderRealm.SPACE_PARTITIONING, DebugRenderRealm.COLLIDER, DebugRenderRealm.CONTACT_POINT, DebugRenderRealm.JOINT));
  debugRenderRealms;
  constructor() {
  }

  getClass() {
    return "RenderRequest";
  }

  guardInvariants() {
  }

  isDebugEnabled() {
    return !this.debugRenderRealms.isEmpty();
  }

  hasDebugRenderRealm(realm) {
    return this.debugRenderRealms.contains(realm);
  }

  hashCode() {
    return Dut.reflectionHashCode(this);
  }

  equals(obj) {
    return Dut.reflectionEquals(this, obj);
  }

  toString() {
  }

  static create(debugRenderRealms) {
    let res = new RenderRequest();
    res.debugRenderRealms = Dut.copyImmutableSet(debugRenderRealms);
    res.guardInvariants();
    return res;
  }

}
classRegistry.RenderRequest = RenderRequest;
class SceneId extends RefId {
  static TYPE = RefIdType.of("SCENE_ID");
  mId;
  constructor() {
    super();
  }

  getClass() {
    return "SceneId";
  }

  guardInvariants() {
  }

  type() {
    return SceneId.TYPE;
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
    if (!(obj instanceof SceneId)) {
      return false;
    }
    let other = obj;
    return other.mId.equals(this.mId);
  }

  toString() {
  }

  static of(id) {
    let res = new SceneId();
    res.mId = id;
    res.guardInvariants();
    return res;
  }

}
classRegistry.SceneId = SceneId;
class SceneObject {
  name;
  prefabId;
  actorId;
  pos;
  rot;
  constructor() {
  }

  getClass() {
    return "SceneObject";
  }

  guardInvariants() {
  }

  getName() {
    return this.name;
  }

  getPrefabId() {
    return this.prefabId;
  }

  getActorId() {
    return this.actorId;
  }

  getPos() {
    return this.pos;
  }

  getRot() {
    return this.rot;
  }

  withName(name) {
    let res = new SceneObject();
    res.name = name;
    res.prefabId = this.prefabId;
    res.actorId = this.actorId;
    res.pos = this.pos;
    res.rot = this.rot;
    res.guardInvariants();
    return res;
  }

  withPrefabId(prefabId) {
    let res = new SceneObject();
    res.name = this.name;
    res.prefabId = prefabId;
    res.actorId = this.actorId;
    res.pos = this.pos;
    res.rot = this.rot;
    res.guardInvariants();
    return res;
  }

  withActorId(actorId) {
    let res = new SceneObject();
    res.name = this.name;
    res.prefabId = this.prefabId;
    res.actorId = actorId;
    res.pos = this.pos;
    res.rot = this.rot;
    res.guardInvariants();
    return res;
  }

  withPos(pos) {
    let res = new SceneObject();
    res.name = this.name;
    res.prefabId = this.prefabId;
    res.actorId = this.actorId;
    res.pos = pos;
    res.rot = this.rot;
    res.guardInvariants();
    return res;
  }

  withRot(rot) {
    let res = new SceneObject();
    res.name = this.name;
    res.prefabId = this.prefabId;
    res.actorId = this.actorId;
    res.pos = this.pos;
    res.rot = rot;
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

  static create(name, prefabId) {
    let res = new SceneObject();
    res.name = name;
    res.prefabId = prefabId;
    res.actorId = null;
    res.pos = Vec3.ZERO;
    res.rot = Quaternion.ZERO_ROT;
    res.guardInvariants();
    return res;
  }

}
classRegistry.SceneObject = SceneObject;
class Scene {
  name;
  objects;
  constructor() {
  }

  getClass() {
    return "Scene";
  }

  guardInvariants() {
  }

  getName() {
    return this.name;
  }

  getObjects() {
    return this.objects;
  }

  withName(name) {
    let res = new Scene();
    res.name = name;
    res.objects = this.objects;
    res.guardInvariants();
    return res;
  }

  withObjects(objs) {
    let res = new Scene();
    res.name = this.name;
    res.objects = Dut.copyImmutableList(objs);
    res.guardInvariants();
    return res;
  }

  withAddedObject(obj) {
    let res = new Scene();
    res.name = this.name;
    res.objects = new ArrayList();
    res.objects.addAll(this.objects);
    res.objects.add(obj);
    res.objects = Collections.unmodifiableList(res.objects);
    res.guardInvariants();
    return res;
  }

  withUpdatedObject(idx, obj) {
    let res = new Scene();
    res.name = this.name;
    res.objects = new ArrayList();
    for (let i = 0; i<this.objects.size(); ++i) {
      res.objects.add(i==idx?obj:this.objects.get(i));
    }
    res.objects = Collections.unmodifiableList(res.objects);
    res.guardInvariants();
    return res;
  }

  withRemovedObject(idx) {
    let res = new Scene();
    res.name = this.name;
    res.objects = new ArrayList();
    for (let i = 0; i<this.objects.size(); ++i) {
      if (i!=idx) {
        res.objects.add(this.objects.get(i));
      }
    }
    res.objects = Collections.unmodifiableList(res.objects);
    res.guardInvariants();
    return res;
  }

  emptyWorld(world) {
    let actors = world.actors();
    let root = actors.root();
    for (let actor of actors.children(root.getId())) {
      world.actors().remove(actor.getId());
    }
    for (let component of actors.root().getComponents()) {
      root.removeComponent(component);
    }
    return this;
  }

  loadToWorld(world, assets) {
    for (let so of this.objects) {
      let prefab = assets.get("ActorPrefab", so.getPrefabId());
      world.constructActor(CreateActorRequest.create(prefab, so.getActorId(), so.getPos(), so.getRot()));
    }
    return this;
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
    if (arguments.length===2&& typeof arguments[0]==="string"&&arguments[1] instanceof ArrayList) {
      return Scene.create_2_string_List(arguments[0], arguments[1]);
    }
    else if (arguments.length===1&& typeof arguments[0]==="string") {
      return Scene.create_1_string(arguments[0]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static create_2_string_List(name, objects) {
    let res = new Scene();
    res.name = name;
    res.objects = Dut.copyImmutableList(objects);
    res.guardInvariants();
    return res;
  }

  static create_1_string(name) {
    return Scene.create(name, Collections.emptyList());
  }

}
classRegistry.Scene = Scene;


// -------------------------------------
// Transslates app specific code
// -------------------------------------

class GamePad extends UiComponent {
  leftJoystick;
  rightJoystick;
  constructor() {
    super();
  }

  getClass() {
    return "GamePad";
  }

  guardInvariants() {
  }

  getLeftDir() {
    return this.leftJoystick.getDir();
  }

  getRightDir() {
    return this.rightJoystick.getDir();
  }

  move(dt) {
    this.leftJoystick.move(dt);
    this.rightJoystick.move(dt);
  }

  draw(painter) {
    this.leftJoystick.draw(painter);
    this.rightJoystick.draw(painter);
  }

  onContainerResize(size) {
    this.leftJoystick.onContainerResize(size);
    this.rightJoystick.onContainerResize(size);
  }

  onTouchStart(id, pos, size) {
    this.leftJoystick.onTouchStart(id, pos, size);
    this.rightJoystick.onTouchStart(id, pos, size);
    return false;
  }

  onTouchMove(id, pos, size) {
    this.leftJoystick.onTouchMove(id, pos, size);
    this.rightJoystick.onTouchMove(id, pos, size);
    return false;
  }

  onTouchEnd(id, pos, size, cancel) {
    this.leftJoystick.onTouchEnd(id, pos, size, cancel);
    this.rightJoystick.onTouchEnd(id, pos, size, cancel);
    return false;
  }

  onKeyPressed(key) {
    this.leftJoystick.onKeyPressed(key);
    this.rightJoystick.onKeyPressed(key);
    return false;
  }

  onKeyReleased(key) {
    this.leftJoystick.onKeyReleased(key);
    this.rightJoystick.onKeyReleased(key);
    return false;
  }

  toString() {
  }

  static create(drivers) {
    Guard.beTrue(drivers.isDriverAvailable("TouchDriver"), "keybboard driver is not available");
    let res = new GamePad();
    res.leftJoystick = Joystick.create().setBaseTexture("shadedDark11").setTopTexture("shadedDark01").setRegionFnc(UiRegionFncs.landscapePortrait(UiRegionFncs.leftBottom(25, 125, 100, 100), UiRegionFncs.leftBottom(10, 125, 80, 80))).setKeyCodeMatchers(KeyCodeMatchers.upperKey("W"), KeyCodeMatchers.upperKey("S"), KeyCodeMatchers.upperKey("A"), KeyCodeMatchers.upperKey("D"));
    res.rightJoystick = Joystick.create().setBaseTexture("shadedDark11").setTopTexture("shadedDark01").setRegionFnc(UiRegionFncs.landscapePortrait(UiRegionFncs.rightBottom(125, 125, 100, 100), UiRegionFncs.rightBottom(90, 125, 80, 80))).setKeyCodeMatchers(KeyCodeMatchers.upperKey("I"), KeyCodeMatchers.upperKey("K"), KeyCodeMatchers.upperKey("J"), KeyCodeMatchers.upperKey("L"));
    res.guardInvariants();
    return res;
  }

}
classRegistry.GamePad = GamePad;
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
      throw new Error("ambiguous overload");
    }
  }

  static rgbBox_4_Rgb_Rgb_Rgb_Rgb(c1, c2, c3, c4) {
    let res = UnpackedMesh.singleFrame(UnpackedMeshFrame.create(Dut.immutableList(VertexAttr.POS3, VertexAttr.RGB), Dut.list(Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b()), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b()), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b()), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b()), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b()), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b()), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b()), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b()), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b()), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b()), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b()), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b()), Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b()), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b()), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b()), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b()), Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b()), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b()), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b()), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b()), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b()), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b()), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b()), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b()))), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23))).toMesh();
    return res;
  }

  static rgbBox_3_number_number_number(r, g, b) {
    let res = UnpackedMesh.singleFrame(UnpackedMeshFrame.create(Dut.immutableList(VertexAttr.POS3, VertexAttr.RGB), Dut.list(Vertex.create(-0.5, -0.5, 0.5, r, g, b), Vertex.create(-0.5, -0.5, -0.5, r, g, b), Vertex.create(0.5, -0.5, -0.5, r, g, b), Vertex.create(0.5, -0.5, 0.5, r, g, b), Vertex.create(-0.5, 0.5, 0.5, r, g, b), Vertex.create(0.5, 0.5, 0.5, r, g, b), Vertex.create(0.5, 0.5, -0.5, r, g, b), Vertex.create(-0.5, 0.5, -0.5, r, g, b), Vertex.create(-0.5, -0.5, -0.5, r, g, b), Vertex.create(-0.5, 0.5, -0.5, r, g, b), Vertex.create(0.5, 0.5, -0.5, r, g, b), Vertex.create(0.5, -0.5, -0.5, r, g, b), Vertex.create(-0.5, -0.5, 0.5, r, g, b), Vertex.create(0.5, -0.5, 0.5, r, g, b), Vertex.create(0.5, 0.5, 0.5, r, g, b), Vertex.create(-0.5, 0.5, 0.5, r, g, b), Vertex.create(-0.5, -0.5, 0.5, r, g, b), Vertex.create(-0.5, 0.5, 0.5, r, g, b), Vertex.create(-0.5, 0.5, -0.5, r, g, b), Vertex.create(-0.5, -0.5, -0.5, r, g, b), Vertex.create(0.5, -0.5, 0.5, r, g, b), Vertex.create(0.5, -0.5, -0.5, r, g, b), Vertex.create(0.5, 0.5, -0.5, r, g, b), Vertex.create(0.5, 0.5, 0.5, r, g, b))), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23))).toMesh();
    return res;
  }

  static rgbaBox(c1, c2, c3, c4, a) {
    let res = UnpackedMesh.singleFrame(UnpackedMeshFrame.create(Dut.immutableList(VertexAttr.POS3, VertexAttr.RGBA), Dut.list(Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(-0.5, -0.5, 0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(-0.5, 0.5, 0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(-0.5, 0.5, -0.5, c2.r(), c2.g(), c2.b(), a), Vertex.create(-0.5, -0.5, -0.5, c1.r(), c1.g(), c1.b(), a), Vertex.create(0.5, -0.5, 0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(0.5, -0.5, -0.5, c4.r(), c4.g(), c4.b(), a), Vertex.create(0.5, 0.5, -0.5, c3.r(), c3.g(), c3.b(), a), Vertex.create(0.5, 0.5, 0.5, c4.r(), c4.g(), c4.b(), a))), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23))).toMesh();
    return res;
  }

  static fabricBox() {
    let res = UnpackedMesh.singleFrame(UnpackedMeshFrame.fabric(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, -1, 0), Vertex.create(-0.5, -0.5, -0.5, 0, -1, 0), Vertex.create(0.5, -0.5, -0.5, 0, -1, 0), Vertex.create(0.5, -0.5, 0.5, 0, -1, 0), Vertex.create(-0.5, 0.5, 0.5, 0, 1, 0), Vertex.create(0.5, 0.5, 0.5, 0, 1, 0), Vertex.create(0.5, 0.5, -0.5, 0, 1, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, -1), Vertex.create(-0.5, 0.5, -0.5, 0, 0, -1), Vertex.create(0.5, 0.5, -0.5, 0, 0, -1), Vertex.create(0.5, -0.5, -0.5, 0, 0, -1), Vertex.create(-0.5, -0.5, 0.5, 0, 0, 1), Vertex.create(0.5, -0.5, 0.5, 0, 0, 1), Vertex.create(0.5, 0.5, 0.5, 0, 0, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 0, 1), Vertex.create(-0.5, -0.5, 0.5, -1, 0, 0), Vertex.create(-0.5, 0.5, 0.5, -1, 0, 0), Vertex.create(-0.5, 0.5, -0.5, -1, 0, 0), Vertex.create(-0.5, -0.5, -0.5, -1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 1, 0, 0), Vertex.create(0.5, -0.5, -0.5, 1, 0, 0), Vertex.create(0.5, 0.5, -0.5, 1, 0, 0), Vertex.create(0.5, 0.5, 0.5, 1, 0, 0))), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23))).toMesh();
    return res;
  }

  static modelBox() {
    let res = UnpackedMesh.singleFrame(UnpackedMeshFrame.model(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, -1, 0, 0, 1), Vertex.create(-0.5, -0.5, -0.5, 0, -1, 0, 0, 0), Vertex.create(0.5, -0.5, -0.5, 0, -1, 0, 1, 0), Vertex.create(0.5, -0.5, 0.5, 0, -1, 0, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 1, 0, 0, 1), Vertex.create(0.5, 0.5, 0.5, 0, 1, 0, 1, 1), Vertex.create(0.5, 0.5, -0.5, 0, 1, 0, 1, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 1, 0, 0, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, -1, 0, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 0, -1, 0, 1), Vertex.create(0.5, 0.5, -0.5, 0, 0, -1, 1, 1), Vertex.create(0.5, -0.5, -0.5, 0, 0, -1, 1, 0), Vertex.create(-0.5, -0.5, 0.5, 0, 0, 1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 0, 0, 1, 1, 0), Vertex.create(0.5, 0.5, 0.5, 0, 0, 1, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 0, 1, 0, 1), Vertex.create(-0.5, -0.5, 0.5, -1, 0, 0, 0, 1), Vertex.create(-0.5, 0.5, 0.5, -1, 0, 0, 1, 1), Vertex.create(-0.5, 0.5, -0.5, -1, 0, 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, -1, 0, 0, 0, 0), Vertex.create(0.5, -0.5, 0.5, 1, 0, 0, 0, 1), Vertex.create(0.5, -0.5, -0.5, 1, 0, 0, 0, 0), Vertex.create(0.5, 0.5, -0.5, 1, 0, 0, 1, 0), Vertex.create(0.5, 0.5, 0.5, 1, 0, 0, 1, 1))), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23))).toMesh();
    return res;
  }

  static modelSkybox() {
    let res = UnpackedMesh.singleFrame(UnpackedMeshFrame.model(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, 1, 0, 0, 1), Vertex.create(-0.5, -0.5, -0.5, 0, 1, 0, 0, 0), Vertex.create(0.5, -0.5, -0.5, 0, 1, 0, 1, 0), Vertex.create(0.5, -0.5, 0.5, 0, 1, 0, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, -1, 0, 0, 1), Vertex.create(0.5, 0.5, 0.5, 0, -1, 0, 1, 1), Vertex.create(0.5, 0.5, -0.5, 0, -1, 0, 1, 0), Vertex.create(-0.5, 0.5, -0.5, 0, -1, 0, 0, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, 1, 0, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 0, 1, 0, 1), Vertex.create(0.5, 0.5, -0.5, 0, 0, 1, 1, 1), Vertex.create(0.5, -0.5, -0.5, 0, 0, 1, 1, 0), Vertex.create(-0.5, -0.5, 0.5, 0, 0, -1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 0, 0, -1, 1, 0), Vertex.create(0.5, 0.5, 0.5, 0, 0, -1, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 0, -1, 0, 1), Vertex.create(-0.5, -0.5, 0.5, 1, 0, 0, 0, 1), Vertex.create(-0.5, 0.5, 0.5, 1, 0, 0, 1, 1), Vertex.create(-0.5, 0.5, -0.5, 1, 0, 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, 1, 0, 0, 0, 0), Vertex.create(0.5, -0.5, 0.5, -1, 0, 0, 0, 1), Vertex.create(0.5, -0.5, -0.5, -1, 0, 0, 0, 0), Vertex.create(0.5, 0.5, -0.5, -1, 0, 0, 1, 0), Vertex.create(0.5, 0.5, 0.5, -1, 0, 0, 1, 1))), Dut.list(Face.triangle(0, 2, 1), Face.triangle(0, 3, 2), Face.triangle(4, 6, 5), Face.triangle(4, 7, 6), Face.triangle(8, 10, 9), Face.triangle(8, 11, 10), Face.triangle(12, 14, 13), Face.triangle(12, 15, 14), Face.triangle(16, 18, 17), Face.triangle(16, 19, 18), Face.triangle(20, 22, 21), Face.triangle(20, 23, 22))).toMesh();
    return res;
  }

  static modelBoxDeformed1() {
    let en = Vec2.create(1, -1).normalize();
    let res = UnpackedMesh.singleFrame(UnpackedMeshFrame.model(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, -1, 0, 0, 1), Vertex.create(-0.5, -0.5, -0.5, 0, -1, 0, 0, 0), Vertex.create(0.5, -0.5, -0.5, 0, -1, 0, 1, 0), Vertex.create(0.5, -0.5, 0.5, 0, -1, 0, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 1, 0, 0, 1), Vertex.create(1.0, 0.5, 0.5, 0, 1, 0, 1, 1), Vertex.create(1.0, 0.5, -0.5, 0, 1, 0, 1, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 1, 0, 0, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, -1, 0, 0), Vertex.create(-0.5, 0.5, -0.5, 0, 0, -1, 0, 1), Vertex.create(1.0, 0.5, -0.5, 0, 0, -1, 1, 1), Vertex.create(0.5, -0.5, -0.5, 0, 0, -1, 1, 0), Vertex.create(-0.5, -0.5, 0.5, 0, 0, 1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 0, 0, 1, 1, 0), Vertex.create(1.0, 0.5, 0.5, 0, 0, 1, 1, 1), Vertex.create(-0.5, 0.5, 0.5, 0, 0, 1, 0, 1), Vertex.create(-0.5, -0.5, 0.5, -1, 0, 0, 0, 1), Vertex.create(-0.5, 0.5, 0.5, -1, 0, 0, 1, 1), Vertex.create(-0.5, 0.5, -0.5, -1, 0, 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, -1, 0, 0, 0, 0), Vertex.create(0.5, -0.5, 0.5, en.x(), en.y(), 0, 0, 1), Vertex.create(0.5, -0.5, -0.5, en.x(), en.y(), 0, 0, 0), Vertex.create(1.0, 0.5, -0.5, en.x(), en.y(), 0, 1, 0), Vertex.create(1.0, 0.5, 0.5, en.x(), en.y(), 0, 1, 1))), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23))).toMesh();
    return res;
  }

  static modelBoxDeformed2() {
    let en = Vec2.create(-1, -1).normalize();
    let res = UnpackedMesh.singleFrame(UnpackedMeshFrame.model(Dut.list(Vertex.create(-0.5, -0.5, 0.5, 0, -1, 0, 0, 1), Vertex.create(-0.5, -0.5, -0.5, 0, -1, 0, 0, 0), Vertex.create(0.5, -0.5, -0.5, 0, -1, 0, 1, 0), Vertex.create(0.5, -0.5, 0.5, 0, -1, 0, 1, 1), Vertex.create(-1.0, 0.5, 0.5, 0, 1, 0, 0, 1), Vertex.create(0.5, 0.5, 0.5, 0, 1, 0, 1, 1), Vertex.create(0.5, 0.5, -0.5, 0, 1, 0, 1, 0), Vertex.create(-1.0, 0.5, -0.5, 0, 1, 0, 0, 0), Vertex.create(-0.5, -0.5, -0.5, 0, 0, -1, 0, 0), Vertex.create(-1.0, 0.5, -0.5, 0, 0, -1, 0, 1), Vertex.create(0.5, 0.5, -0.5, 0, 0, -1, 1, 1), Vertex.create(0.5, -0.5, -0.5, 0, 0, -1, 1, 0), Vertex.create(-0.5, -0.5, 0.5, 0, 0, 1, 0, 0), Vertex.create(0.5, -0.5, 0.5, 0, 0, 1, 1, 0), Vertex.create(0.5, 0.5, 0.5, 0, 0, 1, 1, 1), Vertex.create(-1.0, 0.5, 0.5, 0, 0, 1, 0, 1), Vertex.create(-0.5, -0.5, 0.5, en.x(), en.y(), 0, 0, 1), Vertex.create(-1.0, 0.5, 0.5, en.x(), en.y(), 0, 1, 1), Vertex.create(-1.0, 0.5, -0.5, en.x(), en.y(), 0, 1, 0), Vertex.create(-0.5, -0.5, -0.5, en.x(), en.y(), 0, 0, 0), Vertex.create(0.5, -0.5, 0.5, 1, 0, 0, 0, 1), Vertex.create(0.5, -0.5, -0.5, 1, 0, 0, 0, 0), Vertex.create(0.5, 0.5, -0.5, 1, 0, 0, 1, 0), Vertex.create(0.5, 0.5, 0.5, 1, 0, 0, 1, 1))), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3), Face.triangle(4, 5, 6), Face.triangle(4, 6, 7), Face.triangle(8, 9, 10), Face.triangle(8, 10, 11), Face.triangle(12, 13, 14), Face.triangle(12, 14, 15), Face.triangle(16, 17, 18), Face.triangle(16, 18, 19), Face.triangle(20, 21, 22), Face.triangle(20, 22, 23))).toMesh();
    return res;
  }

}
classRegistry.BoxMeshFactory = BoxMeshFactory;
class FreeCameraBehavior extends Behavior {
  moveDirInput = "moveDir";
  rotDirInput = "rotDir";
  moveSpeed = 3;
  rotSpeed = 1;
  constructor() {
    super();
  }

  getClass() {
    return "FreeCameraBehavior";
  }

  guardInvariants() {
  }

  move(dt, inputs) {
    let moveDir = inputs.getVec2(this.moveDirInput, Vec2.ZERO);
    let rotDir = inputs.getVec2(this.rotDirInput, Vec2.ZERO);
    let tc = this.actor().getComponent("TransformComponent");
    let rot = tc.getRot();
    if (!moveDir.equals(Vec2.ZERO)) {
      let fwd = rot.rotate(Vec3.create(0, 0, -1)).normalize().scale(moveDir.y()*this.moveSpeed*dt);
      let right = rot.rotate(Vec3.create(1, 0, 0)).normalize().scale(moveDir.x()*this.moveSpeed*dt);
      tc.move(fwd.add(right));
    }
    if (!rotDir.equals(Vec2.ZERO)) {
      let fwd = rot.rotate(Vec3.create(0, 0, -1)).normalize();
      let fwdxz = Vec2.create(fwd.x(), fwd.z()).normalize();
      let rotX = FMath.asin(fwd.y())+rotDir.y()*this.rotSpeed*dt;
      let rotY = (fwdxz.x()>=0?-FMath.acos(-fwdxz.y()):FMath.acos(-fwdxz.y()))-rotDir.x()*this.rotSpeed*dt;
      let rx = Quaternion.rot(1, 0, 0, rotX);
      let ry = Quaternion.rot(0, 1, 0, rotY);
      tc.setRot(ry.mul(rx));
    }
  }

  static create() {
    if (arguments.length===0) {
      return FreeCameraBehavior.create_0();
    }
    else if (arguments.length===4&& typeof arguments[0]==="string"&& typeof arguments[1]==="string"&& typeof arguments[2]==="number"&& typeof arguments[3]==="number") {
      return FreeCameraBehavior.create_4_string_string_number_number(arguments[0], arguments[1], arguments[2], arguments[3]);
    }
    else {
      throw new Error("ambiguous overload");
    }
  }

  static create_0() {
    let res = new FreeCameraBehavior();
    res.guardInvariants();
    return res;
  }

  static create_4_string_string_number_number(moveDirInput, rotDirInput, moveSpeed, rotSpeed) {
    let res = new FreeCameraBehavior();
    res.moveDirInput = moveDirInput;
    res.rotDirInput = rotDirInput;
    res.moveSpeed = moveSpeed;
    res.rotSpeed = rotSpeed;
    res.guardInvariants();
    return res;
  }

}
classRegistry.FreeCameraBehavior = FreeCameraBehavior;
class RigidBodyApp03 extends TyracornScreen {
  time = 0;
  world;
  inputs = InputCache.create();
  ui;
  gamePad;
  constructor() {
    super();
  }

  getClass() {
    return "RigidBodyApp03";
  }

  move(drivers, screenManager, dt) {
    this.time = this.time+dt;
    let gDriver = drivers.getDriver("GraphicsDriver");
    gDriver.clearBuffers(BufferId.COLOR, BufferId.DEPTH);
    this.inputs.put("moveDir", this.gamePad.getLeftDir());
    this.inputs.put("rotDir", this.gamePad.getRightDir());
    this.world.move(dt, this.inputs);
    this.world.render(RenderRequest.NORMAL);
    gDriver.clearBuffers(BufferId.DEPTH);
    let uiRenderer = gDriver.startRenderer("UiRenderer", UiEnvironment.DEFAULT);
    this.ui.move(dt);
    uiRenderer.render(this.ui);
    uiRenderer.end();
  }

  load(drivers, screenManager, properties) {
    let res = new ArrayList();
    let assets = drivers.getDriver("AssetManager");
    res.add(assets.resolveAsync(Path.of("asset:controls")));
    res.add(assets.resolveAsync(Path.of("asset:buttons")));
    res.add(assets.resolveAsync(Path.of("asset:fonts/rubik-regular-64.tap")));
    res.add(assets.resolveAsync(Path.of("asset:primitives")));
    return res;
  }

  init(drivers, screenManager, properties) {
    let assets = drivers.getDriver("AssetManager");
    Fonts.prepareScaledFonts(assets, Dut.set(20));
    assets.put(MaterialId.of("brass"), Material.BRASS);
    assets.put(MaterialId.of("copper"), Material.COPPER);
    assets.put(MeshId.of("modelBox"), BoxMeshFactory.modelBox());
    let groundModel = Model.simple(MeshId.of("modelBox"), MaterialId.of("brass"));
    let groundModelId = ModelId.of("ground");
    assets.put(groundModelId, groundModel);
    let sphereModelId = ModelId.of("sphere");
    let boxModelId = ModelId.of("box");
    let cylinderRoundModelId = ModelId.of("cylinder-round");
    let halfSphereModelId = ModelId.of("half-sphere");
    let boxModel = Model.simple(MeshId.of("modelBox"), MaterialId.of("copper"));
    assets.put(boxModelId, boxModel);
    const wallColMatId = PhysicalMaterialId.of("wall");
    assets.put(wallColMatId, PhysicalMaterial.simple(0.6, 1.8, 1.8));
    const objectColMatId = PhysicalMaterialId.of("object");
    assets.put(objectColMatId, PhysicalMaterial.create(0.6, PhysicalMaterialCombineType.AVG, 18, 18, PhysicalMaterialCombineType.MAX));
    this.world = RigidBodyWorld.create(drivers);
    let worldActor = Actor.create("world").setName("world").addComponent(WorldComponent.create().setGravity(Vec3.create(0, -9.81, 0)).setDrag(0.5).setAngularDrag(0.5).setBoundary(Aabb3.create(-30, -30, -30, 30, 30, 30)));
    this.world.actors().add(ActorId.ROOT, worldActor);
    let skybox = Actor.create("skybox").setName("skybox").addComponent(TransformComponent.create()).addComponent(SkyboxComponent.create().setModelId(ModelId.of("skybox-1")).setTransform(Mat44.scale(300, 300, 300))).addComponent(AutoRotateComponent.create().setAngularVelocity(Vec3.create(0, 0.1, 0)));
    this.world.actors().add(ActorId.ROOT, skybox);
    let ground = Actor.create("ground").setName("ground").addComponent(TransformComponent.create().move(Vec3.create(0, 0, 0))).addComponent(ModelComponent.create().setModelId(groundModelId).setTransform(Mat44.trans(0, -0.5, 0).mul(Mat44.scale(20, 1, 20)))).addComponent(RigidBodyComponent.create().setKinematic(true)).addComponent(ColliderComponent.create().setLayer(CollisionLayer.WALL).setShape(ColliderShape.BOX).setSize(Vec3.create(22, 2, 22)).setPos(Vec3.create(0, -1, 0)).setMaterialId(wallColMatId));
    this.world.actors().add(ActorId.ROOT, ground);
    let back = Actor.create("back").setName("back").addComponent(TransformComponent.create().move(Vec3.create(0, 0, -10))).addComponent(ModelComponent.create().setModelId(groundModelId).setTransform(Mat44.transofm(Vec3.create(0, 0, 0), Quaternion.rotX(FMath.PI/2)).mul(Mat44.scale(22, 1, 7)))).addComponent(RigidBodyComponent.create().setKinematic(true)).addComponent(ColliderComponent.create().setLayer(CollisionLayer.WALL).setShape(ColliderShape.BOX).setSize(Vec3.create(22, 7, 1)).setMaterialId(wallColMatId));
    this.world.actors().add(ActorId.ROOT, back);
    let front = Actor.create("front").setName("front").addComponent(TransformComponent.create().move(Vec3.create(0, 0, 10))).addComponent(ModelComponent.create().setModelId(groundModelId).setTransform(Mat44.transofm(Vec3.create(0, 0, 0), Quaternion.rotX(FMath.PI/2)).mul(Mat44.scale(22, 1, 7)))).addComponent(RigidBodyComponent.create().setKinematic(true)).addComponent(ColliderComponent.create().setLayer(CollisionLayer.WALL).setShape(ColliderShape.BOX).setSize(Vec3.create(22, 7, 1)).setMaterialId(wallColMatId));
    this.world.actors().add(ActorId.ROOT, front);
    let left = Actor.create("left").setName("left").addComponent(TransformComponent.create().move(Vec3.create(-10, 0, 0))).addComponent(ModelComponent.create().setModelId(groundModelId).setTransform(Mat44.transofm(Vec3.create(0, 0, 0), Quaternion.rotX(FMath.PI/2)).mul(Mat44.scale(1, 22, 7)))).addComponent(RigidBodyComponent.create().setKinematic(true)).addComponent(ColliderComponent.create().setLayer(CollisionLayer.WALL).setShape(ColliderShape.BOX).setSize(Vec3.create(1, 7, 22)).setMaterialId(wallColMatId));
    this.world.actors().add(ActorId.ROOT, left);
    let right = Actor.create("right").setName("right").addComponent(TransformComponent.create().move(Vec3.create(10, 0, 0))).addComponent(ModelComponent.create().setModelId(groundModelId).setTransform(Mat44.transofm(Vec3.create(0, 0, 0), Quaternion.rotX(FMath.PI/2)).mul(Mat44.scale(1, 22, 7)))).addComponent(RigidBodyComponent.create().setKinematic(true)).addComponent(ColliderComponent.create().setLayer(CollisionLayer.WALL).setShape(ColliderShape.BOX).setSize(Vec3.create(1, 7, 22)).setMaterialId(wallColMatId));
    this.world.actors().add(ActorId.ROOT, right);
    let light = Actor.create("light").setName("light").addComponent(TransformComponent.create().lookAt(Vec3.create(2, 5, 5), Vec3.create(0, 0, 0), Vec3.create(1, 0, 0))).addComponent(LightComponent.create().setType(LightType.DIRECTIONAL).setShadow(true).setAmbient(Rgb.gray(0.5)).setDiffuse(Rgb.gray(0.5)).setSpecular(Rgb.WHITE));
    this.world.actors().add(ActorId.ROOT, light);
    let camera = Actor.create("camera").setName("camera").addComponent(TransformComponent.create().lookAt(Vec3.create(0, 9, 15), Vec3.create(0.0, 0.0, 0.0), Vec3.create(0, 1, 0))).addComponent(CameraComponent.create().setPersp(FMath.toRadians(60), 1, 0.5, 100.0)).addComponent(FreeCameraBehavior.create("moveDir", "rotDir", 5, 1)).addComponent(CameraFovyComponent.create());
    this.world.actors().add(ActorId.ROOT, camera);
    this.ui = StretchUi.create(UiSizeFncs.landscapePortrait(UiSizeFncs.constantHeight(500), UiSizeFncs.constantWidth(300)));
    this.gamePad = GamePad.create(drivers);
    this.ui.addComponent(this.gamePad);
    let btnFont = FontId.of("rubik-regular-20");
    let addSphereAct = (evtSource) => {
      let r = Randoms.nextFloat(0.5, 1.5);
      let m = Randoms.nextFloat(1, 2);
      let sphere = Actor.create(Randoms.nextAlphabetic(32)).addComponent(TransformComponent.create().move(Vec3.create(0, 8, 0))).addComponent(RemoveOnOutspaceComponent.create()).addComponent(ModelComponent.create().setModelId(sphereModelId).setTransform(Mat44.scale(r))).addComponent(RigidBodyComponent.create().setKinematic(false).setMass(m).setVelocity(this.getRandomVelocity())).addComponent(ColliderComponent.create().setLayer(CollisionLayer.OBJECT).setShape(ColliderShape.SPHERE).setRadius(r).setMaterialId(objectColMatId));
      this.world.actors().add(ActorId.ROOT, sphere);
    };
    let sphereBtn = ImageButton.create().setUpTexture("button-120-up").setDownTexture("button-120-down").setRegionFnc(UiRegionFncs.leftTop(20, 20, 120, 30)).setText("Sphere").setFont(btnFont).addOnClickAction(addSphereAct);
    this.ui.addComponent(sphereBtn);
    let addBoxAct = (evtSource) => {
      let box = Actor.create(Randoms.nextAlphabetic(32)).addComponent(TransformComponent.create().move(Vec3.create(0, 8, 0))).addComponent(RemoveOnOutspaceComponent.create()).addComponent(ModelComponent.create().setModelId(boxModelId).setTransform(Mat44.scale(2, 2, 2))).addComponent(RigidBodyComponent.create().setKinematic(false).setMass(1).setVelocity(this.getRandomVelocity())).addComponent(ColliderComponent.create().setLayer(CollisionLayer.OBJECT).setShape(ColliderShape.BOX).setSize(Vec3.create(2, 2, 2)).setMaterialId(objectColMatId));
      this.world.actors().add(ActorId.ROOT, box);
    };
    let boxBtn = ImageButton.create().setUpTexture("button-120-up").setDownTexture("button-120-down").setRegionFnc(UiRegionFncs.leftTop(20, 70, 120, 30)).setText("Box").setFont(btnFont).addOnClickAction(addBoxAct);
    this.ui.addComponent(boxBtn);
    let addBoxStraightAct = (evtSource) => {
      let box = Actor.create(Randoms.nextAlphabetic(32)).addComponent(TransformComponent.create().move(Vec3.create(0, 12, 0))).addComponent(RemoveOnOutspaceComponent.create()).addComponent(ModelComponent.create().setModelId(boxModelId).setTransform(Mat44.scale(2, 2, 2))).addComponent(RigidBodyComponent.create().setKinematic(false).setMass(1)).addComponent(ColliderComponent.create().setLayer(CollisionLayer.OBJECT).setShape(ColliderShape.BOX).setSize(Vec3.create(2, 2, 2)).setMaterialId(objectColMatId));
      this.world.actors().add(ActorId.ROOT, box);
    };
    let boxStraightBtn = ImageButton.create().setUpTexture("button-120-up").setDownTexture("button-120-down").setRegionFnc(UiRegionFncs.leftTop(20, 120, 120, 30)).setText("Box Straight").setFont(btnFont).addOnClickAction(addBoxStraightAct);
    this.ui.addComponent(boxStraightBtn);
    let addCapsuleAct = (evtSource) => {
      let capsule = Actor.create(Randoms.nextAlphabetic(32)).addComponent(TransformComponent.create().move(Vec3.create(0, 8, 0))).addComponent(RemoveOnOutspaceComponent.create()).addComponent(ModelComponent.create().setModelId(cylinderRoundModelId).setTransform(Mat44.rotX(FMath.PI/2).mul(Mat44.scale(1, 1, 1)))).addComponent(ModelComponent.create().setModelId(halfSphereModelId).setTransform(Mat44.trans(0, 1, 0).mul(Mat44.rotX(FMath.PI/2)))).addComponent(ModelComponent.create().setModelId(halfSphereModelId).setTransform(Mat44.trans(0, -1, 0).mul(Mat44.rotX(-FMath.PI/2)))).addComponent(RigidBodyComponent.create().setKinematic(false).setMass(1).setVelocity(this.getRandomVelocity())).addComponent(ColliderComponent.create().setLayer(CollisionLayer.OBJECT).setShape(ColliderShape.CAPSULE).setRadius(1).setHeight(4).setMaterialId(objectColMatId));
      this.world.actors().add(ActorId.ROOT, capsule);
    };
    let capsuleBtn = ImageButton.create().setUpTexture("button-120-up").setDownTexture("button-120-down").setRegionFnc(UiRegionFncs.leftTop(20, 170, 120, 30)).setText("Capsule").setFont(btnFont).addOnClickAction(addCapsuleAct);
    this.ui.addComponent(capsuleBtn);
    if (drivers.getPlatform().isExitable()) {
      let exitBtn = ImageButton.create().setUpTexture("shadedDark35").setDownTexture("shadedLight35").setRegionFnc(UiRegionFncs.rightTop(25, 0, 25, 25)).addOnClickAction(UiEventActions.exitApp(screenManager));
      this.ui.addComponent(exitBtn);
    }
    this.ui.subscribe(drivers);
    let dlist = InputCacheDisplayListener.create(this.inputs);
    screenManager.addLeaveAction(UiActions.removeDisplayListener(drivers, dlist));
    drivers.getDriver("DisplayDriver").addDisplayistener(dlist);
  }

  leave(drivers) {
    this.ui.unsubscribe(drivers);
    this.world.destroy(drivers);
  }

  getRandomVelocity() {
    let vx = Randoms.nextFloat(0, 2)-1;
    let vy = Randoms.nextFloat(0, 2)-1;
    let vz = Randoms.nextFloat(0, 2)-1;
    return Vec3.create(vx, vy, vz);
  }

}
classRegistry.RigidBodyApp03 = RigidBodyApp03;


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
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchId = "" + touch.identifier;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        drivers.touchDriver.onTouchStart(touchId, x, y);
    }
}

/**
 * Handles touch move.
 * 
 * @param {TouchEvent} evt event
 */
function handleTouchMove(evt) {
    evt.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchId = "" + touch.identifier;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        drivers.touchDriver.onTouchMove(touchId, x, y);
    }
}

/**
 * Handles touch cancel.
 * 
 * @param {TouchEvent} evt event
 */
function handleTouchCancel(evt) {
    evt.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchId = "" + touch.identifier;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        drivers.touchDriver.onTouchEnd(touchId, x, y, true);
    }
}

/**
 * Handles touch move.
 * 
 * @param {TouchEvent} evt event
 */
function handleTouchEnd(evt) {
    evt.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touches = evt.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const touchId = "" + touch.identifier;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        drivers.touchDriver.onTouchEnd(touchId, x, y, false);
    }
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (evt.clientX - rect.left) * scaleX;
    const y = (evt.clientY - rect.top) * scaleY;
    drivers.touchDriver.onMouseDown(x, y);
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
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (evt.clientX - rect.left) * scaleX;
        const y = (evt.clientY - rect.top) * scaleY;
        drivers.touchDriver.onMouseDragged(x, y);
        mouseLastDragX = x;
        mouseLastDragY = y;
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
    drivers.touchDriver.onMouseDragged(mouseLastDragX, mouseLastDragY, true);
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (evt.clientX - rect.left) * scaleX;
    const y = (evt.clientY - rect.top) * scaleY;
    drivers.touchDriver.onMouseUp(x, y, false);
    mouseLastDragX = x;
    mouseLastDragY = y;
}

// must be defined after the KeyCode is defined (i.e. after the java ccode)
const keyCodeMap = {
    KeyA: KeyCode.create("A"),
    KeyB: KeyCode.create("B"),
    KeyC: KeyCode.create("C"),
    KeyD: KeyCode.create("D"),
    KeyE: KeyCode.create("E"),
    KeyF: KeyCode.create("F"),
    KeyG: KeyCode.create("G"),
    KeyH: KeyCode.create("H"),
    KeyI: KeyCode.create("I"),
    KeyJ: KeyCode.create("J"),
    KeyK: KeyCode.create("K"),
    KeyL: KeyCode.create("L"),
    KeyM: KeyCode.create("M"),
    KeyN: KeyCode.create("N"),
    KeyO: KeyCode.create("O"),
    KeyP: KeyCode.create("P"),
    KeyQ: KeyCode.create("Q"),
    KeyR: KeyCode.create("R"),
    KeyS: KeyCode.create("S"),
    KeyT: KeyCode.create("T"),
    KeyU: KeyCode.create("U"),
    KeyV: KeyCode.create("V"),
    KeyW: KeyCode.create("W"),
    KeyX: KeyCode.create("X"),
    KeyY: KeyCode.create("Y"),
    KeyZ: KeyCode.create("Z"),
    Digit0: KeyCode.create("0"),
    Digit1: KeyCode.create("1"),
    Digit2: KeyCode.create("2"),
    Digit3: KeyCode.create("3"),
    Digit4: KeyCode.create("4"),
    Digit5: KeyCode.create("5"),
    Digit6: KeyCode.create("6"),
    Digit7: KeyCode.create("7"),
    Digit8: KeyCode.create("8"),
    Digit9: KeyCode.create("9"),
    Enter: KeyCode.ENTER,
    Escape: KeyCode.ESCAPE,
    Backspace: KeyCode.BACKSPACE,
    ShiftLeft: KeyCode.SHIFT_LEFT,
    ShiftRight: KeyCode.SHIFT_RIGHT,
    ControlLeft: KeyCode.CONTROL_LEFT,
    ControlRight: KeyCode.CONTROL_RIGHT,
    AltLeft: KeyCode.ALT_LEFT,
    AltRight: KeyCode.ALT_RIGHT,
    Space: KeyCode.SPACE,
    Home: KeyCode.HOME,
    End: KeyCode.END,
    ArrowLeft: KeyCode.ARROW_LEFT,
    ArrowUp: KeyCode.ARROW_UP,
    ArrowRight: KeyCode.ARROW_RIGHT,
    ArrowDown: KeyCode.ARROW_DOWN,
};

/**
 * Handles key down.
 * 
 * @param {KeyEvent} evt event
 */
function handleKeyDown(evt) {
    const key = keyCodeMap[evt.code];
    if (key === null || key === undefined) {
        // key is not deined, so ignoring
        return;
    }
    drivers.keyboardDriver.onKeyPressed(key);
}

/**
 * Handles key up.
 * 
 * @param {KeyEvent} evt event
 */
function handleKeyUp(evt) {
    const key = keyCodeMap[evt.code];
    if (key === null || key === undefined) {
        // key is not deined, so ignoring
        return;
    }
    drivers.keyboardDriver.onKeyReleased(key);
}

/**
 * Handles document visibility change.
 * 
 * @returns {undefined}
 */
function handleVisibiliryChange() {
    if (document.hidden) {
        tyracornApp.pause(drivers);
    }
}

/**
 * Handles window blur event.
 * 
 * @returns {undefined}
 */
function handleBlur() {
    tyracornApp.pause(drivers);
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
    tyracornApp = TyracornScreenApp.create(BasicLoadingScreen.simple("asset:loading.png"), new RigidBodyApp03());

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchcancel", handleTouchCancel);
    canvas.addEventListener("touchend", handleTouchEnd);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener("visibilitychange", handleVisibiliryChange);
    window.addEventListener("blur", handleBlur);

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