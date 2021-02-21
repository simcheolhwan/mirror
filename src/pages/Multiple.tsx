import useHash from "../libs/useHash"
import Page from "../components/Page"
import WeekendForm from "../forms/MultipleForm"

export enum Type {
  "BUY" = "buy",
  "SELL" = "sell",
  "PROVIDE" = "provide",
  "STAKE" = "stake",
  "UNSTAKE" = "unstake",
}

const Weekend = () => {
  const { hash: type } = useHash<Type>(Type.UNSTAKE)
  const tab = {
    tabs: [Type.BUY, Type.SELL, Type.PROVIDE, Type.STAKE, Type.UNSTAKE],
    current: type,
  }

  return (
    <Page title="Multiple">
      {type && <WeekendForm type={type} tab={tab} key={type} />}
    </Page>
  )
}

export default Weekend
