const axios = require('axios')
const cheerio = require('cheerio')
const scrapingbee = require('scrapingbee')
const randomstring = require('randomstring')

// repos
// const ProductSearchRepo = require('../repositories/ProductSearchRepo')
// const CatalogSearchRepo = require('../repositories/CatalogSearchRepo')

const SCRAPINGBEE_CLINET = new scrapingbee.ScrapingBeeClient(
  'T30TVYLUK7TOWGTJ1F22XO828RCMHXVA91QDFZRJTYX1R174ZMAMVZUCM7H9PWRL8BP1ZOFCPL3RMGRB'
)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isJsonString(str) {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

function generate_nnb() {
  const x = randomstring.generate({
    length: 13,
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  })
  return x
}

function validateJSON(jsonData) {
  try {
    JSON.parse(jsonData)
    return true
  } catch (err) {
    return false
  }
}

function generate_page_uid() {
  const randomChars = randomstring.generate({
    length: 16,
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  })
  const suffix = randomstring.generate({ length: 1, charset: 'st' })
  const digits = randomstring.generate({
    length: 2,
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  })
  const hyphen = '-'
  const trailingDigits = randomstring.generate({
    length: 6,
    charset: '0123456789',
  })
  const x = `h1${suffix}${randomChars}${digits}${hyphen}${trailingDigits}`
  return x
}

function generate_naver_usersession() {
  const x =
    randomstring.generate({
      length: 22,
      charset:
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    }) + '=='
  return x
}

function generate_sus_val() {
  const x = randomstring.generate({
    length: 24,
    charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  })
  return x
}

// Example usage:
const config = 'https://api.example.com/data'
const isJson = true

async function crawlNaverLowestPriceSearch(query) {
  const crawledData = []

  try {
    const headers = {
      referer: `https://m.search.naver.com/search.naver?sm=mtp_hty.top&where=m&query=${encodeURIComponent(
        query
      )}`,
    }

    const cookies = {
      NFS: '2',
      NNB: generate_nnb(),
      page_uid: generate_page_uid(),
      _naver_usersession_: generate_naver_usersession(),
      sus_val: generate_sus_val(),
    }

    const url = `https://msearch.shopping.naver.com/search/all?includeDeliveryFee=true&sort=rel&viewType=lst&productSet=model&frm=NVSHMDL&pagingIndex=1&query=${encodeURIComponent(
      query
    )}`

    const response = await axios.get(url, {
      params: { render_js: 'False', timeout: '10000' },
      headers,
      cookies,
    })

    if (response.status === 200) {
      const $ = cheerio.load(response.data)

      const scriptData = $('script#__NEXT_DATA__').html()
      if (scriptData) {
        const parsedData = JSON.parse(scriptData)

        const productCards = $('div.product_list_item__b84TO')
        const catalogCards = []

        productCards.each((index, productCard) => {
          const catalogCard = $(productCard).find('div.product_seller__pfVOU')
          if (catalogCard.length > 0) {
            const sellerCountText = catalogCard
              .find('span.product_count__C1gbp')
              .text()
            const sellerCount = parseInt(sellerCountText.replace(/\D/g, ''), 10)
            if (sellerCount >= 100) {
              catalogCards.push(productCard)
            }
          }
        })

        catalogCards.forEach((catalogCard) => {
          const title = $(catalogCard)
            .find('span.product_info_tit__c5_pb')
            .text()
            .trim()
          const url = $(catalogCard)
            .find('a.product_info_main__piyRs')
            .attr('href')
          const imageUri = $(catalogCard)
            .find('span.product_img_area__1aA4L img')
            .attr('src')
          const total_price_tag = $(catalogCard).find(
            '.product_num__iQsWh strong'
          )
          const totalPrice =
            total_price_tag.length > 0
              ? total_price_tag.text().replace(/\D/g, '')
              : null
          const catalogNumber = $(catalogCard)
            .find('a.product_info_main__piyRs')
            .attr('data-i')
            .slice(0, 11)
          const rating_tag = $(catalogCard).find('.product_grade__qkI47 strong')
          const ratingScore = rating_tag.length > 0 ? rating_tag.text() : 0
          const ratingCount = $(catalogCard).find('em').text().trim()

          crawledData.push({
            item: {
              title,
              url,
              imageUri,
              totalPrice,
              catalogNumber,
              ratingScore,
              ratingCount,
            },
          })
        })
      }

      return crawledData
    } else if (response.status === 401 && validateJSON(response.data)) {
      try {
        const responseData = JSON.parse(response.data)
        if (
          'message' in responseData &&
          responseData.message.includes('limit')
        ) {
          return crawledData
        }
      } catch (e) {
        console.log('response 401 error', e)
      }
    }
  } catch (error) {
    console.error('Naver exception:', error, query)
  }

  return crawledData
}

// async function crawlNaverLowestPriceSearch(productNumber) {
//   const crawledData = []

//   try {
//     const headers = {
//       referer: `https://m.search.naver.com/search.naver?sm=mtp_hty.top&where=m&query=${encodeURIComponent(
//         productNumber
//       )}`,
//     }

//     const cookies = {
//       NFS: '2',
//       NNB: generate_nnb(),
//       page_uid: generate_page_uid(),
//       _naver_usersession_: generate_naver_usersession(),
//       sus_val: generate_sus_val(),
//     }

//     const url = `https://msearch.shopping.naver.com/catalog/${productNumber}?deliveryCharge=true`

//     const response = await axios.get(url, {
//       params: { render_js: 'False', timeout: '10000' },
//       headers,
//       cookies,
//     })

//     if (response.status === 200) {
//       const $ = cheerio.load(response.data)

//       const scriptData = $('script#__NEXT_DATA__').html()
//       if (scriptData) {
//         const parsedData = JSON.parse(scriptData)

//         const productCards = $('div.product_list_item__b84TO')
//         const catalogCards = []

//         productCards.each((index, productCard) => {
//           const catalogCard = $(productCard).find('div.product_seller__pfVOU')
//           if (catalogCard.length > 0) {
//             const sellerCountText = catalogCard
//               .find('span.product_count__C1gbp')
//               .text()
//             const sellerCount = parseInt(sellerCountText.replace(/\D/g, ''), 10)
//             if (sellerCount >= 100) {
//               catalogCards.push(productCard)
//             }
//           }
//         })

//         catalogCards.forEach((catalogCard) => {
//           const title = $(catalogCard)
//             .find('span.product_info_tit__c5_pb')
//             .text()
//             .trim()
//           const url = $(catalogCard)
//             .find('a.product_info_main__piyRs')
//             .attr('href')
//           const imageUri = $(catalogCard)
//             .find('span.product_img_area__1aA4L img')
//             .attr('src')
//           const total_price_tag = $(catalogCard).find(
//             '.product_num__iQsWh strong'
//           )
//           const totalPrice =
//             total_price_tag.length > 0
//               ? total_price_tag.text().replace(/\D/g, '')
//               : null
//           const catalogNumber = $(catalogCard)
//             .find('a.product_info_main__piyRs')
//             .attr('data-i')
//             .slice(0, 11)
//           const rating_tag = $(catalogCard).find('.product_grade__qkI47 strong')
//           const ratingScore = rating_tag.length > 0 ? rating_tag.text() : 0
//           const ratingCount = $(catalogCard).find('em').text().trim()

//           crawledData.push({
//             item: {
//               title,
//               url,
//               imageUri,
//               totalPrice,
//               catalogNumber,
//               ratingScore,
//               ratingCount,
//             },
//           })
//         })
//       }

//       return crawledData
//     } else if (response.status === 401 && validateJSON(response.data)) {
//       try {
//         const responseData = JSON.parse(response.data)
//         if (
//           'message' in responseData &&
//           responseData.message.includes('limit')
//         ) {
//           return crawledData
//         }
//       } catch (e) {
//         console.log('response 401 error', e)
//       }
//     }
//   } catch (error) {
//     console.error('Naver exception:', error, query)
//   }

//   return crawledData
// }

async function crawlNaverProductCatalog(productNumber) {
  try {
    const headers = {
      referer: `https://m.search.naver.com/search.naver?sm=mtp_hty.top&where=m&query=${encodeURIComponent(
        productNumber
      )}`,
    }

    const cookies = {
      NFS: '2',
      NNB: generate_nnb(),
      page_uid: generate_page_uid(),
      _naver_usersession_: generate_naver_usersession(),
      sus_val: generate_sus_val(),
    }

    const url = `https://msearch.shopping.naver.com/catalog/${productNumber}?deliveryCharge=true`

    const response = await axios.get(url, {
      params: { render_js: 'False', timeout: '10000' },
      headers,
      cookies,
    })

    if (response.status === 200) {
      const $ = cheerio.load(response.data)

      const image_tag = $('div.simpleTop_thumb_area__byBd0')
      const price_tag = $('.priceArea_price__pZ_yN')
      const mall_list_tag = $(
        'ul.productPerMalls_sell_list_area__IozKN.price_active'
      )
      const mall_list = []

      mall_list_tag
        .find('li.productPerMall_seller_item__S11aV')
        .each((index, li) => {
          const seller_name = $(li)
            .find(
              '.productPerMall_info_title__CJMxe .productPerMall_mall__FSTiv'
            )
            .text()
            .trim()
          const price = $(li)
            .find(
              '.productPerMall_info_right__mJk9G .productPerMall_info_price__CB_kb .productPerMall_price__1u_8d em'
            )
            .text()
            .trim()
          const mall_url = $(li)
            .find('.productPerMall_link_seller__K8_B_.linkAnchor')
            .attr('href')

          mall_list.push({
            seller_name: seller_name,
            price: price,
            mall_url: mall_url,
          })
        })

      const title = $('h2.topInfo_title__nZW6V').text().trim()
      const imageUrl = image_tag.find('img').attr('src')
      const lowestPrice = price_tag.find('em').text().trim()
      const lowestPriceUrl = $('.buyButton_link_buy__a_Zkc').attr('href')

      const result = {
        product: {
          title: title,
          imageUrl: imageUrl,
          lowestPrice: lowestPrice,
          lowestPriceUrl: lowestPriceUrl,
          mallList: mall_list,
        },
      }

      return result
    } else if (response.status === 401 && validateJSON(response.data)) {
      try {
        const responseData = JSON.parse(response.data)
        if (
          'message' in responseData &&
          responseData.message.includes('limit')
        ) {
          return null
        }
      } catch (e) {
        console.log('response 401 error', e)
      }
    }

    return null
  } catch (error) {
    console.error('Naver exception:', error, query)
    return null
  }
}

async function getUrl(config, isJson = false) {
  try {
    const response = await axios.get(config)
    let text = response?.data

    if (isJson && !isJsonString(text)) {
      console.log('Response is not valid JSON, retrying...')
      await sleep(3000)
      const retryResponse = await axios.get(config)
      text = retryResponse?.data
    }

    return text
  } catch (err) {
    console.error('Error while fetching data:', err.message)
    return 'this is weird'
  }
}

class SerachService {
  async crawlProductData(query) {
    try {
      const result = await crawlNaverLowestPriceSearch(query)
      return result
    } catch (error) {
      console.error('Error:', error.message)
      throw error
    }
  }

  async crawlCatalogData(productNumber) {
    try {
      const result = await crawlNaverProductCatalog(productNumber)
      return result
    } catch (error) {
      console.error('Error:', error.message)
      throw error
    }
  }

  async searchProducts(query) {
    const existingData = await ProductSearchRepo.getProductData(query)
    if (existingData) {
      return existingData
    } else {
      const crawledData = await this.crawlProductData(query)
      ProductSearchRepo.registerProductData(crawledData)
      return crawledData
    }
  }

  async getCatalogData(productNumber) {
    const existingData = await CatalogSearchRepo.getCatalogData(productNumber)
    if (existingData) {
      return existingData
    } else {
      const crawledData = await this.crawlCatalogData(productNumber)
      CatalogSearchRepo.registerCatalogData(crawledData)
      return crawledData
    }
  }
}

module.exports = new SerachService()