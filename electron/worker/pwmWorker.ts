import {parentPort} from 'worker_threads';
import { wait } from '../actions';
import { Gpio } from 'onoff';

enum WorkerMethod{
    SetPin = "setPin",
    SetPeriod = "setPeriod",
    SetDuty = "setDuty",
    LinearAccel = "linearAccel"
}

const ON = 1;
const OFF = 0;

let breakLoop = false;

let period:number = 0;
let duty:number = 0;

let pin:number;
let gpioObj:Gpio;

if(parentPort){
    parentPort.on("message",(value)=>{
        console.log("Worker: receive - ",value);

        switch(value[0])
        {
            case WorkerMethod.SetPin:
                pin = value[1];
                gpioObj = new Gpio(pin, 'out');
                break;
            case WorkerMethod.SetPeriod:
                period = value[1];
                breakLoop = true;
                break;
            case WorkerMethod.SetDuty:
                duty = value[1];
                breakLoop = true;
                break;
            case WorkerMethod.LinearAccel:
                parentPort?.postMessage('starts accel');
                breakLoop = true;
                accelLoop(value[1], value[2], value[3]);
                break;
        }

        console.log("pin: " + pin + " period: " + period + " duty: " + duty);

        if(value[0] != WorkerMethod.LinearAccel && period > 0 && duty > 0 && duty < 1 )//&& gpioObj)
        {
            parentPort?.postMessage('starts loop');
            breakLoop = false;
            loop();
        }
    })
}

async function loop() {
    console.log("pin " + pin + " start loop");
    
    while(!breakLoop)
    {
        await wait(period * Math.abs(1 - duty));
        // console.log("1")
        gpioObj.writeSync(ON);
        await wait(period * duty);
        // console.log("0")
        gpioObj.writeSync(OFF);
    }
}

async function accelLoop(startDuty:number, targetDuty:number, totalTime:number) {
    console.log("pin " + pin + " start accel loop");
 
    const timeStep = 1000;
    const stepCnt = Math.ceil(totalTime / timeStep);
    const spdInc = (targetDuty - startDuty)/ stepCnt;
    duty = startDuty;
    

    for(let step = 0; step < stepCnt; ++step)
    {
        for (let loopCount = 0; loopCount < timeStep / period; ++loopCount) {
            await wait(period * Math.abs(1 - duty));
            // console.log("1")
            gpioObj.writeSync(ON);
            await wait(period * duty);
            // console.log("0")
            gpioObj.writeSync(OFF);
        }

        if (duty < targetDuty){
            duty += spdInc;
            console.log("accel: " + duty);
        }
    }

    breakLoop = false;
    loop();
}

export {WorkerMethod}
