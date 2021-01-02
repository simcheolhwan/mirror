import { truncate } from "../../libs/text"
import { useWallet } from "../../hooks"
import Icon from "../../components/Icon"
import { useModal } from "../../containers/Modal"
import styles from "./QuickSwitch.module.scss"

const QuickSwitch = () => {
  const { isOpen, toggle } = useModal()
  const { address, wallets, glance, setKey } = useWallet()

  return wallets.length > 1 ? (
    <div className={styles.wrapper}>
      <button className={styles.button} onClick={toggle}>
        Switch wallet
        <Icon name={isOpen ? "arrow_drop_up" : "arrow_drop_down"} size={18} />
      </button>

      {isOpen &&
        wallets
          .filter((wallet) => wallet.address !== address)
          .map(({ address: value }) => {
            const onSelect = () => {
              glance(value)
              setKey(undefined)
            }

            return (
              <button className={styles.item} onClick={onSelect} key={value}>
                {truncate(value, [12, 12])}
              </button>
            )
          })}
    </div>
  ) : null
}

export default QuickSwitch
