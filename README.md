# secondClass

cuit 第二课堂脚本 自动报名并签到签退  
  
## 注意事项
多次登录webvpn可能触发验证码，此程序未实现相关处理  
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

保存登录成功后的sessionId，并在下一次使用调用
不处理也行，等几分钟就是了

```js
if (!fs.existsSync('cache.txt')) {
    fs.writeFileSync('cache.txt', '')
}
let sessionId = fs.readFileSync('cache.txt', 'utf-8')

let sc = await new SecondClass(114514, 'abcd1234').login(sessionId, (id) => {
    fs.writeFileSync('cache.txt', id)
})

```

