> **Hold on!** This plugin is still a work in progress and definetely has got some limitations or bugs. I recommend
> testing it
> thoroughly and only use it in a production environment if you're 100% confident it fulfills your needs. Please report
> any issues you encounter to help me (and the community) improve the
> plugin.

# Introducing Medusa-Plugin-Printful

Medusa-Plugin-Printful is a plugin for the Medusa e-commerce platform that integrates with the Printful fulfillment
service. This plugin enables merchants to easily manage their Printful products and orders through the Medusa dashboard,
simplifying their workflow and saving them time.

With Medusa-Plugin-Printful, you can sync your Printful products with Medusa and fulfill your Medusa orders using
Printful. The plugin listens to Printful webhook events and automatically syncs the product information between Printful
and Medusa, ensuring that your product information is always up-to-date. The fulfillment is handled fully automatically
through webhooks and the plugin.
> ### Note:
>Currently, the plugin only supports handling events coming from Printful to Medusa and not vice versa (**except of
order canceling** - this is a work in progress and the full integration is coming soon). Please note that the
> fulfillment flow has not been fully tested yet in a Medusa production environment. However, it has been tested locally
> with the Printful webhook simulator multiple times.

## Requirements

- Fully working Medusa server, with Redis and Postgres running (when running locally, you should proxy the server
  through a service like ngrok to make it accessible for Printful webhooks).
- Printful Account and Store (ID)

## Installation

To install Medusa-Plugin-Printful, make sure you have Node.js installed, along with Yarn, and a properly set up Medusa
server. You will also need a Printful account and store (for now, only one store can be assigned).
Once you have met the requirements, follow these steps:

1. In your Medusa Server root, run the following command: <br>
   `yarn add medusa-plugin-printful`
2. Next, configure the plugin in your medusa-config.js file as described in the Configuration section above.
3. Start your Medusa server with `yarn start` and verify that the plugin is working correctly by testing its
   functionality
   thoroughly. Please keep in mind that the plugin is still a work in progress and may have some limitations or bugs.

## Configuration

To configure your Medusa server, simply add the following plguin configuration to your `medusa-config.js` file:

```
{
    resolve: medusa-plugin-printful,
    options: {
        printfulAccessToken: process.env.PRINTFUL_ACCESS_TOKEN, 
        storeId: process.env.PRINTFUL_STORE_ID, 
        backendUrl: process.env.BACKEND_URL, 
        enableWebhooks: true, 
        enableSync: true,
        batchSize: 3
        productTags: true,
        productCategories: true,
        redisURL: REDIS_URL or process.env.REDIS_URL,
    }
}
```

### Options

- `printfulAccessToken`: Access token for the Printful API.
- `storeId`: Store ID for Printful.
- `backendUrl`: Base URL for the Medusa server (without trailing slash - i.e. `http://localhost:9000`
  or `https://api.your-domain.com`).
- `enableWebhooks`: Enable or disable Printful webhook listener.
- `enableSync`: Enable or disable product synchronization between Printful and Medusa.
- `batchSize`:  This value is used to define how many jobs are added to the queue at once
- `productTags`: Enable or disable wether product tags should be created and updated in Medusa
- `productCategories`: Enable or disable wether product the product category should be added and updated (non-existent
  categories are going to be created) in Medusa.

Please ensure that the `.env` variables for `printfulAccessToken`, `storeId`, and `backendUrl` are set accordingly.

## Enhancements and Updates

- The plugin now leverages BullMQ to handle synchronization jobs, ensuring efficient handling of multiple tasks.
- It uses an exponential backoff algorithm to manage the retries of failed tasks. This strategy helps in reducing the
  load on the server and improving the overall efficiency of tasks execution.
- The option `batchSize` now determines the number of jobs that are added to the queue at once, giving you more control
  over the load management.

### Custom Endpoints

In addition to the default functionality, the plugin comes with a few custom endpoints that can be used to manually
manage the integration:

- `/admin/printful/create_webhooks`: Manually create and enable the webhooks for Printful.
- `/admin/printful/sync`: Start a full Printful product catalog synchronization manually.
- `/admin/printful/create_regions`: Create all available regions from Printful in Medusa with the corresponding
  countries. (**Attention: this will delete all existing regions in Medusa!**)

Please note that the custom endpoints are not meant to be exposed to the public and should only be accessed by
authenticated users.

### What the plugin does

- Syncs Printful products with Medusa. (this includes variants, images, and options)
- Syncs Printful orders with Medusa.
- Creates and enables webhooks for Printful.
- Listens to Printful webhook events and automatically syncs product information & orders between Printful and Medusa.
- Can create regions in Medusa based on the regions available in Printful.
- Can create product tags and categories in Medusa based on the tags and categories available in Printful.
- Uses the BullMQ job queue to manage synchronization tasks, improving reliability and efficiency.

Overall, Medusa-Plugin-Printful simplifies the management of your e-commerce store by providing seamless integration
with the Printful fulfillment service.

### What's Next

Currently, Medusa-Plugin-Printful only supports handling events coming from Printful to Medusa, with the exception of
order canceling. However, I'm actively working on implementing the full two-way sync feature, which will allow for
seamless handling of products between both Medusa and Printful. This feature will enable merchants to manage their
entire product catalog from either platform, making their workflow even more efficient. Stay tuned for updates on this
exciting new feature!

## Thanks

I would like to express my gratitude to the MedusaJS team for providing a powerful and flexible e-commerce platform that
made it possible for me to create this plugin. I appreciate the hard work and dedication that went into developing and
maintaining Medusa.

**Thank you, MedusaJS team, for your contributions to the open-source community and for making e-commerce accessible to
everyone!** 💜

### Contributing

If you want to contribute to this project, please feel free to open a pull request or an issue. I will try to respond as
soon as possible!
