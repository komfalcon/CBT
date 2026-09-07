const text = "W = " + String.fromCharCode(13) + "ight]";
let result = text.replace(/\right/g, '\\right');
console.log(result);
