import { Link } from "react-router-dom"
import classNames from "classnames"
import MESSAGE from "../lang/MESSAGE.json"
import { EXTENSION, isElectron } from "../constants"
import { useWallet } from "../hooks"
import { getPath, MenuKey } from "../routes"
import ExtLink from "../components/ExtLink"
import Empty from "../components/Empty"
import styles from "./ConnectionRequired.module.scss"

const ConnectionRequired = () => {
  const { installed, connect } = useWallet()

  const action = !installed ? (
    <ExtLink href={EXTENSION}>{MESSAGE.Wallet.DownloadExtension}</ExtLink>
  ) : (
    <button className={styles.button} onClick={connect}>
      {MESSAGE.Wallet.ConnectWallet}
    </button>
  )

  return (
    <Empty>
      {isElectron ? (
        <Link className={styles.button} to={getPath(MenuKey.AUTH)}>
          {MESSAGE.Wallet.ConnectWallet}
        </Link>
      ) : (
        <>
          <Link
            to="/auth/glance"
            className={classNames(styles.button, "mobile")}
          >
            {MESSAGE.Wallet.Glance}
          </Link>
          <div className="desktop">{action}</div>
        </>
      )}
    </Empty>
  )
}

export default ConnectionRequired
