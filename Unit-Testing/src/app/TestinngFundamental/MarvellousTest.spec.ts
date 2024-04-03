
// Import requred funnction from .ts file
import {Even} from './MarvellousTest';

// Write test suit
describe('Even', ()=>{

    it('should return 1 if number is even', ()=>{
        const ret = Even(6);
        expect(ret).toBe(1);
    })

    it('should return 0 if number is Odd', ()=>{
        const ret = Even(7);
        expect(ret).toBe(0);
    })
})