import type { SettingConfig } from "@medusajs/admin"
import {Container, Heading, Text} from "@medusajs/ui";
import { QueryClient } from "@tanstack/react-query";
import {MedusaProvider, useAdminCustomQuery} from "medusa-react";
import React from "react";
import WebhookContainer from "../../components/WebhookConfig";

const queryClient = new QueryClient({
    // defaultOptions: {
    //     queries: {
    //         refetchOnWindowFocus: false
    //     }
    // }
});



const PrintfulSettingsPage = () => {
    return (
        <div>
            <MedusaProvider baseUrl="http://localhost:9000" queryClientProviderProps={{ client: queryClient }} >
                <Heading className="mb-3" level="h1">Printful Plugin Settings</Heading>
                <WebhookContainer />
            </MedusaProvider>
        </div>
    )
}

export const config: SettingConfig = {
    card: {
        label: "Printful",
        description: "Manage settings related to Printful.",

    },
}

export default PrintfulSettingsPage
