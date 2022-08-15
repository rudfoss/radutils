# CacheConfigSource

This source caches resolved configuration values and serves them on the next build iteration. It can use any type of cache that matches the cache interface and will provide values it has previously encountered on the next run. Usually you'd want to place this source first so that it takes precedence over other sources when values have been cached.

In most situations you may not want to cache values at all, but for development environments I've found that having remote configuration sources such as Azure App Config slows down development time due to refreshing data from the server. This may also increase the cost of development for an operation that usually just returns the same data. This is the scenario the `CacheConfigSource` is built for.

The module comes with two cache implementations. One stores values in memory while the other uses the `node_modules/.cache` folder.

```typescript
// Create a new cache config source using NPMCache. This will store values in files so they survive app restarts.
const cacheSource = new CacheConfigSource({
	enabled: process.env.NODE_ENV === "development" // only enable the cache if we are in development mode
	cache: new NPMCache()
})

const builder = new ConfigBuilder([cacheSource, ...])
```

## Regarding the cache key

In many cases you usually only build one single config object using a single build function. In these cases you only need to ensure that your cache does not collide with other applications you run that share the same cache service. E.g.: If you are using the NPMCache service it will use the `.cache` folder in `node_modules`. For certain mono-repo setups this folder may be shared between multiple different applications which means that cache collisions could occur. To resolve this simply change the `keyPrefix` option when creating the `CacheConfigSource` instance. You can use something like the name of your application, it only needs to be distinct.

If you are building mulitple different configurations using the same `ConfigBuilder` you don't want these cache to collide. Internally `CacheConfigSource` keeps a [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) reference to each build function it sees and assigns them a unique ID. This means that as long as the function instance does not change between runs caching should work as you would expect. If you want more control over this mechanism you can provide a shared data property called `cacheConfigSourceInstanceName`. If such a property exists in the shared data the cache source will use that name instead of the self generated one as a cache key suffix combined with the `keyPrefix` option.