const fetch = require('node-fetch')
const bilibili = {
    match (url) {
        const matchUrl = url.match(/https:\S+/)
        return matchUrl && matchUrl[0]?.indexOf('b23.tv') !== -1
    },
    getRoomIdByShareUrl (url) {
        const headers = {
            redirect: 'manual',
            authority: 'live.bilibili.com',
            // eslint-disable-next-line max-len
            'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
        }
        return new Promise((resolve, reject) => {
            fetch(url, headers).then(async (res) => {
                const redirectUrl = res.headers.has('location') && res.headers.get('location')
                if (!redirectUrl) reject(new Error('can\'t get room id'))
                const roomId = redirectUrl.match(/(?<=https:\/\/live.bilibili.com\/)\d+(?=\?broadcast_type=0)/)[0]
                if (!roomId) reject(new Error('can\'t get room id'))
                resolve(roomId)
            })
        })
    },
    getUrlByRoomId (roomId) {
        const params = {
            room_id: roomId,
            no_playurl: '0',
            mask: '1',
            platform: 'web',
            qn: '0',
            protocol: '0,1',
            format: '0,2',
            codec: '0,1',
        }
        let url = 'https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?'
        for (const key in params) {
            url += `${key}=${params[key]}&`
        }
        url = url.slice(0, url.length - 1)
        return new Promise((resolve, reject) => {
            fetch(url).then((res) => resolve(res)).catch(err => reject(err))
        })
    },
    getRealLiveUrlByData (codec) {
        const generateCodecItemUrl = (codecItem) => {
            // eslint-disable-next-line
            const { base_url, url_info } = codecItem
            // eslint-disable-next-line
            return url_info.map(i => `${i.host}${base_url}${i.extra}`)
        }
        if (!codec || !(codec instanceof Array)) return null
        return codec.map(codecItem => generateCodecItemUrl(codecItem)).flat()[0]
    },
    async parser (url) {
        try {
            const matchUrl = url.match(/https:\S+/)
            const roomId = await this.getRoomIdByShareUrl(matchUrl[0])
            const res = await this.getUrlByRoomId(roomId)
            const data = await res.json()
            if (data.code === 0 && data?.data?.playurl_info && data?.data?.playurl_info?.playurl) {
                // continue PARSER
                const playUrl = data?.data?.playurl_info.playurl
                const streamItem = playUrl?.stream[1] ?? playUrl?.stream[0]
                if (!playUrl) throw new Error('bilibili parser error')
                return this.getRealLiveUrlByData(streamItem?.format[0]?.codec)
            } else {
                throw new Error(`bilibili parser error:  ${data.message}`)
            }
        } catch (e) {
            throw new Error('bilibili parser error:' + String(e).trim())
        }
    },
}

module.exports = bilibili