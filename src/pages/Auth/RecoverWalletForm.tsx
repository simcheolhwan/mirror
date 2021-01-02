import { FormEvent, useEffect, useState } from "react"
import { AccAddress, MnemonicKey } from "@terra-money/terra.js"
import useForm from "../../libs/useForm"
import wordlist from "../../wallet/wordlist.json"
import { validate as v } from "../../libs/formHelpers"
import { useLCDClient, useWallet } from "../../hooks"
import Tab from "../../components/Tab"
import FormGroup from "../../components/FormGroup"
import Button from "../../components/Button"

const MNEMONIC =
  "notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius"

const RecoverWalletForm = () => {
  const { recover } = useWallet()

  const { values, setValue, setValues, handleChange, ...form } = useForm(
    { mnemonic: "", password: "", address: "" },
    ({ mnemonic, password, address }) => ({
      mnemonic: validateMnemonic(mnemonic),
      password: v.required(password),
      address: v.address(address, [AccAddress.validate]),
    })
  )

  const { getFields, invalid, errors } = form
  const { mnemonic, password, address } = values

  const { mk118, mk330 } = useGenerateAddresses(
    !errors.mnemonic ? mnemonic : undefined
  )

  const { hasBalances, loading } = useFetch118Balances(
    !errors.mnemonic ? mk118?.accAddress : undefined
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const mk = address === mk118?.accAddress ? mk118 : mk330
    mk && recover(mk, password)
  }

  /* set default address */
  useEffect(() => {
    const setDefaultAddress = () => {
      const address = hasBalances ? mk118?.accAddress : mk330?.accAddress
      address && setValues((values) => ({ ...values, address }))
    }

    !loading && setDefaultAddress()
  }, [hasBalances, loading, setValues, mk118, mk330])

  /* render */
  const selectAddress = !loading && hasBalances && mk118 && mk330 && (
    <select
      value={address}
      onChange={(e) => setValue("address", e.target.value)}
    >
      {[mk118!, mk330!].map(({ accAddress }) => (
        <option value={accAddress} key={accAddress}>
          {accAddress}
        </option>
      ))}
    </select>
  )

  const fields = getFields({
    address: Object.assign(
      { label: "Address" },
      selectAddress
        ? { select: selectAddress }
        : { value: address || "Enter your seed below" }
    ),
    mnemonic: {
      label: "Seed",
      textarea: { autoFocus: true, placeholder: MNEMONIC },
    },
    password: {
      label: "Password",
      input: { type: "password" },
    },
  })

  return (
    <Tab tabs={["Recover"]} current="Recover">
      <form onSubmit={handleSubmit}>
        <FormGroup {...fields["address"]} type={2} />
        <FormGroup {...fields["mnemonic"]} type={2} />
        <FormGroup {...fields["password"]} type={2} />

        <Button type="submit" size="lg" submit disabled={invalid}>
          Recover
        </Button>
      </form>
    </Tab>
  )
}

export default RecoverWalletForm

/* hooks */
const useGenerateAddresses = (mnemonic?: string) => {
  const [mk118, setMnemonicKey118] = useState<MnemonicKey>()
  const [mk330, setMnemonicKey330] = useState<MnemonicKey>()

  useEffect(() => {
    const generateAddresses = () => {
      const mk118 = new MnemonicKey({ mnemonic, coinType: 118 })
      const mk330 = new MnemonicKey({ mnemonic, coinType: 330 })
      setMnemonicKey118(mk118)
      setMnemonicKey330(mk330)
    }

    mnemonic && generateAddresses()
  }, [mnemonic])

  return { mk118, mk330 }
}

const useFetch118Balances = (address?: string) => {
  const [hasBalances, setHasBalances] = useState<boolean>()
  const [loading, setLoading] = useState(false)
  const client = useLCDClient()

  useEffect(() => {
    const fetchBalances = async (address: string) => {
      setLoading(true)
      const balance = await client.bank.balance(address)
      setHasBalances(!!balance.toData().length)
      setLoading(false)
    }

    address && fetchBalances(address)
  }, [address, client])

  return { hasBalances, loading }
}

/* helpers */
const validateMnemonic = (mnemonic: string) => {
  const array = mnemonic.split(" ")
  const valid =
    array.length === 24 && array.every((word) => wordlist.includes(word))

  return !valid ? "Invalid" : ""
}
