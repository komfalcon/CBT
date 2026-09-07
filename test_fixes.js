let text = "C(s) + O_2(g)\to CO_2(g)";
console.log(text.replace(/\to/g, '\\to '));

let text2 = "10\\text{ \\(\\Omega\\) }";
text2 = text2.replace(/\\text\{\s*\\\(\s*([^)]+)\s*\\\)\s*\}/g, '$1');
console.log(text2);

let text3 = "an\\phi = \\frac{X_L}{R}";
console.log(text3.replace(/\tan/g, '\\tan')); // Wait, if there's no tab, it won't match.
let text4 = String.fromCharCode(9) + "an\\phi";
console.log(text4.replace(/\tan/g, '\\tan'));

let text5 = "4s\\textsuperscript{2}";
console.log(text5.replace(/\\textsuperscript\{([^}]*)\}/g, '^{$1}'));

