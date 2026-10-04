import { z } from "@medusajs/framework/zod"
import type { InferEntityType } from "@medusajs/framework/types"
import { MedusaService, type DmlEntity } from "@medusajs/framework/utils"
import { createModel, ref, reset } from "../registry"
import type { InferDmlSchema, DmlProperty, DmlRelationship, CreateModelEntity } from "./inference"

type Assert<T extends true> = T
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Extends<A, B> = A extends B ? true : false
type IsAny<T> = 0 extends 1 & T ? true : false

describe("InferDmlSchema", () => {
  it("remaps flatRelations keys to DmlProperty<string>", () => {
    const FlatSchema = z.object({
      id: z.string(),
      customer: z.object({ id: z.string() }),
    })

    type Result = InferDmlSchema<typeof FlatSchema, { customer: "customer_id" }>

    type _AssertRemap = Assert<Equals<Result["customer_id"], DmlProperty<string>>>
    type _AssertRenamed = Assert<"customer" extends keyof Result ? false : true>

    expect(true).toBe(true)
  })

  it("includes undefined for optional scalar fields", () => {
    const OptionalSchema = z.object({
      description: z.string().optional(),
    })

    type Result = InferDmlSchema<typeof OptionalSchema>

    type _Assert = Assert<Equals<Result["description"], DmlProperty<string | undefined>>>

    expect(true).toBe(true)
  })
})

describe("CreateModelEntity relationship inference", () => {
  const CustomerSchema = z.object({ id: z.string(), name: z.string() })
  type CustomerDml = InferDmlSchema<typeof CustomerSchema>
  type Customer = DmlEntity<CustomerDml, "Customer">

  const ProfileSchema = z.object({ id: z.string(), bio: z.string() })
  type ProfileDml = InferDmlSchema<typeof ProfileSchema>
  type Profile = DmlEntity<ProfileDml, "Profile">

  const ItemSchema = z.object({ id: z.string(), price: z.number() })
  type ItemDml = InferDmlSchema<typeof ItemSchema>
  type Item = DmlEntity<ItemDml, "Item">

  const TagSchema = z.object({ id: z.string(), label: z.string() })
  type TagDml = InferDmlSchema<typeof TagSchema>
  type Tag = DmlEntity<TagDml, "Tag">

  const OrderSchema = z.object({
    id: z.string(),
    customer: z.object({ id: z.string() }),
    profile: z.object({ id: z.string() }).optional(),
    items: z.array(z.object({ id: z.string() })),
    tags: z.array(z.object({ id: z.string() })),
  })

  type OrderOptions = {
    flatRelations: Record<string, never>
    relationships: {
      customer: { kind: "belongsTo"; model: () => Customer }
      profile: { kind: "hasOne"; model: () => Profile }
      items: { kind: "hasMany"; model: () => Item }
      tags: { kind: "manyToMany"; model: () => Tag; options: { pivotTable: "order_tag" } }
    }
  }

  type OrderEntity = CreateModelEntity<typeof OrderSchema, OrderOptions>
  type OrderDml = OrderEntity extends DmlEntity<infer S, any> ? S : never
  type Order = InferEntityType<OrderEntity>

  it("maps belongsTo to a DmlRelationship resolver", () => {
    type _Assert = Assert<
      Extends<OrderDml["customer"], DmlRelationship<() => Customer, "belongsTo">>
    >

    expect(true).toBe(true)
  })

  it("marks belongsTo with a $foreignKey marker", () => {
    type _Assert = Assert<Extends<OrderDml["customer"], { $foreignKey: true }>>

    expect(true).toBe(true)
  })

  it("maps hasOne to a DmlRelationship resolver", () => {
    type _Assert = Assert<Extends<OrderDml["profile"], DmlRelationship<() => Profile, "hasOne">>>

    expect(true).toBe(true)
  })

  it("maps hasMany to a DmlRelationship resolver", () => {
    type _Assert = Assert<Extends<OrderDml["items"], DmlRelationship<() => Item, "hasMany">>>

    expect(true).toBe(true)
  })

  it("maps manyToMany to a DmlRelationship resolver", () => {
    type _Assert = Assert<Extends<OrderDml["tags"], DmlRelationship<() => Tag, "manyToMany">>>

    expect(true).toBe(true)
  })

  it("infers entity fields from belongsTo", () => {
    type _Assert = Assert<Equals<Order["customer"], InferEntityType<Customer>>>

    expect(true).toBe(true)
  })

  it("infers entity fields from hasOne", () => {
    type _Assert = Assert<Equals<Order["profile"], InferEntityType<Profile>>>

    expect(true).toBe(true)
  })

  it("infers entity fields from hasMany", () => {
    type _Assert = Assert<Equals<Order["items"], InferEntityType<Item>[]>>

    expect(true).toBe(true)
  })

  it("infers entity fields from manyToMany", () => {
    type _Assert = Assert<Equals<Order["tags"], InferEntityType<Tag>[]>>

    expect(true).toBe(true)
  })

  it("infers a foreign-key column for belongsTo", () => {
    type _Assert = Assert<Extends<Order["customer_id"], string>>

    expect(true).toBe(true)
  })
})

