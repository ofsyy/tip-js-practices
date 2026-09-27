"use strict";
console.log("1) '8' + 2 =", "8" + 2);
console.log("   тип:", typeof ("8" + 2));

console.log("2) '8' - 2 =", "8" - 2);
console.log("   тип:", typeof ("8" - 2));

console.log("3) Number('8') + 2 =", Number("8") + 2);
console.log("   тип:", typeof (Number("8") + 2));

console.log("4) '12' > '3' =", "12" > "3");
console.log("   тип:", typeof ("12" > "3"));

console.log("5) 12 === '12' =", 12 === "12");
console.log("   тип:", typeof (12 === "12"));

console.log("6) Number('') =", Number(""));
console.log("   тип:", typeof Number(""));

console.log("7) Number('text') =", Number("text"));
console.log("   тип:", typeof Number("text"));

console.log("8) Boolean('false') =", Boolean("false"));
console.log("   тип:", typeof Boolean("false"));

console.log("9) typeof null =", typeof null);
console.log("   тип результата:", typeof (typeof null));

console.log("10) typeof NaN =", typeof NaN);
console.log("    тип результата:", typeof (typeof NaN));