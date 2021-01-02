import Card from "../../components/Card"
import Submenu from "../../components/Submenu"
import { isElectron } from "../../constants"
import { useWallet } from "../../hooks"

const AuthMenu = () => {
  const { wallets } = useWallet()

  const menu = isElectron
    ? [
        { title: "Recover", to: "/auth/recover" },
        { title: "Select", to: "/auth/select", disabled: !wallets.length },
      ]
    : [{ title: "View an address", to: "/auth/glance" }]

  return (
    <Card lg>
      <Submenu title="Auth" list={menu} />
    </Card>
  )
}

export default AuthMenu
