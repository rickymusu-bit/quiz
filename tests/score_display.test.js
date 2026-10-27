"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const F=require("../assets/js/engine.js");
test("Scores display nearest integers while retaining exact arithmetic",()=>{
 for(const [n,d,expected] of [[302,3,"101"],[1,3,"0"],[2,3,"1"],[301,2,"151"],[5,1,"5"],[1,8,"0"],[1999,200,"10"],[0,3,"0"],[1,2,"1"],[49,100,"0"],[50,100,"1"],[51,100,"1"]]){
  const score=F.rational(n,d),before=JSON.stringify(score);
  assert.equal(F.formatScore(score),expected);
  assert.equal(JSON.stringify(score),before);
 }
 const share=F.rational(302,3);
 assert.equal(F.exact(F.add(F.add(share,share),share)),"302");
 assert.equal(F.formatScore(F.rational("123456789123456789123456789",3)),"41152263041152263041152263");
});
