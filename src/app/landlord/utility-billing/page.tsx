"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { UtilityBillingDashboard } from "@/components/landlord/utility/UtilityBillingDashboard";

export default function UtilityBillingPage() {
	return (
		<div className="min-h-screen text-foreground">
			<div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
				<div className="mx-auto max-w-7xl">
					<Suspense
						fallback={
							<div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
								<Loader2 className="size-10 animate-spin text-primary" />
								<p className="text-sm font-medium text-muted-foreground">Loading utility command center...</p>
							</div>
						}
					>
						<UtilityBillingDashboard />
					</Suspense>
				</div>
			</div>
		</div>
	);
}
