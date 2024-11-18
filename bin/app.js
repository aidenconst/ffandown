/** express server */
const express = require('express')
const ws = require('express-ws')
const cluster = require('cluster')
const crypto = require("crypto")
const path = require('path')
const colors = require('colors')
const bodyParser = require('body-parser')
const jwt = require("jsonwebtoken"); // 用于签发、解析`token`
const app = express()
const Utils = require('./utils/index')
const secretKey = "aidenSEAFORESTyibin";
const jsonParser = bodyParser.json()
/* 获取一个期限为12小时的token */
function getToken(payload = {}) {
    return jwt.sign(payload, secretKey, {
      expiresIn: "72h",
    });
}
/**路由守卫**/
function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (token == null)
      return res.sendStatus(401); // 如果没有token，返回未授权的状态码
    try {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) return res.sendStatus(401);
        res.decoded = decoded;
        next(); // 调用下一个中间件或路由处理器
      });
    } catch (error) {
      delete req.headers.authorization;
      res.status(401).send({
        code: -1,
        data: null,
        error: "请刷新登录后重试！",
        message: "请刷新登录后重试！",
      });
    }
  }
//生成md5,取前16位
const md5 = (str) => {
    return crypto
      .createHash("md5")
      .update(str)
      .digest("hex");
  };
// express static server
app.use(express.static(path.join(process.cwd(), 'public')))
/**
 * @description
 * @param {FFandown} this
 */
