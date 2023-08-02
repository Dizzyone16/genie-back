/* eslint-disable no-loop-func */
const scrapingbee = require('scrapingbee')
const puppeteer = require('puppeteer-core')
// const puppeteer = require('puppeteer')
const fetch = require('node-fetch')

const request = require('request-promise')
// const path = require('path')
// const fs = require('fs')

const cheerio = require('cheerio')
// const SlackAPI = require('../utils/slackApi')
const GlobalItemRepo = require('../repositories/GlobalItemRepo')

const SCRAPINGBEE_CLIENT = new scrapingbee.ScrapingBeeClient(
  'A3K1Z3U94MBUY2CO3JRPP3XFX2GB8LU0RO779CONDOF4MKNS6VR6CFDP53KZEEO24HHNQBPTEDISB83W'
)

const MAX_RETRIES = 5
const MAX_CONCURRENCY = 50
const BRIGHTDATA_AUTH =
  'brd-customer-hl_e511d429-zone-scraping_browser-country-us:yqj2rwh0t0f8'

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function chunkArray(longArray, chunkSize = 20) {
  const chunkedArray = []
  for (let i = 0; i < longArray?.length; i += chunkSize) {
    const chunked = longArray.slice(i, i + chunkSize)
    chunkedArray.push(chunked)
  }
  return chunkedArray
}

const getHtmlByUrl = async (url, retry = 0) => {
  console.log(`Try ${url}`)

  try {
    const res = await SCRAPINGBEE_CLIENT.get({
      url,
      params: { wait_browser: 'load', timeout: 30000 },
    })
    const decoder = new TextDecoder()
    const htmlText = decoder.decode(res.data)

    // const requestOptions = {
    //   url,
    //   proxy:
    //     'http://brd-customer-hl_e511d429-zone-unblocker:hfso7xigh9jg@brd.superproxy.io:22225',
    //   strictSSL: false,
    // }
    // const htmlText = await request.get(requestOptions)

    if (!htmlText || htmlText?.length === 0) {
      if (retry <= MAX_RETRIES) {
        return getHtmlByUrl(url, retry + 1)
      }
      throw new Error('Try Counts All Consumed')
    }
    // Apply cheerio
    const $ = cheerio.load(htmlText)
    return $
  } catch (err) {
    if (retry <= MAX_RETRIES) {
      console.log(`Try Again w ${retry + 1} Try!`)
      return getHtmlByUrl(url, retry + 1)
    }
    throw new Error('Try Counts All Consumed', err)
  }
}

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0
      const distance = 100
      const timer = setInterval(() => {
        const { scrollHeight } = document.body
        window.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })
}

const getHtmlByUrlWithScrollDown = async (url, retry = 0) => {
  console.log(`Scroll Down ${url}`)

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://${BRIGHTDATA_AUTH}@brd.superproxy.io:9222`,
    })

    const page = await browser.newPage()
    await page.goto(url, { timeout: 30000 })

    // Scroll to the bottom of the page
    await autoScroll(page)

    // Get the updated HTML source
    const htmlText = await page.content()
    await browser.close()

    if (!htmlText || htmlText?.length === 0) {
      return getHtmlByUrlWithScrollDown(url, retry + 1)
    }

    // Apply cheerio
    const $ = cheerio.load(htmlText)
    return $
  } catch (err) {
    console.log(`Try Scroll Again w ${retry + 1} Try!`)
    if (retry <= MAX_RETRIES) {
      return getHtmlByUrlWithScrollDown(url, retry + 1)
    }
    throw new Error('Scroll Try Counts All Consumed ', err)
  }
}

