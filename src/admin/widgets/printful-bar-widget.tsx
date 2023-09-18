import type { WidgetConfig,  ProductDetailsWidgetProps } from "@medusajs/admin"
import {Container, Text, Badge, Button} from "@medusajs/ui";
import {MedusaProvider, useAdminCustomPost, useProduct} from "medusa-react";
import { QueryClient } from "@tanstack/react-query";
import React, {useEffect, useState} from "react";
import {EllipseGreenSolid, EllipseOrangeSolid, EllipseRedSolid} from "@medusajs/icons";

const queryClient = new QueryClient()

const PrintfulBarWidget = ({ product, notify }: ProductDetailsWidgetProps) => {

    const [isSynced, setIsSynced] = useState(false);
    const [printful_id, setPrintfulId] = useState(null);

    const { product: fetchedProduct, isLoading, error } = useProduct(product.id)

    const { mutate: syncMutate, isLoading: syncIsLoading } = useAdminCustomPost(
        `printful/sync_products/${product.id}/sync`,
        [`printful/sync_products/${product.id}/sync`],
    );

    const handleSync = () => {
        // @ts-ignore
        return syncMutate({ product_id: fetchedProduct.printful_id }, {
            onSuccess: (data) => {
                notify.success("Success!", `${product.title} has been synced with Printful.`)
            },
            onError: (error) => {
                notify.error("Error!", `An error occurred during sync: ${error}`)
            },
        });
    };


    useEffect(() => {
        if (fetchedProduct) {
            //@ts-ignore
            setIsSynced(fetchedProduct.synced);
            //@ts-ignore
            setPrintfulId(fetchedProduct.printful_id);
        }
    }, [fetchedProduct]);

    return (
        <div>
            {printful_id !== null ? (
            <MedusaProvider baseUrl="localhost:9000" queryClientProviderProps={{client: queryClient}}>
                <Container className="mb-2 flex gap-5 items-center p-3 justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 954 548" width="87" height="50">
                                <title>printful_symbol_logo(2)-svg</title>
                                <defs>
                                    <image width="801" height="361" id="img1" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyEAAAFpCAMAAAC8pNfpAAAAAXNSR0IB2cksfwAAAnNQTFRFAAAA8smU8smU7UZC7UZCF7y1F7y18smU8smU7UZC7UZC7UZCF7y1F7y1F7y18smU7UZCF7y1F7y18smU7UZC7UZCF7y1F7y18smU8smU7UZC7UZCF7y1F7y18smU7UZCF7y18smUF7y18smU7UZC8smU7UZC8smU7UZCF7y1F7y1F7y17UZC8smU7UZC8smU8smU7WFSOamj75p14Tsx7EVB0kRAJH545Ec73zkv5j84O0pFFjw3F7Ot7IBj60RArUdCFjQvFm9p8sGP4j0z4jw0J0Q+F6uk6GVR6UI8f0dCFlZQ8LGE4Dow4EVBGTo1F5GL5k1ATUhDFkU/7pNwxUM+Fnhy40A24z01MUdC6m9Y6UM9i0lEFmdh8biJ4Twy4jszGzk0F5qT51hI50A6ZkxHF4mD5D42N0M+6kQ+oUVBIj056EE7dEQ/REVAt0E9F4B6KkI9F6KcUkZBlEQ/HDk052BNaEI9Fl5Z5T83O0I9Fk1I7IxrqkA8SEM+5EQ6Jjw3h0I+XEA7nD87PkA7e0A8UD45KTs1gT04ND04Hjgzbj86RDw35Uo+6WpUVTw3YT05Ojk0jz46HzcydDw3SDo1LjgzZjs2Szg0WTo140Q54T0zIjUx76F6Pjcz76l/MDYx5lRF63pfKDIqYjMpFSkaFjMs0jkvFyodFSwfOy8kFjAnmjYsFSobFSodFjMuIS0gFS4kczMqRy8lFjEqsDctJy0hfTMqGiweFS0iTjAmuzcu4kA1MC8jkDUr5ldHVDEnxjguNi8jHiwfQS8kpDYsazMohzQq51hH5lFDYDouPzgsOTsvODouNEI5NV1YSHdyv95GoAAAANF0Uk5TALAgQKCwEED/wP8wYP+Q4GDwMHAQ8IDAEPCA4CBQoCDgMEDAsGDQgHCg0HCQ0FCQUNNM//////H////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////X4PP6/Prx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"/>
                                </defs>
                                <style>
                                </style>
                                <use id="img1" href="#img1" transform="matrix(1,0,0,1,87,91)"/>
                            </svg>
                        </div>
                        {isSynced ? (
                            <Badge size="small" color={syncIsLoading ? 'orange' : 'green'}>
                                <EllipseGreenSolid />
                                <Text>{syncIsLoading ? 'Syncing' : 'Synced'}</Text>
                            </Badge>
                        ) : (
                            <Badge size="small" color={syncIsLoading ? 'orange' : 'red'}>
                                {syncIsLoading ? (
                                    <EllipseOrangeSolid />
                                ) : (
                                    <EllipseRedSolid />
                                )}
                                <Text>{syncIsLoading ? 'Syncing' : 'Not synced'}</Text>
                            </Badge>
                        )}
                    </div>
                    { isLoading ? (
                        <Text>
                            Loading Printful overview..
                        </Text>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Text size="small">
                                <a className="underline" href={`https://www.printful.com/dashboard/sync/update?id=${
                                    //@ts-ignore
                                    fetchedProduct.printful_id
                                    }`} target="_blank">
                                    Open in Printful
                                </a>
                            </Text>
                            {isSynced ? (
                                <Button size="small" variant="secondary" onClick={handleSync} isLoading={syncIsLoading}>
                                    <Text>Resync</Text>
                                </Button>
                            ) : (
                                <Button size="small" variant="secondary" onClick={handleSync} isLoading={syncIsLoading}>
                                    <Text>Sync</Text>
                                </Button>
                            )}
                        </div>
                    )}
                    { error && (
                        <div>
                            {JSON.stringify(error, null, 2)}
                        </div>
                    )}
                </Container>
            </MedusaProvider>
        ) : (
            <div></div>
        )}
        </div>
    )
}

export const config: WidgetConfig = {
    zone: "product.details.before",
}

export default PrintfulBarWidget
