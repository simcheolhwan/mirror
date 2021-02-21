import BigNumber from "bignumber.js"
import { Msg } from "@terra-money/terra.js"

import { gt, sum, times } from "../libs/math"
import { format, formatAsset } from "../libs/parse"
import { toBase64 } from "../libs/formHelpers"
import useNewContractMsg from "../libs/useNewContractMsg"
import getLpName from "../libs/getLpName"
import { PriceKey, StakingKey } from "../hooks/contractKeys"
import { useProtocol } from "../data/contract/protocol"
import { useFindBalance, useFindPrice } from "../data/contract/normalize"
import { useFindStaking } from "../data/contract/normalize"

import { Type } from "../pages/Multiple"
import usePool from "./modules/usePool"
import FormContainer from "./modules/FormContainer"

const BUY = 20000
const WITHDRAWABLE = 20000

// const CRYPTO = ["MIR", "mBTC", "mETH"]
const WSB = ["mGME", "mAMC"]
const INDEX = ["mIAU", "mSLV", "mUSO", "mVIXY"]
const FOREIGN = ["mBABA", "mGLXY"]
export const OMIT = [...WSB, ...INDEX, ...FOREIGN]

const MultipleForm = ({ type }: { type: Type }) => {
  /* context */
  const { contracts, listed, toToken } = useProtocol()
  const findPrice = useFindPrice()
  const { contents: findBalance } = useFindBalance()
  const { contents: findStaking } = useFindStaking()
  const getPool = usePool()

  const list = listed.filter(({ symbol }) => !OMIT.includes(symbol))

  const buyList = list
    .map((item) => {
      const { token } = item
      const lp = findStaking(StakingKey.LPSTAKED, token)
      const pool = getPool({ amount: lp, token })
      const withdrawableValue = pool.fromLP.value
      const diff = new BigNumber(BUY).times(1e6).minus(withdrawableValue)
      const buyAmount = new BigNumber(diff).div(2).integerValue()
      const amount = BigNumber.max(buyAmount, 0).toString()
      return { ...item, amount, withdrawableValue }
    })
    .filter(({ amount }) => gt(amount, 0))

  const farmList = list
    .filter(({ token }) => gt(findBalance(token), 0))
    .map((item) => {
      const { token } = item
      const amount = findBalance(token)
      const pool = token ? getPool({ amount, token }) : undefined
      const estimated = pool?.toLP.estimated
      return { ...item, amount, estimated }
    })

  const unstakeList = list
    .filter(({ token }) => gt(findStaking(StakingKey.LPSTAKED, token), 0))
    .map((item) => {
      const { token } = item
      const lp = findStaking(StakingKey.LPSTAKED, token)
      const pool = getPool({ amount: lp, token })
      const withdrawableValue = pool.fromLP.value
      const withdrawable = new BigNumber(WITHDRAWABLE).times(1e6)
      const diff = new BigNumber(withdrawableValue).minus(withdrawable)
      const ratio = WITHDRAWABLE
        ? new BigNumber(diff).div(withdrawableValue)
        : 1
      const unstake = new BigNumber(lp).times(ratio)
      const amount = BigNumber.max(unstake, 0).integerValue().toString()
      const value = getPool({ amount, token }).fromLP.value
      return { ...item, amount, value }
    })
    .filter(({ amount }) => gt(amount, 0))

  /* render */
  const contents = {
    [Type.BUY]: [
      {
        title: "Length",
        content: buyList.length,
      },
      {
        title: "Total",
        content: formatAsset(sum(buyList.map(({ amount }) => amount)), "uusd"),
      },
      ...buyList.map(({ symbol, amount, withdrawableValue }) => {
        const config = { integer: true }
        return {
          title: `${symbol} (${format(withdrawableValue, symbol, config)})`,
          content: formatAsset(amount, "uusd"),
        }
      }),
    ],
    [Type.SELL]: list
      .filter(({ token }) => gt(findBalance(token), 0))
      .map(({ symbol, token }) => ({
        title: symbol,
        content: [
          formatAsset(findBalance(token), symbol),
          formatAsset(
            times(findBalance(token), findPrice(PriceKey.PAIR, token)),
            "uusd"
          ),
        ].join(" → "),
      })),
    [Type.FARM]: farmList.map(({ symbol, amount, estimated }) => ({
      title: symbol,
      content: [
        formatAsset(amount, symbol),
        formatAsset(estimated, "uusd"),
      ].join(" + "),
    })),
    [Type.UNSTAKE]: [
      {
        title: "Length",
        content: unstakeList.length,
      },
      {
        title: "Total",
        content: formatAsset(
          sum(unstakeList.map(({ value }) => value)),
          "uusd"
        ),
      },
      ...unstakeList.map(({ symbol, amount, value }) => ({
        title: symbol,
        content: [
          formatAsset(amount, getLpName(symbol)),
          formatAsset(value, "uusd"),
        ].join(" → "),
      })),
    ],
  }[type]

  /* submit */
  const newContractMsg = useNewContractMsg()

  const data: Msg[] = {
    [Type.BUY]: buyList.map(({ pair, amount }) => {
      const asset = toToken({ token: "uusd", amount })
      return newContractMsg(
        pair,
        { swap: { offer_asset: asset } },
        { amount, denom: "uusd" }
      )
    }),
    [Type.SELL]: list
      .filter(({ token }) => gt(findBalance(token), 0))
      .map(({ token, pair }) =>
        newContractMsg(token, {
          send: {
            amount: findBalance(token),
            contract: pair,
            msg: toBase64({ swap: {} }),
          },
        })
      ),
    [Type.FARM]: farmList.reduce<Msg[]>(
      (acc, { token, pair, amount, estimated }) =>
        !estimated
          ? acc
          : [
              ...acc,
              newContractMsg(token, {
                increase_allowance: { amount, spender: contracts["staking"] },
              }),
              newContractMsg(
                contracts["staking"],
                {
                  auto_stake: {
                    assets: [
                      toToken({ amount, token }),
                      toToken({ amount: estimated, token: "uusd" }),
                    ],
                  },
                },
                { amount: estimated, denom: "uusd" }
              ),
            ],
      []
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
  const container = { contents, disabled, data, gasAdjust: 0.67 }

  const pretax = {
    [Type.BUY]: sum(buyList.map(({ amount }) => amount)),
    [Type.SELL]: undefined,
    [Type.FARM]: sum(farmList.map(({ estimated }) => estimated ?? "0")),
    [Type.UNSTAKE]: undefined,
  }[type]

  const deduct = [Type.SELL, Type.UNSTAKE].includes(type)
  const tax = { pretax, deduct }

  return <FormContainer {...container} {...tax}></FormContainer>
}

export default MultipleForm
