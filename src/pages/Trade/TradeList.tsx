import Tooltips from "../../lang/Tooltips"
import { gt, number, minus } from "../../libs/math"
import { PriceKey } from "../../hooks/contractKeys"
import { useProtocol } from "../../data/contract/protocol"
import { useTerraAssetList } from "../../data/stats/list"
import { useAssetsHistory } from "../../data/stats/assets"

import Table from "../../components/Table"
import Change from "../../components/Change"
import Formatted from "../../components/Formatted"
import Percent from "../../components/Percent"
import AssetItem from "../../components/AssetItem"
import { TooltipIcon } from "../../components/Tooltip"
import useListFilter, { Sorter } from "../../components/useListFilter"
import ChartContainer from "../../containers/ChartContainer"
import AssetsIdleTable from "../../containers/AssetsIdleTable"
import { TradeType } from "../../types/Types"

const Sorters: Dictionary<Sorter> = {
  TOPTRADING: {
    label: "Top Trading",
    compare: (a, b) => number(minus(b.volume, a.volume)),
  },
  TOPGAINER: {
    label: "Top Gainer",
    compare: (a, b) => number(minus(b.change, a.change)),
  },
  TOPLOSER: {
    label: "Top Loser",
    compare: (a, b) => number(minus(a.change, b.change)),
  },
}

const TradeList = () => {
  const { getSymbol } = useProtocol()
  const list = useTerraAssetList()
  const history = useAssetsHistory()
  const { filter, compare, renderSearch } = useListFilter("TOPTRADING", Sorters)

  const dataSource = list
    .filter(({ name, symbol }) => [name, symbol].some(filter))
    .sort(compare)
    .sort((a, b) => Number(b.symbol === "MIR") - Number(a.symbol === "MIR"))

  return (
    <>
      {renderSearch()}
      {!list.length ? (
        <AssetsIdleTable />
      ) : (
        <Table
          rowKey="token"
          rows={({ token }) =>
            Object.assign(
              { to: { hash: TradeType.BUY, state: { token } } },
              getSymbol(token) === "MIR" && { background: "darker" }
            )
          }
          columns={[
            {
              key: "token",
              title: "Ticker",
              render: (token) => <AssetItem token={token} />,
              width: "25%",
              bold: true,
            },
            {
              key: PriceKey.PAIR,
              title: "Terraswap Price",
              render: (price, { change }) =>
                gt(price, 0) && [
                  <Formatted unit="UST">{price}</Formatted>,
                  <Change align="right">{change}</Change>,
                ],
              align: "right",
            },
            {
              key: "history",
              title: (
                <TooltipIcon content={Tooltips.Trade.Chart}>
                  24h Chart
                </TooltipIcon>
              ),
              render: (_, { token }) => (
                <ChartContainer
                  datasets={
                    history?.[token]?.map(({ timestamp, price }) => {
                      return { x: timestamp, y: number(price) }
                    }) ?? []
                  }
                  compact
                />
              ),
              align: "right",
              desktop: true,
            },
            {
              key: "premium",
              title: (
                <TooltipIcon content={Tooltips.Trade.Premium}>
                  Premium
                </TooltipIcon>
              ),
              render: (value) => <Percent>{value}</Percent>,
              align: "right",
              desktop: true,
            },
            {
              key: "volume",
              title: "Volume",
              render: (value) => <Formatted symbol="uusd">{value}</Formatted>,
              align: "right",
              width: "19%",
              desktop: true,
            },
          ]}
          dataSource={dataSource}
        />
      )}
    </>
  )
}

export default TradeList
