"use strict";
require('shelljs/global');
var fs = require('fs')
  , gm = require('gm')
  ,prompt = require('prompt')
  ,colors = require('colors');
require('tty').setRawMode(true);


class DropBot{
  configEnv(){
    this.currentDir = pwd();
    this.libPath = `${this.currentDir}/lib`;
    this.setLibCmd = `export DYLD_LIBRARY_PATH=${this.libPath}:$DYLD_LIBRARY_PATH`;
  }
  loadSampleNames(){
    this.samples =  ls('samples/*.tiff');
  }
  _getImageInName(){
    var ss = exec(`${this.setLibCmd};./lib/idevicescreenshot`).output.trim().split(' ').pop();
    return ss;
  }
  getImage(){
    this.name = this._getImageInName();
    this.gmImage = gm(this.name);
    this.counted = [];
    this.catagories = [];
  }
  compare(imagePath,cb){
    let sa = dropBot.samples;
    for (let sample of sa) {
      //console.log(imagePath);
      gm.compare(imagePath, sample, 0.035, function alala(err, isEqual) {
        if(isEqual){
          if(imagePath in dropBot.counted){
            console.log(`${imagePath} duplicated`);
          }else{
            dropBot.catagories[sample] = sample in dropBot.catagories? dropBot.catagories[sample]+1: 0;
            dropBot.counted[imagePath] = true;
          }
          cb(sample);
        }
      });
    }
  }
  resize(){
    //.resize(14*2,8*2)
    let image = this.gmImage;
    let output = this.output;
    let compare = this.compare;
    var cbT = 0;
    image.size(function (err, size) {
      if (!err){
        let blockWidth = size.width/8;
        let margin = blockWidth/6;
        let height = blockWidth*10;
        let cropImg = image.crop(size.width, height, 0, size.height-height);
        let cropImgName = 'blocks.tiff';
        output(cropImg,cropImgName,function(){
          dropBot.remove();
          for(var row=1; row<=10; row++){
            for(var col=1; col<=8; col++){
              let thisBlock = gm(cropImgName).crop(blockWidth-2*margin,blockWidth-2*margin,(col-1)*blockWidth+margin,(row-1)*blockWidth+margin).resize(1,1);
              let thisBlockOutPath = `blocks/${row}-${col}.tiff`;
              output(thisBlock,thisBlockOutPath,function outputcb(){
                compare(thisBlockOutPath,function comparecb(sample){
                  cbT++;
                  if(cbT == 80){
                    dropBot.print();
                  }
                });
              });
            }
          }
        });
      }else{
        console.log(err);
      }

    });
  }
  print(){
    var max = 0;
    let catas = this.catagories;

    for (let i in catas) {
      let cata = catas[i];
      max = cata > max? cata : max;
      console.log(`\t${i.replace('samples/','').replace('.tiff','')}:`);
      console.log(`\t\t${cata}`);
    }
    //console.log(catas);
    let minScore = max*(max-1)*4
    if(minScore> this.iwant){
      console.log(`YES, ${max} blocks of ${minScore} `.underline.green);
    }else{
      console.log(`NO, but ${max} blocks of ${minScore} `.underline.red);
      //
      console.log("Press any key to continue!");


      this.appendOnce();
    }
    this.unlock();
  }
  get isLocked(){
    return this._lock;
  }
  lock(){
    this._lock = true;
  }
  unlock(){
    this._lock = false;
  }
  appendOnce(){
    if(!("ttySet" in this)){
      var stdin = process.stdin;
      stdin.setRawMode( true );
      stdin.resume();
      stdin.setEncoding( 'utf8' );
      stdin.on('data', function ( key) {
        if ( key === '\u0003') {
          process.exit();
        }else{
          if(!dropBot.isLocked){
            dropBot.lock();
            dropBot.main();
          }
        }
      });
      this.ttySet = 1;
    }
  }
  output(gm,name,cb){
    gm.noProfile().write(name,function(err){if(err){console.log(err);}else{if(cb!=null){cb()}}})
  }
  remove(){
    rm(this.name);
  }
  prompt(){
    prompt.start();
    prompt.get(['TagetPoint'], function (err, result) {
      dropBot.iwant = Number(result.TagetPoint);
      dropBot.main();
    });
  }
  main(){
    this.configEnv();
    this.getImage();
    this.loadSampleNames();
    this.resize();
  }
}
var dropBot = new DropBot();
dropBot.prompt();
