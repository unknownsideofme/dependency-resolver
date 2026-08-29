import Conflict from "../conflicts/ConflictClass.js";
import { addConstraint } from "./methods/addConstraint.js";
export default class Constraint {
    static #constraints = null;
    static #conflicts = null ; 

    constructor() {
       this.constraints = new Map() ; 
       this.conflicts =  new Conflict() ; 

    }
    getConstraints(){
        if( this.constraints === null){
            throw new Error( "Conflicts not initialized") ; 
        }
        return this.constraints ;
    }

    getConflicts(){
        if(this.conflicts === null ){
            throw new Error( "Conflicts not initialized") ;
        }
        return this.conflicts ;
    }
   
}
Constraint.prototype.addConstraint = addConstraint ;
