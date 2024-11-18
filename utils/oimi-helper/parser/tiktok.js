/* eslint-disable max-len */
const fetch = require('node-fetch')

const { sign } = require('./libs/X-Bogus')
const tiktok = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    },
    douyinApiHeaders: {
        'accept-encoding': 'gzip, deflate, br',
        'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
        referer: 'https://www.douyin.com/',
        cookie: 'n_mh=ZGkDUDq87_ReJpNDNjXJAcIlxSe3cA3dXF3pz7Vo1So; LOGIN_STATUS=1; store-region=cn-ah; store-region-src=uid; my_rd=1; ttwid=1%7CLkU2OLnKWs8DcVLGMP_dxHcLobk9Y_e-SSDlUKglsiM%7C1687349374%7C7ea67aa5225ad7fcef78191fd87dea42b2281cd2ffe1bcb205c5b9d5fe3f3ff7; s_v_web_id=verify_lkcquhow_M0SokhHW_aHUZ_4ui0_92nd_t45hIoyFwlF0; passport_csrf_token=ae1d4b9e0f6b3dd26dcdd858c74f1373; passport_csrf_token_default=ae1d4b9e0f6b3dd26dcdd858c74f1373; passport_assist_user=CjzG2846zH4nSFD12e3ghPYNBgVTysxLmt3P0hRO1e6x0z-quOC5aMrxB3mrdK60HTBt9XFvCfBsq5MfKqYaSAo8hG-cIbPHcQ1Aue3pau4dTSAcJ3AeIR8-NqaW0lrmyWdtRikQRByqm7IPca9yb-aF6r41GhlvdFAoD8gzEIq_uA0Yia_WVCIBA_D4Aq0%3D; sso_uid_tt=9630cb01a699aa5c33a8808e718ec11b; sso_uid_tt_ss=9630cb01a699aa5c33a8808e718ec11b; toutiao_sso_user=996cb6a83b1c5c2b713af855b64cc098; toutiao_sso_user_ss=996cb6a83b1c5c2b713af855b64cc098; odin_tt=5308c2d274686bdafa9204700857b3e8f169e15e0c9caadc1cf46bea997712ecb32029d28f08ad7147305fa071c5ba5a; uid_tt=d26841f0ed166bbf0e8fbba5a6eddd4e; uid_tt_ss=d26841f0ed166bbf0e8fbba5a6eddd4e; sid_tt=69b218330b62e948d2f62a8f1a8e698c; sessionid=69b218330b62e948d2f62a8f1a8e698c; sessionid_ss=69b218330b62e948d2f62a8f1a8e698c; _bd_ticket_crypt_cookie=9c7b4fc95ad98147cf18ff9498c897fc; __security_server_data_status=1; __live_version__=%221.1.1.3119%22; sid_ucp_sso_v1=1.0.0-KDcwNGVmYjFiMjJiMDkwYmY1Y2ZmOGVhYjc0ZWYyMWQ2Y2M2ZGM1NzAKHQj2h_PV7gEQqoTLpwYY7zEgDDCgos3LBTgGQPQHGgJobCIgOTk2Y2I2YTgzYjFjNWMyYjcxM2FmODU1YjY0Y2MwOTg; ssid_ucp_sso_v1=1.0.0-KDcwNGVmYjFiMjJiMDkwYmY1Y2ZmOGVhYjc0ZWYyMWQ2Y2M2ZGM1NzAKHQj2h_PV7gEQqoTLpwYY7zEgDDCgos3LBTgGQPQHGgJobCIgOTk2Y2I2YTgzYjFjNWMyYjcxM2FmODU1YjY0Y2MwOTg; sid_guard=69b218330b62e948d2f62a8f1a8e698c%7C1693631018%7C5184000%7CWed%2C+01-Nov-2023+05%3A03%3A38+GMT; sid_ucp_v1=1.0.0-KDg2ZDc3NDdmYzFlNGIyM2FkM2ZjN2RjMjQ1MjQ2MzQ3MmJhZWYwYmIKGQj2h_PV7gEQqoTLpwYY7zEgDDgGQPQHSAQaAmxxIiA2OWIyMTgzMzBiNjJlOTQ4ZDJmNjJhOGYxYThlNjk4Yw; ssid_ucp_v1=1.0.0-KDg2ZDc3NDdmYzFlNGIyM2FkM2ZjN2RjMjQ1MjQ2MzQ3MmJhZWYwYmIKGQj2h_PV7gEQqoTLpwYY7zEgDDgGQPQHSAQaAmxxIiA2OWIyMTgzMzBiNjJlOTQ4ZDJmNjJhOGYxYThlNjk4Yw; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCSi9YaFJNYkE1RlVGUzlldjFzcXpWZXNuRktqUmNxSjFnam9GQmdOMlJKclo3Wnc4N1JKTjZMdnZNV2lTLzFuWkorZFNqdUd5QWEvTHp3T2o4ZjhJbkk9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoxfQ==; __ac_nonce=065066d6d00dcec9d7f9d; __ac_signature=_02B4Z6wo00f01L2LOtwAAIDBQ8dG7f90QiS9qz5AAEppU8rmnlMQQsT0Wn6rUXj7BV7tk8Gud6ZIrtX.3ZI2WrJGBOfZkNeKvNOfm3PthvMBa4wmCicgabm09qyR4wvj-p4okPGfy5oYGH8R58; publish_badge_show_info=%220%2C0%2C0%2C1694920048606%22; home_can_add_dy_2_desktop=%220%22; strategyABtestKey=%221694920048.622%22; FOLLOW_LIVE_POINT_INFO=%22MS4wLjABAAAA1T1gJAQars4T_ve8V3T5Ld9J3GCAsNLpTlr6EhV36C0%2F1694966400000%2F0%2F1694920048827%2F0%22; volume_info=%7B%22isUserMute%22%3Afalse%2C%22isMute%22%3Afalse%2C%22volume%22%3A0.056%7D; csrf_session_id=6c84522dbdac6372ee9ae3ffbe850bcf; stream_recommend_feed_params=%22%7B%5C%22cookie_enabled%5C%22%3Atrue%2C%5C%22screen_width%5C%22%3A1920%2C%5C%22screen_height%5C%22%3A1080%2C%5C%22browser_online%5C%22%3Atrue%2C%5C%22cpu_core_num%5C%22%3A12%2C%5C%22device_memory%5C%22%3A8%2C%5C%22downlink%5C%22%3A10%2C%5C%22effective_type%5C%22%3A%5C%224g%5C%22%2C%5C%22round_trip_time%5C%22%3A100%7D%22; passport_fe_beating_status=true; msToken=4UD4cbYDcXUIVw66rmBqxwfRBKQfv0PaBaFZzMUt40-f92dR4decmUv4J334pfUdfukAVOEo5Kfmj-SjJh_gU8H03z1GZ1nDw8RWJRJp2wXSjlcNrBcoQw==; msToken=pG-e7TIA9uAyR8ui6-WI5IicyjjjOSkdNPwgIx_wqDzZxKz9ca3DPcZkzgiCByT4wcdWKKRrvt2MkRXB7q5auYl5wZZCxwBfhK8AfLebhBJm7HJaU1cKyw==; tt_scid=lb4xIawlluUIQ5M7sNX4dyoz.AvNwFZb9wJzYhW0Q6817bpVd84GEg3G.LUSKlgTa71b; download_guide=%222%2F20230917%2F0%22;',
    // 其他请求头
    },
    match (url) {
        const matchUrl = url.match(/https:\S+/)
        return matchUrl && matchUrl[0]?.indexOf('v.douyin') !== -1
    },
    getRoomIdByShareUrl (url) {
        const headers = {
            authority: 'v.douyin.com',
            // eslint-disable-next-line max-len
            'user-agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
        }
        return new Promise((resolve, reject) => {
            fetch(url, headers).then((res) => {
                if (!res?.url) reject(new Error('can\'t get room id'))
                const roomId = res?.url?.match(/\d{19}/)[0]
                if (!roomId) reject(new Error('can\'t get room id'))
                resolve(roomId)
            })
        })
    },
    async liveUrl (roomId) {
        let apiUrl = `https://live.douyin.com/webcast/room/web/enter/?aid=6383&app_name=douyin_web&live_id=1&device_platform=web&language=zh-CN&cookie_enabled=true&screen_width=1440&screen_height=900&browser_language=zh-CN&browser_platform=MacIntel&browser_name=Chrome&browser_version=119.0.0.0&web_rid=395309645272&room_id_str=${roomId}&enter_source=&is_need_double_stream=false&msToken=x08eGRuHkhK4rgCMP3K0DNaAl4xjo2SDbRo_ddCD-SPSFdCvZJ2OBrSmAqEc-ia7tROk7tEn9Vb7zHaCrtOe8YgBzLoqiwUnBLU3NQHjKEAJyBEAPixt`
        const urlParser = new URL(apiUrl)
        const query = urlParser.search.replace('?', '')
        const xbogus = sign(query, this.headers['User-Agent'])
        // console.log("【parser】 生成的X-Bogus签名为: " + xbogus);
        const newUrl = apiUrl + '&X-Bogus=' + xbogus
        // console.log("【parser】 正在获取视频数据API: \n" + newUrl);
        return new Promise((resolve, reject) => {
            fetch(newUrl, {
                headers: this.douyinApiHeaders,
            })
            .then((res) => res.json())
            .then((json) => {
                resolve(json)
            })
            .catch((err) => reject(err))
        })
    },
    async parser (url) {
        try {
            const matchUrl = url.match(/https:\S+/)
            const roomId = await this.getRoomIdByShareUrl(matchUrl[0])
            const res = await this.liveUrl(roomId)
            return res?.data?.data[0]?.stream_url.hls_pull_url_map
        } catch (e) {
            return null
        }
    },
}

module.exports = tiktok
