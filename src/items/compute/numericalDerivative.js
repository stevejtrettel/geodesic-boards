

function numericalDerivative(f,type){
    const h = 0.001;

    if(type == 'u'){
        return (u,v) => (f(u+h,v)-f(u-h,v))/(2*h);
    }
    else if(type == 'v'){
        return (u,v) => (f(u,v+h)-f(u,v-h))/(2*h);
    }
    else if(type == 'uu'){
        return (u,v)=> (f(u+h,v)+f(u-h,v)-2*f(u,v))/(h*h);
    }
    else if(type == 'vv'){
        return (u,v)=> (f(u,v+h)+f(u,v-h)-2*f(u,v))/(h*h);
    }
    else if(type == 'uv' || type == 'vu'){
        return (u,v)=> (f(h+h,v+h)+f(u-h,v-h)-f(u+h,v-h)-f(u-h,v+h))/(4*h*h);
    }

    console.log('incorrect type for numerical partial derivative');
}


export {numericalDerivative};
