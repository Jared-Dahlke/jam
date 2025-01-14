import { useCallback } from 'react'
import { useRefreshConfigValues } from '../context/ServiceConfigContext'
import { AmountSats } from '../libs/JmWalletApi'
import { isValidNumber } from '../utils'

export type TxFeeValueUnit = 'blocks' | 'sats/kilo-vbyte'

export const toTxFeeValueUnit = (val?: number): TxFeeValueUnit | undefined => {
  if (val === undefined || !Number.isInteger(val) || val < 1) return undefined
  return val <= 1_000 ? 'blocks' : 'sats/kilo-vbyte'
}

export const FEE_CONFIG_KEYS = {
  tx_fees: { section: 'POLICY', field: 'tx_fees' },
  tx_fees_factor: { section: 'POLICY', field: 'tx_fees_factor' },
  max_cj_fee_abs: { section: 'POLICY', field: 'max_cj_fee_abs' },
  max_cj_fee_rel: { section: 'POLICY', field: 'max_cj_fee_rel' },
}

export interface FeeValues {
  tx_fees?: number
  tx_fees_factor?: number
  max_cj_fee_abs?: number
  max_cj_fee_rel?: number
}

export const useLoadFeeConfigValues = () => {
  const refreshConfigValues = useRefreshConfigValues()

  return useCallback(
    async (signal?: AbortSignal) => {
      const serviceConfig = await refreshConfigValues({
        signal,
        keys: Object.values(FEE_CONFIG_KEYS),
      })

      const policy = serviceConfig['POLICY'] || {}

      const parsedTxFees = parseInt(policy.tx_fees || '', 10)
      const parsedTxFeesFactor = parseFloat(policy.tx_fees_factor || '')
      const parsedMaxFeeAbs = parseInt(policy.max_cj_fee_abs || '', 10)
      const parsedMaxFeeRel = parseFloat(policy.max_cj_fee_rel || '')

      const feeValues: FeeValues = {
        tx_fees: isValidNumber(parsedTxFees) ? parsedTxFees : undefined,
        tx_fees_factor: isValidNumber(parsedTxFeesFactor) ? parsedTxFeesFactor : undefined,
        max_cj_fee_abs: isValidNumber(parsedMaxFeeAbs) ? parsedMaxFeeAbs : undefined,
        max_cj_fee_rel: isValidNumber(parsedMaxFeeRel) ? parsedMaxFeeRel : undefined,
      }
      return feeValues
    },
    [refreshConfigValues]
  )
}

interface EstimatMaxCollaboratorFeeProps {
  amount: AmountSats
  collaborators: number
  maxFeeAbs: AmountSats
  maxFeeRel: number // e.g. 0.001 for 0.1%
}

export const estimateMaxCollaboratorFee = ({
  amount,
  collaborators,
  maxFeeAbs,
  maxFeeRel,
}: EstimatMaxCollaboratorFeeProps) => {
  const maxFeePerCollaborator = Math.max(Math.ceil(amount * maxFeeRel), maxFeeAbs)
  return collaborators > 0 ? Math.min(maxFeePerCollaborator * collaborators, amount) : 0
}