const getHtmlByUrlWithHover = async (url, retry = 0) => {
  console.log(`Hover ${url}`)

  try {
    // Get all the elements
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://${BRIGHTDATA_AUTH}@brd.superproxy.io:9222`,
    })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#altImages', { timeout: 30000 })
    const elements = await page.$$('#altImages > ul > li')
    let hoverCount = 0
    for (const element of elements) {
      // Hover over each element
      try {
        await element.hover()
        await page.waitForTimeout(1000)
        console.log('Hovered')
        hoverCount += 1
      } catch (err) {
        console.log('Not Hovered')
      }
    }

    // Get the updated HTML source
    const htmlText = await page.content()
    await browser.close()

    if (!htmlText || htmlText?.length === 0 || hoverCount === 0) {
      if (retry <= MAX_RETRIES) {
        return getHtmlByUrlWithHover(url, retry + 1)
      }
      console.log('Hover Counts All Consumed')
      return getHtmlByUrl(url, 0)
    }
    return cheerio.load(htmlText)
  } catch (err) {
    if (retry <= MAX_RETRIES) {
      console.log(`Try Hover Again w ${retry} Try!`)
      return getHtmlByUrlWithHover(url, retry + 1)
    }
    console.log('Hover Counts All Consumed', err)
    return getHtmlByUrl(url, 0)
  }
}

const getHtmlByUrlWithWaitForSelector = async (url, retry = 0) => {
  console.log(`Wait ${url}`)

  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://${BRIGHTDATA_AUTH}@brd.superproxy.io:9222`,
    })
    const page = await browser.newPage()
    const navigationPromise = page.waitForNavigation({
      waitUntil: 'domcontentloaded',
    })
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#dp', { timeout: 30000 })
    await navigationPromise

    // Get the updated HTML source
    const htmlText = await page.content()
    await browser.close()

    if (!htmlText || htmlText?.length === 0) {
      if (retry <= MAX_RETRIES) {
        return getHtmlByUrlWithWaitForSelector(url, retry + 1)
      }
      throw new Error('Try Counts All Consumed')
    }
    // Apply cheerio
    const $ = cheerio.load(htmlText)
    return $
  } catch (err) {
    console.log('err: ', err)
    if (retry <= MAX_RETRIES) {
      console.log(`Try Again w ${retry + 1} Try!`)
      return getHtmlByUrlWithWaitForSelector(url, retry + 1)
    }
    throw new Error('Try Counts All Consumed', err)
  }
}

const getHtmlByUrlWithWait = async (url, retry = 0, selector = '#dp') => {
  console.log(`Wait ${url}`)

  try {
    if (retry >= 3) {
      selector = '#dp'
    }
    const res = await SCRAPINGBEE_CLIENT.get({
      url,
      params: {
        js_scenario: { instructions: [{ wait_for: selector }] },
      },
    })
    const decoder = new TextDecoder()
    const htmlText = decoder.decode(res.data)

    if (!htmlText || htmlText?.length === 0) {
      if (retry <= MAX_RETRIES) {
        return getHtmlByUrlWithWait(url, retry + 1, selector)
      }
      throw new Error('Try Counts All Consumed')
    }
    // Apply cheerio
    const $ = cheerio.load(htmlText)
    return $
  } catch (err) {
    if (retry <= MAX_RETRIES) {
      console.log(`Try Again w ${retry + 1} Try!`)
      return getHtmlByUrlWithWait(url, retry + 1, selector)
    }
    throw new Error('Try Counts All Consumed')
  }
}

class AmazonCrawlService {
  excludedCat = [
    'Amazon Devices & Accessories',
    'Amazon Renewed',
    'Apps & Games',
    'Audible Books & Originals',
    'Books',
    'CDs & Vinyl',
    'Climate Pledge Friendly',
    'Digital Educational Resources',
    'Digital Music',
    'Gift Cards',
    'Magazine Subscriptions',
    'Movies & TV',
  ]

  parseASIMFromVariationHTML(itemIdHTML) {
    return String(itemIdHTML).split(',')[1] || ''
  }

  parsePriceFromHTML(parsedHtml) {
    return parseFloat(parsedHtml.replace('$', '')) || -1
  }

  parseReviewsFromHTML(parsedHtml) {
    return parseInt(parsedHtml.replace(',', ''), 10) || -1
  }

