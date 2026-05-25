/**
 * Global Web API polyfills for Node.js (shared hosting / older runtimes).
 * Must load before any dependency that uses fetch or pdf.js browser APIs.
 */

// fetch, Request, Response, Headers, FormData, Blob, File, AbortController
if (typeof globalThis.fetch === 'undefined') {
  const undici = require('undici');
  globalThis.fetch = undici.fetch;
  globalThis.Headers = undici.Headers;
  globalThis.Request = undici.Request;
  globalThis.Response = undici.Response;
  globalThis.FormData = undici.FormData;
  globalThis.Blob = undici.Blob;
  globalThis.File = undici.File;
  if (typeof globalThis.AbortController === 'undefined') {
    globalThis.AbortController = undici.AbortController;
  }
  if (typeof globalThis.AbortSignal === 'undefined') {
    globalThis.AbortSignal = undici.AbortSignal;
  }
}

// DOMMatrix — required by pdf.js / pdf-parse v2 on Node
if (typeof globalThis.DOMMatrix === 'undefined') {
  try {
    globalThis.DOMMatrix = require('dommatrix/dist/dommatrix.js');
  } catch {
    globalThis.DOMMatrix = class DOMMatrix {
      constructor(init) {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
      multiply() { return new DOMMatrix(); }
      translate() { return new DOMMatrix(); }
      scale() { return new DOMMatrix(); }
      inverse() { return new DOMMatrix(); }
      static fromMatrix() { return new DOMMatrix(); }
      static fromFloat32Array() { return new DOMMatrix(); }
    };
  }
}

// ImageData / Path2D — pdf.js warns when missing; stubs avoid startup ReferenceError
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(data, width, height) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}

if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    constructor() {}
    addPath() {}
    closePath() {}
    moveTo() {}
    lineTo() {}
    rect() {}
  };
}
