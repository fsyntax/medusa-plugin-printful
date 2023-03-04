import {FulfillmentService} from "medusa-interfaces";
import {PrintfulClient} from "printful-request"
import {Fulfillment} from "@medusajs/medusa";
import {toUpper} from "lodash";

class PrintfulFulfillmentService extends FulfillmentService {
    static identifier = "printful";

    private orderService: any;
    private printfulService: any;
    private printfulClient: any;
    private fulfillmentService: any;
    private storeId: any;

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
                id: "printful-default",
                name: "Printful Default"
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
        if (data.id === "printful-default") {
            return true;
        }
    }

    async validateFulfillmentData(optionData, data, cart) {
        console.log("validateFulfillmentData", optionData, data, cart)
        console.log("Data", data)
        return {...data};
    }

    // async createFulfillment(methodData, fulfillmentItems, fromOrder, fulfillment) {
    async createFulfillment(data, fulfillmentItems, fromOrder, fulfillment) {
        // No data is being sent anywhere
        return Promise.resolve({})
    }

    canCalculate(data) {
        // TODO: implement flat rate or calculate shipping
        return data.id === "printful-default";
    }

    async calculatePrice(optionData, data, cart) {
        // TODO: call printful api to get shipping rates
        // const rate = await this.printfulClient.getShippingRates({
        //     recipient: {
        //         address1: cart.shipping_address.address_1,
        //         city: cart.shipping_address.city,
        //         country_code: toUpper(cart.shipping_address.country_code),
        //     }
        // })
        console.log("calculatePrice", optionData, data, cart)
        return cart.items.length * 1000
    }

    async cancelFulfillment(fulfillment) {
        // TODO: call printful api to cancel fulfillment
        return Promise.resolve(<Fulfillment>{})
    }

}

export default PrintfulFulfillmentService;