import {
  loadEnv,
  defineConfig,
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

// Load environment variables based on the current NODE_ENV
loadEnv(process.env.NODE_ENV || "development", process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL,
      },
    },
    // {
    //   resolve: "@medusajs/medusa/auth",
    //   dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
    //   options: {
    //     providers: [
    //       {
    //         resolve: "@medusajs/medusa/auth-emailpass",
    //         id: "emailpass",
    //       },
    //       // {
    //       //   resolve: "@medusajs/medusa/auth-google",
    //       //   id: "google",
    //       //   options: {
    //       //     clientId: process.env.GOOGLE_CLIENT_ID,
    //       //     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    //       //     callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    //       //   },
    //       // },
    //     ],
    //   },
    // },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              channels: ["email"],
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.MINIO_FILE_URL,
              access_key_id: process.env.MINIO_ACCESS_KEY,
              secret_access_key: process.env.MINIO_SECRET_KEY,
              region: process.env.MINIO_REGION,
              bucket: process.env.MINIO_BUCKET,
              endpoint: process.env.MINIO_ENDPOINT,
              additional_client_config: {
                forcePathStyle: true,
              },
            },
          },
        ],
      },
    },
  ],
  plugins: [
    // {
    //   resolve: '@agilo/medusa-analytics-plugin',
    //   options: {},
    // },
    // {
    //   resolve: '@repo/invoice-gen-plugin',
    //   options: {},
    // },
  ],
});
