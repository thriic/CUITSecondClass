import webvpn from "./webvpn.js";
import { SecondClass } from "./secondClass.js";
import * as config from "./config.js";

async function login(id, password) {
    let auth = { id, password }

    let conf = config.readById(auth.id)
    let twfid = conf?.twfid

    //检查webvpn是否登录
    let loginWebvpn = twfid && await webvpn.checkLogin(twfid)
    if (loginWebvpn) {
        console.log('webvpn已登录,twfid:', twfid)
    } else {
        console.log('未登录webvpn,尝试登录')
        twfid = await webvpn.login(auth.id, auth.password)
        console.log('登录成功,twfid:', twfid)
    }
    config.updateById(auth.id, twfid)


    console.log('尝试登录第二课堂')
    let sc = new SecondClass(auth.id, twfid)
    let token = await sc.login()
    console.log('登录成功,token', token)
    await sc.user()
    console.log(`欢迎,${sc.info.name}(${sc.info.id})`)

    if ((await sc.signAll()).length == 0) console.log('无可报名活动')
    if ((await sc.signInAll()).length == 0) console.log('无可签到活动')
}

login(2022101063, 'thryan0829')