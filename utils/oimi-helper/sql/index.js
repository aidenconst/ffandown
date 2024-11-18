const { DatabaseSync } = require('node:sqlite');
const dbOperation = {
    async sync () {
        try {
            this.db = await new DatabaseSync('./database/sqlite.db')
            this.TABLE = "down"
            if(!this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${this.TABLE}'`).get()){
                console.debug(`检测到 ${this.TABLE} 表不存在，自动创建...`)
                this.db.exec(`CREATE TABLE ${this.TABLE} (
                uid       TEXT PRIMARY KEY UNIQUE NOT NULL,
                name      TEXT NOT NULL,
                url       TEXT NOT NULL,
                useragent TEXT,
                percent   TEXT,
                filePath  TEXT,
                speed     TEXT,
                timemark  TEXT,
                size      TEXT,
                status    TEXT NOT NULL,
                message   TEXT,
                crt_tm    TEXT NOT NULL,
                upd_tm    TEXT NOT NULL)`)
            }
            //status：0/初始状态；1/下载状态；2/停止状态；3/完成状态；4/发生错误，5/等待下载
            console.log(`初始化数据表完成！`)
        } catch (e) {
            console.log('[ffandown] 数据库同步失败:' + String(e).trim())
        }
    },
    /**
     * @description 创建下载记录
     * @param {*} param {uid, name, url, percent, filePath, status, speed} 
     * @returns 
     */
    async create (body) {
        try {
            const times = new Date().getTime().toString()
            const insert  = this.db.prepare(`INSERT INTO ${this.TABLE} (uid, name, url, percent, filePath, status,message,useragent,crt_tm,upd_tm)VALUES (?,?,?,?,?,?,?,?,?,?)`);
            insert.run(body.uid,body.name,body.url,body.percent,body.filePath,body.status.toString(),body.message,body.useragent,times,times);
            return Promise.resolve({uid:body.uid,msg:'添加成功'})
        } catch (e) {
            return Promise.reject(e)
        }
    },
    /**
     * @description 删除指定uid的数据
     * @param {*} uid 
     * @returns 
     */
    async delete (uid) {
        try {
            const deletedRes = this.db.prepare(`DELETE FROM ${this.TABLE} WHERE uid = '${uid}'`)
            deletedRes.run()
            return Promise.resolve({uid,message:'删除成功'})
        } catch (e) { 
            return Promise.reject(e)
        }
    },
    /**
     * 更新指定uid的数据
     * @param {*} uid key
     * @param {*} body 更新数据
     * @returns 
     */
    async update (uid, body) {
        try {
            const mission = body
            if (!mission.upd_tm) mission.upd_tm = new Date().toLocaleString()
            const updata = Object.entries(mission).map(([key, value]) => `${key} = '${value}'`).join(', ');
            //console.log(updata)
            const updateRes = this.db.prepare(`UPDATE ${this.TABLE} SET ${updata} WHERE uid = '${uid}'`)
            //console.log(updateRes);
            updateRes.run()
            return Promise.resolve({uid,message:'更新成功'})
        } catch (e) {
            return Promise.reject(e)
        }
    },
    /**
     * 获取所有数据
     */
    async getAll() {
        try {
            const query = this.db.prepare(`SELECT * FROM ${this.TABLE} ORDER BY crt_tm`)
            return Promise.resolve(query.all())
        } catch (e) {
            return Promise.reject(e)
        }
    },
    /**
     * 获取指定uid的数据
     * @param {*} uid 
     * @returns 
     */
    async queryOne (uid) {
        try {
            const query = this.db.prepare(`SELECT * FROM ${this.TABLE} where uid = '${uid}'`)
            return Promise.resolve(query.all())
        } catch (e) {
            return Promise.reject(e)
        }
    },
    /**
     * 分页查询数据
     * @param   pageNumber      页码 
     * @param   pageSize        每页数量
     * @param   sortField       排序字段
     * @param   sortOrder       排序方式
     * @param   status          状态
     * @returns 
     */
    async queryByPage ({ pageNumber = 1, pageSize = 1, sortField = 'crt_tm', sortOrder = 'ASC', status = '1' }) {
        try {
            const offset = (pageNumber - 1) * pageSize
            const statusStr = status.split(',').length === 1 ? `status = ${status}` : status.split(',').map(num => `status='${num}'`).join(' OR ');
            const query = this.db.prepare(`SELECT * FROM ${this.TABLE} WHERE ${statusStr}  ORDER BY ${sortField} ${sortOrder} LIMIT ${offset},${pageSize}`)
            const list = query.all()
            return Promise.resolve(list)
        } catch (e) {
            return Promise.reject(e)
        }
    },
    /**
     * 获取不同下载状态的任务
     * @param {*} type status：0/初始状态；1/下载状态；2/停止状态；3/完成状态；4/发生错误，5/等待下载
     * @returns 
     */
    async  queryMissionByType (type = 'waiting') {
        const statusMap = {
            waiting: `status = '1'`,
            downloading: `status = '0' OR status = '1' OR status = '2'`,
            finished: `status = '3' OR status = '4'`,
            needResume: `status = '0' OR status = '1' OR status = '2' OR status = '5'`,
        }
        try {
            const query = this.db.prepare(`SELECT * FROM ${this.TABLE} WHERE ${statusMap[type]}`)
            return Promise.resolve(query.all())
        } catch (e) {
            return Promise.reject(e)
        }
    },
    // 批量删除下载任务
    async batchDelete (uids) {
        try {
            const uidList = uids.map(uid => `'${uid}'`).join(', ');
            const deletedRes = this.db.prepare(`DELETE FROM ${this.TABLE} WHERE uid IN (${uidList})`)
            deletedRes.run()
            return Promise.resolve({uid,message:'删除成功'})
        } catch (e) {
            return Promise.reject(e)
        }
    },
}

module.exports = dbOperation
