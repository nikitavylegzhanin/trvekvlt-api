import type { MoneyValue__Output } from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/MoneyValue'
import type { PostOrderRequest } from '@tinkoff/invest-js/build/generated/tinkoff/public/invest/api/contract/v1/PostOrderRequest'

jest.mock('telegraf')

jest.mock('@tinkoff/invest-js', () => ({
  OpenAPIClient: jest.fn().mockImplementation(() => ({
    marketDataStream: {
      marketDataStream: () => ({}),
    },
    sandbox: {
      postSandboxOrder: (
        { quantity, direction, orderType, price }: PostOrderRequest,
        callback: any
      ) => {
        const executedOrderPrice: MoneyValue__Output = {
          currency: 'test',
          units: price.units.toString(),
          nano: price.nano,
        }

        return callback(null, {
          executedOrderPrice,
          quantity,
          direction,
          orderType,
        })
      },
    },
  })),
}))
