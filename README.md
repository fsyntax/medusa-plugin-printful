<br/>
<p align="center">
  <a href="https://github.com/fsyntax/medusa-plugin-printful">
    <img src="https://res.cloudinary.com/dekhvq1tl/image/upload/v1695462189/medusa-plugin-printful-logo_vjwavs.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">medusa-plugin-printful</h3>

  <p align="center">
    A MedusaJS Plugin to integrate Printful.
    <br/>
    <br/>
    <a href="https://github.com/fsyntax/medusa-plugin-printful/issues">Report Bug</a>
    .
    <a href="https://github.com/fsyntax/medusa-plugin-printful/issues">Request Feature</a>
  </p>

![Downloads](https://img.shields.io/npm/dt/medusa-plugin-printful) ![Contributors](https://img.shields.io/github/contributors/fsyntax/medusa-plugin-printful?color=dark-green) ![Issues](https://img.shields.io/github/issues/fsyntax/medusa-plugin-printful)


## Table Of Contents

- [About the Project](#about-the-project)
- [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)
- [Acknowledgements](#acknowledgements)

## About The Project


### Caution
**Important:** This plugin is currently under development and may contain bugs or limitations. We strongly recommend testing it thoroughly before deploying it in a production environment. Please report any issues to improve the plugin.

**Medusa-Plugin-Printful** is a plugin for the Medusa e-commerce platform that integrates with the Printful fulfillment service. This plugin simplifies the management of Printful products and orders through the Medusa dashboard, streamlining workflows and saving time.

### What The Plugin Does

- Syncs product details between Printful and Medusa.
- Automatically updates product information based on Printful webhook events.
- Handles order fulfillment automatically via webhooks.

**Note:** As of now, the plugin supports events from Printful to Medusa but not the reverse, except for order cancelation. This feature is a work in progress and already under development on the `refactor/services` branch! 

## Built With

- MedusaJS
- Node.js
- Typescript


## Getting Started

### Prerequisites

- Fully working Medusa server with Redis and Postgres.
- Printful Account and Store (ID)

### Installation

1. Install the package in your Medusa Server root: `yarn add medusa-plugin-printful`
2. Configure the plugin in `medusa-config.js`.
3. Start your server and verify the plugin's functionality:


## Usage

For using this plugin, follow the installation steps and make sure to configure the plugin properly in `medusa-config.js`. Once the setup is done, the plugin will automatically handle syncing and order fulfillment as per the functionalities listed under "What The Plugin Does".

## Options

### Configuration Options

Here are the options you can use to configure the plugin within your `medusa-config.js` file:

- `printfulAccessToken`: Access token for the Printful API.
- `storeId`: Store ID for Printful.
- `backendUrl`: Base URL for the Medusa server (without trailing slash).
- `enableWebhooks`: Enable or disable Printful webhook listener.
- `enableSync`: Enable or disable product synchronization between Printful and Medusa. (Note: will be deprecated in future versions)
- `batchSize`: Number of jobs added to the queue at once for better load management. (Note: will be deprecated in future versions)
- `productTags`: Enable or disable the creation and updating of product tags in Medusa.
- `productCategories`: Enable or disable the creation and updating of product categories in Medusa.
- `confirmOrder`: Enable or disable automatic order confirmation when sending it to Printful.

### Sample Configuration

Here's how to set up your `medusa-config.js` file:

```javascript
{
  resolve: "medusa-plugin-printful",
  options: {
    printfulAccessToken: process.env.PRINTFUL_ACCESS_TOKEN,
    storeId: process.env.PRINTFUL_STORE_ID,
    backendUrl: process.env.BACKEND_URL,
    enableWebhooks: true,
    enableSync: true,
    batchSize: 3,
    productTags: true,
    productCategories: true,
    confirmOrder: false
  }
}


## Roadmap

The upcoming roadmap includes several key features and improvements:

### Short Term Goals
- Refactoring services to use v2 of the Printful API - this will be a continuous process as the API is still in beta.
- Biliteral product synchronization: Full two-way sync between Medusa and Printful platforms.
- Admin UI Integration: A user-friendly dashboard interface for easy management of Printful products and orders within Medusa.

### Long Term Goals
- Eventual More Features: As the plugin matures, more functionalities will be introduced based on community feedback and requirements.

Feel free to contribute by opening issues or pull requests to help achieve these milestones.


## Contributing

Contributions are welcome. Please feel free to open pull requests or issues for enhancements or bug reports.

## License

MIT License.

## Authors

- [fsyntax](https://github.com/fsyntax)

## Acknowledgements

A big thank you to the MedusaJS team for creating a robust e-commerce platform that enabled the development of this plugin. Special thanks to those who have contributed to the project or provided valuable feedback.


