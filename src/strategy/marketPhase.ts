const DELAY = 30 * 60 * 1000

export const isTradingInterval = (
  date: Date,
  startDate: Date,
  endDate: Date
) => {
  const time = date.getTime()

  return (
    time >= startDate.getTime() + DELAY && time <= endDate.getTime() - DELAY
  )
}
