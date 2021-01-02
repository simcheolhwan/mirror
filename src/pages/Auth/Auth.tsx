import { useEffect } from "react"
import { RouteProps, useHistory, useRouteMatch } from "react-router-dom"
import routes, { getPath, MenuKey } from "../../routes"
import { useWallet } from "../../hooks"
import Page from "../../components/Page"
import Container from "../../components/Container"
import AuthMenu from "./AuthMenu"
import RecoverWalletForm from "./RecoverWalletForm"
import SelectWalletForm from "./SelectWalletForm"
import GlanceWalletForm from "./GlanceWalletForm"

export enum AuthMenuKey {
  INDEX = "Auth",
  RECOVER = "Recover",
  SELECT = "Select",
  GLANCE = "Glance",
}

export const menu: Record<AuthMenuKey, RouteProps> = {
  [AuthMenuKey.INDEX]: { path: "/", exact: true, component: AuthMenu },
  [AuthMenuKey.RECOVER]: { path: "/recover", component: RecoverWalletForm },
  [AuthMenuKey.SELECT]: { path: "/select", component: SelectWalletForm },
  [AuthMenuKey.GLANCE]: { path: "/glance", component: GlanceWalletForm },
}

const Auth = () => {
  const { address } = useWallet()
  const { replace } = useHistory()
  const { path } = useRouteMatch()

  useEffect(() => {
    address && replace(getPath(MenuKey.MY))
  }, [address, replace])

  return address ? null : (
    <Page>
      <Container sm>{routes(menu, path)}</Container>
    </Page>
  )
}

export default Auth
