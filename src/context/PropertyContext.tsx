'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from 'react'
import { useAuth } from './AuthContext'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Property {
    id: string
    name: string
    address: string
    image: string | null
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
    loading: boolean
    refreshProperties: () => Promise<void>
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const PropertyContext = createContext<PropertyContextValue | undefined>(undefined)

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function PropertyProvider({ children }: { children: ReactNode }) {
    const { user, profile, loading: authLoading } = useAuth()
    const [properties, setProperties] = useState<Property[]>([])
    const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | 'all'>('all')
    const [loading, setLoading] = useState(true)

    // Hydrate cached preferences from localStorage after client mount to prevent SSR hydration mismatch
    useEffect(() => {
        try {
            const cached = localStorage.getItem('iReside_cached_properties')
            if (cached) {
                setProperties(JSON.parse(cached))
            }
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
        // Wait until initial auth check has resolved
        if (authLoading) return

        if (!user || profile?.role !== 'landlord') {
            setProperties([])
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/landlord/property-units')
            if (!res.ok) throw new Error('Failed to fetch properties')
            
            const data = await res.json()
            const options = (data.properties || []) as Property[]
            setProperties(options)

            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem('iReside_cached_properties', JSON.stringify(options))
                } catch {}
            }

            // Auto-select or validate existing selection
            setSelectedPropertyIdState(currentId => {
                if (options.length === 0) return 'all'
                if (options.length === 1) {
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('iReside_selected_property', options[0].id)
                    }
                    return options[0].id
                }
                if (currentId !== 'all' && !options.some(p => p.id === currentId)) {
                    // Current saved property ID no longer exists, default to first property or 'all'
                    const nextId = options[0]?.id || 'all'
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('iReside_selected_property', nextId)
                    }
                    return nextId
                }
                return currentId
            })
        } catch (error) {
            console.error('[PropertyContext] Error fetching properties:', error)
        } finally {
            setLoading(false)
        }
    }, [user?.id, profile?.role, authLoading])

    useEffect(() => {
        void fetchProperties()
    }, [fetchProperties])

    const selectedProperty = selectedPropertyId === 'all' 
        ? null 
        : (properties.find(p => p.id === selectedPropertyId) || (properties.length > 0 ? properties[0] : null))

    const value: PropertyContextValue = {
        properties,
        selectedPropertyId,
        setSelectedPropertyId,
        selectedProperty,
        loading,
        refreshProperties: fetchProperties,
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
