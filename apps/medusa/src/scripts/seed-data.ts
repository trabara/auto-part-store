import { ProductStatus } from "@medusajs/framework/utils";

export interface ProductCategory {
  name: string;
  is_active: boolean;
}

export const categories: ProductCategory[] = [
  {
    name: "Engine Parts",
    is_active: true,
  },
  {
    name: "Brake System",
    is_active: true,
  },
  {
    name: "Suspension",
    is_active: true,
  },
  {
    name: "Body Parts",
    is_active: true,
  },
  {
    name: "Electrical",
    is_active: true,
  },
  {
    name: "Filters & Fluids",
    is_active: true,
  },
  {
    name: "Cooling System",
    is_active: true,
  },
  {
    name: "Exhaust System",
    is_active: true,
  },
  {
    name: "Interior",
    is_active: true,
  },
  {
    name: "Transmission",
    is_active: true,
  },
  {
    name: "Steering",
    is_active: true,
  },
  {
    name: "Wheels & Tires",
    is_active: true,
  },
];

export const getProducts = (params: {
  categoryResult: any[];
  shippingProfileId: string;
  defaultSalesChannelId: string;
}) => {
  const { categoryResult, shippingProfileId, defaultSalesChannelId } = params;

  return [
    // HYUNDAI PRODUCTS
    {
      title: "Hyundai Elantra Front Brake Pads 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Brake System")!.id,
      ],
      description:
        "High-quality ceramic brake pads for Hyundai Elantra. Low dust, quiet operation, and superior stopping power. Compatible with 2017-2023 models.",
      handle: "hyundai-elantra-brake-pads",
      weight: 2200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Hyundai+Brake+Pads",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Ceramic", "Semi-Metallic"],
        },
      ],
      variants: [
        {
          title: "Ceramic",
          sku: "HYU-ELAN-BP-CER",
          options: {
            Type: "Ceramic",
          },
          prices: [
            {
              amount: 12000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Semi-Metallic",
          sku: "HYU-ELAN-BP-MET",
          options: {
            Type: "Semi-Metallic",
          },
          prices: [
            {
              amount: 9500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    // SUZUKI PRODUCTS
    {
      title: "Suzuki Swift Air Filter 2010-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Filters & Fluids")!.id,
      ],
      description:
        "Premium engine air filter for Suzuki Swift. Improves engine performance and fuel efficiency. Easy installation, washable and reusable.",
      handle: "suzuki-swift-air-filter",
      weight: 350,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/E74C3C/FFFFFF?text=Suzuki+Air+Filter",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard", "High-Performance"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "SUZ-SWI-AF-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 4500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "High-Performance",
          sku: "SUZ-SWI-AF-HP",
          options: {
            Type: "High-Performance",
          },
          prices: [
            {
              amount: 7800,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    // KIA PRODUCTS
    {
      title: "Kia Sportage Shock Absorbers Set 2016-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Suspension")!.id,
      ],
      description:
        "Premium shock absorbers for Kia Sportage. Provides smooth ride and excellent handling. Set of 4 (front and rear).",
      handle: "kia-sportage-shock-absorbers",
      weight: 8500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/27AE60/FFFFFF?text=Kia+Shock+Absorbers",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Pair", "Rear Pair", "Complete Set"],
        },
      ],
      variants: [
        {
          title: "Front Pair",
          sku: "KIA-SPO-SHOCK-FRT",
          options: {
            Position: "Front Pair",
          },
          prices: [
            {
              amount: 28000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Pair",
          sku: "KIA-SPO-SHOCK-REAR",
          options: {
            Position: "Rear Pair",
          },
          prices: [
            {
              amount: 26000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Complete Set",
          sku: "KIA-SPO-SHOCK-SET",
          options: {
            Position: "Complete Set",
          },
          prices: [
            {
              amount: 50000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Tucson Headlight Assembly 2019-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Electrical")!.id,
      ],
      description:
        "OEM-quality LED headlight assembly for Hyundai Tucson. Plug-and-play installation with superior illumination and modern design.",
      handle: "hyundai-tucson-headlight",
      weight: 3200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/F39C12/FFFFFF?text=Hyundai+Headlight",
        },
      ],
      options: [
        {
          title: "Side",
          values: ["Left", "Right", "Pair"],
        },
      ],
      variants: [
        {
          title: "Left",
          sku: "HYU-TUC-HL-LEFT",
          options: {
            Side: "Left",
          },
          prices: [
            {
              amount: 45000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Right",
          sku: "HYU-TUC-HL-RIGHT",
          options: {
            Side: "Right",
          },
          prices: [
            {
              amount: 45000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Pair",
          sku: "HYU-TUC-HL-PAIR",
          options: {
            Side: "Pair",
          },
          prices: [
            {
              amount: 85000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Vitara Oil Filter & Engine Oil Package",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Filters & Fluids")!.id,
      ],
      description:
        "Complete oil change package for Suzuki Vitara. Includes premium synthetic oil (5W-30, 4L) and OEM oil filter. Perfect for regular maintenance.",
      handle: "suzuki-vitara-oil-package",
      weight: 4500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/8E44AD/FFFFFF?text=Suzuki+Oil+Package",
        },
      ],
      options: [
        {
          title: "Oil Type",
          values: ["Synthetic 5W-30", "Semi-Synthetic 10W-40"],
        },
      ],
      variants: [
        {
          title: "Synthetic 5W-30",
          sku: "SUZ-VIT-OIL-5W30",
          options: {
            "Oil Type": "Synthetic 5W-30",
          },
          prices: [
            {
              amount: 15000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Semi-Synthetic 10W-40",
          sku: "SUZ-VIT-OIL-10W40",
          options: {
            "Oil Type": "Semi-Synthetic 10W-40",
          },
          prices: [
            {
              amount: 12000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Picanto Front Bumper 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Body Parts")!.id,
      ],
      description:
        "High-quality replacement front bumper for Kia Picanto. Perfect fit with OEM specifications. Unpainted, ready for custom color matching.",
      handle: "kia-picanto-front-bumper",
      weight: 6800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/2ECC71/FFFFFF?text=Kia+Front+Bumper",
        },
      ],
      options: [
        {
          title: "Finish",
          values: ["Unpainted", "Primed"],
        },
      ],
      variants: [
        {
          title: "Unpainted",
          sku: "KIA-PIC-FB-UNPAINT",
          options: {
            Finish: "Unpainted",
          },
          prices: [
            {
              amount: 32000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Primed",
          sku: "KIA-PIC-FB-PRIMED",
          options: {
            Finish: "Primed",
          },
          prices: [
            {
              amount: 38000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai i20 Timing Belt Kit 2014-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Engine Parts")!.id,
      ],
      description:
        "Complete timing belt kit for Hyundai i20. Includes timing belt, tensioner, and water pump. Essential for engine maintenance at recommended intervals.",
      handle: "hyundai-i20-timing-belt-kit",
      weight: 2800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/3498DB/FFFFFF?text=Hyundai+Timing+Belt",
        },
      ],
      options: [
        {
          title: "Package",
          values: ["Belt Only", "Complete Kit"],
        },
      ],
      variants: [
        {
          title: "Belt Only",
          sku: "HYU-I20-TB-BELT",
          options: {
            Package: "Belt Only",
          },
          prices: [
            {
              amount: 8500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Complete Kit",
          sku: "HYU-I20-TB-KIT",
          options: {
            Package: "Complete Kit",
          },
          prices: [
            {
              amount: 25000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Alto Spark Plugs Set 2009-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Engine Parts")!.id,
      ],
      description:
        "Premium iridium spark plugs for Suzuki Alto. Set of 4. Improves fuel efficiency and engine performance. Long-lasting up to 100,000 km.",
      handle: "suzuki-alto-spark-plugs",
      weight: 250,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/E67E22/FFFFFF?text=Suzuki+Spark+Plugs",
        },
      ],
      options: [
        {
          title: "Material",
          values: ["Copper", "Iridium"],
        },
      ],
      variants: [
        {
          title: "Copper",
          sku: "SUZ-ALT-SP-COP",
          options: {
            Material: "Copper",
          },
          prices: [
            {
              amount: 3500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Iridium",
          sku: "SUZ-ALT-SP-IRID",
          options: {
            Material: "Iridium",
          },
          prices: [
            {
              amount: 8500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Rio Side Mirror Assembly 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Body Parts")!.id,
      ],
      description:
        "Complete side mirror assembly for Kia Rio with electric adjustment and integrated turn signal. Available for left or right side.",
      handle: "kia-rio-side-mirror",
      weight: 1200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/1ABC9C/FFFFFF?text=Kia+Side+Mirror",
        },
      ],
      options: [
        {
          title: "Side",
          values: ["Left", "Right"],
        },
        {
          title: "Features",
          values: ["Standard", "With Heating"],
        },
      ],
      variants: [
        {
          title: "Left / Standard",
          sku: "KIA-RIO-MIR-L-STD",
          options: {
            Side: "Left",
            Features: "Standard",
          },
          prices: [
            {
              amount: 18000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Left / With Heating",
          sku: "KIA-RIO-MIR-L-HEAT",
          options: {
            Side: "Left",
            Features: "With Heating",
          },
          prices: [
            {
              amount: 22000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Right / Standard",
          sku: "KIA-RIO-MIR-R-STD",
          options: {
            Side: "Right",
            Features: "Standard",
          },
          prices: [
            {
              amount: 18000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Right / With Heating",
          sku: "KIA-RIO-MIR-R-HEAT",
          options: {
            Side: "Right",
            Features: "With Heating",
          },
          prices: [
            {
              amount: 22000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Accent Brake Disc Rotors 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Brake System")!.id,
      ],
      description:
        "High-performance ventilated brake disc rotors for Hyundai Accent. Enhanced heat dissipation and superior braking performance. Sold as a pair.",
      handle: "hyundai-accent-brake-rotors",
      weight: 9500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/95A5A6/FFFFFF?text=Hyundai+Brake+Rotors",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front", "Rear"],
        },
        {
          title: "Type",
          values: ["Standard", "Drilled & Slotted"],
        },
      ],
      variants: [
        {
          title: "Front / Standard",
          sku: "HYU-ACC-ROT-F-STD",
          options: {
            Position: "Front",
            Type: "Standard",
          },
          prices: [
            {
              amount: 16000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Front / Drilled & Slotted",
          sku: "HYU-ACC-ROT-F-DS",
          options: {
            Position: "Front",
            Type: "Drilled & Slotted",
          },
          prices: [
            {
              amount: 24000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear / Standard",
          sku: "HYU-ACC-ROT-R-STD",
          options: {
            Position: "Rear",
            Type: "Standard",
          },
          prices: [
            {
              amount: 14000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear / Drilled & Slotted",
          sku: "HYU-ACC-ROT-R-DS",
          options: {
            Position: "Rear",
            Type: "Drilled & Slotted",
          },
          prices: [
            {
              amount: 22000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    // MORE HYUNDAI PRODUCTS
    {
      title: "Hyundai Sonata Alternator 2015-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Electrical")!.id,
      ],
      description:
        "High-output alternator for Hyundai Sonata. 120A output, direct replacement. Includes voltage regulator and bearings.",
      handle: "hyundai-sonata-alternator",
      weight: 5500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/34495E/FFFFFF?text=Hyundai+Alternator",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["120A"],
        },
      ],
      variants: [
        {
          title: "120A",
          sku: "HYU-SON-ALT-120",
          options: {
            Type: "120A",
          },
          prices: [
            {
              amount: 38000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Santa Fe Radiator 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Cooling System")!.id,
      ],
      description:
        "Aluminum core radiator for Hyundai Santa Fe. Enhanced cooling efficiency with dual core design. Includes drain plug.",
      handle: "hyundai-santa-fe-radiator",
      weight: 7200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/16A085/FFFFFF?text=Hyundai+Radiator",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "HYU-SAF-RAD-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 42000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai i10 Clutch Kit 2014-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Transmission")!.id,
      ],
      description:
        "Complete clutch kit for Hyundai i10. Includes clutch disc, pressure plate, and release bearing. OEM quality.",
      handle: "hyundai-i10-clutch-kit",
      weight: 6800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/C0392B/FFFFFF?text=Hyundai+Clutch",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Complete Kit"],
        },
      ],
      variants: [
        {
          title: "Complete Kit",
          sku: "HYU-I10-CLU-KIT",
          options: {
            Type: "Complete Kit",
          },
          prices: [
            {
              amount: 28000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Creta Front Grille 2020-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Body Parts")!.id,
      ],
      description:
        "Chrome front grille for Hyundai Creta. Direct replacement with premium finish. Easy installation with all mounting clips included.",
      handle: "hyundai-creta-front-grille",
      weight: 2100,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/7F8C8D/FFFFFF?text=Hyundai+Grille",
        },
      ],
      options: [
        {
          title: "Finish",
          values: ["Chrome", "Black"],
        },
      ],
      variants: [
        {
          title: "Chrome",
          sku: "HYU-CRE-GRL-CHR",
          options: {
            Finish: "Chrome",
          },
          prices: [
            {
              amount: 25000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Black",
          sku: "HYU-CRE-GRL-BLK",
          options: {
            Finish: "Black",
          },
          prices: [
            {
              amount: 23000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Venue Cabin Air Filter 2019-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Filters & Fluids")!.id,
      ],
      description:
        "HEPA cabin air filter for Hyundai Venue. Filters dust, pollen, and odors. Improves air quality inside the vehicle.",
      handle: "hyundai-venue-cabin-filter",
      weight: 280,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/2980B9/FFFFFF?text=Hyundai+Cabin+Filter",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "HYU-VEN-CAB-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 3800,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Elantra Steering Rack 2016-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Steering")!.id,
      ],
      description:
        "Power steering rack for Hyundai Elantra. Hydraulic system with smooth operation. Complete assembly ready to install.",
      handle: "hyundai-elantra-steering-rack",
      weight: 12500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/8E44AD/FFFFFF?text=Hyundai+Steering",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Complete Assembly"],
        },
      ],
      variants: [
        {
          title: "Complete Assembly",
          sku: "HYU-ELA-STR-RACK",
          options: {
            Type: "Complete Assembly",
          },
          prices: [
            {
              amount: 95000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Tucson Catalytic Converter 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Exhaust System")!.id,
      ],
      description:
        "OEM catalytic converter for Hyundai Tucson. Meets emission standards with high-efficiency ceramic substrate.",
      handle: "hyundai-tucson-catalytic-converter",
      weight: 8900,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/D35400/FFFFFF?text=Hyundai+Catalytic",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "HYU-TUC-CAT-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 125000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai i30 Fuel Pump Assembly 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Engine Parts")!.id,
      ],
      description:
        "Electric fuel pump assembly for Hyundai i30. Includes fuel level sensor and strainer. High-pressure design for optimal performance.",
      handle: "hyundai-i30-fuel-pump",
      weight: 1800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/E74C3C/FFFFFF?text=Hyundai+Fuel+Pump",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Complete Assembly"],
        },
      ],
      variants: [
        {
          title: "Complete Assembly",
          sku: "HYU-I30-FP-ASM",
          options: {
            Type: "Complete Assembly",
          },
          prices: [
            {
              amount: 32000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Kona Battery 12V 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Electrical")!.id,
      ],
      description:
        "Premium 12V car battery for Hyundai Kona. 70Ah capacity with 650 CCA. Maintenance-free with 2-year warranty.",
      handle: "hyundai-kona-battery",
      weight: 15000,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/2C3E50/FFFFFF?text=Hyundai+Battery",
        },
      ],
      options: [
        {
          title: "Capacity",
          values: ["60Ah", "70Ah"],
        },
      ],
      variants: [
        {
          title: "60Ah",
          sku: "HYU-KON-BAT-60",
          options: {
            Capacity: "60Ah",
          },
          prices: [
            {
              amount: 35000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "70Ah",
          sku: "HYU-KON-BAT-70",
          options: {
            Capacity: "70Ah",
          },
          prices: [
            {
              amount: 42000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Accent Door Handle Set 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Body Parts")!.id,
      ],
      description:
        "Exterior door handle for Hyundai Accent. Chrome finish with smooth operation. Available for all four doors.",
      handle: "hyundai-accent-door-handle",
      weight: 450,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/95A5A6/FFFFFF?text=Hyundai+Door+Handle",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Left", "Front Right", "Rear Left", "Rear Right"],
        },
      ],
      variants: [
        {
          title: "Front Left",
          sku: "HYU-ACC-DH-FL",
          options: {
            Position: "Front Left",
          },
          prices: [
            {
              amount: 6500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Front Right",
          sku: "HYU-ACC-DH-FR",
          options: {
            Position: "Front Right",
          },
          prices: [
            {
              amount: 6500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Left",
          sku: "HYU-ACC-DH-RL",
          options: {
            Position: "Rear Left",
          },
          prices: [
            {
              amount: 6000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Right",
          sku: "HYU-ACC-DH-RR",
          options: {
            Position: "Rear Right",
          },
          prices: [
            {
              amount: 6000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    // MORE KIA PRODUCTS
    {
      title: "Kia Sportage Oxygen Sensor 2016-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Electrical")!.id,
      ],
      description:
        "O2 sensor for Kia Sportage. Monitors exhaust gases for optimal fuel efficiency. Direct OEM replacement.",
      handle: "kia-sportage-oxygen-sensor",
      weight: 350,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/27AE60/FFFFFF?text=Kia+O2+Sensor",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Upstream", "Downstream"],
        },
      ],
      variants: [
        {
          title: "Upstream",
          sku: "KIA-SPO-O2-UP",
          options: {
            Position: "Upstream",
          },
          prices: [
            {
              amount: 15000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Downstream",
          sku: "KIA-SPO-O2-DOWN",
          options: {
            Position: "Downstream",
          },
          prices: [
            {
              amount: 14000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Cerato CV Joint Kit 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Transmission")!.id,
      ],
      description:
        "CV joint kit for Kia Cerato. Includes boots, clamps, and grease. Smooth power transfer with reduced vibration.",
      handle: "kia-cerato-cv-joint",
      weight: 3200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/2ECC71/FFFFFF?text=Kia+CV+Joint",
        },
      ],
      options: [
        {
          title: "Side",
          values: ["Left", "Right"],
        },
      ],
      variants: [
        {
          title: "Left",
          sku: "KIA-CER-CV-LEFT",
          options: {
            Side: "Left",
          },
          prices: [
            {
              amount: 18500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Right",
          sku: "KIA-CER-CV-RIGHT",
          options: {
            Side: "Right",
          },
          prices: [
            {
              amount: 18500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Sorento Wheel Bearings 2016-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Wheels & Tires")!.id,
      ],
      description:
        "Front wheel bearing hub assembly for Kia Sorento. Pre-greased and sealed for long life. Includes ABS sensor.",
      handle: "kia-sorento-wheel-bearing",
      weight: 2800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/3498DB/FFFFFF?text=Kia+Wheel+Bearing",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Left", "Front Right", "Rear Left", "Rear Right"],
        },
      ],
      variants: [
        {
          title: "Front Left",
          sku: "KIA-SOR-WB-FL",
          options: {
            Position: "Front Left",
          },
          prices: [
            {
              amount: 22000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Front Right",
          sku: "KIA-SOR-WB-FR",
          options: {
            Position: "Front Right",
          },
          prices: [
            {
              amount: 22000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Left",
          sku: "KIA-SOR-WB-RL",
          options: {
            Position: "Rear Left",
          },
          prices: [
            {
              amount: 20000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Right",
          sku: "KIA-SOR-WB-RR",
          options: {
            Position: "Rear Right",
          },
          prices: [
            {
              amount: 20000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Optima Starter Motor 2016-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Electrical")!.id,
      ],
      description:
        "High-torque starter motor for Kia Optima. Reliable starting in all weather conditions. Remanufactured with warranty.",
      handle: "kia-optima-starter",
      weight: 4200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/E67E22/FFFFFF?text=Kia+Starter",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "KIA-OPT-STR-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 42000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Seltos Tail Light Assembly 2020-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Electrical")!.id,
      ],
      description:
        "LED tail light assembly for Kia Seltos. Bright illumination with modern design. Direct plug-and-play replacement.",
      handle: "kia-seltos-tail-light",
      weight: 1800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/C0392B/FFFFFF?text=Kia+Tail+Light",
        },
      ],
      options: [
        {
          title: "Side",
          values: ["Left", "Right"],
        },
      ],
      variants: [
        {
          title: "Left",
          sku: "KIA-SEL-TL-LEFT",
          options: {
            Side: "Left",
          },
          prices: [
            {
              amount: 28000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Right",
          sku: "KIA-SEL-TL-RIGHT",
          options: {
            Side: "Right",
          },
          prices: [
            {
              amount: 28000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Picanto Windshield Wiper Blades 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Body Parts")!.id,
      ],
      description:
        "Premium silicone wiper blades for Kia Picanto. All-season performance with streak-free wiping. Set includes driver and passenger side.",
      handle: "kia-picanto-wiper-blades",
      weight: 420,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/1ABC9C/FFFFFF?text=Kia+Wipers",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Set of 2"],
        },
      ],
      variants: [
        {
          title: "Set of 2",
          sku: "KIA-PIC-WIP-SET",
          options: {
            Type: "Set of 2",
          },
          prices: [
            {
              amount: 4500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Sportage Control Arm 2016-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Suspension")!.id,
      ],
      description:
        "Lower control arm for Kia Sportage. Includes ball joint and bushings. Heavy-duty construction for stability.",
      handle: "kia-sportage-control-arm",
      weight: 5500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/9B59B6/FFFFFF?text=Kia+Control+Arm",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Left", "Front Right"],
        },
      ],
      variants: [
        {
          title: "Front Left",
          sku: "KIA-SPO-CA-FL",
          options: {
            Position: "Front Left",
          },
          prices: [
            {
              amount: 24000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Front Right",
          sku: "KIA-SPO-CA-FR",
          options: {
            Position: "Front Right",
          },
          prices: [
            {
              amount: 24000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Rio Thermostat Housing 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Cooling System")!.id,
      ],
      description:
        "Thermostat housing assembly for Kia Rio. Includes thermostat and gasket. Prevents overheating and maintains optimal temperature.",
      handle: "kia-rio-thermostat",
      weight: 850,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/16A085/FFFFFF?text=Kia+Thermostat",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Complete Assembly"],
        },
      ],
      variants: [
        {
          title: "Complete Assembly",
          sku: "KIA-RIO-THRM-ASM",
          options: {
            Type: "Complete Assembly",
          },
          prices: [
            {
              amount: 12500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Stonic Hood 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Body Parts")!.id,
      ],
      description:
        "Front hood panel for Kia Stonic. Steel construction with corrosion-resistant coating. Unpainted, ready for color matching.",
      handle: "kia-stonic-hood",
      weight: 11500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/34495E/FFFFFF?text=Kia+Hood",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Unpainted"],
        },
      ],
      variants: [
        {
          title: "Unpainted",
          sku: "KIA-STO-HOOD-UP",
          options: {
            Type: "Unpainted",
          },
          prices: [
            {
              amount: 55000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Carnival Tie Rod End 2015-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Steering")!.id,
      ],
      description:
        "Outer tie rod end for Kia Carnival. Precision steering response with durable ball joint. Includes dust boot.",
      handle: "kia-carnival-tie-rod",
      weight: 680,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/D35400/FFFFFF?text=Kia+Tie+Rod",
        },
      ],
      options: [
        {
          title: "Side",
          values: ["Left", "Right"],
        },
      ],
      variants: [
        {
          title: "Left",
          sku: "KIA-CAR-TR-LEFT",
          options: {
            Side: "Left",
          },
          prices: [
            {
              amount: 8500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Right",
          sku: "KIA-CAR-TR-RIGHT",
          options: {
            Side: "Right",
          },
          prices: [
            {
              amount: 8500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    // MORE SUZUKI PRODUCTS
    {
      title: "Suzuki Vitara Brake Caliper 2015-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Brake System")!.id,
      ],
      description:
        "Front brake caliper for Suzuki Vitara. Remanufactured with new seals and hardware. Tested for proper operation.",
      handle: "suzuki-vitara-brake-caliper",
      weight: 4500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/E74C3C/FFFFFF?text=Suzuki+Caliper",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Left", "Front Right"],
        },
      ],
      variants: [
        {
          title: "Front Left",
          sku: "SUZ-VIT-CAL-FL",
          options: {
            Position: "Front Left",
          },
          prices: [
            {
              amount: 28000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Front Right",
          sku: "SUZ-VIT-CAL-FR",
          options: {
            Position: "Front Right",
          },
          prices: [
            {
              amount: 28000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Swift Fuel Filter 2010-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Filters & Fluids")!.id,
      ],
      description:
        "In-line fuel filter for Suzuki Swift. Protects fuel injectors from contaminants. Easy replacement every 20,000 km.",
      handle: "suzuki-swift-fuel-filter",
      weight: 280,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/F39C12/FFFFFF?text=Suzuki+Fuel+Filter",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "SUZ-SWI-FF-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 2800,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Baleno Water Pump 2016-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Cooling System")!.id,
      ],
      description:
        "Engine water pump for Suzuki Baleno. High-flow impeller design with sealed bearing. Includes gasket.",
      handle: "suzuki-baleno-water-pump",
      weight: 1800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/3498DB/FFFFFF?text=Suzuki+Water+Pump",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "SUZ-BAL-WP-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 18000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Jimny Front Fender 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Body Parts")!.id,
      ],
      description:
        "Front fender panel for Suzuki Jimny. Rust-resistant steel construction. Perfect fit with factory mounting points.",
      handle: "suzuki-jimny-front-fender",
      weight: 7200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/27AE60/FFFFFF?text=Suzuki+Fender",
        },
      ],
      options: [
        {
          title: "Side",
          values: ["Left", "Right"],
        },
      ],
      variants: [
        {
          title: "Left",
          sku: "SUZ-JIM-FEN-LEFT",
          options: {
            Side: "Left",
          },
          prices: [
            {
              amount: 38000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Right",
          sku: "SUZ-JIM-FEN-RIGHT",
          options: {
            Side: "Right",
          },
          prices: [
            {
              amount: 38000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Ciaz Exhaust Muffler 2014-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Exhaust System")!.id,
      ],
      description:
        "Rear exhaust muffler for Suzuki Ciaz. Stainless steel construction for durability. Reduces noise and emissions.",
      handle: "suzuki-ciaz-exhaust-muffler",
      weight: 6800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/95A5A6/FFFFFF?text=Suzuki+Muffler",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "SUZ-CIA-MUF-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 32000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Ertiga Coil Springs 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Suspension")!.id,
      ],
      description:
        "Front coil springs for Suzuki Ertiga. Heavy-duty design for better load capacity. Sold as a pair.",
      handle: "suzuki-ertiga-coil-springs",
      weight: 5500,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/2980B9/FFFFFF?text=Suzuki+Springs",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Pair", "Rear Pair"],
        },
      ],
      variants: [
        {
          title: "Front Pair",
          sku: "SUZ-ERT-SPR-FRT",
          options: {
            Position: "Front Pair",
          },
          prices: [
            {
              amount: 16000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Pair",
          sku: "SUZ-ERT-SPR-REAR",
          options: {
            Position: "Rear Pair",
          },
          prices: [
            {
              amount: 14000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Dzire Transmission Oil Cooler 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Cooling System")!.id,
      ],
      description:
        "Automatic transmission oil cooler for Suzuki Dzire. Extends transmission life by maintaining optimal temperature.",
      handle: "suzuki-dzire-transmission-cooler",
      weight: 2200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/8E44AD/FFFFFF?text=Suzuki+Trans+Cooler",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "SUZ-DZI-TC-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 22000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Celerio Ignition Coil Pack 2014-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Electrical")!.id,
      ],
      description:
        "Ignition coil pack for Suzuki Celerio. High-energy output for reliable spark. Set of 4 coils for complete replacement.",
      handle: "suzuki-celerio-ignition-coil",
      weight: 1200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/C0392B/FFFFFF?text=Suzuki+Ignition+Coil",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Set of 4"],
        },
      ],
      variants: [
        {
          title: "Set of 4",
          sku: "SUZ-CEL-IC-SET4",
          options: {
            Type: "Set of 4",
          },
          prices: [
            {
              amount: 18000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Wagon R Clutch Master Cylinder 2012-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Transmission")!.id,
      ],
      description:
        "Clutch master cylinder for Suzuki Wagon R. Smooth clutch engagement with quality seals. Includes reservoir.",
      handle: "suzuki-wagon-r-clutch-master",
      weight: 850,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/E67E22/FFFFFF?text=Suzuki+Clutch+Master",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Complete Assembly"],
        },
      ],
      variants: [
        {
          title: "Complete Assembly",
          sku: "SUZ-WAG-CM-ASM",
          options: {
            Type: "Complete Assembly",
          },
          prices: [
            {
              amount: 12000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki S-Presso Door Lock Actuator 2019-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Interior")!.id,
      ],
      description:
        "Power door lock actuator for Suzuki S-Presso. Reliable locking mechanism with quiet operation.",
      handle: "suzuki-s-presso-door-actuator",
      weight: 420,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/1ABC9C/FFFFFF?text=Suzuki+Actuator",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Left", "Front Right", "Rear Left", "Rear Right"],
        },
      ],
      variants: [
        {
          title: "Front Left",
          sku: "SUZ-SPR-ACT-FL",
          options: {
            Position: "Front Left",
          },
          prices: [
            {
              amount: 8500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Front Right",
          sku: "SUZ-SPR-ACT-FR",
          options: {
            Position: "Front Right",
          },
          prices: [
            {
              amount: 8500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Left",
          sku: "SUZ-SPR-ACT-RL",
          options: {
            Position: "Rear Left",
          },
          prices: [
            {
              amount: 7500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Right",
          sku: "SUZ-SPR-ACT-RR",
          options: {
            Position: "Rear Right",
          },
          prices: [
            {
              amount: 7500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    // ADDITIONAL COMPREHENSIVE PRODUCTS
    {
      title: "Universal Engine Oil 5W-30 Full Synthetic 5L",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Filters & Fluids")!.id,
      ],
      description:
        "Premium full synthetic engine oil 5W-30. Compatible with most Hyundai, Kia, and Suzuki models. Excellent protection and fuel economy.",
      handle: "universal-engine-oil-5w30",
      weight: 5000,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/2C3E50/FFFFFF?text=Engine+Oil",
        },
      ],
      options: [
        {
          title: "Volume",
          values: ["1L", "4L", "5L"],
        },
      ],
      variants: [
        {
          title: "1L",
          sku: "UNV-OIL-5W30-1L",
          options: {
            Volume: "1L",
          },
          prices: [
            {
              amount: 3500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "4L",
          sku: "UNV-OIL-5W30-4L",
          options: {
            Volume: "4L",
          },
          prices: [
            {
              amount: 12000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "5L",
          sku: "UNV-OIL-5W30-5L",
          options: {
            Volume: "5L",
          },
          prices: [
            {
              amount: 14500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Universal Brake Fluid DOT 4 1L",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Filters & Fluids")!.id,
      ],
      description:
        "High-performance DOT 4 brake fluid. Suitable for all disc and drum brake systems. High boiling point for safe braking.",
      handle: "universal-brake-fluid-dot4",
      weight: 1100,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/E74C3C/FFFFFF?text=Brake+Fluid",
        },
      ],
      options: [
        {
          title: "Size",
          values: ["1L"],
        },
      ],
      variants: [
        {
          title: "1L",
          sku: "UNV-BF-DOT4-1L",
          options: {
            Size: "1L",
          },
          prices: [
            {
              amount: 2800,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Universal Coolant Antifreeze 50/50 Mix 4L",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Filters & Fluids")!.id,
      ],
      description:
        "Pre-mixed 50/50 coolant antifreeze. Protects against freezing and overheating. Compatible with all Asian vehicles.",
      handle: "universal-coolant-antifreeze",
      weight: 4200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/27AE60/FFFFFF?text=Coolant",
        },
      ],
      options: [
        {
          title: "Volume",
          values: ["1L", "4L"],
        },
      ],
      variants: [
        {
          title: "1L",
          sku: "UNV-COOL-1L",
          options: {
            Volume: "1L",
          },
          prices: [
            {
              amount: 2200,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "4L",
          sku: "UNV-COOL-4L",
          options: {
            Volume: "4L",
          },
          prices: [
            {
              amount: 8000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Elantra Window Regulator 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Interior")!.id,
      ],
      description:
        "Power window regulator for Hyundai Elantra. Includes motor for smooth operation. Direct replacement with OEM quality.",
      handle: "hyundai-elantra-window-regulator",
      weight: 2800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/34495E/FFFFFF?text=Window+Regulator",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Left", "Front Right", "Rear Left", "Rear Right"],
        },
      ],
      variants: [
        {
          title: "Front Left",
          sku: "HYU-ELA-WR-FL",
          options: {
            Position: "Front Left",
          },
          prices: [
            {
              amount: 18000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Front Right",
          sku: "HYU-ELA-WR-FR",
          options: {
            Position: "Front Right",
          },
          prices: [
            {
              amount: 18000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Left",
          sku: "HYU-ELA-WR-RL",
          options: {
            Position: "Rear Left",
          },
          prices: [
            {
              amount: 16000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Right",
          sku: "HYU-ELA-WR-RR",
          options: {
            Position: "Rear Right",
          },
          prices: [
            {
              amount: 16000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Sportage Engine Mount Set 2016-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Engine Parts")!.id,
      ],
      description:
        "Complete engine mount set for Kia Sportage. Reduces vibration and noise. Hydraulic design for better dampening. Set of 3.",
      handle: "kia-sportage-engine-mount",
      weight: 4800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/9B59B6/FFFFFF?text=Engine+Mount",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Complete Set"],
        },
      ],
      variants: [
        {
          title: "Complete Set",
          sku: "KIA-SPO-EM-SET",
          options: {
            Type: "Complete Set",
          },
          prices: [
            {
              amount: 35000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Swift Transmission Mount 2010-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Transmission")!.id,
      ],
      description:
        "Transmission mount for Suzuki Swift. Reduces drivetrain vibration. Rubber construction with metal bracket.",
      handle: "suzuki-swift-transmission-mount",
      weight: 1200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/D35400/FFFFFF?text=Trans+Mount",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Standard"],
        },
      ],
      variants: [
        {
          title: "Standard",
          sku: "SUZ-SWI-TM-STD",
          options: {
            Type: "Standard",
          },
          prices: [
            {
              amount: 8500,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Tucson Cabin Heater Blower Motor 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Interior")!.id,
      ],
      description:
        "HVAC blower motor for Hyundai Tucson. Quiet operation with high airflow. Includes fan cage and resistor.",
      handle: "hyundai-tucson-blower-motor",
      weight: 1800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/16A085/FFFFFF?text=Blower+Motor",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Complete Assembly"],
        },
      ],
      variants: [
        {
          title: "Complete Assembly",
          sku: "HYU-TUC-BM-ASM",
          options: {
            Type: "Complete Assembly",
          },
          prices: [
            {
              amount: 22000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Rio ABS Sensor 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Brake System")!.id,
      ],
      description:
        "ABS wheel speed sensor for Kia Rio. Accurate signal transmission for anti-lock brake system. Easy plug-and-play installation.",
      handle: "kia-rio-abs-sensor",
      weight: 180,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/3498DB/FFFFFF?text=ABS+Sensor",
        },
      ],
      options: [
        {
          title: "Position",
          values: ["Front Left", "Front Right", "Rear Left", "Rear Right"],
        },
      ],
      variants: [
        {
          title: "Front Left",
          sku: "KIA-RIO-ABS-FL",
          options: {
            Position: "Front Left",
          },
          prices: [
            {
              amount: 6500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Front Right",
          sku: "KIA-RIO-ABS-FR",
          options: {
            Position: "Front Right",
          },
          prices: [
            {
              amount: 6500,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Left",
          sku: "KIA-RIO-ABS-RL",
          options: {
            Position: "Rear Left",
          },
          prices: [
            {
              amount: 6000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Rear Right",
          sku: "KIA-RIO-ABS-RR",
          options: {
            Position: "Rear Right",
          },
          prices: [
            {
              amount: 6000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Suzuki Vitara Power Steering Pump 2015-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Steering")!.id,
      ],
      description:
        "Hydraulic power steering pump for Suzuki Vitara. Smooth steering with reduced effort. Remanufactured with new seals.",
      handle: "suzuki-vitara-power-steering-pump",
      weight: 3800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/E67E22/FFFFFF?text=Power+Steering",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Remanufactured"],
        },
      ],
      variants: [
        {
          title: "Remanufactured",
          sku: "SUZ-VIT-PSP-REMAN",
          options: {
            Type: "Remanufactured",
          },
          prices: [
            {
              amount: 45000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Hyundai Accent Rear Bumper 2018-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Body Parts")!.id,
      ],
      description:
        "Rear bumper cover for Hyundai Accent. Impact-resistant plastic with primer coating. Includes mounting brackets.",
      handle: "hyundai-accent-rear-bumper",
      weight: 5800,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/C0392B/FFFFFF?text=Rear+Bumper",
        },
      ],
      options: [
        {
          title: "Finish",
          values: ["Primed", "Textured Black"],
        },
      ],
      variants: [
        {
          title: "Primed",
          sku: "HYU-ACC-RB-PRM",
          options: {
            Finish: "Primed",
          },
          prices: [
            {
              amount: 28000,
              currency_code: "tnd",
            },
          ],
        },
        {
          title: "Textured Black",
          sku: "HYU-ACC-RB-BLK",
          options: {
            Finish: "Textured Black",
          },
          prices: [
            {
              amount: 25000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
    {
      title: "Kia Picanto Timing Chain Kit 2017-2023",
      category_ids: [
        categoryResult.find((cat) => cat.name === "Engine Parts")!.id,
      ],
      description:
        "Complete timing chain kit for Kia Picanto. Includes chain, tensioner, and guides. Essential for engine reliability.",
      handle: "kia-picanto-timing-chain",
      weight: 3200,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      images: [
        {
          url: "https://via.placeholder.com/800x600/1ABC9C/FFFFFF?text=Timing+Chain",
        },
      ],
      options: [
        {
          title: "Type",
          values: ["Complete Kit"],
        },
      ],
      variants: [
        {
          title: "Complete Kit",
          sku: "KIA-PIC-TC-KIT",
          options: {
            Type: "Complete Kit",
          },
          prices: [
            {
              amount: 28000,
              currency_code: "tnd",
            },
          ],
        },
      ],
      sales_channels: [
        {
          id: defaultSalesChannelId,
        },
      ],
    },
  ];
};
