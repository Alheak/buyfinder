export default function getPriceValueFromString (priceString: string) {
  priceString = (/([0-9]{1,3}[\.\,\s]?)*[0-9]{1,3}([\.\,][0-9]{1,2})?/.exec(priceString) || [priceString])[0]

  const trailingNumbersLength = (priceString.split(/[\.\,]/).pop() || '').length
  const numberDelimitors: string[] = priceString.match(/[\,\.\s]/g) || []

  if (trailingNumbersLength > 2) {
    priceString = priceString.replaceAll(/[^0-9]/g, '')
  } else if (numberDelimitors.length >= 2) {
    const regex = new RegExp(`\\${numberDelimitors[0]}`, 'g')

    priceString = priceString.replaceAll(regex, '')
  }

  priceString = priceString.replace(/[\,\.]/, '.')

  return parseFloat(priceString)
}
