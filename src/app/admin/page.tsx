/**
 * @deprecated [DEPRECATED - Turnkey Architecture]
 * Legacy admin root route.
 * Redirects to /landlord/dashboard.
 */
import { redirect } from "next/navigation";

export default function AdminPage() {
    redirect("/landlord/dashboard");
}
