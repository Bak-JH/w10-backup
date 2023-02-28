// for logging
var fs = require('fs');
var util = require('util');
var logfileName = '/opt/capsuleFW/bin/electron.log';
var logfile = fs.createWriteStream(logfileName, {flags : 'a+'});
var log_stdout = process.stdout;
 
export function log(d:any):void {
    logfile.write('[' + getCurDt() + '] ' + util.format(d) + '\n');
    log_stdout.write('[' + getCurDt() + '] ' + util.format(d) + '\n');
};
 
function getCurDt() {
    let dt = new Date();
 
    let yy:any = dt.getFullYear();
    let mm:any = dt.getMonth() + 1; // january : 0
    let dd:any = dt.getDate();
    let hh:any = dt.getHours();
    let mi:any = dt.getMinutes();
    let ss:any = dt.getSeconds();
 
    mm = (mm < 10 ? '0' : '') + mm;
    dd = (dd < 10 ? '0' : '') + dd;
    hh = (hh < 10 ? '0' : '') + hh;
    mi = (mi < 10 ? '0' : '') + mi;
    ss = (ss < 10 ? '0' : '') + ss;
 
    let ymd = yy + '-' + mm + '-' + dd + ' ' + hh + ':' + mi + ':' + ss;
    //console.log("ymd = " + ymd);
    return ymd;
}