import test from 'node:test';
import assert from 'node:assert/strict';
import {draw,frequencies,csv} from '../random.js';
test('classical maps all eight equal-width intervals, including edges',()=>{
 for(let i=0;i<8;i++) {assert.equal(draw('classical',()=>i/8),i);assert.equal(draw('classical',()=>(i+.999)/8),i);}
});
test('three ideal measurements map all eight equally likely bit patterns',()=>{
 for(let n=0;n<8;n++){const bits=n.toString(2).padStart(3,'0').split('').map(b=>b==='0'?.25:.75);assert.equal(draw('quantum',()=>bits.shift()),n);assert.equal(bits.length,0);}
});
test('measurement threshold and no-winner outcome',()=>{
 assert.equal(draw('quantum',()=>.5),7);assert.equal(draw('quantum',()=>0),0);assert.equal(draw('classical',()=>.999999),7);
});
test('frequency totals and CSV escaping',()=>{
 assert.deepEqual(frequencies([0,7,7,2]),[1,0,1,0,0,0,0,2]);
 assert.equal(csv([['a,b','say "hi"'],[1,2]]),'"a,b","say ""hi"""\r\n"1","2"');
 assert.throws(()=>draw('invalid'));
});
