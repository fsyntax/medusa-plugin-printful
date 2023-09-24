import { Container, Heading, Text, Table, Label, Input, Button, FocusModal, Switch } from "@medusajs/ui";
import {EllipseGreenSolid, EllipseOrangeSolid, EllipseRedSolid} from "@medusajs/icons";
import React, {useState} from "react";
import {MedusaProvider, useAdminCustomPost, useAdminCustomQuery} from "medusa-react";
import {SetWebhookEventRequest, WebhookEventResponse} from "../../types/webhook/webhook-config";

const events = [
    "shipment_sent",
    "shipment_returned",
    "order_created",
    "order_updated",
    "order_failed",
    "order_canceled",
    "product_synced",
    "product_updated",
    "product_deleted",
    "catalog_stock_updated",
    "catalog_price_changed",
    "order_put_hold",
    "order_put_hold_approval",
    "order_remove_hold"
];


export const WebhookConfigForm = () => {

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        // You can now use eventSwitches to see which events are enabled
    };

    return (
        <div className="flex flex-1 flex-col gap-5">
            <Heading level="h2">Webhook configuration</Heading>
            <Text className="text-ui-fg-subtle">
                Use this form to configure your webhook settings. You can specify the URL endpoint that will receive event notifications from Printful, as well as the types of events you want to listen for. Optionally, you can set an expiration time for this configuration. Fill out the fields below to update or set your webhook configuration.
            </Text>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-y-1 mb-2">
                        <Label htmlFor="default_url" className="font-bold text-ui-fg-subtle">
                            Default URL
                        </Label>
                        <Input id="default_url" placeholder="https://example.com/webhook" />
                    </div>
                    <div className="flex flex-col gap-y-1 mb-2">
                        <Label htmlFor="public_key" className="font-bold text-ui-fg-subtle">
                            Public Key
                        </Label>
                        <Input id="public_key" placeholder="YOURPUBLICKEY" />
                    </div>
                    <div className="flex flex-col gap-y-1 mb-2">
                        <Label htmlFor="expires_at" className="font-bold text-ui-fg-subtle">
                            Expires At
                        </Label>
                        <Input id="expires_at" placeholder="Unix Timestamp" />
                    </div>
                    <Button variant="secondary" type="submit">Save Configuration</Button>
                </form>
        </div>
    );
};



const WebhookContainer = ({notify}) => {
    const [loadingEvent, setLoadingEvent] = useState<string | null>(null);

    const { data, isLoading } = useAdminCustomQuery(
        "printful/webhook/get",
        ["printful/webhook/get"],
        {},
        {
            refetchOnWindowFocus: false,
        }
    );

    const [eventSwitches, setEventSwitches] = useState(
        events.reduce((acc, curr) => ({ ...acc, [curr]: false }), {})
    );

    const { mutate, isLoading: eventIsLading, isSuccess } = useAdminCustomPost(
        `printful/webhook/set_event`,
        [`printful/webhook/set_event`],
    );

    const handleButtonClick = async (event) => {
        const id = event.target.id;
        setLoadingEvent(id);
        // Prepare the payload or query parameters
        const payload: SetWebhookEventRequest = {
            type: id,
            url: data?.data?.default_url ?? 'http://localhost:9000/printful/webhook',
            params: []
        };

       return mutate(payload, {
            onSuccess: (data) => {
                    setEventSwitches((prevState) => ({
                        ...prevState,
                        [id]: !prevState[id],
                    }));
                    notify("Success", "Event configuration updated");
                setLoadingEvent(null);
            },
            onError: (error) => {
                notify.error("Error", error.message ?? "Something went wrong");
                setLoadingEvent(null);
            }
       })
    };



    return (
        <Container>
            <Heading level="h2" className="mb-3">
                Webhook Configuration
            </Heading>
            {isLoading ? (
                <Text>Loading...</Text>
            ) : (
                <div>
                    <Text>
                        <strong>Default URL:</strong> {data?.data?.default_url || "Not set"}
                    </Text>
                    <Text>
                        <strong>Expires At:</strong> {data?.data?.expires_at || "Not set"}
                    </Text>
                    <Heading level="h3" className="mt-3 mb-2">
                        Events
                    </Heading>
                    {data?.data?.events?.length ? (
                        <Table>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>Type</Table.HeaderCell>
                                    <Table.HeaderCell>URL</Table.HeaderCell>
                                    <Table.HeaderCell>Params</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {data?.data?.events.map((event, index) => (
                                    <Table.Row key={index}>
                                        <Table.Cell>{event.type}</Table.Cell>
                                        <Table.Cell>{event.url}</Table.Cell>
                                        <Table.Cell>
                                            {event.params
                                                ? event.params.map((param) => (
                                                    <div key={param.name}>
                                                        {param.name}: {JSON.stringify(param.value)}
                                                    </div>
                                                ))
                                                : "None"}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    ) : (
                        <Text>No events configured.</Text>
                    )}
                    <FocusModal>
                        <FocusModal.Trigger asChild>
                            <Button className="mt-3" variant="secondary">Set Configuration</Button>
                        </FocusModal.Trigger>
                        <FocusModal.Content className="z-[100]">
                            <FocusModal.Header>
                                <Button>Save</Button>
                            </FocusModal.Header>
                            <FocusModal.Body className="flex gap-20 p-16">
                                <WebhookConfigForm />
                                <div className="flex flex-1 flex-col gap-5">
                                    <Heading level="h3" className="mb-3">Event Configuration</Heading>
                                    <Text className="text-ui-fg-subtle">Click the buttons below to either enable or disable the different webhook event types.</Text>
                                    <div className="flex flex-col gap-1.5">
                                        {events.map((event, index) => (
                                            <div className="flex items-center gap-x-2" key={index}>
                                                {loadingEvent === event ? (
                                                    <EllipseOrangeSolid />
                                                ) : (
                                                    <div>
                                                        {eventSwitches[event] ? <EllipseGreenSolid /> : <EllipseRedSolid />}
                                                    </div>
                                                )}

                                                <Label htmlFor={event}>{event}</Label>
                                                <Button
                                                    id={event}
                                                    variant="secondary"
                                                    onClick={handleButtonClick}
                                                    isLoading={loadingEvent === event}
                                                >
                                                    {eventSwitches[event] ? "Disable" : "Enable"}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FocusModal.Body>
                        </FocusModal.Content>
                    </FocusModal>
                </div>
            )}
        </Container>
    );
};


export default WebhookContainer;
