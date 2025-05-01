import { parse } from 'mathjs/number';

/**
 * Convert a MathJS node into a GLSL expression string.
 * @param {math.Node} node
 * @returns {string}
 */
export function toGLSL(expr) {

    const node = typeof expr === 'string' ? parse(expr) : expr;

    switch (node.type) {
        case 'OperatorNode': {
            const args = node.args.map(toGLSL);
            const op   = node.op;

            // Power: use GLSL pow()
            if (op === '^') {
                return `pow(${args[0]}, ${args[1]})`;
            }
            // Logical
            if (op === 'and') return `(${args[0]} && ${args[1]})`;
            if (op === 'or')  return `(${args[0]} || ${args[1]})`;
            if (op === 'not') return `!${maybeParen(args[0])}`;

            // Unary + / –
            if (args.length === 1) {
                return `${op}${maybeParen(args[0])}`;
            }
            // Binary +, -, *, /
            return `(${args[0]} ${op} ${args[1]})`;
        }

        case 'FunctionNode': {
            const name = node.name;               // e.g. 'sin', 'sqrt', 'log'
            const args = node.args.map(toGLSL).join(', ');

            // MathJS: log(x, base) → GLSL: log(x)/log(base)
            if (name === 'log' && node.args.length === 2) {
                const [x, base] = node.args.map(toGLSL);
                return `(log(${x})/log(${base}))`;
            }

            return `${name}(${args})`;
        }

        case 'SymbolNode': {
            // common math constants → literal
            if (node.name === 'pi') return '3.141592653589793';
            if (node.name === 'e')  return '2.718281828459045';
            return node.name;
        }

        case 'ConstantNode': {
            let v = node.value.toString();
            // ensure floats have a decimal point
            if (/^\d+$/.test(v)) v = v + '.0';
            return v;
        }

        default:
            throw new Error(`toGLSL: unsupported node type "${node.type}"`);
    }
}

/**
 * Wrap in parens if it contains a binary operator
 */
function maybeParen(s) {
    return /[+\-*/]/.test(s) ? `(${s})` : s;
}




