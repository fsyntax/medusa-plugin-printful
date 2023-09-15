import { RouteConfig } from "@medusajs/admin";
import SyncProducts from "../../components/SyncProducts";

const PrintfulPage = () => {
    return (
        <div>
            <SyncProducts/>
        </div>
    )
}

export const config: RouteConfig = {
    link: {
        label: "Printful Dashboard",
    },
}

export default PrintfulPage
