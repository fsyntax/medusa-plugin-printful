import {WebhookConfigForm} from "./WebhookForm";
import React, {useEffect, useState} from "react";
import {useAdminCustomPost} from "medusa-react";
import { Container, Heading, Text, Table, Label, Input, Button, FocusModal, Switch, ProgressTabs } from "@medusajs/ui";

export const WebhookSettingGeneral = ({notify, savedWebhookConfig}) => {

    const [newWebhookConfig, setNewWebhookConfig] = useState(null);

    const {
        mutate: setNewConfig,
        isLoading: setNewConfigLoading,
    } = useAdminCustomPost(
        `printful/webhook/set`,
        [`printful/webhook/set`],
        {}
    );

    useEffect(() => {
        if (savedWebhookConfig) {
            setNewWebhookConfig(savedWebhookConfig);
        }
    }, [savedWebhookConfig]);

    const handleSaveConfigClick = async () => {
        try {
            return setNewConfig(newWebhookConfig, {
                onSuccess: (data) => {
                    console.log(data);
                    notify.success('Success', 'Successfully updated your webhook configuration!');
                },
                onError: (error) => {
                    console.error(error);
                    notify.error('Error', error.message ?? 'Something went wrong');
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div>
            {!newWebhookConfig ? (
                <div className="flex flex-col gap-2">
                    <Text className="bg-warning-400 px-2 py-1 font-bold">
                        You haven't saved any webhook configurations yet.
                    </Text>
                    <WebhookConfigForm
                        notify={notify}
                    />
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <Text className="my-5">
                        Below is your currently saved webhook configuration. You can configure by overriding the data below.
                    </Text>
                    <Table>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>Field</Table.HeaderCell>
                                <Table.HeaderCell>Value</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            <Table.Row className="py-1">
                                <Table.Cell>Configuration ID</Table.Cell>
                                <Table.Cell>
                                    <Text>{savedWebhookConfig.id}</Text>
                                </Table.Cell>
                            </Table.Row>
                            <Table.Row className="py-1">
                                <Table.Cell>Default URL</Table.Cell>
                                <Table.Cell>
                                    <Input
                                        type="text"
                                        value={newWebhookConfig.default_url || ''}
                                        onChange={(e) => setNewWebhookConfig({
                                            ...newWebhookConfig,
                                            public_key: savedWebhookConfig.public_key,
                                            default_url: e.target.value,
                                        })}
                                    />
                                </Table.Cell>
                            </Table.Row>
                            <Table.Row className="py-1">
                                <Table.Cell>Expires at</Table.Cell>
                                <Table.Cell>
                                    <Input
                                        type="text"
                                        value={newWebhookConfig.expires_at || ''}
                                        onChange={(e) => setNewWebhookConfig({
                                            ...newWebhookConfig,
                                            public_key: savedWebhookConfig.public_key,
                                            expires_at: e.target.value,
                                        })}
                                    />
                                </Table.Cell>
                            </Table.Row>
                            <Table.Row className="py-1">
                                <Table.Cell>Public key</Table.Cell>
                                <Table.Cell>
                                    <Text>{savedWebhookConfig.public_key}</Text>
                                </Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    </Table>
                    <Button
                        className="mt-3"
                        onClick={handleSaveConfigClick}
                        isLoading={setNewConfigLoading}
                        disabled={newWebhookConfig === savedWebhookConfig}
                    >
                        Save Configuration
                    </Button>
                </div>
            )}
        </div>
    )
}
