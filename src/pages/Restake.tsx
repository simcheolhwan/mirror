import { isElectron } from "../constants"
import Page from "../components/Page"
import RestakeForm from "../forms/RestakeForm"
import { useWallet } from "../hooks"
import DecryptWallet from "./Auth/DecryptWallet"

const Restake = () => {
  const { address, key } = useWallet()
  const shouldDecrypt = isElectron && address && !key

  return (
    <Page title="Restake">
      {shouldDecrypt ? <DecryptWallet /> : <RestakeForm />}
    </Page>
  )
}

export default Restake
