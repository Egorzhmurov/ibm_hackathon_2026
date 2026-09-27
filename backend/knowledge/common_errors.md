# Common CI/CD Error Patterns

Each entry follows this structure:
- `## <short title>` — unique section heading
- `**Pattern:**` — regex-friendly keywords that appear in the error log
- `**Root Cause:**` — one-sentence explanation of WHY it fails
- `**Fix:**` — numbered action steps
- `**Ref:**` — authoritative documentation link

---

## TypeError: Cannot read properties of undefined

**Pattern:** `TypeError: Cannot read properties of undefined`

**Root Cause:** Code attempts to access a property or call a method on a value that is `undefined`, most commonly because an async data fetch has not resolved yet, an optional field is absent in the response, or an array/object was never initialised before use.

**Fix:**
1. Add a null/undefined guard before the property access: `if (value != null) { ... }` or use optional chaining `value?.property`.
2. Initialise the variable with a safe default (e.g. `const list = data?.items ?? []`).
3. If the value comes from an API call, ensure the component handles the loading state before rendering dependent UI.

**Ref:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_access_property

---

## TypeError: Cannot read properties of null

**Pattern:** `TypeError: Cannot read properties of null`

**Root Cause:** A DOM query (`document.getElementById`, `document.querySelector`) or data lookup returned `null` — either because the element does not exist in the DOM at the time the script runs, or the expected data key is absent.

**Fix:**
1. Guard the access: `const el = document.getElementById('app'); if (el) { el.textContent = '...'; }`.
2. If the element should exist, verify the selector and that the script runs after `DOMContentLoaded`.
3. For data lookups, use optional chaining and nullish coalescing: `obj?.key ?? defaultValue`.

**Ref:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_access_property

---

## ReferenceError: variable is not defined

**Pattern:** `ReferenceError`

**Root Cause:** A variable is read before it is declared (temporal dead zone for `let`/`const`), or it was declared in a different scope than where it is used.

**Fix:**
1. Ensure the variable is declared before the line that accesses it.
2. For `let`/`const`, move the declaration above any code that reads it.
3. Check for typos in the variable name — JavaScript identifiers are case-sensitive.

**Ref:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Not_defined

---

## SyntaxError: Unexpected token

**Pattern:** `SyntaxError: Unexpected token`

**Root Cause:** The JavaScript parser encountered a character it did not expect — typically a missing comma, bracket, or parenthesis, or an attempt to parse non-JSON text as JSON (e.g. an HTML error page returned from an API call).

**Fix:**
1. Check the line and column number in the stack trace and inspect the surrounding code.
2. If the error is in `JSON.parse`, log the raw string being parsed before calling it to confirm it is valid JSON.
3. Validate JSON at https://jsonlint.com/ if the payload comes from an external source.

**Ref:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Unexpected_token

---

## Module not found

**Pattern:** `Module not found`, `Cannot find module`, `ERR_MODULE_NOT_FOUND`

**Root Cause:** Node.js cannot resolve the import path — either the package is not installed, the relative path is wrong, or a file was renamed/deleted without updating the import.

**Fix:**
1. Run `npm install` (or `npm install <package-name>`) to ensure all dependencies are present.
2. Verify the relative path matches the actual file location on disk (paths are case-sensitive on Linux/macOS).
3. Check `package.json` to confirm the package is listed under `dependencies` or `devDependencies`.

**Ref:** https://nodejs.org/api/errors.html#module_not_found

---

## ECONNREFUSED — connection refused

**Pattern:** `ECONNREFUSED`, `connect ECONNREFUSED`

**Root Cause:** The application tried to open a TCP connection (e.g. to a database or API server) but nothing was listening on that host/port at the time of the call.

**Fix:**
1. Confirm the target service is running: `lsof -i :<port>` (macOS/Linux) or `netstat -ano | findstr <port>` (Windows).
2. Check the host and port in your environment variables / config file for typos.
3. If connecting to MongoDB locally, run `mongod` or start the service before launching the app.

**Ref:** https://nodejs.org/api/errors.html#econnrefused

