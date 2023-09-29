import {useAdminCustomPost} from "medusa-react";
import React from "react";
import { Text, Label, Button, Input } from "@medusajs/ui";

export const WebhookConfigForm = ({notify}) => {

    const {
        mutate: setWebhookConfig,
        isLoading: isWebhookConfigLoading,
        isSuccess: isWebhookConfigSuccess
    } = useAdminCustomPost(
        `printful/webhook/set`,
        [`printful/webhook/set`],
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const payload = {
            default_url: data.get('default_url'),
        };

        if (data.get('expires_at')) {
            payload['expires_at'] = data.get('expires_at');
        }

        return setWebhookConfig(payload, {
            onSuccess: (data) => {
                console.log(data)
                notify.success("Success", "Webhook configuration updated");
            },
            onError: (error) => {
                console.error(error)
                notify.error("Error", error.message ?? "Something went wrong")
            }
        })
    };

    return (
        <div className="flex flex-1 flex-col gap-2">
            <Text className="text-ui-fg-subtle">
                Use this form to configure your webhook settings. You can specify the URL endpoint that will receive
                event notifications from Printful. Optionally,
                you can set an expiration time for this configuration.
            </Text>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-y-1 mb-2">
                    <Label htmlFor="default_url" className="font-bold text-ui-fg-subtle">
                        Default URL
                    </Label>
                    <Input id="default_url" name="default_url" placeholder="https://example.com/webhook"/>
                </div>
                <div className="flex flex-col gap-y-1 mb-2">
                    <Label htmlFor="expires_at" className="font-bold text-ui-fg-subtle">
                        Expires At
                    </Label>
                    <Input id="expires_at" name="expires_at" placeholder="Unix Timestamp"/>
                </div>
                <Button variant="secondary" className="mt-2" type="submit">Save Configuration</Button>
            </form>
        </div>
    );
};
