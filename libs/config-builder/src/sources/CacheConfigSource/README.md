# CacheConfigSource

This source caches resolved configuration values and serves them on the next build iteration. It can use any type of cache that matches the cache interface and will provide values it has previously encountered on the next run. Usually you'd want to place this source first so that it takes precedence over other sources when values have been cached.

In most situations you may not want to cache values at all, but for development environments I've found that having remote configuration sources such as Azure App Config slows down boot times on repeated calls. In these cases it would be usefull to cache those values for subsequent runs since you may reboot the app many times during debugging and testing. This is the exact scenario the `CacheConfigSource` is built for.

The module comes with two cache implementations. One stores values in memory while the other uses the `node_modules/.cache` folder.

```typescript
// Create a new cache config source using NPMCache. This will store values in files so they survive app restarts.
const cacheSource = new CacheConfigSource({
	enabled: process.env.NODE_ENV === "development" // only enable the cache if we are in development mode
	cache: new NPMCache()
})

const builder = new ConfigBuilder([cacheSource, ...])
```