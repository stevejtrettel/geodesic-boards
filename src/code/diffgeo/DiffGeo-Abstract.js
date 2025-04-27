
//abstract differential geometry class we are extending

export default class DiffGeo{
    constructor() {
    }

    parameterization = (u,v)=> {
        console.log('Need to Implement Parameterization')
    }

    surfaceNormal(coords){
        console.log('Need to Implement GetNormal')
    }

    integrateGeodesic(tv){
        //parameterized geodesic in R3
        console.log('Need to Implement IntegrateGeodesic')
    }

    parallelTransport(coordCurve,domain=[0,1]){
        //return an interpolating function for basis along curve
        console.log('Need to Implement ParallelTransport')
    }

    rebuild(){

    }

}
