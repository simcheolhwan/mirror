import { MnemonicKey, RawKey } from "@terra-money/terra.js"
import { useEffect, useState } from "react"
import useLocalStorage from "../libs/useLocalStorage"
import { decrypt, encrypt } from "../wallet/keystore"

interface Props {
  address: string
  setAddress: (address: string) => void
}

const useLocalWallet = ({ address, setAddress }: Props) => {
  const [wallets, setWallets] = useLocalStorage<LocalWallet[]>("wallets", [])
  const [key, setKey] = useState<RawKey>()

  useEffect(() => {
    !address && setKey(undefined)
  }, [address])

  const recover = (mk: MnemonicKey, password: string) => {
    const encrypted = encrypt(mk.privateKey.toString("hex"), password)
    const key = new RawKey(mk.privateKey)

    const address = mk.accAddress

    setWallets((wallets) => [
      ...wallets.filter((wallet) => wallet.address !== address),
      { address, wallet: encrypted },
    ])

    setAddress(address)
    setKey(key)
  }

  const decryptWallet = (
    { address, wallet }: LocalWallet,
    password: string
  ) => {
    try {
      const decrypted = decrypt(wallet, password)
      const key = new RawKey(Buffer.from(decrypted, "hex"))

      setAddress(address)
      setKey(key)
    } catch {
      throw new Error("Incorrect password")
    }
  }

  return { recover, wallets, decrypt: decryptWallet, key }
}

export default useLocalWallet
