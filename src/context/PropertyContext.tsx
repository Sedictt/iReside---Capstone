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
    const { user, profile } = useAuth()
    const [properties, setProperties] = useState<Property[]>([])
    const [selectedPropertyId, setSelectedPropertyIdState] = useState<string | 'all'>('all')
    const [loading, setLoading] = useState(true)

    // Load selected property from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('iReside_selected_property')
            if (saved) {
                setSelectedPropertyIdState(saved)
            }
        }
    }, [])

    const setSelectedPropertyId = useCallback((id: string | 'all') => {
        setSelectedPropertyIdState(id)
        if (typeof window !== 'undefined') {
            localStorage.setItem('iReside_selected_property', id)
        }
    }, [])

    const fetchProperties = useCallback(async () => {
        if (!user || profile?.role !== 'landlord') {
            setProperties([])
            setLoading(false)
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/landlord/listings')
            if (!res.ok) throw new Error('Failed to fetch properties')
            
            const data = await res.json()
            const options = (data.options || []) as Property[]
            setProperties(options)

            // Auto-select if only one property exists
            if (options.length === 1) {
                setSelectedPropertyId(options[0].id)
            } else if (selectedPropertyId !== 'all' && !options.find(p => p.id === selectedPropertyId)) {
                // If selected property is not in the list anymore (and not 'all'), reset to 'all'
                setSelectedPropertyId('all')
            }
        } catch (error) {
            console.error('[PropertyContext] Error fetching properties:', error)
        } finally {
            setLoading(false)
        }
    }, [user, profile?.role, selectedPropertyId, setSelectedPropertyId])

    useEffect(() => {
        void fetchProperties()
    }, [fetchProperties])

    const selectedProperty = selectedPropertyId === 'all' 
        ? null 
        : properties.find(p => p.id === selectedPropertyId) || null

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
