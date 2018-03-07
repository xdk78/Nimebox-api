const x = require('x-ray')()
const axios = require('axios')
const api = axios.create({
  headers: {
    'Accept': 'text/html',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3165.0 Safari/537.36'
  }
})

const _ = require('lodash')

const mp4upload = require('../videoplayers/Mp4UploadCom')

const utils = require('../utls/utils')

const BASE_URL = 'http://www.senpai.com.pl'

const getAnimes = async () => {
  try {
    const response = await api.get(`${BASE_URL}/anime`)
    let title = null
    let url = null
    let description = null
    let image = null
    x(response.data, {
      title: ['div[class="collection row anime-col"] > a[class="collection-item anime-item col l6 m6 s12"] > div[class="anime-desc"] > span[class="title anime-title"]'],
      url: ['div[class="collection row anime-col"] > a[class="collection-item anime-item col l6 m6 s12"]@href'],
      description: ['div[class="collection row anime-col"] > a[class="collection-item anime-item col l6 m6 s12"] > div[class="anime-desc"] > span[class="grey-text text-lighten-1"]'],
      image: ['div[class="collection row anime-col"] > a[class="collection-item anime-item col l6 m6 s12"] > img[class="anime-cover"]@src']
    })((err, obj) => {
      if (err) {
        throw err
      }
      title = obj.title
      url = obj.url
      description = obj.description
      image = obj.image
    })

    const list = _.compact(title).map((el, i) => {
      return ({
        title: el,
        url: BASE_URL + url[i],
        description: description[i],
        image: BASE_URL + image[i]
      })
    })

    return list
  } catch (err) {
    console.log(err)
  }
}

const getAnime = async (q) => {
  const response = await api.get(`${BASE_URL}/anime/${q}`)
  return new Promise((resolve, reject) => {
    x(response.data, {
      number: ['div[class="collection row anime-col"] > a[class="collection-item anime-item"] > div[class="anime-number"] > h5'],
      url: ['div[class="collection row anime-col"] > a[class="collection-item anime-item"]@href'],
      description: ['div[class="collection row anime-col"] > a[class="collection-item anime-item"] > div[class="anime-desc"] > span[class="grey-text text-lighten-1"]']
    })((err, obj) => {
      if (err) {
        reject(err)
      }

      const list = _.compact(obj.number).map((el, i) => {
        return ({
          number: el,
          url: BASE_URL + obj.url[i],
          description: obj.description[i]
        })
      })
      resolve(list)
    })
  })
}

const getAnimePlayers = async (q, n) => {
  const response = await api.get(`${BASE_URL}/anime/${q}/${n}`)
  return new Promise((resolve, reject) => {
    x(response.data, {
      host: ['div[class="container"] > ul[class="tabs"] > li[class="tab"] > a'],
      players: ['div[class="video-container"] > iframe@src']
    })(async (err, obj) => {
      if (err) {
        reject(err)
      }

      const list = _.map(_.zip(obj.host, obj.players), (objZiped) => {
        console.log(objZiped)
        return ({
          host: objZiped[0],
          player: objZiped[1]
        })
      })

      const returnList = []

      const toDecode = []

      _.forEach(list, (item, index) => {
        const domain = utils.getDomainName(item.player)
        if (domain === 'mp4upload.com') {
          toDecode.push(item)
        } else {
          returnList.push(item)
        }
      })

      // TODO to change !!
      if (toDecode.length === 1) {
        const result = await mp4upload.getVideo(toDecode[0].player)
        returnList.push({
          host: toDecode[0].host,
          player: result.url
        })
      }

      resolve(returnList)
    })
  })
}

module.exports = {
  getAnimes,
  getAnime,
  getAnimePlayers
}
