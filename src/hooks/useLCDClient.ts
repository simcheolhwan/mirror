import { LCDClient } from "@terra-money/terra.js"
import { useMemo } from "react"
import { useNetwork } from "./useNetwork"

const useLCDClient = () => {
  const { chainID, lcd: URL, fee } = useNetwork()
  const gasPrices = `${fee.gasPrice}uusd`

  const lcdClient = useMemo(() => {
    return new LCDClient({ chainID, URL, gasPrices })
  }, [chainID, URL, gasPrices])

  return lcdClient
}

export default useLCDClient
