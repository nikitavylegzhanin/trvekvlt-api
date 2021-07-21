import { plot as chart } from 'asciichart'

export const logChart = (data: number[]) => {
  console.log('\n')

  console.log(
    chart(data, {
      padding: '',
      offset: 2,
      height: 6,
    })
  )
}
