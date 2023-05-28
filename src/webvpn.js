import request from "request";
import { parseString } from 'xml2js';
import RSAKey from './encrypt.js'
import fs from 'fs'

// RSA部分参考
// 项目 https://github.com/nonesrc/roach
// 协议 MIT

export class Webvpn {
    /**
    * 
    * @param {number} id 学号
    * @param {string} pwd 密码
    * @param {number|undefined} twfID
    */
    constructor(id, pwd, twfID) {
        this.id = id
        this.pwd = pwd
        this.twfID = twfID
    }
    auth() {
        return new Promise((resolve, reject) => {
            request('https://webvpn.cuit.edu.cn/por/login_auth.csp?apiversion=1', (error, response, body) => {
                if (error) {
                    reject(error)
                }
                let TwfID, CSRF_RAND_CODE, RSA_ENCRYPT_KEY
                parseString(body, (_err, result) => {
                    CSRF_RAND_CODE = result.Auth.CSRF_RAND_CODE[0]
                    RSA_ENCRYPT_KEY = result.Auth.RSA_ENCRYPT_KEY[0]
                    TwfID = result.Auth.TwfID[0]
                })

                resolve({ TwfID, CSRF_RAND_CODE, RSA_ENCRYPT_KEY })
            })
        })
    }


    async login() {
        //检查是否为登录状态
        if (await this.checkLogin()) return
        console.log('登录webvpn')
        let { TwfID, CSRF_RAND_CODE, RSA_ENCRYPT_KEY } = await this.auth()
        const RSA = new RSAKey()
        RSA.setPublic(RSA_ENCRYPT_KEY, '10001')
        let encryptedPwd = RSA.encrypt(`${this.pwd}_${CSRF_RAND_CODE}`)

        return new Promise((resolve, reject) => {
            request('https://webvpn.cuit.edu.cn/por/login_psw.csp?anti_replay=1&encrypt=1&apiversion=1',
                {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        'Cookie': `ENABLE_RANDCODE=0; TWFID=${TwfID}`
                    },
                    body: `mitm_result=&svpn_req_randcode=${CSRF_RAND_CODE}&svpn_name=${this.id}&svpn_password=${encryptedPwd}&svpn_rand_code=`

                }, (error, _response, body) => {
                    if (error) reject(error)
                    let TwfID, Message
                    if (body.includes('CAPTCHA')) {
                        console.log('无法处理,需要验证码')
                        this.loginWithCaptcha()
                        return
                    }
                    parseString(body, (err, result) => {
                        Message = result.Auth.Message[0]
                        if (Message != 'radius auth succ') {
                            reject(Message)
                            return
                        }
                        TwfID = result.Auth.TwfID[0]
                    })
                    this.twfID = TwfID
                    resolve(this)
                })
        })
    }

    async loginWithCaptcha() {
        let captcha = await this.captcha()
        fs.writeFileSync("./download.gif", captcha, "binary");
    }

    captcha() {
        return new Promise((resolve, reject) => {
            let url = 'https://webvpn.cuit.edu.cn/por/rand_code.csp?rnd=' + Math.random()
            request(url, {
                headers: {
                    'Cookie': `ENABLE_RANDCODE=1; TWFID=${this.twfID}`
                }
            }).pipe(fs.createWriteStream(`./captcha.gif`))
        })
    }

    checkLogin() {
        return new Promise((resolve, reject) => {
            if (this.twfID == undefined || this.twfID == '') resolve(false)
            request('https://webvpn.cuit.edu.cn/por/svpnSetting.csp?apiversion=1', {
                headers: {
                    'Cookie': `ENABLE_RANDCODE=0; TWFID=${this.twfID}`
                },
            }, (error, response, body) => {
                if (error) {
                    reject(error)
                }
                else {
                    if (body.includes('auth succ.')) resolve(true)
                    else resolve(false)
                    //auth succ. || unexpected user service
                }
            })
        })
    }
}

export default Webvpn