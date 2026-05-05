// Barrel export for all query functions
export {
    getPropertyById,
    getLandlordProperties,
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
