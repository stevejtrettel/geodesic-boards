/*───────────────────────────────────────────────────────────────┐
│  expr-to-glsl.js                                               │
│     exprToGLSL("3x^2*y + atan2(y,x)")                          │
│     → "(3.0*x*x)*y + atan(y, x)"                               │
└───────────────────────────────────────────────────────────────*/

/*--------------------------------------------------------------*
 * 0.  Configurable tables                                       *
 *--------------------------------------------------------------*/
const RENAME = { atan2:'atan', ln:'log', mod:'mod' }; // JS names → GLSL
const CONSTS = {                                       // inline literals
    pi:  '3.141592653589793',
    τ:   '6.283185307179586',
    tau: '6.283185307179586',
    e:   '2.718281828459045',
};

/*--------------------------------------------------------------*
 * 1.  Tokeniser                                                *
 *--------------------------------------------------------------*/
const isLetter = c => /[a-zτπ]/i.test(c);
const isDigit  = c => /[0-9]/.test(c);

function tokenize(src){
    const t=[], push=(type,val)=>t.push({type,val});
    let i=0;
    while(i<src.length){
        const c=src[i];
        if(/\s/.test(c)){ i++; continue; }

        // number ----------------------------------------------------
        if(isDigit(c) || (c==='.'&&isDigit(src[i+1]))){
            let j=i; while(isDigit(src[j])) j++;
            if(src[j]==='.') { j++; while(isDigit(src[j])) j++; }
            push('num', src.slice(i,j)); i=j; continue;
        }

        // identifier ------------------------------------------------
        if(isLetter(c)){
            let j=i; while(isLetter(src[j])||isDigit(src[j])) j++;
            push('id', src.slice(i,j)); i=j; continue;
        }

        if('+-*/^(),'.includes(c)){ push(c,c); i++; continue; }

        throw SyntaxError(`Unexpected '${c}' at pos ${i}`);
    }
    return t;
}

/*--------------------------------------------------------------*
 * 2.  Very small AST parser                                    *
 *--------------------------------------------------------------*/
class Parser {
    constructor(tokens) { this.t = tokens; this.i = 0; }
    peek() { return this.t[this.i]; }
    eat(type) {
        const tok = this.t[this.i];
        if (!tok || tok.type !== type)
            throw SyntaxError(`expected ${type}, got ${tok?.type}`);
        this.i++;
        return tok;
    }

    parse() {
        const e = this.expr();
        if (this.i < this.t.length) throw SyntaxError('extra input');
        return e;
    }

    // 1) addition / subtraction
    expr() {
        let node = this.term();
        while (this.peek() && (this.peek().type === '+' || this.peek().type === '-')) {
            const op = this.eat(this.peek().type).type;
            node = { op, left: node, right: this.term() };
        }
        return node;
    }

    // 2) multiplication (and implicit multiplication)
    term() {
        let node = this.unary();
        while (true) {
            const k = this.peek();
            if (
                k &&
                (k.type === '*' ||
                    k.type === '/' ||
                    k.type === '(' ||      // implicit: number or id followed by '('
                    k.type === 'num' ||
                    k.type === 'id')
            ) {
                const op = (k.type === '*' || k.type === '/') ? this.eat(k.type).type : '*';
                node = { op, left: node, right: this.unary() };
            } else {
                break;
            }
        }
        return node;
    }

    // 3) unary minus binds looser than ^, so we call power() here
    unary() {
        if (this.peek() && this.peek().type === '-') {
            this.eat('-');
            return { op: 'neg', arg: this.unary() };
        }
        return this.power();
    }

    // 4) exponentiation is right-associative and binds tighter than unary
    power() {
        let node = this.primary();
        if (this.peek() && this.peek().type === '^') {
            this.eat('^');
            node = { op: '^', left: node, right: this.power() };
        }
        return node;
    }

    // 5) now the old “factor” without unary-minus
    primary() {
        const k = this.peek();
        if (!k) throw SyntaxError('Unexpected end of input');

        if (k.type === 'num') {
            this.eat('num');
            return { num: k.val };
        }

        if (k.type === 'id') {
            const id = this.eat('id').val;
            if (this.peek() && this.peek().type === '(') {
                // function call
                this.eat('(');
                const args = [ this.expr() ];
                while (this.peek() && this.peek().type === ',') {
                    this.eat(',');
                    args.push(this.expr());
                }
                this.eat(')');
                return { func: id, args };
            }
            return { id };
        }

        if (k.type === '(') {
            this.eat('(');
            const node = this.expr();
            this.eat(')');
            return node;
        }

        throw SyntaxError(`Unexpected token ${k.type}`);
    }
}


/*--------------------------------------------------------------*
 * 3.  GLSL printer                                             *
 *--------------------------------------------------------------*/
const fmtF = n => {
    if(/e|E|\./.test(n)) return n;          // already float/scientific
    return n + '.0';                        // int → float
};

function powGLSL(base, expNode){
    if(expNode.num){
        const k=parseFloat(expNode.num);
        if(Number.isInteger(k)){
            if(k===0) return '1.0';
            if(k===1) return base;
            if(k>1 && k<=4) return `(${Array(k).fill(base).join('*')})`;
        }
    }
    return `pow(${base}, ${printGLSL(expNode)})`;
}

function printGLSL(node){
    if(node.num)            return fmtF(node.num);

    if(node.id){            // const or variable
        if(node.id in CONSTS) return CONSTS[node.id];
        return node.id;
    }

    if(node.func){
        const name = RENAME[node.func] ?? node.func;
        return `${name}(${node.args.map(printGLSL).join(', ')})`;
    }

    if(node.op==='neg')     return `(-${printGLSL(node.arg)})`;
    if(node.op==='^')       return powGLSL(printGLSL(node.left), node.right);
    return `(${printGLSL(node.left)} ${node.op} ${printGLSL(node.right)})`;
}

/*--------------------------------------------------------------*
 * 4.  Public helper                                            *
 *--------------------------------------------------------------*/
export function toGLSL(source){
    const ast = new Parser(tokenize(source)).parse();
    return printGLSL(ast);
}

// /*--------------------------------------------------------------*
//  * 5.  Quick demo (delete or comment out in production)         *
//  *--------------------------------------------------------------*/
// if (import.meta.url === (typeof document==='undefined' ? undefined : document.currentScript?.src)) {
//     console.log( toShaderMath('atan2(y,x) + 3^n - ln(2)') );
//     // → "atan(y, x) + pow(3.0, n) - log(2.0)"
//
//     console.log( toShaderMath('3x^2y*cos(2xy - a*x^2)') );
//     // → "(3.0*x*x)*y*cos((2.0*x*y) - a*pow(x, 2.0))"
// }