function createServer (port) {
    ws(app).getWss('/')

    const { getNetwork, initializeFrontEnd, modifyYml } = Utils
    app.ws('/ws', (ws, req) => {
        ws.send(Utils.sendWsMsg('connected'))
        ws.on('message', async (msg) => {
            try {
                const data = JSON.parse(msg)
                const { key } = data
                if (key === 'list') {
                    const list = await this.dbOperation.getAll()
                    ws.send(Utils.sendWsMsg(list, 'list'))
                }
            } catch (e) {
                Utils.LOG.error('client:' + e)
            }
        })
        ws.on('close', function (e) {
            Utils.LOG.info('close connection')
        })
    })
    app.post('/login', async (req, res) => {
        const { username, password } = req.query;
        try {
            await this.dbOperation.login(username,md5(password)).then(data=>{
                if(data){
                    const token = getToken({ username });
                    res.header("Authoization", token);
                    res.cookie("jwt", token, {
                        maxAge: 3 * 24 * 60 * 60 * 1000, // Cookie有效时长（毫秒）
                        httpOnly: false, // 仅通过HTTP协议访问（前端不可访问）
                        secure: false, // 仅在HTTPS协议下传输
                        sameSite: "lax", // 防止CSRF攻击
                    });
                }
                res.send({ code: data ? 0 : 1, message: data ? '登录成功' : '账号或密码错误'})
            })
        } catch (e) {
            Utils.LOG.error(e)
            res.send({ code: 1, message: String(e) })
        }
    })
    app.get('/config', async (req, res) => {
        res.send({ code: 0, data: this.config })
    })
    app.post('/config', jsonParser, async (req, res) => {
        const data = req.body
        data.port = Number(data.port)
        modifyYml(data)
        // sync data to config on instance
        this.config = data
        res.send({ code: 0, message: 'update success' })
    })
    // 获取版本信息
    app.get('/version', async (req, res) => {
        try {
            const version = await Utils.getFrontEndVersion()
            res.send({ code: 0, data: version })
        } catch (e) {
            res.send({ code: 1, message: e.message })
        }
    })
    // 升级前端
    app.get('/upgrade', async (req, res) => {
        try {
            await Utils.autoUpdateFrontEnd()
            res.send({ code: 0, message: 'upgrade success' })
        } catch (e) {
            res.send({ code: 1, message: e.message })
        }
    })
    // create download mission
    app.post('/down', jsonParser, (req, res) => {
        let { name, url, preset, outputformat, useragent, dir, enableTimeSuffix } = req.body
        // if the config option have preset and outputformat, and body have't will auto replace
        if (!preset && this.config.preset) preset = this.config.preset
        if (!outputformat && this.config.outputformat) outputformat = this.config.outputformat
        url = Utils.getRealUrl(url)
        if (!url) {
            res.send({ code: 1, message: 'please check params' })
        } else {
            try {
                const isMultiple = Array.isArray(url)
                // 如果url是逗号分隔的多个链接处理
                if (isMultiple) {
                    for (const urlItem of url) {
                        // eslint-disable-next-line max-len
                        this.createDownloadMission({ url: urlItem, dir, preset, enableTimeSuffix: enableTimeSuffix ?? false, useragent, outputformat }).then(() => {
                            Utils.LOG.info('download success:' + urlItem)
                            // eslint-disable-next-line max-len
                            Utils.msg(this.config.webhooks, this.config.webhookType, 'ffandown download success', `${urlItem}`)
                            .catch(e => {
                                Utils.LOG.warn('message failed:' + e)
                            })
                        }).catch((e) => {
                            Utils.LOG.warn('download failed:' + e)
                            // eslint-disable-next-line max-len
                            Utils.msg(this.config.webhooks, this.config.webhookType, 'ffandown download failed', `${urlItem}: ${e}`)
                            .catch(e => {
                                Utils.LOG.warn('message failed:' + e)
                            })
                        })
                    }
                } else {
                    this.createDownloadMission({ 
                        name, 
                        url,
                        dir,
                        preset,
                        enableTimeSuffix: enableTimeSuffix ?? false,
                        useragent,
                        outputformat, 
                    }).then(() => {
                        Utils.LOG.info('download success:' + url)
                        Utils.msg(this.config.webhooks, this.config.webhookType, 'ffandown download success', `${url}`)
                        .catch(e => {
                            Utils.LOG.warn('message failed:' + e)
                        })
                    }).catch((e) => {
                        Utils.LOG.warn('download failed:' + e)
                        // eslint-disable-next-line max-len
                        Utils.msg(this.config.webhooks, this.config.webhookType, 'ffandown download failed', `${url}: ${e}`)
                        .catch(e => {
                            Utils.LOG.warn('message failed:' + e)
                        })
                    })
                }
                res.send({ code: 0, message: `${name} video download mission create success` })
            } catch (e) {
                res.send({ code: 1, message: String(e) })
            }
        }
    })
    // get download list
    app.get('/list', async (req, res) => {
        const { current, pageSize, status } = req.query
        try {
            const list = await this.dbOperation.queryByPage({
                pageNumber: current, pageSize, status, sortField: 'crt_tm', sortOrder: 'ASC',
            })
            res.send({ code: 0, data: list })
        } catch (e) {
            Utils.LOG.error(e)
            res.send({ code: 1, message: String(e) })
        }
    })
    // pause download
    app.get('/pause', async (req, res) => {
        const { uid } = req.query
        if (!uid) {
            res.send({ code: 0, message: 'please check params' })
        } else {
            try {
                await this.pauseMission(uid)
                res.send({ code: 0 })
            } catch (e) {
                Utils.LOG.error(e)
                res.send({ code: 1, message: String(e) })
            }
        }
    })
    // pause download
    app.get('/resume', async (req, res) => {
        const { uid } = req.query
        if (!uid) {
            res.send({ code: 0, message: 'please check params' })
        } else {
            try {
                await this.resumeDownload(uid)
                res.send({ code: 0 })
            } catch (e) {
                Utils.LOG.error(e)
                res.send({ code: 1, message: String(e) })
            }
        }
    })
    // delete mission
    app.delete('/del', async (req, res) => {
        let uid = req.query?.uid
        if (uid && uid.indexOf(',')) {
            uid = uid.split(',')
        }
        if (!uid || uid === undefined) {
            res.send({ code: 1, message: 'please provide a valid  uid' })
        } else {
            try {
                await this.deleteDownload(uid)
                res.send({ code: 0, message: 'delete mission success' })
            } catch (e) {
                Utils.LOG.error(e)
                res.send({ code: 1, message: String(e) })
            }
        }
    })
    // stop mission
    app.post('/stop', async (req, res) => {
        const uid = req.query?.uid
        if (!uid || uid === undefined) {
            res.send({ code: 1, message: 'please provide a valid  uid' })
        } else {
            try {
                await this.stopDownload(uid)
                res.send({ code: 0, message: 'stop mission success' })
            } catch (e) {
                Utils.LOG.error(e)
                res.send({ code: 1, message: String(e) })
            }
        }
    })
    app.get('/dir', async (req, res) => {
        try {
            const dirs = await Utils.getDirectories(
                path.join(process.cwd(), this.config.downloadDir), 
                this.config.downloadDir,
            )
            dirs.unshift({
                label: '/media/',
                value: '/media/',

            })
            res.send({ code: 0, data: dirs })
        } catch (e) {
            Utils.LOG.error(e)
            res.send({ code: 1, message: 'system error' })
        }
    })
    // parser url
    app.get('/parser', async (req, res) => {
        const url = req.query.url
        if (!url || url === undefined) {
            res.send({ code: 1, message: 'please provide a valid  url' })
        } else {
            try {
                const realUrl = await this.parserUrl(url)
                res.send({ code: 0, data: realUrl })
            } catch (e) {
                res.send({ code: 1, message: 'system error' })
            }
        }
    })
    app.listen(port, async () => {
        // initial front end resouce
        await initializeFrontEnd()
        const list = await getNetwork()
        const listenString = list.reduce((pre, val) => {
            return pre + `\n ${colors.white('   -')} ${colors.brightCyan('http://' + val + ':' + port + '/')}`
        }, colors.white('[ffandown] server running at:\n'))
        const isWorker = cluster.isWorker
        if (isWorker && cluster.worker.id === 1 || !isWorker) {
            console.log(colors.green(listenString))
        }
    })
}

module.exports = createServer