var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error3) {
    if (error3 instanceof FetchBaseError) {
      throw error3;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error3.message}`, "system", error3);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error3) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error3.message}`, "system", error3);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error3 = new AbortError("The operation was aborted.");
      reject(error3);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error3);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error3);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error3) {
                reject(error3);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
        reject(error3);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error3) => {
          reject(error3);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error3) => {
              reject(error3);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error3) => {
              reject(error3);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error3) => {
          reject(error3);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, dataUriToBuffer$1, Readable, wm, Blob, fetchBlob, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob;
    Blob$1 = fetchBlob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error3 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error3;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/@cloudinary/url-gen/bundles/umd/base.js
var require_base = __commonJS({
  "node_modules/@cloudinary/url-gen/bundles/umd/base.js"(exports, module2) {
    init_shims();
    (function(global2, factory) {
      typeof exports === "object" && typeof module2 !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, factory(global2.CloudinaryBaseSDK = {}));
    })(exports, function(exports2) {
      "use strict";
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2)
            if (Object.prototype.hasOwnProperty.call(b2, p))
              d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      }
      var __assign = function() {
        __assign = Object.assign || function __assign2(t) {
          for (var s2, i = 1, n = arguments.length; i < n; i++) {
            s2 = arguments[i];
            for (var p in s2)
              if (Object.prototype.hasOwnProperty.call(s2, p))
                t[p] = s2[p];
          }
          return t;
        };
        return __assign.apply(this, arguments);
      };
      function __spreadArrays() {
        for (var s2 = 0, i = 0, il = arguments.length; i < il; i++)
          s2 += arguments[i].length;
        for (var r = Array(s2), k = 0, i = 0; i < il; i++)
          for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
        return r;
      }
      var QualifierValue = function() {
        function QualifierValue2(qualifierValue) {
          this.values = [];
          this.delimiter = ":";
          if (this.hasValue(qualifierValue)) {
            this.addValue(qualifierValue);
          }
        }
        QualifierValue2.prototype.toString = function() {
          return this.values.join(this.delimiter);
        };
        QualifierValue2.prototype.hasValue = function(v) {
          return typeof v !== "undefined" && v !== null && v !== "";
        };
        QualifierValue2.prototype.addValue = function(value) {
          var _this = this;
          if (Array.isArray(value)) {
            this.values = this.values.concat(value);
          } else {
            this.values.push(value);
          }
          this.values = this.values.filter(function(v) {
            return _this.hasValue(v);
          });
          return this;
        };
        QualifierValue2.prototype.setDelimiter = function(delimiter) {
          this.delimiter = delimiter;
          return this;
        };
        return QualifierValue2;
      }();
      var Qualifier = function() {
        function Qualifier2(key, qualifierValue) {
          this.delimiter = "_";
          this.key = key;
          if (qualifierValue instanceof QualifierValue) {
            this.qualifierValue = qualifierValue;
          } else {
            this.qualifierValue = new QualifierValue();
            this.qualifierValue.addValue(qualifierValue);
          }
        }
        Qualifier2.prototype.toString = function() {
          var _a = this, key = _a.key, delimiter = _a.delimiter, qualifierValue = _a.qualifierValue;
          return "" + key + delimiter + qualifierValue.toString();
        };
        Qualifier2.prototype.addValue = function(value) {
          this.qualifierValue.addValue(value);
          return this;
        };
        return Qualifier2;
      }();
      var FlagQualifier = function(_super) {
        __extends(FlagQualifier2, _super);
        function FlagQualifier2(flagType, flagValue) {
          var _this = this;
          var qualifierValue;
          if (flagValue) {
            qualifierValue = new QualifierValue([flagType, "" + flagValue]).setDelimiter(":");
          } else {
            qualifierValue = flagType;
          }
          _this = _super.call(this, "fl", qualifierValue) || this;
          return _this;
        }
        FlagQualifier2.prototype.toString = function() {
          return _super.prototype.toString.call(this).replace(/\./, "%2E");
        };
        return FlagQualifier2;
      }(Qualifier);
      function mapToSortedArray(map, flags) {
        var array = Array.from(map.entries());
        flags.forEach(function(flag) {
          array.push(["fl", flag]);
        });
        return array.sort().map(function(v) {
          return v[1];
        });
      }
      function isString(value) {
        return typeof value === "string" || value instanceof String;
      }
      var Action = function() {
        function Action2() {
          this.qualifiers = new Map();
          this.flags = [];
          this.delimiter = ",";
          this.actionTag = "";
        }
        Action2.prototype.prepareQualifiers = function() {
        };
        Action2.prototype.getActionTag = function() {
          return this.actionTag;
        };
        Action2.prototype.setActionTag = function(tag) {
          this.actionTag = tag;
          return this;
        };
        Action2.prototype.toString = function() {
          this.prepareQualifiers();
          return mapToSortedArray(this.qualifiers, this.flags).join(this.delimiter);
        };
        Action2.prototype.addQualifier = function(qualifier) {
          if (typeof qualifier === "string") {
            var _a = qualifier.toLowerCase().split("_"), key = _a[0], value = _a[1];
            if (key === "fl") {
              this.flags.push(new FlagQualifier(value));
            } else {
              this.qualifiers.set(key, new Qualifier(key, value));
            }
          } else {
            this.qualifiers.set(qualifier.key, qualifier);
          }
          return this;
        };
        Action2.prototype.addFlag = function(flag) {
          if (typeof flag === "string") {
            this.flags.push(new FlagQualifier(flag));
          } else {
            if (flag instanceof FlagQualifier) {
              this.flags.push(flag);
            }
          }
          return this;
        };
        Action2.prototype.addValueToQualifier = function(qualifierKey, qualifierValue) {
          this.qualifiers.get(qualifierKey).addValue(qualifierValue);
          return this;
        };
        return Action2;
      }();
      var RoundCornersAction = function(_super) {
        __extends(RoundCornersAction2, _super);
        function RoundCornersAction2() {
          return _super.call(this) || this;
        }
        RoundCornersAction2.prototype.radius = function(a, b, c, d) {
          var qualifierValue = new QualifierValue();
          typeof a !== void 0 && qualifierValue.addValue(a);
          typeof b !== void 0 && qualifierValue.addValue(b);
          typeof c !== void 0 && qualifierValue.addValue(c);
          typeof d !== void 0 && qualifierValue.addValue(d);
          this.addQualifier(new Qualifier("r").addValue(qualifierValue));
          return this;
        };
        RoundCornersAction2.prototype.max = function() {
          return this.addQualifier(new Qualifier("r", "max"));
        };
        return RoundCornersAction2;
      }(Action);
      function byRadius(a, b, c, d) {
        return new RoundCornersAction().radius(a, b, c, d);
      }
      function max() {
        return new RoundCornersAction().max();
      }
      var RoundCorners = { byRadius, max };
      function toFloatAsString(value) {
        var returnValue = value.toString();
        if (returnValue.match(/[A-Z]/gi)) {
          return returnValue;
        }
        if (returnValue.length > 1 && returnValue[0] === "0") {
          return returnValue;
        }
        var isNumberLike2 = !isNaN(parseFloat(returnValue)) && returnValue.indexOf(":") === -1;
        if (isNumberLike2 && returnValue.indexOf(".") === -1) {
          return returnValue + ".0";
        } else {
          return returnValue;
        }
      }
      var AspectRatioQualifierValue = function(_super) {
        __extends(AspectRatioQualifierValue2, _super);
        function AspectRatioQualifierValue2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        return AspectRatioQualifierValue2;
      }(QualifierValue);
      function animated() {
        return new FlagQualifier("animated");
      }
      function animatedWebP() {
        return new FlagQualifier("awebp");
      }
      function clip$1() {
        return new FlagQualifier("clip");
      }
      function clipEvenOdd() {
        return new FlagQualifier("clip_evenodd");
      }
      function ignoreInitialAspectRatio$1() {
        return new FlagQualifier("ignore_aspect_ratio");
      }
      function lossy() {
        return new FlagQualifier("lossy");
      }
      function noOverflow() {
        return new FlagQualifier("no_overflow");
      }
      function preserveTransparency() {
        return new FlagQualifier("preserve_transparency");
      }
      function progressive(mode2) {
        return new FlagQualifier("progressive", mode2);
      }
      function regionRelative() {
        return new FlagQualifier("region_relative");
      }
      function relative() {
        return new FlagQualifier("relative");
      }
      function tiled() {
        return new FlagQualifier("tiled");
      }
      var ResizeSimpleAction = function(_super) {
        __extends(ResizeSimpleAction2, _super);
        function ResizeSimpleAction2(cropType, cropWidth, cropHeight) {
          var _this = _super.call(this) || this;
          if (cropWidth) {
            _this.addQualifier(new Qualifier("w", cropWidth));
          }
          if (cropHeight) {
            _this.addQualifier(new Qualifier("h", cropHeight));
          }
          _this.addQualifier(new Qualifier("c", cropType));
          return _this;
        }
        ResizeSimpleAction2.prototype.height = function(x) {
          return this.addQualifier(new Qualifier("h", x));
        };
        ResizeSimpleAction2.prototype.width = function(x) {
          return this.addQualifier(new Qualifier("w", x));
        };
        ResizeSimpleAction2.prototype.aspectRatio = function(ratio) {
          if (ratio instanceof AspectRatioQualifierValue) {
            return this.addQualifier(new Qualifier("ar", ratio));
          }
          if (typeof ratio === "number" || typeof ratio === "string") {
            return this.addQualifier(new Qualifier("ar", toFloatAsString(ratio)));
          }
          if (ratio instanceof FlagQualifier) {
            return this.addFlag(ratio);
          }
        };
        ResizeSimpleAction2.prototype.relative = function() {
          return this.addFlag(relative());
        };
        ResizeSimpleAction2.prototype.regionRelative = function() {
          return this.addFlag(regionRelative());
        };
        return ResizeSimpleAction2;
      }(Action);
      var ResizeAdvancedAction = function(_super) {
        __extends(ResizeAdvancedAction2, _super);
        function ResizeAdvancedAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ResizeAdvancedAction2.prototype.gravity = function(gravity) {
          if (typeof gravity === "string") {
            return this.addQualifier(new Qualifier("g", gravity));
          }
          return this.addQualifier(gravity);
        };
        return ResizeAdvancedAction2;
      }(ResizeSimpleAction);
      var ResizePadAction = function(_super) {
        __extends(ResizePadAction2, _super);
        function ResizePadAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ResizePadAction2.prototype.background = function(backgroundQualifier) {
          return this.addQualifier(backgroundQualifier);
        };
        ResizePadAction2.prototype.gravity = function(direction) {
          return this.addQualifier(direction);
        };
        ResizePadAction2.prototype.offsetX = function(x) {
          return this.addQualifier(new Qualifier("x", x));
        };
        ResizePadAction2.prototype.offsetY = function(y) {
          return this.addQualifier(new Qualifier("y", y));
        };
        return ResizePadAction2;
      }(ResizeAdvancedAction);
      var GravityQualifier = function(_super) {
        __extends(GravityQualifier2, _super);
        function GravityQualifier2(value) {
          return _super.call(this, "g", new QualifierValue(value)) || this;
        }
        return GravityQualifier2;
      }(Qualifier);
      var ScaleAction = function(_super) {
        __extends(ScaleAction2, _super);
        function ScaleAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ScaleAction2.prototype.liquidRescaling = function() {
          return this.addQualifier(new GravityQualifier("liquid"));
        };
        return ScaleAction2;
      }(ResizeSimpleAction);
      var ThumbResizeAction = function(_super) {
        __extends(ThumbResizeAction2, _super);
        function ThumbResizeAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ThumbResizeAction2.prototype.zoom = function(z) {
          return this.addQualifier(new Qualifier("z", z));
        };
        return ThumbResizeAction2;
      }(ResizeAdvancedAction);
      var ResizeCropAction = function(_super) {
        __extends(ResizeCropAction2, _super);
        function ResizeCropAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ResizeCropAction2.prototype.x = function(x) {
          return this.addQualifier(new Qualifier("x", x));
        };
        ResizeCropAction2.prototype.y = function(y) {
          return this.addQualifier(new Qualifier("y", y));
        };
        ResizeCropAction2.prototype.zoom = function(z) {
          return this.addQualifier(new Qualifier("z", z));
        };
        return ResizeCropAction2;
      }(ResizeAdvancedAction);
      var ResizeFillAction = function(_super) {
        __extends(ResizeFillAction2, _super);
        function ResizeFillAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ResizeFillAction2.prototype.x = function(x) {
          return this.addQualifier(new Qualifier("x", x));
        };
        ResizeFillAction2.prototype.y = function(y) {
          return this.addQualifier(new Qualifier("y", y));
        };
        return ResizeFillAction2;
      }(ResizeAdvancedAction);
      function scale(width, height) {
        return new ScaleAction("scale", width, height);
      }
      function imaggaScale(width, height) {
        return new ResizeSimpleAction("imagga_scale", width, height);
      }
      function imaggaCrop(width, height) {
        return new ResizeSimpleAction("imagga_crop", width, height);
      }
      function crop(width, height) {
        return new ResizeCropAction("crop", width, height);
      }
      function fill$1(width, height) {
        return new ResizeFillAction("fill", width, height);
      }
      function fit(width, height) {
        return new ResizeSimpleAction("fit", width, height);
      }
      function pad(width, height) {
        return new ResizePadAction("pad", width, height);
      }
      function limitFill(width, height) {
        return new ResizeFillAction("lfill", width, height);
      }
      function limitFit(width, height) {
        return new ResizeSimpleAction("limit", width, height);
      }
      function minimumPad(width, height) {
        return new ResizePadAction("mpad", width, height);
      }
      function minimumFit(width, height) {
        return new ResizeSimpleAction("mfit", width, height);
      }
      function fillPad(width, height) {
        return new ResizePadAction("fill_pad", width, height);
      }
      function thumbnail(width, height) {
        return new ThumbResizeAction("thumb", width, height);
      }
      function limitPad(width, height) {
        return new ResizePadAction("lpad", width, height);
      }
      var Resize = {
        imaggaScale,
        imaggaCrop,
        crop,
        fill: fill$1,
        scale,
        minimumPad,
        fit,
        pad,
        limitFit,
        thumbnail,
        limitFill,
        minimumFit,
        limitPad,
        fillPad
      };
      function prepareColor(color2) {
        if (color2) {
          return color2.match(/^#/) ? "rgb:" + color2.substr(1) : color2;
        } else {
          return color2;
        }
      }
      var BorderAction = function(_super) {
        __extends(BorderAction2, _super);
        function BorderAction2(borderType, color2, borderWidth) {
          var _this = _super.call(this) || this;
          _this.borderType = borderType;
          _this.borderColor = prepareColor(color2);
          _this.borderWidth = borderWidth;
          return _this;
        }
        BorderAction2.prototype.width = function(borderWidth) {
          this.borderWidth = borderWidth;
          return this;
        };
        BorderAction2.prototype.color = function(borderColor) {
          this.borderColor = prepareColor(borderColor);
          return this;
        };
        BorderAction2.prototype.roundCorners = function(roundCorners) {
          this._roundCorners = roundCorners;
          return this;
        };
        BorderAction2.prototype.prepareQualifiers = function() {
          var qualifierValue = new QualifierValue([this.borderWidth + "px", this.borderType, "" + this.borderColor]).setDelimiter("_");
          this.addQualifier(new Qualifier("bo", qualifierValue));
          if (this._roundCorners) {
            this.addQualifier(this._roundCorners.qualifiers.get("r"));
          }
        };
        return BorderAction2;
      }(Action);
      function solid$1(width, color2) {
        return new BorderAction("solid", color2, width);
      }
      var Border = {
        solid: solid$1
      };
      var BlurAction = function(_super) {
        __extends(BlurAction2, _super);
        function BlurAction2(strength) {
          var _this = _super.call(this) || this;
          _this._strength = strength;
          return _this;
        }
        BlurAction2.prototype.region = function(blurRegion) {
          this._region = blurRegion;
          return this;
        };
        BlurAction2.prototype.strength = function(strength) {
          this._strength = strength;
          return this;
        };
        BlurAction2.prototype.prepareQualifiers = function() {
          var _this = this;
          var str = this._strength ? ":" + this._strength : "";
          if ("_region" in this) {
            var qualifiers = this._region.qualifiers;
            qualifiers.forEach(function(q) {
              return _this.addQualifier(q);
            });
            if (this._region.regionType === "named") {
              this.addQualifier(new Qualifier("e", "blur_region" + str));
            }
            if (this._region.regionType === "ocr_text") {
              this.addQualifier(new Qualifier("e", "blur_region" + str));
              this.addQualifier(new Qualifier("g", "ocr_text"));
            }
            if (this._region.regionType === "faces") {
              this.addQualifier(new Qualifier("e", "blur_faces" + str));
            }
          } else {
            this.addQualifier(new Qualifier("e", "blur" + str));
          }
        };
        return BlurAction2;
      }(Action);
      var SimpleEffectAction = function(_super) {
        __extends(SimpleEffectAction2, _super);
        function SimpleEffectAction2(effectType, level) {
          var _this = _super.call(this) || this;
          var qualifierEffect = _this.createEffectQualifier(effectType, level);
          _this.addQualifier(qualifierEffect);
          return _this;
        }
        SimpleEffectAction2.prototype.createEffectQualifier = function(effectType, level) {
          var qualifierValue;
          if (level) {
            qualifierValue = new QualifierValue([effectType, "" + level]).setDelimiter(":");
          } else {
            qualifierValue = new QualifierValue(effectType);
          }
          return new Qualifier("e", qualifierValue);
        };
        return SimpleEffectAction2;
      }(Action);
      var LeveledEffectAction = function(_super) {
        __extends(LeveledEffectAction2, _super);
        function LeveledEffectAction2(effectType, level) {
          var _this = _super.call(this, effectType, level) || this;
          _this.effectType = effectType;
          return _this;
        }
        LeveledEffectAction2.prototype.setLevel = function(level) {
          var qualifierEffect = this.createEffectQualifier(this.effectType, level);
          this.addQualifier(qualifierEffect);
          return this;
        };
        return LeveledEffectAction2;
      }(SimpleEffectAction);
      var AccelerationEffectAction = function(_super) {
        __extends(AccelerationEffectAction2, _super);
        function AccelerationEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        AccelerationEffectAction2.prototype.rate = function(value) {
          return this.setLevel(value);
        };
        return AccelerationEffectAction2;
      }(LeveledEffectAction);
      var LoopEffectAction = function(_super) {
        __extends(LoopEffectAction2, _super);
        function LoopEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        LoopEffectAction2.prototype.additionalIterations = function(value) {
          return this.setLevel(value);
        };
        return LoopEffectAction2;
      }(LeveledEffectAction);
      var CartoonifyEffect = function(_super) {
        __extends(CartoonifyEffect2, _super);
        function CartoonifyEffect2(effectName, strength) {
          var _this = _super.call(this) || this;
          _this.cartoonifyStrength = strength;
          _this.effectName = effectName;
          return _this;
        }
        CartoonifyEffect2.prototype.lineStrength = function(lineStrength) {
          this.cartoonifyStrength = lineStrength;
          return this;
        };
        CartoonifyEffect2.prototype.blackwhite = function() {
          this.colorReduction = "bw";
          return this;
        };
        CartoonifyEffect2.prototype.colorReductionLevel = function(level) {
          this.colorReduction = level;
          return this;
        };
        CartoonifyEffect2.prototype.prepareQualifiers = function() {
          this.addQualifier(new Qualifier("e", new QualifierValue([this.effectName, this.cartoonifyStrength, this.colorReduction])));
          return;
        };
        return CartoonifyEffect2;
      }(Action);
      var EffectOutline = function(_super) {
        __extends(EffectOutline2, _super);
        function EffectOutline2() {
          return _super.call(this) || this;
        }
        EffectOutline2.prototype.mode = function(mode2) {
          this._mode = mode2;
          return this;
        };
        EffectOutline2.prototype.width = function(width) {
          this._width = width;
          return this;
        };
        EffectOutline2.prototype.blurLevel = function(lvl) {
          this._blurLevel = lvl;
          return this;
        };
        EffectOutline2.prototype.color = function(color2) {
          return this.addQualifier(new Qualifier("co", prepareColor(color2)));
        };
        EffectOutline2.prototype.prepareQualifiers = function() {
          this.addQualifier(new Qualifier("e", new QualifierValue(["outline", this._mode, this._width, this._blurLevel]).setDelimiter(":")));
        };
        return EffectOutline2;
      }(Action);
      var MakeTransparentEffectAction = function(_super) {
        __extends(MakeTransparentEffectAction2, _super);
        function MakeTransparentEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        MakeTransparentEffectAction2.prototype.tolerance = function(value) {
          return this.setLevel(value);
        };
        MakeTransparentEffectAction2.prototype.colorToReplace = function(color2) {
          return this.addQualifier(new Qualifier("co", new QualifierValue(prepareColor(color2))));
        };
        return MakeTransparentEffectAction2;
      }(LeveledEffectAction);
      var VectorizeEffectAction = function(_super) {
        __extends(VectorizeEffectAction2, _super);
        function VectorizeEffectAction2() {
          return _super.call(this) || this;
        }
        VectorizeEffectAction2.prototype.numOfColors = function(num2) {
          this._numOfColors = num2;
          return this;
        };
        VectorizeEffectAction2.prototype.detailsLevel = function(num2) {
          this._detailsLevel = num2;
          return this;
        };
        VectorizeEffectAction2.prototype.despeckleLevel = function(num2) {
          this._despeckleLevel = num2;
          return this;
        };
        VectorizeEffectAction2.prototype.cornersLevel = function(num2) {
          this._cornersLevel = num2;
          return this;
        };
        VectorizeEffectAction2.prototype.paths = function(num2) {
          this._paths = num2;
          return this;
        };
        VectorizeEffectAction2.prototype.prepareQualifiers = function() {
          var str = "vectorize";
          if (this._numOfColors) {
            str += ":" + new QualifierValue("colors:" + this._numOfColors).toString();
          }
          if (this._detailsLevel) {
            str += ":" + new QualifierValue("detail:" + this._detailsLevel).toString();
          }
          if (this._despeckleLevel) {
            str += ":" + new QualifierValue("despeckle:" + this._despeckleLevel).toString();
          }
          if (this._paths) {
            str += ":" + new QualifierValue("paths:" + this._paths).toString();
          }
          if (this._cornersLevel) {
            str += ":" + new QualifierValue("corners:" + this._cornersLevel).toString();
          }
          this.addQualifier(new Qualifier("e", str));
        };
        return VectorizeEffectAction2;
      }(Action);
      var SimulateColorBlindEffectAction = function(_super) {
        __extends(SimulateColorBlindEffectAction2, _super);
        function SimulateColorBlindEffectAction2() {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("e", "simulate_colorblind"));
          return _this;
        }
        SimulateColorBlindEffectAction2.prototype.setQualifier = function(val) {
          var strToAppend = ":" + val;
          if (val) {
            this.addQualifier(new Qualifier("e", "simulate_colorblind" + strToAppend));
          }
          return this;
        };
        SimulateColorBlindEffectAction2.prototype.condition = function(cond) {
          return this.setQualifier(cond);
        };
        return SimulateColorBlindEffectAction2;
      }(Action);
      var EffectActionWithLevel = function(_super) {
        __extends(EffectActionWithLevel2, _super);
        function EffectActionWithLevel2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        EffectActionWithLevel2.prototype.level = function(value) {
          return this.setLevel(value);
        };
        return EffectActionWithLevel2;
      }(LeveledEffectAction);
      var AssistColorBlindEffectAction = function(_super) {
        __extends(AssistColorBlindEffectAction2, _super);
        function AssistColorBlindEffectAction2() {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("e", new QualifierValue("assist_colorblind")));
          return _this;
        }
        AssistColorBlindEffectAction2.prototype.xray = function() {
          return this.addQualifier(new Qualifier("e", new QualifierValue(["assist_colorblind", "xray"]).setDelimiter(":")));
        };
        AssistColorBlindEffectAction2.prototype.stripesStrength = function(strength) {
          return this.addQualifier(new Qualifier("e", new QualifierValue(["assist_colorblind", strength]).setDelimiter(":")));
        };
        return AssistColorBlindEffectAction2;
      }(Action);
      var GradientFadeEffectAction = function(_super) {
        __extends(GradientFadeEffectAction2, _super);
        function GradientFadeEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        GradientFadeEffectAction2.prototype.strength = function(strength) {
          this._strength = strength;
          return this;
        };
        GradientFadeEffectAction2.prototype.type = function(type) {
          this._type = type;
          return this;
        };
        GradientFadeEffectAction2.prototype.horizontalStartPoint = function(x) {
          return this.addQualifier(new Qualifier("x", x));
        };
        GradientFadeEffectAction2.prototype.verticalStartPoint = function(y) {
          return this.addQualifier(new Qualifier("y", y));
        };
        GradientFadeEffectAction2.prototype.prepareQualifiers = function() {
          var str = "gradient_fade";
          if (this._type) {
            str += ":" + this._type;
          }
          if (this._strength) {
            str += ":" + this._strength;
          }
          this.addQualifier(new Qualifier("e", str));
        };
        return GradientFadeEffectAction2;
      }(Action);
      var FadeoutEffectAction = function(_super) {
        __extends(FadeoutEffectAction2, _super);
        function FadeoutEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        FadeoutEffectAction2.prototype.duration = function(value) {
          return this.setLevel(-value);
        };
        return FadeoutEffectAction2;
      }(LeveledEffectAction);
      var ColorizeEffectAction = function(_super) {
        __extends(ColorizeEffectAction2, _super);
        function ColorizeEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ColorizeEffectAction2.prototype.color = function(color2) {
          return this.addQualifier(new Qualifier("co", new QualifierValue(prepareColor(color2))));
        };
        return ColorizeEffectAction2;
      }(EffectActionWithLevel);
      var ShadowEffectAction = function(_super) {
        __extends(ShadowEffectAction2, _super);
        function ShadowEffectAction2(effectType, strength) {
          var _this = _super.call(this) || this;
          _this.effectType = effectType;
          _this.addQualifier(new Qualifier("e", new QualifierValue(["shadow", strength])));
          return _this;
        }
        ShadowEffectAction2.prototype.strength = function(strength) {
          return this.addQualifier(new Qualifier("e", new QualifierValue(["shadow", strength])));
        };
        ShadowEffectAction2.prototype.offsetX = function(x) {
          return this.addQualifier(new Qualifier("x", new QualifierValue(x)));
        };
        ShadowEffectAction2.prototype.offsetY = function(y) {
          return this.addQualifier(new Qualifier("y", new QualifierValue(y)));
        };
        ShadowEffectAction2.prototype.color = function(color2) {
          return this.addQualifier(new Qualifier("co", new QualifierValue(prepareColor(color2))));
        };
        return ShadowEffectAction2;
      }(Action);
      var StyleTransfer = function(_super) {
        __extends(StyleTransfer2, _super);
        function StyleTransfer2(imageSource) {
          var _this = _super.call(this) || this;
          _this.imageSource = imageSource;
          return _this;
        }
        StyleTransfer2.prototype.strength = function(effectStrength) {
          if (effectStrength === void 0) {
            effectStrength = null;
          }
          this.effectStrength = effectStrength;
          return this;
        };
        StyleTransfer2.prototype.preserveColor = function(bool) {
          if (bool === void 0) {
            bool = true;
          }
          this.preserve = bool;
          return this;
        };
        StyleTransfer2.prototype.toString = function() {
          var NAME2 = "style_transfer";
          var PRES = this.preserve ? "preserve_color" : null;
          var STRENGTH = this.effectStrength;
          var styleEffect = new Qualifier("e", new QualifierValue([NAME2, PRES, STRENGTH]));
          var sourceOpenString = this.imageSource.getOpenSourceString("l");
          var imgTx = this.imageSource.getTransformation();
          var sourceTransformation = imgTx ? imgTx.toString() : "";
          return [
            sourceOpenString,
            sourceTransformation,
            styleEffect + ",fl_layer_apply"
          ].filter(function(a) {
            return a;
          }).join("/");
        };
        return StyleTransfer2;
      }(Action);
      var DitherEffectAction = function(_super) {
        __extends(DitherEffectAction2, _super);
        function DitherEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        DitherEffectAction2.prototype.type = function(ditherType) {
          return this.setLevel(ditherType);
        };
        return DitherEffectAction2;
      }(LeveledEffectAction);
      var DeshakeEffectAction = function(_super) {
        __extends(DeshakeEffectAction2, _super);
        function DeshakeEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        DeshakeEffectAction2.prototype.shakeStrength = function(value) {
          return this.setLevel(value);
        };
        return DeshakeEffectAction2;
      }(LeveledEffectAction);
      var Pixelate = function(_super) {
        __extends(Pixelate2, _super);
        function Pixelate2(squareSize) {
          var _this = _super.call(this) || this;
          _this._squareSize = squareSize;
          return _this;
        }
        Pixelate2.prototype.region = function(pixelateRegion) {
          this._region = pixelateRegion;
          return this;
        };
        Pixelate2.prototype.squareSize = function(squareSize) {
          this._squareSize = squareSize;
          return this;
        };
        Pixelate2.prototype.prepareQualifiers = function() {
          var _this = this;
          var str = this._squareSize ? ":" + this._squareSize : "";
          if ("_region" in this) {
            var qualifiers = this._region.qualifiers;
            qualifiers.forEach(function(q) {
              return _this.addQualifier(q);
            });
            if (this._region.regionType === "named") {
              this.addQualifier(new Qualifier("e", "pixelate_region" + str));
            }
            if (this._region.regionType === "ocr_text") {
              this.addQualifier(new Qualifier("e", "pixelate_region" + str));
              this.addQualifier(new Qualifier("g", "ocr_text"));
            }
            if (this._region.regionType === "faces") {
              this.addQualifier(new Qualifier("e", "pixelate_faces" + str));
            }
          } else {
            this.addQualifier(new Qualifier("e", "pixelate" + str));
          }
        };
        return Pixelate2;
      }(Action);
      var EffectActionWithStrength = function(_super) {
        __extends(EffectActionWithStrength2, _super);
        function EffectActionWithStrength2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        EffectActionWithStrength2.prototype.strength = function(value) {
          return this.setLevel(value);
        };
        return EffectActionWithStrength2;
      }(LeveledEffectAction);
      var BlackwhiteEffectAction = function(_super) {
        __extends(BlackwhiteEffectAction2, _super);
        function BlackwhiteEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        BlackwhiteEffectAction2.prototype.threshold = function(value) {
          return this.setLevel(value);
        };
        return BlackwhiteEffectAction2;
      }(LeveledEffectAction);
      var FadeInEffectAction = function(_super) {
        __extends(FadeInEffectAction2, _super);
        function FadeInEffectAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        FadeInEffectAction2.prototype.duration = function(value) {
          return this.setLevel(value);
        };
        return FadeInEffectAction2;
      }(LeveledEffectAction);
      var RemoveBackgroundAction = function(_super) {
        __extends(RemoveBackgroundAction2, _super);
        function RemoveBackgroundAction2() {
          var _this = _super.call(this) || this;
          _this.overwriteQualifier();
          return _this;
        }
        RemoveBackgroundAction2.prototype.overwriteQualifier = function() {
          var value = ["bgremoval", this._screen ? "screen" : "", (this._colorToRemove || "").replace("#", "")];
          return this.addQualifier(new Qualifier("e", new QualifierValue(value)));
        };
        RemoveBackgroundAction2.prototype.screen = function(useScreen) {
          if (useScreen === void 0) {
            useScreen = true;
          }
          this._screen = useScreen;
          return this.overwriteQualifier();
        };
        RemoveBackgroundAction2.prototype.colorToRemove = function(color2) {
          this._colorToRemove = color2;
          return this.overwriteQualifier();
        };
        return RemoveBackgroundAction2;
      }(Action);
      var ThemeEffect = function(_super) {
        __extends(ThemeEffect2, _super);
        function ThemeEffect2(color2) {
          var _this = _super.call(this) || this;
          _this.effectName = "theme";
          _this.color = color2;
          return _this;
        }
        ThemeEffect2.prototype.photosensitivity = function(photosensitivity) {
          this._photosensitivity = photosensitivity;
          return this;
        };
        ThemeEffect2.prototype.prepareQualifiers = function() {
          var sensitivity = this._photosensitivity ? ":photosensitivity_" + this._photosensitivity : "";
          var val = this.effectName + ":color_" + this.color.replace("#", "") + sensitivity;
          this.addQualifier(new Qualifier("e", new QualifierValue(val)));
          return;
        };
        return ThemeEffect2;
      }(Action);
      function blur(blurLevel) {
        return new BlurAction(blurLevel);
      }
      function grayscale() {
        return new SimpleEffectAction("grayscale");
      }
      function sepia(level) {
        return new EffectActionWithLevel("sepia", level);
      }
      function shadow(shadowLevel) {
        return new ShadowEffectAction("shadow", shadowLevel);
      }
      function colorize(colorizeLevel) {
        return new ColorizeEffectAction("colorize", colorizeLevel);
      }
      function oilPaint(oilPaintLevel) {
        return new EffectActionWithStrength("oil_paint", oilPaintLevel);
      }
      function artisticFilter(artisticFilterType) {
        return new SimpleEffectAction("art", artisticFilterType);
      }
      function cartoonify(cartoonifyLevel) {
        return new CartoonifyEffect("cartoonify", cartoonifyLevel);
      }
      function outline() {
        return new EffectOutline();
      }
      function styleTransfer(imageSource) {
        return new StyleTransfer(imageSource);
      }
      function boomerang() {
        return new SimpleEffectAction("boomerang");
      }
      function advancedRedEye() {
        return new SimpleEffectAction("adv_redeye");
      }
      function blackwhite(level) {
        return new BlackwhiteEffectAction("blackwhite", level);
      }
      function negate() {
        return new SimpleEffectAction("negate");
      }
      function redEye() {
        return new SimpleEffectAction("redeye");
      }
      function reverse() {
        return new SimpleEffectAction("reverse");
      }
      function accelerate(speedIncreasePercent) {
        return new AccelerationEffectAction("accelerate", speedIncreasePercent);
      }
      function fadeIn(fadeLength) {
        return new FadeInEffectAction("fade", fadeLength);
      }
      function fadeOut(fadeLength) {
        return new FadeoutEffectAction("fade", -fadeLength);
      }
      function loop(additionalLoops) {
        return new LoopEffectAction("loop", additionalLoops);
      }
      function makeTransparent(tolerance) {
        return new MakeTransparentEffectAction("make_transparent", tolerance);
      }
      function noise(percentage) {
        return new EffectActionWithLevel("noise", percentage);
      }
      function vignette(strength) {
        return new EffectActionWithStrength("vignette", strength);
      }
      function dither(ditherType) {
        return new DitherEffectAction("ordered_dither", ditherType);
      }
      function vectorize() {
        return new VectorizeEffectAction();
      }
      function gradientFade() {
        return new GradientFadeEffectAction();
      }
      function assistColorBlind() {
        return new AssistColorBlindEffectAction();
      }
      function simulateColorBlind() {
        return new SimulateColorBlindEffectAction();
      }
      function deshake(pixels) {
        return new DeshakeEffectAction("deshake", pixels);
      }
      function transition() {
        return new SimpleEffectAction("transition");
      }
      function pixelate(squareSize) {
        return new Pixelate(squareSize);
      }
      function removeBackground() {
        return new RemoveBackgroundAction();
      }
      function theme(color2) {
        return new ThemeEffect(color2);
      }
      var Effect = {
        pixelate,
        deshake,
        boomerang,
        advancedRedEye,
        blackwhite,
        negate,
        redEye,
        reverse,
        accelerate,
        fadeIn,
        fadeOut,
        loop,
        makeTransparent,
        noise,
        vignette,
        blur,
        grayscale,
        sepia,
        shadow,
        colorize,
        oilPaint,
        artisticFilter,
        cartoonify,
        outline,
        styleTransfer,
        gradientFade,
        vectorize,
        assistColorBlind,
        simulateColorBlind,
        transition,
        dither,
        removeBackground,
        theme
      };
      var QUALIFIER_KEY = "a";
      var RotateAction = function(_super) {
        __extends(RotateAction2, _super);
        function RotateAction2(angle) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier(QUALIFIER_KEY, angle));
          return _this;
        }
        RotateAction2.prototype.mode = function(rotationMode) {
          return this.addValueToQualifier(QUALIFIER_KEY, rotationMode);
        };
        RotateAction2.prototype.angle = function(degrees) {
          return this.addValueToQualifier(QUALIFIER_KEY, degrees);
        };
        return RotateAction2;
      }(Action);
      function byAngle(angle) {
        return new RotateAction(angle);
      }
      function mode(rotationMode) {
        return new RotateAction().mode(rotationMode);
      }
      var Rotate = { byAngle, mode };
      var FillLightAction = function(_super) {
        __extends(FillLightAction2, _super);
        function FillLightAction2() {
          return _super.call(this) || this;
        }
        FillLightAction2.prototype.blend = function(blend) {
          this.lvl = blend;
          return this;
        };
        FillLightAction2.prototype.bias = function(biasLvl) {
          this.biasLvl = biasLvl;
          return this;
        };
        FillLightAction2.prototype.prepareQualifiers = function() {
          var qualifierValue = new QualifierValue(["fill_light", this.lvl, this.biasLvl]).setDelimiter(":");
          this.addQualifier(new Qualifier("e", qualifierValue));
          return this;
        };
        return FillLightAction2;
      }(Action);
      var RecolorAction = function(_super) {
        __extends(RecolorAction2, _super);
        function RecolorAction2(recolorMatrix) {
          var _this = _super.call(this) || this;
          _this.matrix = recolorMatrix;
          var flat = [];
          for (var row = 0; row < recolorMatrix.length; row++) {
            for (var col = 0; col < recolorMatrix[row].length; col++) {
              flat.push(recolorMatrix[row][col].toString());
            }
          }
          var qualifierValue = new QualifierValue(__spreadArrays(["recolor"], flat)).setDelimiter(":");
          _this.addQualifier(new Qualifier("e", qualifierValue));
          return _this;
        }
        return RecolorAction2;
      }(Action);
      var OpacityAdjustAction = function(_super) {
        __extends(OpacityAdjustAction2, _super);
        function OpacityAdjustAction2(level) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("o", level));
          return _this;
        }
        return OpacityAdjustAction2;
      }(Action);
      var By3dLutAction = function(_super) {
        __extends(By3dLutAction2, _super);
        function By3dLutAction2(publicId) {
          var _this = _super.call(this) || this;
          _this.publicId = publicId;
          return _this;
        }
        By3dLutAction2.prototype.toString = function() {
          return "l_lut:" + this.publicId + "/fl_layer_apply";
        };
        return By3dLutAction2;
      }(Action);
      var ImproveAction = function(_super) {
        __extends(ImproveAction2, _super);
        function ImproveAction2() {
          return _super.call(this) || this;
        }
        ImproveAction2.prototype.mode = function(value) {
          this.modeValue = value;
          return this;
        };
        ImproveAction2.prototype.blend = function(value) {
          this.blendValue = value;
          return this;
        };
        ImproveAction2.prototype.prepareQualifiers = function() {
          var qualifierValue = new QualifierValue(["improve", this.modeValue, this.blendValue]).setDelimiter(":");
          this.addQualifier(new Qualifier("e", qualifierValue));
          return this;
        };
        return ImproveAction2;
      }(Action);
      var ReplaceColorAction = function(_super) {
        __extends(ReplaceColorAction2, _super);
        function ReplaceColorAction2(toColor) {
          var _this = _super.call(this) || this;
          _this.targetColor = toColor;
          return _this;
        }
        ReplaceColorAction2.prototype.tolerance = function(toleranceLevel) {
          this.toleranceLevel = toleranceLevel;
          return this;
        };
        ReplaceColorAction2.prototype.fromColor = function(baseColor) {
          this.baseColor = baseColor;
          return this;
        };
        ReplaceColorAction2.prototype.prepareQualifiers = function() {
          var targetColor = this.targetColor && this.targetColor.toString().replace("#", "");
          var baseColor = this.baseColor && this.baseColor.toString().replace("#", "");
          var qualifierValue = new QualifierValue(["replace_color", targetColor, this.toleranceLevel, baseColor]);
          this.addQualifier(new Qualifier("e", qualifierValue));
          return this;
        };
        return ReplaceColorAction2;
      }(Action);
      var EffectActionWithBlend = function(_super) {
        __extends(EffectActionWithBlend2, _super);
        function EffectActionWithBlend2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        EffectActionWithBlend2.prototype.blend = function(value) {
          return this.setLevel(value);
        };
        return EffectActionWithBlend2;
      }(LeveledEffectAction);
      var ViesusCorrectAdjustAction = function(_super) {
        __extends(ViesusCorrectAdjustAction2, _super);
        function ViesusCorrectAdjustAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ViesusCorrectAdjustAction2.prototype.noRedEye = function() {
          this._noRedEye = true;
          return this;
        };
        ViesusCorrectAdjustAction2.prototype.skinSaturation = function(level) {
          this._skinSaturation = true;
          if (level) {
            this._skinSaturationLevel = level;
          }
          return this;
        };
        ViesusCorrectAdjustAction2.prototype.prepareQualifiers = function() {
          var value = "viesus_correct";
          if (this._noRedEye) {
            value += ":no_redeye";
          }
          if (this._skinSaturation) {
            value += ":skin_saturation";
            if (typeof this._skinSaturationLevel !== "undefined") {
              value += "_" + this._skinSaturationLevel;
            }
          }
          this.addQualifier(new Qualifier("e", value));
        };
        return ViesusCorrectAdjustAction2;
      }(Action);
      function tint(value) {
        if (value === void 0) {
          value = "";
        }
        return new SimpleEffectAction("tint", value);
      }
      function brightness(level) {
        return new EffectActionWithLevel("brightness", level);
      }
      function viesusCorrect() {
        return new ViesusCorrectAdjustAction();
      }
      function red(level) {
        return new EffectActionWithLevel("red", level);
      }
      function sharpen(strength) {
        return new EffectActionWithStrength("sharpen", strength);
      }
      function saturation(level) {
        return new EffectActionWithLevel("saturation", level);
      }
      function contrast(level) {
        return new EffectActionWithLevel("contrast", level);
      }
      function gamma(level) {
        return new EffectActionWithLevel("gamma", level);
      }
      function blue(level) {
        return new EffectActionWithLevel("blue", level);
      }
      function brightnessHSB(level) {
        return new EffectActionWithLevel("brightness_hsb", level);
      }
      function opacityThreshold(level) {
        return new EffectActionWithLevel("opacity_threshold", level);
      }
      function autoColor(blend) {
        return new EffectActionWithBlend("auto_color", blend);
      }
      function autoBrightness(blend) {
        return new EffectActionWithBlend("auto_brightness", blend);
      }
      function hue(level) {
        return new EffectActionWithLevel("hue", level);
      }
      function green(level) {
        return new EffectActionWithLevel("green", level);
      }
      function unsharpMask(strength) {
        return new EffectActionWithStrength("unsharp_mask", strength);
      }
      function vibrance(strength) {
        return new EffectActionWithStrength("vibrance", strength);
      }
      function autoContrast(blend) {
        return new EffectActionWithBlend("auto_contrast", blend);
      }
      function opacity(level) {
        return new OpacityAdjustAction(level);
      }
      function improve() {
        return new ImproveAction();
      }
      function replaceColor(toColor) {
        return new ReplaceColorAction(toColor);
      }
      function recolor(matrix) {
        return new RecolorAction(matrix);
      }
      function fillLight() {
        return new FillLightAction();
      }
      function by3dLut(publicId) {
        return new By3dLutAction(publicId);
      }
      var Adjust = {
        brightness,
        viesusCorrect,
        opacity,
        red,
        sharpen,
        improve,
        saturation,
        contrast,
        gamma,
        green,
        blue,
        brightnessHSB,
        hue,
        autoBrightness,
        autoColor,
        autoContrast,
        vibrance,
        unsharpMask,
        opacityThreshold,
        replaceColor,
        recolor,
        fillLight,
        by3dLut,
        tint
      };
      var TrimAction = function(_super) {
        __extends(TrimAction2, _super);
        function TrimAction2() {
          return _super.call(this) || this;
        }
        TrimAction2.prototype.parseVal = function(val) {
          return typeof val === "number" ? val : val.replace("%", "p");
        };
        TrimAction2.prototype.startOffset = function(offset) {
          return this.addQualifier(new Qualifier("so", this.parseVal(offset)));
        };
        TrimAction2.prototype.endOffset = function(offset) {
          return this.addQualifier(new Qualifier("eo", this.parseVal(offset)));
        };
        TrimAction2.prototype.duration = function(duration) {
          return this.addQualifier(new Qualifier("du", this.parseVal(duration)));
        };
        return TrimAction2;
      }(Action);
      var BackgroundColor = function(_super) {
        __extends(BackgroundColor2, _super);
        function BackgroundColor2(color2) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("b", new QualifierValue(color2).setDelimiter("_")));
          return _this;
        }
        return BackgroundColor2;
      }(Action);
      var RawAction = function() {
        function RawAction2(raw) {
          this.raw = raw;
        }
        RawAction2.prototype.toString = function() {
          return this.raw;
        };
        return RawAction2;
      }();
      var Transformation$2 = function() {
        function Transformation2() {
          this.actions = [];
        }
        Transformation2.prototype.addAction = function(action) {
          var actionToAdd;
          if (typeof action === "string") {
            if (action.indexOf("/") >= 0) {
              throw "addAction cannot accept a string with a forward slash in it - /, use .addTransformation() instead";
            } else {
              actionToAdd = new RawAction(action);
            }
          } else {
            actionToAdd = action;
          }
          this.actions.push(actionToAdd);
          return this;
        };
        Transformation2.prototype.addTransformation = function(tx) {
          if (tx instanceof Transformation2) {
            this.actions = this.actions.concat(tx.actions);
          } else {
            this.actions.push(new RawAction(tx));
          }
          return this;
        };
        Transformation2.prototype.toString = function() {
          return this.actions.map(function(action) {
            return action.toString();
          }).filter(function(a) {
            return a;
          }).join("/");
        };
        Transformation2.prototype.animated = function(animatedAction) {
          return this.addAction(animatedAction);
        };
        Transformation2.prototype.border = function(borderAction) {
          return this.addAction(borderAction);
        };
        Transformation2.prototype.reshape = function(reshapeAction) {
          return this.addAction(reshapeAction);
        };
        Transformation2.prototype.resize = function(resizeAction) {
          return this.addAction(resizeAction);
        };
        Transformation2.prototype.quality = function(quality2) {
          return this.addAction(quality2);
        };
        Transformation2.prototype.roundCorners = function(roundCornersAction) {
          return this.addAction(roundCornersAction);
        };
        Transformation2.prototype.overlay = function(overlayAction) {
          return this.addAction(overlayAction);
        };
        Transformation2.prototype.underlay = function(underlayAction) {
          underlayAction.setLayerType("u");
          return this.addAction(underlayAction);
        };
        Transformation2.prototype.addVariable = function(variableAction) {
          return this.addAction(variableAction);
        };
        Transformation2.prototype.conditional = function(conditionAction) {
          return this.addAction(conditionAction);
        };
        Transformation2.prototype.effect = function(effectAction) {
          return this.addAction(effectAction);
        };
        Transformation2.prototype.adjust = function(action) {
          return this.addAction(action);
        };
        Transformation2.prototype.rotate = function(rotateAction) {
          return this.addAction(rotateAction);
        };
        Transformation2.prototype.namedTransformation = function(namedTransformation) {
          return this.addAction(namedTransformation);
        };
        Transformation2.prototype.delivery = function(deliveryAction) {
          return this.addAction(deliveryAction);
        };
        Transformation2.prototype.backgroundColor = function(color2) {
          return this.addAction(new BackgroundColor(prepareColor(color2)));
        };
        Transformation2.prototype.psdTools = function(action) {
          return this.addAction(action);
        };
        Transformation2.prototype.extract = function(action) {
          return this.addAction(action);
        };
        Transformation2.prototype.addFlag = function(flagQualifier) {
          var action = new Action();
          var flagToAdd = flagQualifier;
          if (typeof flagQualifier === "string") {
            flagToAdd = new FlagQualifier(flagQualifier);
          }
          action.addQualifier(flagToAdd);
          return this.addAction(action);
        };
        Transformation2.prototype.customFunction = function(customFunction) {
          return this.addAction(customFunction);
        };
        Transformation2.prototype.transcode = function(action) {
          return this.addAction(action);
        };
        Transformation2.prototype.videoEdit = function(action) {
          return this.addAction(action);
        };
        return Transformation2;
      }();
      var ConcatenateAction = function(_super) {
        __extends(ConcatenateAction2, _super);
        function ConcatenateAction2(source2) {
          var _this = _super.call(this) || this;
          _this.concatSource = source2;
          return _this;
        }
        ConcatenateAction2.prototype.transition = function(source2) {
          this._transition = source2;
          return this;
        };
        ConcatenateAction2.prototype.prepend = function() {
          this._prepend = true;
          return this;
        };
        ConcatenateAction2.prototype.duration = function(sec) {
          this._duration = sec;
          return this;
        };
        ConcatenateAction2.prototype.getTransitionString = function() {
          var transTx = this._transition.getTransformation();
          return [
            "e_transition," + this._transition.getOpenSourceString("l"),
            transTx && transTx.toString(),
            "fl_layer_apply"
          ].filter(function(a) {
            return a;
          }).join("/");
        };
        ConcatenateAction2.prototype.toString = function() {
          var open = [
            this._duration && "du_" + this._duration,
            !this._transition && "fl_splice",
            "" + this.concatSource.getOpenSourceString("l")
          ].filter(function(a) {
            return a;
          }).join(",");
          var close = [
            "fl_layer_apply",
            this._prepend && "so_0"
          ].filter(function(a) {
            return a;
          }).join(",");
          var concatSourceTx;
          if (this.concatSource.getTransformation()) {
            concatSourceTx = this.concatSource.getTransformation();
          } else {
            concatSourceTx = new Transformation$2();
          }
          if (this._transition) {
            concatSourceTx.addTransformation(this.getTransitionString());
          }
          return [
            open,
            concatSourceTx.toString(),
            close
          ].filter(function(a) {
            return a;
          }).join("/");
        };
        return ConcatenateAction2;
      }(Action);
      var VolumeAction = function(_super) {
        __extends(VolumeAction2, _super);
        function VolumeAction2(volumeValue) {
          var _this = _super.call(this) || this;
          var qualifierValue = new QualifierValue(["volume", volumeValue]).setDelimiter(":");
          _this.addQualifier(new Qualifier("e", qualifierValue));
          return _this;
        }
        return VolumeAction2;
      }(Action);
      var PreviewAction = function(_super) {
        __extends(PreviewAction2, _super);
        function PreviewAction2() {
          return _super.call(this) || this;
        }
        PreviewAction2.prototype.minimumSegmentDuration = function(minSegDuration) {
          this._minSeg = minSegDuration;
          return this;
        };
        PreviewAction2.prototype.maximumSegments = function(maxSeg) {
          this._maxSeg = maxSeg;
          return this;
        };
        PreviewAction2.prototype.duration = function(duration) {
          this._duration = duration;
          return this;
        };
        PreviewAction2.prototype.toString = function() {
          return [
            "e_preview",
            this._duration && "duration_" + toFloatAsString(this._duration),
            this._maxSeg && "max_seg_" + this._maxSeg,
            this._minSeg && "min_seg_dur_" + toFloatAsString(this._minSeg)
          ].filter(function(a) {
            return a;
          }).join(":");
        };
        return PreviewAction2;
      }(Action);
      function concatenate(source2) {
        return new ConcatenateAction(source2);
      }
      function trim() {
        return new TrimAction();
      }
      function volume(volumeValue) {
        return new VolumeAction(volumeValue);
      }
      function preview() {
        return new PreviewAction();
      }
      var VideoEdit = { concatenate, trim, volume, preview };
      var LayerAction = function(_super) {
        __extends(LayerAction2, _super);
        function LayerAction2(layerSource) {
          var _this = _super.call(this) || this;
          _this.source = layerSource;
          return _this;
        }
        LayerAction2.prototype.setLayerType = function(type) {
          this.layerType = type;
          return this;
        };
        LayerAction2.prototype.timeline = function(timelinePosition) {
          this._timelinePosition = timelinePosition;
          return this;
        };
        LayerAction2.prototype.position = function(position) {
          this._position = position;
          return this;
        };
        LayerAction2.prototype.blendMode = function(blendMode) {
          this._blendMode = blendMode;
          return this;
        };
        LayerAction2.prototype.closeLayer = function() {
          var _a, _b, _c, _d;
          var bit = new Action().addFlag(new FlagQualifier("layer_apply"));
          (_a = this._position) === null || _a === void 0 ? void 0 : _a.qualifiers.forEach(function(qualifier) {
            bit.addQualifier(qualifier);
          });
          (_b = this._position) === null || _b === void 0 ? void 0 : _b.flags.forEach(function(flag) {
            bit.addFlag(flag);
          });
          if (typeof this._blendMode === "string") {
            bit.addQualifier(new Qualifier("e", this._blendMode));
          } else {
            (_c = this._blendMode) === null || _c === void 0 ? void 0 : _c.qualifiers.forEach(function(qualifier) {
              bit.addQualifier(qualifier);
            });
          }
          (_d = this._timelinePosition) === null || _d === void 0 ? void 0 : _d.qualifiers.forEach(function(qualifier) {
            bit.addQualifier(qualifier);
          });
          return bit;
        };
        LayerAction2.prototype.openLayer = function() {
          return "" + this.source.getOpenSourceString(this.layerType);
        };
        LayerAction2.prototype.toString = function() {
          return [
            this.openLayer(),
            this.source.getTransformation() && this.source.getTransformation().toString(),
            this.closeLayer()
          ].filter(function(a) {
            return a;
          }).join("/");
        };
        return LayerAction2;
      }(Action);
      function source$1(source2) {
        return new LayerAction(source2).setLayerType("l");
      }
      var Overlay = { source: source$1 };
      function source(source2) {
        return new LayerAction(source2).setLayerType("u");
      }
      var Underlay = { source };
      var NamedTransformationAction = function(_super) {
        __extends(NamedTransformationAction2, _super);
        function NamedTransformationAction2(name2) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("t", name2));
          return _this;
        }
        return NamedTransformationAction2;
      }(Action);
      function name$1(name2) {
        return new NamedTransformationAction(name2);
      }
      var NamedTransformation = { name: name$1 };
      var DeliveryAction = function(_super) {
        __extends(DeliveryAction2, _super);
        function DeliveryAction2(deliveryKey, deliveryType) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier(deliveryKey, deliveryType));
          return _this;
        }
        return DeliveryAction2;
      }(Action);
      var ProgressiveQualifier = function(_super) {
        __extends(ProgressiveQualifier2, _super);
        function ProgressiveQualifier2(mode2) {
          return _super.call(this, "progressive", mode2) || this;
        }
        return ProgressiveQualifier2;
      }(FlagQualifier);
      var DeliveryFormat = function(_super) {
        __extends(DeliveryFormat2, _super);
        function DeliveryFormat2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        DeliveryFormat2.prototype.lossy = function() {
          this.addFlag(lossy());
          return this;
        };
        DeliveryFormat2.prototype.progressive = function(mode2) {
          if (mode2 instanceof ProgressiveQualifier) {
            this.addFlag(mode2);
          } else {
            this.addFlag(progressive(mode2));
          }
          return this;
        };
        DeliveryFormat2.prototype.preserveTransparency = function() {
          this.addFlag(preserveTransparency());
          return this;
        };
        return DeliveryFormat2;
      }(DeliveryAction);
      var DeliveryQualityAction = function(_super) {
        __extends(DeliveryQualityAction2, _super);
        function DeliveryQualityAction2(qualityValue) {
          var _this = _super.call(this, "q", qualityValue.toString()) || this;
          _this.qualityValue = qualityValue;
          return _this;
        }
        DeliveryQualityAction2.prototype.chromaSubSampling = function(type) {
          var qualityWithSubSampling = new QualifierValue([this.qualityValue, type]);
          qualityWithSubSampling.setDelimiter(":");
          return this.addQualifier(new Qualifier("q", qualityWithSubSampling));
        };
        DeliveryQualityAction2.prototype.quantization = function(val) {
          var qualityWithQuantization = new QualifierValue([this.qualityValue, "qmax_" + val]);
          qualityWithQuantization.setDelimiter(":");
          return this.addQualifier(new Qualifier("q", qualityWithQuantization));
        };
        return DeliveryQualityAction2;
      }(DeliveryAction);
      var DeliveryColorSpaceFromICC = function(_super) {
        __extends(DeliveryColorSpaceFromICC2, _super);
        function DeliveryColorSpaceFromICC2(publicId) {
          var _this = _super.call(this) || this;
          var qualifierValue = new QualifierValue(["icc", publicId]).setDelimiter(":");
          _this.addQualifier(new Qualifier("cs", qualifierValue));
          return _this;
        }
        return DeliveryColorSpaceFromICC2;
      }(Action);
      function format2(format3) {
        return new DeliveryFormat("f", format3);
      }
      function dpr(dpr2) {
        return new DeliveryAction("dpr", toFloatAsString(dpr2));
      }
      function quality(qualityType) {
        return new DeliveryQualityAction(qualityType);
      }
      function density(value) {
        return new DeliveryAction("dn", value);
      }
      function defaultImage(publicIdWithExtension) {
        return new DeliveryAction("d", publicIdWithExtension);
      }
      function colorSpace(mode2) {
        return new DeliveryAction("cs", mode2);
      }
      function colorSpaceFromICC(publicId) {
        return new DeliveryColorSpaceFromICC(publicId);
      }
      var Delivery = {
        format: format2,
        dpr,
        density,
        defaultImage,
        colorSpace,
        colorSpaceFromICC,
        quality
      };
      function base64Encode(input) {
        var encodedResult = "";
        if (typeof window !== "undefined") {
          encodedResult = btoa(encodeURI(decodeURI(input)));
        } else {
          encodedResult = global.Buffer.from(input).toString("base64");
        }
        return encodedResult.replace(/\+/g, "-").replace(/\//g, "_");
      }
      var CustomFunctionAction = function(_super) {
        __extends(CustomFunctionAction2, _super);
        function CustomFunctionAction2(fn) {
          var _this = _super.call(this) || this;
          _this.fn = fn;
          return _this;
        }
        CustomFunctionAction2.prototype.encodeCustomFunctionString = function(fn) {
          var encodedSource = base64Encode(fn);
          return encodedSource;
        };
        CustomFunctionAction2.prototype.asWasm = function() {
          this.mode = "wasm";
          return this;
        };
        CustomFunctionAction2.prototype.asRemote = function() {
          this.mode = "remote";
          return this;
        };
        CustomFunctionAction2.prototype.prepareQualifiers = function() {
          this.encodedFn = this.fn;
          if (this.mode === "remote") {
            this.encodedFn = this.encodeCustomFunctionString(this.fn);
          }
          return this.addQualifier(new Qualifier("fn", new QualifierValue([this.pre, this.mode, this.encodedFn])));
        };
        CustomFunctionAction2.prototype.toString = function() {
          return _super.prototype.toString.call(this).replace(/\//g, ":");
        };
        return CustomFunctionAction2;
      }(Action);
      var RemoteAction = function(_super) {
        __extends(RemoteAction2, _super);
        function RemoteAction2(fn) {
          return _super.call(this, fn) || this;
        }
        RemoteAction2.prototype.preprocess = function() {
          this.pre = "pre";
          return this;
        };
        return RemoteAction2;
      }(CustomFunctionAction);
      function remote(path) {
        return new RemoteAction(path).asRemote();
      }
      function wasm(publicID) {
        return new CustomFunctionAction(publicID).asWasm();
      }
      var CustomFunction = { remote, wasm };
      var BitRateAction = function(_super) {
        __extends(BitRateAction2, _super);
        function BitRateAction2(bitRate2) {
          var _this = _super.call(this) || this;
          _this.isConstant = false;
          _this.bitRate = bitRate2;
          return _this;
        }
        BitRateAction2.prototype.constant = function() {
          this.isConstant = true;
          return this;
        };
        BitRateAction2.prototype.prepareQualifiers = function() {
          var qualifierValue;
          if (this.isConstant) {
            qualifierValue = new QualifierValue([this.bitRate, "constant"]).setDelimiter(":");
          } else {
            qualifierValue = new QualifierValue(this.bitRate);
          }
          this.addQualifier(new Qualifier("br", qualifierValue));
          return this;
        };
        return BitRateAction2;
      }(Action);
      var AudioCodecAction = function(_super) {
        __extends(AudioCodecAction2, _super);
        function AudioCodecAction2(codec) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("ac", codec));
          return _this;
        }
        return AudioCodecAction2;
      }(Action);
      var AudioFrequencyAction = function(_super) {
        __extends(AudioFrequencyAction2, _super);
        function AudioFrequencyAction2(freq) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("af", freq));
          return _this;
        }
        return AudioFrequencyAction2;
      }(Action);
      var FPSAction = function(_super) {
        __extends(FPSAction2, _super);
        function FPSAction2(from) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("fps", from));
          return _this;
        }
        return FPSAction2;
      }(Action);
      var FPSRangeAction = function(_super) {
        __extends(FPSRangeAction2, _super);
        function FPSRangeAction2(from, to) {
          var _this = _super.call(this) || this;
          _this.from = from;
          _this.to = to;
          return _this;
        }
        FPSRangeAction2.prototype.prepareQualifiers = function() {
          var qualifierValue;
          if (this.from && this.to) {
            qualifierValue = new QualifierValue(this.from + "-" + this.to);
          } else {
            qualifierValue = new QualifierValue(this.from + "-");
          }
          this.addQualifier(new Qualifier("fps", qualifierValue));
          return this;
        };
        return FPSRangeAction2;
      }(Action);
      var KeyframeIntervalsAction = function(_super) {
        __extends(KeyframeIntervalsAction2, _super);
        function KeyframeIntervalsAction2(interval) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("ki", toFloatAsString(interval)));
          return _this;
        }
        return KeyframeIntervalsAction2;
      }(Action);
      var StreamingProfileAction = function(_super) {
        __extends(StreamingProfileAction2, _super);
        function StreamingProfileAction2(profile) {
          var _this = _super.call(this) || this;
          _this.addQualifier(new Qualifier("sp", profile));
          return _this;
        }
        return StreamingProfileAction2;
      }(Action);
      var ToAnimatedAction = function(_super) {
        __extends(ToAnimatedAction2, _super);
        function ToAnimatedAction2(animatedFormat) {
          if (animatedFormat === void 0) {
            animatedFormat = "";
          }
          var _this = _super.call(this) || this;
          if (animatedFormat.toString() === "webp") {
            _this.addFlag(animatedWebP());
          }
          _this.addFlag(animated());
          if (animatedFormat) {
            _this.addQualifier(new Qualifier("f", animatedFormat));
          }
          return _this;
        }
        ToAnimatedAction2.prototype.delay = function(delayValue) {
          this.addQualifier(new Qualifier("dl", delayValue));
          return this;
        };
        ToAnimatedAction2.prototype.sampling = function(sampling) {
          this.addQualifier(new Qualifier("vs", sampling));
          return this;
        };
        return ToAnimatedAction2;
      }(Action);
      var VideoCodecAction = function(_super) {
        __extends(VideoCodecAction2, _super);
        function VideoCodecAction2(videoCodecTypeQualifier) {
          var _this = _super.call(this) || this;
          _this.addQualifier(videoCodecTypeQualifier);
          return _this;
        }
        return VideoCodecAction2;
      }(Action);
      function audioFrequency(freq) {
        return new AudioFrequencyAction(freq);
      }
      function audioCodec(codec) {
        return new AudioCodecAction(codec);
      }
      function bitRate(bitRate2) {
        return new BitRateAction(bitRate2);
      }
      function fps(from) {
        return new FPSAction(from);
      }
      function fpsRange(from, to) {
        return new FPSRangeAction(from, to);
      }
      function keyframeInterval(interval) {
        return new KeyframeIntervalsAction(interval);
      }
      function streamingProfile(profile) {
        return new StreamingProfileAction(profile);
      }
      function toAnimated(animatedFormat) {
        if (animatedFormat === void 0) {
          animatedFormat = "";
        }
        return new ToAnimatedAction(animatedFormat);
      }
      function videoCodec(videoCodecType) {
        return new VideoCodecAction(videoCodecType);
      }
      var Transcode = { bitRate, audioCodec, audioFrequency, fps, fpsRange, keyframeInterval, streamingProfile, toAnimated, videoCodec };
      var ClipAction = function(_super) {
        __extends(ClipAction2, _super);
        function ClipAction2() {
          var _this = _super.call(this) || this;
          _this.isEvenOdd = false;
          return _this;
        }
        ClipAction2.prototype.byName = function(path) {
          this.path = path;
          return this;
        };
        ClipAction2.prototype.byIndex = function(path) {
          this.path = path;
          return this;
        };
        ClipAction2.prototype.evenOdd = function() {
          this.isEvenOdd = true;
          return this;
        };
        ClipAction2.prototype.prepareQualifiers = function() {
          var qualifierValue;
          if (typeof this.path === "string") {
            qualifierValue = new QualifierValue(["name", this.path]).setDelimiter(":");
          } else {
            qualifierValue = new QualifierValue(this.path);
          }
          if (this.isEvenOdd) {
            this.addFlag(clipEvenOdd());
          } else {
            this.addFlag(clip$1());
          }
          this.addQualifier(new Qualifier("pg", qualifierValue));
          return this;
        };
        return ClipAction2;
      }(Action);
      var GetLayerAction = function(_super) {
        __extends(GetLayerAction2, _super);
        function GetLayerAction2() {
          var _this = _super.call(this) || this;
          _this.qualifierValue = new QualifierValue();
          _this.qualifierValue.delimiter = ";";
          return _this;
        }
        GetLayerAction2.prototype.byIndex = function(from) {
          this.qualifierValue.addValue(from);
          return this;
        };
        GetLayerAction2.prototype.byRange = function(from, to) {
          var range = new QualifierValue(from);
          range.addValue(to);
          range.delimiter = "-";
          this.qualifierValue.addValue(range);
          return this;
        };
        GetLayerAction2.prototype.byName = function(name2) {
          this.name = name2;
          this.qualifierValue.addValue(name2);
          return this;
        };
        GetLayerAction2.prototype.prepareQualifiers = function() {
          var qualifierValue = this.qualifierValue;
          if (this.name) {
            qualifierValue = new QualifierValue(["name", this.qualifierValue]).setDelimiter(":");
          }
          this.addQualifier(new Qualifier("pg", qualifierValue));
          return this;
        };
        return GetLayerAction2;
      }(Action);
      var SmartObjectAction = function(_super) {
        __extends(SmartObjectAction2, _super);
        function SmartObjectAction2() {
          var _this = _super.call(this) || this;
          _this.qualifierValue = new QualifierValue();
          _this.useName = false;
          _this.qualifierValue.delimiter = ";";
          return _this;
        }
        SmartObjectAction2.prototype.byIndex = function(index2) {
          this.smartObjectValue = index2;
          this.qualifierValue.addValue(index2);
          return this;
        };
        SmartObjectAction2.prototype.byLayerName = function(layerName) {
          this.useName = true;
          this.qualifierValue.addValue(layerName);
          return this;
        };
        SmartObjectAction2.prototype.prepareQualifiers = function() {
          var qualifierValue;
          if (this.useName) {
            qualifierValue = new QualifierValue(["embedded:name", this.qualifierValue]);
          } else {
            qualifierValue = new QualifierValue(["embedded", this.qualifierValue]);
          }
          this.addQualifier(new Qualifier("pg", qualifierValue));
        };
        return SmartObjectAction2;
      }(Action);
      function clip() {
        return new ClipAction();
      }
      function getLayer() {
        return new GetLayerAction();
      }
      function smartObject() {
        return new SmartObjectAction();
      }
      var PSDTools = { clip, getLayer, smartObject };
      var AnimatedAction = function(_super) {
        __extends(AnimatedAction2, _super);
        function AnimatedAction2() {
          return _super.call(this) || this;
        }
        AnimatedAction2.prototype.delay = function(delayValue) {
          this.addQualifier(new Qualifier("dl", delayValue));
          return this;
        };
        AnimatedAction2.prototype.loop = function(additionalLoops) {
          var qualifierValue = new QualifierValue(["loop", additionalLoops]).setDelimiter(":");
          this.addQualifier(new Qualifier("e", qualifierValue));
          return this;
        };
        return AnimatedAction2;
      }(Action);
      function edit() {
        return new AnimatedAction();
      }
      var Animated = {
        edit
      };
      var Actions = {
        Resize,
        Border,
        RoundCorners,
        Effect,
        Rotate,
        Adjust,
        Overlay,
        Underlay,
        NamedTransformation,
        Delivery,
        CustomFunction,
        VideoEdit,
        Transcode,
        PSDTools,
        Animated
      };
      var AnimatedFormatQualifierValue = function(_super) {
        __extends(AnimatedFormatQualifierValue2, _super);
        function AnimatedFormatQualifierValue2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        return AnimatedFormatQualifierValue2;
      }(QualifierValue);
      function auto$4() {
        return new AnimatedFormatQualifierValue("auto");
      }
      function gif$1() {
        return new AnimatedFormatQualifierValue("gif");
      }
      function webp$1() {
        return new AnimatedFormatQualifierValue("webp");
      }
      function png$1() {
        return new AnimatedFormatQualifierValue("png");
      }
      var AnimatedFormat = { auto: auto$4, gif: gif$1, webp: webp$1, png: png$1 };
      function alDente() {
        return "al_dente";
      }
      function athena() {
        return "athena";
      }
      function audrey() {
        return "audrey";
      }
      function aurora() {
        return "aurora";
      }
      function daguerre() {
        return "daguerre";
      }
      function eucalyptus() {
        return "eucalyptus";
      }
      function fes() {
        return "fes";
      }
      function frost() {
        return "frost";
      }
      function hairspray() {
        return "hairspray";
      }
      function hokusai() {
        return "hokusai";
      }
      function incognito() {
        return "incognito";
      }
      function linen() {
        return "linen";
      }
      function peacock() {
        return "peacock";
      }
      function primavera() {
        return "primavera";
      }
      function quartz() {
        return "quartz";
      }
      function redRock() {
        return "red_rock";
      }
      function refresh() {
        return "refresh";
      }
      function sizzle() {
        return "sizzle";
      }
      function sonnet() {
        return "sonnet";
      }
      function ukulele() {
        return "ukulele";
      }
      function zorro() {
        return "zorro";
      }
      var ArtisticFilter = {
        alDente,
        athena,
        audrey,
        aurora,
        daguerre,
        eucalyptus,
        hairspray,
        hokusai,
        peacock,
        primavera,
        quartz,
        incognito,
        redRock,
        sizzle,
        fes,
        linen,
        refresh,
        sonnet,
        ukulele,
        frost,
        zorro
      };
      function ar1X1() {
        return new AspectRatioQualifierValue("1:1");
      }
      function ar5X4() {
        return new AspectRatioQualifierValue("5:4");
      }
      function ar4X3() {
        return new AspectRatioQualifierValue("4:3");
      }
      function ar3X2() {
        return new AspectRatioQualifierValue("3:2");
      }
      function ar16X9() {
        return new AspectRatioQualifierValue("16:9");
      }
      function ar3X1() {
        return new AspectRatioQualifierValue("3:1");
      }
      function ignoreInitialAspectRatio() {
        return ignoreInitialAspectRatio$1();
      }
      var AspectRatio = {
        ar1X1,
        ar5X4,
        ar3X1,
        ar3X2,
        ar4X3,
        ar16X9,
        ignoreInitialAspectRatio
      };
      function none$1() {
        return "none";
      }
      function aac() {
        return "aac";
      }
      function vorbis() {
        return "vorbis";
      }
      function mp3() {
        return "mp3";
      }
      function opus() {
        return "opus";
      }
      var AudioCodec = {
        aac,
        mp3,
        opus,
        none: none$1,
        vorbis
      };
      function ORIGINAL() {
        return "iaf";
      }
      function FREQ192000() {
        return 192e3;
      }
      function FREQ176400() {
        return 176400;
      }
      function FREQ96000() {
        return 96e3;
      }
      function FREQ88200() {
        return 88200;
      }
      function FREQ48000() {
        return 48e3;
      }
      function FREQ8000() {
        return 8e3;
      }
      function FREQ11025() {
        return 11025;
      }
      function FREQ16000() {
        return 16e3;
      }
      function FREQ22050() {
        return 22050;
      }
      function FREQ32000() {
        return 32e3;
      }
      function FREQ37800() {
        return 37800;
      }
      function FREQ44056() {
        return 44056;
      }
      function FREQ44100() {
        return 44100;
      }
      function FREQ47250() {
        return 47250;
      }
      var AudioFrequency = {
        FREQ8000,
        FREQ11025,
        FREQ16000,
        FREQ22050,
        FREQ32000,
        FREQ37800,
        FREQ44056,
        FREQ44100,
        FREQ47250,
        FREQ48000,
        FREQ88200,
        FREQ96000,
        FREQ176400,
        FREQ192000,
        ORIGINAL
      };
      var BackgroundQualifier = function(_super) {
        __extends(BackgroundQualifier2, _super);
        function BackgroundQualifier2(backgroundValue) {
          var _this = _super.call(this, "b") || this;
          if (backgroundValue) {
            _this.addValue(backgroundValue);
          }
          return _this;
        }
        return BackgroundQualifier2;
      }(Qualifier);
      var BaseCommonBackground = function(_super) {
        __extends(BaseCommonBackground2, _super);
        function BaseCommonBackground2() {
          var _this = _super.call(this) || this;
          _this._palette = [];
          return _this;
        }
        BaseCommonBackground2.prototype.contrast = function() {
          this._constrast = true;
          return this;
        };
        BaseCommonBackground2.prototype.palette = function() {
          var colors = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            colors[_i] = arguments[_i];
          }
          this._palette = colors.map(function(color2) {
            return prepareColor(color2);
          });
          return this;
        };
        return BaseCommonBackground2;
      }(BackgroundQualifier);
      var BackgroundAutoBorderQualifier = function(_super) {
        __extends(BackgroundAutoBorderQualifier2, _super);
        function BackgroundAutoBorderQualifier2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        BackgroundAutoBorderQualifier2.prototype.toString = function() {
          return ("\n    b_auto:border\n    " + (this._constrast ? "_contrast" : "") + "\n    " + (this._palette.length ? ":palette_" + this._palette.join("_") : "") + "\n    ").replace(/\s+/g, "");
        };
        return BackgroundAutoBorderQualifier2;
      }(BaseCommonBackground);
      var BaseGradientBackground = function(_super) {
        __extends(BaseGradientBackground2, _super);
        function BaseGradientBackground2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        BaseGradientBackground2.prototype.gradientColors = function(num2) {
          this._gradientColors = num2;
          return this;
        };
        BaseGradientBackground2.prototype.gradientDirection = function(direction) {
          this._gradientDirection = direction;
          return this;
        };
        return BaseGradientBackground2;
      }(BaseCommonBackground);
      var BackgroundBorderGradientQualifier = function(_super) {
        __extends(BackgroundBorderGradientQualifier2, _super);
        function BackgroundBorderGradientQualifier2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        BackgroundBorderGradientQualifier2.prototype.toString = function() {
          return ("\n    b_auto:border_gradient\n    " + (this._constrast ? "_contrast" : "") + "\n    " + (this._gradientColors ? ":" + this._gradientColors : "") + "\n    " + (this._gradientDirection ? ":" + this._gradientDirection : "") + "\n    " + (this._palette.length ? ":palette_" + this._palette.join("_") : "") + "\n    ").replace(/\s+/g, "");
        };
        return BackgroundBorderGradientQualifier2;
      }(BaseGradientBackground);
      var BackgroundAutoPredominantQualifier = function(_super) {
        __extends(BackgroundAutoPredominantQualifier2, _super);
        function BackgroundAutoPredominantQualifier2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        BackgroundAutoPredominantQualifier2.prototype.toString = function() {
          return ("\n    b_auto:predominant\n    " + (this._constrast ? "_contrast" : "") + "\n    " + (this._palette.length ? ":palette_" + this._palette.join("_") : "") + "\n    ").replace(/\s+/g, "");
        };
        return BackgroundAutoPredominantQualifier2;
      }(BaseCommonBackground);
      var BackgroundPredominantGradientQualifier = function(_super) {
        __extends(BackgroundPredominantGradientQualifier2, _super);
        function BackgroundPredominantGradientQualifier2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        BackgroundPredominantGradientQualifier2.prototype.toString = function() {
          return ("\n    b_auto:predominant_gradient\n    " + (this._constrast ? "_contrast" : "") + "\n    " + (this._gradientColors ? ":" + this._gradientColors : "") + "\n    " + (this._gradientDirection ? ":" + this._gradientDirection : "") + "\n    " + (this._palette.length ? ":palette_" + this._palette.join("_") : "") + "\n    ").replace(/\s+/g, "");
        };
        return BackgroundPredominantGradientQualifier2;
      }(BaseGradientBackground);
      var BlurredBackgroundAction = function(_super) {
        __extends(BlurredBackgroundAction2, _super);
        function BlurredBackgroundAction2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        BlurredBackgroundAction2.prototype.intensity = function(value) {
          this.intensityLevel = value;
          return this;
        };
        BlurredBackgroundAction2.prototype.brightness = function(value) {
          this.brightnessLevel = value;
          return this;
        };
        BlurredBackgroundAction2.prototype.toString = function() {
          return ("\n    b_blurred\n    " + (this.intensityLevel ? ":" + this.intensityLevel : "") + "\n    " + (this.brightnessLevel ? ":" + this.brightnessLevel : "") + "\n    ").replace(/\s+/g, "");
        };
        return BlurredBackgroundAction2;
      }(BackgroundQualifier);
      function border() {
        return new BackgroundAutoBorderQualifier();
      }
      function auto$3() {
        return new BackgroundQualifier("auto");
      }
      function borderGradient() {
        return new BackgroundBorderGradientQualifier();
      }
      function predominantGradient() {
        return new BackgroundPredominantGradientQualifier();
      }
      function predominant() {
        return new BackgroundAutoPredominantQualifier();
      }
      function color(colorStr) {
        return new BackgroundQualifier(prepareColor(colorStr));
      }
      function blurred() {
        return new BlurredBackgroundAction();
      }
      var Background = {
        auto: auto$3,
        border,
        borderGradient,
        predominantGradient,
        predominant,
        color,
        blurred
      };
      function chroma444() {
        return 444;
      }
      function chroma420() {
        return 420;
      }
      var ChromaSubSampling = {
        chroma444,
        chroma420
      };
      var Color = {
        SNOW: "snow",
        SNOW1: "snow1",
        SNOW2: "snow2",
        ROSYBROWN1: "rosybrown1",
        ROSYBROWN2: "rosybrown2",
        SNOW3: "snow3",
        LIGHTCORAL: "lightcoral",
        INDIANRED1: "indianred1",
        ROSYBROWN3: "rosybrown3",
        INDIANRED2: "indianred2",
        ROSYBROWN: "rosybrown",
        BROWN1: "brown1",
        FIREBRICK1: "firebrick1",
        BROWN2: "brown2",
        INDIANRED: "indianred",
        INDIANRED3: "indianred3",
        FIREBRICK2: "firebrick2",
        SNOW4: "snow4",
        BROWN3: "brown3",
        RED: "red",
        RED1: "red1",
        ROSYBROWN4: "rosybrown4",
        FIREBRICK3: "firebrick3",
        RED2: "red2",
        FIREBRICK: "firebrick",
        BROWN: "brown",
        RED3: "red3",
        INDIANRED4: "indianred4",
        BROWN4: "brown4",
        FIREBRICK4: "firebrick4",
        DARKRED: "darkred",
        RED4: "red4",
        LIGHTPINK1: "lightpink1",
        LIGHTPINK3: "lightpink3",
        LIGHTPINK4: "lightpink4",
        LIGHTPINK2: "lightpink2",
        LIGHTPINK: "lightpink",
        PINK: "pink",
        CRIMSON: "crimson",
        PINK1: "pink1",
        PINK2: "pink2",
        PINK3: "pink3",
        PINK4: "pink4",
        PALEVIOLETRED4: "palevioletred4",
        PALEVIOLETRED: "palevioletred",
        PALEVIOLETRED2: "palevioletred2",
        PALEVIOLETRED1: "palevioletred1",
        PALEVIOLETRED3: "palevioletred3",
        LAVENDERBLUSH: "lavenderblush",
        LAVENDERBLUSH1: "lavenderblush1",
        LAVENDERBLUSH3: "lavenderblush3",
        LAVENDERBLUSH2: "lavenderblush2",
        LAVENDERBLUSH4: "lavenderblush4",
        MAROON: "maroon",
        HOTPINK3: "hotpink3",
        VIOLETRED3: "violetred3",
        VIOLETRED1: "violetred1",
        VIOLETRED2: "violetred2",
        VIOLETRED4: "violetred4",
        HOTPINK2: "hotpink2",
        HOTPINK1: "hotpink1",
        HOTPINK4: "hotpink4",
        HOTPINK: "hotpink",
        DEEPPINK: "deeppink",
        DEEPPINK1: "deeppink1",
        DEEPPINK2: "deeppink2",
        DEEPPINK3: "deeppink3",
        DEEPPINK4: "deeppink4",
        MAROON1: "maroon1",
        MAROON2: "maroon2",
        MAROON3: "maroon3",
        MAROON4: "maroon4",
        MEDIUMVIOLETRED: "mediumvioletred",
        VIOLETRED: "violetred",
        ORCHID2: "orchid2",
        ORCHID: "orchid",
        ORCHID1: "orchid1",
        ORCHID3: "orchid3",
        ORCHID4: "orchid4",
        THISTLE1: "thistle1",
        THISTLE2: "thistle2",
        PLUM1: "plum1",
        PLUM2: "plum2",
        THISTLE: "thistle",
        THISTLE3: "thistle3",
        PLUM: "plum",
        VIOLET: "violet",
        PLUM3: "plum3",
        THISTLE4: "thistle4",
        FUCHSIA: "fuchsia",
        MAGENTA: "magenta",
        MAGENTA1: "magenta1",
        PLUM4: "plum4",
        MAGENTA2: "magenta2",
        MAGENTA3: "magenta3",
        DARKMAGENTA: "darkmagenta",
        MAGENTA4: "magenta4",
        PURPLE: "purple",
        MEDIUMORCHID: "mediumorchid",
        MEDIUMORCHID1: "mediumorchid1",
        MEDIUMORCHID2: "mediumorchid2",
        MEDIUMORCHID3: "mediumorchid3",
        MEDIUMORCHID4: "mediumorchid4",
        DARKVIOLET: "darkviolet",
        DARKORCHID: "darkorchid",
        DARKORCHID1: "darkorchid1",
        DARKORCHID3: "darkorchid3",
        DARKORCHID2: "darkorchid2",
        DARKORCHID4: "darkorchid4",
        INDIGO: "indigo",
        BLUEVIOLET: "blueviolet",
        PURPLE2: "purple2",
        PURPLE3: "purple3",
        PURPLE4: "purple4",
        PURPLE1: "purple1",
        MEDIUMPURPLE: "mediumpurple",
        MEDIUMPURPLE1: "mediumpurple1",
        MEDIUMPURPLE2: "mediumpurple2",
        MEDIUMPURPLE3: "mediumpurple3",
        MEDIUMPURPLE4: "mediumpurple4",
        DARKSLATEBLUE: "darkslateblue",
        LIGHTSLATEBLUE: "lightslateblue",
        MEDIUMSLATEBLUE: "mediumslateblue",
        SLATEBLUE: "slateblue",
        SLATEBLUE1: "slateblue1",
        SLATEBLUE2: "slateblue2",
        SLATEBLUE3: "slateblue3",
        SLATEBLUE4: "slateblue4",
        GHOSTWHITE: "ghostwhite",
        LAVENDER: "lavender",
        BLUE: "blue",
        BLUE1: "blue1",
        BLUE2: "blue2",
        BLUE3: "blue3",
        MEDIUMBLUE: "mediumblue",
        BLUE4: "blue4",
        DARKBLUE: "darkblue",
        MIDNIGHTBLUE: "midnightblue",
        NAVY: "navy",
        NAVYBLUE: "navyblue",
        ROYALBLUE: "royalblue",
        ROYALBLUE1: "royalblue1",
        ROYALBLUE2: "royalblue2",
        ROYALBLUE3: "royalblue3",
        ROYALBLUE4: "royalblue4",
        CORNFLOWERBLUE: "cornflowerblue",
        LIGHTSTEELBLUE: "lightsteelblue",
        LIGHTSTEELBLUE1: "lightsteelblue1",
        LIGHTSTEELBLUE2: "lightsteelblue2",
        LIGHTSTEELBLUE3: "lightsteelblue3",
        LIGHTSTEELBLUE4: "lightsteelblue4",
        SLATEGRAY4: "slategray4",
        SLATEGRAY1: "slategray1",
        SLATEGRAY2: "slategray2",
        SLATEGRAY3: "slategray3",
        LIGHTSLATEGRAY: "lightslategray",
        LIGHTSLATEGREY: "lightslategrey",
        SLATEGRAY: "slategray",
        SLATEGREY: "slategrey",
        DODGERBLUE: "dodgerblue",
        DODGERBLUE1: "dodgerblue1",
        DODGERBLUE2: "dodgerblue2",
        DODGERBLUE4: "dodgerblue4",
        DODGERBLUE3: "dodgerblue3",
        ALICEBLUE: "aliceblue",
        STEELBLUE4: "steelblue4",
        STEELBLUE: "steelblue",
        STEELBLUE1: "steelblue1",
        STEELBLUE2: "steelblue2",
        STEELBLUE3: "steelblue3",
        SKYBLUE4: "skyblue4",
        SKYBLUE1: "skyblue1",
        SKYBLUE2: "skyblue2",
        SKYBLUE3: "skyblue3",
        LIGHTSKYBLUE: "lightskyblue",
        LIGHTSKYBLUE4: "lightskyblue4",
        LIGHTSKYBLUE1: "lightskyblue1",
        LIGHTSKYBLUE2: "lightskyblue2",
        LIGHTSKYBLUE3: "lightskyblue3",
        SKYBLUE: "skyblue",
        LIGHTBLUE3: "lightblue3",
        DEEPSKYBLUE: "deepskyblue",
        DEEPSKYBLUE1: "deepskyblue1",
        DEEPSKYBLUE2: "deepskyblue2",
        DEEPSKYBLUE4: "deepskyblue4",
        DEEPSKYBLUE3: "deepskyblue3",
        LIGHTBLUE1: "lightblue1",
        LIGHTBLUE2: "lightblue2",
        LIGHTBLUE: "lightblue",
        LIGHTBLUE4: "lightblue4",
        POWDERBLUE: "powderblue",
        CADETBLUE1: "cadetblue1",
        CADETBLUE2: "cadetblue2",
        CADETBLUE3: "cadetblue3",
        CADETBLUE4: "cadetblue4",
        TURQUOISE1: "turquoise1",
        TURQUOISE2: "turquoise2",
        TURQUOISE3: "turquoise3",
        TURQUOISE4: "turquoise4",
        CADETBLUE: "cadetblue",
        DARKTURQUOISE: "darkturquoise",
        AZURE: "azure",
        AZURE1: "azure1",
        LIGHTCYAN1: "lightcyan1",
        LIGHTCYAN: "lightcyan",
        AZURE2: "azure2",
        LIGHTCYAN2: "lightcyan2",
        PALETURQUOISE1: "paleturquoise1",
        PALETURQUOISE: "paleturquoise",
        PALETURQUOISE2: "paleturquoise2",
        DARKSLATEGRAY1: "darkslategray1",
        AZURE3: "azure3",
        LIGHTCYAN3: "lightcyan3",
        DARKSLATEGRAY2: "darkslategray2",
        PALETURQUOISE3: "paleturquoise3",
        DARKSLATEGRAY3: "darkslategray3",
        AZURE4: "azure4",
        LIGHTCYAN4: "lightcyan4",
        AQUA: "aqua",
        CYAN: "cyan",
        CYAN1: "cyan1",
        PALETURQUOISE4: "paleturquoise4",
        CYAN2: "cyan2",
        DARKSLATEGRAY4: "darkslategray4",
        CYAN3: "cyan3",
        CYAN4: "cyan4",
        DARKCYAN: "darkcyan",
        TEAL: "teal",
        DARKSLATEGRAY: "darkslategray",
        DARKSLATEGREY: "darkslategrey",
        MEDIUMTURQUOISE: "mediumturquoise",
        LIGHTSEAGREEN: "lightseagreen",
        TURQUOISE: "turquoise",
        AQUAMARINE4: "aquamarine4",
        AQUAMARINE: "aquamarine",
        AQUAMARINE1: "aquamarine1",
        AQUAMARINE2: "aquamarine2",
        AQUAMARINE3: "aquamarine3",
        MEDIUMAQUAMARINE: "mediumaquamarine",
        MEDIUMSPRINGGREEN: "mediumspringgreen",
        MINTCREAM: "mintcream",
        SPRINGGREEN: "springgreen",
        SPRINGGREEN1: "springgreen1",
        SPRINGGREEN2: "springgreen2",
        SPRINGGREEN3: "springgreen3",
        SPRINGGREEN4: "springgreen4",
        MEDIUMSEAGREEN: "mediumseagreen",
        SEAGREEN: "seagreen",
        SEAGREEN3: "seagreen3",
        SEAGREEN1: "seagreen1",
        SEAGREEN4: "seagreen4",
        SEAGREEN2: "seagreen2",
        MEDIUMFORESTGREEN: "mediumforestgreen",
        HONEYDEW: "honeydew",
        HONEYDEW1: "honeydew1",
        HONEYDEW2: "honeydew2",
        DARKSEAGREEN1: "darkseagreen1",
        DARKSEAGREEN2: "darkseagreen2",
        PALEGREEN1: "palegreen1",
        PALEGREEN: "palegreen",
        HONEYDEW3: "honeydew3",
        LIGHTGREEN: "lightgreen",
        PALEGREEN2: "palegreen2",
        DARKSEAGREEN3: "darkseagreen3",
        DARKSEAGREEN: "darkseagreen",
        PALEGREEN3: "palegreen3",
        HONEYDEW4: "honeydew4",
        GREEN1: "green1",
        LIME: "lime",
        LIMEGREEN: "limegreen",
        DARKSEAGREEN4: "darkseagreen4",
        GREEN2: "green2",
        PALEGREEN4: "palegreen4",
        GREEN3: "green3",
        FORESTGREEN: "forestgreen",
        GREEN4: "green4",
        GREEN: "green",
        DARKGREEN: "darkgreen",
        LAWNGREEN: "lawngreen",
        CHARTREUSE: "chartreuse",
        CHARTREUSE1: "chartreuse1",
        CHARTREUSE2: "chartreuse2",
        CHARTREUSE3: "chartreuse3",
        CHARTREUSE4: "chartreuse4",
        GREENYELLOW: "greenyellow",
        DARKOLIVEGREEN3: "darkolivegreen3",
        DARKOLIVEGREEN1: "darkolivegreen1",
        DARKOLIVEGREEN2: "darkolivegreen2",
        DARKOLIVEGREEN4: "darkolivegreen4",
        DARKOLIVEGREEN: "darkolivegreen",
        OLIVEDRAB: "olivedrab",
        OLIVEDRAB1: "olivedrab1",
        OLIVEDRAB2: "olivedrab2",
        OLIVEDRAB3: "olivedrab3",
        YELLOWGREEN: "yellowgreen",
        OLIVEDRAB4: "olivedrab4",
        IVORY: "ivory",
        IVORY1: "ivory1",
        LIGHTYELLOW: "lightyellow",
        LIGHTYELLOW1: "lightyellow1",
        BEIGE: "beige",
        IVORY2: "ivory2",
        LIGHTGOLDENRODYELLOW: "lightgoldenrodyellow",
        LIGHTYELLOW2: "lightyellow2",
        IVORY3: "ivory3",
        LIGHTYELLOW3: "lightyellow3",
        IVORY4: "ivory4",
        LIGHTYELLOW4: "lightyellow4",
        YELLOW: "yellow",
        YELLOW1: "yellow1",
        YELLOW2: "yellow2",
        YELLOW3: "yellow3",
        YELLOW4: "yellow4",
        OLIVE: "olive",
        DARKKHAKI: "darkkhaki",
        KHAKI2: "khaki2",
        LEMONCHIFFON4: "lemonchiffon4",
        KHAKI1: "khaki1",
        KHAKI3: "khaki3",
        KHAKI4: "khaki4",
        PALEGOLDENROD: "palegoldenrod",
        LEMONCHIFFON: "lemonchiffon",
        LEMONCHIFFON1: "lemonchiffon1",
        KHAKI: "khaki",
        LEMONCHIFFON3: "lemonchiffon3",
        LEMONCHIFFON2: "lemonchiffon2",
        MEDIUMGOLDENROD: "mediumgoldenrod",
        CORNSILK4: "cornsilk4",
        GOLD: "gold",
        GOLD1: "gold1",
        GOLD2: "gold2",
        GOLD3: "gold3",
        GOLD4: "gold4",
        LIGHTGOLDENROD: "lightgoldenrod",
        LIGHTGOLDENROD4: "lightgoldenrod4",
        LIGHTGOLDENROD1: "lightgoldenrod1",
        LIGHTGOLDENROD3: "lightgoldenrod3",
        LIGHTGOLDENROD2: "lightgoldenrod2",
        CORNSILK3: "cornsilk3",
        CORNSILK2: "cornsilk2",
        CORNSILK: "cornsilk",
        CORNSILK1: "cornsilk1",
        GOLDENROD: "goldenrod",
        GOLDENROD1: "goldenrod1",
        GOLDENROD2: "goldenrod2",
        GOLDENROD3: "goldenrod3",
        GOLDENROD4: "goldenrod4",
        DARKGOLDENROD: "darkgoldenrod",
        DARKGOLDENROD1: "darkgoldenrod1",
        DARKGOLDENROD2: "darkgoldenrod2",
        DARKGOLDENROD3: "darkgoldenrod3",
        DARKGOLDENROD4: "darkgoldenrod4",
        FLORALWHITE: "floralwhite",
        WHEAT2: "wheat2",
        OLDLACE: "oldlace",
        WHEAT: "wheat",
        WHEAT1: "wheat1",
        WHEAT3: "wheat3",
        ORANGE: "orange",
        ORANGE1: "orange1",
        ORANGE2: "orange2",
        ORANGE3: "orange3",
        ORANGE4: "orange4",
        WHEAT4: "wheat4",
        MOCCASIN: "moccasin",
        PAPAYAWHIP: "papayawhip",
        NAVAJOWHITE3: "navajowhite3",
        BLANCHEDALMOND: "blanchedalmond",
        NAVAJOWHITE: "navajowhite",
        NAVAJOWHITE1: "navajowhite1",
        NAVAJOWHITE2: "navajowhite2",
        NAVAJOWHITE4: "navajowhite4",
        ANTIQUEWHITE4: "antiquewhite4",
        ANTIQUEWHITE: "antiquewhite",
        TAN: "tan",
        BISQUE4: "bisque4",
        BURLYWOOD: "burlywood",
        ANTIQUEWHITE2: "antiquewhite2",
        BURLYWOOD1: "burlywood1",
        BURLYWOOD3: "burlywood3",
        BURLYWOOD2: "burlywood2",
        ANTIQUEWHITE1: "antiquewhite1",
        BURLYWOOD4: "burlywood4",
        ANTIQUEWHITE3: "antiquewhite3",
        DARKORANGE: "darkorange",
        BISQUE2: "bisque2",
        BISQUE: "bisque",
        BISQUE1: "bisque1",
        BISQUE3: "bisque3",
        DARKORANGE1: "darkorange1",
        LINEN: "linen",
        DARKORANGE2: "darkorange2",
        DARKORANGE3: "darkorange3",
        DARKORANGE4: "darkorange4",
        PERU: "peru",
        TAN1: "tan1",
        TAN2: "tan2",
        TAN3: "tan3",
        TAN4: "tan4",
        PEACHPUFF: "peachpuff",
        PEACHPUFF1: "peachpuff1",
        PEACHPUFF4: "peachpuff4",
        PEACHPUFF2: "peachpuff2",
        PEACHPUFF3: "peachpuff3",
        SANDYBROWN: "sandybrown",
        SEASHELL4: "seashell4",
        SEASHELL2: "seashell2",
        SEASHELL3: "seashell3",
        CHOCOLATE: "chocolate",
        CHOCOLATE1: "chocolate1",
        CHOCOLATE2: "chocolate2",
        CHOCOLATE3: "chocolate3",
        CHOCOLATE4: "chocolate4",
        SADDLEBROWN: "saddlebrown",
        SEASHELL: "seashell",
        SEASHELL1: "seashell1",
        SIENNA4: "sienna4",
        SIENNA: "sienna",
        SIENNA1: "sienna1",
        SIENNA2: "sienna2",
        SIENNA3: "sienna3",
        LIGHTSALMON3: "lightsalmon3",
        LIGHTSALMON: "lightsalmon",
        LIGHTSALMON1: "lightsalmon1",
        LIGHTSALMON4: "lightsalmon4",
        LIGHTSALMON2: "lightsalmon2",
        CORAL: "coral",
        ORANGERED: "orangered",
        ORANGERED1: "orangered1",
        ORANGERED2: "orangered2",
        ORANGERED3: "orangered3",
        ORANGERED4: "orangered4",
        DARKSALMON: "darksalmon",
        SALMON1: "salmon1",
        SALMON2: "salmon2",
        SALMON3: "salmon3",
        SALMON4: "salmon4",
        CORAL1: "coral1",
        CORAL2: "coral2",
        CORAL3: "coral3",
        CORAL4: "coral4",
        TOMATO4: "tomato4",
        TOMATO: "tomato",
        TOMATO1: "tomato1",
        TOMATO2: "tomato2",
        TOMATO3: "tomato3",
        MISTYROSE4: "mistyrose4",
        MISTYROSE2: "mistyrose2",
        MISTYROSE: "mistyrose",
        MISTYROSE1: "mistyrose1",
        SALMON: "salmon",
        MISTYROSE3: "mistyrose3",
        WHITE: "white",
        GRAY100: "gray100",
        GREY100: "grey100",
        GRAY99: "gray99",
        GREY99: "grey99",
        GRAY98: "gray98",
        GREY98: "grey98",
        GRAY97: "gray97",
        GREY97: "grey97",
        GRAY96: "gray96",
        GREY96: "grey96",
        WHITESMOKE: "whitesmoke",
        GRAY95: "gray95",
        GREY95: "grey95",
        GRAY94: "gray94",
        GREY94: "grey94",
        GRAY93: "gray93",
        GREY93: "grey93",
        GRAY92: "gray92",
        GREY92: "grey92",
        GRAY91: "gray91",
        GREY91: "grey91",
        GRAY90: "gray90",
        GREY90: "grey90",
        GRAY89: "gray89",
        GREY89: "grey89",
        GRAY88: "gray88",
        GREY88: "grey88",
        GRAY87: "gray87",
        GREY87: "grey87",
        GAINSBORO: "gainsboro",
        GRAY86: "gray86",
        GREY86: "grey86",
        GRAY85: "gray85",
        GREY85: "grey85",
        GRAY84: "gray84",
        GREY84: "grey84",
        GRAY83: "gray83",
        GREY83: "grey83",
        LIGHTGRAY: "lightgray",
        LIGHTGREY: "lightgrey",
        GRAY82: "gray82",
        GREY82: "grey82",
        GRAY81: "gray81",
        GREY81: "grey81",
        GRAY80: "gray80",
        GREY80: "grey80",
        GRAY79: "gray79",
        GREY79: "grey79",
        GRAY78: "gray78",
        GREY78: "grey78",
        GRAY77: "gray77",
        GREY77: "grey77",
        GRAY76: "gray76",
        GREY76: "grey76",
        SILVER: "silver",
        GRAY75: "gray75",
        GREY75: "grey75",
        GRAY74: "gray74",
        GREY74: "grey74",
        GRAY73: "gray73",
        GREY73: "grey73",
        GRAY72: "gray72",
        GREY72: "grey72",
        GRAY71: "gray71",
        GREY71: "grey71",
        GRAY70: "gray70",
        GREY70: "grey70",
        GRAY69: "gray69",
        GREY69: "grey69",
        GRAY68: "gray68",
        GREY68: "grey68",
        GRAY67: "gray67",
        GREY67: "grey67",
        DARKGRAY: "darkgray",
        DARKGREY: "darkgrey",
        GRAY66: "gray66",
        GREY66: "grey66",
        GRAY65: "gray65",
        GREY65: "grey65",
        GRAY64: "gray64",
        GREY64: "grey64",
        GRAY63: "gray63",
        GREY63: "grey63",
        GRAY62: "gray62",
        GREY62: "grey62",
        GRAY61: "gray61",
        GREY61: "grey61",
        GRAY60: "gray60",
        GREY60: "grey60",
        GRAY59: "gray59",
        GREY59: "grey59",
        GRAY58: "gray58",
        GREY58: "grey58",
        GRAY57: "gray57",
        GREY57: "grey57",
        GRAY56: "gray56",
        GREY56: "grey56",
        GRAY55: "gray55",
        GREY55: "grey55",
        GRAY54: "gray54",
        GREY54: "grey54",
        GRAY53: "gray53",
        GREY53: "grey53",
        GRAY52: "gray52",
        GREY52: "grey52",
        GRAY51: "gray51",
        GREY51: "grey51",
        FRACTAL: "fractal",
        GRAY50: "gray50",
        GREY50: "grey50",
        GRAY: "gray",
        GREY: "grey",
        GRAY49: "gray49",
        GREY49: "grey49",
        GRAY48: "gray48",
        GREY48: "grey48",
        GRAY47: "gray47",
        GREY47: "grey47",
        GRAY46: "gray46",
        GREY46: "grey46",
        GRAY45: "gray45",
        GREY45: "grey45",
        GRAY44: "gray44",
        GREY44: "grey44",
        GRAY43: "gray43",
        GREY43: "grey43",
        GRAY42: "gray42",
        GREY42: "grey42",
        DIMGRAY: "dimgray",
        DIMGREY: "dimgrey",
        GRAY41: "gray41",
        GREY41: "grey41",
        GRAY40: "gray40",
        GREY40: "grey40",
        GRAY39: "gray39",
        GREY39: "grey39",
        GRAY38: "gray38",
        GREY38: "grey38",
        GRAY37: "gray37",
        GREY37: "grey37",
        GRAY36: "gray36",
        GREY36: "grey36",
        GRAY35: "gray35",
        GREY35: "grey35",
        GRAY34: "gray34",
        GREY34: "grey34",
        GRAY33: "gray33",
        GREY33: "grey33",
        GRAY32: "gray32",
        GREY32: "grey32",
        GRAY31: "gray31",
        GREY31: "grey31",
        GRAY30: "gray30",
        GREY30: "grey30",
        GRAY29: "gray29",
        GREY29: "grey29",
        GRAY28: "gray28",
        GREY28: "grey28",
        GRAY27: "gray27",
        GREY27: "grey27",
        GRAY26: "gray26",
        GREY26: "grey26",
        GRAY25: "gray25",
        GREY25: "grey25",
        GRAY24: "gray24",
        GREY24: "grey24",
        GRAY23: "gray23",
        GREY23: "grey23",
        GRAY22: "gray22",
        GREY22: "grey22",
        GRAY21: "gray21",
        GREY21: "grey21",
        GRAY20: "gray20",
        GREY20: "grey20",
        GRAY19: "gray19",
        GREY19: "grey19",
        GRAY18: "gray18",
        GREY18: "grey18",
        GRAY17: "gray17",
        GREY17: "grey17",
        GRAY16: "gray16",
        GREY16: "grey16",
        GRAY15: "gray15",
        GREY15: "grey15",
        GRAY14: "gray14",
        GREY14: "grey14",
        GRAY13: "gray13",
        GREY13: "grey13",
        GRAY12: "gray12",
        GREY12: "grey12",
        GRAY11: "gray11",
        GREY11: "grey11",
        GRAY10: "gray10",
        GREY10: "grey10",
        GRAY9: "gray9",
        GREY9: "grey9",
        GRAY8: "gray8",
        GREY8: "grey8",
        GRAY7: "gray7",
        GREY7: "grey7",
        GRAY6: "gray6",
        GREY6: "grey6",
        GRAY5: "gray5",
        GREY5: "grey5",
        GRAY4: "gray4",
        GREY4: "grey4",
        GRAY3: "gray3",
        GREY3: "grey3",
        GRAY2: "gray2",
        GREY2: "grey2",
        GRAY1: "gray1",
        GREY1: "grey1",
        BLACK: "black",
        GRAY0: "gray0",
        GREY0: "grey0",
        OPAQUE: "opaque",
        NONE: "none",
        TRANSPARENT: "transparent"
      };
      function srgb() {
        return "srgb";
      }
      function trueColor() {
        return "srgb:truecolor";
      }
      function tinySrgb() {
        return "tinysrgb";
      }
      function cmyk() {
        return "cmyk";
      }
      function noCmyk() {
        return "no_cmyk";
      }
      function keepCmyk() {
        return "keep_cmyk";
      }
      var ColorSpace = {
        cmyk,
        keepCmyk,
        noCmyk,
        srgb,
        tinySrgb,
        trueColor
      };
      function threshold1x1Nondither() {
        return 0;
      }
      function checkerboard2x1Dither() {
        return 1;
      }
      function ordered2x2Dispersed() {
        return 2;
      }
      function ordered3x3Dispersed() {
        return 3;
      }
      function ordered4x4Dispersed() {
        return 4;
      }
      function ordered8x8Dispersed() {
        return 5;
      }
      function halftone4x4Angled() {
        return 6;
      }
      function halftone6x6Angled() {
        return 7;
      }
      function halftone8x8Angled() {
        return 8;
      }
      function halftone4x4Orthogonal() {
        return 9;
      }
      function halftone6x6Orthogonal() {
        return 10;
      }
      function halftone8x8Orthogonal() {
        return 11;
      }
      function halftone16x16Orthogonal() {
        return 12;
      }
      function circles5x5Black() {
        return 13;
      }
      function circles5x5White() {
        return 14;
      }
      function circles6x6Black() {
        return 15;
      }
      function circles6x6White() {
        return 16;
      }
      function circles7x7Black() {
        return 17;
      }
      function circles7x7White() {
        return 18;
      }
      var Dither = {
        checkerboard2x1Dither,
        circles5x5Black,
        circles5x5White,
        circles6x6Black,
        circles6x6White,
        circles7x7Black,
        circles7x7White,
        halftone4x4Angled,
        halftone4x4Orthogonal,
        halftone6x6Angled,
        halftone6x6Orthogonal,
        halftone8x8Angled,
        halftone8x8Orthogonal,
        halftone16x16Orthogonal,
        ordered2x2Dispersed,
        ordered3x3Dispersed,
        ordered4x4Dispersed,
        ordered8x8Dispersed,
        threshold1x1Nondither
      };
      function auto$2() {
        return "auto";
      }
      var Dpr = {
        auto: auto$2
      };
      var ALLOWED_URL_CONFIG = [
        "cname",
        "secureDistribution",
        "privateCdn",
        "signUrl",
        "longUrlSignature",
        "shorten",
        "useRootPath",
        "secure",
        "forceVersion",
        "analytics"
      ];
      var CONDITIONAL_OPERATORS = {
        "=": "eq",
        "!=": "ne",
        "<": "lt",
        ">": "gt",
        "<=": "lte",
        ">=": "gte",
        "&&": "and",
        "||": "or",
        "*": "mul",
        "/": "div",
        "+": "add",
        "-": "sub",
        "^": "pow",
        "initial_width": "iw",
        "initial_height": "ih",
        "width": "w",
        "height": "h",
        "aspect_ratio": "ar",
        "initial_aspect_ratio": "iar",
        "trimmed_aspect_ratio": "tar",
        "current_page": "cp",
        "face_count": "fc",
        "page_count": "pc",
        "current_public_id": "cpi",
        "initial_density": "idn",
        "page_names": "pgnames"
      };
      var ExpressionQualifier = function(_super) {
        __extends(ExpressionQualifier2, _super);
        function ExpressionQualifier2(value) {
          var _this = _super.call(this) || this;
          _this.value = value;
          return _this;
        }
        ExpressionQualifier2.prototype.toString = function() {
          return this.value;
        };
        return ExpressionQualifier2;
      }(QualifierValue);
      function expression(exp) {
        return new ExpressionQualifier(exp.toString().split(" ").map(function(val) {
          return CONDITIONAL_OPERATORS[val] || val;
        }).join("_"));
      }
      var Expression$1 = {
        expression
      };
      function none() {
        return "";
      }
      function slight() {
        return "slight";
      }
      function medium() {
        return "medium";
      }
      function full() {
        return "full";
      }
      var FontHinting = { full, none, medium, slight };
      function normal$2() {
        return "normal";
      }
      function italic() {
        return "italic";
      }
      var FontStyle = { normal: normal$2, italic };
      function thin() {
        return "thin";
      }
      function light() {
        return "light";
      }
      function normal$1() {
        return "normal";
      }
      function bold() {
        return "bold";
      }
      var FontWeight = { bold, light, normal: normal$1, thin };
      var FormatQualifier = function(_super) {
        __extends(FormatQualifier2, _super);
        function FormatQualifier2(val) {
          return _super.call(this, val) || this;
        }
        return FormatQualifier2;
      }(QualifierValue);
      function heic() {
        return new FormatQualifier("heic");
      }
      function flif() {
        return new FormatQualifier("flif");
      }
      function ai() {
        return new FormatQualifier("ai");
      }
      function wdp() {
        return new FormatQualifier("wdp");
      }
      function svg() {
        return new FormatQualifier("svg");
      }
      function webp() {
        return new FormatQualifier("webp");
      }
      function psd() {
        return new FormatQualifier("psd");
      }
      function jp2() {
        return new FormatQualifier("jp2");
      }
      function jpc() {
        return new FormatQualifier("jpc");
      }
      function eps() {
        return new FormatQualifier("eps");
      }
      function tiff() {
        return new FormatQualifier("tiff");
      }
      function pdf() {
        return new FormatQualifier("pdf");
      }
      function ico() {
        return new FormatQualifier("ico");
      }
      function bmp() {
        return new FormatQualifier("bmp");
      }
      function png() {
        return new FormatQualifier("png");
      }
      function gif() {
        return new FormatQualifier("gif");
      }
      function auto$1() {
        return new FormatQualifier("auto");
      }
      function jpg() {
        return new FormatQualifier("jpg");
      }
      function djvu() {
        return new FormatQualifier("djvu");
      }
      function ps() {
        return new FormatQualifier("ps");
      }
      function ept() {
        return new FormatQualifier("ept");
      }
      function eps3() {
        return new FormatQualifier("eps3");
      }
      function fxb() {
        return new FormatQualifier("fxb");
      }
      function gltf() {
        return new FormatQualifier("gltf");
      }
      function heif() {
        return new FormatQualifier("heif");
      }
      function indd() {
        return new FormatQualifier("indd");
      }
      function jpe() {
        return new FormatQualifier("jpe");
      }
      function jpeg() {
        return new FormatQualifier("jpeg");
      }
      function jxr() {
        return new FormatQualifier("jxr");
      }
      function hdp() {
        return new FormatQualifier("hdp");
      }
      function spd() {
        return new FormatQualifier("spd");
      }
      function arw() {
        return new FormatQualifier("arw");
      }
      function cr2() {
        return new FormatQualifier("cr2");
      }
      function tga() {
        return new FormatQualifier("tga");
      }
      function tif() {
        return new FormatQualifier("tif");
      }
      function avif() {
        return new FormatQualifier("avif");
      }
      function usdz() {
        return new FormatQualifier("usdz");
      }
      function video3g2() {
        return new FormatQualifier("3g2");
      }
      function video3gp() {
        return new FormatQualifier("3gp");
      }
      function videoAvi() {
        return new FormatQualifier("avi");
      }
      function videoFlv() {
        return new FormatQualifier("flv");
      }
      function videoM3u8() {
        return new FormatQualifier("m3u8");
      }
      function videoTs() {
        return new FormatQualifier("ts");
      }
      function videoMov() {
        return new FormatQualifier("mov");
      }
      function videoMkv() {
        return new FormatQualifier("mkv");
      }
      function videoMp4() {
        return new FormatQualifier("mp4");
      }
      function videoMpeg() {
        return new FormatQualifier("mpeg");
      }
      function videoMpd() {
        return new FormatQualifier("mpd");
      }
      function videoMxf() {
        return new FormatQualifier("mxf");
      }
      function videoOgv() {
        return new FormatQualifier("ogv");
      }
      function videoWebm() {
        return new FormatQualifier("webm");
      }
      function videoWmv() {
        return new FormatQualifier("wmv");
      }
      function videoM2ts() {
        return new FormatQualifier("m2ts");
      }
      function videoMts() {
        return new FormatQualifier("mts");
      }
      function audioAac() {
        return new FormatQualifier("aac");
      }
      function audioAiff() {
        return new FormatQualifier("aiff");
      }
      function audioAmr() {
        return new FormatQualifier("amr");
      }
      function audioFlac() {
        return new FormatQualifier("flac");
      }
      function audioM4a() {
        return new FormatQualifier("m4a");
      }
      function audioMp3() {
        return new FormatQualifier("mp3");
      }
      function audioOgg() {
        return new FormatQualifier("ogg");
      }
      function audioOpus() {
        return new FormatQualifier("opus");
      }
      function audioWav() {
        return new FormatQualifier("wav");
      }
      function glb() {
        return new FormatQualifier("glb");
      }
      var Format = { usdz, jp2, ai, auto: auto$1, bmp, eps, flif, gif, heic, ico, jpc, jpg, pdf, png, psd, svg, tiff, wdp, webp, arw, audioAac, audioAiff, audioAmr, audioFlac, audioM4a, audioMp3, audioOgg, audioOpus, audioWav, avif, cr2, djvu, eps3, ept, fxb, gltf, hdp, heif, indd, jpe, jpeg, jxr, ps, spd, tga, tif, video3g2, video3gp, videoAvi, videoFlv, videoM2ts, videoM3u8, videoMkv, videoMov, videoMp4, videoMpd, videoMpeg, videoMts, videoMxf, videoOgv, videoTs, videoWebm, videoWmv, glb };
      var GradientDirectionQualifierValue = function(_super) {
        __extends(GradientDirectionQualifierValue2, _super);
        function GradientDirectionQualifierValue2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        return GradientDirectionQualifierValue2;
      }(QualifierValue);
      function horizontal() {
        return new GradientDirectionQualifierValue("horizontal");
      }
      function vertical() {
        return new GradientDirectionQualifierValue("vertical");
      }
      function diagonalDesc() {
        return new GradientDirectionQualifierValue("diagonal_desc");
      }
      function diagonalAsc() {
        return new GradientDirectionQualifierValue("diagonal_asc");
      }
      var GradientDirection = {
        horizontal,
        vertical,
        diagonalDesc,
        diagonalAsc
      };
      var CompassGravity = function(_super) {
        __extends(CompassGravity2, _super);
        function CompassGravity2(dir) {
          return _super.call(this, dir) || this;
        }
        return CompassGravity2;
      }(GravityQualifier);
      var FocusOnGravity = function(_super) {
        __extends(FocusOnGravity2, _super);
        function FocusOnGravity2(FocusOnObjects) {
          return _super.call(this, FocusOnObjects) || this;
        }
        FocusOnGravity2.prototype.fallbackGravity = function(val) {
          this.addValue(val.qualifierValue);
          return this;
        };
        return FocusOnGravity2;
      }(GravityQualifier);
      var AutoGravity = function(_super) {
        __extends(AutoGravity2, _super);
        function AutoGravity2() {
          return _super.call(this, "auto") || this;
        }
        AutoGravity2.prototype.autoFocus = function() {
          var AutoFocusObjects = [];
          for (var _i = 0; _i < arguments.length; _i++) {
            AutoFocusObjects[_i] = arguments[_i];
          }
          this.addValue(AutoFocusObjects);
          return this;
        };
        return AutoGravity2;
      }(GravityQualifier);
      var XYCenterGravity = function(_super) {
        __extends(XYCenterGravity2, _super);
        function XYCenterGravity2() {
          return _super.call(this, "xy_center") || this;
        }
        return XYCenterGravity2;
      }(GravityQualifier);
      function compass(direction) {
        return new CompassGravity(direction);
      }
      function focusOn() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var res = __spreadArrays(args);
        return new FocusOnGravity(res);
      }
      function autoGravity() {
        return new AutoGravity();
      }
      function xyCenter() {
        return new XYCenterGravity();
      }
      var Gravity = {
        compass,
        autoGravity,
        focusOn,
        xyCenter
      };
      function outdoor() {
        return "outdoor";
      }
      function indoor() {
        return "indoor";
      }
      var ImproveMode = {
        indoor,
        outdoor
      };
      function fill() {
        return "fill";
      }
      function inner() {
        return "inner";
      }
      function innerFill() {
        return "inner_fill";
      }
      function outer() {
        return "outer";
      }
      var OutlineMode = {
        outer,
        inner,
        innerFill,
        fill
      };
      var PositionQualifier = function(_super) {
        __extends(PositionQualifier2, _super);
        function PositionQualifier2() {
          return _super.call(this) || this;
        }
        PositionQualifier2.prototype.gravity = function(gravityQualifier) {
          this.addQualifier(gravityQualifier);
          return this;
        };
        PositionQualifier2.prototype.tiled = function() {
          this.addFlag(tiled());
          return this;
        };
        PositionQualifier2.prototype.allowOverflow = function(bool) {
          if (bool === void 0) {
            bool = true;
          }
          if (bool === false) {
            this.addFlag(noOverflow());
          }
          return this;
        };
        PositionQualifier2.prototype.offsetX = function(offsetX) {
          this.addQualifier(new Qualifier("x", offsetX));
          return this;
        };
        PositionQualifier2.prototype.offsetY = function(offsetY) {
          this.addQualifier(new Qualifier("y", offsetY));
          return this;
        };
        return PositionQualifier2;
      }(Action);
      function auto() {
        return "auto";
      }
      function autoBest() {
        return "auto:best";
      }
      function autoEco() {
        return "auto:eco";
      }
      function autoGood() {
        return "auto:good";
      }
      function autoLow() {
        return "auto:low";
      }
      function jpegmini() {
        return "jpegmini";
      }
      function jpegminiBest() {
        return "jpegmini:0";
      }
      function jpegminiHigh() {
        return "jpegmini:1";
      }
      function jpegminiMedium() {
        return "jpegmini:2";
      }
      var Quality = { auto, autoBest, autoEco, autoGood, autoLow, jpegmini, jpegminiBest, jpegminiHigh, jpegminiMedium };
      var NamedRegion = function(_super) {
        __extends(NamedRegion2, _super);
        function NamedRegion2(type) {
          var _this = _super.call(this) || this;
          _this.regionType = type;
          return _this;
        }
        return NamedRegion2;
      }(Action);
      var CustomRegion = function(_super) {
        __extends(CustomRegion2, _super);
        function CustomRegion2() {
          return _super.call(this, "named") || this;
        }
        CustomRegion2.prototype.x = function(x) {
          this.addQualifier(new Qualifier("x", x));
          return this;
        };
        CustomRegion2.prototype.y = function(y) {
          this.addQualifier(new Qualifier("y", y));
          return this;
        };
        CustomRegion2.prototype.width = function(width) {
          this.addQualifier(new Qualifier("w", width));
          return this;
        };
        CustomRegion2.prototype.height = function(height) {
          this.addQualifier(new Qualifier("h", height));
          return this;
        };
        return CustomRegion2;
      }(NamedRegion);
      function custom() {
        return new CustomRegion();
      }
      function faces() {
        return new NamedRegion("faces");
      }
      function ocr() {
        return new NamedRegion("ocr_text");
      }
      var Region = { ocr, faces, custom };
      var RotationModeQualifierValue = function(_super) {
        __extends(RotationModeQualifierValue2, _super);
        function RotationModeQualifierValue2(val) {
          var _this = _super.call(this) || this;
          _this.val = val;
          return _this;
        }
        RotationModeQualifierValue2.prototype.toString = function() {
          return this.val;
        };
        return RotationModeQualifierValue2;
      }(QualifierValue);
      function autoRight() {
        return new RotationModeQualifierValue("auto_right");
      }
      function autoLeft() {
        return new RotationModeQualifierValue("auto_left");
      }
      function verticalFlip() {
        return new RotationModeQualifierValue("vflip");
      }
      function horizontalFlip() {
        return new RotationModeQualifierValue("hflip");
      }
      function ignore() {
        return new RotationModeQualifierValue("ignore");
      }
      var RotationMode = { autoLeft, autoRight, horizontalFlip, ignore, verticalFlip };
      function deuteranopia() {
        return "deuteranopia";
      }
      function protanopia() {
        return "protanopia";
      }
      function tritanopia() {
        return "tritanopia";
      }
      function tritanomaly() {
        return "tritanomaly";
      }
      function deuteranomaly() {
        return "deuteranomaly";
      }
      function coneMonochromacy() {
        return "cone_monochromacy";
      }
      function rodMonochromacy() {
        return "rod_monochromacy";
      }
      var SimulateColorBlind = {
        coneMonochromacy,
        deuteranomaly,
        deuteranopia,
        protanopia,
        rodMonochromacy,
        tritanomaly,
        tritanopia
      };
      var BaseSource = function() {
        function BaseSource2() {
        }
        BaseSource2.prototype.encodeAssetPublicID = function(publicID) {
          return publicID.replace(/\//g, ":");
        };
        BaseSource2.prototype.transformation = function(t) {
          this._transformation = t;
          return this;
        };
        BaseSource2.prototype.getTransformation = function() {
          return this._transformation;
        };
        return BaseSource2;
      }();
      var VideoSource = function(_super) {
        __extends(VideoSource2, _super);
        function VideoSource2(publicID) {
          var _this = _super.call(this) || this;
          _this._publicID = publicID;
          return _this;
        }
        VideoSource2.prototype.getOpenSourceString = function(layerType) {
          var encodedPublicID = this.encodeAssetPublicID(this._publicID);
          return layerType + "_video:" + encodedPublicID;
        };
        return VideoSource2;
      }(BaseSource);
      var ImageSource = function(_super) {
        __extends(ImageSource2, _super);
        function ImageSource2(publicID) {
          var _this = _super.call(this) || this;
          _this._publicID = publicID;
          return _this;
        }
        ImageSource2.prototype.getOpenSourceString = function(layerType) {
          var encodedPublicID = this.encodeAssetPublicID(this._publicID);
          if (this._format) {
            return layerType + "_" + encodedPublicID + "." + this._format.toString();
          } else {
            return layerType + "_" + encodedPublicID;
          }
        };
        ImageSource2.prototype.format = function(format3) {
          this._format = format3;
          return this;
        };
        return ImageSource2;
      }(BaseSource);
      function serializeCloudinaryCharacters(str) {
        if (str === void 0) {
          str = "";
        }
        return str.replace(/,/g, "%2C").replace(/\//g, "%2F");
      }
      var BaseTextSource = function(_super) {
        __extends(BaseTextSource2, _super);
        function BaseTextSource2(text2, textStyle2) {
          var _this = _super.call(this) || this;
          _this.type = "text";
          _this.text = text2;
          _this._textStyle = textStyle2;
          return _this;
        }
        BaseTextSource2.prototype.encodeText = function(text2) {
          return serializeCloudinaryCharacters(text2);
        };
        BaseTextSource2.prototype.textColor = function(color2) {
          this._textColor = color2;
          return this;
        };
        BaseTextSource2.prototype.backgroundColor = function(bgColor) {
          this._backgroundColor = bgColor;
          return this;
        };
        BaseTextSource2.prototype.getOpenSourceString = function(layerType) {
          var layerParam = [
            this.type,
            this._textStyle && this._textStyle.toString(),
            this.encodeText(this.text)
          ].filter(function(a) {
            return a;
          }).join(":");
          var tmpAction = new Action();
          tmpAction.addQualifier(new Qualifier(layerType, layerParam));
          this._textColor && tmpAction.addQualifier(new Qualifier("co", prepareColor(this._textColor)));
          this._backgroundColor && tmpAction.addQualifier(new Qualifier("b", prepareColor(this._backgroundColor)));
          return tmpAction.toString();
        };
        return BaseTextSource2;
      }(BaseSource);
      var SubtitlesSource = function(_super) {
        __extends(SubtitlesSource2, _super);
        function SubtitlesSource2(fileName) {
          var _this = _super.call(this, fileName) || this;
          _this.type = "subtitles";
          return _this;
        }
        SubtitlesSource2.prototype.textStyle = function(textStyle2) {
          this._textStyle = textStyle2;
          return this;
        };
        SubtitlesSource2.prototype.encodeText = function(text2) {
          return text2.replace(/\//g, ":");
        };
        return SubtitlesSource2;
      }(BaseTextSource);
      var FetchSource = function(_super) {
        __extends(FetchSource2, _super);
        function FetchSource2(remoteURL) {
          var _this = _super.call(this) || this;
          _this._remoteURL = remoteURL;
          return _this;
        }
        FetchSource2.prototype.getOpenSourceString = function(layerType) {
          if (this._format) {
            return layerType + "_fetch:" + base64Encode(this._remoteURL) + "." + this._format.toString();
          } else {
            return layerType + "_fetch:" + base64Encode(this._remoteURL);
          }
        };
        FetchSource2.prototype.format = function(format3) {
          this._format = format3;
          return this;
        };
        return FetchSource2;
      }(BaseSource);
      var TextSource = function(_super) {
        __extends(TextSource2, _super);
        function TextSource2(fileName, textStyle2) {
          return _super.call(this, fileName, textStyle2) || this;
        }
        return TextSource2;
      }(BaseTextSource);
      function image(publicID) {
        return new ImageSource(publicID);
      }
      function text(text2, textStyle2) {
        return new TextSource(text2, textStyle2);
      }
      function video(publicID) {
        return new VideoSource(publicID);
      }
      function subtitles(fileName) {
        return new SubtitlesSource(fileName);
      }
      function fetch2(remoteURL) {
        return new FetchSource(remoteURL);
      }
      var Source = { image, text, video, subtitles, fetch: fetch2 };
      function fullHd() {
        return "full_hd";
      }
      function hd() {
        return "hd";
      }
      function sd() {
        return "sd";
      }
      function fullHdWifi() {
        return "full_hd_wifi";
      }
      function fullHdLean() {
        return "full_hd_lean";
      }
      function hdLean() {
        return "hd_lean";
      }
      var StreamingProfile = {
        hd,
        sd,
        hdLean,
        fullHd,
        fullHdLean,
        fullHdWifi
      };
      function left() {
        return "left";
      }
      function right() {
        return "right";
      }
      function center() {
        return "center";
      }
      function start() {
        return "start";
      }
      function end() {
        return "end";
      }
      function justify() {
        return "justify";
      }
      var TextAlignment = { left, right, center, end, justify, start };
      function normal() {
        return "";
      }
      function underline() {
        return "underline";
      }
      function strikethrough() {
        return "strikethrough";
      }
      var TextDecoration = { normal, underline, strikethrough };
      function symmetric() {
        return "symmetric";
      }
      function symmetricPad() {
        return "symmetric_pad";
      }
      var GradientFade = {
        symmetric,
        symmetricPad
      };
      function solid(width, color2) {
        return "bo_" + width + "px_solid_" + color2;
      }
      var Stroke = { solid };
      var Qualifiers = {
        TextDecoration,
        TextAlignment,
        Stroke,
        StreamingProfile,
        SimulateColorBlind,
        RotationMode,
        Region,
        Quality,
        Position: PositionQualifier,
        OutlineMode,
        ImproveMode,
        GradientDirection,
        Format,
        FontWeight,
        FontStyle,
        FontHinting,
        Expression: Expression$1,
        Dither,
        ColorSpace,
        Color,
        Background,
        AudioFrequency,
        AudioCodec,
        AspectRatio,
        ArtisticFilter,
        AnimatedFormat,
        Gravity,
        ChromaSubSampling,
        Dpr,
        Sources: Source,
        GradientFade
      };
      var ImageTransformation = function(_super) {
        __extends(ImageTransformation2, _super);
        function ImageTransformation2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        return ImageTransformation2;
      }(Transformation$2);
      var VideoTransformation = function(_super) {
        __extends(VideoTransformation2, _super);
        function VideoTransformation2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        return VideoTransformation2;
      }(Transformation$2);
      function isUrl(publicID) {
        return publicID.match(/^https?:\//);
      }
      function isFileName(publicID) {
        return publicID.indexOf("/") < 0;
      }
      function publicIDContainsVersion(publicID) {
        return publicID.match(/^v[0-9]+/);
      }
      function getUrlPrefix(cloudName, urlConfig) {
        var secure = urlConfig.secure;
        var privateCDN = urlConfig.privateCdn;
        var cname = urlConfig.cname;
        var secureDistribution = urlConfig.secureDistribution;
        if (!secure && !cname) {
          return "http://res.cloudinary.com/" + cloudName;
        }
        if (secure && !secureDistribution && privateCDN) {
          return "https://" + cloudName + "-res.cloudinary.com";
        }
        if (secure && !secureDistribution) {
          return "https://res.cloudinary.com/" + cloudName;
        }
        if (secure && secureDistribution && privateCDN) {
          return "https://" + secureDistribution;
        }
        if (secure && secureDistribution) {
          return "https://" + secureDistribution + "/" + cloudName;
        }
        if (!secure && cname) {
          return "http://" + cname + "/" + cloudName;
        } else {
          return "ERROR";
        }
      }
      function handleAssetType(assetType) {
        if (!assetType) {
          return "image";
        }
        return assetType;
      }
      function handleDeliveryType(deliveryType) {
        if (!deliveryType) {
          return "upload";
        }
        return deliveryType;
      }
      function getUrlVersion(publicID, version2, forceVersion) {
        var shouldForceVersion = forceVersion !== false;
        if (version2) {
          return "v" + version2;
        }
        if (publicIDContainsVersion(publicID) || isUrl(publicID) || isFileName(publicID)) {
          return "";
        }
        return shouldForceVersion ? "v1" : "";
      }
      function isObject$1(a) {
        if (typeof a !== "object" || a instanceof Array) {
          return false;
        } else {
          return true;
        }
      }
      var Config = function() {
        function Config2() {
        }
        Config2.prototype.filterOutNonSupportedKeys = function(userProvidedConfig, validKeys) {
          var obj = Object.create({});
          if (isObject$1(userProvidedConfig)) {
            Object.keys(userProvidedConfig).forEach(function(key) {
              if (validKeys.indexOf(key) >= 0) {
                obj[key] = userProvidedConfig[key];
              } else {
                console.warn("Warning - unsupported key provided to configuration: ", key);
              }
            });
            return obj;
          } else {
            return Object.create({});
          }
        };
        return Config2;
      }();
      var URLConfig = function(_super) {
        __extends(URLConfig2, _super);
        function URLConfig2(userURLConfig) {
          var _this = _super.call(this) || this;
          var urlConfig = _this.filterOutNonSupportedKeys(userURLConfig, ALLOWED_URL_CONFIG);
          Object.assign(_this, {
            secure: true
          }, urlConfig);
          return _this;
        }
        URLConfig2.prototype.extend = function(userURLConfig) {
          var urlConfig = this.filterOutNonSupportedKeys(userURLConfig, ALLOWED_URL_CONFIG);
          return new URLConfig2(Object.assign({}, this, urlConfig));
        };
        URLConfig2.prototype.setCname = function(value) {
          this.cname = value;
          return this;
        };
        URLConfig2.prototype.setSecureDistribution = function(value) {
          this.secureDistribution = value;
          return this;
        };
        URLConfig2.prototype.setPrivateCdn = function(value) {
          this.privateCdn = value;
          return this;
        };
        URLConfig2.prototype.setSignUrl = function(value) {
          this.signUrl = value;
          return this;
        };
        URLConfig2.prototype.setLongUrlSignature = function(value) {
          this.longUrlSignature = value;
          return this;
        };
        URLConfig2.prototype.setShorten = function(value) {
          this.shorten = value;
          return this;
        };
        URLConfig2.prototype.setUseRootPath = function(value) {
          this.useRootPath = value;
          return this;
        };
        URLConfig2.prototype.setSecure = function(value) {
          this.secure = value;
          return this;
        };
        URLConfig2.prototype.setForceVersion = function(value) {
          this.forceVersion = value;
          return this;
        };
        return URLConfig2;
      }(Config);
      function stringPad(value, _targetLength, _padString) {
        var targetLength = _targetLength >> 0;
        var padString = String(typeof _padString !== "undefined" ? _padString : " ");
        if (value.length > targetLength) {
          return String(value);
        } else {
          targetLength = targetLength - value.length;
          if (targetLength > padString.length) {
            padString += repeatStringNumTimes(padString, targetLength / padString.length);
          }
          return padString.slice(0, targetLength) + String(value);
        }
      }
      function repeatStringNumTimes(string, _times) {
        var times = _times;
        var repeatedString = "";
        while (times > 0) {
          repeatedString += string;
          times--;
        }
        return repeatedString;
      }
      var chars2 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var base64Map = {};
      var num = 0;
      chars2.split("").forEach(function(char) {
        var key = num.toString(2);
        key = stringPad(key, 6, "0");
        base64Map[key] = char;
        num++;
      });
      function reverseVersion(semVer) {
        if (semVer.split(".").length < 2) {
          throw new Error("invalid semVer, must have at least two segments");
        }
        return semVer.split(".").reverse().map(function(segment) {
          var asNumber = +segment;
          if (isNaN(asNumber) || asNumber < 0) {
            throw "Invalid version number provided";
          }
          return stringPad(segment, 2, "0");
        }).join(".");
      }
      function encodeVersion(semVer) {
        var strResult = "";
        var parts = semVer.split(".").length;
        var paddedStringLength = parts * 6;
        var paddedReversedSemver = reverseVersion(semVer);
        var num2 = parseInt(paddedReversedSemver.split(".").join(""));
        var paddedBinary = num2.toString(2);
        paddedBinary = stringPad(paddedBinary, paddedStringLength, "0");
        if (paddedBinary.length % 6 !== 0) {
          throw "Version must be smaller than 43.21.26)";
        }
        paddedBinary.match(/.{1,6}/g).forEach(function(bitString) {
          strResult += base64Map[bitString];
        });
        return strResult;
      }
      function getAnalyticsOptions(options2) {
        var analyticsOptions = {
          sdkSemver: options2.sdkSemver,
          techVersion: options2.techVersion,
          sdkCode: options2.sdkCode,
          feature: "0"
        };
        if (options2.accessibility) {
          analyticsOptions.feature = "D";
        }
        if (options2.lazyload) {
          analyticsOptions.feature = "C";
        }
        if (options2.responsive) {
          analyticsOptions.feature = "A";
        }
        if (options2.placeholder) {
          analyticsOptions.feature = "B";
        }
        return analyticsOptions;
      }
      var name = "@cloudinary/url-gen";
      var version = "1.0.0-beta.5";
      var description = "";
      var keywords = [];
      var author = "";
      var license = "MIT";
      var dependencies = {
        "@types/lodash.clonedeep": "^4.5.6",
        "lodash.clonedeep": "^4.5.0"
      };
      var main = "./bundles/umd/base.js";
      var browser = "./index.js";
      var sideEffects = false;
      var pkg = {
        name,
        version,
        description,
        keywords,
        author,
        license,
        dependencies,
        main,
        browser,
        sideEffects
      };
      function getNodeVersion() {
        var failedVersion = "0.0.0";
        if (typeof window !== "undefined") {
          return failedVersion;
        } else {
          try {
            return process.versions.node || failedVersion;
          } catch (e) {
            return failedVersion;
          }
        }
      }
      function ensureShapeOfTrackedProperties(trackedAnalytics) {
        var defaults = {
          techVersion: getNodeVersion(),
          sdkCode: "T",
          sdkSemver: pkg.version.split("-")[0],
          responsive: false,
          placeholder: false,
          lazyload: false,
          accessibility: false
        };
        if (!trackedAnalytics) {
          return defaults;
        } else {
          return __assign(__assign({}, defaults), trackedAnalytics);
        }
      }
      function getSDKAnalyticsSignature(_trackedAnalytics) {
        var trackedAnalytics = ensureShapeOfTrackedProperties(_trackedAnalytics);
        var analyticsOptions = getAnalyticsOptions(trackedAnalytics);
        try {
          var twoPartVersion = removePatchFromSemver(analyticsOptions.techVersion);
          var encodedSDKVersion = encodeVersion(analyticsOptions.sdkSemver);
          var encodedTechVersion = encodeVersion(twoPartVersion);
          var featureCode = analyticsOptions.feature;
          var SDKCode = analyticsOptions.sdkCode;
          var algoVersion = "A";
          return "" + algoVersion + SDKCode + encodedSDKVersion + encodedTechVersion + featureCode;
        } catch (e) {
          return "E";
        }
      }
      function removePatchFromSemver(semVerStr) {
        var parts = semVerStr.split(".");
        return parts[0] + "." + parts[1];
      }
      var SEO_TYPES = {
        "image/upload": "images",
        "image/private": "private_images",
        "image/authenticated": "authenticated_images",
        "raw/upload": "files",
        "video/upload": "videos"
      };
      var CloudinaryFile = function() {
        function CloudinaryFile2(publicID, cloudConfig, urlConfig) {
          if (cloudConfig === void 0) {
            cloudConfig = {};
          }
          this.setPublicID(publicID);
          this.setCloudConfig(cloudConfig);
          this.setURLConfig(urlConfig);
        }
        CloudinaryFile2.prototype.setURLConfig = function(urlConfig) {
          this.urlConfig = new URLConfig(urlConfig);
          return this;
        };
        CloudinaryFile2.prototype.setCloudConfig = function(cloudConfig) {
          this.cloudName = cloudConfig.cloudName;
          this.apiKey = cloudConfig.apiKey;
          this.apiSecret = cloudConfig.apiSecret;
          this.authToken = cloudConfig.authToken;
          return this;
        };
        CloudinaryFile2.prototype.setPublicID = function(publicID) {
          this.publicID = publicID ? publicID.toString() : "";
          return this;
        };
        CloudinaryFile2.prototype.setDeliveryType = function(newType) {
          this.deliveryType = newType;
          return this;
        };
        CloudinaryFile2.prototype.setSuffix = function(newSuffix) {
          this.suffix = newSuffix;
          return this;
        };
        CloudinaryFile2.prototype.setSignature = function(signature) {
          this.signature = signature;
          return this;
        };
        CloudinaryFile2.prototype.setVersion = function(newVersion) {
          if (newVersion) {
            this.version = newVersion;
          }
          return this;
        };
        CloudinaryFile2.prototype.setAssetType = function(newType) {
          if (newType) {
            this.assetType = newType;
          }
          return this;
        };
        CloudinaryFile2.prototype.sign = function() {
          return this;
        };
        CloudinaryFile2.prototype.toURL = function(overwriteOptions) {
          if (overwriteOptions === void 0) {
            overwriteOptions = {};
          }
          return this.createCloudinaryURL(null, overwriteOptions.trackedAnalytics);
        };
        CloudinaryFile2.prototype.validateAssetForURLCreation = function() {
          if (typeof this.cloudName === "undefined") {
            throw "You must supply a cloudName in either toURL() or when initializing the asset";
          }
          var suffixContainsDot = this.suffix && this.suffix.indexOf(".") >= 0;
          var suffixContainsSlash = this.suffix && this.suffix.indexOf("/") >= 0;
          if (suffixContainsDot || suffixContainsSlash) {
            throw "`suffix`` should not include . or /";
          }
        };
        CloudinaryFile2.prototype.getResourceType = function() {
          var assetType = handleAssetType(this.assetType);
          var deliveryType = handleDeliveryType(this.deliveryType);
          var hasSuffix = !!this.suffix;
          var regularSEOType = assetType + "/" + deliveryType;
          var shortSEOType = SEO_TYPES[assetType + "/" + deliveryType];
          var useRootPath = this.urlConfig.useRootPath;
          var shorten = this.urlConfig.shorten;
          if (useRootPath) {
            if (regularSEOType === "image/upload") {
              return "";
            } else {
              throw new Error("useRootPath can only be used with assetType: 'image' and deliveryType: 'upload'. Provided: " + regularSEOType + " instead");
            }
          }
          if (shorten && regularSEOType === "image/upload") {
            return "iu";
          }
          if (hasSuffix) {
            if (shortSEOType) {
              return shortSEOType;
            } else {
              throw new Error("URL Suffix only supported for " + Object.keys(SEO_TYPES).join(", ") + ", Provided: " + regularSEOType + " instead");
            }
          }
          return regularSEOType;
        };
        CloudinaryFile2.prototype.getSignature = function() {
          if (this.signature) {
            return "s--" + this.signature + "--";
          } else {
            return "";
          }
        };
        CloudinaryFile2.prototype.createCloudinaryURL = function(transformation, trackedAnalytics) {
          if (!this.publicID) {
            return "";
          }
          this.validateAssetForURLCreation();
          var prefix = getUrlPrefix(this.cloudName, this.urlConfig);
          var transformationString = transformation ? transformation.toString() : "";
          var version2 = getUrlVersion(this.publicID, this.version, this.urlConfig.forceVersion);
          var publicID = this.publicID.replace(/,/g, "%2C");
          var url = [prefix, this.getResourceType(), this.getSignature(), transformationString, version2, publicID, this.suffix].filter(function(a) {
            return a;
          }).join("/");
          if (typeof transformation === "string") {
            return url;
          } else {
            var safeURL = encodeURI(url).replace(/\?/g, "%3F").replace(/=/g, "%3D");
            if (this.urlConfig.analytics !== false) {
              return safeURL + "?_a=" + getSDKAnalyticsSignature(trackedAnalytics);
            } else {
              return safeURL;
            }
          }
        };
        return CloudinaryFile2;
      }();
      var CloudinaryTransformable = function(_super) {
        __extends(CloudinaryTransformable2, _super);
        function CloudinaryTransformable2(publicID, cloudConfig, urlConfig, transformation) {
          var _this = _super.call(this, publicID, cloudConfig, urlConfig) || this;
          _this.transformation = transformation;
          return _this;
        }
        CloudinaryTransformable2.prototype.animated = function(animated2) {
          this.transformation.animated(animated2);
          return this;
        };
        CloudinaryTransformable2.prototype.border = function(border2) {
          this.transformation.border(border2);
          return this;
        };
        CloudinaryTransformable2.prototype.reshape = function(reshape) {
          this.transformation.reshape(reshape);
          return this;
        };
        CloudinaryTransformable2.prototype.resize = function(resize) {
          this.transformation.resize(resize);
          return this;
        };
        CloudinaryTransformable2.prototype.quality = function(quality2) {
          this.transformation.quality(quality2);
          return this;
        };
        CloudinaryTransformable2.prototype.roundCorners = function(roundCorners) {
          this.transformation.roundCorners(roundCorners);
          return this;
        };
        CloudinaryTransformable2.prototype.overlay = function(overlayAction) {
          this.transformation.overlay(overlayAction);
          return this;
        };
        CloudinaryTransformable2.prototype.addVariable = function(variableAction) {
          this.transformation.addVariable(variableAction);
          return this;
        };
        CloudinaryTransformable2.prototype.conditional = function(conditionalAction) {
          this.transformation.conditional(conditionalAction);
          return this;
        };
        CloudinaryTransformable2.prototype.effect = function(effect) {
          this.transformation.effect(effect);
          return this;
        };
        CloudinaryTransformable2.prototype.adjust = function(action) {
          this.transformation.adjust(action);
          return this;
        };
        CloudinaryTransformable2.prototype.rotate = function(rotate) {
          this.transformation.rotate(rotate);
          return this;
        };
        CloudinaryTransformable2.prototype.namedTransformation = function(namedTransformation) {
          this.transformation.namedTransformation(namedTransformation);
          return this;
        };
        CloudinaryTransformable2.prototype.delivery = function(deliveryAction) {
          this.transformation.delivery(deliveryAction);
          return this;
        };
        CloudinaryTransformable2.prototype.backgroundColor = function(color2) {
          this.transformation.backgroundColor(color2);
          return this;
        };
        CloudinaryTransformable2.prototype.psdTools = function(action) {
          this.transformation.psdTools(action);
          return this;
        };
        CloudinaryTransformable2.prototype.extract = function(action) {
          this.transformation.extract(action);
          return this;
        };
        CloudinaryTransformable2.prototype.addFlag = function(flagQualifier) {
          this.transformation.addFlag(flagQualifier);
          return this;
        };
        CloudinaryTransformable2.prototype.customFunction = function(customFunction) {
          this.transformation.customFunction(customFunction);
          return this;
        };
        CloudinaryTransformable2.prototype.addAction = function(action) {
          this.transformation.addAction(action);
          return this;
        };
        CloudinaryTransformable2.prototype.addTransformation = function(tx) {
          this.transformation.addTransformation(tx);
          return this;
        };
        CloudinaryTransformable2.prototype.toString = function() {
          return this.transformation.toString();
        };
        CloudinaryTransformable2.prototype.underlay = function(underlayAction) {
          this.transformation.underlay(underlayAction);
          return this;
        };
        CloudinaryTransformable2.prototype.toURL = function(overwriteOptions) {
          if (overwriteOptions === void 0) {
            overwriteOptions = {};
          }
          return this.createCloudinaryURL(this.transformation, overwriteOptions === null || overwriteOptions === void 0 ? void 0 : overwriteOptions.trackedAnalytics);
        };
        return CloudinaryTransformable2;
      }(CloudinaryFile);
      var CloudinaryImage = function(_super) {
        __extends(CloudinaryImage2, _super);
        function CloudinaryImage2(publicID, cloudConfig, urlConfig) {
          return _super.call(this, publicID, cloudConfig, urlConfig, new ImageTransformation()) || this;
        }
        return CloudinaryImage2;
      }(CloudinaryTransformable);
      var CloudinaryVideo = function(_super) {
        __extends(CloudinaryVideo2, _super);
        function CloudinaryVideo2(publicID, cloudConfig, urlConfig) {
          var _this = _super.call(this, publicID, cloudConfig, urlConfig, new VideoTransformation()) || this;
          _this.assetType = "video";
          return _this;
        }
        CloudinaryVideo2.prototype.transcode = function(action) {
          this.transformation.transcode(action);
          return this;
        };
        CloudinaryVideo2.prototype.videoEdit = function(action) {
          this.transformation.videoEdit(action);
          return this;
        };
        return CloudinaryVideo2;
      }(CloudinaryTransformable);
      var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
      function createCommonjsModule(fn, module3) {
        return module3 = { exports: {} }, fn(module3, module3.exports), module3.exports;
      }
      var lodash_clonedeep = createCommonjsModule(function(module3, exports3) {
        var LARGE_ARRAY_SIZE = 200;
        var HASH_UNDEFINED = "__lodash_hash_undefined__";
        var MAX_SAFE_INTEGER = 9007199254740991;
        var argsTag = "[object Arguments]", arrayTag = "[object Array]", boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag = "[object Map]", numberTag = "[object Number]", objectTag = "[object Object]", promiseTag = "[object Promise]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]", weakMapTag = "[object WeakMap]";
        var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
        var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
        var reFlags = /\w*$/;
        var reIsHostCtor = /^\[object .+?Constructor\]$/;
        var reIsUint = /^(?:0|[1-9]\d*)$/;
        var cloneableTags = {};
        cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
        cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
        var freeGlobal = typeof commonjsGlobal == "object" && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;
        var freeSelf = typeof self == "object" && self && self.Object === Object && self;
        var root = freeGlobal || freeSelf || Function("return this")();
        var freeExports = exports3 && !exports3.nodeType && exports3;
        var freeModule = freeExports && true && module3 && !module3.nodeType && module3;
        var moduleExports = freeModule && freeModule.exports === freeExports;
        function addMapEntry(map, pair) {
          map.set(pair[0], pair[1]);
          return map;
        }
        function addSetEntry(set, value) {
          set.add(value);
          return set;
        }
        function arrayEach(array, iteratee) {
          var index2 = -1, length = array ? array.length : 0;
          while (++index2 < length) {
            if (iteratee(array[index2], index2, array) === false) {
              break;
            }
          }
          return array;
        }
        function arrayPush(array, values) {
          var index2 = -1, length = values.length, offset = array.length;
          while (++index2 < length) {
            array[offset + index2] = values[index2];
          }
          return array;
        }
        function arrayReduce(array, iteratee, accumulator, initAccum) {
          var index2 = -1, length = array ? array.length : 0;
          if (initAccum && length) {
            accumulator = array[++index2];
          }
          while (++index2 < length) {
            accumulator = iteratee(accumulator, array[index2], index2, array);
          }
          return accumulator;
        }
        function baseTimes(n, iteratee) {
          var index2 = -1, result = Array(n);
          while (++index2 < n) {
            result[index2] = iteratee(index2);
          }
          return result;
        }
        function getValue(object, key) {
          return object == null ? void 0 : object[key];
        }
        function isHostObject(value) {
          var result = false;
          if (value != null && typeof value.toString != "function") {
            try {
              result = !!(value + "");
            } catch (e) {
            }
          }
          return result;
        }
        function mapToArray(map) {
          var index2 = -1, result = Array(map.size);
          map.forEach(function(value, key) {
            result[++index2] = [key, value];
          });
          return result;
        }
        function overArg(func, transform) {
          return function(arg) {
            return func(transform(arg));
          };
        }
        function setToArray(set) {
          var index2 = -1, result = Array(set.size);
          set.forEach(function(value) {
            result[++index2] = value;
          });
          return result;
        }
        var arrayProto = Array.prototype, funcProto = Function.prototype, objectProto = Object.prototype;
        var coreJsData = root["__core-js_shared__"];
        var maskSrcKey = function() {
          var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || "");
          return uid ? "Symbol(src)_1." + uid : "";
        }();
        var funcToString = funcProto.toString;
        var hasOwnProperty = objectProto.hasOwnProperty;
        var objectToString = objectProto.toString;
        var reIsNative = RegExp("^" + funcToString.call(hasOwnProperty).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
        var Buffer2 = moduleExports ? root.Buffer : void 0, Symbol2 = root.Symbol, Uint8Array2 = root.Uint8Array, getPrototype = overArg(Object.getPrototypeOf, Object), objectCreate = Object.create, propertyIsEnumerable = objectProto.propertyIsEnumerable, splice = arrayProto.splice;
        var nativeGetSymbols = Object.getOwnPropertySymbols, nativeIsBuffer = Buffer2 ? Buffer2.isBuffer : void 0, nativeKeys = overArg(Object.keys, Object);
        var DataView = getNative(root, "DataView"), Map2 = getNative(root, "Map"), Promise2 = getNative(root, "Promise"), Set2 = getNative(root, "Set"), WeakMap2 = getNative(root, "WeakMap"), nativeCreate = getNative(Object, "create");
        var dataViewCtorString = toSource(DataView), mapCtorString = toSource(Map2), promiseCtorString = toSource(Promise2), setCtorString = toSource(Set2), weakMapCtorString = toSource(WeakMap2);
        var symbolProto = Symbol2 ? Symbol2.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
        function Hash(entries) {
          var index2 = -1, length = entries ? entries.length : 0;
          this.clear();
          while (++index2 < length) {
            var entry = entries[index2];
            this.set(entry[0], entry[1]);
          }
        }
        function hashClear() {
          this.__data__ = nativeCreate ? nativeCreate(null) : {};
        }
        function hashDelete(key) {
          return this.has(key) && delete this.__data__[key];
        }
        function hashGet(key) {
          var data = this.__data__;
          if (nativeCreate) {
            var result = data[key];
            return result === HASH_UNDEFINED ? void 0 : result;
          }
          return hasOwnProperty.call(data, key) ? data[key] : void 0;
        }
        function hashHas(key) {
          var data = this.__data__;
          return nativeCreate ? data[key] !== void 0 : hasOwnProperty.call(data, key);
        }
        function hashSet(key, value) {
          var data = this.__data__;
          data[key] = nativeCreate && value === void 0 ? HASH_UNDEFINED : value;
          return this;
        }
        Hash.prototype.clear = hashClear;
        Hash.prototype["delete"] = hashDelete;
        Hash.prototype.get = hashGet;
        Hash.prototype.has = hashHas;
        Hash.prototype.set = hashSet;
        function ListCache(entries) {
          var index2 = -1, length = entries ? entries.length : 0;
          this.clear();
          while (++index2 < length) {
            var entry = entries[index2];
            this.set(entry[0], entry[1]);
          }
        }
        function listCacheClear() {
          this.__data__ = [];
        }
        function listCacheDelete(key) {
          var data = this.__data__, index2 = assocIndexOf(data, key);
          if (index2 < 0) {
            return false;
          }
          var lastIndex = data.length - 1;
          if (index2 == lastIndex) {
            data.pop();
          } else {
            splice.call(data, index2, 1);
          }
          return true;
        }
        function listCacheGet(key) {
          var data = this.__data__, index2 = assocIndexOf(data, key);
          return index2 < 0 ? void 0 : data[index2][1];
        }
        function listCacheHas(key) {
          return assocIndexOf(this.__data__, key) > -1;
        }
        function listCacheSet(key, value) {
          var data = this.__data__, index2 = assocIndexOf(data, key);
          if (index2 < 0) {
            data.push([key, value]);
          } else {
            data[index2][1] = value;
          }
          return this;
        }
        ListCache.prototype.clear = listCacheClear;
        ListCache.prototype["delete"] = listCacheDelete;
        ListCache.prototype.get = listCacheGet;
        ListCache.prototype.has = listCacheHas;
        ListCache.prototype.set = listCacheSet;
        function MapCache(entries) {
          var index2 = -1, length = entries ? entries.length : 0;
          this.clear();
          while (++index2 < length) {
            var entry = entries[index2];
            this.set(entry[0], entry[1]);
          }
        }
        function mapCacheClear() {
          this.__data__ = {
            "hash": new Hash(),
            "map": new (Map2 || ListCache)(),
            "string": new Hash()
          };
        }
        function mapCacheDelete(key) {
          return getMapData(this, key)["delete"](key);
        }
        function mapCacheGet(key) {
          return getMapData(this, key).get(key);
        }
        function mapCacheHas(key) {
          return getMapData(this, key).has(key);
        }
        function mapCacheSet(key, value) {
          getMapData(this, key).set(key, value);
          return this;
        }
        MapCache.prototype.clear = mapCacheClear;
        MapCache.prototype["delete"] = mapCacheDelete;
        MapCache.prototype.get = mapCacheGet;
        MapCache.prototype.has = mapCacheHas;
        MapCache.prototype.set = mapCacheSet;
        function Stack(entries) {
          this.__data__ = new ListCache(entries);
        }
        function stackClear() {
          this.__data__ = new ListCache();
        }
        function stackDelete(key) {
          return this.__data__["delete"](key);
        }
        function stackGet(key) {
          return this.__data__.get(key);
        }
        function stackHas(key) {
          return this.__data__.has(key);
        }
        function stackSet(key, value) {
          var cache = this.__data__;
          if (cache instanceof ListCache) {
            var pairs = cache.__data__;
            if (!Map2 || pairs.length < LARGE_ARRAY_SIZE - 1) {
              pairs.push([key, value]);
              return this;
            }
            cache = this.__data__ = new MapCache(pairs);
          }
          cache.set(key, value);
          return this;
        }
        Stack.prototype.clear = stackClear;
        Stack.prototype["delete"] = stackDelete;
        Stack.prototype.get = stackGet;
        Stack.prototype.has = stackHas;
        Stack.prototype.set = stackSet;
        function arrayLikeKeys(value, inherited) {
          var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
          var length = result.length, skipIndexes = !!length;
          for (var key in value) {
            if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
              result.push(key);
            }
          }
          return result;
        }
        function assignValue(object, key, value) {
          var objValue = object[key];
          if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) {
            object[key] = value;
          }
        }
        function assocIndexOf(array, key) {
          var length = array.length;
          while (length--) {
            if (eq(array[length][0], key)) {
              return length;
            }
          }
          return -1;
        }
        function baseAssign(object, source2) {
          return object && copyObject(source2, keys(source2), object);
        }
        function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
          var result;
          if (customizer) {
            result = object ? customizer(value, key, object, stack) : customizer(value);
          }
          if (result !== void 0) {
            return result;
          }
          if (!isObject2(value)) {
            return value;
          }
          var isArr = isArray(value);
          if (isArr) {
            result = initCloneArray(value);
            if (!isDeep) {
              return copyArray(value, result);
            }
          } else {
            var tag = getTag(value), isFunc = tag == funcTag || tag == genTag;
            if (isBuffer(value)) {
              return cloneBuffer(value, isDeep);
            }
            if (tag == objectTag || tag == argsTag || isFunc && !object) {
              if (isHostObject(value)) {
                return object ? value : {};
              }
              result = initCloneObject(isFunc ? {} : value);
              if (!isDeep) {
                return copySymbols(value, baseAssign(result, value));
              }
            } else {
              if (!cloneableTags[tag]) {
                return object ? value : {};
              }
              result = initCloneByTag(value, tag, baseClone, isDeep);
            }
          }
          stack || (stack = new Stack());
          var stacked = stack.get(value);
          if (stacked) {
            return stacked;
          }
          stack.set(value, result);
          if (!isArr) {
            var props = isFull ? getAllKeys(value) : keys(value);
          }
          arrayEach(props || value, function(subValue, key2) {
            if (props) {
              key2 = subValue;
              subValue = value[key2];
            }
            assignValue(result, key2, baseClone(subValue, isDeep, isFull, customizer, key2, value, stack));
          });
          return result;
        }
        function baseCreate(proto) {
          return isObject2(proto) ? objectCreate(proto) : {};
        }
        function baseGetAllKeys(object, keysFunc, symbolsFunc) {
          var result = keysFunc(object);
          return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
        }
        function baseGetTag(value) {
          return objectToString.call(value);
        }
        function baseIsNative(value) {
          if (!isObject2(value) || isMasked(value)) {
            return false;
          }
          var pattern = isFunction2(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
          return pattern.test(toSource(value));
        }
        function baseKeys(object) {
          if (!isPrototype(object)) {
            return nativeKeys(object);
          }
          var result = [];
          for (var key in Object(object)) {
            if (hasOwnProperty.call(object, key) && key != "constructor") {
              result.push(key);
            }
          }
          return result;
        }
        function cloneBuffer(buffer, isDeep) {
          if (isDeep) {
            return buffer.slice();
          }
          var result = new buffer.constructor(buffer.length);
          buffer.copy(result);
          return result;
        }
        function cloneArrayBuffer(arrayBuffer) {
          var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
          new Uint8Array2(result).set(new Uint8Array2(arrayBuffer));
          return result;
        }
        function cloneDataView(dataView, isDeep) {
          var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
          return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
        }
        function cloneMap(map, isDeep, cloneFunc) {
          var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
          return arrayReduce(array, addMapEntry, new map.constructor());
        }
        function cloneRegExp(regexp) {
          var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
          result.lastIndex = regexp.lastIndex;
          return result;
        }
        function cloneSet(set, isDeep, cloneFunc) {
          var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
          return arrayReduce(array, addSetEntry, new set.constructor());
        }
        function cloneSymbol(symbol) {
          return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
        }
        function cloneTypedArray(typedArray, isDeep) {
          var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
          return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
        }
        function copyArray(source2, array) {
          var index2 = -1, length = source2.length;
          array || (array = Array(length));
          while (++index2 < length) {
            array[index2] = source2[index2];
          }
          return array;
        }
        function copyObject(source2, props, object, customizer) {
          object || (object = {});
          var index2 = -1, length = props.length;
          while (++index2 < length) {
            var key = props[index2];
            var newValue = customizer ? customizer(object[key], source2[key], key, object, source2) : void 0;
            assignValue(object, key, newValue === void 0 ? source2[key] : newValue);
          }
          return object;
        }
        function copySymbols(source2, object) {
          return copyObject(source2, getSymbols(source2), object);
        }
        function getAllKeys(object) {
          return baseGetAllKeys(object, keys, getSymbols);
        }
        function getMapData(map, key) {
          var data = map.__data__;
          return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
        }
        function getNative(object, key) {
          var value = getValue(object, key);
          return baseIsNative(value) ? value : void 0;
        }
        var getSymbols = nativeGetSymbols ? overArg(nativeGetSymbols, Object) : stubArray;
        var getTag = baseGetTag;
        if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map2 && getTag(new Map2()) != mapTag || Promise2 && getTag(Promise2.resolve()) != promiseTag || Set2 && getTag(new Set2()) != setTag || WeakMap2 && getTag(new WeakMap2()) != weakMapTag) {
          getTag = function(value) {
            var result = objectToString.call(value), Ctor = result == objectTag ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : void 0;
            if (ctorString) {
              switch (ctorString) {
                case dataViewCtorString:
                  return dataViewTag;
                case mapCtorString:
                  return mapTag;
                case promiseCtorString:
                  return promiseTag;
                case setCtorString:
                  return setTag;
                case weakMapCtorString:
                  return weakMapTag;
              }
            }
            return result;
          };
        }
        function initCloneArray(array) {
          var length = array.length, result = array.constructor(length);
          if (length && typeof array[0] == "string" && hasOwnProperty.call(array, "index")) {
            result.index = array.index;
            result.input = array.input;
          }
          return result;
        }
        function initCloneObject(object) {
          return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
        }
        function initCloneByTag(object, tag, cloneFunc, isDeep) {
          var Ctor = object.constructor;
          switch (tag) {
            case arrayBufferTag:
              return cloneArrayBuffer(object);
            case boolTag:
            case dateTag:
              return new Ctor(+object);
            case dataViewTag:
              return cloneDataView(object, isDeep);
            case float32Tag:
            case float64Tag:
            case int8Tag:
            case int16Tag:
            case int32Tag:
            case uint8Tag:
            case uint8ClampedTag:
            case uint16Tag:
            case uint32Tag:
              return cloneTypedArray(object, isDeep);
            case mapTag:
              return cloneMap(object, isDeep, cloneFunc);
            case numberTag:
            case stringTag:
              return new Ctor(object);
            case regexpTag:
              return cloneRegExp(object);
            case setTag:
              return cloneSet(object, isDeep, cloneFunc);
            case symbolTag:
              return cloneSymbol(object);
          }
        }
        function isIndex(value, length) {
          length = length == null ? MAX_SAFE_INTEGER : length;
          return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
        }
        function isKeyable(value) {
          var type = typeof value;
          return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
        }
        function isMasked(func) {
          return !!maskSrcKey && maskSrcKey in func;
        }
        function isPrototype(value) {
          var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
          return value === proto;
        }
        function toSource(func) {
          if (func != null) {
            try {
              return funcToString.call(func);
            } catch (e) {
            }
            try {
              return func + "";
            } catch (e) {
            }
          }
          return "";
        }
        function cloneDeep2(value) {
          return baseClone(value, true, true);
        }
        function eq(value, other) {
          return value === other || value !== value && other !== other;
        }
        function isArguments(value) {
          return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
        }
        var isArray = Array.isArray;
        function isArrayLike(value) {
          return value != null && isLength(value.length) && !isFunction2(value);
        }
        function isArrayLikeObject(value) {
          return isObjectLike(value) && isArrayLike(value);
        }
        var isBuffer = nativeIsBuffer || stubFalse;
        function isFunction2(value) {
          var tag = isObject2(value) ? objectToString.call(value) : "";
          return tag == funcTag || tag == genTag;
        }
        function isLength(value) {
          return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
        }
        function isObject2(value) {
          var type = typeof value;
          return !!value && (type == "object" || type == "function");
        }
        function isObjectLike(value) {
          return !!value && typeof value == "object";
        }
        function keys(object) {
          return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
        }
        function stubArray() {
          return [];
        }
        function stubFalse() {
          return false;
        }
        module3.exports = cloneDeep2;
      });
      function cloneDeep(val) {
        return lodash_clonedeep(val);
      }
      var CloudinaryMedia = function(_super) {
        __extends(CloudinaryMedia2, _super);
        function CloudinaryMedia2(publicID, cloudConfig, urlConfig) {
          return _super.call(this, publicID, cloudConfig, urlConfig, new Transformation$2()) || this;
        }
        CloudinaryMedia2.prototype.transcode = function(action) {
          this.transformation.transcode(action);
          return this;
        };
        CloudinaryMedia2.prototype.videoEdit = function(action) {
          this.transformation.videoEdit(action);
          return this;
        };
        CloudinaryMedia2.prototype.underlay = function(underlayAction) {
          this.transformation.underlay(underlayAction);
          return this;
        };
        CloudinaryMedia2.prototype.clone = function() {
          return cloneDeep(this);
        };
        return CloudinaryMedia2;
      }(CloudinaryTransformable);
      var Cloudinary2 = function() {
        function Cloudinary3(cloudinaryConfig) {
          if (cloudinaryConfig) {
            this.cloudinaryConfig = cloudinaryConfig;
          }
        }
        Cloudinary3.prototype.image = function(publicID) {
          return new CloudinaryImage(publicID, this.cloudinaryConfig.cloud, this.cloudinaryConfig.url);
        };
        Cloudinary3.prototype.video = function(publicID) {
          return new CloudinaryVideo(publicID, this.cloudinaryConfig.cloud, this.cloudinaryConfig.url);
        };
        Cloudinary3.prototype.setConfig = function(cloudinaryConfig) {
          this.cloudinaryConfig = cloudinaryConfig;
          return this;
        };
        Cloudinary3.prototype.extendConfig = function() {
        };
        return Cloudinary3;
      }();
      function isObject(a) {
        return typeof a === "object" && a !== null;
      }
      var LEGACY_CONDITIONAL_OPERATORS = {
        "=": "eq",
        "!=": "ne",
        "<": "lt",
        ">": "gt",
        "<=": "lte",
        ">=": "gte",
        "&&": "and",
        "||": "or",
        "*": "mul",
        "/": "div",
        "+": "add",
        "-": "sub",
        "^": "pow"
      };
      var OLD_AKAMAI_SHARED_CDN = "cloudinary-a.akamaihd.net";
      var AKAMAI_SHARED_CDN = "res.cloudinary.com";
      var SHARED_CDN = AKAMAI_SHARED_CDN;
      var LEGACY_PREDEFINED_VARS = {
        "aspect_ratio": "ar",
        "aspectRatio": "ar",
        "current_page": "cp",
        "currentPage": "cp",
        "duration": "du",
        "face_count": "fc",
        "faceCount": "fc",
        "height": "h",
        "initial_aspect_ratio": "iar",
        "initial_height": "ih",
        "initial_width": "iw",
        "initialAspectRatio": "iar",
        "initialHeight": "ih",
        "initialWidth": "iw",
        "initial_duration": "idu",
        "initialDuration": "idu",
        "page_count": "pc",
        "page_x": "px",
        "page_y": "py",
        "pageCount": "pc",
        "pageX": "px",
        "pageY": "py",
        "tags": "tags",
        "width": "w"
      };
      var NUMBER_PATTERN = "([0-9]*)\\.([0-9]+)|([0-9]+)";
      var OFFSET_ANY_PATTERN = "(" + NUMBER_PATTERN + ")([%pP])?";
      var RANGE_VALUE_RE = RegExp("^" + OFFSET_ANY_PATTERN + "$");
      var OFFSET_ANY_PATTERN_RE = RegExp("(" + OFFSET_ANY_PATTERN + ")\\.\\.(" + OFFSET_ANY_PATTERN + ")");
      var LAYER_KEYWORD_PARAMS = {
        font_weight: "normal",
        font_style: "normal",
        text_decoration: "none",
        text_align: "",
        stroke: "none"
      };
      function smartEscape(string, unsafe) {
        if (unsafe === void 0) {
          unsafe = /([^a-zA-Z0-9_.\-\/:]+)/g;
        }
        return string.replace(unsafe, function(match) {
          return match.split("").map(function(c) {
            return "%" + c.charCodeAt(0).toString(16).toUpperCase();
          }).join("");
        });
      }
      var snakeCase = function(str) {
        return str.replace(/[A-Z]/g, function(letter) {
          return "_" + letter.toLowerCase();
        });
      };
      var Layer = function() {
        function Layer2(options2) {
          var _this = this;
          this.options = {};
          if (options2 != null) {
            ["resourceType", "type", "publicId", "format"].forEach(function(key) {
              var ref;
              return _this.options[key] = (ref = options2[key]) != null ? ref : options2[snakeCase(key)];
            });
          }
        }
        Layer2.prototype.resourceType = function(value) {
          this.options.resourceType = value;
          return this;
        };
        Layer2.prototype.type = function(value) {
          this.options.type = value;
          return this;
        };
        Layer2.prototype.publicId = function(value) {
          this.options.publicId = value;
          return this;
        };
        Layer2.prototype.getPublicId = function() {
          var ref;
          return (ref = this.options.publicId) != null ? ref.replace(/\//g, ":") : void 0;
        };
        Layer2.prototype.getFullPublicId = function() {
          if (this.options.format != null) {
            return this.getPublicId() + "." + this.options.format;
          } else {
            return this.getPublicId();
          }
        };
        Layer2.prototype.format = function(value) {
          this.options.format = value;
          return this;
        };
        Layer2.prototype.toString = function() {
          var components = [];
          if (this.options.publicId == null) {
            throw "Must supply publicId";
          }
          if (!(this.options.resourceType === "image")) {
            components.push(this.options.resourceType);
          }
          if (!(this.options.type === "upload")) {
            components.push(this.options.type);
          }
          components.push(this.getFullPublicId());
          return components.filter(function(x) {
            return !!x;
          }).join(":");
        };
        Layer2.prototype.clone = function() {
          return new Layer2(this.options);
        };
        return Layer2;
      }();
      function isEmpty(value) {
        return value === void 0 || value === null || typeof value === "object" && Object.keys(value).length === 0 || typeof value === "string" && value.trim().length === 0;
      }
      var isNumberLike = function(value) {
        return value != null && !isNaN(parseFloat(value));
      };
      var TextLayer = function(_super) {
        __extends(TextLayer2, _super);
        function TextLayer2(options2) {
          var _this = this;
          var keys;
          _this = _super.call(this, options2) || this;
          keys = ["resourceType", "resourceType", "fontFamily", "fontSize", "fontWeight", "fontStyle", "textDecoration", "textAlign", "stroke", "letterSpacing", "lineSpacing", "fontHinting", "fontAntialiasing", "text"];
          if (options2 != null) {
            keys.forEach(function(key) {
              var ref;
              return _this.options[key] = (ref = options2[key]) != null ? ref : options2[snakeCase(key)];
            });
          }
          _this.options.resourceType = "text";
          return _this;
        }
        TextLayer2.prototype.resourceType = function(resourceType) {
          throw "Cannot modify resourceType for text layers";
        };
        TextLayer2.prototype.type = function(type) {
          throw "Cannot modify type for text layers";
        };
        TextLayer2.prototype.format = function(format3) {
          throw "Cannot modify format for text layers";
        };
        TextLayer2.prototype.fontFamily = function(fontFamily) {
          this.options.fontFamily = fontFamily;
          return this;
        };
        TextLayer2.prototype.fontSize = function(fontSize) {
          this.options.fontSize = fontSize;
          return this;
        };
        TextLayer2.prototype.fontWeight = function(fontWeight) {
          this.options.fontWeight = fontWeight;
          return this;
        };
        TextLayer2.prototype.fontStyle = function(fontStyle) {
          this.options.fontStyle = fontStyle;
          return this;
        };
        TextLayer2.prototype.textDecoration = function(textDecoration) {
          this.options.textDecoration = textDecoration;
          return this;
        };
        TextLayer2.prototype.textAlign = function(textAlign) {
          this.options.textAlign = textAlign;
          return this;
        };
        TextLayer2.prototype.stroke = function(stroke) {
          this.options.stroke = stroke;
          return this;
        };
        TextLayer2.prototype.letterSpacing = function(letterSpacing) {
          this.options.letterSpacing = letterSpacing;
          return this;
        };
        TextLayer2.prototype.lineSpacing = function(lineSpacing) {
          this.options.lineSpacing = lineSpacing;
          return this;
        };
        TextLayer2.prototype.fontHinting = function(fontHinting) {
          this.options.fontHinting = fontHinting;
          return this;
        };
        TextLayer2.prototype.fontAntialiasing = function(fontAntialiasing) {
          this.options.fontAntialiasing = fontAntialiasing;
          return this;
        };
        TextLayer2.prototype.text = function(text2) {
          this.options.text = text2;
          return this;
        };
        TextLayer2.prototype.toString = function() {
          var components, hasPublicId, hasStyle, publicId, re, res, start2, style, text2, textSource;
          style = this.textStyleIdentifier();
          if (this.options.publicId != null) {
            publicId = this.getFullPublicId();
          }
          if (this.options.text != null) {
            hasPublicId = !isEmpty(publicId);
            hasStyle = !isEmpty(style);
            if (hasPublicId && hasStyle || !hasPublicId && !hasStyle) {
              throw "Must supply either style parameters or a public_id when providing text parameter in a text overlay/underlay, but not both!";
            }
            re = /\$\([a-zA-Z]\w*\)/g;
            start2 = 0;
            textSource = smartEscape(this.options.text, /[,\/]/g);
            text2 = "";
            while (res = re.exec(textSource)) {
              text2 += smartEscape(textSource.slice(start2, res.index));
              text2 += res[0];
              start2 = res.index + res[0].length;
            }
            text2 += smartEscape(textSource.slice(start2));
          }
          components = [this.options.resourceType, style, publicId, text2];
          return components.filter(function(x) {
            return !!x;
          }).join(":");
        };
        TextLayer2.prototype.textStyleIdentifier = function() {
          var components;
          components = [];
          if (this.options.fontWeight !== "normal") {
            components.push(this.options.fontWeight);
          }
          if (this.options.fontStyle !== "normal") {
            components.push(this.options.fontStyle);
          }
          if (this.options.textDecoration !== "none") {
            components.push(this.options.textDecoration);
          }
          components.push(this.options.textAlign);
          if (this.options.stroke !== "none") {
            components.push(this.options.stroke);
          }
          if (!(isEmpty(this.options.letterSpacing) && !isNumberLike(this.options.letterSpacing))) {
            components.push("letter_spacing_" + this.options.letterSpacing);
          }
          if (!(isEmpty(this.options.lineSpacing) && !isNumberLike(this.options.lineSpacing))) {
            components.push("line_spacing_" + this.options.lineSpacing);
          }
          if (!isEmpty(this.options.fontAntialiasing)) {
            components.push("antialias_" + this.options.fontAntialiasing);
          }
          if (!isEmpty(this.options.fontHinting)) {
            components.push("hinting_" + this.options.fontHinting);
          }
          if (!isEmpty(components.filter(function(x) {
            return !!x;
          }))) {
            if (isEmpty(this.options.fontFamily)) {
              throw "Must supply fontFamily. " + components;
            }
            if (isEmpty(this.options.fontSize) && !isNumberLike(this.options.fontSize)) {
              throw "Must supply fontSize.";
            }
          }
          components.unshift(this.options.fontFamily, this.options.fontSize);
          components = components.filter(function(x) {
            return !!x;
          }).join("_");
          return components;
        };
        return TextLayer2;
      }(Layer);
      function textStyle(layer) {
        var keywords2 = [];
        var style = "";
        Object.keys(LAYER_KEYWORD_PARAMS).forEach(function(attr) {
          var default_value = LAYER_KEYWORD_PARAMS[attr];
          var attr_value = layer[attr] || default_value;
          if (attr_value !== default_value) {
            keywords2.push(attr_value);
          }
        });
        Object.keys(layer).forEach(function(attr) {
          if (attr === "letter_spacing" || attr === "line_spacing") {
            keywords2.push(attr + "_" + layer[attr]);
          }
          if (attr === "font_hinting") {
            keywords2.push(attr.split("_").pop() + "_" + layer[attr]);
          }
          if (attr === "font_antialiasing") {
            keywords2.push("antialias_" + layer[attr]);
          }
        });
        if (layer.hasOwnProperty("font_size") || !keywords2 || keywords2.length === 0) {
          if (!layer.font_size)
            throw "Must supply font_size for text in overlay/underlay";
          if (!layer.font_family)
            throw "Must supply font_family for text in overlay/underlay";
          keywords2.unshift(layer.font_size);
          keywords2.unshift(layer.font_family);
          style = keywords2.filter(function(a) {
            return a;
          }).join("_");
        }
        return style;
      }
      function processLayer(layer) {
        if (layer instanceof TextLayer || layer instanceof Layer) {
          return layer.toString();
        }
        var result = "";
        if (isObject(layer)) {
          if (layer.resource_type === "fetch" || layer.url != null) {
            result = "fetch:" + base64Encode(layer.url);
          } else {
            var public_id = layer.public_id;
            var format3 = layer.format;
            var resource_type = layer.resource_type || "image";
            var type = layer.type || "upload";
            var text2 = layer.text;
            var style = null;
            var components = [];
            var noPublicId = !public_id || public_id.length === 0;
            if (!noPublicId) {
              public_id = public_id.replace(new RegExp("/", "g"), ":");
              if (format3 != null) {
                public_id = public_id + "." + format3;
              }
            }
            if ((!text2 || text2.length === 0) && resource_type !== "text") {
              if (noPublicId) {
                throw "Must supply public_id for resource_type layer_parameter";
              }
              if (resource_type === "subtitles") {
                style = textStyle(layer);
              }
            } else {
              resource_type = "text";
              type = null;
              style = textStyle(layer);
              if (text2 && text2.length >= 0) {
                var noStyle = !style;
                if (!(noPublicId || noStyle) || noPublicId && noStyle) {
                  throw "Must supply either style parameters or a public_id when providing text parameter in a text overlay/underlay";
                }
                var re = /\$\([a-zA-Z]\w*\)/g;
                var start2 = 0;
                var textSource = smartEscape(decodeURIComponent(text2), /[,\/]/g);
                text2 = "";
                for (var res = re.exec(textSource); res; res = re.exec(textSource)) {
                  text2 += smartEscape(textSource.slice(start2, res.index));
                  text2 += res[0];
                  start2 = res.index + res[0].length;
                }
                text2 += encodeURIComponent(textSource.slice(start2));
              }
            }
            if (resource_type !== "image") {
              components.push(resource_type);
            }
            if (type !== "upload") {
              components.push(type);
            }
            components.push(style);
            components.push(public_id);
            components.push(text2);
            result = components.filter(function(a) {
              return a;
            }).join(":");
          }
        } else if (/^fetch:.+/.test(layer)) {
          result = "fetch:" + base64Encode(layer.substr(6));
        } else {
          result = layer;
        }
        return result;
      }
      function legacyNormalizeExpression(expression2) {
        if (typeof expression2 !== "string" || expression2.length === 0 || expression2.match(/^!.+!$/)) {
          if (expression2) {
            return expression2.toString();
          } else {
            return expression2;
          }
        }
        expression2 = String(expression2);
        var operators = "\\|\\||>=|<=|&&|!=|>|=|<|/|-|\\+|\\*|\\^";
        var operatorsPattern = "((" + operators + ")(?=[ _]))";
        var operatorsReplaceRE = new RegExp(operatorsPattern, "g");
        expression2 = expression2.replace(operatorsReplaceRE, function(match) {
          return LEGACY_CONDITIONAL_OPERATORS[match];
        });
        var predefinedVarsPattern = "(" + Object.keys(LEGACY_PREDEFINED_VARS).join("|") + ")";
        var userVariablePattern = "(\\$_*[^_ ]+)";
        var variablesReplaceRE = new RegExp(userVariablePattern + "|" + predefinedVarsPattern, "g");
        expression2 = expression2.replace(variablesReplaceRE, function(match) {
          return LEGACY_PREDEFINED_VARS[match] || match;
        });
        return expression2.replace(/[ _]+/g, "_");
      }
      function process_if(ifValue) {
        return ifValue ? "if_" + legacyNormalizeExpression(ifValue) : ifValue;
      }
      function toArray(arg) {
        switch (true) {
          case arg == null:
            return [];
          case Array.isArray(arg):
            return arg;
          default:
            return [arg];
        }
      }
      function processRadius(_radius) {
        var radius = _radius;
        if (!radius) {
          return radius;
        }
        if (!Array.isArray(radius)) {
          radius = [radius];
        }
        if (radius.length === 0 || radius.length > 4) {
          throw new Error("Radius array should contain between 1 and 4 values");
        }
        if (radius.findIndex(function(x) {
          return x === null;
        }) >= 0) {
          throw new Error("Corner: Cannot be null");
        }
        return radius.map(legacyNormalizeExpression).join(":");
      }
      function processCustomFunction$1(customFunction) {
        if (!isObject(customFunction)) {
          return customFunction;
        }
        if (customFunction.function_type === "remote") {
          var encodedSource = base64Encode(customFunction.source).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
          return [customFunction.function_type, encodedSource].join(":");
        }
        return [customFunction.function_type, customFunction.source].join(":");
      }
      function processCustomPreFunction(customPreFunction) {
        var result = processCustomFunction$1(customPreFunction);
        return typeof result === "string" ? "pre:" + result : null;
      }
      function splitRange(range) {
        switch (range && range.constructor) {
          case String:
            if (!OFFSET_ANY_PATTERN_RE.test(range)) {
              return range;
            }
            return range.split("..");
          case Array:
            return [[range], range[range.length - 1]];
          default:
            return [null, null];
        }
      }
      function normRangeValues(value) {
        var offset = String(value).match(RANGE_VALUE_RE);
        if (offset) {
          var modifier = offset[5] ? "p" : "";
          return "" + (offset[1] || offset[4]) + modifier;
        } else {
          return value;
        }
      }
      function processVideoParams(param) {
        switch (param && param.constructor) {
          case Object: {
            var video2 = "";
            if ("codec" in param) {
              video2 = param.codec;
              if ("profile" in param) {
                video2 += ":" + param.profile;
                if ("level" in param) {
                  video2 += ":" + param.level;
                }
              }
            }
            return video2;
          }
          case String:
            return param;
          default:
            return null;
        }
      }
      var Expression = function() {
        function Expression2(expressionStr) {
          this.expressions = [];
          if (expressionStr != null) {
            this.expressions.push(Expression2.normalize(expressionStr));
          }
        }
        Expression2.new = function(expressionStr) {
          return new this(expressionStr);
        };
        Expression2.normalize = function(expression2) {
          var operators, operatorsPattern, operatorsReplaceRE, predefinedVarsPattern, predefinedVarsReplaceRE;
          if (expression2 == null) {
            return expression2;
          }
          expression2 = String(expression2);
          operators = "\\|\\||>=|<=|&&|!=|>|=|<|/|-|\\+|\\*|\\^";
          operatorsPattern = "((" + operators + ")(?=[ _]))";
          operatorsReplaceRE = new RegExp(operatorsPattern, "g");
          expression2 = expression2.replace(operatorsReplaceRE, function(match) {
            return OPERATORS[match];
          });
          predefinedVarsPattern = "(" + Object.keys(PREDEFINED_VARS).join("|") + ")";
          predefinedVarsReplaceRE = new RegExp(predefinedVarsPattern, "g");
          expression2 = expression2.replace(predefinedVarsReplaceRE, function(match, p1, offset) {
            return expression2[offset - 1] === "$" ? match : PREDEFINED_VARS[match];
          });
          return expression2.replace(/[ _]+/g, "_");
        };
        Expression2.prototype.serialize = function() {
          return Expression2.normalize(this.expressions.join("_"));
        };
        Expression2.prototype.toString = function() {
          return this.serialize();
        };
        Expression2.prototype.getParent = function() {
          return this.parent;
        };
        Expression2.prototype.setParent = function(parent) {
          this.parent = parent;
          return this;
        };
        Expression2.prototype.predicate = function(name2, operator, value) {
          if (OPERATORS[operator] != null) {
            operator = OPERATORS[operator];
          }
          this.expressions.push(name2 + "_" + operator + "_" + value);
          return this;
        };
        Expression2.prototype.and = function() {
          this.expressions.push("and");
          return this;
        };
        Expression2.prototype.or = function() {
          this.expressions.push("or");
          return this;
        };
        Expression2.prototype.then = function() {
          return this.getParent().if(this.toString());
        };
        Expression2.prototype.height = function(operator, value) {
          return this.predicate("h", operator, value);
        };
        Expression2.prototype.width = function(operator, value) {
          return this.predicate("w", operator, value);
        };
        Expression2.prototype.aspectRatio = function(operator, value) {
          return this.predicate("ar", operator, value);
        };
        Expression2.prototype.pageCount = function(operator, value) {
          return this.predicate("pc", operator, value);
        };
        Expression2.prototype.faceCount = function(operator, value) {
          return this.predicate("fc", operator, value);
        };
        Expression2.prototype.value = function(value) {
          this.expressions.push(value);
          return this;
        };
        Expression2.variable = function(name2, value) {
          return new this(name2).value(value);
        };
        Expression2.width = function() {
          return new this("width");
        };
        Expression2.height = function() {
          return new this("height");
        };
        Expression2.initialWidth = function() {
          return new this("initialWidth");
        };
        Expression2.initialHeight = function() {
          return new this("initialHeight");
        };
        Expression2.aspectRatio = function() {
          return new this("aspectRatio");
        };
        Expression2.initialAspectRatio = function() {
          return new this("initialAspectRatio");
        };
        Expression2.pageCount = function() {
          return new this("pageCount");
        };
        Expression2.faceCount = function() {
          return new this("faceCount");
        };
        Expression2.currentPage = function() {
          return new this("currentPage");
        };
        Expression2.tags = function() {
          return new this("tags");
        };
        Expression2.pageX = function() {
          return new this("pageX");
        };
        Expression2.pageY = function() {
          return new this("pageY");
        };
        return Expression2;
      }();
      var OPERATORS = {
        "=": "eq",
        "!=": "ne",
        "<": "lt",
        ">": "gt",
        "<=": "lte",
        ">=": "gte",
        "&&": "and",
        "||": "or",
        "*": "mul",
        "/": "div",
        "+": "add",
        "-": "sub",
        "^": "pow"
      };
      var PREDEFINED_VARS = {
        "aspect_ratio": "ar",
        "aspectRatio": "ar",
        "current_page": "cp",
        "currentPage": "cp",
        "preview:duration": "preview:duration",
        "duration": "du",
        "face_count": "fc",
        "faceCount": "fc",
        "height": "h",
        "initial_aspect_ratio": "iar",
        "initial_duration": "idu",
        "initial_height": "ih",
        "initial_width": "iw",
        "initialAspectRatio": "iar",
        "initialDuration": "idu",
        "initialHeight": "ih",
        "initialWidth": "iw",
        "page_count": "pc",
        "page_x": "px",
        "page_y": "py",
        "pageCount": "pc",
        "pageX": "px",
        "pageY": "py",
        "tags": "tags",
        "width": "w"
      };
      var Condition = function(_super) {
        __extends(Condition2, _super);
        function Condition2(conditionStr) {
          return _super.call(this, conditionStr) || this;
        }
        Condition2.prototype.height = function(operator, value) {
          return this.predicate("h", operator, value);
        };
        Condition2.prototype.width = function(operator, value) {
          return this.predicate("w", operator, value);
        };
        Condition2.prototype.aspectRatio = function(operator, value) {
          return this.predicate("ar", operator, value);
        };
        Condition2.prototype.pageCount = function(operator, value) {
          return this.predicate("pc", operator, value);
        };
        Condition2.prototype.faceCount = function(operator, value) {
          return this.predicate("fc", operator, value);
        };
        Condition2.prototype.duration = function(operator, value) {
          return this.predicate("du", operator, value);
        };
        Condition2.prototype.initialDuration = function(operator, value) {
          return this.predicate("idu", operator, value);
        };
        return Condition2;
      }(Expression);
      var CONFIG_PARAMS = [
        "api_key",
        "api_secret",
        "callback",
        "cdn_subdomain",
        "cloud_name",
        "cname",
        "private_cdn",
        "protocol",
        "resource_type",
        "responsive",
        "responsive_class",
        "responsive_use_breakpoints",
        "responsive_width",
        "round_dpr",
        "secure",
        "secure_cdn_subdomain",
        "secure_distribution",
        "shorten",
        "type",
        "upload_preset",
        "url_suffix",
        "use_root_path",
        "version",
        "externalLibraries",
        "max_timeout_ms"
      ];
      var SubtitlesLayer = function(_super) {
        __extends(SubtitlesLayer2, _super);
        function SubtitlesLayer2(options2) {
          var _this = _super.call(this, options2) || this;
          _this.options.resourceType = "subtitles";
          return _this;
        }
        return SubtitlesLayer2;
      }(TextLayer);
      var FetchLayer = function(_super) {
        __extends(FetchLayer2, _super);
        function FetchLayer2(options2) {
          var _this = _super.call(this, options2) || this;
          if (isString(options2)) {
            _this.options.url = options2;
          } else if (options2 != null ? options2.url : void 0) {
            _this.options.url = options2.url;
          }
          return _this;
        }
        FetchLayer2.prototype.url = function(url) {
          this.options.url = url;
          return this;
        };
        FetchLayer2.prototype.toString = function() {
          return "fetch:" + base64Encode(this.options.url);
        };
        return FetchLayer2;
      }(Layer);
      function isFunction(variableToCheck) {
        return variableToCheck instanceof Function;
      }
      var withCamelCaseKeys = function(source2) {
        return convertKeys(source2, camelCase);
      };
      var camelCase = function(source2) {
        var words = source2.match(reWords);
        words = words.map(function(word) {
          return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
        });
        words[0] = words[0].toLocaleLowerCase();
        return words.join("");
      };
      var convertKeys = function(source2, converter) {
        var result, value;
        result = {};
        for (var key in source2) {
          value = source2[key];
          if (converter) {
            key = converter(key);
          }
          if (!isEmpty(key)) {
            result[key] = value;
          }
        }
        return result;
      };
      var reWords = function() {
        var lower, upper;
        upper = "[A-Z]";
        lower = "[a-z]+";
        return RegExp(upper + "+(?=" + upper + lower + ")|" + upper + "?" + lower + "|" + upper + "+|[0-9]+", "g");
      }();
      function identity(x) {
        return x;
      }
      function contains(a, obj) {
        for (var i = 0; i < a.length; i++) {
          if (a[i] === obj) {
            return true;
          }
        }
        return false;
      }
      function difference(arr1, arr2) {
        return arr1.filter(function(x) {
          return !arr2.includes(x);
        });
      }
      var allStrings = function(list) {
        return list.length && list.every(isString);
      };
      var Param = function() {
        function Param2(name2, shortName, process2) {
          if (process2 === void 0) {
            process2 = identity;
          }
          this.name = name2;
          this.shortName = shortName;
          this.process = process2;
        }
        Param2.prototype.set = function(origValue) {
          this.origValue = origValue;
          return this;
        };
        Param2.prototype.serialize = function() {
          var val, valid;
          val = this.value();
          valid = Array.isArray(val) || isObject(val) || isString(val) ? !isEmpty(val) : val != null;
          if (this.shortName != null && valid) {
            return this.shortName + "_" + val;
          } else {
            return "";
          }
        };
        Param2.prototype.value = function() {
          return this.process(this.origValue);
        };
        Param2.norm_color = function(value) {
          return value != null ? value.replace(/^#/, "rgb:") : void 0;
        };
        Param2.build_array = function(arg) {
          if (arg == null) {
            return [];
          } else if (Array.isArray(arg)) {
            return arg;
          } else {
            return [arg];
          }
        };
        Param2.process_video_params = function(param) {
          var video2;
          switch (param.constructor) {
            case Object:
              video2 = "";
              if ("codec" in param) {
                video2 = param.codec;
                if ("profile" in param) {
                  video2 += ":" + param.profile;
                  if ("level" in param) {
                    video2 += ":" + param.level;
                  }
                }
              }
              return video2;
            case String:
              return param;
            default:
              return null;
          }
        };
        return Param2;
      }();
      var ArrayParam = function(_super) {
        __extends(ArrayParam2, _super);
        function ArrayParam2(name2, shortName, sep, process2) {
          if (sep === void 0) {
            sep = ".";
          }
          if (process2 === void 0) {
            process2 = void 0;
          }
          var _this = _super.call(this, name2, shortName, process2) || this;
          _this.sep = sep;
          return _this;
        }
        ArrayParam2.prototype.serialize = function() {
          if (this.shortName != null) {
            var arrayValue = this.value();
            if (isEmpty(arrayValue)) {
              return "";
            } else if (isString(arrayValue)) {
              return this.shortName + "_" + arrayValue;
            } else {
              var flat = arrayValue.map(function(t) {
                return isFunction(t.serialize) ? t.serialize() : t;
              }).join(this.sep);
              return this.shortName + "_" + flat;
            }
          } else {
            return "";
          }
        };
        ArrayParam2.prototype.value = function() {
          var _this = this;
          if (Array.isArray(this.origValue)) {
            return this.origValue.map(function(v) {
              return _this.process(v);
            });
          } else {
            return this.process(this.origValue);
          }
        };
        ArrayParam2.prototype.set = function(origValue) {
          if (origValue == null || Array.isArray(origValue)) {
            return _super.prototype.set.call(this, origValue);
          } else {
            return _super.prototype.set.call(this, [origValue]);
          }
        };
        return ArrayParam2;
      }(Param);
      var TransformationParam = function(_super) {
        __extends(TransformationParam2, _super);
        function TransformationParam2(name2, shortName, sep, process2) {
          if (shortName === void 0) {
            shortName = "t";
          }
          if (sep === void 0) {
            sep = ".";
          }
          if (process2 === void 0) {
            process2 = void 0;
          }
          var _this = _super.call(this, name2, shortName, process2) || this;
          _this.sep = sep;
          return _this;
        }
        TransformationParam2.prototype.serialize = function() {
          var _this = this;
          var result = "";
          var val = this.value();
          if (isEmpty(val)) {
            return result;
          }
          if (allStrings(val)) {
            var joined = val.join(this.sep);
            if (!isEmpty(joined)) {
              result = this.shortName + "_" + joined;
            }
          } else {
            result = val.map(function(t) {
              if (isString(t) && !isEmpty(t)) {
                return _this.shortName + "_" + t;
              }
              if (isFunction(t.serialize)) {
                return t.serialize();
              }
              if (isObject(t) && !isEmpty(t)) {
                return new Transformation$1(t).serialize();
              }
              return void 0;
            }).filter(function(t) {
              return t;
            });
          }
          return result;
        };
        TransformationParam2.prototype.set = function(origValue1) {
          this.origValue = origValue1;
          if (Array.isArray(this.origValue)) {
            return _super.prototype.set.call(this, this.origValue);
          } else {
            return _super.prototype.set.call(this, [this.origValue]);
          }
        };
        return TransformationParam2;
      }(Param);
      var number_pattern = "([0-9]*)\\.([0-9]+)|([0-9]+)";
      var offset_any_pattern = "(" + number_pattern + ")([%pP])?";
      var RangeParam = function(_super) {
        __extends(RangeParam2, _super);
        function RangeParam2(name2, shortName, process2) {
          if (process2 === void 0) {
            process2 = RangeParam2.norm_range_value;
          }
          return _super.call(this, name2, shortName, process2) || this;
        }
        RangeParam2.norm_range_value = function(value) {
          var offset = String(value).match(new RegExp("^" + offset_any_pattern + "$"));
          if (offset) {
            var modifier = offset[5] != null ? "p" : "";
            value = (offset[1] || offset[4]) + modifier;
          }
          return value;
        };
        return RangeParam2;
      }(Param);
      var RawParam = function(_super) {
        __extends(RawParam2, _super);
        function RawParam2(name2, shortName, process2) {
          if (process2 === void 0) {
            process2 = identity;
          }
          return _super.call(this, name2, shortName, process2) || this;
        }
        RawParam2.prototype.serialize = function() {
          return this.value();
        };
        return RawParam2;
      }(Param);
      var LayerParam = function(_super) {
        __extends(LayerParam2, _super);
        function LayerParam2() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        LayerParam2.prototype.value = function() {
          if (this.origValue == null) {
            return "";
          }
          var result;
          if (this.origValue instanceof Layer) {
            result = this.origValue;
          } else if (isObject(this.origValue)) {
            var layerOptions = withCamelCaseKeys(this.origValue);
            if (layerOptions.resourceType === "text" || layerOptions.text != null) {
              result = new TextLayer(layerOptions);
            } else {
              if (layerOptions.resourceType === "subtitles") {
                result = new SubtitlesLayer(layerOptions);
              } else {
                if (layerOptions.resourceType === "fetch" || layerOptions.url != null) {
                  result = new FetchLayer(layerOptions);
                } else {
                  result = new Layer(layerOptions);
                }
              }
            }
          } else if (isString(this.origValue)) {
            if (/^fetch:.+/.test(this.origValue)) {
              result = new FetchLayer(this.origValue.substr(6));
            } else {
              result = this.origValue;
            }
          } else {
            result = "";
          }
          return result.toString();
        };
        LayerParam2.textStyle = function(layer) {
          return new TextLayer(layer).textStyleIdentifier();
        };
        return LayerParam2;
      }(Param);
      (function(_super) {
        __extends(ExpressionParam, _super);
        function ExpressionParam() {
          return _super !== null && _super.apply(this, arguments) || this;
        }
        ExpressionParam.prototype.serialize = function() {
          return Expression.normalize(_super.prototype.serialize.call(this));
        };
        return ExpressionParam;
      })(Param);
      var URL_KEYS = [
        "accessibility",
        "api_secret",
        "auth_token",
        "cdn_subdomain",
        "cloud_name",
        "cname",
        "format",
        "placeholder",
        "private_cdn",
        "resource_type",
        "secure",
        "secure_cdn_subdomain",
        "secure_distribution",
        "shorten",
        "sign_url",
        "signature",
        "ssl_detected",
        "type",
        "url_suffix",
        "use_root_path",
        "version"
      ];
      function assignNotNull(target) {
        var sources = [];
        for (var _i = 1; _i < arguments.length; _i++) {
          sources[_i - 1] = arguments[_i];
        }
        sources.forEach(function(source2) {
          Object.keys(source2).forEach(function(key) {
            if (source2[key] != null) {
              target[key] = source2[key];
            }
          });
        });
        return target;
      }
      var TransformationBase = function() {
        function TransformationBase2(options2) {
          var _this = this;
          var parent;
          var trans;
          parent = void 0;
          trans = {};
          this.toOptions = function(withChain) {
            var opt = {};
            if (withChain == null) {
              withChain = true;
            }
            Object.keys(trans).forEach(function(key) {
              return opt[key] = trans[key].origValue;
            });
            assignNotNull(opt, _this.otherOptions);
            if (withChain && !isEmpty(_this.chained)) {
              var list = _this.chained.map(function(tr) {
                return tr.toOptions();
              });
              list.push(opt);
              opt = {};
              assignNotNull(opt, _this.otherOptions);
              opt.transformation = list;
            }
            return opt;
          };
          this.setParent = function(object) {
            parent = object;
            if (object != null) {
              _this.fromOptions(typeof object.toOptions === "function" ? object.toOptions() : void 0);
            }
            return _this;
          };
          this.getParent = function() {
            return parent;
          };
          this.param = function(value, name2, abbr, defaultValue, process2) {
            if (process2 == null) {
              if (isFunction(defaultValue)) {
                process2 = defaultValue;
              } else {
                process2 = identity;
              }
            }
            trans[name2] = new Param(name2, abbr, process2).set(value);
            return _this;
          };
          this.rawParam = function(value, name2, abbr, defaultValue, process2) {
            process2 = lastArgCallback(arguments);
            trans[name2] = new RawParam(name2, abbr, process2).set(value);
            return this;
          };
          this.rangeParam = function(value, name2, abbr, defaultValue, process2) {
            process2 = lastArgCallback(arguments);
            trans[name2] = new RangeParam(name2, abbr, process2).set(value);
            return this;
          };
          this.arrayParam = function(value, name2, abbr, sep, defaultValue, process2) {
            if (sep === void 0) {
              sep = ":";
            }
            if (defaultValue === void 0) {
              defaultValue = [];
            }
            if (process2 === void 0) {
              process2 = void 0;
            }
            process2 = lastArgCallback(arguments);
            trans[name2] = new ArrayParam(name2, abbr, sep, process2).set(value);
            return this;
          };
          this.transformationParam = function(value, name2, abbr, sep, defaultValue, process2) {
            if (sep === void 0) {
              sep = ".";
            }
            if (defaultValue === void 0) {
              defaultValue = void 0;
            }
            if (process2 === void 0) {
              process2 = void 0;
            }
            process2 = lastArgCallback(arguments);
            trans[name2] = new TransformationParam(name2, abbr, sep, process2).set(value);
            return this;
          };
          this.layerParam = function(value, name2, abbr) {
            trans[name2] = new LayerParam(name2, abbr).set(value);
            return this;
          };
          this.getValue = function(name2) {
            var value = trans[name2] && trans[name2].value();
            return value != null ? value : this.otherOptions[name2];
          };
          this.get = function(name2) {
            return trans[name2];
          };
          this.remove = function(name2) {
            var temp;
            switch (false) {
              case trans[name2] == null:
                temp = trans[name2];
                delete trans[name2];
                return temp.origValue;
              case this.otherOptions[name2] == null:
                temp = this.otherOptions[name2];
                delete this.otherOptions[name2];
                return temp;
              default:
                return null;
            }
          };
          this.keys = function() {
            var key;
            return function() {
              var results;
              results = [];
              for (key in trans) {
                if (key != null) {
                  results.push(key.match(VAR_NAME_RE) ? key : snakeCase(key));
                }
              }
              return results;
            }().sort();
          };
          this.toPlainObject = function() {
            var hash2, key, list;
            hash2 = {};
            for (key in trans) {
              hash2[key] = trans[key].value();
              if (isObject(hash2[key])) {
                hash2[key] = cloneDeep(hash2[key]);
              }
            }
            if (!isEmpty(this.chained)) {
              list = this.chained.map(function(tr) {
                return tr.toPlainObject();
              });
              list.push(hash2);
              hash2 = {
                transformation: list
              };
            }
            return hash2;
          };
          this.chain = function() {
            var names, tr;
            names = Object.getOwnPropertyNames(trans);
            if (names.length !== 0) {
              tr = new this.constructor(this.toOptions(false));
              this.resetTransformations();
              this.chained.push(tr);
            }
            return this;
          };
          this.resetTransformations = function() {
            trans = {};
            return this;
          };
          this.otherOptions = {};
          this.chained = [];
          this.fromOptions(options2);
        }
        TransformationBase2.prototype.fromOptions = function(options2) {
          if (options2 === void 0) {
            options2 = {};
          }
          if (options2 instanceof TransformationBase2) {
            this.fromTransformation(options2);
          } else {
            if (isString(options2) || Array.isArray(options2)) {
              options2 = {
                transformation: options2
              };
            }
            options2 = cloneDeep(options2);
            if (options2["if"]) {
              this.set("if", options2["if"]);
              delete options2["if"];
            }
            for (var key in options2) {
              var opt = options2[key];
              if (opt != null) {
                if (key.match(VAR_NAME_RE)) {
                  if (key !== "$attr") {
                    this.set("variable", key, opt);
                  }
                } else {
                  this.set(key, opt);
                }
              }
            }
          }
          return this;
        };
        TransformationBase2.prototype.fromTransformation = function(other) {
          var _this = this;
          if (other instanceof TransformationBase2) {
            other.keys().forEach(function(key) {
              return _this.set(key, other.get(key).origValue);
            });
          }
          return this;
        };
        TransformationBase2.prototype.set = function(key) {
          var values = [];
          for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
          }
          var camelKey;
          camelKey = camelCase(key);
          if (contains(methods, camelKey)) {
            this[camelKey].apply(this, values);
          } else {
            this.otherOptions[key] = values[0];
          }
          return this;
        };
        TransformationBase2.prototype.hasLayer = function() {
          return this.getValue("overlay") || this.getValue("underlay");
        };
        TransformationBase2.prototype.serialize = function() {
          var ifParam, j, len, paramList, ref, ref1, ref2, ref3, ref4, resultArray, t, transformationList, transformationString, transformations, value, variables, vars;
          resultArray = this.chained.map(function(tr) {
            return tr.serialize();
          });
          paramList = this.keys();
          transformations = (ref = this.get("transformation")) != null ? ref.serialize() : void 0;
          ifParam = (ref1 = this.get("if")) != null ? ref1.serialize() : void 0;
          variables = processVar((ref2 = this.get("variables")) != null ? ref2.value() : void 0);
          paramList = difference(paramList, ["transformation", "if", "variables"]);
          vars = [];
          transformationList = [];
          for (j = 0, len = paramList.length; j < len; j++) {
            t = paramList[j];
            if (t.match(VAR_NAME_RE)) {
              vars.push(t + "_" + Expression.normalize((ref3 = this.get(t)) != null ? ref3.value() : void 0));
            } else {
              transformationList.push((ref4 = this.get(t)) != null ? ref4.serialize() : void 0);
            }
          }
          switch (false) {
            case !isString(transformations):
              transformationList.push(transformations);
              break;
            case !Array.isArray(transformations):
              resultArray = resultArray.concat(transformations);
          }
          transformationList = function() {
            var k, len1, results;
            results = [];
            for (k = 0, len1 = transformationList.length; k < len1; k++) {
              value = transformationList[k];
              if (Array.isArray(value) && !isEmpty(value) || !Array.isArray(value) && value) {
                results.push(value);
              }
            }
            return results;
          }();
          transformationList = vars.sort().concat(variables).concat(transformationList.sort());
          if (ifParam === "if_end") {
            transformationList.push(ifParam);
          } else if (!isEmpty(ifParam)) {
            transformationList.unshift(ifParam);
          }
          transformationString = transformationList.filter(function(x) {
            return !!x;
          }).join(param_separator);
          if (!isEmpty(transformationString)) {
            resultArray.push(transformationString);
          }
          return resultArray.filter(function(x) {
            return !!x;
          }).join(trans_separator);
        };
        TransformationBase2.listNames = function() {
          return methods;
        };
        TransformationBase2.prototype.toHtmlAttributes = function() {
          var _this = this;
          var attrName, height, options2, ref2, ref3, value, width;
          options2 = {};
          var snakeCaseKey;
          Object.keys(this.otherOptions).forEach(function(key) {
            value = _this.otherOptions[key];
            snakeCaseKey = snakeCase(key);
            if (!contains(PARAM_NAMES, snakeCaseKey) && !contains(URL_KEYS, snakeCaseKey)) {
              attrName = /^html_/.test(key) ? key.slice(5) : key;
              options2[attrName] = value;
            }
          });
          this.keys().forEach(function(key) {
            if (/^html_/.test(key)) {
              options2[camelCase(key.slice(5))] = _this.getValue(key);
            }
          });
          if (!(this.hasLayer() || this.getValue("angle") || contains(["fit", "limit", "lfill"], this.getValue("crop")))) {
            width = (ref2 = this.get("width")) != null ? ref2.origValue : void 0;
            height = (ref3 = this.get("height")) != null ? ref3.origValue : void 0;
            if (parseFloat(width) >= 1) {
              if (options2.width == null) {
                options2.width = width;
              }
            }
            if (parseFloat(height) >= 1) {
              if (options2.height == null) {
                options2.height = height;
              }
            }
          }
          return options2;
        };
        TransformationBase2.isValidParamName = function(name2) {
          return methods.indexOf(camelCase(name2)) >= 0;
        };
        TransformationBase2.prototype.toHtml = function() {
          var ref;
          return (ref = this.getParent()) != null ? typeof ref.toHtml === "function" ? ref.toHtml() : void 0 : void 0;
        };
        TransformationBase2.prototype.toString = function() {
          return this.serialize();
        };
        TransformationBase2.prototype.clone = function() {
          return new TransformationBase2(this.toOptions(true));
        };
        return TransformationBase2;
      }();
      var VAR_NAME_RE = /^\$[a-zA-Z0-9]+$/;
      var trans_separator = "/";
      var param_separator = ",";
      function lastArgCallback(args) {
        var callback;
        callback = args != null ? args[args.length - 1] : void 0;
        if (isFunction(callback)) {
          return callback;
        } else {
          return void 0;
        }
      }
      function processVar(varArray) {
        var _a;
        var j, len, name2, results, v;
        if (Array.isArray(varArray)) {
          results = [];
          for (j = 0, len = varArray.length; j < len; j++) {
            _a = varArray[j], name2 = _a[0], v = _a[1];
            results.push(name2 + "_" + Expression.normalize(v));
          }
          return results;
        } else {
          return varArray;
        }
      }
      function processCustomFunction(_a) {
        var function_type = _a.function_type, source2 = _a.source;
        if (function_type === "remote") {
          return [function_type, btoa(source2)].join(":");
        } else if (function_type === "wasm") {
          return [function_type, source2].join(":");
        }
      }
      var Transformation = function(_super) {
        __extends(Transformation2, _super);
        function Transformation2(options2) {
          return _super.call(this, options2) || this;
        }
        Transformation2.new = function(options2) {
          return new Transformation2(options2);
        };
        Transformation2.prototype.angle = function(value) {
          this.arrayParam(value, "angle", "a", ".", Expression.normalize);
          return this;
        };
        Transformation2.prototype.audioCodec = function(value) {
          this.param(value, "audio_codec", "ac");
          return this;
        };
        Transformation2.prototype.audioFrequency = function(value) {
          this.param(value, "audio_frequency", "af");
          return this;
        };
        Transformation2.prototype.aspectRatio = function(value) {
          this.param(value, "aspect_ratio", "ar", Expression.normalize);
          return this;
        };
        Transformation2.prototype.background = function(value) {
          this.param(value, "background", "b", Param.norm_color);
          return this;
        };
        Transformation2.prototype.bitRate = function(value) {
          this.param(value, "bit_rate", "br");
          return this;
        };
        Transformation2.prototype.border = function(value) {
          return this.param(value, "border", "bo", function(border2) {
            if (isObject(border2)) {
              border2 = Object.assign({}, {
                color: "black",
                width: 2
              }, border2);
              return border2.width + "px_solid_" + Param.norm_color(border2.color);
            } else {
              return border2;
            }
          });
        };
        Transformation2.prototype.color = function(value) {
          this.param(value, "color", "co", Param.norm_color);
          return this;
        };
        Transformation2.prototype.colorSpace = function(value) {
          this.param(value, "color_space", "cs");
          return this;
        };
        Transformation2.prototype.crop = function(value) {
          this.param(value, "crop", "c");
          return this;
        };
        Transformation2.prototype.customFunction = function(value) {
          return this.param(value, "custom_function", "fn", function() {
            return processCustomFunction(value);
          });
        };
        Transformation2.prototype.customPreFunction = function(value) {
          if (this.get("custom_function")) {
            return;
          }
          return this.rawParam(value, "custom_function", "", function() {
            value = processCustomFunction(value);
            return value ? "fn_pre:" + value : value;
          });
        };
        Transformation2.prototype.defaultImage = function(value) {
          this.param(value, "default_image", "d");
          return this;
        };
        Transformation2.prototype.delay = function(value) {
          this.param(value, "delay", "dl");
          return this;
        };
        Transformation2.prototype.density = function(value) {
          this.param(value, "density", "dn");
          return this;
        };
        Transformation2.prototype.duration = function(value) {
          this.rangeParam(value, "duration", "du");
          return this;
        };
        Transformation2.prototype.dpr = function(value) {
          return this.param(value, "dpr", "dpr", function(dpr2) {
            dpr2 = dpr2.toString();
            if (dpr2 != null ? dpr2.match(/^\d+$/) : void 0) {
              return dpr2 + ".0";
            } else {
              return Expression.normalize(dpr2);
            }
          });
        };
        Transformation2.prototype.effect = function(value) {
          this.arrayParam(value, "effect", "e", ":", Expression.normalize);
          return this;
        };
        Transformation2.prototype.else = function() {
          return this.if("else");
        };
        Transformation2.prototype.endIf = function() {
          return this.if("end");
        };
        Transformation2.prototype.endOffset = function(value) {
          this.rangeParam(value, "end_offset", "eo");
          return this;
        };
        Transformation2.prototype.fallbackContent = function(value) {
          this.param(value, "fallback_content");
          return this;
        };
        Transformation2.prototype.fetchFormat = function(value) {
          this.param(value, "fetch_format", "f");
          return this;
        };
        Transformation2.prototype.format = function(value) {
          this.param(value, "format");
          return this;
        };
        Transformation2.prototype.flags = function(value) {
          this.arrayParam(value, "flags", "fl", ".");
          return this;
        };
        Transformation2.prototype.gravity = function(value) {
          this.param(value, "gravity", "g");
          return this;
        };
        Transformation2.prototype.fps = function(value) {
          return this.param(value, "fps", "fps", function(fps2) {
            if (isString(fps2)) {
              return fps2;
            } else if (Array.isArray(fps2)) {
              return fps2.join("-");
            } else {
              return fps2;
            }
          });
        };
        Transformation2.prototype.height = function(value) {
          var _this = this;
          return this.param(value, "height", "h", function() {
            if (_this.getValue("crop") || _this.getValue("overlay") || _this.getValue("underlay")) {
              return Expression.normalize(value);
            } else {
              return null;
            }
          });
        };
        Transformation2.prototype.htmlHeight = function(value) {
          this.param(value, "html_height");
          return this;
        };
        Transformation2.prototype.htmlWidth = function(value) {
          this.param(value, "html_width");
          return this;
        };
        Transformation2.prototype.if = function(value) {
          if (value === void 0) {
            value = "";
          }
          var i, ifVal, j, trIf, trRest;
          switch (value) {
            case "else":
              this.chain();
              return this.param(value, "if", "if");
            case "end":
              this.chain();
              for (i = j = this.chained.length - 1; j >= 0; i = j += -1) {
                ifVal = this.chained[i].getValue("if");
                if (ifVal === "end") {
                  break;
                } else if (ifVal != null) {
                  trIf = Transformation2.new().if(ifVal);
                  this.chained[i].remove("if");
                  trRest = this.chained[i];
                  this.chained[i] = Transformation2.new().transformation([trIf, trRest]);
                  if (ifVal !== "else") {
                    break;
                  }
                }
              }
              return this.param(value, "if", "if");
            case "":
              return Condition.new().setParent(this);
            default:
              return this.param(value, "if", "if", function(value2) {
                return Condition.new(value2).toString();
              });
          }
        };
        Transformation2.prototype.keyframeInterval = function(value) {
          this.param(value, "keyframe_interval", "ki");
          return this;
        };
        Transformation2.prototype.ocr = function(value) {
          this.param(value, "ocr", "ocr");
          return this;
        };
        Transformation2.prototype.offset = function(value) {
          var _a;
          var end_o, start_o;
          _a = isFunction(value != null ? value.split : void 0) ? value.split("..") : Array.isArray(value) ? value : [null, null], start_o = _a[0], end_o = _a[1];
          if (start_o != null) {
            this.startOffset(start_o);
          }
          if (end_o != null) {
            return this.endOffset(end_o);
          }
        };
        Transformation2.prototype.opacity = function(value) {
          this.param(value, "opacity", "o", Expression.normalize);
          return this;
        };
        Transformation2.prototype.overlay = function(value) {
          this.layerParam(value, "overlay", "l");
          return this;
        };
        Transformation2.prototype.page = function(value) {
          this.param(value, "page", "pg");
          return this;
        };
        Transformation2.prototype.poster = function(value) {
          this.param(value, "poster");
          return this;
        };
        Transformation2.prototype.prefix = function(value) {
          this.param(value, "prefix", "p");
          return this;
        };
        Transformation2.prototype.quality = function(value) {
          this.param(value, "quality", "q", Expression.normalize);
          return this;
        };
        Transformation2.prototype.radius = function(value) {
          this.arrayParam(value, "radius", "r", ":", Expression.normalize);
          return this;
        };
        Transformation2.prototype.rawTransformation = function(value) {
          this.rawParam(value, "raw_transformation");
          return this;
        };
        Transformation2.prototype.size = function(value) {
          var _a;
          var height, width;
          if (isFunction(value != null ? value.split : void 0)) {
            _a = value.split("x"), width = _a[0], height = _a[1];
            this.width(width);
            return this.height(height);
          }
        };
        Transformation2.prototype.sourceTypes = function(value) {
          this.param(value, "source_types");
          return this;
        };
        Transformation2.prototype.sourceTransformation = function(value) {
          return this.param(value, "source_transformation");
        };
        Transformation2.prototype.startOffset = function(value) {
          this.rangeParam(value, "start_offset", "so");
          return this;
        };
        Transformation2.prototype.streamingProfile = function(value) {
          this.param(value, "streaming_profile", "sp");
          return this;
        };
        Transformation2.prototype.transformation = function(value) {
          this.transformationParam(value, "transformation", "t");
          return this;
        };
        Transformation2.prototype.underlay = function(value) {
          this.layerParam(value, "underlay", "u");
          return this;
        };
        Transformation2.prototype.variable = function(name2, value) {
          this.param(value, name2, name2);
          return this;
        };
        Transformation2.prototype.variables = function(values) {
          this.arrayParam(values, "variables");
          return this;
        };
        Transformation2.prototype.videoCodec = function(value) {
          this.param(value, "video_codec", "vc", Param.process_video_params);
          return this;
        };
        Transformation2.prototype.videoSampling = function(value) {
          this.param(value, "video_sampling", "vs");
          return this;
        };
        Transformation2.prototype.width = function(value) {
          var _this = this;
          this.param(value, "width", "w", function() {
            if (_this.getValue("crop") || _this.getValue("overlay") || _this.getValue("underlay")) {
              return Expression.normalize(value);
            } else {
              return null;
            }
          });
          return this;
        };
        Transformation2.prototype.x = function(value) {
          this.param(value, "x", "x", Expression.normalize);
          return this;
        };
        Transformation2.prototype.y = function(value) {
          this.param(value, "y", "y", Expression.normalize);
          return this;
        };
        Transformation2.prototype.zoom = function(value) {
          this.param(value, "zoom", "z", Expression.normalize);
          return this;
        };
        return Transformation2;
      }(TransformationBase);
      var methods = [
        "angle",
        "audioCodec",
        "audioFrequency",
        "aspectRatio",
        "background",
        "bitRate",
        "border",
        "color",
        "colorSpace",
        "crop",
        "customFunction",
        "customPreFunction",
        "defaultImage",
        "delay",
        "density",
        "duration",
        "dpr",
        "effect",
        "else",
        "endIf",
        "endOffset",
        "fallbackContent",
        "fetchFormat",
        "format",
        "flags",
        "gravity",
        "fps",
        "height",
        "htmlHeight",
        "htmlWidth",
        "if",
        "keyframeInterval",
        "ocr",
        "offset",
        "opacity",
        "overlay",
        "page",
        "poster",
        "prefix",
        "quality",
        "radius",
        "rawTransformation",
        "size",
        "sourceTypes",
        "sourceTransformation",
        "startOffset",
        "streamingProfile",
        "transformation",
        "underlay",
        "variable",
        "variables",
        "videoCodec",
        "videoSampling",
        "width",
        "x",
        "y",
        "zoom"
      ];
      var PARAM_NAMES = methods.map(snakeCase).concat(CONFIG_PARAMS);
      var Transformation$1 = Transformation;
      function processDpr(value) {
        var dpr2 = value.toString();
        if (dpr2 != null ? dpr2.match(/^\d+$/) : void 0) {
          return dpr2 + ".0";
        } else {
          return Expression.normalize(dpr2);
        }
      }
      function generateTransformationString(transformationOptions) {
        if (typeof transformationOptions === "string") {
          return transformationOptions;
        }
        if (transformationOptions instanceof Transformation$1) {
          return transformationOptions.toString();
        }
        if (Array.isArray(transformationOptions)) {
          return transformationOptions.map(function(singleTransformation) {
            return generateTransformationString(singleTransformation);
          }).filter(function(a) {
            console.log(a);
            return a;
          }).join("/");
        }
        var width;
        var height;
        var size = transformationOptions.size;
        var hasLayer = transformationOptions.overlay || transformationOptions.underlay;
        var crop2 = transformationOptions.crop;
        var angle = toArray(transformationOptions.angle).join(".");
        var background = (transformationOptions.background || "").replace(/^#/, "rgb:");
        var color2 = (transformationOptions.color || "").replace(/^#/, "rgb:");
        var flags = toArray(transformationOptions.flags || []).join(".");
        var dpr2 = transformationOptions.dpr === void 0 ? transformationOptions.dpr : processDpr(transformationOptions.dpr);
        var overlay = processLayer(transformationOptions.overlay);
        var radius = processRadius(transformationOptions.radius);
        var underlay = processLayer(transformationOptions.underlay);
        var ifValue = process_if(transformationOptions.if);
        var custom_function = processCustomFunction$1(transformationOptions.custom_function);
        var custom_pre_function = processCustomPreFunction(transformationOptions.custom_pre_function);
        var fps2 = transformationOptions.fps;
        var namedTransformations = [];
        var childTransformations = toArray(transformationOptions.transformation || []);
        var effect = transformationOptions.effect;
        var no_html_sizes = hasLayer || angle || crop2 === "fit" || crop2 === "limit";
        if (size) {
          var _a = size.split("x"), sizeWidth = _a[0], sizeHeight = _a[1];
          width = sizeWidth;
          height = sizeHeight;
        } else {
          width = transformationOptions.width;
          height = transformationOptions.height;
        }
        if (width && (width.toString().indexOf("auto") === 0 || no_html_sizes || parseFloat(width.toString()) < 1)) {
          delete transformationOptions.width;
        }
        if (height && (no_html_sizes || parseFloat(height.toString()) < 1)) {
          delete transformationOptions.height;
        }
        var isAnyChildAnObject = childTransformations.some(function(transformation) {
          return typeof transformation === "object";
        });
        if (isAnyChildAnObject) {
          childTransformations = childTransformations.map(function(transformation) {
            if (isObject(transformation)) {
              return generateTransformationString(transformation);
            } else {
              return generateTransformationString({ transformation });
            }
          }).filter(function(a) {
            return a;
          });
        } else {
          namedTransformations = childTransformations.join(".");
          childTransformations = [];
        }
        if (Array.isArray(effect)) {
          effect = effect.join(":");
        } else if (isObject(effect)) {
          effect = Object.entries(effect).map(function(_a2) {
            var key = _a2[0], value = _a2[1];
            return key + ":" + value;
          });
        }
        var border2 = transformationOptions.border;
        if (isObject(border2)) {
          border2 = (border2.width != null ? border2.width : 2) + "px_solid_" + (border2.color != null ? border2.color : "black").replace(/^#/, "rgb:");
        } else {
          if (/^\d+$/.exec(border2)) {
            transformationOptions.border = border2;
            border2 = void 0;
          }
        }
        if (Array.isArray(fps2)) {
          fps2 = fps2.join("-");
        }
        var urlParams = {
          a: legacyNormalizeExpression(angle),
          ar: legacyNormalizeExpression(transformationOptions.aspect_ratio),
          b: background,
          bo: border2,
          c: crop2,
          co: color2,
          dpr: legacyNormalizeExpression(dpr2),
          e: legacyNormalizeExpression(effect),
          fl: flags,
          fn: custom_function || custom_pre_function,
          fps: fps2,
          h: legacyNormalizeExpression(height),
          ki: legacyNormalizeExpression(transformationOptions.keyframe_interval),
          l: overlay,
          o: legacyNormalizeExpression(transformationOptions.opacity),
          q: legacyNormalizeExpression(transformationOptions.quality),
          r: radius,
          t: namedTransformations,
          u: underlay,
          w: legacyNormalizeExpression(width),
          x: legacyNormalizeExpression(transformationOptions.x),
          y: legacyNormalizeExpression(transformationOptions.y),
          z: legacyNormalizeExpression(transformationOptions.zoom),
          ac: transformationOptions.audio_codec,
          af: transformationOptions.audio_frequency,
          br: transformationOptions.bit_rate,
          cs: transformationOptions.color_space,
          d: transformationOptions.default_image,
          dl: transformationOptions.delay,
          dn: transformationOptions.density,
          du: normRangeValues(transformationOptions.duration),
          eo: normRangeValues(splitRange(transformationOptions.offset)[1]),
          f: transformationOptions.fetch_format,
          g: transformationOptions.gravity,
          pg: transformationOptions.page,
          p: transformationOptions.prefix,
          so: normRangeValues(splitRange(transformationOptions.offset)[0]),
          sp: transformationOptions.streaming_profile,
          vc: processVideoParams(transformationOptions.video_codec),
          vs: transformationOptions.video_sampling
        };
        var variables = Object.entries(transformationOptions).filter(function(_a2) {
          var key = _a2[0];
          _a2[1];
          return key.startsWith("$");
        }).map(function(_a2) {
          var key = _a2[0], value = _a2[1];
          return key + "_" + legacyNormalizeExpression(value);
        }).sort().concat((transformationOptions.variables || []).map(function(_a2) {
          var name2 = _a2[0], value = _a2[1];
          return name2 + "_" + legacyNormalizeExpression(value);
        })).join(",");
        var urlImageTransfomrations = Object.entries(urlParams).filter(function(_a2) {
          _a2[0];
          var value = _a2[1];
          if (typeof value === "undefined" || value === null) {
            return false;
          }
          if (typeof value === "string" && value.length === 0) {
            return false;
          }
          if (Array.isArray(value) && value.length === 0) {
            return false;
          }
          return true;
        }).map(function(_a2) {
          var key = _a2[0], value = _a2[1];
          return key + "_" + value;
        }).sort().join(",");
        var finalTransformationString = [
          ifValue,
          variables,
          urlImageTransfomrations,
          transformationOptions.raw_transformation
        ].filter(function(a) {
          return a;
        }).join(",");
        if (finalTransformationString) {
          childTransformations.push(finalTransformationString);
        }
        return childTransformations.join("/");
      }
      function finalize_resource_type(resource_type, type, url_suffix, use_root_path, shorten) {
        if (type == null) {
          type = "upload";
        }
        if (url_suffix != null) {
          if (resource_type === "image" && type === "upload") {
            resource_type = "images";
            type = null;
          } else if (resource_type === "image" && type === "private") {
            resource_type = "private_images";
            type = null;
          } else if (resource_type === "image" && type === "authenticated") {
            resource_type = "authenticated_images";
            type = null;
          } else if (resource_type === "raw" && type === "upload") {
            resource_type = "files";
            type = null;
          } else if (resource_type === "video" && type === "upload") {
            resource_type = "videos";
            type = null;
          } else {
            throw new Error("URL Suffix only supported for image/upload, image/private, image/authenticated, video/upload and raw/upload");
          }
        }
        if (use_root_path) {
          if (resource_type === "image" && type === "upload" || resource_type === "images" && type == null) {
            resource_type = null;
            type = null;
          } else {
            throw new Error("Root path only supported for image/upload");
          }
        }
        if (shorten && resource_type === "image" && type === "upload") {
          resource_type = "iu";
          type = null;
        }
        return [resource_type, type];
      }
      function finalize_source(source2, format3, url_suffix) {
        var source_to_sign;
        source2 = source2.replace(/([^:])\/\//g, "$1/");
        if (source2.match(/^https?:\//i)) {
          source2 = smartEscape(source2);
          source_to_sign = source2;
        } else {
          source2 = encodeURIComponent(decodeURIComponent(source2)).replace(/%3A/g, ":").replace(/%2F/g, "/");
          source_to_sign = source2;
          if (url_suffix) {
            if (url_suffix.match(/[\.\/]/)) {
              throw new Error("url_suffix should not include . or /");
            }
            source2 = source2 + "/" + url_suffix;
          }
          if (format3 != null) {
            source2 = source2 + "." + format3;
            source_to_sign = source_to_sign + "." + format3;
          }
        }
        return [source2, source_to_sign];
      }
      function unsigned_url_prefix(source2, cloud_name, private_cdn, cdn_subdomain, secure_cdn_subdomain, cname, secure, secure_distribution) {
        var prefix;
        if (cloud_name.indexOf("/") === 0) {
          return "/res" + cloud_name;
        }
        var shared_domain = !private_cdn;
        if (secure) {
          if (secure_distribution == null || secure_distribution === OLD_AKAMAI_SHARED_CDN) {
            secure_distribution = private_cdn ? cloud_name + "-res.cloudinary.com" : SHARED_CDN;
          }
          if (shared_domain == null) {
            shared_domain = secure_distribution === SHARED_CDN;
          }
          prefix = "https://" + secure_distribution;
        } else if (cname) {
          prefix = "http://" + cname;
        } else {
          var cdn_part = private_cdn ? cloud_name + "-" : "";
          var host = [cdn_part, "res", ".cloudinary.com"].join("");
          prefix = "http://" + host;
        }
        if (shared_domain) {
          prefix += "/" + cloud_name;
        }
        return prefix;
      }
      function createCloudinaryLegacyURL(public_id, transformationOptions) {
        var _a, _b;
        if (transformationOptions.type === "fetch") {
          if (transformationOptions.fetch_format == null) {
            transformationOptions.fetch_format = transformationOptions.format;
          }
        }
        var source_to_sign;
        var type = transformationOptions.type;
        var resource_type = transformationOptions.resource_type || "image";
        var version2 = transformationOptions.version;
        var force_version = typeof transformationOptions.force_version === "boolean" ? transformationOptions.force_version : true;
        !!transformationOptions.long_url_signature;
        var format3 = transformationOptions.format;
        var cloud_name = transformationOptions.cloud_name;
        if (!cloud_name) {
          throw "cloud_name must be provided in the configuration";
        }
        var private_cdn = transformationOptions.private_cdn;
        var secure_distribution = transformationOptions.secure_distribution;
        var secure = transformationOptions.secure;
        var cdn_subdomain = transformationOptions.cdn_subdomain;
        var secure_cdn_subdomain = transformationOptions.secure_cdn_subdomain;
        var cname = transformationOptions.cname;
        var shorten = transformationOptions.shorten;
        var sign_url = transformationOptions.sign_url;
        transformationOptions.api_secret;
        var url_suffix = transformationOptions.url_suffix;
        var use_root_path = transformationOptions.use_root_path;
        var auth_token = transformationOptions.auth_token;
        var preloaded = /^(image|raw)\/([a-z0-9_]+)\/v(\d+)\/([^#]+)$/.exec(public_id);
        if (preloaded) {
          resource_type = preloaded[1];
          type = preloaded[2];
          version2 = preloaded[3];
          public_id = preloaded[4];
        }
        var original_source = public_id;
        if (public_id == null) {
          return original_source;
        }
        public_id = public_id.toString();
        if (type === null && public_id.match(/^https?:\//i)) {
          return original_source;
        }
        _a = finalize_resource_type(resource_type, type, url_suffix, use_root_path, shorten), resource_type = _a[0], type = _a[1];
        _b = finalize_source(public_id, format3, url_suffix), public_id = _b[0], source_to_sign = _b[1];
        if (version2 == null && force_version && source_to_sign.indexOf("/") >= 0 && !source_to_sign.match(/^v[0-9]+/) && !source_to_sign.match(/^https?:\//)) {
          version2 = 1;
        }
        if (version2 != null) {
          version2 = "v" + version2;
        } else {
          version2 = null;
        }
        var transformation = generateTransformationString(cloneDeep(transformationOptions)).replace(/([^:])\/\//g, "$1/");
        if (sign_url && !auth_token) {
          var to_sign = [transformation, source_to_sign].filter(function(part) {
            return part != null && part !== "";
          }).join("/");
          try {
            for (var i = 0; to_sign !== decodeURIComponent(to_sign) && i < 10; i++) {
              to_sign = decodeURIComponent(to_sign);
            }
          } catch (error3) {
          }
        }
        var prefix = unsigned_url_prefix(public_id, cloud_name, private_cdn, cdn_subdomain, secure_cdn_subdomain, cname, secure, secure_distribution);
        var resultUrl = [prefix, resource_type, type, transformation, version2, public_id].filter(function(part) {
          return part != null && part !== "";
        }).join("/").replace(" ", "%20");
        return resultUrl;
      }
      var CloudinaryBaseSDK = {
        Transformation: Transformation$2,
        ImageTransformation,
        VideoTransformation,
        Actions,
        Qualifiers,
        Cloudinary: Cloudinary2,
        CloudinaryImage,
        CloudinaryVideo,
        CloudinaryMedia,
        CloudinaryFile,
        createCloudinaryLegacyURL
      };
      exports2.Actions = Actions;
      exports2.Cloudinary = Cloudinary2;
      exports2.CloudinaryBaseSDK = CloudinaryBaseSDK;
      exports2.CloudinaryFile = CloudinaryFile;
      exports2.CloudinaryImage = CloudinaryImage;
      exports2.CloudinaryMedia = CloudinaryMedia;
      exports2.CloudinaryVideo = CloudinaryVideo;
      exports2.ImageTransformation = ImageTransformation;
      exports2.Qualifiers = Qualifiers;
      exports2.Transformation = Transformation$2;
      exports2.VideoTransformation = VideoTransformation;
      exports2.createCloudinaryLegacyURL = createCloudinaryLegacyURL;
      exports2["default"] = CloudinaryBaseSDK;
      Object.defineProperty(exports2, "__esModule", { value: true });
    });
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();

// node_modules/@sveltejs/kit/dist/ssr.js
init_shims();

// node_modules/@sveltejs/kit/dist/adapter-utils.js
init_shims();
function isContentTypeTextual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}

// node_modules/@sveltejs/kit/dist/ssr.js
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler2) {
    return;
  }
  const params = route.params(match);
  const response = await handler2({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = headers["content-type"];
  const is_type_textual = isContentTypeTextual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop() {
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
Promise.resolve();
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = [];
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (let i = 0; i < subscribers.length; i += 1) {
          const s2 = subscribers[i];
          s2[1]();
          subscriber_queue.push(s2, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.push(subscriber);
    if (subscribers.length === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      const index2 = subscribers.indexOf(subscriber);
      if (index2 !== -1) {
        subscribers.splice(index2, 1);
      }
      if (subscribers.length === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error3,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error3) {
    error3.stack = options2.get_stack(error3);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable($session);
    const props = {
      stores: {
        page: writable(null),
        navigating: writable(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error4) => {
      throw new Error(`Failed to serialize session data: ${error4.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error3)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n			")}
		`.replace(/^\t{2}/gm, "");
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(err);
    return null;
  }
}
function serialize_error(error3) {
  if (!error3)
    return null;
  let serialized = try_serialize(error3);
  if (!serialized) {
    const { name, message, stack } = error3;
    serialized = try_serialize({ ...error3, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error3 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error3 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error3}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error3 };
    }
    return { status, error: error3 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error3
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? {
              "content-type": asset.type
            } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = { ...opts.headers };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body,
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.serverFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 !== "etag" && key2 !== "set-cookie")
                    headers[key2] = value;
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error3;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    uses_credentials
  };
}
var escaped = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped) {
      result += escaped[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
function coalesce_to_error(err) {
  return err instanceof Error ? err : new Error(JSON.stringify(err));
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error3 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error3
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error3,
      branch,
      page
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4, request);
    return {
      status: 500,
      headers: {},
      body: error4.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error4
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch = [];
  let status = 200;
  let error3;
  ssr:
    if (page_config.ssr) {
      let context = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              context,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            if (loaded.loaded.redirect) {
              return {
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              };
            }
            if (loaded.loaded.error) {
              ({ status, error: error3 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error3 = e;
          }
          if (loaded && !error3) {
            branch.push(loaded);
          }
          if (error3) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    context: node_loaded.context,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error3
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error3
            });
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return await render_response({
      ...opts,
      page_config,
      status,
      error: error3,
      branch: branch.filter(Boolean)
    });
  } catch (err) {
    const error4 = coalesce_to_error(err);
    options2.handle_error(error4, request);
    return await respond_with_error({
      ...opts,
      status: 500,
      error: error4
    });
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  #map;
  constructor(map) {
    this.#map = map;
  }
  get(key) {
    const value = this.#map.get(key);
    return value && value[0];
  }
  getAll(key) {
    return this.#map.get(key);
  }
  has(key) {
    return this.#map.has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of this.#map)
      yield key;
  }
  *values() {
    for (const [, value] of this.#map) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
function parse_body(raw, headers) {
  if (!raw || typeof raw !== "string")
    return raw;
  const [type, ...directives] = headers["content-type"].split(/;\s*/);
  switch (type) {
    case "text/plain":
      return raw;
    case "application/json":
      return JSON.parse(raw);
    case "application/x-www-form-urlencoded":
      return get_urlencoded(raw);
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(raw, boundary.slice("boundary=".length));
    }
    default:
      throw new Error(`Invalid Content-Type ${type}`);
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              if (!/(no-store|immutable)/.test(response.headers["cache-control"])) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}

// .svelte-kit/output/server/app.js
var import_url_gen = __toModule(require_base());
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
Promise.resolve();
var escaped2 = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape2(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped2[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape2(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
var css = {
  code: "#svelte-announcer.svelte-1pdgbjn{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>#svelte-announcer{clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);height:1px;left:0;overflow:hidden;position:absolute;top:0;white-space:nowrap;width:1px}</style>"],"names":[],"mappings":"AAqDO,gCAAiB,CAAC,KAAK,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,kBAAkB,MAAM,GAAG,CAAC,CAAC,UAAU,MAAM,GAAG,CAAC,CAAC,OAAO,GAAG,CAAC,KAAK,CAAC,CAAC,SAAS,MAAM,CAAC,SAAS,QAAQ,CAAC,IAAI,CAAC,CAAC,YAAY,MAAM,CAAC,MAAM,GAAG,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
var base = "";
var assets = "";
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var template = ({ head, body }) => '<!DOCTYPE html>\r\n<html lang="en" class="bg-base-200">\r\n	<head>\r\n		<meta charset="utf-8" />\r\n		<link rel="icon" href="/favicon.png" />\r\n		<link rel="preconnect" href="https://fonts.googleapis.com" />\r\n		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\r\n		<link\r\n			href="https://fonts.googleapis.com/css2?family=Sora:wght@700&display=swap"\r\n			rel="stylesheet"\r\n		/>\r\n		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\r\n		<link\r\n			href="https://fonts.googleapis.com/css2?family=Nunito+Sans&display=swap"\r\n			rel="stylesheet"\r\n		/>\r\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\r\n		' + head + '\r\n	</head>\r\n	<body>\r\n		<div id="svelte">' + body + '</div>\r\n	</body>\r\n	<!-- Loads <model-viewer> on modern browsers: -->\r\n	<!-- <script\r\n		type="module"\r\n		src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"\r\n	><\/script> -->\r\n	<script type="module" src="./model-viewer/model-viewer.min.js"><\/script>\r\n	<script\r\n		src="https://unpkg.com/easyqrcodejs@4.4.6/dist/easy.qrcode.min.js"\r\n		type="text/javascript"\r\n		charset="utf-8"\r\n	><\/script>\r\n</html>\r\n';
var options = null;
var default_settings = { paths: { "base": "", "assets": "" } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-e70dcfe2.js",
      css: [assets + "/_app/assets/start-0826e215.css"],
      js: [assets + "/_app/start-e70dcfe2.js", assets + "/_app/chunks/vendor-0b16c38a.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error22) => String(error22),
    handle_error: (error22, request) => {
      hooks.handleError({ error: error22, request });
      error22.stack = options.get_stack(error22);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var empty = () => ({});
var manifest = {
  assets: [{ "file": "favicon.png", "size": 1571, "type": "image/png" }, { "file": "model-viewer/model-viewer.min.js", "size": 834685, "type": "application/javascript" }, { "file": "model-viewer/model-viewer.min.js.map", "size": 2845571, "type": "application/json" }, { "file": "whiteroom2Windows_512.hdr", "size": 405886, "type": null }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/products\.json$/,
      params: empty,
      load: () => Promise.resolve().then(function() {
        return products_json;
      })
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  handleError: hooks.handleError || (({ error: error22 }) => console.error(error22.stack)),
  serverFetch: hooks.serverFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error2;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-7cfb5af2.js", "css": ["assets/pages/__layout.svelte-1d108c73.css"], "js": ["pages/__layout.svelte-7cfb5af2.js", "chunks/vendor-0b16c38a.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-5fc56078.js", "css": [], "js": ["error.svelte-5fc56078.js", "chunks/vendor-0b16c38a.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-6785544d.js", "css": ["assets/pages/index.svelte-400129a4.css"], "js": ["pages/index.svelte-6785544d.js", "chunks/vendor-0b16c38a.js"], "styles": [] } };
async function load_component(file) {
  const { entry, css: css2, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css2.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
async function get() {
  return {
    status: 200,
    body: {
      products: [
        {
          type: "seat",
          name: "Carousel",
          variants: ["HighBack", "MedBack", "LowBack"],
          materials: [
            "MaharamMeld-Gloss",
            "MaharamMeld-Crater",
            "MaharamMeld-Antler",
            "MaharamMeld-Bare",
            "MaharamMeld-Quill",
            "MaharamMeld-Panda",
            "MaharamMeld-Kiss",
            "MaharamMeld-SeaShell"
          ]
        },
        {
          type: "light",
          name: "HexPendant",
          variants: ["500", "750", "1000"],
          materials: ["Aluminium", "Black", "Brass", "White"]
        }
      ]
    }
  };
}
var products_json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get
});
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="${"flex justify-between shadow-lg"}"><h1 class="${"pt-6 px-4 text-3xl lg:text-4xl font-headline text-primary pb-3 mx-2"}">Model Viewer</h1></div>

${slots.default ? slots.default({}) : ``}`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load$1({ error: error22, status }) {
  return { props: { error: error22, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error22 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error22 !== void 0)
    $$bindings.error(error22);
  return `<h1>${escape2(status)}</h1>

<pre>${escape2(error22.message)}</pre>



${error22.frame ? `<pre>${escape2(error22.frame)}</pre>` : ``}
${error22.stack ? `<pre>${escape2(error22.stack)}</pre>` : ``}`;
});
var error2 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load: load$1
});
async function load({ fetch: fetch2 }) {
  const productData = await (await fetch2("/products.json")).json();
  return { props: { productData } };
}
function addSpaceBetweenCapitals(word) {
  return word.replace(/([A-Z])/g, " $1").trim();
}
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let loadedModel;
  let loadedPoster;
  let { productData } = $$props;
  let products = productData.products;
  const cloudinary = new import_url_gen.Cloudinary({ cloud: { cloudName: "dbfqxpc2p" } });
  let selectedModel = 0;
  let selectedModelType = 0;
  let selectedMaterial = 0;
  let modelMaterial = products[selectedModel].materials[selectedMaterial];
  let modelViewer;
  if ($$props.productData === void 0 && $$bindings.productData && productData !== void 0)
    $$bindings.productData(productData);
  loadedModel = cloudinary.image(`${products[selectedModel].name}/${products[selectedModel].variants[selectedModelType]}/${products[selectedModel].name}_${products[selectedModel].variants[selectedModelType]}_${modelMaterial}`).toURL();
  loadedPoster = cloudinary.image(`${products[selectedModel].name}/${products[selectedModel].variants[selectedModelType]}/${products[selectedModel].name}_${products[selectedModel].variants[selectedModelType]}_${modelMaterial}.png`).toURL();
  return `${``}

<div class="${"grid grid-cols-1 lg:grid-cols-2 gap-4 lg:px-12 w-full mt-10 lg:mt-20"}"><div class="${"relative"}"><model-viewer class="${"relative h-[40em] lg:h-full w-full bg-gray-200"}"${add_attribute("poster", loadedPoster, 0)}${add_attribute("src", loadedModel, 0)} loading="${"auto"}" alt="${"3D Model Viewer"}" ar ar-modes="${"webxr scene-viewer quick-look"}" ar-status environment-image="${"./whiteroom2Windows_512.hdr"}" exposure="${"2"}" auto-rotate camera-controls shadow-intensity="${"2"}"${add_attribute("this", modelViewer, 0)}></model-viewer>
		
		<button class="${"rounded-full bg-gray-800 hover:bg-gray-600 w-8 h-8 flex justify-center items-center absolute top-0 right-0 mr-4 mt-4 shadow"}"><svg xmlns="${"http://www.w3.org/2000/svg"}" class="${"h-6 w-6 text-gray-300"}" fill="${"none"}" viewBox="${"0 0 24 24"}" stroke="${"currentColor"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" stroke-width="${"2"}" d="${"M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"}"></path></svg></button></div>

	<div class="${"flex flex-wrap space-x-2 lg:order-last mr-4 items-center mb-10 mx-10"}">${each(products, (product, i) => `<div class="${"flex flex-col space-y-2 content-center text-center"}"><button class="${" bg-gray-200 w-32 h-32"}"><img${add_attribute("src", cloudinary.image(`${product.name}/${product.variants[0]}/${product.name}_${product.variants[0]}_${product.materials[0]}.png`).toURL(), 0)}${add_attribute("alt", product.name, 0)}></button>
				<h6 class="${"text-sm font-semibold"}">${escape2(addSpaceBetweenCapitals(product.name))}</h6>
			</div>`)}</div>
	<div class="${"mx-10"}"><div class="${"flex flex-col space-y-10 lg:px-12 lg:items-start"}"><div class="${"lg:order-last w-full"}"><h5 class="${"text-2xl font-headline mb-2 text-primary"}">Type:</h5>
				<div class="${"dropdown rounded-lg"}"><div tabindex="${"0"}" class="${"btn btn-wide btn-ghost shadow-lg"}"><div class="${"flex justify-between w-full items-center"}"><h6>${escape2(addSpaceBetweenCapitals(products[selectedModel].variants[selectedModelType]))}</h6>
							<svg xmlns="${"http://www.w3.org/2000/svg"}" class="${"h-8 w-8"}" viewBox="${"0 0 20 20"}" fill="${"currentColor"}"><path fill-rule="${"evenodd"}" d="${"M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"}" clip-rule="${"evenodd"}"></path></svg></div></div>
					<ul tabindex="${"0"}" class="${"p-2 shadow menu dropdown-content bg-base-100 rounded-box w-52"}">${each(products[selectedModel].variants, (modelVariant, i) => `<li><button class="${"btn btn-ghost"}">${escape2(addSpaceBetweenCapitals(modelVariant))}</button>
							</li>`)}</ul></div></div>
			<div class="${"lg:order-last lg:mt-20"}"><h5 class="${"text-2xl font-headline mb-2 text-primary"}">Material:</h5>
				<div class="${"flex flex-wrap gap-2 lg:order-last items-center"}">${each(products[selectedModel].materials, (_, i) => `<button class="${"shadow-lg h-14 w-14 transform-gpu hover:translate-y-1 ease-in duration-100 mt-4 " + escape2(selectedMaterial == i ? "border-4 border-primary" : "border-none")}"><img${add_attribute("src", cloudinary.image(`${products[selectedModel].name}/swatches/${products[selectedModel].materials[i]}`).toURL(), 0)}${add_attribute("alt", products[selectedModel].materials[i], 0)}>
						</button>`)}</div></div>

			<div class="${"prose font-paragraph"}"><h2>${escape2(addSpaceBetweenCapitals(products[selectedModel].name))}</h2>
				<p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Natus magni enim accusamus
					tenetur saepe ducimus, blanditiis alias animi fuga quas vitae consectetur obcaecati
					inventore! Iusto autem nemo eius libero molestias?
				</p>
				<div class="${"py-12"}"></div></div></div></div></div>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes,
  load
});

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const encoding = isBase64Encoded ? "base64" : headers["content-encoding"] || "utf-8";
  const rawBody = typeof body === "string" ? Buffer.from(body, encoding) : body;
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      ...splitHeaders(rendered.headers),
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
function splitHeaders(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