/**
 * Type tests for circular hasMany ↔ belongsTo relationships.
 *
 * Acceptance criteria: bidirectional references infer the correct DML entity
 * shapes without `as unknown as` casts, and the belongsTo side exposes its FK
 * column in the inferred entity type.
 */
describe("circular hasMany ↔ belongsTo inference", () => {
  const BrandSchema = z.object({
    id: z.string(),
    name: z.string(),
    models: z.array(z.object({ id: z.string() })),
  })

  const DeviceModelSchema = z.object({
    id: z.string(),
    name: z.string(),
    brand: z.object({ id: z.string() }),
  })

  type Brand = DmlEntity<BrandDml, "Brand">
  type BrandDml = InferDmlSchema<typeof BrandSchema, Record<string, never>, BrandRelationships>
  type BrandRelationships = {
    models: { kind: "hasMany"; model: () => DeviceModel }
  }

  type DeviceModel = DmlEntity<DeviceModelDml, "DeviceModel">
  type DeviceModelDml = InferDmlSchema<
    typeof DeviceModelSchema,
    Record<string, never>,
    DeviceModelRelationships
  >
  type DeviceModelRelationships = {
    brand: {
      kind: "belongsTo"
      model: () => Brand
      options: { foreignKeyName: "brand_id" }
    }
  }

  type BrandEntity = InferEntityType<Brand>
  type DeviceModelEntity = InferEntityType<DeviceModel>

  it("infers hasMany side as a DmlRelationship resolver", () => {
    type _Assert = Assert<
      Extends<BrandDml["models"], DmlRelationship<() => DeviceModel, "hasMany">>
    >

    expect(true).toBe(true)
  })

  it("infers belongsTo side as a DmlRelationship resolver", () => {
    type _Assert = Assert<
      Extends<DeviceModelDml["brand"], DmlRelationship<() => Brand, "belongsTo">>
    >

    expect(true).toBe(true)
  })

  it("infers the belongsTo foreign-key column via InferEntityType", () => {
    type _Assert = Assert<Extends<DeviceModelEntity["brand_id"], string>>

    expect(true).toBe(true)
  })

  it("infers the circular hasMany entity field", () => {
    type _Assert = Assert<Equals<BrandEntity["models"], DeviceModelEntity[]>>

    expect(true).toBe(true)
  })

  it("infers the circular belongsTo entity field", () => {
    type _Assert = Assert<Equals<DeviceModelEntity["brand"], BrandEntity>>

    expect(true).toBe(true)
  })
})

/**
 * Type tests for hasOne with foreignKey: true.
 *
 * Acceptance criteria: a hasOne that owns the FK must add the FK column
 * (e.g. profile_id) to the inferred entity type.
 */
