const tiktok = require('./tiktok')
const bilibili = require('./bilibili')
module.exports = [
    {
        name: 'bilibili',
        handler: bilibili,
    },
    {
        name: 'douyin',
        handler: tiktok,
    },
]