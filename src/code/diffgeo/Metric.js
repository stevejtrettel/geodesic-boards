/**
 * The (first fundamental) metric of a 2D surface and the Levi-Civita Christoffel
 * symbols derived from it.
 *
 * A `Metric` is built from a `forms` callback that returns the metric components
 * `E, F, G` and their first derivatives at a query point. Two factories cover the
 * two ways a surface is specified:
 *
 *   - {@link Metric.fromEmbedding} — embedding-primary (graphs, surfaces of
 *     revolution): the metric is *induced* from a symbolic embedding X(u,v)→ℝ³.
 *     Symbolic autodiff is confined to the raw embedding components (up to 2nd
 *     order); `E,F,G` and their first derivatives are assembled by the product
 *     rule numerically at the point — exact, and free of `simplify` blow-up.
 *   - {@link Metric.fromComponents} — metric-primary (e.g. a Schwarzschild optical
 *     metric): `E,F,G` are given directly as {@link Expression}s; their first
 *     derivatives come from exact symbolic differentiation.
 *
 * Christoffels are the same closed-form regardless of which factory built the
 * metric, so the geodesic/transport layer above never needs to know.
 */
export default class Metric {
    /**
     * @param {(a: number, b: number) => FundamentalForms} formsFn
     */
    constructor(formsFn) {
        this._forms = formsFn;
    }

    /**
     * Metric induced from a symbolic embedding.
     * @param {[import('@/code/symbolic/Expression.js').default,
     *          import('@/code/symbolic/Expression.js').default,
     *          import('@/code/symbolic/Expression.js').default]} embedding  [X, Y, Z] of (u,v)
     * @param {[string, string]} coords  the two coordinate names, e.g. ['x','y'] or ['u','v']
     * @returns {Metric}
     */
    static fromEmbedding([X, Y, Z], [u, v]) {
        // per-component 1st and 2nd derivative Expressions (memoised inside Expression)
        const comp = [X, Y, Z].map((P) => ({
            Pu: P.d(u), Pv: P.d(v),
            Puu: P.d(u).d(u), Puv: P.d(u).d(v), Pvv: P.d(v).d(v),
        }));

        return new Metric((a, b) => {
            let E = 0, F = 0, G = 0, Eu = 0, Ev = 0, Fu = 0, Fv = 0, Gu = 0, Gv = 0;
            for (const c of comp) {
                const pu = c.Pu.eval(a, b), pv = c.Pv.eval(a, b);
                const puu = c.Puu.eval(a, b), puv = c.Puv.eval(a, b), pvv = c.Pvv.eval(a, b);
                // first fundamental form:  E = X_u·X_u,  F = X_u·X_v,  G = X_v·X_v
                E += pu * pu;   G += pv * pv;   F += pu * pv;
                // and its first derivatives, by the product rule
                Eu += 2 * pu * puu;             Ev += 2 * pu * puv;
                Gu += 2 * pv * puv;             Gv += 2 * pv * pvv;
                Fu += puu * pv + pu * puv;      Fv += puv * pv + pu * pvv;
            }
            return { E, F, G, Eu, Ev, Fu, Fv, Gu, Gv };
        });
    }

    /**
     * Metric given directly by its components as Expressions of (u,v).
     * @param {[import('@/code/symbolic/Expression.js').default,
     *          import('@/code/symbolic/Expression.js').default,
     *          import('@/code/symbolic/Expression.js').default]} components  [E, F, G]
     * @param {[string, string]} coords
     * @returns {Metric}
     */
    static fromComponents([E, F, G], [u, v]) {
        return new Metric((a, b) => ({
            E: E.eval(a, b), F: F.eval(a, b), G: G.eval(a, b),
            Eu: E.d(u).eval(a, b), Ev: E.d(v).eval(a, b),
            Fu: F.d(u).eval(a, b), Fv: F.d(v).eval(a, b),
            Gu: G.d(u).eval(a, b), Gv: G.d(v).eval(a, b),
        }));
    }

    /**
     * Metric components and their first derivatives at (a,b).
     * @param {number} a
     * @param {number} b
     * @returns {FundamentalForms}
     */
    forms(a, b) {
        return this._forms(a, b);
    }

    /**
     * Christoffel symbols of the second kind Γᵏᵢⱼ at (a,b), returned grouped by the
     * (symmetric) lower index pair:
     *   `{ uu: [Γ¹₁₁, Γ²₁₁], uv: [Γ¹₁₂, Γ²₁₂], vv: [Γ¹₂₂, Γ²₂₂] }`
     * (coordinate 1 = u/first, 2 = v/second).
     * @param {number} a
     * @param {number} b
     * @returns {{uu: [number, number], uv: [number, number], vv: [number, number]}}
     */
    christoffel(a, b) {
        const { E, F, G, Eu, Ev, Fu, Fv, Gu, Gv } = this._forms(a, b);
        const W = E * G - F * F;

        // Christoffels of the first kind  Γ_{ij,l} = ½(∂ᵢg_{jl} + ∂ⱼg_{il} − ∂_l g_{ij})
        const c111 = 0.5 * Eu,        c112 = Fu - 0.5 * Ev;   // Γ_{11,1}, Γ_{11,2}
        const c121 = 0.5 * Ev,        c122 = 0.5 * Gu;        // Γ_{12,1}, Γ_{12,2}
        const c221 = Fv - 0.5 * Gu,   c222 = 0.5 * Gv;        // Γ_{22,1}, Γ_{22,2}

        // raise the last index with g⁻¹ = (1/W)[[G,−F],[−F,E]]:
        //   Γ¹ = (G·Γ_{·,1} − F·Γ_{·,2}) / W ,   Γ² = (−F·Γ_{·,1} + E·Γ_{·,2}) / W
        const up = (l1, l2) => [(G * l1 - F * l2) / W, (-F * l1 + E * l2) / W];

        return {
            uu: up(c111, c112),
            uv: up(c121, c122),
            vv: up(c221, c222),
        };
    }
}

/**
 * @typedef {object} FundamentalForms
 * @property {number} E @property {number} F @property {number} G
 * @property {number} Eu @property {number} Ev
 * @property {number} Fu @property {number} Fv
 * @property {number} Gu @property {number} Gv
 */