  // Get Option Info from HTML
  parseOptionInfo(optionType, $) {
    const options = []
    $(`div#${optionType}`).each((idx, ele) => {
      const optionType = $(ele).find('label.a-form-label').text()
      // In Case Of Many Options by "optionType"
      const displayOptionType = $(ele).attr('class')
      if (displayOptionType?.includes('dropdown')) {
        $(ele)
          .find('option')
          .each((idx, opt) => {
            const option = {}
            const itemId = $(opt).attr('value')
            if (itemId !== '-1') {
              option.type = optionType.trim().replace(':', '')
              option.id = this.parseASIMFromVariationHTML(itemId)
              option.name = $(opt).text().trim()
              option.status = $(opt).attr('class') || ''
              options.push(option)
            }
          })
      } else {
        $(ele)
          .find('li')
          .each((idx, opt) => {
            const option = {}
            option.type = optionType.trim().replace(':', '')
            const [, , itemId] = $(opt).attr('data-dp-url').split('/')
            option.id = itemId || $(opt).attr('data-defaultasin')
            option.name =
              $(opt).find('img').attr('alt') || $(opt).find('p').first().text()
            option.status = $(opt).attr('class') || ''
            options.push(option)
          })
      }

      // In Case Of Single Option by "optionType"
      if (!options?.length) {
        const option = {}
        option.type = optionType.trim().replace(':', '')
        option.name = $(ele).find('span.selection').text()
        options.push(option)
      }
    })
    return options
  }

  async parseOptionPrice(opt) {
    const itemDetailInfoByOptionUrl = `https://www.amazon.com/dp/${opt.id}?th=1&psc=1`
    const $ = await getHtmlByUrlWithWait(
      itemDetailInfoByOptionUrl,
      0,
      '#buybox'
    )
    const optionImgUrl = $('div#imgTagWrapperId').find('img').attr('src')
    const optionPrice =
      $('div#corePrice_feature_div').find('span.a-offscreen').first().text() ||
      ''
    const availability = $('div#availability > span').first().text() || ''
    opt.optionPrice = this.parsePriceFromHTML(optionPrice)
    opt.availability = availability.trim()
    opt.optionImgUrl = optionImgUrl
    return opt
  }

  // Get Total Option Info and Each Price from HTML
  async parseTotalOptionInfo(html) {
    const $ = cheerio.load(String(html))
    const variations = html.find('div[id*="variation"]').parent()

    // Scraped Option Info. Inspection
    let isSingleOpt = true
    let optionList = []
    variations.find('div[id*="variation"]').each((idx, ele) => {
      const opt = {}
      opt.type = $(ele).attr('id')
      opt.spec = this.parseOptionInfo(opt.type, $)
      opt.count = opt.spec?.length || 0
      optionList.push(opt)
      if (opt.count > 1 && 'id' in opt.spec[0]) {
        isSingleOpt = false
      }
    })

    if (isSingleOpt) {
      return optionList.map((ele) => ele.spec?.at(0))
    }

    // In case of further scraping is required
    optionList = optionList
      .filter((ele) => ele.count > 1 && 'id' in ele.spec[0])
      .map((ele) => ele.type)

    if (optionList?.length > 2) {
      console.log('****check!****')
      return []
    }

    optionList = optionList.slice(0, 2)
    console.log('optionList: ', optionList)
    const itemOptions = []
    if (optionList) {
      const firstOptionInfo = this.parseOptionInfo(optionList[0], $)
      const chunkedFirstOptionInfo = chunkArray(
        firstOptionInfo,
        MAX_CONCURRENCY
      )

      for (const chunk of chunkedFirstOptionInfo) {
        // Scrape All Option Combinations
        const promisedChunk = await Promise.all(
          chunk.map(async (opt) => this.parseOptionPrice(opt))
        )
        if (optionList?.length > 1) {
          // Scrape All Option Combinations
          const chunkWithSecondOption = await Promise.all(
            chunk.map(async (ele) => {
              const itemDetailInfoByOptionUrl = `https://www.amazon.com/dp/${ele.id}?th=1&psc=1`
              const $ = await getHtmlByUrl(itemDetailInfoByOptionUrl)
              const secondOptionInfo = this.parseOptionInfo(optionList[1], $)
              if (secondOptionInfo?.length > 0) {
                return { ...ele, secondOption: secondOptionInfo }
              }
              return ele
            })
          )
          itemOptions.push(...chunkWithSecondOption)
          console.log('itemOptions', itemOptions)
          // Add Price Info For Each Option Combination
          for (const firstOpt of itemOptions) {
            const chunkedSecondOption = chunkArray(
              firstOpt.secondOption,
              MAX_CONCURRENCY
            )
            const tempSecondOption = []
            for (const chunk of chunkedSecondOption) {
              const promisedChunk = await Promise.all(
                chunk.map(async (secondOpt) => this.parseOptionPrice(secondOpt))
              )
              tempSecondOption.push(...promisedChunk)
            }
            firstOpt.secondOption = tempSecondOption
          }
          return itemOptions
        }
        itemOptions.push(...promisedChunk)
      }
    }
    return itemOptions
  }

