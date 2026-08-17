"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { FeaturedPropertyCard } from "./FeaturedPropertyCard";

export function FeaturedPropertySkeleton({ className }: { className?: string }) {
    const fixtureData = {
        propertyName: "Sunset Valley Apartments",
        totalSales: "₱243,000",
        totalViews: "20K+",
        image: "/hero-images/apartment-03.png",
        momGrowth: "+12.4%",
        occupancyRate: "100%"
    };

    return (
        <Skeleton 
            name="featured-property" 
            loading={true} 
            fixture={<FeaturedPropertyCard {...fixtureData} className={className} />}
        >
            <FeaturedPropertyCard {...fixtureData} className={className} />
        </Skeleton>
    );
}
