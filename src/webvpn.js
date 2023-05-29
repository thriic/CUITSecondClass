import request from "request";
import { parseString } from 'xml2js';
import RSAKey from './encrypt.js'

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

    /**
     * 获取twfid
     * @param {0 | 1} captcha
     * @returns {Promise<{ TwfID: string, CSRF_RAND_CODE: string, RSA_ENCRYPT_KEY: string }>} 
     */
    auth(captcha = 0) {
        return new Promise((resolve, reject) => {
            request('https://webvpn.cuit.edu.cn/por/login_auth.csp?apiversion=1', {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    'Cookie': `ENABLE_RANDCODE=` + captcha
                },
            }, (error, _response, body) => {
                if (error) reject(error)
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


    /**
     * 登录Webvpn
     * @param {0 | 1} captcha 是否启用验证码登录
     * @param {(captchaBuffer:Buffer) => Promise<string> | undefined} onCaptcha
     * @returns {Promise<Webvpn>} 
     */
    async login(captcha = 0, onCaptcha) {
        //检查是否为登录状态
        if (await this.checkLogin()) return

        let { TwfID, CSRF_RAND_CODE, RSA_ENCRYPT_KEY } = await this.auth(captcha)
        const RSA = new RSAKey()
        RSA.setPublic(RSA_ENCRYPT_KEY, '10001')
        let encryptedPwd = RSA.encrypt(`${this.pwd}_${CSRF_RAND_CODE}`)

        return new Promise((resolve, reject) => {
            request('https://webvpn.cuit.edu.cn/por/login_psw.csp?anti_replay=1&encrypt=1&apiversion=1',
                {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        'Cookie': `ENABLE_RANDCODE=${captcha}; TWFID=${TwfID}`
                    },
                    body: `mitm_result=&svpn_req_randcode=${CSRF_RAND_CODE}&svpn_name=${this.id}&svpn_password=${encryptedPwd}&svpn_rand_code=`

                }, async (error, _response, body) => {
                    if (error) reject(error)
                    else parseString(body, (_err, result) => {
                        let message = result.Auth.Message[0]
                        if (message.includes('CAPTCHA incorrect')) {
                            console.log('验证码错误，重新获取')
                            resolve(this.login(1, onCaptcha))
                        } else if (message != 'radius auth succ') {
                            reject(new Error(message))
                        } else {
                            this.twfID = result.Auth.TwfID[0]
                            resolve(this)
                        }
                    })
                })
        })
    }

    captcha(TwfID) {
        return new Promise((resolve, reject) => {
            let url = 'https://webvpn.cuit.edu.cn/por/rand_code.csp?rnd=' + Math.random()
            request(url, {
                headers: {
                    'Cookie': `ENABLE_RANDCODE=1; TWFID=${TwfID}`
                },
                encoding: 'binary',
            }, (error, _response, body) => {
                if (error) reject(error)
                else resolve(Buffer.from(body, 'binary'))
            })
        })
    }

    /**
     * 检查Webvpn登录状态
     * @returns {Promise<Boolean>} 
     */
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