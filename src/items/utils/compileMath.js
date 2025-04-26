import * as math from 'mathjs';

/* ------------------------------------------------------------------
   compileNative ─ parse once, emit plain JS that reads params.<id>
   ------------------------------------------------------------------*/
export function compileMath (
    src,
    { vars = ['x', 'y'], params = ['a'], paramsObj } = {}
) {
    const node  = math.parse(src);       // ⇢ AST
    const vSet  = new Set(vars);
    const pSet  = new Set(params);

    /* ---------- NEW gen()  --------------------------------------- */
    function gen (n) {
        /* numeric literals ----------------------------------------- */
        if (n.isConstantNode) return String(n.value);

        /* parentheses ---------------------------------------------- */
        if (n.isParenthesisNode) return `(${gen(n.content)})`;

        /* identifiers ---------------------------------------------- */
        if (n.isSymbolNode) {
            const id = n.name;
            if (vSet.has(id)) return id;                 // x , y …
            if (pSet.has(id)) return `params.${id}`;     // params.a
            if (id === 'pi') return 'Math.PI';
            if (id === 'e')  return 'Math.E';
            return `Math.${id}`;                         // sin, cos, exp …
        }

        /* function calls ------------------------------------------- */
        if (n.isFunctionNode) {
            return `Math.${n.fn.name}(${n.args.map(gen).join(',')})`;
        }

        /* binary / unary ops --------------------------------------- */
        if (n.isOperatorNode) {
            const [l, r] = n.args;
            if (n.op === '^') return `(${gen(l)} ** ${gen(r)})`;   // fast power
            if (n.op === '-') {                                   // unary minus?
                if (n.isUnary()) return `(-${gen(l)})`;
            }
            return `(${gen(l)} ${n.op} ${gen(r)})`;
        }

        throw Error(`Unhandled node type: ${n.type}`);
    }

    const expr = gen(node);                         // stringify expression

    /* build native function with params captured by closure ------ */
    const fCore = new Function(...vars, 'params', `return ${expr};`);
    return (...vals) => fCore(...vals, paramsObj);
}

// /* -------------- demo ----------------------------------------- */
// const params = { a: 2.5 };
//
// const f = compileMath(
//     'a*e^(-x^2 - y^2)',          // ✓ parentheses, ^, e
//     { vars: ['x', 'y'], params: ['a'], paramsObj: params }
// );
//
// console.log( f(1, 0.5) );      // 0.960789...
// params.a = 1.2;
// console.log( f(1, 0.5) );      // 0.460579...
