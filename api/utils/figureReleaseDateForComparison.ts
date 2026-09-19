export function getMonthMaxDate (year: string, month: string) {
  if (month === '02') {
    const yearInt = parseInt(year)

    return yearInt % 4 === 0 && (yearInt % 100 !== 0 || yearInt % 400 === 0) ? '29' : '28'
  }

  if (/(04|06|09|11)/.test(month)) return '30'

  return '31'
}

export default function figureReleaseDate (releaseDate: string) {
  const splitDate = releaseDate.split('/')

  let year = ''
  let month = ''
  let date = ''

  switch (splitDate.length) {
    case 1:
      year = splitDate[0]
      break

    case 2:
      if (splitDate[0].length === 4) {
        year = splitDate[0]
        month = splitDate[1]
      } else {
        month = splitDate[0]
        year = splitDate[1]
      }

      break

    case 3:
      if (splitDate[0].length === 4) {
        year = splitDate[0]
        month = splitDate[1]
        date = splitDate[2]
      } else {
        month = splitDate[0]
        date = splitDate[1]
        year = splitDate[2]
      }
      break
  }

  month = month || '12'
  date = date || getMonthMaxDate(year, month)

  const dateString = `${year}/${month}/${date}`

  return new Date(dateString)
}
