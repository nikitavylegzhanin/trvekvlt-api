import { Resolver, Query, Arg, ID, Mutation } from 'type-graphql'

import db, { Bot, Trend, TrendDirection } from '../../db'

@Resolver()
export class TrendsResolver {
  @Query(() => [Trend])
  trends(@Arg('botId', () => ID) botId: Bot['id']): Promise<Trend[]> {
    return db.manager.find(Trend, {
      where: { bot: { id: botId } },
      order: { createdAt: 'DESC' },
    })
  }

  @Mutation(() => Trend)
  async addTrend(
    @Arg('botId', () => ID) botId: Bot['id'],
    @Arg('direction', () => TrendDirection) direction: TrendDirection
  ): Promise<Trend> {
    const lastTrend = await db.manager.findOne(Trend, {
      where: { bot: { id: botId } },
      order: { createdAt: 'DESC' },
    })

    const trend =
      lastTrend.direction === direction
        ? lastTrend
        : db.manager.create(Trend, { bot: { id: botId }, direction })

    return db.manager.save(trend)
  }
}
