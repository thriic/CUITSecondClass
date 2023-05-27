
import fs from 'fs'

export function readById(id) {
    const cache = JSON.parse(fs.readFileSync('./config.json'))
    const result = cache.find(item => item.id === id)
    return result;
}

export function addElement(newElement) {
    const cache = JSON.parse(fs.readFileSync('./config.json'));
    cache.push(newElement);
    fs.writeFileSync('config.json', JSON.stringify(cache));
}

export function updateById(id, twfid) {
    try {
        // 读取config.json文件内容
        const data = JSON.parse(fs.readFileSync('./config.json'));

        // 查找到对应的元素
        const index = data.findIndex(item => item.id === id);
        if (index === -1) {
            // 如果没有找到对应的元素，addElement
            addElement({ id, twfid });
            return;
        }

        // 更新元素的属性
        const element = data[index];
        element[key] = value;
        fs.writeFileSync('./config.json', JSON.stringify(data, null, 2));
    } catch (err) {
        console.log(err)
    }
}