describe("hasOne foreignKey inference", () => {
  const UserSchema = z.object({
    id: z.string(),
    email: z.string(),
    profile: z.object({ id: z.string() }).optional(),
  })

  const ProfileSchema = z.object({
    id: z.string(),
    bio: z.string(),
  })

  type UserDml = InferDmlSchema<typeof UserSchema>
  type User = DmlEntity<UserDml, "User">

  type ProfileDml = InferDmlSchema<typeof ProfileSchema>
  type Profile = DmlEntity<ProfileDml, "Profile">

  type UserOptions = {
    flatRelations: Record<string, never>
    relationships: {
      profile: {
        kind: "hasOne"
        model: () => Profile
        options: { foreignKey: true; nullable: true }
      }
    }
  }

  type UserEntity = CreateModelEntity<typeof UserSchema, UserOptions>
  type UserEntityDml = UserEntity extends DmlEntity<infer S, any> ? S : never
  type UserEntityType = InferEntityType<UserEntity>

  it("infers hasOne relationship as a DmlRelationship resolver", () => {
    type _Assert = Assert<
      Extends<UserEntityDml["profile"], DmlRelationship<() => Profile | null, "hasOne">>
    >

    expect(true).toBe(true)
  })

  it("marks hasOne with foreignKey: true", () => {
    type _Assert = Assert<Extends<UserEntityDml["profile"], { $foreignKey: true }>>

    expect(true).toBe(true)
  })

  it("infers a foreign-key column for hasOne with foreignKey: true", () => {
    type _Assert = Assert<Extends<UserEntityType["profile_id"], string>>

    expect(true).toBe(true)
  })
})

/**
 * Type tests for self-referential relationships.
 *
 * Acceptance criteria: Category.parent (belongsTo) and Category.children
 * (hasMany) must infer the same entity shape, and parent_id must appear in the
 * inferred entity type.
 */
describe("self-referential relationship inference", () => {
  const CategorySchema = z.object({
    id: z.string(),
    name: z.string(),
    parent: z.object({ id: z.string() }).optional(),
    children: z.array(z.object({ id: z.string() })),
  })

  type Category = DmlEntity<CategoryDml, "Category">
  type CategoryDml = InferDmlSchema<
    typeof CategorySchema,
    Record<string, never>,
    CategoryRelationships
  >
  type CategoryRelationships = {
    parent: {
      kind: "belongsTo"
      model: () => Category
      options: { foreignKeyName: "parent_id"; nullable: true }
    }
    children: { kind: "hasMany"; model: () => Category }
  }

  type CategoryEntity = CreateModelEntity<
    typeof CategorySchema,
    { flatRelations: Record<string, never>; relationships: CategoryRelationships }
  >
  type CategoryEntityDml = CategoryEntity extends DmlEntity<infer S, any> ? S : never
  type CategoryEntityType = InferEntityType<CategoryEntity>

  it("infers self belongsTo as a DmlRelationship resolver", () => {
    type _Assert = Assert<
      Extends<CategoryEntityDml["parent"], DmlRelationship<() => Category | null, "belongsTo">>
    >

    expect(true).toBe(true)
  })

  it("infers self hasMany as a DmlRelationship resolver", () => {
    type _Assert = Assert<
      Extends<CategoryEntityDml["children"], DmlRelationship<() => Category, "hasMany">>
    >

    expect(true).toBe(true)
  })

  it("infers the self-referential foreign-key column", () => {
    type _Assert = Assert<Extends<CategoryEntityType["parent_id"], string>>

    expect(true).toBe(true)
  })

  it("infers the self-referential entity fields", () => {
    type _Assert = Assert<Equals<CategoryEntityType["parent"], CategoryEntityType | null>>
    type _AssertChildren = Assert<Equals<CategoryEntityType["children"], CategoryEntityType[]>>

    expect(true).toBe(true)
  })
})

