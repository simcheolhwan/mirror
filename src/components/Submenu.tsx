import SubmenuItem, { Props as SubmenuItemProps } from "./SubmenuItem"
import styles from "./Submenu.module.scss"

interface Props {
  title: string
  list: SubmenuItemProps[]
}

const Submenu = ({ title, list }: Props) => {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </header>

      {list.map((item) => (
        <SubmenuItem {...item} key={item.title} />
      ))}
    </>
  )
}

export default Submenu