  // Get Each Category Url in Best Seller Tab
  async getAmazonCategoryUrlOfBestSeller() {
    const bestSellerUrl = `https://www.amazon.com/Best-Sellers/zgbs/ref=zg_bsnr_tab`
    const $ = await getHtmlByUrl(bestSellerUrl)

    const urlList = []
    const catUriHtml = $(
      'div._p13n-zg-nav-tree-all_style_zg-browse-root__-jwNv'
    )
    catUriHtml.find('a').each((idx, ele) => {
      const urlInfo = {}
      urlInfo.catName = $(ele).text()
      urlInfo.url = $(ele).attr('href')
      urlList.push(urlInfo)
    })
    return urlList
  }

  // Get Each Category Url in Best Seller Tab
  async getAmazonCategoryByUrl(url) {
    const $ = await getHtmlByUrl(url)

    const urlList = []
    const catUriHtml = $(
      'div._p13n-zg-nav-tree-all_style_zg-browse-root__-jwNv'
    )
    catUriHtml.find('a').each((idx, ele) => {
      const urlInfo = {}
      urlInfo.catName = $(ele).text()
      urlInfo.url = $(ele).attr('href')
      urlList.push(urlInfo)
    })
    return urlList
  }

  async getAmazonProductUrlByCategory(catInfo) {
    // Get Pages for Each Category
    const catUrl = `https://www.amazon.com${catInfo.url}`
    const $ = await getHtmlByUrl(catUrl)

    const pageNumScript = $('ul.a-pagination')
    const pageUrlList = []
    pageNumScript.find('a').each((idx, ele) => {
      const pageUrl = $(ele).attr('href')
      if (pageUrlList.indexOf(pageUrl) === -1) pageUrlList.push(pageUrl)
    })
    return pageUrlList
  }

  async getItemMainInfo(pageUrl) {
    const catPageUrl = `https://www.amazon.com${pageUrl}`

    const $ = await getHtmlByUrlWithScrollDown(catPageUrl)
    const itemScript = $('div#gridItemRoot').parent()

    const itemInfoList = []
    itemScript.find('.zg-grid-general-faceout').each((idx, ele) => {
      const itemInfo = {}
      itemInfo.itemDetailUrl = $(ele).find('a:nth-child(1)').attr('href')
      itemInfo.mainImageUrl = $(ele)
        .find('a:nth-child(1) > div > img')
        .attr('src')
      itemInfo.title = $(ele).find('a:nth-child(2) > span > div').text()
      itemInfo.rating = $(ele).find('span.a-icon-alt').text()
      const numOfReviews = $(ele).find('div.a-icon-row > a > span').text()
      itemInfo.numOfReviews = this.parseReviewsFromHTML(numOfReviews)
      const price = $(ele)
        .find('span[class="a-size-base a-color-price"] > span')
        .text()
      itemInfo.price = this.parsePriceFromHTML(price)
      itemInfoList.push(itemInfo)
    })
    return itemInfoList
  }

