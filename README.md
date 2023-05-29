# cuit-secondclass

成信专 第二课堂 自动报名并签到签退  
通过webvpn登录,无需校内网  

## 注意事项  
签到签退时，概率因为返回活动id不全无法完成(重试解决)  
使用脚本前请勿在网页端登录二课，否则会500 Server internal error(等几分钟就行)  

## 直接使用

```sh
npm i
npm start 学号 密码
```

## 作为模块使用

```js
import SecondClass from "secondclass"

let sc = await new SecondClass(114514, 'acbd1234').login()
if ((await sc.signAll()).length == 0) console.log('无可报名活动')
if ((await sc.signInAll()).length == 0) console.log('无可签到活动')

```


### 500 Server internal error处理

保存登录成功后的sessionId，并在下一次登录时调用  
不处理也行，等几分钟就是了  

```js
if (!fs.existsSync('cache.txt')) {
    fs.writeFileSync('cache.txt', '')
}
let sessionId = fs.readFileSync('cache.txt', 'utf-8')

let sc = await new SecondClass(114514, 'abcd1234').login(sessionId)
fs.writeFileSync('cache.txt', sc.sessionId)

```

### 处理webvpn验证码

```js

let sc = new SecondClass(auth.id, auth.password)
sc.login(sessionId, async (captchaBuffer) => {
    fs.writeFileSync('./captcha.gif', captchaBuffer) //写入文件
    let captcha = await balabala/*自行处理*/
    return captcha
})

```