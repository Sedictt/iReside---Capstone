import { ProspectPaymentPortalClient } from "@/components/tenant/invite/ProspectPaymentPortalClient";

export default async function ProspectPaymentPortalPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;
    return <ProspectPaymentPortalClient token={token} />;
}
