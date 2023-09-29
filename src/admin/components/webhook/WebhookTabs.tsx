import React, {useEffect, useState} from "react";
import { useAdminCustomPost, useAdminCustomQuery } from "medusa-react";
import { WebhookConfigForm } from "./WebhookForm";
import { Container, Heading, Text, Table, Label, Input, Button, FocusModal, Switch, ProgressTabs } from "@medusajs/ui";
import {WebhookSettingGeneral} from "./WebhookSettingGeneral";
import {WebhookSettingEvents} from "./WebhookSettingEvents";

const WebhookTabs = ({ notify }) => {

    const [savedWebhookConfig, setSavedWebhookConfig] = useState(null);

    const {
        data: savedConfig,
        isLoading: savedConfigLoading,
    } = useAdminCustomQuery(
        `printful/webhook/get_saved`,
        [`printful/webhook/get_saved`],
        {},
        {
            refetchOnWindowFocus: false,
        }
    );

    useEffect(() => {
        if (savedConfig) {
            setSavedWebhookConfig(savedConfig);
        }
    }, [savedConfig]);


    if (savedConfigLoading) {
        return (
            <Container>
                <div>Loading...</div>
            </Container>
        );
    }

    return (
       <Container>
            <Heading className="mb-3" level="h1">Webhook Settings</Heading>
            <div className="w-full px-4">
                <ProgressTabs defaultValue="general">
                    <div className="border-b border-ui-border-base">
                        <ProgressTabs.List>
                            <ProgressTabs.Trigger
                                className="font-bold py-2 text-lg text-black"
                                disabled={savedConfigLoading} value="general">
                                General
                            </ProgressTabs.Trigger >
                            <ProgressTabs.Trigger
                                className="font-bold py-2 text-lg text-black"
                                disabled={!savedWebhookConfig?.default_url} value="shipping">
                                Events
                            </ProgressTabs.Trigger>
                            <ProgressTabs.Trigger
                                className="font-bold py-2 text-lg text-black"
                                disabled={!savedWebhookConfig?.default_url} value="payment">
                                Other
                            </ProgressTabs.Trigger>
                        </ProgressTabs.List>
                    </div>
                    <div className="mt-2">
                        <ProgressTabs.Content className="mb-2" value="general">
                            <WebhookSettingGeneral
                                notify={notify}
                                savedWebhookConfig={savedWebhookConfig}
                            />
                        </ProgressTabs.Content>
                        <ProgressTabs.Content value="shipping">
                            <WebhookSettingEvents
                                notify={notify}
                                configId={savedWebhookConfig?.id}
                            />
                        </ProgressTabs.Content>
                        <ProgressTabs.Content value="payment">
                            <Text size="small">
                                Our payment process is designed to make your shopping experience
                                smooth and secure. We offer a variety of payment options to
                                accommodate your preferences, from credit and debit cards to
                                online payment gateways. Rest assured that your financial
                                information is protected through advanced encryption methods.
                                Shopping with us means you can shop with confidence, knowing your
                                payments ae safe and hassle-free.
                            </Text>
                        </ProgressTabs.Content>
                    </div>
                </ProgressTabs>
            </div>
       </Container>
    )
};


export default WebhookTabs;
