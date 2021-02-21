import BigNumber from "bignumber.js"
import { Msg } from "@terra-money/terra.js"

import { UUSD } from "../constants"
import useNewContractMsg from "../terra/useNewContractMsg"
import { gt, sum } from "../libs/math"
import { format, formatAsset } from "../libs/parse"
import { toBase64 } from "../libs/formHelpers"
import getLpName from "../libs/getLpName"
import { useRefetch, useContractsAddress, useContract } from "../hooks"
import { PriceKey, BalanceKey } from "../hooks/contractKeys"

import { Type } from "../pages/Multiple"
import usePool from "./usePool"
import FormContainer from "./FormContainer"

const BUY = 12000 // UST
const WITHDRAWABLE = 20000

// const CRYPTO = ["MIR", "mBTC", "mETH"]
const WSB = ["mGME", "mAMC"]
const INDEX = ["mIAU", "mSLV", "mUSO", "mVIXY"]
const FOREIGN = ["mBABA", "mGLXY"]
export const OMIT = [...WSB, ...INDEX, ...FOREIGN]

const WithdrawForm = ({ type, tab }: { type: Type; tab: Tab }) => {
  const priceKey = PriceKey.PAIR
  const balanceKey = {
    [Type.UNSTAKE]: BalanceKey.LPTOTAL,
    [Type.SELL]: BalanceKey.TOKEN,
    [Type.BUY]: BalanceKey.TOKEN,
    [Type.PROVIDE]: BalanceKey.TOKEN,
    [Type.STAKE]: BalanceKey.LPSTAKABLE,
  }[type]

  /* context */
  const { contracts, listed, toToken } = useContractsAddress()
  const { find } = useContract()
  const getPool = usePool()

  const list = listed.filter(({ symbol }) => !OMIT.includes(symbol))
  const balanceList = list.filter(({ token }) => gt(find(balanceKey, token), 0))

  const buyList = list
    .map((item) => {
      const { token } = item
      const lp = find(BalanceKey.LPTOTAL, token)
      const pool = getPool({ amount: lp, token })
      const withdrawableValue = pool.fromLP.value
      const diff = new BigNumber(BUY).times(1e6).minus(withdrawableValue)
      const buyAmount = new BigNumber(diff).div(2).integerValue()
      const amount = BigNumber.max(buyAmount, 0).toString()
      return { ...item, amount, withdrawableValue }
    })
    .filter(({ amount }) => gt(amount, 0))

  const unstakeList = balanceList
    .map((item) => {
      const { token } = item
      const lp = find(BalanceKey.LPTOTAL, token)
      const pool = getPool({ amount: lp, token })
      const withdrawableValue = pool.fromLP.value
      const withdrawable = new BigNumber(WITHDRAWABLE).times(1e6)
      const diff = new BigNumber(withdrawableValue).minus(withdrawable)
      const ratio = WITHDRAWABLE
        ? new BigNumber(diff).div(withdrawableValue)
        : 1
      const unstake = new BigNumber(lp).times(ratio)
      const amount = BigNumber.max(unstake, 0).integerValue().toString()
      return { ...item, amount }
    })
    .filter(({ amount }) => gt(amount, 0))

  const provideList = balanceList.map((item) => {
    const { token } = item
    const amount = find(balanceKey, token)
    const pool = token ? getPool({ amount, token }) : undefined
    const estimated = pool?.toLP.estimated
    return { ...item, amount, estimated }
  })

  // Refetch the balance of stakable LP even on stake
  useRefetch([
    priceKey,
    PriceKey.ORACLE,
    BalanceKey.TOKEN,
    BalanceKey.LPTOTAL,
    BalanceKey.LPSTAKED,
    BalanceKey.LPSTAKABLE,
  ])

  /* render */
  const contents = {
    [Type.BUY]: [
      {
        title: "Length",
        content: buyList.length,
      },
      {
        title: "Total",
        content: formatAsset(sum(buyList.map(({ amount }) => amount)), UUSD),
      },
      ...buyList.map(({ symbol, amount, withdrawableValue }) => {
        const config = { integer: true }
        return {
          title: `${symbol} (${format(withdrawableValue, symbol, config)})`,
          content: formatAsset(amount, UUSD),
        }
      }),
    ],
    [Type.SELL]: balanceList.map(({ symbol, token }) => ({
      title: symbol,
      content: formatAsset(find(balanceKey, token), symbol),
    })),
    [Type.PROVIDE]: provideList.map(({ symbol, amount, estimated }) => ({
      title: symbol,
      content: [formatAsset(amount, symbol), formatAsset(estimated, UUSD)].join(
        " + "
      ),
    })),
    [Type.STAKE]: list.map(({ symbol, token }) => ({
      title: symbol,
      content: formatAsset(find(balanceKey, token), getLpName(symbol)),
    })),
    [Type.UNSTAKE]: unstakeList.map(({ symbol, token, amount }) => ({
      title: symbol,
      content: formatAsset(amount, getLpName(symbol)),
    })),
  }[type]

  /* submit */
  const newContractMsg = useNewContractMsg()

  const data: Msg[] = {
    [Type.BUY]: buyList.map(({ pair, amount }) => {
      const asset = toToken({ token: UUSD, amount })
      return newContractMsg(
        pair,
        { swap: { offer_asset: asset } },
        { amount, denom: UUSD }
      )
    }),
    [Type.SELL]: balanceList.map(({ token, pair }) =>
      newContractMsg(token, {
        send: {
          amount: find(balanceKey, token),
          contract: pair,
          msg: toBase64({ swap: {} }),
        },
      })
    ),
    [Type.PROVIDE]: provideList.reduce<Msg[]>(
      (acc, { token, pair, amount, estimated }) =>
        !estimated
          ? acc
          : [
              ...acc,
              newContractMsg(token, {
                increase_allowance: { amount, spender: pair },
              }),
              newContractMsg(
                pair,
                {
                  provide_liquidity: {
                    assets: [
                      toToken({ amount, token }),
                      toToken({ amount: estimated, token: UUSD }),
                    ],
                  },
                },
                { amount: estimated, denom: UUSD }
              ),
            ],
      []
    ),
    [Type.STAKE]: list.map(({ token, lpToken }) =>
      newContractMsg(lpToken, {
        send: {
          amount: find(balanceKey, token),
          contract: contracts["staking"],
          msg: toBase64({ bond: { asset_token: token } }),
        },
      })
    ),
    [Type.UNSTAKE]: unstakeList.reduce<Msg[]>(
      (acc, { token, pair, lpToken, amount }) => [
        ...acc,
        newContractMsg(contracts["staking"], {
          unbond: { asset_token: token, amount },
        }),
        newContractMsg(lpToken, {
          send: {
            amount,
            contract: pair,
            msg: toBase64({ withdraw_liquidity: {} }),
          },
        }),
      ],
      []
    ),
  }[type]

  const disabled = false

  /* result */
  const container = { tab, contents, disabled, data }

  const pretax = {
    [Type.BUY]: sum(buyList.map(({ amount }) => amount)),
    [Type.SELL]: undefined,
    [Type.PROVIDE]: sum(provideList.map(({ estimated }) => estimated ?? "0")),
    [Type.STAKE]: undefined,
    [Type.UNSTAKE]: undefined,
  }[type]

  const deduct = [Type.SELL, Type.STAKE, Type.UNSTAKE].includes(type)
  const length = !deduct ? data.length : undefined
  const tax = { pretax, deduct, length }

  return <FormContainer {...container} {...tax}></FormContainer>
}

export default WithdrawForm
