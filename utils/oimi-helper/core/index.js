/* eslint-disable camelcase */
/**
 * @description M3U8 to MP4 Converter
 * @author Furkan Inanc, Helson Lin
 * @version 1.0.0
 */
const ffmpeg = require('fluent-ffmpeg')
const log = require('../utils/logger')
/**
  * A class to convert M3U8 to MP4
  * @class
  */
class FfmpegHelper {
    PRESET
    OUTPUTFORMAT
    USER_AGENT
    THREADS
    M3U8_FILE
    VERBOSE
    PROTOCOL_TYPE
    duration
    constructor (options) {
        if (options?.THREADS) this.THREADS = options.THREADS
        if (options?.VERBOSE) log.level = options.VERBOSE ? 'verbose' : 'silent'
    }

    setUserAgent (USER_AGENT) {
        if (USER_AGENT) this.USER_AGENT = USER_AGENT
        return this
    }

    /**
      * Sets the input file
      * @param {String} filename M3U8 file path. You can use remote URL
      * @returns {Function}
      */
    setInputFile (M3U8_FILE, USER_AGENT) {
        if (!M3U8_FILE) throw new Error('You must specify the M3U8 file address')
        this.M3U8_FILE = M3U8_FILE
        return this
    }

    /**
    * Sets the output file
    * @param {String} filename Output file path. Has to be local :)
    * @returns {Function}
    */
    setOutputFile (OUTPUT_FILE) {
        if (!OUTPUT_FILE) throw new Error('You must specify the OUTPUT_FILE')
        this.OUTPUT_FILE = OUTPUT_FILE
        return this
    }

    /**
    * Sets the thread
    * @param {Number} number thread number
    * @returns {Function}
    */
    setThreads (number) {
        if (number) {
            this.THREADS = number
        }
        return this
    }

    /**
     * set video preset
     * @param {String} preset video preset
     */
    setPreset (preset) {
        if (preset) {
            this.PRESET = preset
        }
        return this
    }

    setOutputFormat (outputformat) {
        if (outputformat) {
            this.OUTPUTFORMAT = outputformat
        }
        return this
    }

