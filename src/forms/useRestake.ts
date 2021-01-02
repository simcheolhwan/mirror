import { useCallback, useEffect, useMemo, useState } from "react"
import { update } from "ramda"
import { Mirror, UST } from "@mirror-protocol/mirror.js"
import { Int, isTxError, Wallet } from "@terra-money/terra.js"
import { MsgExecuteContract } from "@terra-money/terra.js"
import { MIR, UUSD } from "../constants"
import getLpName from "../libs/getLpName"
import { useLCDClient, useWallet } from "../hooks"

export enum Status {
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
}

const useRestake = (symbol: string, { skipClaim }: { skipClaim: boolean }) => {
  /* context */
  const { address, key } = useWallet()
  const lcd = useLCDClient()
  const mirror = new Mirror({ key, lcd })
  const wallet = new Wallet(lcd, key!)

  /* state */
  const initial = useMemo(() => {
    const result = { hash: "", status: "", log: "" }
    return [
      { action: "Claim all rewards", ...result },
      { action: `Sell ${symbol === MIR ? "half" : "all"} MIR`, ...result },
      { action: symbol === MIR ? "" : `Buy ${symbol} half UST`, ...result },
      { action: `Provide all ${symbol} to the pool`, ...result },
      { action: `Stake all ${getLpName(symbol)}`, ...result },
    ]
  }, [symbol])

  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const setItem = <T>(obj: T, index: number) =>
    setData((data) => update(index, { ...data[index], ...obj }, data))

  const reset = useCallback(() => {
    setData(initial)
    setLoading(false)
    setSubmitted(false)
  }, [initial])

  useEffect(() => {
    reset()
  }, [symbol, reset])

  /* terra */
  const execute = async (msgs: MsgExecuteContract[], index: number) => {
    try {
      const tx = await wallet.createAndSignTx({ msgs })
      const result = await wallet.lcd.tx.broadcastSync(tx)

      if (isTxError(result)) {
        setItem({ log: result.raw_log, status: Status.FAILURE }, index)
      } else {
        setItem({ hash: result.txhash }, index)
        await poll(result.txhash, index)
      }
    } catch (error) {
      const message = error.response?.data?.error ?? error.message
      setItem({ log: message, status: Status.FAILURE }, index)
    }
  }

  const poll = async (hash: string, index: number) => {
    try {
      setItem({ status: Status.LOADING }, index)
      await wallet.lcd.tx.txInfo(hash)
      setItem({ status: Status.SUCCESS }, index)
    } catch {
      await sleep(1000)
      await poll(hash, index)
    }
  }

  /* contract */
  const mirrorToken = mirror.assets[MIR]
  const asset = mirror.assets[symbol]

  const txs = {
    claim: async () => {
      const index = 0
      await execute([mirror.staking.withdraw()], index)
    },

    sell: async () => {
      const index = 1

      const mirrorTokenAddress = mirrorToken.token.contractAddress!
      const balanceResponse = await mirror.mirrorToken.getBalance()
      const balance = new Int(balanceResponse.balance)
      const sellAmount = new Int(symbol === MIR ? balance.divToInt(2) : balance)

      await execute(
        [
          mirrorToken.pair.swap(
            {
              info: { token: { contract_addr: mirrorTokenAddress } },
              amount: sellAmount.toString(),
            },
            {}
          ),
        ],
        index
      )
    },

    buy: async () => {
      const index = 2

      const bankBalance = await lcd.bank.balance(address)
      const uusdBalance = new Int(bankBalance.get(UUSD)?.amount ?? "0")
      const buyAmount = new Int(uusdBalance.mul(0.99).divToInt(2))

      await execute(
        [asset.pair.swap({ info: UST, amount: buyAmount.toString() }, {})],
        index
      )
    },

    pool: async () => {
      const index = 3

      const balanceResponse = await asset.token.getBalance()
      const balance = new Int(balanceResponse.balance)

      const pool = await asset.pair.getPool()
      const uusdAmount = balance
        .mul(pool.assets[0].amount)
        .divToInt(pool.assets[1].amount)

      await execute(
        [
          asset.token.increaseAllowance(
            asset.pair.contractAddress!,
            balance.toString()
          ),
          asset.pair.provideLiquidity([
            {
              info: { token: { contract_addr: asset.token.contractAddress! } },
              amount: new Int(balance).toString(),
            },
            {
              info: { native_token: { denom: "uusd" } },
              amount: new Int(uusdAmount).toString(),
            },
          ]),
        ],
        index
      )
    },

    stake: async () => {
      const index = 4
      const lpTokenBalance = await asset.lpToken.getBalance()

      await execute(
        [
          mirror.staking.bond(
            asset.token.contractAddress!,
            lpTokenBalance.balance,
            asset.lpToken
          ),
        ],
        index
      )
    },
  }

  const submit = async () => {
    setLoading(true)
    setSubmitted(true)

    try {
      !skipClaim && (await txs.claim())
      await txs.sell()
      symbol !== MIR && (await txs.buy())
      await txs.pool()
      await txs.stake()
    } catch (error) {
      // ...
    }

    setLoading(false)
  }

  return { data, submit, loading, submitted, reset }
}

export default useRestake

/* utils */
const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
