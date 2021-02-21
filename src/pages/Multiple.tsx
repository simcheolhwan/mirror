import useHash from "../libs/useHash"
import Page from "../components/Page"
import Tab from "../components/Tab"
import MultipleForm from "../forms/MultipleForm"

export enum Type {
  "BUY" = "buy",
  "SELL" = "sell",
  "FARM" = "farm",
  "UNSTAKE" = "unstake",
}

const Multiple = () => {
  const { hash: type } = useHash<Type>(Type.UNSTAKE)

  return (
    <Page title="Multiple">
      <Tab tabs={[Type.BUY, Type.SELL, Type.FARM, Type.UNSTAKE]} current={type}>
        {type && <MultipleForm type={type} key={type} />}
      </Tab>
    </Page>
  )
}

export default Multiple
