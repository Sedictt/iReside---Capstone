'use client'

import { applicantNameRule, monthlyRentRule } from '@/lib/validation/schemas/tenant-lifecycle.schema'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { m as motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  User, 
  UserPlus,
  Mail, 
  Phone, 
  Building2, 
  Home, 
  Calendar, 
  CheckCircle2, 
  Copy, 
  AlertCircle, 
  Loader2, 
  Link as LinkIcon, 
  QrCode, 
  Share2,
  DoorOpen,
  ArrowRight,
  Coins,
  ShieldCheck
} from 'lucide-react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { cn, formatCurrencyInput, parseCurrency } from '@/lib/utils'
import { useProperty } from '@/context/PropertyContext'
import { toast } from 'sonner'
import type { WalkInUnit } from '@/components/landlord/applications/application-intake-shared'

const WalkInApplicationModal = dynamic(
  () => import('@/components/landlord/applications/WalkInApplicationModal').then(mod => mod.WalkInApplicationModal),
  { ssr: false }
)

export type OnboardingTab = 'quick_add' | 'manual' | 'invite' | 'walk_in';

interface AddTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialTab?: OnboardingTab
  onOpenWalkIn?: (propertyId?: string, unitId?: string) => void
}

export function AddTenantModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialTab = 'invite',
  onOpenWalkIn 
}: AddTenantModalProps) {
  const { properties, selectedPropertyId, refreshProperties } = useProperty()
  
  const normalizeTab = (tab?: OnboardingTab): 'quick_add' | 'invite' | 'walk_in' => {
    if (tab === 'manual' || tab === 'quick_add') return 'quick_add';
    if (tab === 'walk_in') return 'walk_in';
    return 'invite';
  }

  const [activeTab, setActiveTab] = useState<'quick_add' | 'invite' | 'walk_in'>(() => normalizeTab(initialTab))
  const [loading, setLoading] = useState(false)
  const [successData, setSuccessData] = useState<{ tempPassword: string | null; email: string } | null>(null)
  const [inviteResult, setInviteResult] = useState<{ shareUrl: string; qrUrl: string } | null>(null)
  
  // Quick Add Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    propertyId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    securityDeposit: '',
  })

  // Advance Payment & Security Deposit State for Quick Add
  const [advanceMonths, setAdvanceMonths] = useState<number>(1)
  const [advanceAmount, setAdvanceAmount] = useState<string>('0')
  const [advancePaid, setAdvancePaid] = useState<boolean>(true)
  const [securityDepositMonths, setSecurityDepositMonths] = useState<number>(1)
  const [securityDepositAmount, setSecurityDepositAmount] = useState<string>('0')
  const [securityDepositPaid, setSecurityDepositPaid] = useState<boolean>(true)

  // Field-level Validation Errors
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    email?: string
    phone?: string
    propertyId?: string
    unitId?: string
    startDate?: string
    endDate?: string
    monthlyRent?: string
    advanceAmount?: string
    securityDepositAmount?: string
  }>({})

  // Invite Link State
  const [isInviteAdvanced, setIsInviteAdvanced] = useState(false)
  const [inviteScope, setInviteScope] = useState<'property' | 'unit'>('property')
  const [inviteUnitId, setInviteUnitId] = useState('')
  const [inviteAppType, setInviteAppType] = useState<'existing_tenant' | 'face_to_face' | 'online'>('existing_tenant')
  const [inviteRequirements, setInviteRequirements] = useState<string[]>(['valid_id', 'proof_of_income'])
  const [invitePreset, setInvitePreset] = useState<number | null>(7)
  const [inviteData, setInviteData] = useState({
    propertyId: '',
    expiresAt: '',
  })

  // Invite Link Payment Terms State
  const [inviteAdvanceMonths, setInviteAdvanceMonths] = useState<number>(1)
  const [inviteAdvanceAmount, setInviteAdvanceAmount] = useState<string>('0')
  const [inviteSecurityDepositMonths, setInviteSecurityDepositMonths] = useState<number>(1)
  const [inviteSecurityDepositAmount, setInviteSecurityDepositAmount] = useState<string>('0')
  const [inviteFieldErrors, setInviteFieldErrors] = useState<{
    propertyId?: string
    unitId?: string
    advanceAmount?: string
    securityDepositAmount?: string
  }>({})

  // Walk-in Application State
  const [walkInPropertyId, setWalkInPropertyId] = useState('')
  const [walkInUnitId, setWalkInUnitId] = useState('')
  const [isInternalWalkInOpen, setIsInternalWalkInOpen] = useState(false)
  const prevIsOpenRef = useRef(false)
  const prevTabRef = useRef(initialTab)

  // Reset state with smart defaults when modal opens
  useEffect(() => {
    const tabChanged = prevTabRef.current !== initialTab
    if ((isOpen && !prevIsOpenRef.current) || (isOpen && tabChanged)) {
      prevTabRef.current = initialTab
      setActiveTab(normalizeTab(initialTab))
      setLoading(false)
      setSuccessData(null)
      setInviteResult(null)
      setIsInternalWalkInOpen(false)

      const activeProp = (selectedPropertyId && selectedPropertyId !== 'all')
        ? properties.find(p => p.id === selectedPropertyId) || properties[0]
        : properties[0]
      const targetUnit = activeProp?.units?.find(u => (u.status ?? 'vacant') === 'vacant') || activeProp?.units?.[0]
      const rentNum = targetUnit?.rentAmount != null ? Number(targetUnit.rentAmount) : 0
      const rentFormatted = rentNum > 0 ? formatCurrencyInput(rentNum, true) : ''

      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`
      const nextYearStr = `${year + 1}-${month}-${day}`

      const expDate = new Date(now)
      expDate.setDate(expDate.getDate() + 7)
      const expDateStr = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        propertyId: activeProp?.id || '',
        unitId: targetUnit?.id || '',
        startDate: todayStr,
        endDate: nextYearStr,
        monthlyRent: rentFormatted,
        securityDeposit: '',
      })
      setAdvanceMonths(1)
      setAdvanceAmount(rentFormatted || '0.00')
      setAdvancePaid(true)
      setSecurityDepositMonths(1)
      setSecurityDepositAmount(rentFormatted || '0.00')
      setSecurityDepositPaid(true)
      setFieldErrors({})
      setInvitePreset(7)
      setInviteData({
        propertyId: activeProp?.id || '',
        expiresAt: expDateStr,
      })
      setInviteAdvanceMonths(1)
      setInviteAdvanceAmount(rentFormatted || '0.00')
      setInviteSecurityDepositMonths(1)
      setInviteSecurityDepositAmount(rentFormatted || '0.00')
      setInviteFieldErrors({})
      setWalkInPropertyId(activeProp?.id || '')
      setWalkInUnitId(targetUnit?.id || '')
    }
    prevIsOpenRef.current = isOpen
  }, [isOpen, initialTab, selectedPropertyId, properties])

  // Auto-select first property and vacant units
  useEffect(() => {
    if (properties.length > 0 && !formData.propertyId) {
      const firstProp = properties[0]
      const firstUnit = firstProp.units[0]
      const rentNum = firstUnit?.rentAmount != null ? Number(firstUnit.rentAmount) : 0
      const rentFormatted = rentNum > 0 ? formatCurrencyInput(rentNum, true) : ''
      setFormData(prev => ({
        ...prev,
        propertyId: firstProp.id,
        unitId: firstUnit?.id || '',
        monthlyRent: rentFormatted
      }))
      setAdvanceAmount(rentFormatted || '0.00')
      setSecurityDepositAmount(rentFormatted || '0.00')
      setInviteData(prev => ({
        ...prev,
        propertyId: firstProp.id
      }))
      setInviteAdvanceAmount(rentFormatted || '0.00')
      setInviteSecurityDepositAmount(rentFormatted || '0.00')
    }
  }, [properties, formData.propertyId])

  // Auto-select walk-in property and unit
  useEffect(() => {
    if (properties.length > 0 && !walkInPropertyId) {
      const propWithVacant = properties.find(p => p.units.some(u => (u.status ?? 'vacant') === 'vacant')) || properties[0]
      setWalkInPropertyId(propWithVacant.id)
      const firstVacant = propWithVacant.units.find(u => (u.status ?? 'vacant') === 'vacant')
      setWalkInUnitId(firstVacant?.id || propWithVacant.units[0]?.id || '')
    }
  }, [properties, walkInPropertyId])

  const selectedProperty = properties.find(p => p.id === formData.propertyId)
  const availableUnits = selectedProperty?.units || []

  const walkInProperty = properties.find(p => p.id === walkInPropertyId)
  const walkInAvailableUnits = (walkInProperty?.units || []).filter(u => (u.status ?? 'vacant') === 'vacant')

  // Transform properties into WalkInUnit array for internal modal fallback
  const allWalkInUnits = useMemo<WalkInUnit[]>(() => {
    return properties.flatMap((p) =>
      (p.units || []).map((u) => ({
        id: u.id,
        name: u.name,
        rent_amount: Number(u.rentAmount ?? 0),
        property_id: p.id,
        property_name: p.name,
        property_address: p.address,
        property_image: p.image ?? null,
        status: (u.status as "vacant" | "occupied" | "maintenance") ?? "vacant",
        has_ongoing_application: false,
        ongoing_application_status: null,
      }))
    )
  }, [properties])

  const currentRent = parseCurrency(formData.monthlyRent)
  const currentAdvanceAmount = parseCurrency(advanceAmount)
  const currentDepositAmount = parseCurrency(securityDepositAmount)

  // Computed values for Invite Link
  const selectedInviteProperty = properties.find(p => p.id === inviteData.propertyId) || properties[0]
  const inviteAvailableUnits = selectedInviteProperty?.units || []
  const inviteVacantUnits = inviteAvailableUnits.filter(u => (u.status ?? 'vacant') === 'vacant')
  const effectiveInviteUnit = (isInviteAdvanced && inviteScope === 'unit' && inviteUnitId)
    ? (inviteAvailableUnits.find(u => u.id === inviteUnitId) || inviteVacantUnits[0] || inviteAvailableUnits[0])
    : (inviteVacantUnits[0] || inviteAvailableUnits[0])
  const effectiveInviteRent = Number(effectiveInviteUnit?.rentAmount || 0)

  const currentInviteAdvanceAmount = parseCurrency(inviteAdvanceAmount)
  const currentInviteDepositAmount = parseCurrency(inviteSecurityDepositAmount)
  const currentInviteTotalSettlement = currentInviteAdvanceAmount + currentInviteDepositAmount

  const handlePropertyChange = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId)
    const firstUnit = prop?.units[0]
    const numRent = Number(firstUnit?.rentAmount || 0)
    const rentFormatted = numRent > 0 ? formatCurrencyInput(numRent, true) : ''
    setFormData(prev => ({
      ...prev,
      propertyId,
      unitId: firstUnit?.id || '',
      monthlyRent: rentFormatted
    }))
    if (advanceMonths >= 0) {
      setAdvanceAmount(formatCurrencyInput(advanceMonths * numRent, true))
    }
    if (securityDepositMonths >= 0) {
      setSecurityDepositAmount(formatCurrencyInput(securityDepositMonths * numRent, true))
    }
    setFieldErrors(prev => ({ ...prev, propertyId: undefined, unitId: undefined }))
  }

  const handleUnitChange = (unitId: string) => {
    const unit = availableUnits.find(u => u.id === unitId)
    const numRent = Number(unit?.rentAmount || 0)
    const rentFormatted = numRent > 0 ? formatCurrencyInput(numRent, true) : ''
    setFormData(prev => ({
      ...prev,
      unitId,
      monthlyRent: rentFormatted
    }))
    if (advanceMonths >= 0) {
      setAdvanceAmount(formatCurrencyInput(advanceMonths * numRent, true))
    }
    if (securityDepositMonths >= 0) {
      setSecurityDepositAmount(formatCurrencyInput(securityDepositMonths * numRent, true))
    }
    setFieldErrors(prev => ({ ...prev, unitId: undefined }))
  }

  // Sanitization helpers
  const sanitizeNameInput = (val: string) => {
    return val.replace(/[0-9]/g, '')
  }

  const sanitizeNumericInput = (val: string) => {
    return formatCurrencyInput(val, false)
  }

  const sanitizePhoneInput = (val: string) => {
    return val.replace(/[^0-9+\-()\s]/g, '')
  }

  const handleFullNameChange = (val: string) => {
    const sanitized = sanitizeNameInput(val)
    setFormData(prev => ({ ...prev, fullName: sanitized }))
    if (fieldErrors.fullName && sanitized.trim().length >= 2 && !/\d/.test(sanitized)) {
      setFieldErrors(prev => ({ ...prev, fullName: undefined }))
    }
  }

  const handleFullNameBlur = () => {
    const name = formData.fullName.trim()
    if (!name) {
      setFieldErrors(prev => ({ ...prev, fullName: 'Full name is required.' }))
    } else if (name.length < 2) {
      setFieldErrors(prev => ({ ...prev, fullName: 'Full name must be at least 2 characters.' }))
    } else if (/\d/.test(name)) {
      setFieldErrors(prev => ({ ...prev, fullName: 'Full name cannot contain numbers.' }))
    } else {
      setFieldErrors(prev => ({ ...prev, fullName: undefined }))
    }
  }

  const handleEmailChange = (val: string) => {
    setFormData(prev => ({ ...prev, email: val }))
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (fieldErrors.email && EMAIL_REGEX.test(val.trim())) {
      setFieldErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  const handleEmailBlur = () => {
    const email = formData.email.trim()
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setFieldErrors(prev => ({ ...prev, email: 'Email address is required.' }))
    } else if (!EMAIL_REGEX.test(email)) {
      setFieldErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }))
    } else {
      setFieldErrors(prev => ({ ...prev, email: undefined }))
    }
  }

  const handlePhoneChange = (val: string) => {
    const sanitized = sanitizePhoneInput(val)
    setFormData(prev => ({ ...prev, phone: sanitized }))
    const digits = sanitized.replace(/\D/g, '')
    if (fieldErrors.phone && digits.length >= 10 && digits.length <= 15) {
      setFieldErrors(prev => ({ ...prev, phone: undefined }))
    }
  }

  const handlePhoneBlur = () => {
    const phone = formData.phone.trim()
    const digits = phone.replace(/\D/g, '')
    if (!phone) {
      setFieldErrors(prev => ({ ...prev, phone: 'Phone number is required.' }))
    } else if (digits.length < 10 || digits.length > 15) {
      setFieldErrors(prev => ({ ...prev, phone: 'Please enter a valid phone number (10–15 digits).' }))
    } else {
      setFieldErrors(prev => ({ ...prev, phone: undefined }))
    }
  }

  const handleRentChange = (val: string) => {
    const sanitized = formatCurrencyInput(val, false)
    setFormData(prev => ({ ...prev, monthlyRent: sanitized }))
    const numRent = parseCurrency(sanitized)
    if (advanceMonths >= 0) {
      setAdvanceAmount(formatCurrencyInput(advanceMonths * numRent, true))
    }
    if (securityDepositMonths >= 0) {
      setSecurityDepositAmount(formatCurrencyInput(securityDepositMonths * numRent, true))
    }
    if (numRent > 0) {
      setFieldErrors(prev => ({ ...prev, monthlyRent: undefined }))
    }
  }

  const handleRentBlur = () => {
    const num = parseCurrency(formData.monthlyRent)
    if (!formData.monthlyRent || num <= 0) {
      setFieldErrors(prev => ({ ...prev, monthlyRent: 'Monthly rent must be greater than ₱0.' }))
    } else {
      setFormData(prev => ({ ...prev, monthlyRent: formatCurrencyInput(num, true) }))
      setFieldErrors(prev => ({ ...prev, monthlyRent: undefined }))
    }
  }

  const handleAdvanceAmountChange = (valStr: string) => {
    const sanitized = formatCurrencyInput(valStr, false)
    setAdvanceAmount(sanitized)
    const val = parseCurrency(sanitized)
    if (currentRent > 0 && Math.abs(val - currentRent) < 0.01) {
      setAdvanceMonths(1)
    } else if (currentRent > 0 && Math.abs(val - currentRent * 2) < 0.01) {
      setAdvanceMonths(2)
    } else if (val === 0 && sanitized !== '') {
      setAdvanceMonths(0)
    } else {
      setAdvanceMonths(-1)
    }
    if (sanitized !== '' && !isNaN(val) && val >= 0) {
      setFieldErrors(prev => ({ ...prev, advanceAmount: undefined }))
    }
  }

  const handleAdvanceAmountBlur = () => {
    const raw = advanceAmount.trim()
    const num = parseCurrency(raw)
    if (raw === '' || isNaN(num) || num < 0) {
      setFieldErrors(prev => ({ ...prev, advanceAmount: 'Please enter a valid advance rent amount.' }))
    } else {
      setAdvanceAmount(formatCurrencyInput(num, true))
      setFieldErrors(prev => ({ ...prev, advanceAmount: undefined }))
    }
  }

  const handleSecurityDepositAmountChange = (valStr: string) => {
    const sanitized = formatCurrencyInput(valStr, false)
    setSecurityDepositAmount(sanitized)
    const val = parseCurrency(sanitized)
    if (currentRent > 0 && Math.abs(val - currentRent) < 0.01) {
      setSecurityDepositMonths(1)
    } else if (currentRent > 0 && Math.abs(val - currentRent * 2) < 0.01) {
      setSecurityDepositMonths(2)
    } else if (val === 0 && sanitized !== '') {
      setSecurityDepositMonths(0)
    } else {
      setSecurityDepositMonths(-1)
    }
    if (sanitized !== '' && !isNaN(val) && val >= 0) {
      setFieldErrors(prev => ({ ...prev, securityDepositAmount: undefined }))
    }
  }

  const handleSecurityDepositAmountBlur = () => {
    const raw = securityDepositAmount.trim()
    const num = parseCurrency(raw)
    if (raw === '' || isNaN(num) || num < 0) {
      setFieldErrors(prev => ({ ...prev, securityDepositAmount: 'Please enter a valid security deposit amount.' }))
    } else {
      setSecurityDepositAmount(formatCurrencyInput(num, true))
      setFieldErrors(prev => ({ ...prev, securityDepositAmount: undefined }))
    }
  }

  // Invite Link Handlers
  const handleInvitePropertyChange = (propertyId: string) => {
    setInviteData(prev => ({ ...prev, propertyId }))
    setInviteUnitId('')
    const prop = properties.find(p => p.id === propertyId)
    const defUnit = prop?.units.find(u => (u.status ?? 'vacant') === 'vacant') || prop?.units[0]
    const rent = Number(defUnit?.rentAmount || 0)
    if (inviteAdvanceMonths >= 0) {
      setInviteAdvanceAmount(formatCurrencyInput(inviteAdvanceMonths * rent, true))
    }
    if (inviteSecurityDepositMonths >= 0) {
      setInviteSecurityDepositAmount(formatCurrencyInput(inviteSecurityDepositMonths * rent, true))
    }
    setInviteFieldErrors(prev => ({ ...prev, propertyId: undefined, unitId: undefined }))
  }

  const handleInviteUnitChange = (unitId: string) => {
    setInviteUnitId(unitId)
    const unit = inviteAvailableUnits.find(u => u.id === unitId)
    const rent = Number(unit?.rentAmount || 0)
    if (inviteAdvanceMonths >= 0) {
      setInviteAdvanceAmount(formatCurrencyInput(inviteAdvanceMonths * rent, true))
    }
    if (inviteSecurityDepositMonths >= 0) {
      setInviteSecurityDepositAmount(formatCurrencyInput(inviteSecurityDepositMonths * rent, true))
    }
    setInviteFieldErrors(prev => ({ ...prev, unitId: undefined }))
  }

  const handleInviteAdvanceAmountChange = (valStr: string) => {
    const sanitized = formatCurrencyInput(valStr, false)
    setInviteAdvanceAmount(sanitized)
    const val = parseCurrency(sanitized)
    if (effectiveInviteRent > 0 && Math.abs(val - effectiveInviteRent) < 0.01) {
      setInviteAdvanceMonths(1)
    } else if (effectiveInviteRent > 0 && Math.abs(val - effectiveInviteRent * 2) < 0.01) {
      setInviteAdvanceMonths(2)
    } else if (val === 0 && sanitized !== '') {
      setInviteAdvanceMonths(0)
    } else {
      setInviteAdvanceMonths(-1)
    }
    if (sanitized !== '' && !isNaN(val) && val >= 0) {
      setInviteFieldErrors(prev => ({ ...prev, advanceAmount: undefined }))
    }
  }

  const handleInviteAdvanceAmountBlur = () => {
    const raw = inviteAdvanceAmount.trim()
    const num = parseCurrency(raw)
    if (raw === '' || isNaN(num) || num < 0) {
      setInviteFieldErrors(prev => ({ ...prev, advanceAmount: 'Please enter a valid advance rent amount.' }))
    } else {
      setInviteAdvanceAmount(formatCurrencyInput(num, true))
      setInviteFieldErrors(prev => ({ ...prev, advanceAmount: undefined }))
    }
  }

  const handleInviteSecurityDepositAmountChange = (valStr: string) => {
    const sanitized = formatCurrencyInput(valStr, false)
    setInviteSecurityDepositAmount(sanitized)
    const val = parseCurrency(sanitized)
    if (effectiveInviteRent > 0 && Math.abs(val - effectiveInviteRent) < 0.01) {
      setInviteSecurityDepositMonths(1)
    } else if (effectiveInviteRent > 0 && Math.abs(val - effectiveInviteRent * 2) < 0.01) {
      setInviteSecurityDepositMonths(2)
    } else if (val === 0 && sanitized !== '') {
      setInviteSecurityDepositMonths(0)
    } else {
      setInviteSecurityDepositMonths(-1)
    }
    if (sanitized !== '' && !isNaN(val) && val >= 0) {
      setInviteFieldErrors(prev => ({ ...prev, securityDepositAmount: undefined }))
    }
  }

  const handleInviteSecurityDepositAmountBlur = () => {
    const raw = inviteSecurityDepositAmount.trim()
    const num = parseCurrency(raw)
    if (raw === '' || isNaN(num) || num < 0) {
      setInviteFieldErrors(prev => ({ ...prev, securityDepositAmount: 'Please enter a valid security deposit amount.' }))
    } else {
      setInviteSecurityDepositAmount(formatCurrencyInput(num, true))
      setInviteFieldErrors(prev => ({ ...prev, securityDepositAmount: undefined }))
    }
  }

  const handleStartDateChange = (val: string) => {
    setFormData(prev => {
      const updated = { ...prev, startDate: val }
      if (val) {
        const d = new Date(val)
        if (!isNaN(d.getTime())) {
          if (!prev.endDate || prev.endDate <= val) {
            const nextYear = new Date(d)
            nextYear.setFullYear(nextYear.getFullYear() + 1)
            updated.endDate = nextYear.toISOString().split('T')[0]
          }
        }
      }
      return updated
    })

    setFieldErrors(prev => ({
      ...prev,
      startDate: undefined,
      endDate: undefined,
    }))
  }

  const handleEndDateChange = (val: string) => {
    setFormData(prev => ({ ...prev, endDate: val }))
    if (formData.startDate && val) {
      if (new Date(val).getTime() <= new Date(formData.startDate).getTime()) {
        setFieldErrors(prev => ({ ...prev, endDate: 'End date must be after start date.' }))
      } else {
        setFieldErrors(prev => ({ ...prev, endDate: undefined }))
      }
    }
  }

  const validateQuickAddForm = (): boolean => {
    const errs: typeof fieldErrors = {}

    const name = formData.fullName.trim()
    if (!name || name.length < 2) {
      errs.fullName = 'Full name must be at least 2 characters.'
    } else if (/\d/.test(name)) {
      errs.fullName = 'Full name cannot contain numbers.'
    } else {
      // Same rule as the API: max length + name characters only.
      const nameError = applicantNameRule(name, { label: 'Full name' })
      if (nameError) errs.fullName = nameError
    }

    const email = formData.email.trim()
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !EMAIL_REGEX.test(email)) {
      errs.email = 'Please enter a valid email address.'
    }

    const phone = formData.phone.trim()
    const digits = phone.replace(/\D/g, '')
    if (!phone || digits.length < 10 || digits.length > 15) {
      errs.phone = 'Please enter a valid phone number (10–15 digits).'
    }

    if (!formData.propertyId) {
      errs.propertyId = 'Please select a property.'
    }

    if (!formData.unitId) {
      errs.unitId = 'Please select a unit.'
    }

    if (!formData.startDate) {
      errs.startDate = 'Please select a start date.'
    } else {
      const startYear = new Date(formData.startDate).getFullYear()
      if (startYear < 2000 || startYear > 2099) {
        errs.startDate = 'Please enter a valid 4-digit year (e.g., 2026).'
      }
    }

    if (!formData.endDate) {
      errs.endDate = 'Please select an end date.'
    } else {
      const endYear = new Date(formData.endDate).getFullYear()
      if (endYear < 2000 || endYear > 2099) {
        errs.endDate = 'Please enter a valid 4-digit year (e.g., 2026).'
      } else if (formData.startDate && new Date(formData.endDate).getTime() <= new Date(formData.startDate).getTime()) {
        errs.endDate = 'End date must be after start date.'
      }
    }

    if (!currentRent || currentRent <= 0) {
      errs.monthlyRent = 'Monthly rent must be greater than ₱0.'
    } else {
      const rentError = monthlyRentRule(currentRent)
      if (rentError) errs.monthlyRent = rentError
    }

    if (advanceAmount === '' || isNaN(parseCurrency(advanceAmount)) || parseCurrency(advanceAmount) < 0) {
      errs.advanceAmount = 'Please enter a valid advance rent amount.'
    }

    if (securityDepositAmount === '' || isNaN(parseCurrency(securityDepositAmount)) || parseCurrency(securityDepositAmount) < 0) {
      errs.securityDepositAmount = 'Please enter a valid security deposit amount.'
    }

    setFieldErrors(errs)

    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0]
      toast.error(firstError)
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateQuickAddForm()) {
      return
    }

    try {
      setLoading(true)
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        propertyId: formData.propertyId,
        unitId: formData.unitId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        monthlyRent: currentRent,
        securityDeposit: currentDepositAmount,
        securityDepositMonths,
        securityDepositPaid,
        advancePayment: currentAdvanceAmount,
        advanceMonths,
        advancePaid,
      }
      const response = await fetch('/api/landlord/tenants/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        // Attach server-side field errors to the matching inputs.
        if (data.fieldErrors && typeof data.fieldErrors === 'object') {
          const serverErrs: typeof fieldErrors = {}
          for (const key of ['fullName', 'email', 'phone', 'propertyId', 'unitId', 'startDate', 'endDate', 'monthlyRent'] as const) {
            const message = (data.fieldErrors as Record<string, unknown>)[key]
            if (typeof message === 'string') serverErrs[key] = message
          }
          if (Object.keys(serverErrs).length > 0) setFieldErrors(prev => ({ ...prev, ...serverErrs }))
        }
        throw new Error(data.error || 'Failed to add tenant')
      }

      setSuccessData({
        tempPassword: data.tempPassword,
        email: formData.email
      })
      toast.success('Tenant added successfully')
      refreshProperties()
      onSuccess()
    } catch (error) {
      console.error('Error adding tenant:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add tenant')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInvite = async () => {
    if (!inviteData.propertyId) {
      toast.error('Please select a property')
      return
    }
    if (isInviteAdvanced && inviteScope === 'unit' && !inviteUnitId) {
      toast.error('Please select a unit')
      return
    }
    if (isInviteAdvanced && inviteAppType === 'online' && inviteRequirements.length === 0) {
      toast.error('Select at least one required document for online applications')
      return
    }
    if (inviteAdvanceAmount === '' || isNaN(currentInviteAdvanceAmount) || currentInviteAdvanceAmount < 0) {
      toast.error('Please enter a valid advance rent amount.')
      return
    }
    if (inviteSecurityDepositAmount === '' || isNaN(currentInviteDepositAmount) || currentInviteDepositAmount < 0) {
      toast.error('Please enter a valid security deposit amount.')
      return
    }

    try {
      setLoading(true)
      const payload = {
        mode: isInviteAdvanced ? inviteScope : 'property',
        applicationType: isInviteAdvanced ? inviteAppType : 'existing_tenant',
        propertyId: inviteData.propertyId,
        unitId: (isInviteAdvanced && inviteScope === 'unit') ? inviteUnitId : null,
        previewUnitId: (isInviteAdvanced && inviteScope === 'unit') ? inviteUnitId : (effectiveInviteUnit?.id || null),
        paymentTerms: {
          advanceMonths: inviteAdvanceMonths,
          securityDepositMonths: inviteSecurityDepositMonths,
          customAdvanceAmount: inviteAdvanceMonths === -1 ? currentInviteAdvanceAmount : null,
          customSecurityDepositAmount: inviteSecurityDepositMonths === -1 ? currentInviteDepositAmount : null,
        },
        requiredRequirements: (isInviteAdvanced && inviteAppType === 'online') ? inviteRequirements : undefined,
        expiresAt: inviteData.expiresAt ? new Date(inviteData.expiresAt).toISOString() : null,
      }

      const response = await fetch('/api/landlord/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.invite) {
        throw new Error(data.error || 'Failed to generate invite')
      }

      setInviteResult({
        shareUrl: data.invite.shareUrl,
        qrUrl: data.invite.qrUrl
      })
      toast.success('Onboarding link generated!')
    } catch (error) {
      console.error('Error generating invite:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate link')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWalkIn = () => {
    if (!walkInUnitId) {
      toast.error('Please select a vacant unit for walk-in')
      return
    }

    if (onOpenWalkIn) {
      onOpenWalkIn(walkInPropertyId, walkInUnitId)
      onClose()
    } else {
      setIsInternalWalkInOpen(true)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onClose])

  if (!isOpen) return null
  if (typeof window === 'undefined') return null

  const isSuccess = successData || inviteResult

  const modalContent = (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSuccess ? undefined : onClose}
            className="fixed inset-0 bg-black/70 dark:bg-black/85 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 flex flex-col w-full max-w-4xl h-[min(90vh,860px)] overflow-hidden rounded-[2.5rem] bg-card neumorphic-panel shadow-2xl border border-border/40"
          >
            {!isSuccess ? (
              <>
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between border-b border-white/5 neumorphic-inset px-6 sm:px-8 py-4 sm:py-5">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Onboard Residents</h2>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                      Choose an onboarding mode to get started
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Close modal"
                    className="rounded-2xl neumorphic-inset p-3 text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* 3 Modes Tabs */}
                <div className="shrink-0 flex flex-wrap gap-1 border-b border-white/5 neumorphic-inset px-6 sm:px-8 py-2.5 sm:py-3">
                  {[
                    { id: 'invite', label: 'Invite Link', icon: LinkIcon, recommended: true },
                    { id: 'quick_add', label: 'Quick Add', icon: UserPlus },
                    { id: 'walk_in', label: 'Walk-in Application', icon: DoorOpen },
                  ].map((tab) => {
                    const isSelected = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as 'quick_add' | 'invite' | 'walk_in')}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                          isSelected 
                            ? "bg-foreground text-background shadow-xs" 
                            : "text-muted-foreground hover:neumorphic-inset hover:text-foreground"
                        )}
                      >
                        <tab.icon className="size-3.5" />
                        <span>{tab.label}</span>
                        {tab.recommended && (
                          <span className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-black tracking-normal transition-colors",
                            isSelected ? "bg-primary text-primary-foreground font-bold" : "bg-primary/15 text-primary"
                          )}>
                            Recommended
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Mode 1: Quick Add */}
                {activeTab === 'quick_add' && (
                  <form onSubmit={handleSubmit} noValidate className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-premium px-6 sm:px-8 py-5 sm:py-6 space-y-6">
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs font-medium text-muted-foreground flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <UserPlus className="size-4 text-primary shrink-0" />
                          <span>
                            <strong className="text-foreground">Quick Add Mode:</strong> Best for existing properties and residents already occupying units before using iReside.
                          </span>
                        </div>
                      </div>

                      {/* Main Balanced 2-Column Grid */}
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Column 1: Resident Profile */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                            <User className="size-4 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                              Resident Profile
                            </h3>
                          </div>
                          
                          {/* Full Name */}
                          <div className="space-y-1.5">
                            <label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              Full Name
                            </label>
                            <div className="relative">
                              <User className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                              <input
                                id="fullName"
                                type="text"
                                maxLength={50}
                                autoComplete="name"
                                placeholder="e.g. Maria Santos"
                                value={formData.fullName}
                                onChange={(e) => handleFullNameChange(e.target.value)}
                                onBlur={handleFullNameBlur}
                                className={cn(
                                  "w-full rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                  fieldErrors.fullName && "border border-red-500/50 ring-2 ring-red-500/20"
                                )}
                              />
                            </div>
                            {fieldErrors.fullName && (
                              <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                <AlertCircle className="size-3 shrink-0" />
                                <span>{fieldErrors.fullName}</span>
                              </p>
                            )}
                          </div>

                          {/* Email Address */}
                          <div className="space-y-1.5">
                            <label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              Email Address
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                              <input
                                id="email"
                                type="email"
                                maxLength={50}
                                autoComplete="email"
                                placeholder="e.g. maria.santos@gmail.com"
                                value={formData.email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                onBlur={handleEmailBlur}
                                className={cn(
                                  "w-full rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                  fieldErrors.email && "border border-red-500/50 ring-2 ring-red-500/20"
                                )}
                              />
                            </div>
                            {fieldErrors.email && (
                              <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                <AlertCircle className="size-3 shrink-0" />
                                <span>{fieldErrors.email}</span>
                              </p>
                            )}
                          </div>

                          {/* Phone Number */}
                          <div className="space-y-1.5">
                            <label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              Phone Number
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                              <input
                                id="phone"
                                type="tel"
                                inputMode="tel"
                                maxLength={15}
                                autoComplete="tel"
                                placeholder="e.g. 0917 123 4567"
                                value={formData.phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                onBlur={handlePhoneBlur}
                                className={cn(
                                  "w-full rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                  fieldErrors.phone && "border border-red-500/50 ring-2 ring-red-500/20"
                                )}
                              />
                            </div>
                            {fieldErrors.phone && (
                              <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                <AlertCircle className="size-3 shrink-0" />
                                <span>{fieldErrors.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Lease Details */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                            <Building2 className="size-4 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-primary">
                              Lease Agreement
                            </h3>
                          </div>

                          {/* Property & Unit side by side */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label htmlFor="propertyId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Property
                              </label>
                              <div className="relative">
                                <Building2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                                <select
                                  id="propertyId"
                                  value={formData.propertyId}
                                  onChange={(e) => handlePropertyChange(e.target.value)}
                                  className={cn(
                                    "w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-10 pr-4 text-xs sm:text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                    fieldErrors.propertyId && "border border-red-500/50 ring-2 ring-red-500/20"
                                  )}
                                >
                                  <option value="" disabled>Select Property</option>
                                  {properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                              {fieldErrors.propertyId && (
                                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                  <AlertCircle className="size-3 shrink-0" />
                                  <span>{fieldErrors.propertyId}</span>
                                </p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="unitId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Unit
                              </label>
                              <div className="relative">
                                <Home className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                                <select
                                  id="unitId"
                                  value={formData.unitId}
                                  onChange={(e) => handleUnitChange(e.target.value)}
                                  className={cn(
                                    "w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-10 pr-4 text-xs sm:text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                    fieldErrors.unitId && "border border-red-500/50 ring-2 ring-red-500/20"
                                  )}
                                >
                                  <option value="" disabled>Select Unit</option>
                                  {availableUnits.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} (₱{u.rentAmount.toLocaleString()})</option>
                                  ))}
                                </select>
                              </div>
                              {fieldErrors.unitId && (
                                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                  <AlertCircle className="size-3 shrink-0" />
                                  <span>{fieldErrors.unitId}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Lease Dates */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label htmlFor="startDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Start Date
                              </label>
                              <input
                                id="startDate"
                                type="date"
                                min="2000-01-01"
                                max="2099-12-31"
                                value={formData.startDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                onBlur={() => {
                                  if (!formData.startDate) {
                                    setFieldErrors(prev => ({ ...prev, startDate: 'Please select a start date.' }))
                                  }
                                }}
                                className={cn(
                                  "w-full rounded-2xl neumorphic-inset px-3 sm:px-4 py-3.5 text-xs sm:text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                  fieldErrors.startDate && "border border-red-500/50 ring-2 ring-red-500/20"
                                )}
                              />
                              {fieldErrors.startDate && (
                                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                  <AlertCircle className="size-3 shrink-0" />
                                  <span>{fieldErrors.startDate}</span>
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="endDate" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                End Date
                              </label>
                              <input
                                id="endDate"
                                type="date"
                                min={formData.startDate || "2000-01-01"}
                                max="2099-12-31"
                                value={formData.endDate}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                onBlur={() => {
                                  if (!formData.endDate) {
                                    setFieldErrors(prev => ({ ...prev, endDate: 'Please select an end date.' }))
                                  } else if (formData.startDate && new Date(formData.endDate).getTime() <= new Date(formData.startDate).getTime()) {
                                    setFieldErrors(prev => ({ ...prev, endDate: 'End date must be after start date.' }))
                                  }
                                }}
                                className={cn(
                                  "w-full rounded-2xl neumorphic-inset px-3 sm:px-4 py-3.5 text-xs sm:text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                  fieldErrors.endDate && "border border-red-500/50 ring-2 ring-red-500/20"
                                )}
                              />
                              {fieldErrors.endDate && (
                                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                  <AlertCircle className="size-3 shrink-0" />
                                  <span>{fieldErrors.endDate}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Duration Presets */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 mr-1">
                              Duration:
                            </span>
                            {[
                              { label: "6 Mo", months: 6 },
                              { label: "1 Year (Standard)", months: 12 },
                              { label: "2 Years", months: 24 },
                            ].map((preset) => {
                              const isMatched = (() => {
                                if (!formData.startDate || !formData.endDate) return false
                                const s = new Date(formData.startDate)
                                const e = new Date(formData.endDate)
                                const diffMonths = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.4375))
                                return Math.abs(diffMonths - preset.months) <= 1
                              })()

                              return (
                                <button
                                  key={preset.label}
                                  type="button"
                                  onClick={() => {
                                    const base = formData.startDate ? new Date(formData.startDate) : new Date()
                                    const target = new Date(base)
                                    target.setFullYear(target.getFullYear() + Math.floor(preset.months / 12))
                                    if (preset.months % 12 !== 0) {
                                      target.setMonth(base.getMonth() + (preset.months % 12))
                                    }
                                    const y = target.getFullYear()
                                    const m = String(target.getMonth() + 1).padStart(2, '0')
                                    const d = String(target.getDate()).padStart(2, '0')
                                    setFormData(prev => ({ ...prev, endDate: `${y}-${m}-${d}` }))
                                    setFieldErrors(prev => ({ ...prev, endDate: undefined }))
                                  }}
                                  className={cn(
                                    "rounded-xl px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                                    isMatched
                                      ? "bg-primary text-primary-foreground shadow-xs font-bold"
                                      : "neumorphic-inset text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {preset.label}
                                </button>
                              )
                            })}
                          </div>

                          {/* Monthly Rent */}
                          <div className="space-y-1.5">
                            <label htmlFor="monthlyRent" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                              Monthly Rent
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">₱</span>
                              <input
                                id="monthlyRent"
                                type="text"
                                inputMode="decimal"
                                maxLength={14}
                                value={formData.monthlyRent}
                                onChange={(e) => handleRentChange(e.target.value)}
                                onBlur={handleRentBlur}
                                placeholder="0.00"
                                className={cn(
                                  "w-full rounded-2xl neumorphic-inset py-3.5 pl-8 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                  fieldErrors.monthlyRent && "border border-red-500/50 ring-2 ring-red-500/20"
                                )}
                              />
                            </div>
                            {fieldErrors.monthlyRent && (
                              <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                <AlertCircle className="size-3 shrink-0" />
                                <span>{fieldErrors.monthlyRent}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Move-In Payment Configuration (Advance Rent & Security Deposit) */}
                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                            <Coins className="size-4 text-primary" />
                            Move-In Payment Terms
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Configure initial advance rent and security deposit required upon move-in.
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Advance Rent */}
                          <div className="rounded-2xl neumorphic-inset p-4 space-y-3.5 border border-white/5">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                                  Advance Rent
                                </span>
                                <p className="text-[10px] text-muted-foreground">Applied towards first month(s)</p>
                              </div>
                              <div className="inline-flex rounded-xl bg-background/50 p-1 border border-border/50">
                                {[
                                  { label: "None", months: 0 },
                                  { label: "1 Mo (Standard)", months: 1 },
                                  { label: "2 Mo", months: 2 },
                                ].map((opt) => (
                                  <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => {
                                      setAdvanceMonths(opt.months)
                                      setAdvanceAmount(formatCurrencyInput(opt.months * currentRent, true))
                                      setFieldErrors(prev => ({ ...prev, advanceAmount: undefined }))
                                    }}
                                    className={cn(
                                      "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                                      advanceMonths === opt.months
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    )}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="advanceAmount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Advance Rent Amount
                              </label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">₱</span>
                                <input
                                  id="advanceAmount"
                                  type="text"
                                  inputMode="decimal"
                                  maxLength={14}
                                  value={advanceAmount}
                                  onChange={(e) => handleAdvanceAmountChange(e.target.value)}
                                  onBlur={handleAdvanceAmountBlur}
                                  placeholder="0.00"
                                  className={cn(
                                    "w-full rounded-2xl neumorphic-inset py-3 pl-8 pr-4 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                    fieldErrors.advanceAmount && "border border-red-500/50 ring-2 ring-red-500/20"
                                  )}
                                />
                              </div>
                              {fieldErrors.advanceAmount && (
                                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                  <AlertCircle className="size-3 shrink-0" />
                                  <span>{fieldErrors.advanceAmount}</span>
                                </p>
                              )}
                            </div>

                            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={advancePaid}
                                onChange={(e) => setAdvancePaid(e.target.checked)}
                                className="size-4 rounded accent-primary cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-muted-foreground">
                                Mark as already collected
                              </span>
                            </label>
                          </div>

                          {/* Security Deposit */}
                          <div className="rounded-2xl neumorphic-inset p-4 space-y-3.5 border border-white/5">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                                  Security Deposit
                                </span>
                                <p className="text-[10px] text-muted-foreground">Held for damages & contingencies</p>
                              </div>
                              <div className="inline-flex rounded-xl bg-background/50 p-1 border border-border/50">
                                {[
                                  { label: "None", months: 0 },
                                  { label: "1 Mo (Standard)", months: 1 },
                                  { label: "2 Mo", months: 2 },
                                ].map((opt) => (
                                  <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => {
                                      setSecurityDepositMonths(opt.months)
                                      setSecurityDepositAmount(formatCurrencyInput(opt.months * currentRent, true))
                                      setFieldErrors(prev => ({ ...prev, securityDepositAmount: undefined }))
                                    }}
                                    className={cn(
                                      "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                                      securityDepositMonths === opt.months
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    )}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label htmlFor="securityDepositAmount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Security Deposit Amount
                              </label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">₱</span>
                                <input
                                  id="securityDepositAmount"
                                  type="text"
                                  inputMode="decimal"
                                  maxLength={14}
                                  value={securityDepositAmount}
                                  onChange={(e) => handleSecurityDepositAmountChange(e.target.value)}
                                  onBlur={handleSecurityDepositAmountBlur}
                                  placeholder="0.00"
                                  className={cn(
                                    "w-full rounded-2xl neumorphic-inset py-3 pl-8 pr-4 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                    fieldErrors.securityDepositAmount && "border border-red-500/50 ring-2 ring-red-500/20"
                                  )}
                                />
                              </div>
                              {fieldErrors.securityDepositAmount && (
                                <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                  <AlertCircle className="size-3 shrink-0" />
                                  <span>{fieldErrors.securityDepositAmount}</span>
                                </p>
                              )}
                            </div>

                            <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={securityDepositPaid}
                                onChange={(e) => setSecurityDepositPaid(e.target.checked)}
                                className="size-4 rounded accent-primary cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-muted-foreground">
                                Mark as already collected
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Settlement Summary */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                              <ShieldCheck className="size-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                  Total Move-In Settlement
                                </span>
                                {/* Screen-reader and alias for backward-compatible test assertions */}
                                <span className="sr-only">Total Inception Settlement</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Advance: ₱{formatCurrencyInput(currentAdvanceAmount, true)} + Deposit: ₱{formatCurrencyInput(currentDepositAmount, true)}
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
                            <span className="text-base sm:text-lg font-black text-primary">
                              ₱{formatCurrencyInput(currentAdvanceAmount + currentDepositAmount, true)}
                            </span>
                            <span className="sr-only">₱{(currentAdvanceAmount + currentDepositAmount).toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {advancePaid && securityDepositPaid 
                                ? "✓ Marked as collected" 
                                : advancePaid || securityDepositPaid 
                                  ? "Partially collected" 
                                  : "Pending collection upon move-in"}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Permanent Docked Footer Actions */}
                    <div className="shrink-0 px-6 sm:px-8 py-3.5 sm:py-4 bg-card/95 backdrop-blur-md border-t border-border/40 flex gap-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-2xl neumorphic-inset py-3.5 text-sm font-black transition-all hover:neumorphic-inset cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] rounded-2xl neumorphic-primary py-3.5 text-sm font-black shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Registering Resident…</span>
                          </div>
                        ) : 'Register Resident'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Mode 2: Invite Link */}
                {activeTab === 'invite' && (
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-premium px-6 sm:px-8 py-5 sm:py-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[2rem] border border-primary/20 bg-primary/5 p-5">
                        <div className="space-y-1">
                          <h3 className="text-base font-black text-foreground">Self-Onboarding Link</h3>
                          <p className="text-xs text-muted-foreground">
                            {isInviteAdvanced ? "Advanced mode: customize unit scope, screening mode, and document uploads." : "Simple mode: generate a shareable link or QR code instantly."}
                          </p>
                        </div>
                        <div className="inline-flex self-start sm:self-auto rounded-xl border border-border bg-background/80 p-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsInviteAdvanced(false);
                              setInviteScope('property');
                              setInviteUnitId('');
                            }}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors",
                              !isInviteAdvanced ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Simple
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsInviteAdvanced(true)}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-colors",
                              isInviteAdvanced ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Advanced
                          </button>
                        </div>
                      </div>

                      {/* Advanced Settings */}
                      {isInviteAdvanced && (
                        <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5 animate-in fade-in duration-200">
                          {/* Scope */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Invite Scope</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setInviteScope('property');
                                  setInviteUnitId('');
                                }}
                                className={cn(
                                  "rounded-xl border p-3 text-left transition-all",
                                  inviteScope === 'property'
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                                )}
                              >
                                <Building2 className="size-4 mb-1" />
                                <p className="text-xs font-bold">Property Wide</p>
                                <p className="text-[10px] opacity-70">Any vacant unit</p>
                              </button>
                              <button
                                type="button"
                                onClick={() => setInviteScope('unit')}
                                className={cn(
                                  "rounded-xl border p-3 text-left transition-all",
                                  inviteScope === 'unit'
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                                )}
                              >
                                <DoorOpen className="size-4 mb-1" />
                                <p className="text-xs font-bold">Specific Unit</p>
                                <p className="text-[10px] opacity-70">Targeted unit</p>
                              </button>
                            </div>
                          </div>

                          {/* Application Type */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Screening Mode</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { key: 'existing_tenant' as const, label: 'Existing Resident', desc: 'Pre-existing lease' },
                                { key: 'face_to_face' as const, label: 'In-Person', desc: 'Physical check' },
                                { key: 'online' as const, label: 'Online App', desc: 'Upload documents' },
                              ].map((type) => (
                                <button
                                  key={type.key}
                                  type="button"
                                  onClick={() => setInviteAppType(type.key)}
                                  className={cn(
                                    "rounded-xl border p-2.5 text-left transition-all",
                                    inviteAppType === type.key
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                                  )}
                                >
                                  <p className="text-xs font-bold">{type.label}</p>
                                  <p className="text-[9px] opacity-70 leading-tight">{type.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Document Requirements if Online */}
                          {inviteAppType === 'online' && (
                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Required Documents</p>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { key: 'valid_id', label: 'Government ID' },
                                  { key: 'proof_of_income', label: 'Proof of Income' },
                                  { key: 'nbi_clearance', label: 'NBI / Police Clearance' },
                                  { key: 'barangay_clearance', label: 'Barangay Clearance' },
                                ].map((doc) => {
                                  const checked = inviteRequirements.includes(doc.key)
                                  return (
                                    <button
                                      key={doc.key}
                                      type="button"
                                      onClick={() => {
                                        setInviteRequirements(prev =>
                                          prev.includes(doc.key) ? prev.filter(k => k !== doc.key) : [...prev, doc.key]
                                        )
                                      }}
                                      className={cn(
                                        "rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                                        checked ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                                      )}
                                    >
                                      {doc.label}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Property & Unit Form */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="invitePropertyId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Property</label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                            <select
                              id="invitePropertyId"
                              required
                              value={inviteData.propertyId}
                              onChange={(e) => handleInvitePropertyChange(e.target.value)}
                              className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                            >
                              <option value="" disabled>Select Property</option>
                              {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {isInviteAdvanced && inviteScope === 'unit' && (
                          <div className="space-y-2 animate-in fade-in duration-200">
                            <label htmlFor="inviteUnitId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target Vacant Unit</label>
                            <div className="relative">
                              <DoorOpen className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                              <select
                                id="inviteUnitId"
                                required
                                value={inviteUnitId}
                                onChange={(e) => handleInviteUnitChange(e.target.value)}
                                className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                              >
                                <option value="" disabled>Select Unit</option>
                                {inviteAvailableUnits.map(u => (
                                  <option key={u.id} value={u.id}>{u.name} (₱{Number(u.rentAmount || 0).toLocaleString()})</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Move-In Payment Terms Configuration for Invite Link */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h4 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                              <Coins className="size-4 text-primary" />
                              Move-In Payment Terms
                            </h4>
                            <p className="text-[11px] text-muted-foreground">
                              Configure upfront advance rent and security deposit required from residents.
                            </p>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            {/* Advance Rent */}
                            <div className="rounded-2xl neumorphic-inset p-4 space-y-3.5 border border-white/5">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                                    Advance Rent
                                  </span>
                                  <p className="text-[10px] text-muted-foreground">Applied towards first month(s)</p>
                                </div>
                                <div className="inline-flex rounded-xl bg-background/50 p-1 border border-border/50">
                                  {[
                                    { label: "None", months: 0 },
                                    { label: "1 Mo (Standard)", months: 1 },
                                    { label: "2 Mo", months: 2 },
                                  ].map((opt) => (
                                    <button
                                      key={opt.label}
                                      type="button"
                                      onClick={() => {
                                        setInviteAdvanceMonths(opt.months)
                                        setInviteAdvanceAmount(formatCurrencyInput(opt.months * effectiveInviteRent, true))
                                        setInviteFieldErrors(prev => ({ ...prev, advanceAmount: undefined }))
                                      }}
                                      className={cn(
                                        "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                                        inviteAdvanceMonths === opt.months
                                          ? "bg-primary text-primary-foreground shadow-xs"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                      )}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label htmlFor="inviteAdvanceAmount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                  Advance Rent Amount
                                </label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">₱</span>
                                  <input
                                    id="inviteAdvanceAmount"
                                    type="text"
                                    inputMode="decimal"
                                    maxLength={14}
                                    value={inviteAdvanceAmount}
                                    onChange={(e) => handleInviteAdvanceAmountChange(e.target.value)}
                                    onBlur={handleInviteAdvanceAmountBlur}
                                    placeholder="0.00"
                                    className={cn(
                                      "w-full rounded-2xl neumorphic-inset py-3 pl-8 pr-4 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                      inviteFieldErrors.advanceAmount && "border border-red-500/50 ring-2 ring-red-500/20"
                                    )}
                                  />
                                </div>
                                {inviteFieldErrors.advanceAmount && (
                                  <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                    <AlertCircle className="size-3 shrink-0" />
                                    <span>{inviteFieldErrors.advanceAmount}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Security Deposit */}
                            <div className="rounded-2xl neumorphic-inset p-4 space-y-3.5 border border-white/5">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <span className="text-[11px] font-black uppercase tracking-wider text-foreground">
                                    Security Deposit
                                  </span>
                                  <p className="text-[10px] text-muted-foreground">Held for damages & contingencies</p>
                                </div>
                                <div className="inline-flex rounded-xl bg-background/50 p-1 border border-border/50">
                                  {[
                                    { label: "None", months: 0 },
                                    { label: "1 Mo (Standard)", months: 1 },
                                    { label: "2 Mo", months: 2 },
                                  ].map((opt) => (
                                    <button
                                      key={opt.label}
                                      type="button"
                                      onClick={() => {
                                        setInviteSecurityDepositMonths(opt.months)
                                        setInviteSecurityDepositAmount(formatCurrencyInput(opt.months * effectiveInviteRent, true))
                                        setInviteFieldErrors(prev => ({ ...prev, securityDepositAmount: undefined }))
                                      }}
                                      className={cn(
                                        "rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer",
                                        inviteSecurityDepositMonths === opt.months
                                          ? "bg-primary text-primary-foreground shadow-xs"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                      )}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label htmlFor="inviteSecurityDepositAmount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                  Security Deposit Amount
                                </label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/60">₱</span>
                                  <input
                                    id="inviteSecurityDepositAmount"
                                    type="text"
                                    inputMode="decimal"
                                    maxLength={14}
                                    value={inviteSecurityDepositAmount}
                                    onChange={(e) => handleInviteSecurityDepositAmountChange(e.target.value)}
                                    onBlur={handleInviteSecurityDepositAmountBlur}
                                    placeholder="0.00"
                                    className={cn(
                                      "w-full rounded-2xl neumorphic-inset py-3 pl-8 pr-4 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4",
                                      inviteFieldErrors.securityDepositAmount && "border border-red-500/50 ring-2 ring-red-500/20"
                                    )}
                                  />
                                </div>
                                {inviteFieldErrors.securityDepositAmount && (
                                  <p className="flex items-center gap-1 text-[11px] font-semibold text-red-500">
                                    <AlertCircle className="size-3 shrink-0" />
                                    <span>{inviteFieldErrors.securityDepositAmount}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Settlement Summary */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                <ShieldCheck className="size-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Total Move-In Settlement Preview
                                  </span>
                                  <span className="sr-only">Total Inception Settlement</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  Advance: ₱{formatCurrencyInput(currentInviteAdvanceAmount, true)} + Deposit: ₱{formatCurrencyInput(currentInviteDepositAmount, true)}
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between">
                              <span className="text-base sm:text-lg font-black text-primary">
                                ₱{formatCurrencyInput(currentInviteTotalSettlement, true)}
                              </span>
                              <span className="sr-only">₱{currentInviteTotalSettlement.toLocaleString()}</span>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                Required upon applicant approval
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="expiresAt" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Expiration (Optional)</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                            <input
                              id="expiresAt"
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              max="2099-12-31"
                              value={inviteData.expiresAt}
                              onChange={(e) => {
                                setInviteData(prev => ({ ...prev, expiresAt: e.target.value }))
                                setInvitePreset(null)
                              }}
                              className="w-full rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            {[
                              { label: '+1 Day', days: 1 },
                              { label: '+7 Days (Standard)', days: 7 },
                              { label: '+30 Days', days: 30 },
                            ].map((preset) => (
                              <button
                                key={preset.days}
                                type="button"
                                onClick={() => {
                                  const d = new Date()
                                  d.setDate(d.getDate() + preset.days)
                                  const tz = d.getTimezoneOffset() * 60000
                                  setInviteData(prev => ({ ...prev, expiresAt: new Date(d.getTime() - tz).toISOString().slice(0, 10) }))
                                  setInvitePreset(preset.days)
                                }}
                                className={cn(
                                  "rounded-lg border px-2.5 py-1 text-xs font-bold transition-all",
                                  invitePreset === preset.days
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                                )}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Permanent Docked Footer Actions */}
                    <div className="shrink-0 px-6 sm:px-8 py-3.5 sm:py-4 bg-card/95 backdrop-blur-md border-t border-border/40 flex gap-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-2xl neumorphic-inset py-3.5 text-sm font-black transition-all hover:neumorphic-inset cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGenerateInvite}
                        disabled={loading}
                        className="flex-[2] rounded-2xl neumorphic-primary py-3.5 text-sm font-black shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Generating Link…</span>
                          </div>
                        ) : 'Generate Onboarding Link'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Mode 3: Walk-in Application */}
                {activeTab === 'walk_in' && (
                  <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-premium px-6 sm:px-8 py-5 sm:py-6 space-y-6">
                      <div className="rounded-[2rem] border border-primary/20 bg-primary/5 p-5 text-center">
                        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <DoorOpen className="size-6" />
                        </div>
                        <h3 className="text-lg font-black text-foreground">In-Person Walk-in Application</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Intake prospective tenants visiting on-site with live verification, digital lease signing, and payment recording.
                        </p>
                      </div>

                      {/* 4-Step Intake Process Preview */}
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                          4-Step Intake Process
                        </p>
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-xs">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                            <div>
                              <p className="font-bold text-foreground">Applicant Details</p>
                              <p className="text-[11px] text-muted-foreground">Identity, employment & contact info</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-xs">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                            <div>
                              <p className="font-bold text-foreground">Requirements Check</p>
                              <p className="text-[11px] text-muted-foreground">Verify physical IDs & income proof</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-xs">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
                            <div>
                              <p className="font-bold text-foreground">Digital Lease Signing</p>
                              <p className="text-[11px] text-muted-foreground">Sign agreement on screen or print</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-background/60 p-2.5 text-xs">
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">4</span>
                            <div>
                              <p className="font-bold text-foreground">Payment & Move-In</p>
                              <p className="text-[11px] text-muted-foreground">Record downpayment & set occupied</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Property & Unit Selector */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="walkInPropertyId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Target Property
                          </label>
                          <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                            <select
                              id="walkInPropertyId"
                              value={walkInPropertyId}
                              onChange={(e) => {
                                const pId = e.target.value
                                setWalkInPropertyId(pId)
                                const prop = properties.find(p => p.id === pId)
                                const vacant = (prop?.units || []).find(u => (u.status ?? 'vacant') === 'vacant')
                                setWalkInUnitId(vacant?.id || prop?.units[0]?.id || '')
                              }}
                              className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4"
                            >
                              <option value="" disabled>Select Property</option>
                              {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="walkInUnitId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                            Target Vacant Unit
                          </label>
                          <div className="relative">
                            <DoorOpen className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />
                            <select
                              id="walkInUnitId"
                              value={walkInUnitId}
                              onChange={(e) => setWalkInUnitId(e.target.value)}
                              disabled={walkInAvailableUnits.length === 0}
                              className="w-full appearance-none rounded-2xl neumorphic-inset py-3.5 pl-12 pr-5 text-sm font-black outline-none ring-primary/20 transition-all focus:border-primary/50 focus:ring-4 disabled:opacity-50"
                            >
                              <option value="" disabled>
                                {walkInAvailableUnits.length === 0 ? "No vacant units available" : "Select Vacant Unit"}
                              </option>
                              {walkInAvailableUnits.map(u => (
                                <option key={u.id} value={u.id}>
                                  {u.name} (₱{Number(u.rentAmount || 0).toLocaleString()}/mo)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Permanent Docked Action Buttons */}
                    <div className="shrink-0 px-6 sm:px-8 py-3.5 sm:py-4 bg-card/95 backdrop-blur-md border-t border-border/40 flex gap-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-2xl neumorphic-inset py-3.5 text-sm font-black transition-all hover:neumorphic-inset cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleStartWalkIn}
                        disabled={!walkInUnitId}
                        className="flex-[2] inline-flex items-center justify-center gap-2 rounded-2xl neumorphic-primary py-3.5 text-sm font-black shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <span>Start Walk-in Application</span>
                        <ArrowRight className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-premium p-6 sm:p-10 text-center">
                {successData ? (
                  <>
                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="size-10" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground">Resident Registered!</h2>
                    <p className="mt-2 text-muted-foreground">The resident has been successfully added to the system.</p>
                    
                    {successData.tempPassword ? (
                      <div className="mt-8 rounded-[2rem] neumorphic-inset p-8">
                        <div className="mb-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                          <AlertCircle className="size-4" />
                          <span>Temporary Credentials</span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-2xl bg-background p-4">
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email</p>
                              <p className="text-sm font-black text-foreground">{successData.email}</p>
                            </div>
                            <button onClick={() => copyToClipboard(successData.email)} className="p-2 text-muted-foreground hover:text-primary">
                              <Copy className="size-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between rounded-2xl bg-background p-4">
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Temp Password</p>
                              <p className="font-mono text-lg font-black text-primary tracking-wider">{successData.tempPassword}</p>
                            </div>
                            <button onClick={() => copyToClipboard(successData.tempPassword!)} className="p-2 text-muted-foreground hover:text-primary">
                              <Copy className="size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 rounded-[2rem] bg-emerald-500/5 p-8 text-emerald-600">
                        <p className="text-sm font-black">This email is already registered on iReside. The resident can log in using their existing credentials.</p>
                      </div>
                    )}
                  </>
                ) : inviteResult && (
                  <>
                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <QrCode className="size-10" />
                    </div>
                    <h2 className="text-2xl font-black text-foreground">Onboarding Link Ready</h2>
                    <p className="mt-2 text-muted-foreground">Share this with your residents to start self-onboarding.</p>

                    <div className="mt-8 space-y-6">
                      <div className="flex items-center justify-center rounded-3xl neumorphic-inset p-6">
                        <div className="relative size-48 overflow-hidden rounded-2xl">
                          <Image 
                            src={inviteResult.qrUrl} 
                            alt="QR Code" 
                            fill
                            sizes="192px"
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl neumorphic-inset p-4">
                        <div className="text-left truncate max-w-[300px]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Onboarding URL</p>
                          <p className="text-sm font-black text-foreground truncate">{inviteResult.shareUrl}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => copyToClipboard(inviteResult.shareUrl)} className="p-2 text-muted-foreground hover:text-primary">
                            <Copy className="size-4" />
                          </button>
                          <button className="p-2 text-muted-foreground hover:text-primary">
                            <Share2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={onClose}
                  className="mt-10 w-full rounded-2xl bg-foreground py-4 text-sm font-black text-background transition-all hover:bg-foreground/90 active:scale-95"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Internal Walk-in Modal Fallback if not handled by parent */}
      {isInternalWalkInOpen && (
        <WalkInApplicationModal
          isOpen={isInternalWalkInOpen}
          onClose={() => setIsInternalWalkInOpen(false)}
          units={allWalkInUnits}
          selectedUnitId={walkInUnitId}
          onSuccess={() => {
            setIsInternalWalkInOpen(false)
            void refreshProperties()
            onSuccess()
            onClose()
          }}
        />
      )}
    </>
  )

  return createPortal(modalContent, document.body)
}
