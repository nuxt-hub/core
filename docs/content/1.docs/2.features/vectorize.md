---
title: Vectorize (Vector Database)
navigation.title: Vectorize
description: Access a globally distributed vector database to build AI-powered applications in Nuxt.
---

::note{to=https://developers.cloudflare.com/vectorize/reference/what-is-a-vector-database/}
Learn what vector databases are on Cloudflare's documentation
::

## Getting Started

Create Vectorize indexes in your NuxtHub project within the `vectorize` property to the `hub` object in your `nuxt.config.ts` file.

Index names can only contain lowercase characters, hyphens (-), and are limited to 51 characters.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    vectorize: {
      <index-name>: {
        dimensions: <number>,
        metric: "dot-product" | "cosine" | "euclidean",
        metadataIndexes: {
          <property>: "string" | "number" | "boolean"
        }
      }
    }
  }
})
```

::collapsible{name="example"}

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    vectorize: {
      products: {
        metric: 'cosine',
        dimensions: '768',
        metadataIndexes: {
          name: 'string',
          price: 'number'
        }
      },
      reviews: {
        metric: 'euclidean',
        dimensions: '1024',
        metadataIndexes: {
          rating: 'number'
        }
      },
    }
  }
})
```
::

TODO: creating index guide from Vectorize best practises docs

