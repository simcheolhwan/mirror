import { FormEvent } from "react"
import MESSAGE from "../../lang/MESSAGE.json"
import useForm from "../../libs/useForm"
import { validate as v } from "../../libs/formHelpers"
import { useWallet } from "../../hooks"
import FormGroup from "../../components/FormGroup"
import Button from "../../components/Button"

const GlanceWalletForm = () => {
  const { glance } = useWallet()

  const { values, getFields, invalid } = useForm(
    { address: "" },
    ({ address }) => ({
      address: v.address(address),
    })
  )

  const fields = getFields({
    address: { label: "Address", input: { autoFocus: true } },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const { address } = values
    !invalid && glance(address)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormGroup {...fields["address"]} />
      <Button type="submit" size="lg" submit disabled={invalid}>
        {MESSAGE.Form.Button.ConnectWallet}
      </Button>
    </form>
  )
}

export default GlanceWalletForm
