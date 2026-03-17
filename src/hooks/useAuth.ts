/**
 * Re-export useAuth from the centralized AuthContext.
 *
 * All components that previously imported from '@/hooks/useAuth'
 * will now consume the shared React Context instead of each one
 * independently fetching auth state.
 */
export { useAuth } from '@/context/AuthContext'
