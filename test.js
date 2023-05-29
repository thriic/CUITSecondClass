import SecondClass from "./src/secondClass.js";

['s','ss','1******','1*'].forEach(element => {
    if (element == undefined || element.includes('*')) return;
    console.log(element)
})