/**
 * Regression tests for the production model-declaration pattern.
 *
 * Acceptance criteria: circular model consts annotated with direct
 * `DmlEntity<InferDmlSchema<…>>` aliases compile without TS7022/TS2589,
 * `ref` receives aliases instead of `typeof <const>`, and `MedusaService`
 * auto-infers concrete CRUD signatures from the resulting model map.
 */
describe("annotated circular model consts + MedusaService inference", () => {
  afterEach(() => {
    reset()
  })

  type BrandShape = { id: string; name: string; models: DeviceModelShape[] }
  type DeviceModelShape = { id: string; name: string; brand: BrandShape }

  const BrandSchema: z.ZodObject<{ [K in keyof BrandShape]-?: z.ZodType<BrandShape[K]> }> =
    z.object({
      id: z.string(),
      name: z.string(),
      models: z.array(z.lazy(() => DeviceModelSchema)),
    }) as never

  const DeviceModelSchema: z.ZodObject<{
    [K in keyof DeviceModelShape]-?: z.ZodType<DeviceModelShape[K]>
  }> = z.object({
    id: z.string(),
    name: z.string(),
    brand: z.lazy(() => BrandSchema),
  }) as never

  type BrandDml = InferDmlSchema<typeof BrandSchema, Record<string, never>, BrandRels>
  type BrandRels = {
    models: { kind: "hasMany"; model: () => DeviceModel }
  }
  type Brand = DmlEntity<BrandDml, string>

  type DeviceModelDml = InferDmlSchema<
    typeof DeviceModelSchema,
    Record<string, never>,
    DeviceModelRels
  >
  type DeviceModelRels = {
    brand: {
      kind: "belongsTo"
      model: () => Brand
      options: { foreignKeyName: "brand_id" }
    }
  }
  type DeviceModel = DmlEntity<DeviceModelDml, string>

  const Brand: Brand = createModel("Brand", BrandSchema, {
    relationships: {
      models: {
        kind: "hasMany",
        model: ref<DeviceModel>("DeviceModel"),
        options: { mappedBy: "brand" as const },
      },
    },
  })

  const DeviceModel: DeviceModel = createModel("DeviceModel", DeviceModelSchema, {
    relationships: {
      brand: {
        kind: "belongsTo",
        model: ref<Brand>("Brand"),
        options: { mappedBy: "models" as const, foreignKeyName: "brand_id" as const },
      },
    },
  })

  type BrandDto = InferEntityType<Brand>
  type DeviceModelDto = InferEntityType<DeviceModel>

  it("keeps annotated const types concrete (not any)", () => {
    type _AssertBrand = Assert<Equals<IsAny<typeof Brand>, false>>
    type _AssertDeviceModel = Assert<Equals<IsAny<typeof DeviceModel>, false>>

    expect(true).toBe(true)
  })

  it("expands circular relationships in inferred DTO types", () => {
    type _AssertModels = Assert<Equals<BrandDto["models"], DeviceModelDto[]>>
    type _AssertBrand = Assert<Equals<DeviceModelDto["brand"], BrandDto>>
    type _AssertBrandId = Assert<Extends<DeviceModelDto["brand_id"], string>>

    expect(true).toBe(true)
  })

  it("auto-infers MedusaService CRUD signatures from the model map", () => {
    const ServiceBase = MedusaService({ Brand, DeviceModel })
    type Service = InstanceType<typeof ServiceBase>

    type _AssertRetrieve = Assert<Equals<ReturnType<Service["retrieveBrand"]>, Promise<BrandDto>>>
    type _AssertList = Assert<Equals<ReturnType<Service["listBrands"]>, Promise<BrandDto[]>>>
    type _AssertListDeviceModels = Assert<
      Equals<ReturnType<Service["listDeviceModels"]>, Promise<DeviceModelDto[]>>
    >

    expect(true).toBe(true)
  })

  it("returns registered models at runtime", () => {
    expect(Brand.name).toBe("Brand")
    expect(DeviceModel.name).toBe("DeviceModel")
  })
})
