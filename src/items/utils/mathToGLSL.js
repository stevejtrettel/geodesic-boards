import * as math from 'mathjs';

const rename = {
    //  Math-JS name   →  GLSL spelling / replacement
    atan2 : 'atan',          // GLSL atan(y, x)
    ln    : 'log',           // if you register ln in mathjs yourself
    mod   : 'mod',           // keep same name but ensure two-arg call
    // add more as needed
};

function mathToGLSL(src){
    const ast0 = math.parse(src);

    // ① operator ^  →  pow()
    // ② rename mismatched function identifiers
    const ast = ast0.transform(function (node){
        /* exponent operator ------------------------------------------ */
        if (node.type === 'OperatorNode' && node.op === '^'){
            return new math.FunctionNode(
                new math.SymbolNode('pow'),
                node.args
            );
        }

        /* rename / wrap functions ------------------------------------ */
        if (node.type === 'FunctionNode'){
            const old = node.fn.name;          // Math-JS function name
            if (old in rename){
                const newName = rename[old];
                return new math.FunctionNode(
                    new math.SymbolNode(newName),
                    node.args          // keep argument list intact
                );
            }
        }
        return node;
    });

    /* ③ print, float-ify integers  --------------------------------- */
    return ast.toString({
        handler(n){
            if (n.isConstantNode &&
                Number.isInteger(n.value))   return n.value.toFixed(1);
        },
        parenthesis: 'keep'
    });
}

/* --- demo ------------------------------------------------------ */
console.log( mathToGLSL('atan2(y,x) + 3^n - ln(2)') );
// → "atan(y, x) + pow(3.0, n) - log(2.0)"


export {mathToGLSL};
