import { Link, LinkProps } from "react-router-dom"
import Icon from "./Icon"
import styles from "./SubmenuItem.module.scss"

export interface Props extends LinkProps {
  title: string
  desc?: string
  disabled?: boolean
}

const SubmenuItem = ({ title, desc, disabled, ...rest }: Props) => {
  return disabled ? null : (
    <Link {...rest} className={styles.link}>
      <article>
        <h1 className={styles.title}>{title}</h1>
        {desc && <p className={styles.desc}>{desc}</p>}
      </article>

      <Icon name="chevron_right" size={24} />
    </Link>
  )
}

export default SubmenuItem
