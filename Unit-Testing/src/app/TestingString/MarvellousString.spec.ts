
// Import requred funnction from .ts file
import {Display} from './MarvellousString';

// Write test suit
describe('Display', ()=>{

    it('should return name of student', ()=>{
        expect(Display('Piyush')).toContain('Piyush welcome to Marvellous Infosystems');
    })
})