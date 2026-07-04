import { parse, simplify, derivative } from 'mathjs/number';

import { fromMathJS } from '@/code/utils/fromMathJS.js';
import { toGLSL } from '@/code/utils/toGLSL.js';

/**
 * A symbolic expression in named coordinates (+ parameters), closed under
 * differentiation. One symbolic source, two compile targets:
 *
 *   - {@link Expression#eval} compiles the AST to a JS closure (once), evaluating
 *     numerically.  Parameter values are read *live* from `paramsObj`, so changing
 *     a parameter needs no recompile — only changing the equation does (rebuild a
 *     fresh Expression).
 *   - {@link Expression#glsl} emits a GLSL expression string.  DISPLAY ONLY: the
 *     intrinsic-geometry layer (metric → Christoffel → geodesics) never calls it.
 *   - {@link Expression#d} returns the exact symbolic derivative as another
 *     Expression, so `expr.d('x').d('y')` composes.
 *
 * @example
 * const f = new Expression('a*exp(-b*(x*x + y*y))', {
 *   coords: ['x', 'y'], params: ['a', 'b'], paramsObj: { a: -1.4, b: 0.5 },
 * });
 * f.eval(0, 0);        // -1.4
 * f.d('x').eval(1, 0); // ∂f/∂x at (1,0)
 * f.d('x').glsl();     // GLSL string for ∂f/∂x
 */
export default class Expression {
    /**
     * @param {string | import('mathjs').MathNode} src  expression string, or a mathjs AST node
     * @param {object} [ctx]
     * @param {string[]} [ctx.coords]     independent-variable names, in eval() order (default ['x','y'])
     * @param {string[]} [ctx.params]     parameter names recognised in the expression
     * @param {object}   [ctx.paramsObj]  live parameter values (read by reference on every eval)
     */
    constructor(src, { coords = ['x', 'y'], params = [], paramsObj = {} } = {}) {
        /** @type {import('mathjs').MathNode} */
        this.node = typeof src === 'string' ? parse(src) : src;
        this.coords = coords;
        this.params = params;
        this.paramsObj = paramsObj;

        this._fn = null;      // lazily-compiled JS closure
        this._glsl = null;    // memoised GLSL string
        this._deriv = {};     // memoised derivative Expressions, keyed by coord name
    }

    /** The context ({coords, params, paramsObj}) shared with derived Expressions. */
    get _ctx() {
        return { coords: this.coords, params: this.params, paramsObj: this.paramsObj };
    }

    /**
     * Evaluate numerically at a point. Arguments are the coordinate values in
     * `coords` order; parameters are read live from `paramsObj`.
     * @param {...number} pt
     * @returns {number}
     */
    eval(...pt) {
        if (!this._fn) {
            this._fn = fromMathJS(this.node, {
                vars: this.coords,
                params: this.params,
                paramsObj: this.paramsObj,
            });
        }
        return this._fn(...pt);
    }

    /**
     * Exact symbolic derivative with respect to coordinate `v`, as a new
     * Expression sharing this one's context. Memoised.
     * @param {string} v  coordinate name (must be one of `coords`)
     * @returns {Expression}
     */
    d(v) {
        if (!this._deriv[v]) {
            const dnode = simplify(derivative(this.node, v));
            this._deriv[v] = new Expression(dnode, this._ctx);
        }
        return this._deriv[v];
    }

    /**
     * GLSL expression string for this node. DISPLAY ONLY.
     * @returns {string}
     */
    glsl() {
        if (this._glsl === null) this._glsl = toGLSL(this.node);
        return this._glsl;
    }
}
