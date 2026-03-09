// Barrel export for all query functions
export {
    getProperties,
    getPropertyById,
    getLandlordProperties,
    getSavedProperties,
} from './properties'

export {
    getTenantLeases,
    getLandlordLeases,
    getLeaseById,
    getActiveLease,
} from './leases'

export {
    getTenantPayments,
    getLandlordPayments,
    getPendingPayment,
    getPaymentById,
    getPaymentStats,
} from './payments'
