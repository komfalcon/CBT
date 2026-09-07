const text1 = "If the initial number of nuclei is \\( N_0 \\) and the decay constant is \\( \\lambda \\), what is the fraction?";
const text2 = "A Carnot engine... given by \\( \\eta = 1 - \\frac{T_L}{T_H} \\).";
const text3 = "\\begin{tikzpicture} ... \\end{tikzpicture}";

function addLatexDelimiters(text) {
  if (!text) return text;
  let result = text.replace(/\\\(([\s\S]*?)\\\)/g, '$$$$$1$$$$'); // Using $$1$$ because JS replace needs $$ to output $
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$$$$$1$$$$$$$$');

  result = result.replace(
    /\\begin\s*\{([^}]+)\}[\s\S]*?\\end\s*\{\1\}/g,
    (match) => `$$$$${match}$$$$`,
  );
  result = result.replace(
    /(\$\$[\s\S]*?\$\$)|(?<!\$)(\\(?:frac|sqrt|sum|int|alpha|beta)(?:\{[^}]*\}|\[[^\]]*\])*(?:[_^](?:\{[^}]*\}|[^\s{]))*)/g,
    (match, doubleBlock) => doubleBlock ?? `$$${match}$$`,
  );
  return result;
}

console.log("Q1:", addLatexDelimiters(text1));
console.log("Q2:", addLatexDelimiters(text2));
