# @repo/orm

Zod-to-DML bridge for Medusa.js v2.

Transforms Zod schemas into Medusa Data Model Language (DML) entities, with
explicit relationship metadata and type inference for the persistence layer.

## Usage

```ts
import { z } from "zod"
import { createModel, ref } from "@repo/orm"

const UserSchema = z.object({
  email: z.string(),
})

const User = createModel("User", UserSchema, {
  relationships: {
    posts: { kind: "hasMany", model: () => Post },
  },
})

const PostSchema = z.object({
  title: z.string(),
  user_id: z.string(),
})

const Post = createModel("Post", PostSchema, {
  flatRelations: { user: "user_id" },
  relationships: {
    user: { kind: "belongsTo", model: ref<User>("User") },
  },
})
```

## Features

- **Zod-driven**: entities, validation schemas, and DML definitions stay in sync.
- **Relationship metadata**: explicit `hasOne`, `hasMany`, `belongsTo`, `manyToMany`
  definitions via the `relationships` option.
- **Backward-compatible shorthand**: `relationships: { user: () => User }` is
  normalized to a `belongsTo` relationship.
- **Type inference**: `InferEntityType<typeof Model>` gives the DML persistence
  shape, including relationship arrays/objects.
- **Circular references**: `ref<T>("ModelName")` resolves models by name with a
  typed generic.
- **Validation**: option keys and relationship shapes are validated at
  definition time.

## API

### `createModel(name, schema, options?)`

Register a Zod schema as a Medusa DML entity.

### `define(name, schema, options?)`

Same as `createModel` but does not return the entity. Useful for registration
only.

### `ref<T>(name)`

Resolve a previously-registered model by name. Use `ref<YourEntityType>("Name")`
for type-safe circular references.

### `reset()`

Clear the internal model registry. Intended for tests only.

## Options

| Option          | Description                                                    |
| --------------- | -------------------------------------------------------------- |
| `relationships` | Relationship metadata map.                                     |
| `flatRelations` | Map of relation field name → foreign-key column name.          |
| `cascadeDelete` | Array of relationship field names that cascade on delete.      |
| `indexes`       | Array of `{ on: string[], where?: string, unique?: boolean }`. |

## License

MIT
