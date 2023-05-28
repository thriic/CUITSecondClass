import {SecondClass, Webvpn} from "./src/secondClass.js";
import * as config from "./src/config.js";


let auth = { id: 123, password: '123' }
//学号 密码 用于登录webvpn

let test = async () => {
    try {
        let conf = config.readById(auth.id)
        let twfid = conf?.twfid

        let webvpn = new Webvpn(auth.id, auth.password, twfid)
        await webvpn.login()

        config.updateById(auth.id, webvpn.twfID)


        console.log('尝试登录第二课堂')
        let sc = new SecondClass(webvpn, 2022101063)
        await sc.login()
        console.log('登录成功,token', sc.token)
        let info = await sc.user()
        console.log(`欢迎,${info.name}(${info.id})`)

        console.log('尝试报名')
        if ((await sc.signAll()).length == 0) console.log('无可报名活动')
        console.log('尝试签到')
        if ((await sc.signInAll()).length == 0) console.log('无可签到活动')
    } catch (e) {
        console.error('error', e)
    }
}

test()