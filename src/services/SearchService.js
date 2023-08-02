const axios = require('axios')
const cheerio = require('cheerio')
const scrapingbee = require('scrapingbee')
const randomstring = require('randomstring')

// repos
const ProductSearchRepo = require('../repositories/ProductSearchRepo')
const CatalogSearchRepo = require('../repositories/CatalogSearchRepo')

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

async function crawlNaverLowestPriceSearch(query) {
  console.log('query here: ', query)
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
      console.log('response 200')
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
            // const ratingCount = $(productCard).find('em').text().trim()
            // console.log(ratingCount, 'ratingCount')
            const sellerCount = parseInt(sellerCountText.replace(/\D/g, ''), 10)
            // && ratingCount >= 100
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
          console.log('title', title)
          const url = $(catalogCard)
            .find('a.product_info_main__piyRs')
            .attr('href')
          const imageUrl = $(catalogCard)
            .find('span.product_img_area__1aA4L img')
            .attr('src')
          const lowest_price_tag = $(catalogCard).find(
            '.product_num__iQsWh strong'
          )
          const lowestPrice =
            lowest_price_tag.length > 0
              ? lowest_price_tag.text().replace(/\D/g, '')
              : null
          const catalogNumber = $(catalogCard)
            .find('a.product_info_main__piyRs')
            .attr('data-i')
            .slice(0, 11)
          const rating_tag = $(catalogCard).find('.product_grade__qkI47 strong')
          const ratingScore = rating_tag.length > 0 ? rating_tag.text() : 0
          const ratingCount = $(catalogCard).find('em').text().trim()

          crawledData.push({
            title,
            url,
            imageUrl,
            lowestPrice,
            catalogNumber,
            ratingScore,
            ratingCount,
          })
        })
      }

      return crawledData
    } else if (response.status === 401 && validateJSON(response.data)) {
      try {
        console.log('response 401')
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

async function crawlNaverProductCatalog(catalogNumber) {
  try {
    const headers = {
      referer: `https://m.search.naver.com/search.naver?sm=mtp_hty.top&where=m&query=${encodeURIComponent(
        catalogNumber
      )}`,
    }

    const cookies = {
      NFS: '2',
      NNB: generate_nnb(),
      page_uid: generate_page_uid(),
      _naver_usersession_: generate_naver_usersession(),
      sus_val: generate_sus_val(),
    }

    const url = `https://msearch.shopping.naver.com/catalog/${catalogNumber}?deliveryCharge=true`

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
      const rating_count_element = $('.topInfo_link_review__hLI0h')
      const rating_count_text = rating_count_element.text().trim()

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
            sellerName: seller_name,
            price: price,
            mallUrl: mall_url,
          })
        })

      const title = $('h2.topInfo_title__nZW6V').text().trim()
      const imageUrl = image_tag.find('img').attr('src')
      const lowestPrice = price_tag.find('em').text().trim()
      const lowestPriceUrl = $('.buyButton_link_buy__a_Zkc').attr('href')
      const ratingScore = $('.statistics_value__qyFPi').text().trim()
      const ratingCount = rating_count_text.replace(/\D+/g, '')

      const result = {
        title: title,
        imageUrl: imageUrl,
        lowestPrice: lowestPrice,
        lowestPriceUrl: lowestPriceUrl,
        mallList: mall_list,
        ratingScore: ratingScore,
        ratingCount: ratingCount,
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

class SerachService {
  async crawlProductData(query) {
    try {
      console.log('query exist: ', query)
      const result = await crawlNaverLowestPriceSearch(query)
      if (result.length > 0) {
        return result
      } else {
        return null
      }
      // else 일반검색 만들기
    } catch (error) {
      console.error('Error:', error.message)
      throw error
    }
  }

  async crawlCatalogData(catalogNumber) {
    try {
      const result = await crawlNaverProductCatalog(catalogNumber)
      return result
    } catch (error) {
      console.error('Error:', error.message)
      throw error
    }
  }

  async searchProducts(query) {
    console.log('service received')
    const existingData = await ProductSearchRepo.getProductData(query)
    if (existingData) {
      console.log('data existed')
      return existingData
    } else {
      console.log('data unexisted')
      const crawledData = await this.crawlProductData(query)
      console.log(crawledData, 'data crawled')

      ProductSearchRepo.registerProductData(crawledData)
      return crawledData
    }
  }

  async getCatalogData(catalogNumber) {
    const existingData = await CatalogSearchRepo.getCatalogData(catalogNumber)
    if (existingData) {
      return existingData
    } else {
      const crawledData = await this.crawlCatalogData(catalogNumber)
      CatalogSearchRepo.registerCatalogData(crawledData)
      return crawledData
    }
  }
}

module.exports = new SerachService()
