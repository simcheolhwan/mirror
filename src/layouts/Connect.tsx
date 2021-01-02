import { useHistory } from "react-router-dom"
import MESSAGE from "../lang/MESSAGE.json"
import { isElectron } from "../constants"
import { useWallet } from "../hooks"
import { getPath, MenuKey } from "../routes"
import { useModal } from "../containers/Modal"
import ConnectButton from "../components/ConnectButton"
import Connected from "./Connected"
import SupportModal from "./SupportModal"

const Connect = () => {
  const { push } = useHistory()
  const { address, installed, connect } = useWallet()
  const modal = useModal()

  const handleClick = () =>
    isElectron
      ? push(getPath(MenuKey.AUTH))
      : installed
      ? connect()
      : modal.open()

  return !address ? (
    <>
      <ConnectButton onClick={handleClick}>
        {MESSAGE.Wallet.Connect}
      </ConnectButton>

      <SupportModal {...modal} />
    </>
  ) : (
    <Connected />
  )
}

export default Connect
