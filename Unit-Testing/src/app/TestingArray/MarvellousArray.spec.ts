
// Import requred funnction from .ts file
import {Batches} from './MarvellousArray';

// Write test suit
describe('Batches', ()=>{

    it('should return all names of Marvellous Batches', ()=>{
        const ret = Batches();
        expect(ret).toContain('PPA');
        expect(ret).toContain('Angular');
        expect(ret).toContain('LB');
        expect(ret).toContain('Python');
    })
})