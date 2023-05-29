import SecondClass from "./src/secondClass.js"
import fs from 'fs'

import * as readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

const rl = readline.createInterface({ input, output })

import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let args = process.argv.slice(2);
if (args[0] == undefined || args[1] == undefined) {
    console.log('npm start 学号 密码 如:npm start 123 aab123')
} else {
    let auth = { id: parseInt(args[0]), password: args[1] };
    try {
        if (!fs.existsSync('cache.txt')) {
            fs.writeFileSync('cache.txt', '')
        }
        let sessionId = fs.readFileSync('cache.txt', 'utf-8')

        console.log('尝试登录第二课堂')
        new SecondClass(auth.id, auth.password).login(sessionId, async (captchaBuffer) => {
            fs.writeFileSync('./captcha.gif', captchaBuffer)
            let captcha = await rl.question(`输入位于${__dirname}的captcha.gif的验证码:`)
            return captcha
        }).then(async (sc) => {
            fs.writeFileSync('cache.txt', sc.sessionId)

            let info = await sc.user()
            let score = await sc.score()
            console.log(`欢迎,${info.name}(${info.id})`)
            console.log(`当前积分${score.score} 诚信值${score.integrity_value} 已完成活动${score.activity}`)

            console.log('尝试报名')
            if ((await sc.signAll()).length == 0) console.log('无可报名活动')
            console.log('尝试签到')
            if ((await sc.signInAll()).length == 0) console.log('无可签到活动')
        })
    } catch (e) {
        console.error('error:', e)
    }
    rl.close()
}