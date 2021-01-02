import { isTxError, Msg, StdFee } from "@terra-money/terra.js"
import { useLCDClient, useNetwork, useWallet } from "../hooks"
import { ceil, plus, times } from "../libs/math"

const usePost = () => {
  const { fee } = useNetwork()
  const client = useLCDClient()
  const { key } = useWallet()

  const post = async (
    { msgs, memo }: { msgs: Msg[]; memo?: string },
    { tax }: { tax?: string }
  ) => {
    try {
      const { gasPrice, amount } = fee
      const gas = Math.floor(amount / gasPrice)
      const feeAmount = ceil(times(gas, gasPrice))

      const tx = {
        msgs,
        memo,
        fee: new StdFee(gas, { uusd: plus(feeAmount, tax) }),
        gasPrices: `${gasPrice}uusd`,
      }

      const signedTx = await client.wallet(key!).createAndSignTx(tx)
      const result = await client.tx.broadcastSync(signedTx)
      const { raw_log } = result
      const code = isTxError(result) ? result.code : undefined
      const response = code
        ? { result, success: false, error: { code: 2, raw_log } }
        : { result, success: true }

      return response as any
    } catch (error) {
      const response = {
        success: false,
        error: {
          code: 3,
          message: error.response?.data?.error ?? error.message,
        },
      }

      return response
    }
  }

  return post
}

export default usePost
