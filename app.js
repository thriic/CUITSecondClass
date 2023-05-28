import { SecondClass, Webvpn } from "./secondClass.js";
import * as config from "./config.js";

let args = process.argv.slice(2);
if (args[0] == undefined || args[1] == undefined) {
    console.log('npm start 学号 密码 如:npm start 123 aab123')
} else {
    let auth = { id: parseInt(args[0]), password: args[1] };
    (async () => {
        try {
            let conf = config.readById(auth.id)
            let twfid = conf?.twfid

            let webvpn = new Webvpn(auth.id, auth.password, twfid)

            config.updateById(auth.id, webvpn.twfID)


            console.log('尝试登录第二课堂')
            let sc = new SecondClass(webvpn, 2022101063)
            await sc.login()
            console.log('登录成功,token', sc.token)
            // let info = await sc.user()
            // console.log(`欢迎,${info.name}(${info.id})`)

            console.log('尝试报名')
            if ((await sc.signAll()).length == 0) console.log('无可报名活动')
            console.log('尝试签到')
            if ((await sc.signInAll()).length == 0) console.log('无可签到活动')
        } catch (e) {
            console.error('error:', e)
        }
    })();
}