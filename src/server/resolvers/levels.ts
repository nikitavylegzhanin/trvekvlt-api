import { Resolver, Query, Arg, ID, Mutation, Int } from 'type-graphql'

import db, { Bot, Level, LevelStatus } from '../../db'

@Resolver()
export class LevelsResolver {
  @Query(() => [Level])
  levels(@Arg('botId', () => ID) botId: Bot['id']): Promise<Level[]> {
    return db.manager.find(Level, {
      where: { bot: { id: botId } },
      relations: ['openPositions', 'closedPositions'],
    })
  }

  @Mutation(() => Level)
  async addLevel(
    @Arg('botId', () => ID) botId: Bot['id'],
    @Arg('value') value: number
  ): Promise<Level> {
    const level =
      (await db.manager.findOne(Level, {
        where: { bot: { id: botId }, value },
      })) || db.manager.create(Level, { bot: { id: botId }, value })

    return db.manager.save(level)
  }

  @Mutation(() => Int)
  async changeLevelStatus(
    @Arg('levelId', () => ID) levelId: Level['id'],
    @Arg('status', () => LevelStatus) status: LevelStatus
  ): Promise<number> {
    const { affected } = await db.manager.update(Level, levelId, { status })

    return affected
  }

  @Mutation(() => Int)
  async deleteLevel(
    @Arg('levelId', () => ID) levelId: Level['id']
  ): Promise<number> {
    const { affected } = await db.manager.delete(Level, levelId)

    return affected
  }
}
