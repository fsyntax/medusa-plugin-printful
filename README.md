>    Hold on! This plugin is still a work in progress and may have some limitations or bugs. I recommend testing it thoroughly and only use it in a production environment if you're 100% confident it meets your needs. Please report any issues you encounter to help me (and the community) improve the plugin.

# Introducing Medusa-Plugin-Printful

Medusa-Plugin-Printful is a plugin for the Medusa e-commerce platform that integrates with the Printful fulfillment service. This plugin enables merchants to easily manage their Printful products and orders through the Medusa dashboard, simplifying their workflow and saving them time.

With Medusa-Plugin-Printful, you can sync your Printful products with Medusa and fulfill your Medusa orders using Printful. The plugin listens to Printful webhook events and automatically syncs the product information between Printful and Medusa, ensuring that your product information is always up-to-date. The fulfillment is handled fully automatically through webhooks and the plugin.
 >### Note:
>Currently, the plugin only supports handling events coming from Printful to Medusa and not vice versa (**except of order canceling** - this is a work in progress and the full integration is coming soon). Please note that the fulfillment flow has not been tested yet in a Medusa shop wich is in production. However, it has been tested locally with the Printful webhook simulator multiple times.

### Configuration
To configure the Medusa server, simply add the following configuration:
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
    }
}
```

### Options

- `printfulAccessToken`: Access token for the Printful API.
- `storeId`: Store ID for Printful.
- `backendUrl`: Base URL for the Medusa server.
- `enableWebhooks`: Enable or disable Printful webhook listener.
- `enableSync`: Enable or disable product synchronization between Printful and Medusa.
- `batchSize`: Number of products to fetch from Printful per batch. (Note that Printful has got an API rate limit of 120 requests per minute - since Printful products could have a lot of variants, it's recommended to keep this value low and.)

Please ensure that the `.env` variables for `printfulAccessToken`, `storeId`, and `backendUrl` are set accordingly.

### Custom Endpoints

In addition to the default functionality, the plugin comes with a few custom endpoints that can be used to manually manage the integration:

- `/admin/printful/create_webhooks`: Manually create and enable the webhooks for Printful.
- `/admin/printful/sync`: Start a full Printful product catalog synchronization manually.
- `/admin/printful/create_regions`: Create all available regions from Printful in Medusa with the corresponding countries. (Attention: this will delete all existing regions in Medusa!)

Please note that the custom endpoints are not meant to be exposed to the public and should only be accessed by authenticated users.

### What the plugin does
- Syncs Printful products with Medusa. (this includes variants, images, and options)
- Syncs Printful orders with Medusa.
- Creates and enables webhooks for Printful.
- Listens to Printful webhook events and automatically syncs product information & orders between Printful and Medusa.
- Can create regions in Medusa based on the regions available in Printful.



Overall, Medusa-Plugin-Printful simplifies the management of your e-commerce store by providing seamless integration with the Printful fulfillment service.
