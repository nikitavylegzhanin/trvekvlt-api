import {
  Resolver,
  Query,
  Args,
  ArgsType,
  Field,
  ID,
  Int,
  ObjectType,
  Float,
} from 'type-graphql'
import { Between, LessThan } from 'typeorm'

import db, { Bot, Trend, Position, Order } from '../../db'
import { getInstrument, getCandles } from '../../api'

@ObjectType()
class Candle {
  @Field(() => Date)
  date: Date

  @Field(() => Float)
  low: number
  @Field(() => Float)
  open: number
  @Field(() => Float)
  close: number
  @Field(() => Float)
  high: number
  @Field(() => Float)
  volume: number
}

@ObjectType()
class Chart {
  @Field(() => [Candle])
  candles: Candle[]

  @Field(() => [Trend])
  trends: Trend[]

  @Field(() => [Order])
  orders: Order[]
}

@ArgsType()
class ChartArgs {
  @Field(() => ID)
  botId: Bot['id']

  @Field(() => Date)
  from: Date

  @Field(() => Date)
  to: Date

  @Field(() => Int)
  interval: number
}

@Resolver()
export class ChartResolver {
  @Query(() => Chart)
  async chart(
    @Args() { botId, from, to, interval }: ChartArgs
  ): Promise<Chart> {
    const bot = await db.manager.findOneOrFail(Bot, {
      where: { id: botId },
    })

    const { figi } = await getInstrument(bot.ticker, bot.instrumentType)
    const candles = await getCandles(figi, from, to, interval)

    const firstTrend = await db.manager.findOne(Trend, {
      order: { createdAt: 'DESC' },
      where: { bot: { id: bot.id }, createdAt: LessThan(from) },
    })
    const trends = await db.manager.find(Trend, {
      where: { bot: { id: bot.id }, createdAt: Between(from, to) },
    })

    const positions = await db.manager.find(Position, {
      relations: ['orders'],
      where: { bot: { id: bot.id }, createdAt: Between(from, to) },
    })
    const orders = positions.reduce(
      (arr, position) => [
        ...arr,
        ...position.orders.map((order) => ({
          ...order,
          position: {
            ...position,
            orders: undefined,
          },
        })),
      ],
      [] as Order[]
    )

    return {
      candles,
      trends: [firstTrend, ...trends].filter((trend) => !!trend),
      orders,
    }
  }
}
