---
title: Vectorize (Vector Database)
navigation.title: Vectorize
description: Access a vector database to build full-stack AI-powered applications in Nuxt.
---

::note{to=https://developers.cloudflare.com/vectorize/reference/what-is-a-vector-database/}
Learn what vector databases are on Cloudflare's documentation
::

::warning
Vectorize is only available in local development when using [remote storage](/docs/getting-started/remote-storage).
::

## Getting Started

Vectorize indexes are managed in your NuxtHub project within the `hub.vectorize` object in your `nuxt.config.ts` file. Multiple indexes can be created using separate keys.

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
        dimensions: 768,
        metric: 'cosine',
        metadataIndexes: {
          name: 'string',
          price: 'number'
        }
      },
      reviews: {
        dimensions: 1024,
        metric: 'euclidean',
        metadataIndexes: {
          rating: 'number'
        }
      },
    }
  }
})
```
::

Then, make sure to [deploy your project](/docs/getting-started/deploy) to create the indexes.

Once deployed, you can use the `hubVectorize()` server composable to interact with the vector databases using [remote storage](/docs/getting-started/remote-storage) with the `npx nuxt dev --remote` command.

::important
Cloudflare Vectorize index configurations are immutable after creation. Modifying an index's dimension size or distance metric will disconnect the modified existing index from your deployed project and create a new index. Existing data will not be migrated. Consider your index configuration carefully before creation to avoid data loss and reconnection issues.
::

### Create an index

Creating an index requires three inputs:

- A name, for example prod-search-index or recommendations-idx-dev.
- The (fixed) [dimension size](#dimensions) of each vector, for example 384 or 1536.
- The (fixed) [distance metric](#distance-metrics) to use for calculating vector similarity.

::callout
Index names can only contain lowercase characters, hyphens (-), and are limited to 51 characters. <!-- Cloudflare limit 64, - 13 for -abcd(-preview) index suffixes -->
::

::note
[Cloudflare Vectorize](https://developers.cloudflare.com/vectorize) indexes will be created for your project when you [deploy it](/docs/getting-started/deploy). Created Vectorize indexes contain a unique 4 character suffix.
::

### Use existing indexes

1. On the Cloudflare dashboard → Workers & Pages → Your Pages project
2. Go to Settings → Bindings → Add
3. Select Vectorize database
    - Set the variable name to `VECTORIZE_<NAME>`. The entire variable name should be capitalised.
    - Select the existing Vectorize index
4. Add the index configuration to `hub.vectorize` in `nuxt.config.ts`. The name should match `<name>` used in the variable name, and be lowercase.

### Creating metadata indexes

Vectorize allows you to add up to 10KiB of metadata per vector into your index, and also provides the ability to filter on that metadata while querying vectors. To do so you would need to specify a metadata field as a "metadata index" for your Vectorize index.

::callout{to="#create-metadata-indexes"}
Learn more about [creating metadata indexes](#metadata-filtering).
::

## `hubVectorize()`

Server composable that returns a [Vectorize index](https://developers.cloudflare.com/vectorize/reference/client-api/).

```ts
const index = hubVectorize("<index>")
```

IntelliSense will suggest `<index>` based on the indexes configured in [`hub.vectorize`](#getting-started).

### `insert()`

Inserts vectors into the index.

```ts
const vectorsToInsert = [
  { id: "123", values: [32.4, 6.5, 11.2, 10.3, 87.9] },
  { id: "456", values: [2.5, 7.8, 9.1, 76.9, 8.5] },
];
const inserted = await index.insert(vectorsToInsert);
```

See all available properties on the [Vector object](#vector-object).

If vectors with the same vector ID already exist in the index, only the vectors with new IDs will be inserted.

::callout
Vectorize inserts are asynchronous and the insert operation returns a mutation identifier unique for that operation. It typically takes a few seconds for inserted vectors to be available for querying in an index.
::

If you need to update existing vectors, use the [upsert](#upsert) operation.

::note
Insert vs Upsert
- If the same vector id is inserted twice in a Vectorize index, the index would reflect the vector that was added first.
- If the same vector id is upserted twice in a Vectorize index, the index would reflect the vector that was added second.
- Use the upsert operation if you want to overwrite the vector value for a vector id that already exists in an index.
::

#### Return

Returns [`VectorizeAsyncMutation`](#vectorizeasyncmutation).

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

See all available properties on the [Vector object](#vector-object).

::note
Upserting does not merge or combine the values or metadata of an existing vector with the upserted vector: the upserted vector replaces the existing vector in full.
::

::callout
Vectorize upserts are asynchronous and the upsert operation returns a mutation identifier unique for that operation. It typically takes a few seconds for upserted vectors to be available for querying in an index.
::

#### Return

Returns [`VectorizeAsyncMutation`](#vectorizeasyncmutation).

### `query()`

Query an index with the provided vector, returning the score(s) of the closest vectors based on the configured distance metric.

```ts
const queryVector = [32.4, 6.55, 11.2, 10.3, 87.9];
const matches = await index.query(queryVector);