::note
[Cloudflare Vectorize](https://developers.cloudflare.com/d1) indexes will be created for your project when you [deploy it](/docs/getting-started/deploy).
::

::warning
Vectorize is current unavailable during local development. To develop with Vectorize, create an index inside `nuxt.config.ts`, deploy the application and develop using [`nuxt dev --remote`](/docs/getting-started/remote-storage).
::

## `hubVectorize()`

Server composable that returns a [Vectorize index](https://developers.cloudflare.com/vectorize/reference/client-api/).

```ts
const index = hubVectorize("<index>")
```

::callout
This documentation is a small reflection of the [Cloudflare Vectorize documentation](https://developers.cloudflare.com/vectorize/reference/client-api/). We recommend reading it to understand the full potential of Vectorize.
::

### `insert()`

Inserts vectors into the index.

```ts
const vectorsToInsert = [
  { id: "123", values: [32.4, 6.5, 11.2, 10.3, 87.9] },
  { id: "456", values: [2.5, 7.8, 9.1, 76.9, 8.5] },
];
const inserted = await index.insert(vectorsToInsert);
```

If vectors with the same vector ID already exist in the index, only the vectors with new IDs will be inserted.

::callout
Vectorize inserts are asynchronous and the insert operation returns a mutation identifier unique for that operation. It typically takes a few seconds for inserted vectors to be available for querying in an index.
::

If you need to update existing vectors, use the [upsert](#upsert) operation.

::note
**Insert vs Upsert** If the same vector id is inserted twice in a Vectorize index, the index would reflect the vector that was added first.

If the same vector id is upserted twice in a Vectorize index, the index would reflect the vector that was added second.

Use the upsert operation if you want to overwrite the vector value for a vector id that already exists in an index.
::

### `upsert()`

Upserts vectors into an index.

```ts
const vectorsToUpsert = [
  { id: "123", values: [32.4, 6.5, 11.2, 10.3, 87.9] },
  { id: "456", values: [2.5, 7.8, 9.1, 76.9, 8.5] },
  { id: "768", values: [29.1, 5.7, 12.9, 15.4, 1.1] },
];
const upserted = await index.upsert(vectorsToUpsert);
```

An upsert operation will insert vectors into the index if vectors with the same ID do not exist, and overwrite vectors with the same ID.

::note
Upserting does not merge or combine the values or metadata of an existing vector with the upserted vector: the upserted vector replaces the existing vector in full.
::

::callout
Vectorize upserts are asynchronous and the upsert operation returns a mutation identifier unique for that operation. It typically takes a few seconds for upserted vectors to be available for querying in an index.
::

### `query()`

Query an index with the provided vector, returning the score(s) of the closest vectors based on the configured distance metric.

```ts
const queryVector = [32.4, 6.55, 11.2, 10.3, 87.9];
const matches = await index.query(queryVector);

console.log(matches)
/*
[]
*/
```

- Configure the number of returned matches by setting `topK` (default: 5)
- Return vector values by setting `returnValues: true` (default: false)
- Return vector metadata by setting `returnMetadata: 'indexed'` or `returnMetadata: 'all'` (default: 'none')

```ts
const matches = await index.query(queryVector, {
  topK: 5,
  returnValues: true,
  returnMetadata: "all",
});
```

#### topK

The `topK` can be configured to specify the number of matches returned by the query operation. Vectorize now supports an upper limit of `100` for the `topK` value. However, for a query operation with `returnValues` set to `true` or `returnMetadata` set to `all`, `topK` would be limited to a maximum value of `20`.

#### returnMetadata

The `returnMetadata` field provides three ways to fetch vector metadata while querying:

1. `none`: Do not fetch metadata.
2. `indexed`: Fetched metadata only for the indexed metadata fields. There is no latency overhead with this option, but long text fields may be truncated.
3. `all`: Fetch all metadata associated with a vector. Queries may run slower with this option, and `topK` would be limited to 20.

### `getByIds()`

Retrieves the specified vectors by their ID, including values and metadata.

```ts
const ids = ["11", "22", "33", "44"];
const vectors = await index.getByIds(ids);
```

### `deleteByIds()`

Deletes the vector IDs provided from the current index.

```ts
const idsToDelete = ["11", "22", "33", "44"];
const deleted = await index.deleteByIds(idsToDelete);
```

::callout
Vectorize deletes are asynchronous and the delete operation returns a mutation identifier unique for that operation. It typically takes a few seconds for vectors to be removed from the Vectorize index.
::

### `describe()`

Retrieves the configuration of a given index directly, including its configured `dimensions` and distance `metric`.

```ts
const details = await index.describe();
```

## Vectors

A vector represents the vector embedding output from a machine learning model.

- `id` - a unique `string` identifying the vector in the index. This should map back to the ID of the document, object or database identifier that the vector values were generated from.
- `namespace` - an optional partition key within a index. Operations are performed per-namespace, so this can be used to create isolated segments within a larger index.
- `values` - an array of `number`, `Float32Array`, or `Float64Array` as the vector embedding itself. This must be a dense array, and the length of this array must match the `dimensions` configured on the index.
- `metadata` - an optional set of key-value pairs that can be used to store additional metadata alongside a vector.

```ts
let vectorExample = {
	id: "12345",
	values: [32.4, 6.55, 11.2, 10.3, 87.9],
	metadata: {
		key: "value",
		hello: "world",
		url: "r2://bucket/some/object.json",
	},
};
```

## Metadata filtering

::callout
Vectorize currently supports a maximum of 10 metadata indexes per Vectorize index. Learn more at https://developers.cloudflare.com/vectorize/platform/limits/.
::

::note[Enable metadata filtering]
Vectorize requires metadata indexes to be specified before vectors are inserted to support metadata filtering. `string`, `number` and `boolean` metadata indexes are supported. Please refer to [Create metadata indexes](https://developers.cloudflare.com/vectorize/get-started/intro/#4-optional-create-metadata-indexes) for details.

Vectorize supports [namespace](https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/#namespaces) filtering by default.
::

In addition to providing an input vector to your query, you can also filter by [vector metadata](https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/#metadata) associated with every vector. Query results only include vectors that match `filter` criteria, meaning that `filter` is applied first, and `topK` results are taken from the filtered set.

By using metadata filtering to limit the scope of a query, you can filter by specific customer IDs, tenant, product category or any other metadata you associate with your vectors.

### Limits

You can store up to 10KiB of metadata per vector, and create up to 10 metadata indexes per Vectorize index.

For metadata indexes of type `number`, the indexed number precision is that of float64.

For metadata indexes of type `string`, each vector indexes the first 64B of the string data truncated on UTF-8 character boundaries to the longest well-formed UTF-8 substring within that limit, so vectors are filterable on the first 64B of their value for each indexed property.

See [Vectorize Limits](https://developers.cloudflare.com/vectorize/platform/limits/) for a complete list of limits.

### Supported operations

Optional `filter` property on `query()` method specifies metadata filter:

| Operator | Description |
| -------- | ----------- |
| `$eq`    | Equals      |
| `$ne`    | Not equals  |

- `filter` must be non-empty object whose compact JSON representation must be less than 2048 bytes.
- `filter` object keys cannot be empty, contain `" | .` (dot is reserved for nesting), start with `$`, or be longer than 512 characters.
- `filter` object non-nested values can be `string`, `number`, `boolean`, or `null` values.

#### Namespace versus metadata filtering

Both [namespaces](https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/#namespaces) and metadata filtering narrow the vector search space for a query. Consider the following when evaluating both filter types:

- A namespace filter is applied before metadata filter(s).
- A vector can only be part of a single namespace with the documented [limits](https://developers.cloudflare.com/vectorize/platform/limits/). Vector metadata can contain multiple key-value pairs up to [metadata per vector limits](https://developers.cloudflare.com/vectorize/platform/limits/). Metadata values support different types (`string`, `boolean`, and others), therefore offering more flexibility.

#### Valid `filter` examples

##### Implicit `$eq` operator

```json
{ "streaming_platform": "netflix" }
```

##### Explicit operator

```json
{ "someKey": { "$ne": true } }
```

##### Implicit logical `AND` with multiple keys

```json
{ "pandas.nice": 42, "someKey": { "$ne": true } }
```

##### Keys define nesting with `.` (dot)

```json
{ "pandas.nice": 42 }

// looks for { "pandas": { "nice": 42 } }
```

### Examples

#### Add metadata

With the following index definition:

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    vectorize: {
      tutorial: {
        dimensions: 32,
        metric: "cosine",
        metadataIndexes: {
          streaming_platform: "string"
        }
      }
    }
  }
})
```

Metadata can be added when [inserting or upserting vectors](#insert).

```ts
const index = hubVectorize("tutorial")

const newMetadataVectors: Array<VectorizeVector> = [
	{
		id: "1",
		values: [32.4, 74.1, 3.2, ...],
		metadata: { url: "/products/sku/13913913", streaming_platform: "netflix" },
	},
	{
		id: "2",
		values: [15.1, 19.2, 15.8, ...],
		metadata: { url: "/products/sku/10148191", streaming_platform: "hbo" },
	},
	{
		id: "3",
		values: [0.16, 1.2, 3.8, ...],
		metadata: { url: "/products/sku/97913813", streaming_platform: "amazon" },
	},
	{
		id: "4",
		values: [75.1, 67.1, 29.9, ...],
		metadata: { url: "/products/sku/418313", streaming_platform: "netflix" },
	},
	{
		id: "5",
		values: [58.8, 6.7, 3.4, ...],
		metadata: { url: "/products/sku/55519183", streaming_platform: "hbo" },
	},
];

// Upsert vectors with added metadata, returning a count of the vectors upserted and their vector IDs
let upserted = await index.upsert(newMetadataVectors);
```

#### Query examples

Use the `query()` method:

```ts
let queryVector: Array<number> = [54.8, 5.5, 3.1, ...];
let originalMatches = await index.query(queryVector, {
	topK: 3,
	returnValues: true,
	returnMetadata: 'all',
});
```

Results without metadata filtering:

```json
{
	"matches": [
		{
			"id": "5",
			"score": 0.999909486,
			"values": [58.79999923706055, 6.699999809265137, 3.4000000953674316],
			"metadata": {
				"url": "/products/sku/55519183",
				"streaming_platform": "hbo"
			}
		},
		{
			"id": "4",
			"score": 0.789848214,
			"values": [75.0999984741211, 67.0999984741211, 29.899999618530273],
			"metadata": {
				"url": "/products/sku/418313",
				"streaming_platform": "netflix"
			}
		},
		{
			"id": "2",
			"score": 0.611976262,
			"values": [15.100000381469727, 19.200000762939453, 15.800000190734863],
			"metadata": {
				"url": "/products/sku/10148191",
				"streaming_platform": "hbo"
			}
		}
	]
}
```

The same `query()` method with a `filter` property supports metadata filtering.

```ts
let queryVector: Array<number> = [54.8, 5.5, 3.1, ...];
let metadataMatches = await index.query(queryVector, {
	topK: 3,
	filter: { streaming_platform: "netflix" },
	returnValues: true,
	returnMetadata: 'all',
});
```

Results with metadata filtering:

```json
{
	"matches": [
		{
			"id": "4",
			"score": 0.789848214,
			"values": [75.0999984741211, 67.0999984741211, 29.899999618530273],
			"metadata": {
				"url": "/products/sku/418313",
				"streaming_platform": "netflix"
			}
		},
		{
			"id": "1",
			"score": 0.491185264,
			"values": [32.400001525878906, 74.0999984741211, 3.200000047683716],
			"metadata": {
				"url": "/products/sku/13913913",
				"streaming_platform": "netflix"
			}
		}
	]
}
```

### Limitations

- As of now, metadata indexes need to be created for Vectorize indexes _before_ vectors can be inserted to support metadata filtering.
- Only indexes created on or after 2023-12-06 support metadata filtering. Previously created indexes cannot be migrated to support metadata filtering.

## Read more

::callout
Read more on [Cloudflare Vectorize documentation](https://developers.cloudflare.com/vectorize/reference/client-api/).
::

::callout{to=https://developers.cloudflare.com/reference-architecture/diagrams/ai/ai-rag/}
[Retrieval Augmented Generation (RAG)](https://developers.cloudflare.com/reference-architecture/diagrams/ai/ai-rag/): Retrieval-Augmented Generation (RAG) is an innovative approach in natural language processing that integrates retrieval mechanisms with generative models to enhance text generation.
::
