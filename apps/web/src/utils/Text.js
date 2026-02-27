export const truncateText = (text, maxLength = 75) => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + '...'
}

export const formatPriceToRupiah = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(price)
}