console.log(matches)
/*
{
	"count": 5,
	"matches": [
		{ "score": 0.999909486, "id": "5" },
		{ "score": 0.789848214, "id": "4" },
		{ "score": 0.720476967, "id": "1234" },
		{ "score": 0.463884663, "id": "6" },
		{ "score": 0.378282232, "id": "1" }
	]
}
*/
```

Querying an index, or vector search, enables you to search an index by providing an input vector and returning the nearest vectors based on the [configured distance metric](#distance-metrics).

Optionally, you can apply [metadata filters](#metadata-filtering) or a [namespace](#namespaces) to narrow the vector search space.

#### Params

::field-group
  ::field{name="vector" type="array" required}
    Input vector that will be used to drive the similarity search.
  ::

  ::field{name="options" type="object"}
    Query options.
    ::collapsible
      ::field{name="topK" type="number"}
        Number of returned matches. Defaults to `5`.

        The `topK` can be configured to specify the number of matches returned by the query operation. Vectorize now supports an upper limit of `100` for the `topK` value. However, for a query operation with `returnValues` set to `true` or `returnMetadata` set to `all`, `topK` would be limited to a maximum value of `20`.

        <br>
      ::
      ::field{name="returnValues" type="boolean"}
        Return vector values. See [control over scoring precision and query accuracy](#control-over-scoring-precision-and-query-accuracy).
      ::
      ::field{name="returnMetadata" type="'all' | 'indexed' | 'none'"}
        Return vector metadata. Defaults to `'none'`.

        The `returnMetadata` field provides three ways to fetch vector metadata while querying:

        1. `none`: Do not fetch metadata.
        2. `indexed`: Fetched metadata only for the indexed metadata fields. There is no latency overhead with this option, but long text fields may be truncated.
        3. `all`: Fetch all metadata associated with a vector. Queries may run slower with this option, and `topK` would be limited to 20.

        <br>
      ::
      ::field{name="namespace" type="string"}
        Only return vectors within a namespace.
      ::
      ::field{name="filter" type="object"}
        Filter by vector metadata. See [metadata filtering](#metadata-filtering)
      ::
    ::
  ::
::

```ts
const matches = await index.query(queryVector, {
  topK: 5,
  returnValues: true,
  returnMetadata: "all",
});
```

#### Return

Returns [`VectorizeMatches`](#vectorizematches).

#### Control over scoring precision and query accuracy

When querying vectors, you can specify to either use high-precision scoring, thereby increasing the precision of the query matches scores as well as the accuracy of the query results, or use approximate scoring for faster response times.
Using approximate scoring, returned scores will be an approximation of the real distance/similarity between your query and the returned vectors.

High-precision scoring is enabled by setting `returnValues: true` on your query; this tells Vectorize to fetch and use the original vector values for your matches, which enables the computation of exact scores of matches, increasing the accuracy of the results.

### `getByIds()`

Retrieves the specified vectors by their ID, including values and metadata.

```ts
const ids = ["11", "22", "33", "44"];
const vectors = await index.getByIds(ids);
```

#### Params

::field-group
  ::field{name="ids" type="string[]" required}
    List of vector ids that should be returned.
  ::
::

#### Return

Returns [`VectorizeVector`](#vectorizevector).

### `deleteByIds()`

Deletes the vector IDs provided from the current index.

```ts
const idsToDelete = ["11", "22", "33", "44"];
const deleted = await index.deleteByIds(idsToDelete);
```

::callout
Vectorize deletes are asynchronous and the delete operation returns a mutation identifier unique for that operation. It typically takes a few seconds for vectors to be removed from the Vectorize index.
::

#### Params

::field-group
  ::field{name="ids" type="string[]" required}
    List of vector ids that should be deleted.
  ::
::

#### Return

Returns [`VectorizeAsyncMutation`](#vectorizeasyncmutation).

### `describe()`

Retrieves the configuration of a given index directly, including its configured `dimensions` and distance `metric`.

```ts
const details = await index.describe();
```

#### Return

Returns [`VectorizeIndexDetails`](#vectorizeindexdetails).

## Vectors


### Vector Object

A vector represents the vector embedding output from a machine learning model.

::field-group
  ::field{name="id" type="string" required}
    A unique `string` identifying the vector in the index. This should map back to the ID of the document, object or database identifier that the vector values were generated from.
  ::

  ::field{name="namespace" type="object"}
    An optional partition key within a index. Operations are performed per-namespace, so this can be used to create isolated segments within a larger index.
  ::

  ::field{name="values" type="number[] | Float32Array | Float64Array" required}
    An array of `number`, `Float32Array`, or `Float64Array` as the vector embedding itself. This must be a dense array, and the length of this array must match the `dimensions` configured on the index.
  ::

  ::field{name="metadata" type="Record<string, 'string' | 'number' | 'boolean'>"}
    An optional set of key-value pairs that can be used to store additional metadata alongside a vector.
  ::
::

```ts
const vectorExample = {
	id: "12345",
	values: [32.4, 6.55, 11.2, 10.3, 87.9],
	metadata: {
		key: "value",
		hello: "world",
		url: "r2://bucket/some/object.json",
	},
};
```

### Dimensions

Dimensions are determined from the output size of the machine learning (ML) model used to generate them, and are a function of how the model encodes and describes features into a vector embedding.

The number of output dimensions can determine vector search accuracy, search performance (latency), and the overall size of the index. Smaller output dimensions can be faster to search across, which can be useful for user-facing applications. Larger output dimensions can provide more accurate search, especially over larger datasets and/or datasets with substantially similar inputs.

The number of dimensions an index is created for cannot change. Indexes expect to receive dense vectors with the same number of dimensions.

The following table highlights some example embeddings models and their output dimensions:

| Model / Embeddings API                   | Output dimensions | Use-case                   |
| ---------------------------------------- | ----------------- | -------------------------- |
| Workers AI - `@cf/baai/bge-base-en-v1.5` | 768               | Text                       |
| OpenAI - `ada-002`                       | 1536              | Text                       |
| Cohere - `embed-multilingual-v2.0`       | 768               | Text                       |
| Google Cloud - `multimodalembedding`     | 1408              | Multi-modal (text, images) |

::note
Refer to the [Workers AI documentation](https://developers.cloudflare.com/workers-ai/models/#text-embeddings) to learn about its built-in embedding models.
::

### Distance metrics

Distance metrics are functions that determine how close vectors are from each other. Vectorize indexes support the following distance metrics:

| Metric        | Details                                                                                                                                                                                            |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cosine`      | Distance is measured between `-1` (most dissimilar) to `1` (identical). `0` denotes an orthogonal vector.                                                                                          |
| `euclidean`   | Euclidean (L2) distance. `0` denotes identical vectors. The larger the positive number, the further the vectors are apart.                                                                         |
| `dot-product` | Negative dot product. Larger negative values _or_ smaller positive values denote more similar vectors. A score of `-1000` is more similar than `-500`, and a score of `15` more similar than `50`. |

