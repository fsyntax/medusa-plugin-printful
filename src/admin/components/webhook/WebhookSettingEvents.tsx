import { WebhookConfigForm } from "./WebhookForm";
import React, { useEffect, useState } from "react";
import {useAdminCustomPost, useAdminCustomQuery} from "medusa-react";
import { Container, Heading, Text, Table, Label, Input, Button, FocusModal, Switch, ProgressTabs } from "@medusajs/ui";
import {SetWebhookEventRequest} from "../../../types/webhook/webhook-config";

const availableEventTypes = [
    "shipment_sent",
    "shipment_returned",
    "order_created",
    "order_updated",
    "order_failed",
    "order_canceled",
    "product_synced",
    "product_updated",
    "product_deleted",
    // "catalog_stock_updated",
    "catalog_price_changed",
    "order_put_hold",
    "order_put_hold_approval",
    "order_remove_hold"
];

export const WebhookSettingEvents = ({notify, configId}) => {

    const [events, setEvents] = useState(null);
    const [loadingEvent, setLoadingEvent] = useState<string | null>(null);
    const [eventSwitches, setEventSwitches] = useState(
        availableEventTypes.reduce((acc, curr) => ({ ...acc, [curr]: false }), {})
    );
    const {
        mutate: eventsMutate,
        isLoading: eventsLoading,
    } = useAdminCustomPost(
        `printful/webhook/get_events`,
        [`printful/webhook/get_events`],
    );

    const { mutate: setEventMutate, isLoading: setEventIsLoading, isSuccess } = useAdminCustomPost(
        `printful/webhook/set_event`,
        [`printful/webhook/set_event`],
    );

    const { mutate: disableEventMutate, isLoading: disableEventIsLoading } = useAdminCustomPost(
        `printful/webhook/disable_event`,
        ['printful/webhook/disable_event']
    )

    const handleToggleEvent = async (event, type: "set" | "disable", url) => {
        const id = event.target.id;
        setLoadingEvent(id);

        const commonCallbacks = {
            onSuccess: (data) => {
                // Update events state locally
                setEvents((prevEvents) => {
                    return prevEvents.map((event) => {
                        if (event.type === id) {
                            return {
                                ...event,
                                enabled: type === "set" ? true : false,
                            };
                        }
                        return event;
                    });
                });
                notify.success("Success", "Event configuration updated");
                setLoadingEvent(null);
            },
            onError: (error) => {
                notify.error("Error", error.message ?? "Something went wrong");
                setLoadingEvent(null);
            }
        };

        if (type === 'set') {
            const payload: SetWebhookEventRequest = {
                type: id,
                url: url ?? 'http://localhost:9000/printful/webhook',
                params: [],
                enabled: true,
            };
            return setEventMutate(payload, commonCallbacks);
        } else if (type === "disable") {
            return disableEventMutate({ eventType: id }, commonCallbacks);
        }
    };



    useEffect(() => {
        if(configId) {
            eventsMutate({config_id: configId}, {
                onSuccess: (data) => {
                    delete data.response
                    const dataArray = Object.values(data);
                    setEvents(dataArray);
                },
                onError: (error) => {
                    console.error(error);
                    notify.error('Error', error.message ?? 'Something went wrong');
                }
            });
        }
    }, [configId]);

    useEffect(() => {
        if (events) {
            const sortedEvents = [...events].sort((a, b) => a.type.localeCompare(b.type));
            setEvents(sortedEvents);
        }
    }, [events]);

    return (
        <div>
            {eventsLoading ? (
                <div>Loading..</div>
            ) : (
                <div>
                    {!events ? (
                        <Text>Apparently there aren't any events saved in the the Database for the passed config_id!</Text>
                    ) : (
                        <div>
                            <Text className="my-5">
                                Below is a list of all the events that can be triggered by Printful. You can configure which events you want to listen to.
                            </Text>
                            <Table>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.Cell>Event</Table.Cell>
                                        <Table.Cell>Url</Table.Cell>
                                        <Table.Cell>Enabled</Table.Cell>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {events.map((event) => (
                                        <Table.Row key={event.id}>
                                            <Table.Cell>{event.type}</Table.Cell>
                                            <Table.Cell>{event.url}</Table.Cell>
                                            <Table.Cell>
                                                <Switch
                                                    id={event.type}
                                                    checked={event.enabled}
                                                    onClick={(e) => handleToggleEvent(e, event.enabled ? "disable" : "set", event.url)}
                                                    disabled={loadingEvent === event.type}
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
