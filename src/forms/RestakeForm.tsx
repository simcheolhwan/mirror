import { FormEvent } from "react"

import { MIR, UUSD } from "../constants"
import { div, gt, minus } from "../libs/math"
import { format, formatAsset } from "../libs/parse"
import { percent } from "../libs/num"
import { renderBalance, validate as v } from "../libs/formHelpers"
import useForm from "../libs/useForm"

import { useContract, useContractsAddress } from "../hooks"
import { BalanceKey, PriceKey } from "../hooks/contractKeys"
import Container from "../components/Container"
import FormGroup from "../components/FormGroup"
import FormFeedback from "../components/FormFeedback"
import Tab from "../components/Tab"
import Dl from "../components/Dl"
import Table from "../components/Table"
import Loading from "../components/Loading"
import Icon from "../components/Icon"
import Tooltip from "../components/Tooltip"
import Button from "../components/Button"
import LinkButton from "../components/LinkButton"

import { getPath, MenuKey } from "../routes"
import useMy from "../pages/My/useMy"
import useSelectAsset, { Config } from "./useSelectAsset"
import TxHash from "./TxHash"
import useRestake, { Status } from "./useRestake"
import styles from "./RestakeForm.module.scss"

const RestakeForm = () => {
  const priceKey = PriceKey.PAIR
  const balanceKey = BalanceKey.LPSTAKED

  /* context */
  const { getToken, getSymbol } = useContractsAddress()
  const { find } = useContract()
  const { stake } = useMy()
  const { price, totalRewards, totalRewardsValue } = stake

  /* form */
  const { values, setValue, getFields } = useForm(
    { token: getToken(MIR) },
    ({ token }) => ({ token: v.required(token) })
  )

  const { token } = values
  const symbol = getSymbol(token)

  const config: Config = {
    token,
    priceKey,
    balanceKey,
    onSelect: (value) => setValue("token", value),
  }

  const select = useSelectAsset(config)
  const fields = getFields({
    token: {
      label: "Restake to",
      select: select.button,
      assets: select.assets,
      focused: select.isOpen,
      help: renderBalance(find(balanceKey, token), symbol),
    },
  })

  /* submit */
  const restake = useRestake(symbol, { skipClaim: !gt(totalRewardsValue, 0) })
  const { data, submit, loading, submitted } = restake

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit()
  }

  /* render */
  const info = [
    {
      title: "Rewards",
      content: formatAsset(totalRewards, MIR, { integer: true }),
    },
    {
      title: "MIR Price",
      content: `${format(price)} UST`,
    },
    {
      title: "Value",
      content: formatAsset(totalRewardsValue, UUSD, { integer: true }),
    },
  ]

  const icons = {
    [Status.LOADING]: <Loading size={18} />,
    [Status.FAILURE]: <Icon name="highlight_off" size={20} className="red" />,
    [Status.SUCCESS]: (
      <Icon name="check_circle_outline" size={20} className="aqua" />
    ),
  }

  const isDone = submitted && !loading

  const terraswapPrice = find(priceKey, token)
  const oraclePrice = find(PriceKey.ORACLE, token)
  const premium = minus(div(terraswapPrice, oraclePrice), 1)

  return (
    <Container sm>
      <Tab tabs={["restake"]} current="restake">
        <Dl className={styles.info} list={info} align="center" />

        <form onSubmit={handleSubmit}>
          <FormGroup {...fields["token"]} />

          <Table
            columns={
              !submitted
                ? [{ key: "action", bold: true }]
                : [
                    { key: "action", bold: true },
                    { key: "hash", render: (hash) => <TxHash>{hash}</TxHash> },
                    {
                      key: "status",
                      render: (status, { log }) => {
                        const icon = icons[status as Status]

                        return log ? (
                          <Tooltip content={log}>{icon}</Tooltip>
                        ) : (
                          icon
                        )
                      },
                      flex: true,
                      align: "center",
                      fixed: "right",
                    },
                  ]
            }
            dataSource={data.filter(({ action }) => action)}
          />

          {symbol !== "MIR" && gt(premium, 0.015) && (
            <FormFeedback>{percent(premium)}</FormFeedback>
          )}

          {!isDone && (
            <Button type="submit" size="lg" submit disabled={submitted}>
              Submit
            </Button>
          )}
        </form>

        {isDone && (
          <LinkButton to={getPath(MenuKey.MY)} type="button" size="lg" submit>
            {MenuKey.MY}
          </LinkButton>
        )}
      </Tab>
    </Container>
  )
}

export default RestakeForm