  async getItemDetailInfo(item) {
    // Get Each Item Detail
    const itemDetailPageUrl = `https://www.amazon.com${item.itemDetailUrl}`

    let $ = await getHtmlByUrlWithWait(itemDetailPageUrl, 0, '#buybox')
    const itemDetailInfo = {}
    const mainItemDisplayScript = $('div#dp')
    const priceBeforeDiscount =
      mainItemDisplayScript
        .find('span.aok-relative')
        .first()
        .find('span.a-offscreen')
        .text() || ''

    // Product Description
    const featureBulletList = []
    mainItemDisplayScript
      .find('div#feature-bullets')
      .children()
      .find('li')
      .each((idx, ele) => {
        featureBulletList.push($(ele).find('span.a-list-item').text())
      })

    const buybox = mainItemDisplayScript.find('div#buybox')
    const soldBy =
      $(buybox)
        .find('[tabular-attribute-name="Sold by"]')
        .last()
        .find('a')
        .text() ||
      $(buybox)
        .find('[tabular-attribute-name="Sold by"]')
        .last()
        .find('span')
        .text()

    if (soldBy === '' || soldBy.includes('Amazon')) {
      console.log('soldBy Pass ', soldBy)
      return
    }

    const shipFrom =
      $(buybox)
        .find('[tabular-attribute-name="Ships from"]')
        .last()
        .find('a')
        .text() ||
      $(buybox)
        .find('[tabular-attribute-name="Ships from"]')
        .last()
        .find('span')
        .text()

    if (shipFrom === '' || shipFrom.includes('Amazon')) {
      console.log('soldBy Pass ', soldBy, ' shipFrom', shipFrom)
      return
    }

    // Other Descriptions
    const brandDescription = {}
    brandDescription.header =
      mainItemDisplayScript
        .find('div#aplusBrandStory_feature_div > div > h2')
        .text() || ''
    brandDescription.html = (
      mainItemDisplayScript
        .find('div#aplusBrandStory_feature_div > div > div')
        .html() || ''
    ).trim()

    const sellerDescription = {}
    sellerDescription.header =
      mainItemDisplayScript.find('div#aplus_feature_div > div > h2').text() ||
      ''
    sellerDescription.html = (
      mainItemDisplayScript.find('div#aplus_feature_div > div > div').html() ||
      ''
    ).trim()

    const productDescription = {}
    productDescription.header = 'Product Description'
    productDescription.html = (
      mainItemDisplayScript.find('div#productDescription').html() || ''
    ).trim()

    const productDetails = {}
    productDetails.header =
      mainItemDisplayScript.find('div[class*="detail-bullets"] > h2').text() ||
      ''
    productDetails.html = (
      mainItemDisplayScript.find('div[class*="detail-bullets"] > div').html() ||
      ''
    ).trim()

    // Load Option and Regarding Info
    console.log('Option Starts')
    const totalOptionInfo = await this.parseTotalOptionInfo(
      mainItemDisplayScript
    )

    // Load Product Images
    $ = await getHtmlByUrlWithHover(itemDetailPageUrl, { retry: 3 })
    const displayItemImageUrlList = []
    $('li[class*="image item itemNo"]').each((idx, ele) => {
      displayItemImageUrlList.push($(ele).find('img').attr('src'))
    })

    // Organize Crawled Info.
    itemDetailInfo.displayItemImageUrlList = displayItemImageUrlList
    itemDetailInfo.priceBeforeDiscount =
      this.parsePriceFromHTML(priceBeforeDiscount)
    itemDetailInfo.soldBy = soldBy
    itemDetailInfo.shipFrom = shipFrom
    itemDetailInfo.featureBullet = featureBulletList
    itemDetailInfo.brandDescription = brandDescription
    itemDetailInfo.sellerDescription = sellerDescription
    itemDetailInfo.productDescription = productDescription
    itemDetailInfo.productDetails = productDetails
    itemDetailInfo.optionInfo = totalOptionInfo

    console.log('itemDetailInfo: ', itemDetailInfo)
    return itemDetailInfo
  }

