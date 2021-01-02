import { FormEvent } from "react"
import { truncate } from "../../libs/text"
import useForm from "../../libs/useForm"
import { validate as v } from "../../libs/formHelpers"
import { useWallet } from "../../hooks"
import Tab from "../../components/Tab"
import FormGroup from "../../components/FormGroup"
import Button from "../../components/Button"

const SelectWalletForm = ({ address: initial }: { address?: string }) => {
  const { wallets, decrypt } = useWallet()

  const { values, setValue, getFields, invalid } = useForm(
    { address: initial ?? wallets[0]?.address, password: "" },
    ({ password }) => ({
      address: "",
      password: v.required(password),
    })
  )

  const { address, password } = values

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    try {
      const wallet = wallets.find((wallet) => wallet.address === address)!
      decrypt(wallet, password)
    } catch (error) {
      alert(error.message)
    }
  }

  /* render */
  const select = (
    <select
      value={address}
      onChange={(e) => setValue("address", e.target.value)}
    >
      {wallets.map(({ address }) => (
        <option value={address} key={address}>
          {truncate(address, [8, 8])}
        </option>
      ))}
    </select>
  )

  const fields = getFields({
    address: Object.assign(
      { label: "Address" },
      initial ? { value: address } : { select }
    ),
    password: {
      label: "Password",
      input: { type: "password", autoFocus: true },
    },
  })

  const tab = initial ? "Decrypt walllet" : "Select wallet"

  return (
    <Tab tabs={[tab]} current={tab}>
      <form onSubmit={handleSubmit}>
        <FormGroup {...fields["address"]} type={2} />
        <FormGroup {...fields["password"]} type={2} />

        <Button type="submit" size="lg" submit disabled={invalid}>
          Connect
        </Button>
      </form>
    </Tab>
  )
}

export default SelectWalletForm
