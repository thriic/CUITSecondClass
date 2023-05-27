import request from "request";


/**
 * @typedef {Object} Activity
 * @property {string} id 活动id
 * @property {string} activityStatus 活动状态 0为报名中 1为待开始 2为进行中 3为待完结 5为已完结
 * @property {string} activityName 活动名称
 * @property {string} startTime 开始时间
 * @property {string} endTime 结束时间
 * @property {string} isSign 是否已签到
 */

export class SecondClass {
    constructor(account, twfID) {
        this.twfID = twfID
        this.account = account
    }
    login() {
        return new Promise((resolve, reject) => {
            // http://ekty-cuit-edu-cn.webvpn.cuit.edu.cn:8118/#/pages/home/login
            request('http://ekt-cuit-edu-cn.webvpn.cuit.edu.cn:8118/api/login?sf_request_type=ajax',
                {
                    method: 'POST',
                    headers: {
                        "sdp-app-session": this.twfID,
                        "Proxy-Connection": 'keep-alive'
                    },
                    followRedirect: false,
                    json: true,
                    body: {
                        account: this.account,
                        password: "123456"
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    }
                    if (typeof body == 'string' && body.includes('Server internal error')) {
                        reject('500 Server internal error');
                        return
                    }
                    if (body.message != '请求成功') {
                        reject(body.message)
                    } else {
                        this.token = body.data
                        resolve(body.data)
                    }
                })
        })
    }

    user() {
        return new Promise((resolve, reject) => {
            request('http://ekt-cuit-edu-cn.webvpn.cuit.edu.cn:8118/api/getLoginUser?sf_request_type=ajax',
                {
                    method: 'GET',
                    json: true,
                    headers: {
                        "sdp-app-session": this.twfID,
                        'Authorization': `Bearer ${this.token}`
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    }
                    //console.log(body)
                    if (body.message != '请求成功') {
                        reject(new Error(body.message))
                    } else {
                        this.info = { id: body.data.id, name: body.data.name, sex: body.data.sex, org: { id: body.data.loginEmpInfo.orgId, name: body.data.loginEmpInfo.orgName } }
                        resolve(this.info)
                    }

                })
        })
    }



    /**
     * 报名活动
     * @param {Activity} activity
     * @returns {Promise<{msg:string, code:string}>} 活动列表
     */
    sign(activity) {
        return new Promise((resolve, reject) => {
            request('http://ekt-cuit-edu-cn.webvpn.cuit.edu.cn:8118/api/activityInfoSign/add?sf_request_type=ajax',
                {
                    method: 'POST',
                    headers: {
                        "sdp-app-session": this.twfID,
                        'Authorization': `Bearer ${this.token}`
                    },
                    json: true,
                    body: {
                        activityId: activity.id
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    }
                    if (typeof body == 'string' && body.includes('Server internal error')) {
                        reject('500 Server internal error');
                    }
                    //console.log(body)
                    if (body.message != '请求成功') {
                        reject(body.message)
                    } else {
                        // { msg: '报名成功', code: '1' }
                        resolve(body.data)
                    }
                })
        })
    }
    score() {
        return new Promise(async (resolve, reject) => {
            this.id ?? await this.user()
            request(`http://ekt-cuit-edu-cn.webvpn.cuit.edu.cn:8118/api/studentScore/appDataInfo?userId=${this.id}&sf_request_type=ajax`,
                {
                    method: 'GET',
                    json: true,
                    headers: {
                        "sdp-app-session": this.twfID,
                        'Authorization': `Bearer ${this.token}`
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    }
                    //console.log(body)
                    if (body.message != '请求成功') reject(true)
                    // {score: 3, item: 0, integrity_value: 70, activity: 2}
                    resolve(body.data)

                })
        })
    }