Determining the similarity between vectors can be subjective based on how the machine-learning model that represents features in the resulting vector embeddings. For example, a score of `0.8511` when using a `cosine` metric means that two vectors are close in distance, but whether data they represent is _similar_ is a function of how well the model is able to represent the original content.

When querying vectors, you can specify Vectorize to use either:

- High-precision scoring, which increases the precision of the query matches scores as well as the accuracy of the query results.
- Approximate scoring for faster response times. Using approximate scoring, returned scores will be an approximation of the real distance/similarity between your query and the returned vectors. Refer to [Control over scoring precision and query accuracy](#control-over-scoring-precision-and-query-accuracy).

Distance metrics cannot be changed after index creation, and that each metric has a different scoring function.

### Supported vector formats

Vectorize supports vectors in three formats:

- An array of floating point numbers (converted into a JavaScript `number[]` array).
- A [Float32Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float32Array)
- A [Float64Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Float64Array)

In most cases, a `number[]` array is the easiest when dealing with other APIs, and is the return type of most machine-learning APIs.

## Metadata & filtering

Metadata is an optional set of key-value pairs that can be attached to a vector on insert or upsert, and allows you to embed or co-locate data about the vector itself.

::callout
Metadata keys cannot be empty, contain the dot character (`.`), contain the double-quote character (`"`), or start with the dollar character (`$`).
::

Metadata can be used to:

- Include the object storage key, database UUID or other identifier to look up the content the vector embedding represents.
- The raw content (up to the [metadata limits](https://developers.cloudflare.com/vectorize/platform/limits/)), which can allow you to skip additional lookups for smaller content.
- Dates, timestamps, or other metadata that describes when the vector embedding was generated or how it was generated.

For example, a vector embedding representing an image could include the path to the [blob](/docs/features/blob) it was generated from, the format, and a category lookup:

```ts
{ id: '1', values: [32.4, 74.1, 3.2, ...], metadata: { path: 'r2://bucket-name/path/to/image.png', format: 'png', category: 'profile_image' } }
```

### Metadata filtering

In addition to providing an input vector to your query, you can also filter by [vector metadata](#metadata) associated with every vector. Query results only include vectors that match `filter` criteria, meaning that `filter` is applied first, and `topK` results are taken from the filtered set.

By using metadata filtering to limit the scope of a query, you can filter by specific customer IDs, tenant, product category or any other metadata you associate with your vectors.

::warning
Vectorize requires metadata indexes to be specified before vectors are inserted to support metadata filtering. `string`, `number` and `boolean` metadata indexes are supported. Please refer to [Create metadata indexes](#create-metadata-indexes) for details.<br><br>

Vectorize supports [namespace](#namespaces) filtering by default.
::

### Create metadata indexes

Metadata indexes are all managed within the `metadataIndexes` object within your index configuration in `nuxt.config.ts`.

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  hub: {
    vectorize: {
      tutorial: {
        dimensions: 32,
        metric: "cosine",
        metadataIndexes: {
          // <property>: "string" | "number" | "boolean"
          url: "string",
          "nested.property": "boolean"
        }
      }
    }
  }
})
```

Supported metadata index property types are `string`, `number` and `boolean` types.

Define nested properties using `.` (dot).

::callout
Vectorize currently supports a maximum of 10 metadata indexes per Vectorize index. Learn more at https://developers.cloudflare.com/vectorize/platform/limits/.
::

For metadata indexes of type number, the indexed number precision is that of float64.

For metadata indexes of type string, each vector indexes the first 64B of the string data truncated on UTF-8 character boundaries to the longest well-formed UTF-8 substring within that limit, so vectors are filterable on the first 64B of their value for each indexed property.

::note
As of today, the metadata fields on which vectors can be filtered need to be specified before the vectors are inserted, and it is recommended that these metadata fields are specified right after the creation of a Vectorize index.
::

### Supported operations

Optional `filter` property on `query()` method specifies metadata filter:

| Operator | Description |
| -------- | ----------- |
| `$eq`    | Equals      |
| `$ne`    | Not equals  |

- `filter` must be non-empty object whose compact JSON representation must be less than 2048 bytes.
- `filter` object keys cannot be empty, contain `" | .` (dot is reserved for nesting), start with `$`, or be longer than 512 characters.
- `filter` object non-nested values can be `string`, `number`, `boolean`, or `null` values.

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

### Limits

You can store up to 10KiB of metadata per vector, and create up to 10 metadata indexes per Vectorize index.

For metadata indexes of type `number`, the indexed number precision is that of float64.

For metadata indexes of type `string`, each vector indexes the first 64B of the string data truncated on UTF-8 character boundaries to the longest well-formed UTF-8 substring within that limit, so vectors are filterable on the first 64B of their value for each indexed property.

See [Vectorize Limits](https://developers.cloudflare.com/vectorize/platform/limits/) for a complete list of limits.

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
          streaming_platform: "string",
          "property.nested": "boolean"
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
const upserted = await index.upsert(newMetadataVectors);
```

#### Query examples

Use the [`query()`](#query) method:

```ts
const queryVector: Array<number> = [54.8, 5.5, 3.1, ...];
const originalMatches = await index.query(queryVector, {
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

The same [`query()`](#query) method with a `filter` property supports metadata filtering.

```ts
const queryVector: Array<number> = [54.8, 5.5, 3.1, ...];
const metadataMatches = await index.query(queryVector, {
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

## Namespaces

Namespaces provide a way to segment the vectors within your index. For example, by customer, merchant or store ID.

To associate vectors with a namespace, you can optionally provide a `namespace: string` value when performing an insert or upsert operation. When querying, you can pass the namespace to search within as an optional parameter to your query.

A namespace can be up to 64 characters (bytes) in length and you can have up to 1,000 namespaces per index. Refer to the [Limits](https://developers.cloudflare.com/vectorize/platform/limits/) documentation for more details.

When a namespace is specified in a query operation, only vectors within that namespace are used for the search. Namespace filtering is applied before vector search, not after.

#### Insert vectors with a namespace

```ts
// Mock vectors
// Vectors from a machine-learning model are typically ~100 to 1536 dimensions
// wide (or wider still).
const sampleVectors: Array<VectorizeVector> = [
	{
		id: "1",
		values: [32.4, 74.1, 3.2, ...],
		namespace: "text",
	},
	{
		id: "2",
		values: [15.1, 19.2, 15.8, ...],
		namespace: "images",
	},
	{
		id: "3",
		values: [0.16, 1.2, 3.8, ...],
		namespace: "pdfs",
	},
];

// Insert your vectors, returning a count of the vectors inserted and their vector IDs.
const inserted = await index.insert(sampleVectors);
```

#### Query vectors within a namespace

```ts
// Your queryVector will be searched against vectors within the namespace (only)
const matches = await index.query(queryVector, {
	namespace: "images",
});
```

### Namespace versus metadata filtering

Both [namespaces](https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/#namespaces) and metadata filtering narrow the vector search space for a query. Consider the following when evaluating both filter types:

- A namespace filter is applied before metadata filter(s).
- A vector can only be part of a single namespace with the documented [limits](https://developers.cloudflare.com/vectorize/platform/limits/). Vector metadata can contain multiple key-value pairs up to [metadata per vector limits](https://developers.cloudflare.com/vectorize/platform/limits/). Metadata values support different types (`string`, `boolean`, and others), therefore offering more flexibility.

## Limits

| Feature                                                       | Current Limit                                                    |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| Indexes per account                                           | 100 indexes                                                      |
| Maximum dimensions per vector                                 | 1536 dimensions                                                  |
| Maximum vector ID length                                      | 51 bytes                                                         | <!-- Cloudflare limit 64, - 13 for -abcd(-preview) index suffixes -->
| Metadata per vector                                           | 10KiB                                                            |
| Maximum returned results (`topK`) with values or metadata     | 20                                                               |
| Maximum returned results (`topK`) without values and metadata | 100                                                              |
| Maximum upsert batch size (per batch)                         | 1000                                                             |
| Maximum index name length                                     | 64 bytes                                                         |
| Maximum vectors per index                                     | 5,000,000                                                        |
| Maximum namespaces per index                                  | 1000 namespaces                                                  |
| Maximum namespace name length                                 | 64 bytes                                                         |
| Maximum vectors upload size                                   | 100 MB                                                           |
| Maximum metadata indexes per Vectorize index                  | 10                                                               |
| Maximum indexed data per metadata index per vector            | 64 bytes                                                         |

Learn more about [Cloudflare Vectorize limits](https://developers.cloudflare.com/vectorize/platform/limits/).

## Types

### `VectorizeVector`

See [vector object](#vector-object).

```ts
interface VectorizeVector {
  /** The ID for the vector. This can be user-defined, and must be unique. It should uniquely identify the object, and is best set based on the ID of what the vector represents. */
  id: string;
  /** The vector values */
  values: VectorFloatArray | number[];
  /** The namespace this vector belongs to. */
  namespace?: string;
  /** Metadata associated with the vector. Includes the values of other fields and potentially additional details. */
  metadata?: Record<string, VectorizeVectorMetadata>;
}
```

### `VectorizeMatches`

A set of matching [VectorizeMatch](#vectorizematch) for a particular query.

```ts
interface VectorizeMatches {
  matches: VectorizeMatch[];
  count: number;
}
```

### `VectorizeMatch`

Represents a matched vector for a query along with its score and (if specified) the matching vector information.

```ts
type VectorizeMatch = Pick<Partial<VectorizeVector>, "values"> &
  Omit<VectorizeVector, "values"> & {
    /** The score or rank for similarity, when returned as a result */
    score: number;
  };
```

### `VectorizeAsyncMutation`

Result type indicating a mutation on the Vectorize Index. Actual mutations are processed async where the `mutationId` is the unique identifier for the operation.

```ts
interface VectorizeAsyncMutation {
  /** The unique identifier for the async mutation operation containing the changeset. */
  mutationId: string;
}
```

### `VectorizeIndexInfo`

Metadata about an existing index.

```ts
interface VectorizeIndexInfo {
  /** The number of records containing vectors within the index. */
  vectorsCount: number;
  /** Number of dimensions the index has been configured for. */
  dimensions: number;
  /** ISO 8601 datetime of the last processed mutation on in the index. All changes before this mutation will be reflected in the index state. */
  processedUpToDatetime: number;
  /** UUIDv4 of the last mutation processed by the index. All changes before this mutation will be reflected in the index state. */
  processedUpToMutation: number;
}
```

## Examples

### Vector search

In this example:
1. An embeddings vector is generated from the search query.
2. The Vectorize index is queried with the embeddings vector.
3. Then the original source data is retrieved by querying the database for the IDs returned by Vectorize.

Learn more at https://developers.cloudflare.com/vectorize/reference/what-is-a-vector-database/#vector-search

```ts [server/api/search.get.ts]
import { z } from "zod";

interface EmbeddingResponse {
  shape: number[];
  data: number[][];
}

const Query = z.object({
  query: z.string().min(1).max(256),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export default defineEventHandler(async (event) => {
  const { query, limit } = await getValidatedQuery(event, Query.parse);

  // 1. generate embeddings for search query
  const embeddings: EmbeddingResponse = await hubAI().run("@cf/baai/bge-base-en-v1.5", { text: [query] });
  const vectors = embeddings.data[0];

  // 2. query vectorize to find similar results
  const vectorize: VectorizeIndex = hubVectorize('jobs');
  const { matches } = await vectorize.query(vectors, { topK: limit });

  // 3. get details for matching items
  const jobMatches = await useDrizzle().query.jobs.findMany({
    where: (jobs, { inArray }) => inArray(jobs.id, matches.map((match) => match.id)),
    with: {
      department: true,
      subDepartment: true,
    },
  });

  // 4. add score to matches
  const jobMatchesWithScore = jobMatches.map((job) => {
    const match = matches.find((match) => match.id === job.id);
    return { ...job, score: match!.score };
  });

  // 5. sort by score
  return jobMatchesWithScore.sort((a, b) => b.score - a.score);
});
```

### Bulk generation and import

This example bulk generates vectors using a text embeddings AI model for all data within a database table, using [Nitro tasks](https://nitro.unjs.io/guide/tasks). You can run the task via Nuxt DevTools.

```ts [server/tasks/generate-embeddings.ts]
import { jobs } from "../database/schema";
import { asc, count } from "drizzle-orm";

export default defineTask({
  meta: {
    name: "vectorize:seed",
    description: "Generate text embeddings vectors",
  },
  async run() {
    console.log("Running Vectorize seed task...");
    const jobCount = (await useDrizzle().select({ count: count() }).from(tables.jobs))[0].count;

    // process in chunks of 100 as that's the maximum supported by workers ai
    const INCREMENT_AMOUNT = 100;

    const totalBatches = Math.ceil(jobCount / INCREMENT_AMOUNT);
    console.log(`Total items: ${jobCount} (${totalBatches} batches)`);

    for (let i = 0; i < jobCount; i += INCREMENT_AMOUNT) {
      console.log(`⏳ Processing items ${i} - ${i + INCREMENT_AMOUNT}...`);

      const jobsChunk = await useDrizzle()
        .select()
        .from(tables.jobs)
        .orderBy(asc(jobs.id))
        .limit(INCREMENT_AMOUNT)
        .offset(i);

      // generate embeddings for job titles
      const ai = hubAi();
      const embeddings = await ai.run(
        "@cf/baai/bge-base-en-v1.5",
        { text: jobsChunk.map((job) => job.jobTitle) },
        { gateway: { id: "new-role" } },
      );
      const vectors = embeddings.data;

      const formattedEmbeddings = jobsChunk.map(({ id, ...metadata }, index) => ({
        id,
        metadata: { ...metadata },
        values: vectors[index],
      }));

      // save vector embeddings to index
      const index = hubVectorize('jobs');
      await index.upsert(formattedEmbeddings);

      console.log(`✅ Processed items ${i} - ${i + INCREMENT_AMOUNT}...`);
    }

    console.log("Vectorize seed task completed!");
    return { result: "success" };
  },
});
```

<!-- TODO: Recipe for Retrieval Augmented Generation (RAG) -->