  // Get Item Info incl. Url in Best Seller Tab By Each Category
  async getAmazonBestSellerItemInfoByCategory() {
    /**
     * 상품 디버깅
     */
    // const item = {}
    // item.itemDetailUrl =
    //   '/Intex-Krystal-Cartridge-Filter-110-120V/dp/B005QIYK66/ref=zg_bs_g_lawn-garden_sccl_5/133-5262425-3703562?th=1'

    // const itemDetailInfo = await this.getItemDetailInfo(item)
    // console.log('itemDetailInfo', itemDetailInfo)
    // return

    const catUrlOfBestSeller = await this.getAmazonCategoryUrlOfBestSeller()
    const catArr = catUrlOfBestSeller.filter(
      (ele) => !this.excludedCat.includes(ele.catName)
    )
    catArr.sort(() => Math.random() - 0.5)

    // Get Pages for Each Category
    await Promise.all(
      catArr.map(async (catInfo) => {
        console.log('catInfo: ', catInfo)
        const pageUrlList = await this.getAmazonProductUrlByCategory(catInfo)
        // Get Item Info for Each Page
        for (const mainItemUrl of pageUrlList) {
          console.log('mainItemUrl: ', mainItemUrl)
          const itemList = await this.getItemMainInfo(mainItemUrl)
          console.log('itemList: ', itemList?.length)
          for (const item of itemList) {
            console.log('item: ', item)
            try {
              const itemDetailInfo = await this.getItemDetailInfo(item)
              if (itemDetailInfo) {
                console.log('Recorded')
                await GlobalItemRepo.insertAmazonItem(
                  'BestSellers',
                  catInfo,
                  item,
                  itemDetailInfo
                )
              }
            } catch (err) {
              console.error('err occurs, but it is okay! ', err)
            }
          }
        }
      })
    )

    // for (const catInfo of catArr) {
    //   console.log('catInfo: ', catInfo)
    //   const pageUrlList = await this.getAmazonProductUrlByCategory(catInfo)
    // }
  }

  // Get Item Info incl. Url in New Releases Tab By Each Category
  async getAmazonNewReleasesItemInfoByCategory() {
    const url = 'https://www.amazon.com/gp/new-releases/'
    const amazonCatInfo = await this.getAmazonCategoryByUrl(url)

    const catArr = amazonCatInfo.filter(
      (ele) => !this.excludedCat.includes(ele.catName)
    )
    catArr.sort(() => Math.random() - 0.5)

    // Get Pages for Each Category
    await Promise.all(
      catArr.map(async (catInfo) => {
        const pageUrlList = await this.getAmazonProductUrlByCategory(catInfo)
        // Get Item Info for Each Page
        for (const mainItemUrl of pageUrlList) {
          console.log('mainItemUrl: ', mainItemUrl)
          const itemList = await this.getItemMainInfo(mainItemUrl)
          console.log('itemList: ', itemList?.length)
          for (const item of itemList) {
            console.log('item: ', item)
            try {
              const itemDetailInfo = await this.getItemDetailInfo(item)
              if (itemDetailInfo) {
                console.log('Recorded')
                await GlobalItemRepo.insertAmazonItem(
                  'NewReleases',
                  catInfo,
                  item,
                  itemDetailInfo
                )
              }
            } catch (err) {
              console.error('err occurs, but it is okay! ', err)
            }
          }
        }
      })
    )
  }

