# secondClass

cuit 第二课堂脚本 自动报名并签到签退  
  
未处理登录webvpn可能触发的验证码  
第二课堂登录时可能触发500 Server internal error

# 直接使用

```sh
npm i
npm start 学号 密码
```

# 作为模块使用

```js
import { SecondClass, Webvpn } from "secondclass"

let webvpn = new Webvpn(123, 'abc123')
let sc = new SecondClass(webvpn)
await sc.login()

console.log('尝试报名')
if ((await sc.signAll()).length == 0) console.log('无可报名活动')
console.log('尝试签到')
if ((await sc.signInAll()).length == 0) console.log('无可签到活动')

```
