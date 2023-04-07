import {FulfillmentService} from "medusa-interfaces";
import {PrintfulClient} from "../utils/printful-request"
import {Fulfillment} from "@medusajs/medusa";
import {toUpper} from "lodash";

class PrintfulFulfillmentService extends FulfillmentService {
    static identifier = "printful";

    private orderService: any;
    private printfulService: any;
    private printfulClient: any;
    private fulfillmentService: any;
    private readonly storeId: any;

    constructor(container, options) {
        super();
        this.orderService = container.orderService;
        this.printfulService = container.printfulService;
        this.printfulClient = new PrintfulClient(options.printfulAccessToken);
        this.fulfillmentService = container.fulfillmentService;
        this.storeId = options.storeId;
    }

    async getFulfillmentOptions() {
        console.log("About to create fulfillment options")
        return [
            {
                id: "STANDARD",
                name: "Printful Default"
            },
            {
                id: "PRINTFUL_FAST",
                name: "Printful Express"
            },
            {
                id: "printful-return",
                name: "Printful Return",
                is_return: true
            }
        ]
    }

    async validateOption(data) {
        console.log("validateOption", data)
        return true;
    }

    async validateFulfillmentData(optionData, data, cart) {
        console.log("validateFulfillmentData", optionData, data, cart)
        console.log("Data", data)
        return {...data};
    }

    async createFulfillment(data, fulfillmentItems, fromOrder, fulfillment) {
        console.log("createFulfillment", data, fulfillmentItems, fromOrder, fulfillment)
        return Promise.resolve({})
    }

    canCalculate(data) {
        if (data.id === "STANDARD" || data.id === "PRINTFUL_FAST") {
            return true;
        }
    }


    async calculatePrice(optionData, data, cart) {
        console.log("calculatePrice: ", optionData, data)
        try {
            const {code, result} = await this.printfulService.getShippingRates({
                recipient: {
                    address1: cart.shipping_address.address_1,
                    city: cart.shipping_address.city,
                    country_code: toUpper(cart.shipping_address.country_code),
                    zip: cart.shipping_address.postal_code,
                    phone: cart.shipping_address.phone || null,
                },
                items: cart.items.map(item => {
                    return {
                        variant_id: item.variant.metadata.printful_catalog_variant_id,
                        quantity: item.quantity
                    }
                }),
                locale: "de_DE"
            })
            if (code === 200) {
                // return the rate where optionData.id is the same as the id of the result
                const shippingOption = result.find(option => option.id === optionData.id);
                if (shippingOption) {
                    return parseInt((shippingOption.rate * 100).toString(), 10);
                } else {

                    console.log(`Shipping option ${optionData.id} not found`);
                }

            }

        } catch (e) {
            console.log(e)
        }
    }

    async cancelFulfillment(fulfillment) {
        // TODO: call printful api to cancel fulfillment
        return Promise.resolve(<Fulfillment>{})
    }

}

export default PrintfulFulfillmentService;