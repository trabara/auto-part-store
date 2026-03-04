import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow
} from "@medusajs/medusa/core-flows";
import { ApiKey } from "../../.medusa/types/query-entry-points";
import { createFitmentsWorkflow } from "@/workflows/create-fitments";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            },
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  },
);

export default async function seedData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["tn"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container,
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "tnd",
          is_default: true,
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Tunisia",
          currency_code: "tnd",
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container,
  ).run({
    input: {
      locations: [
        {
          name: "Tunisia Warehouse",
          address: {
            city: "Tunis",
            country_code: "TN",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "Tunisia Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Tunisia",
        geo_zones: [
          {
            country_code: "tn",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "tnd",
            amount: 15,
          },
          {
            region_id: region.id,
            amount: 15,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          {
            currency_code: "tnd",
            amount: 30,
          },
          {
            region_id: region.id,
            amount: 30,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey: ApiKey | null = null;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: {
      type: "publishable",
    },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Webshop",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });

    publishableApiKey = publishableApiKeyResult as ApiKey;
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  // const { result: categoryResult } = await createProductCategoriesWorkflow(
  //   container,
  // ).run({
  //   input: {
  //     product_categories: categories,
  //   },
  // });

  // const products = getProducts({
  //   categoryResult,
  //   shippingProfileId: shippingProfile.id,
  //   defaultSalesChannelId: defaultSalesChannel[0].id,
  // });

  // const { result: productResults } = await createProductsWorkflow(container).run({
  //   input: {
  //     products: [
  //       {
  //         "title": "Rear Wheel Hub Bearing Assembly",
  //         "subtitle": "Hyundai / Kia Rear Hub Unit",
  //         "description": "Rear wheel hub bearing assembly. Genuine Hyundai/Kia OEM part 52750-F9100. Made in Korea. Fits various Hyundai and Kia models. Please verify compatibility using VIN before ordering.",
  //         "handle": "hyundai-kia-52750-f9100-rear-hub-bearing",
  //         "status": "published",
  //         "is_giftcard": false,
  //         "discountable": true,
  //         "options": [
  //           {
  //             "title": "Brand",
  //             "values": [
  //               "Hyundai / Kia OEM",
  //               "SKF",
  //               "FAG",
  //               "SNR",
  //               "MOOG",
  //               "Timken",
  //               "GSP",
  //               "Febest",
  //               "Iljin"
  //             ]
  //           }
  //         ],
  //         "variants": [
  //           {
  //             "title": "Hyundai / Kia OEM",
  //             "sku": "52750-F9100",
  //             "barcode": "52750F9100",
  //             "manage_inventory": true,
  //             "prices": [
  //               {
  //                 "currency_code": "usd",
  //                 "amount": 18900
  //               }
  //             ],
  //           },
  //           {
  //             "title": "SKF",
  //             "sku": "SKF-VKBA-7604",
  //             "manage_inventory": true,
  //             "prices": [
  //               {
  //                 "currency_code": "usd",
  //                 "amount": 14900
  //               }
  //             ],
  //           },
  //           {
  //             "title": "FAG",
  //             "sku": "FAG-713626530",
  //             "manage_inventory": true,
  //             "prices": [
  //               {
  //                 "currency_code": "usd",
  //                 "amount": 13900
  //               }
  //             ],

  //           },
  //           {
  //             "title": "SNR",
  //             "sku": "SNR-R184XX",
  //             "manage_inventory": true,
  //             "prices": [
  //               {
  //                 "currency_code": "usd",
  //                 "amount": 13500
  //               }
  //             ],

  //           },
  //           {
  //             "title": "MOOG",
  //             "sku": "MOOG-HY-WB-12158",
  //             "manage_inventory": true,
  //             "prices": [
  //               {
  //                 "currency_code": "usd",
  //                 "amount": 12900
  //               }
  //             ],

  //           },
  //           {
  //             "title": "Timken",
  //             "sku": "TIMKEN-HA590XXX",
  //             "manage_inventory": true,
  //             "prices": [
  //               {
  //                 "currency_code": "usd",
  //                 "amount": 15900
  //               }
  //             ],

  //           }
  //         ],
  //         "metadata": {
  //           "oem_part_number": "52750-F9100",
  //           "position": "Rear",
  //           "product_type": "Wheel Hub Bearing Assembly",
  //           "made_in": "Korea",
  //           "interchange_numbers": [
  //             "52750F9100",
  //             "52750-F9100"
  //           ]
  //         }
  //       },
  //       {
  //         "title": "Serpentine Drive Belt 6PK1255",
  //         "subtitle": "Hyundai / Kia OEM 25212-03050",
  //         "description": "Accessory drive belt (ribbed belt) OEM 25212-03050 for Hyundai and Kia vehicles. 6-rib serpentine belt approximately 1255mm length. Please verify compatibility by VIN before ordering.",
  //         "handle": "hyundai-kia-25212-03050-serpentine-belt",
  //         "status": "published",
  //         "discountable": true,
  //         "options": [
  //           {
  //             "title": "Brand",
  //             "values": [
  //               "Hyundai OEM",
  //               "Gates",
  //               "Continental",
  //               "Dayco",
  //               "Bosch",
  //               "Bando",
  //               "Mitsuboshi",
  //               "SKF"
  //             ]
  //           }
  //         ],
  //         "variants": [
  //           {
  //             "title": "Hyundai OEM",
  //             "sku": "25212-03050",
  //             "barcode": "2521203050",
  //             "manage_inventory": true,
  //             "prices": [
  //               { "currency_code": "usd", "amount": 4900 }
  //             ],

  //           },
  //           {
  //             "title": "Gates",
  //             "sku": "GATES-6PK1255",
  //             "manage_inventory": true,
  //             "prices": [
  //               { "currency_code": "usd", "amount": 3200 }
  //             ],

  //           },
  //           {
  //             "title": "Continental",
  //             "sku": "CONT-6PK1255",
  //             "manage_inventory": true,
  //             "prices": [
  //               { "currency_code": "usd", "amount": 3000 }
  //             ],

  //           },
  //           {
  //             "title": "Dayco",
  //             "sku": "DAYCO-6PK1255",
  //             "manage_inventory": true,
  //             "prices": [
  //               { "currency_code": "usd", "amount": 2800 }
  //             ],

  //           }
  //         ],
  //         "metadata": {
  //           "oem_part_number": "25212-03050",
  //           "belt_type": "Serpentine / Ribbed",
  //           "rib_count": 6,
  //           "length_mm": 1255,
  //           "product_type": "Accessory Drive Belt",
  //           "interchange_numbers": [
  //             "25212-03050",
  //             "2521203050",
  //             "6PK1255"
  //           ]
  //         }
  //       }
  //     ]
  //   },
  // });

  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels data.");

  logger.info("Seeding fitments");

  await createFitmentsWorkflow(container).run({
    input: {
      fitments: [
      ]
    }
  });

  logger.info("Finished seeding fitments");
}
