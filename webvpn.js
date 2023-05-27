import request from "request";
import { parseString } from 'xml2js';
import RSAKey from './encrypt.js'

let auth = () => new Promise((resolve, reject) => {
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

let login = async (id, pwd) => {
    let { TwfID, CSRF_RAND_CODE, RSA_ENCRYPT_KEY } = await auth()
    console.log(TwfID)
    const RSA = new RSAKey()
    RSA.setPublic(RSA_ENCRYPT_KEY, '10001')
    let encryptedPwd = RSA.encrypt(`${pwd}_${CSRF_RAND_CODE}`)
    return new Promise((resolve, reject) => {
        request('https://webvpn.cuit.edu.cn/por/login_psw.csp?anti_replay=1&encrypt=1&apiversion=1',
            {
                method: 'POST',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    'Cookie': `ENABLE_RANDCODE=1; TWFID=${TwfID}`
                },
                body: `mitm_result=&svpn_req_randcode=${CSRF_RAND_CODE}&svpn_name=${id}&svpn_password=${encryptedPwd}&svpn_rand_code=`

            }, (error, _response, body) => {
                if (error) reject(error)
                let TwfID, Message
                console.log(body)
                parseString(body, (err, result) => {
                    Message = result.Auth.Message[0]
                    TwfID = result.Auth.TwfID[0]
                })
                if (Message != 'radius auth succ') reject(Message)
                resolve(TwfID)
            })
    })
}

let checkLogin = (TwfID) => new Promise((resolve, reject) => {
    request('https://webvpn.cuit.edu.cn/por/svpnSetting.csp?apiversion=1', {
        headers: {
            'Cookie': `ENABLE_RANDCODE=0; TWFID=${TwfID}`
        },
    }, (error, response, body) => {
        if (error) {
            reject(error)
        }
        if (body.includes('auth succ.')) resolve(true)
        else resolve(false)
        //auth succ. || unexpected user service
    })
})

export default { login, checkLogin }