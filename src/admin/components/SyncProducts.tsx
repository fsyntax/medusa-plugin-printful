import {Badge, Button, Container, Heading, Input, Text} from "@medusajs/ui";
import React, { useState} from "react";
import { QueryClient } from "@tanstack/react-query";
import {MedusaProvider, useAdminCustomPost, useAdminCustomQuery} from "medusa-react";
import {method} from "lodash";
import {Check, Pencil, XMark} from "@medusajs/icons";

const queryClient = new QueryClient();

interface PrintfulSyncProductRes {
    id: number;
    external_id: string;
    name: string;
    variants: number;
    synced: number;
    thumbnail_url: string;
    is_ignored: boolean;
}

const SyncProduct = (item: PrintfulSyncProductRes) => {
    const [currentName, setCurrentName] = useState<string>(item.name);
    const [newName, setNewName] = useState<string>(currentName);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const { mutate, isLoading } = useAdminCustomPost(
        `printful/sync_products/${item.id}/modify`,
        [`printful/sync_products/${item.id}/modify`],
    );

    const handleModify = (args: any) => {
        return mutate(args, {
            onSuccess: (data) => {
                console.log("Product modified successfully:", data);
                setCurrentName(newName);
                setNewName('');
                setIsEditing(false);  // Switch back to view mode
            },
            onError: (error) => {
                console.log("An error occurred:", error);
            },
        });
    };

    return (
        <div className="p-3 border border-gray-200 rounded-lg" key={item.id}>
            <div className="p-3 border border-gray-200 rounded-lg" key={item.id}>
                <div className="flex justify-between gap-3">
                    {isEditing ? (
                        <Input
                            size="small"
                            placeholder={currentName}
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            disabled={isLoading}
                        />
                    ) : (
                        <Heading level="h3">{currentName}</Heading>
                    )}
                    {isEditing ? (
                      <div className="flex gap-2">
                          <Button
                              variant="transparent"
                              className="w-6 h-6"
                              size="small" format="icon" onClick={() => setIsEditing(!isEditing)}
                          >
                              <XMark/>
                          </Button>
                          <Button variant="transparent"
                                  className="w-6 h-6"

                              onClick={() => {
                                  handleModify({ name: newName });
                              }}
                              isLoading={isLoading}
                              size="small"
                              format="icon"
                          >
                              <Check />
                          </Button>
                      </div>
                    ) : (
                        <Button
                            variant="transparent"
                            className="w-6 h-6"
                            format="icon" size="small"
                            onClick={() => setIsEditing(!isEditing)}
                        >
                            <Pencil />
                        </Button>
                    )}
                </div>
                <div className="flex flex-col gap-1">
                    <span>ID: {item.id}</span>
                    <span>Ext. ID: {item.external_id}</span>
                </div>
                <img src={item.thumbnail_url} alt={item.name} aspect-ratio="1/1" className="my-2 shadow-sm rounded-md w-full"/>
            </div>
        </div>
    );
};

const SyncProductsList = () => {
    const { data, isLoading } = useAdminCustomQuery(
        "printful/sync_products",
        ["printful/sync_products"]
    );

    const dataArray = Object.values(data || {}) as PrintfulSyncProductRes[];

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
                    <hr/>
                    <pre>{JSON.stringify((data))}</pre>
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
                <Text>An overview of all the products listed in your Printful Store.</Text>
                <Container>
                    <SyncProductsList />
                </Container>
            </MedusaProvider>
        </div>
    )
}



export default SyncProducts