  // Get Item Info incl. Url in Movers and Shakers Tab By Each Category
  async getAmazonMoversAndShakersItemInfoByCategory() {
    const url = 'https://www.amazon.com/gp/movers-and-shakers/ref=zg_bs_tab'
    const amazonCatInfo = await this.getAmazonCategoryByUrl(url)

    const catArr = amazonCatInfo.filter(
      (ele) => !this.excludedCat.includes(ele.catName)
    )
    catArr.sort(() => Math.random() - 0.5)

    // Get Pages for Each Category
    await Promise.all(
      catArr.map(async (catInfo) => {
        const pageUrlList = await this.getAmazonProductUrlByCategory(catInfo)
        // Get Item Info for Each Page
        for (const mainItemUrl of pageUrlList) {
          console.log('mainItemUrl: ', mainItemUrl)
          const itemList = await this.getItemMainInfo(mainItemUrl)
          console.log('itemList: ', itemList?.length)
          for (const item of itemList) {
            console.log('item: ', item)
            try {
              const itemDetailInfo = await this.getItemDetailInfo(item)
              if (itemDetailInfo) {
                console.log('Recorded')
                await GlobalItemRepo.insertAmazonItem(
                  'MoversAndShakers',
                  catInfo,
                  item,
                  itemDetailInfo
                )
              }
            } catch (err) {
              console.error('err occurs, but it is okay! ', err)
            }
          }
        }
      })
    )
  }

  async testAmazonOrder() {
    const url = 'https://api.zinc.io/v1/orders'
    const clientToken = 'FA63FB305E9DFA3004A07C13' // Replace <client_token> with your actual token

    const data = {
      retailer: 'amazon',
      products: [
        {
          product_id: 'B001DT1X9O',
          quantity: 1,
          seller_selection_criteria: {
            max_item_price: 10000,
            prime: false,
            handling_days_max: 30,
            // min_seller_percent_positive_feedback: 85,
            // min_seller_num_ratings: 25,
          },
        },
      ],
      max_price: 10000,
      shipping_address: {
        first_name: 'Edmund',
        last_name: 'Pan',
        address_line1: '1250 W Roscoe St.',
        address_line2: 'Unit1',
        zip_code: '60657',
        city: 'Chicago',
        state: 'IL',
        country: 'US',
        phone_number: '7328953904',
      },
      addax: true,
      is_gift: true,
      gift_message: 'Thanks Bro!',
      shipping: {
        order_by: 'price',
        max_days: 30,
        max_price: 10000,
      },
      // payment_method: {
      //   use_gift: true,
      // },
      // billing_address: {
      //   first_name: 'Levit',
      //   last_name: ' Inc.',
      //   address_line1: '1250 W Roscoe St.',
      //   address_line2: 'Unit1',
      //   zip_code: '60657',
      //   city: 'Chicago',
      //   state: 'IL',
      //   country: 'US',
      //   phone_number: '7328953904',
      // },
      // retailer_credentials: {
      //   email: 'saejin9@gmail.com',
      //   password: 'Tripod1115!',
      // },
      webhooks: {
        request_succeeded: 'http://mywebsite.com/zinc/request_succeeded',
        request_failed: 'http://mywebsite.com/zinc/requrest_failed',
        tracking_obtained: 'http://mywebsite.com/zinc/tracking_obtained',
      },
      client_notes: {
        our_internal_order_id: '20230605',
        any_other_field: ['test'],
      },
    }

    fetch(url, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${clientToken}:`)}`,
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Success:', data)
      })
      .catch((error) => {
        console.error('Error:', error)
      })

    // const orderUrl =
    //   'https://api.zinc.io/v1/orders/4194e9cac35d6e7c7f03291d8d94d139'
    // fetch(orderUrl, {
    //   method: 'GET',
    //   headers: {
    //     Authorization: `Basic ${btoa(`${clientToken}:`)}`,
    //   },
    // })
    //   .then((response) => response.json())
    //   .then((data) => {
    //     console.log('Success:', data)
    //   })
    //   .catch((error) => {
    //     console.error('Error:', error)
    //   })
  }

  async testDB() {
    await GlobalItemRepo.insertTest()
  }
}

module.exports = new AmazonCrawlService()
