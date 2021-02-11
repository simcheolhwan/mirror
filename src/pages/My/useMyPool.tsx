import { sum, gt, div, minus, number } from "../../libs/math"
import { percent } from "../../libs/num"
import { useContractsAddress, useContract, useCombineKeys } from "../../hooks"
import { BalanceKey, PriceKey } from "../../hooks/contractKeys"
import useAssetStats from "../../statistics/useAssetStats"
import usePool from "../../forms/usePool"
import usePoolShare from "../../forms/usePoolShare"

const useMyPool = () => {
  const priceKey = PriceKey.PAIR
  const keys = [
    priceKey,
    BalanceKey.TOKEN,
    BalanceKey.LPTOTAL,
    BalanceKey.LPSTAKED,
  ]

  const { loading, data } = useCombineKeys(keys)
  const { listedAll } = useContractsAddress()
  const { find } = useContract()

  const getPool = usePool()
  const getPoolShare = usePoolShare()

  const { apr } = useAssetStats()

  const list = !data
    ? []
    : listedAll
        .map((item) => {
          const { token } = item
          const balance = find(BalanceKey.LPTOTAL, token)
          const { fromLP } = getPool({ amount: balance, token })
          const poolShare = getPoolShare({ amount: balance, token })
          const { ratio, lessThanMinimum, minimum } = poolShare
          const prefix = lessThanMinimum ? "<" : ""

          return {
            ...item,
            apr: apr?.[token],
            balance,
            withdrawable: fromLP,
            share: prefix + percent(lessThanMinimum ? minimum : ratio),
          }
        })
        .filter(({ balance }) => gt(balance, 0))

  const totalWithdrawableValue = sum(
    list.map(({ withdrawable }) => withdrawable.value)
  )

  const dataSource = list
    .map((item) => {
      const { withdrawable } = item
      return { ...item, ratio: div(withdrawable.value, totalWithdrawableValue) }
    })
    .sort(({ ratio: a }, { ratio: b }) => number(minus(b, a)))

  return { keys, loading, dataSource, totalWithdrawableValue }
}

export default useMyPool
