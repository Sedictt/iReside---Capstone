import { InviteApplicationClient } from "@/components/tenant/invite/InviteApplicationClient";

export default async function InviteApplicationPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const { token } = await params;

    return <InviteApplicationClient token={token} />;
}
