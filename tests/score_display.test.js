"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const F=require("../assets/js/engine.js");
test("Scores display rounded Italian decimals while retaining exact arithmetic",()=>{
 for(const [n,d,expected] of [[302,3,"100,67"],[1,3,"0,33"],[2,3,"0,67"],[301,2,"150,5"],[5,1,"5"],[1,8,"0,13"],[1999,200,"10"],[0,3,"0"]]){
  const score=F.rational(n,d),before=JSON.stringify(score);
  assert.equal(F.formatScore(score),expected);
  assert.equal(JSON.stringify(score),before);
 }
 const share=F.rational(302,3);
 assert.equal(F.exact(F.add(F.add(share,share),share)),"302");
 assert.equal(F.formatScore(F.rational("123456789123456789123456789",3)),"41152263041152263041152263");
});
