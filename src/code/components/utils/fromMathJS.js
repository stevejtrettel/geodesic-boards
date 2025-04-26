
/**
 * Turn a Math.js AST node directly into a JS function.
 *
 * @param {math.Node} node         — a Math.js AST, e.g. from math.parse() or math.simplify()
 * @param {Object}    [options]
 * @param {string[]}  [options.vars]      — names of independent variables, e.g. ['x','y']
 * @param {string[]}  [options.params]    — names of parameters, e.g. ['a','b','c']
 * @param {Object}    [options.paramsObj] — an object supplying numeric values for each param
 * @returns {Function} f(...vars) → Number
 */
export function fromMathJS(
    node,
    { vars = ['x','y'], params = [], paramsObj = {} } = {}
) {

    const vSet = new Set(vars);
    const pSet = new Set(params);

    function gen(n) {
        // numeric literals
        if (n.isConstantNode) {
            return String(n.value);
        }

        // parentheses
        if (n.isParenthesisNode) {
            return `(${gen(n.content)})`;
        }

        // variables or parameters
        if (n.isSymbolNode) {
            const name = n.name;
            if (vSet.has(name))       return name;
            if (pSet.has(name))       return `paramsObj.${name}`;
            throw new Error(`Unrecognized symbol "${name}" in expression`);
        }

        // operators: +, -, *, /, ^, etc.
        if (n.isOperatorNode) {
            const [L, R] = n.args;
            // unary minus
            if (n.fn === 'unaryMinus') {
                return `(-${gen(L)})`;
            }
            // power: '^' → '**'
            const op = n.op === '^' ? '**' : n.op;
            return `(${gen(L)} ${op} ${gen(R)})`;
        }

        // function calls: sin, cos, exp, log, etc.
        if (n.isFunctionNode) {
            // map Math.js names → Math.*
            // you can extend this mapping if you use more functions
            const nameMap = {
                sin:   'Math.sin',
                cos:   'Math.cos',
                tan:   'Math.tan',
                asin:  'Math.asin',
                acos:  'Math.acos',
                atan:  'Math.atan',
                atan2: 'Math.atan2',
                exp:   'Math.exp',
                log:   'Math.log',    // natural log
                log10: 'Math.log10',
                sqrt:  'Math.sqrt',
                abs:   'Math.abs',
                ceil:  'Math.ceil',
                floor: 'Math.floor',
                round: 'Math.round',
                max:   'Math.max',
                min:   'Math.min',
                // add more if needed...
            };
            const fn   = n.name;
            const jsFn = nameMap[fn] || `Math.${fn}`;
            const args = n.args.map(gen).join(', ');
            return `${jsFn}(${args})`;
        }

        // array or object access like A[i]
        if (n.isAccessorNode) {
            return `${gen(n.object)}[${gen(n.index)}]`;
        }

        // fallback: try the built-in toString()
        if (typeof n.toString === 'function') {
            return n.toString();
        }

        throw new Error(`Unsupported node type: ${n.type}`);
    }

    // generate the JS expression
    const expr = gen(node);

    // first arg is the paramsObj closure, then your vars in order
    const fnArgs = ['paramsObj', ...vars];
    const fnBody = `return ${expr};`;
    console.log(fnArgs);
    console.log(fnBody);

    // build a raw function(paramsObj, ...vars){ return <expr>; }
    const raw = new Function(...fnArgs, fnBody);
    console.log(raw);

    // bind your paramsObj so the returned function signature is just (...vars)
    return raw.bind(null, paramsObj);


    // let rawFn;
    // try {
    //     // build the raw Function constructor
    //     rawFn = new Function(...fnArgs, fnBody);
    // } catch (err) {
    //     console.error('🛑 fromMathJS failed to compile:');
    //     console.error('  args:', fnArgs);
    //     console.error('  body:', fnBody);
    //     console.error(err);
    //     throw err;   // or provide a fallback evaluator here
    // }
    //
    // // wrap so the user only calls f(x,y,...), and we always pass paramsObj under the hood
    // return function(...varValues) {
    //     return rawFn(paramsObj, ...varValues);
    // };
}