    /**
     * 完成签到签退(签到签退可重复进行)
     * @param {Activity} activity
     * @returns {Promise<any>} 一定返回'请求成功'
     */
    signIn(activity) {
        return new Promise(async (resolve, reject) => {
            let info = await this.signInfo(activity.id)
            request('http://ekt-cuit-edu-cn.webvpn.cuit.edu.cn:8118/api/activityInfoSign/edit?sf_request_type=ajax',
                {
                    method: 'POST',
                    headers: {
                        "sdp-app-session": this.twfID,
                        'Authorization': `Bearer ${this.token}`
                    },
                    json: true,
                    body: {
                        id: info.id,
                        signInTime: new Date(new Date(activity.startTime).getTime() + 3600 * 1000).toLocaleString().replace(/\//g, '-'),
                        signOutTime: new Date(new Date(activity.startTime).getTime() + 3700 * 1000).toLocaleString().replace(/\//g, '-')
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    }
                    if (typeof body == 'string' && body.includes('Server internal error')) {
                        reject('500 Server internal error')
                    }
                    if (body.message != '请求成功') {
                        reject(body.message)
                    } else {
                        resolve(body)
                    }

                })
        })
    }

    /**
     * 获取签到信息
     * @param {Activity} activity
     * @returns {Promise<{ id: string, isSign:boolean}>} id:签到id;isSign:是否完成签到
     */
    signInfo(activityId) {
        return new Promise(async (resolve, reject) => {
            request(`http://ekt-cuit-edu-cn.webvpn.cuit.edu.cn:8118/api/activityInfoSign/my?activityId=${activityId}&sf_request_type=ajax`,
                {
                    method: 'GET',
                    json: true,
                    headers: {
                        "sdp-app-session": this.twfID,
                        'Authorization': `Bearer ${this.token}`
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    }
                    if (body.message != '请求成功') reject(true)
                    resolve({ id: body.data.rows[0].id, isSign: body.data.rows[0].signOutTime != null && body.data.rows[0].signInTime != null })
                })
        })
    }

    /**
     * 获取第二课堂可报名活动列表
     * @returns {Promise<Activity[]>} 活动列表
     */
    activities() {
        return new Promise((resolve, reject) => {
            request('http://ekt-cuit-edu-cn.webvpn.cuit.edu.cn:8118/api/activityInfo/page?activityName=&activityStatus=&activityLx=&activityType=&pageSize=50&sf_request_type=ajax',
                {
                    method: 'GET',
                    json: true,
                    headers: {
                        "sdp-app-session": this.twfID,
                        'Authorization': `Bearer ${this.token}`
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    }
                    //console.log(body)
                    if (body.message != '请求成功') {
                        reject(new Error(body.message))
                    } else {
                        /** @type Activity[] */
                        let activities = []
                        body.data.rows.forEach(element => {
                            if (element == undefined || element.id.includes('*')) return
                            activities.push({ id: element.id, activityStatus: element.activityStatus, activityName: element.activityName, startTime: element.startTime, endTime: element.endTime, isSign: element.isSign })
                        })
                        resolve(activities)
                    }

                })
        })
    }

    /**
     * 获取第二课堂可报名活动列表
     * @returns {Promise<Activity[]>} 活动列表
     */
    myActivities() {
        return new Promise((resolve, reject) => {
            request('http://ekt-cuit-edu-cn.webvpn.cuit.edu.cn:8118/api/activityInfo/my?sf_request_type=ajax',
                {
                    method: 'GET',
                    json: true,
                    headers: {
                        "sdp-app-session": this.twfID,
                        'Authorization': `Bearer ${this.token}`
                    }
                }, (error, response, body) => {
                    if (error) {
                        reject(error)
                    }
                    if (body.message != '请求成功') {
                        reject(new Error(body.message))
                    } else {
                        /** @type Activity[] */
                        let activities = []
                        body.data.forEach(element => {
                            if (element == undefined || element.id.includes('*')) return
                            activities.push({ id: element.id, activityStatus: element.activityStatus, activityName: element.activityName, startTime: element.startTime, endTime: element.endTime, isSign: element.isSign })
                        })
                        resolve(activities)
                    }

                })
        })
    }

    /**
     * 尝试报名所有第二课堂可报名活动
     * @returns {Promise<Activity[]>} 返回报名成功的活动
     */
    async signAll() {
        let signActivities = []
        let activities = await this.activities()
        for (let element of activities) {
            if (element.isSign == 1 || element.activityStatus != '0') continue;
            let ret = await this.sign(element)
            console.log(`"${element.activityName}"(${element.id}) ${ret.msg}`)
            if (ret.code == '1') signActivities.push(element)
        }
        return signActivities
    }

    /**
     * 签到所有第二课堂已报名活动
     * @returns {Promise<Activity[]>} 返回签到成功的活动
     */
    async signInAll() {
        let signInActivities = []
        let activities = await this.myActivities()
        for (let element of activities) {
            if (!['0', '1', '2'].includes(element.activityStatus)) continue;
            if ((await this.signInfo(element.id)).isSign) continue;
            console.log(`"${element.activityName}"(${element.id})` + (await this.signIn(element)).message)
            signInActivities.push(element)
        }
        return signInActivities
    }
}
export default SecondClass