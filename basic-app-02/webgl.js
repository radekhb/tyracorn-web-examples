"use strict";
// -------------------------------------
// Global variables
// -------------------------------------
let gl;
let tyracornApp;
let drivers;
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

String.prototype.equals = function (that) {
    return this === that;
};
String.prototype.hashCode = function() {
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
                entries.push({ key, value });
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
// -------------------------------------
// FMath
// -------------------------------------

class FMath {
    static PI = Math.PI;

    static min(a, b) {
        return Math.min(a, b);
    }

    static max(a, b) {
        return Math.max(a, b);
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
// -------------------------------------
// Dut
// -------------------------------------

class Dut {
    static list() {
        let res = new ArrayList();
        for (let arg = 0; arg < arguments.length; ++arg) {
            res.add(arguments[arg]);
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
        }
        else {
            throw "unknown collection: " + collection;
        }
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
    loadTexture(path) {
        // load data synchronously
        let url = path;
        if (path.startsWith("asset:")) {
            url = baseUrl + "/assets/" + path.substring(6);
        }
        new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = function () {
                console.log('ok');
                console.log(img.width + ' ' + img.height);
                console.log('ok2');
                try {
                    // Create a canvas element
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Set canvas dimensions to match image
                    canvas.width = img.width;
                    canvas.height = img.height;
                    console.log(img.width + ' ' + img.height);
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

                    // Return the result object
                    resolve({
                        width: img.width,
                        height: img.height,
                        format: format,
                        buf: buf
                    });

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
            console.log(url);
            img.src = url;
        }).then(result => {
            console.log('done')
        });

        /*
         const xhr = new XMLHttpRequest();
         xhr.open('GET', url, false); // false = synchronous
         xhr.send();
         
         if (xhr.status !== 200) {
         throw new Error(`Unable to load texture: ${xhr.status}`);
         }
         
         // now 
         const img = new Image();
         img.src = url;
         
         const startTime = Date.now();
         const timeout = 5000; // 5 second timeout
         
         while ((Date.now() - startTime) < timeout) {
         // Busy wait - this will block the main thread
         // In practice, browsers may still process other events
         }
         console.log(img.complete + ", " + img.width);
         
         if (!img.complete) {
         throw new Error('Image not loaded. Use the async version (loadImagePixelData) for remote images.');
         }
         
         // Create a canvas element
         const canvas = document.createElement('canvas');
         const ctx = canvas.getContext('2d');
         
         // Set canvas dimensions to match image
         canvas.width = img.width;
         canvas.height = img.height;
         
         // Draw image to canvas
         ctx.drawImage(img, 0, 0);
         console.log('ok');
         /*
         const arrayBuffer = xhr.response;
         
         if (!arrayBuffer) {
         throw new Error('No data received');
         }
         
         // Convert ArrayBuffer to base64
         const bytes = new Uint8Array(arrayBuffer);
         let binary = '';
         for (let i = 0; i < bytes.byteLength; i++) {
         binary += String.fromCharCode(bytes[i]);
         }
         const base64 = btoa(binary);
         
         //const responseText = xhr.responseText;
         // create and load an image
         const image = new Image();
         
         // Create a promise-like structure for synchronous image loading
         let imageLoaded = false;
         let imageError = null;
         
         image.onload = function () {
         imageLoaded = true;
         };
         
         image.onerror = function () {
         imageError = new Error(`Failed to load image: ${url}`);
         };
         
         // Assume it's base64 encoded image data
         const mimeType = this.getMimeTypeFromUrl(url);
         const imgsrc = `data:${mimeType};base64,${base64}`;
         console.log(imgsrc);
         //image.src = imgsrc;
         image.src = url;
         
         // Wait for image to load (this is a blocking operation)
         // Note: This is not truly synchronous in modern browsers due to security restrictions
         // but provides a synchronous-like interface
         const startTime = Date.now();
         const timeout = 5000; // 5 second timeout
         
         while (!imageLoaded && !imageError && (Date.now() - startTime) < timeout) {
         // Busy wait - this will block the main thread
         // In practice, browsers may still process other events
         }
         console.log(image.complete + ", " + image.width);
         
         if (imageError) {
         throw imageError;
         }
         
         if (!imageLoaded) {
         throw new Error(`Timeout loading texture: ${url}`);
         }
         
         // Extract pixel data using canvas
         const canvas = document.createElement('canvas');
         const ctx = canvas.getContext('2d');
         
         // Set canvas dimensions to match image
         canvas.width = image.width;
         canvas.height = image.height;
         
         // Draw image to canvas
         ctx.drawImage(image, 0, 0);
         
         // Get image data (RGBA format)
         const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
         const pixels = imageData.data; // Uint8ClampedArray with RGBA values
         
         // Detect format by checking if alpha channel has non-255 values
         let hasAlpha = false;
         for (let i = 3; i < pixels.length; i += 4) {
         if (pixels[i] !== 255) {
         hasAlpha = true;
         break;
         }
         }
         
         // Create buffer with appropriate format (converted to float 0.0-1.0)
         let buffer;
         let format;
         
         if (hasAlpha) {
         // Keep RGBA format, convert to float
         format = 'RGBA';
         buffer = new Float32Array(pixels.length);
         for (let i = 0; i < pixels.length; i++) {
         buffer[i] = pixels[i] / 255.0; // Convert from 0-255 to 0.0-1.0
         }
         } else {
         // Convert to RGB format (remove alpha channel), convert to float
         format = 'RGB';
         const rgbPixels = new Float32Array((pixels.length / 4) * 3);
         for (let i = 0, j = 0; i < pixels.length; i += 4, j += 3) {
         rgbPixels[j] = pixels[i] / 255.0;     // R
         rgbPixels[j + 1] = pixels[i + 1] / 255.0; // G
         rgbPixels[j + 2] = pixels[i + 2] / 255.0; // B
         // Skip alpha channel (i + 3)
         }
         buffer = rgbPixels;
         }
         
         if (format === "RGB") {
         return Texture.rgbPixels(image.width, image.height, Array.from(buffer));
         } else if (format === "RGBA") {
         return Texture.rgbaPixels(image.width, image.height, Array.from(buffer));
         } else {
         throw "unknown texture format: " + format;
         }
         */
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
    setUniform(name, val) {
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
     */
    arraysEqual(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
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
 * Web GL Graphics Driver. This class manages shaders and renderes.
 * Assumes WebGL context 'gl' is available globally.
 */
class WebglGraphicsDriver {
    assetBank = null;
    screenViewport = null;
    shaders = [];
    renderers = new Map();
    meshes = new HashMap();
    textures = new HashMap();
    shadowBuffers = new HashMap();

    // Rectangle meshes for debugging and sprites
    debugRectMesh = null;
    spriteRectMesh = null;
    primitivesMesh = null;

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
        const colorShader = WebglShader.create(WebglUtils.loadShaderProgram(colorShaderVertexSource, colorShaderFragmentSource));

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
         const shadowmapShader = WebglShader.create(
         WebglUtils.loadShaderProgram(
         this.loader,
         "resource:shader/shadowmap-vertex.glsl",
         "resource:shader/shadowmap-fragment.glsl"
         )
         );
         */

        // TODO - uncomment other shaders
        this.shaders.push(colorShader); //, spriteShader, sceneShader, shadowmapShader);

        // Create renderers
        this.renderers.set("ColorRenderer", WebglColorRenderer.create(this, colorShader));
        // TODO - uncomment
        //this.renderers.set("WebGLSpriteRenderer"", WebGLSpriteRenderer.create(this, this.spriteRectMesh, spriteShader));
        // this.renderers.set("WebGLSceneRenderer", WebGLSceneRenderer.create(this, sceneShader));
        // this.renderers.set("WebGLShadowMapRenderer", WebGLShadowMapRenderer.create(this, shadowmapShader));
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
     * Pushes texture to graphics card.
     */
    pushTextureToGraphicCard(texture) {
        const textureId = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textureId);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload texture data
        if (texture.hasAlpha) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
        }

        return new GLTexturerRef(textureId, texture);
    }

    /**
     * Creates shadow buffer.
     */
    createShadowBuffer(width, height) {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // Create depth texture
        const depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Attach depth texture to framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

        // Check framebuffer status
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("Framebuffer is not complete");
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return new GLShadowBufferRef(framebuffer, depthTexture, width, height);
    }

    /**
     * Disposes mesh from graphics card.
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
        if (!this.renderers.has(rendererClass)) {
            throw new Error(`unsupported renderer class: ${rendererClass.name}`);
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
     */
    /**
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
    assetManager = DefaultAssetManager.create(this, this.assetLoader, this.assetBank);
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
        } else if (driver === "AssetLoader") {
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
        } else if (driver === "AssetLoader") {
            return this.assetLoader;
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
    let res = new Texture();
    res.channels = Dut.copyImmutableList(channels);
    res.width = width;
    res.height = height;
    res.buf = Arrays.copyOf(buf, buf.length);
    res.guardInvaritants();
    return res;
  }

  static rgbFloatBuffer(width, height, ...buf) {
    let res = new Texture();
    res.channels = Texture.RGB;
    res.width = width;
    res.height = height;
    res.buf = Arrays.copyOf(buf, buf.length);
    res.guardInvaritants();
    return res;
  }

  static rgbPixels(width, height, ...pixels) {
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
    let res = new Texture();
    res.channels = Texture.RGBA;
    res.width = width;
    res.height = height;
    res.buf = Arrays.copyOf(buf, buf.length);
    res.guardInvaritants();
    return res;
  }

  static rgbaPixels(width, height, ...pixels) {
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
class TextureId {
  static TYPE = RefIdType.of("TEXTURE_ID");
  mId;
  constructor() {
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
class Mesh {
  static MODEL_ATTRS = Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3, VertexAttr.TEX2);
  vertexAttrs;
  vertices;
  faces;
  constructor() {
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

  static modelAnimated() {
    if (arguments.length===1&&arguments[0] instanceof List) {
      return Mesh.modelAnimated_1_List(arguments[0]);
    }
    else if (arguments.length===1&&Array.isArray(arguments[0])) {
      return Mesh.modelAnimated_1_arr(arguments[0]);
    }
    else {
      throw "error";
    }
  }

  static modelAnimated_1_List(frames) {
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

  static modelAnimated_1_arr(frames) {
    return Mesh.modelAnimated(Arrays.asList(frames));
  }

}
class MeshId {
  static TYPE = RefIdType.of("MESH_ID");
  mId;
  constructor() {
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
class BufferId {
  static TYPE = RefIdType.of("BUFFER_ID");
  static COLOR = BufferId.of("color");
  static DEPTH = BufferId.of("depth");
  mId;
  constructor() {
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
class ShadowBufferId {
  static TYPE = RefIdType.of("SHADOW_BUFFER_ID");
  mId;
  constructor() {
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
class Camera {
  proj;
  view;
  pos;
  near;
  far;
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
class SoundId {
  static TYPE = RefIdType.of("SOUND_ID");
  mId;
  constructor() {
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
class DefaultAssetManager {
  drivers;
  loader;
  bank;
  dict = new HashMap();
  constructor() {
  }

  guardInvariants() {
  }

  resolve(path, transformFncs) {
    if (path.getExtension().equals("")) {
      let files = this.loader.listFiles(path, true);
      for (let file of files) {
        this.resolve(file, transformFncs);
      }
      return ;
    }
    let fullyLoaded = false;
    if (this.dict.containsKey(path)) {
      fullyLoaded = true;
      for (let id of this.dict.get(path)) {
        if (!this.bank.containsKey(id)) {
          fullyLoaded = false;
          break;
        }
      }
    }
    if (fullyLoaded) {
      return ;
    }
    let ag = AssetGroup.empty();
    if (path.getExtension().equals("tap")) {
      let buf = this.loader.loadFile(path);
      let tap = Taps.fromBytes(buf);
      ag = Taps.toAssetGroup(tap);
    }
    else if (path.getExtension().equals("png")) {
      ag = Assets.loadTexture(this.loader, path);
    }
    else if (path.getExtension().equals("mtl")) {
      ag = Objs.loadMtlLibrary(this.loader, path);
    }
    else if (path.getExtension().equals("obj")) {
      ag = Objs.loadModel(this.loader, path);
    }
    else if (path.getExtension().equals("fnt")) {
      ag = Fonts.loadFnt(this.loader, path, AssetGroup.empty());
    }
    else if (path.getExtension().equals("wav")) {
      ag = Assets.loadSound(this.loader, path);
    }
    for (let clazz of transformFncs.keySet()) {
      if (clazz.equals("Texture")) {
        ag = ag.transform("Texture", (transformFncs.get(clazz)));
      }
      else if (clazz.equals("Material")) {
        ag = ag.transform("Material", (transformFncs.get(clazz)));
      }
      else if (clazz.equals("Mesh")) {
        ag = ag.transform("Mesh", (transformFncs.get(clazz)));
      }
      else if (clazz.equals("Model")) {
        ag = ag.transform("Model", (transformFncs.get(clazz)));
      }
      else if (clazz.equals("Font")) {
        ag = ag.transform("Font", (transformFncs.get(clazz)));
      }
      else if (clazz.equals("Sound")) {
        ag = ag.transform("Sound", (transformFncs.get(clazz)));
      }
      else {
        throw "unsupported class for transformation, implement me: "+clazz;
      }
    }
    for (let key of ag.getKeys()) {
      if (this.bank.containsKey(key)) {
        throw "bank already contains "+key;
      }
    }
    for (let key of ag.getKeys()) {
      this.bank.put(key, ag.get(key));
    }
    this.dict.put(path, ag.getKeys());
    this.attachCompasnions(ag);
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
      if (this.bank.isSynced(mid)&&gdms.contains(mid)) {
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
      if (this.bank.isSynced(tid)&&gdtxs.contains(tid)) {
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
      if (this.bank.isSynced(sbid)&&gdshbs.contains(sbid)) {
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
      if (this.bank.isSynced(id)&&adrivSounds.contains(id)) {
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
    }
    else if (asset instanceof Mesh) {
      let mesh = asset;
      let aabb = DefaultAssetManager.calculateMeshAabb(mesh);
      this.bank.putCompanion(key, AssetCompanionType.BOUNDING_AABB, aabb);
    }
  }

  toString() {
  }

  static create(drivers, loader, bank) {
    let res = new DefaultAssetManager();
    res.drivers = drivers;
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
    for (let i = 0; i<mesh.getNumVertices(); ++i) {
      let vertex = mesh.getVertex(i);
      let offset = 0;
      for (let attr of attrs) {
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
    if (Float.isInfinite(minX)) {
      return null;
    }
    return Aabb3.create(Vec3.create(minX, minY, minZ), Vec3.create(maxX, maxY, maxZ));
  }

}


// -------------------------------------
// Transslates app specific code
// -------------------------------------

class BoxMeshFactory {
  constructor() {
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
class BasicApp02 {
  planes = Dut.immutableList(MeshId.of("plane-0"), MeshId.of("plane-1"), MeshId.of("plane-2"), MeshId.of("plane-3"), MeshId.of("plane-4"), MeshId.of("plane-5"), MeshId.of("plane-6"), MeshId.of("plane-7"), MeshId.of("plane-8"), MeshId.of("plane-9"), MeshId.of("plane-10"));
  tex1 = TextureId.of("tex1");
  tex2 = TextureId.of("tex2");
  stone = TextureId.of("stone");
  tyracorn = TextureId.of("tyracorn");
  rug = TextureId.of("rug");
  time = 0;
  constructor() {
  }

  move(drivers, dt) {
    this.time = this.time+dt;
    let gDriver = drivers.getDriver("GraphicsDriver");
    let aspect = gDriver.getScreenViewport().getAspect();
    let fovy = (aspect>=1?Math.toRadians(60):Math.toRadians(90));
    let m = (2*Math.sin(this.time/3));
    let cam = Camera.persp(fovy, aspect, 1.0, 50.0).lookAt(Vec3.create(m, 2, 5), Vec3.ZERO, Vec3.create(0, 1, 0));
    gDriver.clearBuffers(BufferId.COLOR, BufferId.DEPTH);
    let renderer = gDriver.startRenderer("SceneRenderer", Environments.scene(cam, Light.dir(LightColor.AMBIENT_WHITE, Vec3.DOWN)));
    renderer.render(this.planes.get(10), Mat44.trans(0, -0.5, 0).mul(Mat44.rotX(-Math.PI/2).mul(Mat44.scale(20, 20, 1))), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.rug, TextureStyle.SMOOTH_REPEAT)));
    renderer.render(this.planes.get(1), Mat44.trans(-4, 1, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.tex1, TextureStyle.create(TextureWrapType.REPEAT, TextureWrapType.REPEAT, Rgba.TRANSPARENT, TextureFilterType.LINEAR, TextureFilterType.LINEAR))));
    renderer.render(this.planes.get(1), Mat44.trans(-4, 0, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.tex1, TextureStyle.create(TextureWrapType.REPEAT, TextureWrapType.REPEAT, Rgba.TRANSPARENT, TextureFilterType.NEAREST, TextureFilterType.NEAREST))));
    renderer.render(this.planes.get(1), Mat44.trans(-2.4, 0, 0).mul(Mat44.scale(2, 1, 1)), Material.create(Rgb.BLACK, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.ALPHA, this.tyracorn, TextureStyle.SMOOTH_REPEAT), TextureAttachment.create(TextureType.DIFFUSE, this.tyracorn, TextureStyle.SMOOTH_REPEAT)));
    renderer.render(this.planes.get(2), Mat44.trans(-0.6, 0, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.stone, TextureStyle.create(TextureWrapType.REPEAT, TextureWrapType.REPEAT, Rgba.TRANSPARENT, TextureFilterType.NEAREST, TextureFilterType.NEAREST))));
    renderer.render(this.planes.get(2), Mat44.trans(-0.6, 1, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.stone, TextureStyle.create(TextureWrapType.REPEAT, TextureWrapType.REPEAT, Rgba.TRANSPARENT, TextureFilterType.LINEAR, TextureFilterType.LINEAR))));
    renderer.render(this.planes.get(2), Mat44.trans(-0.6, 2, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.stone, TextureStyle.SMOOTH_REPEAT)));
    renderer.render(this.planes.get(4), Mat44.trans(0.8, 0, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.tex1, TextureStyle.create(TextureWrapType.EDGE, TextureWrapType.EDGE, Rgba.TRANSPARENT, TextureFilterType.NEAREST, TextureFilterType.NEAREST))));
    renderer.render(this.planes.get(4), Mat44.trans(0.8, 1, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.tex1, TextureStyle.create(TextureWrapType.MIRRORED_REPEAT, TextureWrapType.MIRRORED_REPEAT, Rgba.TRANSPARENT, TextureFilterType.NEAREST, TextureFilterType.NEAREST))));
    renderer.render(this.planes.get(4), Mat44.trans(0.8, 2, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.tex1, TextureStyle.create(TextureWrapType.REPEAT, TextureWrapType.REPEAT, Rgba.TRANSPARENT, TextureFilterType.NEAREST, TextureFilterType.NEAREST))));
    renderer.render(this.planes.get(4), Mat44.trans(2.0, 0, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.tex1, TextureStyle.create(TextureWrapType.BORDER, TextureWrapType.BORDER, Rgba.RED, TextureFilterType.NEAREST, TextureFilterType.NEAREST))));
    renderer.render(this.planes.get(4), Mat44.trans(2.0, 1, 0), Material.create(Rgb.WHITE, Rgb.BLACK, Rgb.BLACK, 1, TextureAttachment.create(TextureType.DIFFUSE, this.tex1, TextureStyle.create(TextureWrapType.BORDER, TextureWrapType.BORDER, Rgba.WHITE, TextureFilterType.NEAREST, TextureFilterType.NEAREST))));
    renderer.end();
  }

  init(drivers, properties) {
    let assets = drivers.getDriver("AssetManager");
    let loader = drivers.getDriver("AssetLoader");
    assets.put(this.planes.get(1), this.plane(1, 1));
    assets.put(this.planes.get(2), this.plane(2, 2));
    assets.put(this.planes.get(3), this.plane(3, 3));
    assets.put(this.planes.get(4), this.plane(4, 4));
    assets.put(this.planes.get(5), this.plane(5, 5));
    assets.put(this.planes.get(6), this.plane(6, 6));
    assets.put(this.planes.get(7), this.plane(7, 7));
    assets.put(this.planes.get(8), this.plane(8, 8));
    assets.put(this.planes.get(9), this.plane(9, 9));
    assets.put(this.planes.get(10), this.plane(10, 10));
    let mtex1 = Texture.rgbFloatBuffer(4, 4, 1, 1, 1, 0.3, 0.3, 0.3, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0.3, 0.3, 0.3, 0, 1, 1, 1, 1, 0, 0.3, 0.3, 0.3, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0.3, 0.3, 0.3, 1, 1, 1, 1, 0, 1, 1, 0, 1).powRgb(2.2);
    let mtex2 = Texture.rgbaFloatBuffer(4, 4, 1, 1, 1, 1, 0.3, 0.3, 0.3, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0.3, 0.3, 0.3, 0, 0, 1, 1, 0, 1, 1, 0, 1, 0.3, 0.3, 0.3, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0.3, 0.3, 0.3, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1).powRgb(2.2);
    assets.put(this.tex1, mtex1);
    assets.put(this.tex2, mtex2);
    assets.put(this.stone, loader.loadTexture("asset:stone-floor-1.png").powRgb(2.2));
    assets.put(this.tyracorn, loader.loadTexture("asset:tyracorn.png").flipVert().powRgb(2.2));
    assets.put(this.rug, loader.loadTexture("asset:rug-1.png").flipVert().powRgb(2.2));
  }

  close(drivers) {
  }

  plane(repU, repV) {
    let res = Mesh.create(Dut.immutableList(VertexAttr.POS3, VertexAttr.NORM3, VertexAttr.TEX2), Dut.list(Vertex.create(-0.5, -0.5, 0, 0, 0, 1, 0, 0), Vertex.create(0.5, -0.5, 0, 0, 0, 1, repU, 0), Vertex.create(0.5, 0.5, 0, 0, 0, 1, repU, repV), Vertex.create(-0.5, 0.5, 0, 0, 0, 1, 0, repV)), Dut.list(Face.triangle(0, 1, 2), Face.triangle(0, 2, 3)));
    return res;
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

    // Ensure canvas is properly sized after WebGL initialization
    resizeCanvas();
}

/**
 * App loop funciton. This loops forever.
 */
function appLoop() {
    let dt = 0.0;
    if (time === 0.0) {
        time = Date.now() * 0.001;
    } else {
        const timeNext = Date.now() * 0.001;
        dt = timeNext - time;
        time = timeNext;
    }
    tyracornApp.move(drivers, dt);
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
    tyracornApp = new BasicApp02();

    tyracornApp.init(drivers, {});
    drivers.getDriver("AssetManager").syncToDrivers();
    appLoop();
}


// -------------------------------------
// Start the app when the page loads
// -------------------------------------
window.addEventListener('load', main); 