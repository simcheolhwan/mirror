import { useWallet } from "../../hooks"
import Container from "../../components/Container"
import SelectWalletForm from "./SelectWalletForm"

const DecryptWallet = () => {
  const { address } = useWallet()

  return (
    <Container sm>
      <SelectWalletForm address={address} />
    </Container>
  )
}

export default DecryptWallet