    setTimeMark (time) {
        const timePattern = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d).[0-9]{2}$/
        if (time && timePattern.test(time)) {
            this.TIMEMARK = time
        }
        return this
    }

    /**
     *  check the download url file contentType
     * @param {String} url
     * @return {Promise<m3u8|unknown>} 
     * @memberof FfmpegHelper
     */
    checkUrlContentType (url, USER_AGENT) {
        // 既然可以通过ffmpeg.ffprobe获取到视频的格式和时长，那么可以通过这个方法来判断视频的格式
        return new Promise((resolve, reject) => {
            // prefetch media need carry User-Agent
            ffmpeg.ffprobe(url, ['-user_agent', `${USER_AGENT}`], (err, metadata) => {
                if (err) {
                    resolve('unknown')
                } else {
                    const { format_name, duration } = metadata?.format
                    this.duration = duration ?? 0
                    log.verbose('format_name:' + format_name + ',duration:' + duration)
                    if (format_name === 'hls') {
                        resolve('m3u8')
                    } else if (format_name.split(',').includes('mp4')) {
                        resolve('mp4')
                    } else {
                        resolve('unknown')
                    }
                }
            })
        })
    }

    /**
      * 获取地址协议
      * @param {string} url
      * @returns {("live" | "m3u8" | "mp4" | "unknown")}
      */
    async getProtocol (url, USER_AGENT) {
        switch (true) {
            case url.startsWith('rtmp://'):
            case url.startsWith('rtsp://'):
                return 'live'
            case url.indexOf('.m3u8') !== -1:
            case url.indexOf('.flv') !== -1:
                return 'm3u8'
            default:
                return await this.checkUrlContentType(url, USER_AGENT)
        }
    }

    /**
     * Gets the metadata of the input file.
     * @returns {Promise<void>} A promise that resolves when the metadata is retrieved.
     */
    async getMetadata () {
        this.PROTOCOL_TYPE = await this.getProtocol(this.M3U8_FILE, this.USER_AGENT)
    }

    /**
   * Sets the input options for ffmpeg.
   */
    setInputOption () {
        const USER_AGENT = this.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
        const REFERER_RGX = /^(?<referer>http|https:\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+)(?::\d+)?\/[^ "]+$/u
        const match = this.M3U8_FILE.match(REFERER_RGX)
        const [referer] = match === null ? ['unknown'] : match.slice(1)
        const options = []
        if (USER_AGENT) options.push('-user_agent', `${USER_AGENT}`)
        if (referer !== 'unknown') options.push('-referer', `${referer}`)
        options.length && this.ffmpegCmd.inputOptions(options)
    }

    /**
   * Sets the output options for ffmpeg.
   */
    setOutputOption () {
        if (this.THREADS) {
            this.ffmpegCmd.outputOptions([
                `-threads ${this.THREADS}`,
                '-max_muxing_queue_size 9999',
            ])
        }
        if (this.TIMEMARK) {
            this.ffmpegCmd.seekInput(this.TIMEMARK)
        }
        this.ffmpegCmd.outputOptions(`-preset ${this.PRESET || 'veryfast'}`)

        const liveProtocol = this.PROTOCOL_TYPE
        switch (liveProtocol) {
            case 'live':
                this.ffmpegCmd
                .outputOptions('-c:v copy')
                .outputOptions('-c:a copy')
                .output(this.OUTPUT_FILE)
                break
            default:
                this.ffmpegCmd
                .outputOptions('-c:v copy')
                .outputOptions('-c:a copy')
                .output(this.OUTPUT_FILE)
                break
        }
    }

    /**
   * Monitors the conversion process and reports progress.
   * @param {Function} callback The callback function to call with progress updates.
   */
    monitorProcess (callback) {
        const toFixed = (val, precision = 1) => {
            const multiplier = 10 ** precision
            return Math.round(val * multiplier) / multiplier
        }
        const formatFileSize = (fileSizeKb) => {
            const fileSizeMb = fileSizeKb / 1024
            const fileSizeGb = fileSizeMb / 1024

            if (fileSizeGb >= 1) {
                const speedGbps = fileSizeGb.toFixed(2)
                return `${speedGbps} GB`
            } else if (fileSizeMb >= 1) {
                const speedMbps = fileSizeMb.toFixed(2)
                return `${speedMbps} MB`
            } else {
                const speedKbps = fileSizeKb.toFixed(2)
                return `${speedKbps} KB`
            }
        }
        const formatSpeed = (speedKbps) => {
            const speedMbps = speedKbps / 1000
            const speedGbps = speedMbps / 1000
            if (speedGbps >= 1) {
                return `${speedGbps.toFixed(2)} Gb/s`
            } else if (speedMbps >= 1) {
                return `${speedMbps.toFixed(2)} Mb/s`
            } else {
                return `${speedKbps.toFixed(2)} Kb/s`
            }
        }
        const timemarkToSeconds = (timemark) => {
            // 通过冒号将时间戳拆分为时、分、秒和小数秒
            const [hours, minutes, seconds, decimals] = timemark.split(':')

            // 将时、分、秒转换为整数
            const hoursInSeconds = parseInt(hours, 10) * 3600
            const minutesInSeconds = parseInt(minutes, 10) * 60
            const secondsInSeconds = parseInt(seconds, 10)

            // 将小数秒转换为浮点数
            const decimalsInSeconds = parseFloat(`0.${decimals}`)

            // 计算总秒数
            const totalSeconds = hoursInSeconds + minutesInSeconds + secondsInSeconds + decimalsInSeconds

            return totalSeconds
        }
        let startTime = Date.now()
        let downloadedBytes = 0
        this.ffmpegCmd
        .on('progress', (progress) => {
            downloadedBytes = progress.targetSize
            const elapsedSeconds = (Date.now() - startTime) / 1000
            const averageSpeedKbps = downloadedBytes / elapsedSeconds
            const currentMbs = formatSpeed(averageSpeedKbps)
            let percent = progress.percent ? toFixed(progress.percent * 100) / 100 : toFixed((timemarkToSeconds(progress.timemark) / this.duration) * 100)
            if (callback && typeof callback === 'function') {
                const params = {
                    percent: percent >= 100 ? 100 : percent,
                    currentMbs,
                    timemark: progress.timemark,
                    targetSize: formatFileSize(progress.targetSize),
                }
                callback(params)
            }
        })
        .run()
    }

    /**
    * Start download mission
    */
    start (listenProcess) {
        return new Promise((resolve, reject) => {
            if (!this.M3U8_FILE || !this.OUTPUT_FILE) {
                reject(new Error('You must specify the input and the output files'))
            } else {
                this.ffmpegCmd = ffmpeg(this.M3U8_FILE)
                this.setInputOption()
                // get video meta
                this.getMetadata().then(() => {
                    // setOutputOption is dependen on protocol type
                    this.setOutputOption()
                    // set the transform file suffix
                    this.ffmpegCmd.format(this.OUTPUTFORMAT || 'mp4')
                    // monitor downloading process
                    this.monitorProcess(listenProcess)
                })
                this.ffmpegCmd
                .on('error', (error) => {
                    console.log('ffmpeg error happed', error)
                    reject(error)
                })
                .on('stderr', function (stderrLine) {
                    log.verbose('Stderr output:' + stderrLine)
                })
                .on('start', function (commandLine) {
                    log.info('FFmpeg command: ' + commandLine)
                })
                .on('end', () => {
                    resolve('')
                })
            }
        })
    }

    /**
   * Kills the ffmpeg process.
   * @param {string} signal The signal to send to the process.
   */
    kill (signal) {
        // SIGINT 中止录制：除了该方式中断其他方式中断的视频无法播放
        // SIGSTOP 挂起ffmpeg
        // SIGCONT 恢复下载
        // SIGKILL 杀死进程
        this.ffmpegCmd.kill(signal)
    }
}
module.exports = FfmpegHelper