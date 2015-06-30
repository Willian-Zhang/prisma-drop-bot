"use strict";
require('shelljs/global');
var fs = require('fs')
  , gm = require('gm');

let samples =  ls('samples/*.tiff');

var counter = 0;
let maxRow = 10;
let maxCol = 8;
let maxCount = maxRow*maxCol;
var counted = [];

for(var row=1; row<=maxRow; row++){
  for(var col=1; col<=maxCol; col++){
    let thisBlockOutPath = `blocks/${row}-${col}.tiff`;
    for (var i in samples) {
      let sample = samples[i];
      //console.log(sample);
      gm.compare(sample, thisBlockOutPath, 0.03, function alala(err, isEqual) {
        if(isEqual){
          if(thisBlockOutPath in counted){
            console.log(`${thisBlockOutPath} duplcated`);
          }else{
            counted[thisBlockOutPath] = true;
          }
          counter++;
          console.log(`${counter}/${maxCount}`);
        }
      });
    }
  }
}
