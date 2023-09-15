import {Container, Heading, Text} from "@medusajs/ui";
import React from "react";
import { QueryClient } from "@tanstack/react-query";
import {MedusaProvider, useAdminCustomQuery} from "medusa-react";
import SyncProduct from "./SyncProduct";

const queryClient = new QueryClient();

interface PrintfulSyncProductRes {
    id: number;
    external_id: string;
    name: string;
    variants: number;
    synced: number;
    thumbnail_url: string;
    is_ignored: boolean;
    synced_medusa: boolean;
}



const SyncProductsList = () => {
    const { data, isLoading } = useAdminCustomQuery(
        "printful/sync_products",
        ["printful/sync_products"],
        { limit: 100 }
    );

    const dataArray = Object.values(data || {}) as PrintfulSyncProductRes[];
console.log(dataArray)
    return (
        <>
            {isLoading ? (
                <div>Loading...</div>
            ) : (
                <div>
                    <div className="grid gap-4 grid-cols-1 small:grid-cols-2 medium:grid-cols-3 large:grid-cols-4">
                        {dataArray.map((item, index) => (
                            <SyncProduct {...item} key={index} />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};


const SyncProducts = () => {
    return (
        <div>
            <MedusaProvider baseUrl="http://localhost:9000" queryClientProviderProps={{ client: queryClient }} >
                <Heading level="h1" className="mb-3">Sync Products</Heading>
                <Container>
                    <SyncProductsList />
                </Container>
            </MedusaProvider>
        </div>
    )
}



export default SyncProducts
