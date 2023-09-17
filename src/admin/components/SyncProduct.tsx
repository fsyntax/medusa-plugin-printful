import {Badge, Button, Heading, Input, Text} from "@medusajs/ui";
import React, { useState} from "react";
import { useAdminCustomPost } from "medusa-react";
import {Check, Pencil, XMark} from "@medusajs/icons";


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

const SyncProduct = (item: PrintfulSyncProductRes) => {
    const [currentName, setCurrentName] = useState<string>(item.name);
    const [newName, setNewName] = useState<string>(currentName);
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const { mutate, isLoading } = useAdminCustomPost(
        `printful/sync_products/${item.id}/modify`,
        [`printful/sync_products/${item.id}/modify`],
    );

    const { mutate: syncMutate, isLoading: syncIsLoading } = useAdminCustomPost(
        `printful/sync_products/${item.id}/sync`,
        [`printful/sync_products/${item.id}/sync`],
    );

    const { mutate: desyncMutate, isLoading: desyncIsLoading } = useAdminCustomPost(
        `printful/sync_products/${item.id}/desync`,
        [`printful/sync_products/${item.id}/desync`],
    )

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

    const handleSync = () => {
        return syncMutate({}, {
            onSuccess: (data) => {
                console.log("Product synced successfully:", data);
                // You can update the UI here
            },
            onError: (error) => {
                console.log("An error occurred during sync:", error);
            },
        });
    };

    const handleDesync = () => {
        return desyncMutate({ name: currentName }, {
            onSuccess: (data) => {
                console.log("Product desynced successfully:", data);
                // You can update the UI here
            },
            onError: (error) => {
                console.log("An error occurred during desync:", error);
            },
        });
    }

    return (
        <div className="p-3 relative border border-gray-200 rounded-lg" key={item.id}>
            <div className={!item.synced_medusa ? 'absolute z-10 bg-white bg-opacity-70 inset-0 flex flex-col gap-3 items-center justify-center text-center' : 'hidden'}>
                <Text className="font-bold">Product not yet synced with Medusa.</Text>
                <Button onClick={handleSync} isLoading={syncIsLoading}>Start sync</Button>
            </div>
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
                            <Button
                                variant="transparent"
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
                <hr className="my-2"/>
                <img src={item.thumbnail_url} alt={item.name} aspect-ratio="1/1" className="mb-2 shadow-sm rounded-md w-full"/>
                <div className="flex flex-col gap-1">
                    <Badge>ID: {item.id}</Badge>
                    <Badge>Ext. ID: {item.external_id}</Badge>
                    <Badge>Variants: {item.variants}</Badge>
                    <Badge>Synced: {item.variants}</Badge>
                </div>
            <Button
                variant="danger"
                className="w-full mt-2"
                onClick={handleDesync}
                isLoading={desyncIsLoading}
                size="small"
            >
                Desync
            </Button>
            </div>
    );
};


export default SyncProduct
