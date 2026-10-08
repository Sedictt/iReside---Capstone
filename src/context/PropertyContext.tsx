'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'
import {
    LANDLORD_SETUP_CHANGED_EVENT,
    type LandlordSetupDataStatus,
    type LandlordSetupSignals,
} from '@/lib/landlord-setup'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Property {
    id: string
    name: string
    address: string
    image: string | null
    isMapSetupComplete?: boolean
    placedCount?: number
    hasTenants?: boolean
    units: Array<{
        id: string
        name: string
        status: string
        rentAmount: number
    }>
}

interface PropertyContextValue {
    properties: Property[]
    selectedPropertyId: string | 'all'
    setSelectedPropertyId: (id: string | 'all') => void
    selectedProperty: Property | null
    /** true until the authoritative property list has been resolved (or failed). */
    loading: boolean
    /**
     * loading → not yet known; ready → `properties` is authoritative;
     * error → could not load (`properties` holds last-known data, if any).
     * Never treat `error` as "landlord has no properties".
     */
    status: LandlordSetupDataStatus
    /** Persistent setup signals (billing evidence, deferrals). null = unknown. */
    setupSignals: LandlordSetupSignals | null
    refreshProperties: () => Promise<void>
    /** Persist a "configure later" choice server-side so it survives logout and other devices. */
    updateSetupStep: (step: 'billing' | 'first_tenant', action: SetupStepAction) => Promise<void>
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

export type SetupStepAction = 'defer' | 'resume'

const PropertyContext = createContext<PropertyContextValue | undefined>(undefined)

const CACHE_KEY = 'iReside_cached_properties'
const CACHE_OWNER_KEY = 'iReside_cached_properties_owner'

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function PropertyProvider({ children }: { children: ReactNode }) {
    const { user, profile, loading: authLoading } = useAuth()
    const [properties, setProperties] = useState<Property[]>([])
    const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | 'all'>('all')
    const [status, setStatus] = useState<LandlordSetupDataStatus>('loading')
    const [setupSignals, setSetupSignals] = useState<LandlordSetupSignals | null>(null)
    const loadedForUserRef = useRef<string | null>(null)

    const userId = user?.id ?? null
    const role = profile?.role ?? null
    const hasProfile = Boolean(profile)

    // Restore the saved property selection after mount (avoids SSR hydration mismatch)
    useEffect(() => {
        try {
            const savedProp = localStorage.getItem('iReside_selected_property')
            if (savedProp) {
                setSelectedPropertyIdState(savedProp)
            }
        } catch {}
    }, [])

    const setSelectedPropertyId = useCallback((id: string | 'all') => {
        setSelectedPropertyIdState(id)
        if (typeof window !== 'undefined') {
            localStorage.setItem('iReside_selected_property', id)
        }
    }, [])

    const fetchProperties = useCallback(async () => {
        // Wait until the initial auth + profile check has resolved
        if (authLoading) return

        if (!userId) {
            loadedForUserRef.current = null
            setProperties([])
            setSetupSignals(null)
            setStatus('ready')
            return
        }

        // Signed in but the profile could not be loaded: the role is unknown, so the
        // property list is unknown too. Never collapse this into "no properties".
        if (!hasProfile) {
            setStatus('error')
            return
        }

        if (role !== 'landlord') {
            setProperties([])
            setSetupSignals(null)
            setStatus('ready')
            return
        }

        // First load for this account: show last-known data for the same user while
        // the authoritative request is in flight (display only; status stays "loading").
        if (loadedForUserRef.current !== userId) {
            loadedForUserRef.current = userId
            setStatus('loading')
            setSetupSignals(null)
            try {
                const owner = localStorage.getItem(CACHE_OWNER_KEY)
                const cached = owner === userId ? localStorage.getItem(CACHE_KEY) : null
                setProperties(cached ? JSON.parse(cached) : [])
            } catch {
                setProperties([])
            }
        }

        const [propertiesResult, signalsResult] = await Promise.allSettled([
            fetch('/api/landlord/property-units', { cache: 'no-store' }).then(async (res) => {
                if (!res.ok) throw new Error(`Failed to fetch properties (${res.status})`)
                const data = await res.json()
                return (data.properties || []) as Property[]
            }),
            fetch('/api/landlord/setup-status', { cache: 'no-store' }).then(async (res) => {
                if (!res.ok) throw new Error(`Failed to fetch setup status (${res.status})`)
                return (await res.json()) as LandlordSetupSignals
            }),
        ])

        // A newer account took over while this request was in flight
        if (loadedForUserRef.current !== userId) return

        // Setup signals are supplementary: on failure keep the previous value (null = unknown).
        if (signalsResult.status === 'fulfilled') {
            setSetupSignals(signalsResult.value)
        } else {
            console.warn('[PropertyContext] Setup status unavailable:', signalsResult.reason)
        }

        if (propertiesResult.status === 'rejected') {
            // Keep last-known properties and report "unknown" rather than "empty".
            console.error('[PropertyContext] Error fetching properties:', propertiesResult.reason)
            setStatus('error')
            return
        }

        const options = propertiesResult.value
        setProperties(options)
        setStatus('ready')

        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(options))
            localStorage.setItem(CACHE_OWNER_KEY, userId)
            // Keep the unit-map planner's per-property flag in sync with database evidence
            options.forEach((p) => {
                if (p.isMapSetupComplete || (p.placedCount ?? 0) > 0 || p.hasTenants) {
                    localStorage.setItem(`ireside_map_setup_complete_${p.id}`, 'true')
                }
                if (p.hasTenants) {
                    localStorage.setItem(`ireside.billing_rails_complete.${p.id}`, 'true')
                }
            })
            // Self-heal onboarding flags when database records confirm existing tenants
            if (options.some((p) => p.hasTenants)) {
                localStorage.setItem('ireside.billing_rails_complete', 'true')
                localStorage.setItem('ireside.onboarding_completed', 'true')
                localStorage.setItem('ireside.dashboard_tour_complete', 'true')
            }
        } catch {}

        // Auto-select or validate existing selection
        setSelectedPropertyIdState(currentId => {
            if (options.length === 0) return 'all'
            if (options.length === 1) {
                try { localStorage.setItem('iReside_selected_property', options[0].id) } catch {}
                return options[0].id
            }
            if (currentId !== 'all' && !options.some(p => p.id === currentId)) {
                // Current saved property ID no longer exists, default to first property
                const nextId = options[0]?.id || 'all'
                try { localStorage.setItem('iReside_selected_property', nextId) } catch {}
                return nextId
            }
            return currentId
        })
    }, [userId, role, hasProfile, authLoading])

    useEffect(() => {
        void fetchProperties()
    }, [fetchProperties])

    // Setup flows that write to the database (billing saved, map finished) refresh the authoritative state
    useEffect(() => {
        const handler = () => { void fetchProperties() }
        window.addEventListener('billing-rails-setup-completed', handler)
        window.addEventListener('unit-map-setup-completed', handler)
        return () => {
            window.removeEventListener('billing-rails-setup-completed', handler)
            window.removeEventListener('unit-map-setup-completed', handler)
        }
    }, [fetchProperties])

    const updateSetupStep = useCallback(async (step: 'billing' | 'first_tenant', action: SetupStepAction) => {
        const at = action === 'defer' ? new Date().toISOString() : null
        // Optimistic: reflect the choice immediately
        setSetupSignals(prev => {
            if (!prev) return prev
            return step === 'billing' ? { ...prev, billingDeferredAt: at } : { ...prev, tenantDeferredAt: at }
        })
        window.dispatchEvent(new CustomEvent(LANDLORD_SETUP_CHANGED_EVENT))
        try {
            const res = await fetch('/api/landlord/setup-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step, action }),
            })
            if (!res.ok) throw new Error(`Failed to save setup choice (${res.status})`)
        } catch (error) {
            // The local hint written by the caller still covers this session
            console.warn('[PropertyContext] Could not persist setup choice:', error)
        }
    }, [])

    const selectedProperty = selectedPropertyId === 'all'
        ? null
        : (properties.find(p => p.id === selectedPropertyId) || (properties.length > 0 ? properties[0] : null))

    const value: PropertyContextValue = {
        properties,
        selectedPropertyId,
        setSelectedPropertyId,
        selectedProperty,
        loading: status === 'loading',
        status,
        setupSignals,
        refreshProperties: fetchProperties,
        updateSetupStep,
    }

    return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useProperty(): PropertyContextValue {
    const ctx = useContext(PropertyContext)
    if (ctx === undefined) {
        throw new Error('useProperty must be used within a <PropertyProvider>')
    }
    return ctx
}

export function useOptionalProperty(): PropertyContextValue | null {
    const ctx = useContext(PropertyContext)
    return ctx ?? null
}