---

## CORS policy blocked

**Pattern:** `CORS`, `Access-Control-Allow-Origin`, `has been blocked by CORS policy`

**Root Cause:** The browser blocked a cross-origin HTTP response because the server did not include the required `Access-Control-Allow-Origin` header, which happens when the `cors` middleware is missing, misconfigured, or not applied before the route handlers.

**Fix:**
1. In Express, add `app.use(cors())` before all route definitions.
2. To allow only specific origins: `app.use(cors({ origin: 'https://your-frontend.com' }))`.
3. For preflight requests, ensure `OPTIONS` is handled — the `cors` package does this automatically.

**Ref:** https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors

---

## JWT verification failed

**Pattern:** `JsonWebTokenError`, `jwt malformed`, `invalid signature`, `jwt expired`, `TokenExpiredError`

**Root Cause:** The JWT token is either malformed (wrong format or encoding), signed with a different secret, or has passed its expiry time — all of which cause `jwt.verify()` to throw synchronously.

**Fix:**
1. Wrap `jwt.verify()` in a `try/catch` block and return `401` on any error.
2. Extract the token from the `Authorization` header **before** passing it to `verify`: `const token = req.headers.authorization?.split(' ')[1]`.
3. Confirm the same `JWT_SECRET` value is used to sign and verify — check for trailing whitespace or encoding differences in environment variables.

**Ref:** https://github.com/auth0/node-jsonwebtoken#readme

---

## Mongoose validation error

**Pattern:** `ValidationError`, `Path .* is required`, `Cast to .* failed`

**Root Cause:** A document was saved to MongoDB with a field that violates the Mongoose schema — either a required field is missing, or a value cannot be cast to the expected type (e.g. passing a string where a Number is required).

**Fix:**
1. Check the error message for the exact field path and expected type.
2. Ensure all required fields are set before calling `.save()` or the model constructor.
3. For `Cast` errors on ObjectId fields, validate that the incoming string is a valid 24-character hex ID: `mongoose.Types.ObjectId.isValid(id)`.

**Ref:** https://mongoosejs.com/docs/validation.html

---

## React: Too many re-renders

**Pattern:** `Too many re-renders`, `Maximum update depth exceeded`

**Root Cause:** A `setState` call (or a value change that triggers a state update) is happening on every render cycle, most commonly because a state update is called unconditionally at the top level of a component or inside an event handler that is recreated on every render.

**Fix:**
1. Move unconditional `setState` calls inside a `useEffect` with an appropriate dependency array.
2. Never call a state setter directly during rendering without a condition — use `if (condition) setState(...)`.
3. For event handlers passed as props, wrap them in `useCallback` to stabilise their reference.

**Ref:** https://react.dev/reference/react/Component#setstate

---

## Vite / Rollup build failed — circular dependency

**Pattern:** `circular dependency`, `Circular import`, `has been externalized`

**Root Cause:** Two or more modules import each other, creating a cycle that Rollup/Vite cannot resolve at build time, resulting in one module receiving an incomplete or `undefined` export.

**Fix:**
1. Identify the cycle with `vite build --debug` or by inspecting the warning output.
2. Extract the shared logic into a third module that neither of the cyclic modules imports.
3. Consider whether the dependency should flow one-way: move types/interfaces to a separate `types.ts` file.

**Ref:** https://vitejs.dev/guide/troubleshooting.html

---

## Process out of memory — JavaScript heap

**Pattern:** `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed`, `JavaScript heap out of memory`

**Root Cause:** The Node.js process exceeded the V8 heap limit, typically because of an unbounded in-memory accumulation — large arrays, memory leaks in event listeners, or processing very large files without streaming.

**Fix:**
1. For immediate relief, increase the heap limit: `node --max-old-space-size=4096 index.js`.
2. Profile memory usage with `node --inspect` and Chrome DevTools → Memory tab to find the leak.
3. For large file processing, replace buffered reads with streams (`fs.createReadStream`).

**Ref:** https://nodejs.org/en/docs/guides/dont-block-the-event-loop
