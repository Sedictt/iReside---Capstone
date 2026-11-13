import { VisualPlannerSkeleton } from '@/components/landlord/visual-planner/components/VisualPlannerSkeleton';

export default function LandlordUnitMapLoading() {
    return (
        <div className="flex-1 min-h-0 h-full w-full overflow-hidden">
            <VisualPlannerSkeleton />
        </div>
    );
}
