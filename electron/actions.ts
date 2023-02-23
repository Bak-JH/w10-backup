const Gpio = require('onoff').Gpio
import { Worker } from 'worker_threads';
import { log } from './logging'
import { Stopwatch } from 'ts-stopwatch';
import { AbortablePromise } from 'simple-abortable-promise';
import { resolve } from 'path';

enum GPIOPin {
    pump1         = 6,
    pump2         = 16,
    propeller1    = 19,
    propeller2    = 20, // not in use
    valve         = 21
}

enum PWMPin {
    pump          = 12,
    propeller     = 13
}

const ActivePins = new Map<GPIOPin | PWMPin, typeof Gpio | null>();
const PWMWorker = new Worker(__dirname + '/worker/pwmWorker.js');


function disableAllPins() {
    return new Promise((resolve) => {
        ActivePins.forEach((obj, pin) => {
            if(pin == PWMPin.pump || pin == PWMPin.propeller)
            {
                PWMWorker?.postMessage(["stop"]);
                PWMWorker.once('message', (message)=>{
                    resolve(message);
                })
            }
            obj?.writeSync(0);
        });
    });
}

function enableDisabledPins() {
    ActivePins.forEach((obj, pin) => {
        if(pin == PWMPin.pump || pin == PWMPin.propeller)
            PWMWorker?.postMessage(["resume"]);

        obj?.writeSync(0);
    });
}
  
function toBinaryValue(boolValue:boolean):0 | 1 {
    return boolValue ? 1 : 0;
}

abstract class Action {
    //variable
    protected _promise!:AbortablePromise<unknown>;

    //method
    public abstract run():Promise<unknown>;

    public stop():void {
        disableAllPins();
        this._promise.abort();
    }

    public pause():void {
        this.stop();
    }

    public resume():Promise<unknown> {
        enableDisabledPins();
        return this.run();
    }
}

abstract class GPIOAction extends Action {
    //variable
    private readonly _pin!:GPIOPin 
    protected _pinObj!:typeof Gpio;

    //getter
    get pin() : GPIOPin { return this._pin; }
    get pinObj() : typeof Gpio { return this._pinObj; }

    //method
    constructor(pin:GPIOPin) { 
        super(); 
        this._pin = pin; 
        this._pinObj = new Gpio(pin, "out");
    }
}
abstract class PWMAction extends Action {
    //variable
    private readonly _pin!:PWMPin;

    //getter
    get pin () : PWMPin { return this._pin; }

    //method
    constructor(pin:PWMPin) {
        super(); 
        this._pin = pin; 
    }
}

class GPIOEnable extends GPIOAction {
    //variable
    private readonly _enable!:boolean

    //getter
    get enable() : boolean { return this._enable; }

    //method
    constructor(pin:GPIOPin, enable:boolean) { 
        super(pin); 
        this._enable = enable; 
    }
    public run() {
        this._promise = new AbortablePromise((resolve) => {
            this.pinObj.writeSync(toBinaryValue(this.enable));
            if(this.enable)
                ActivePins.set(this.pin, this._pinObj);
            else
                ActivePins.delete(this.pin);
            console.log("GPIOAction: GPIOEnable(" + this.pin + "," + toBinaryValue(this._enable) + ")");
            resolve("done");
        });

        return this._promise;
    }
}

class PWMEnable extends PWMAction {
    //variable
    private readonly _enable!:boolean

    //getter
    get enable() : boolean { return this._enable; }

    //method
    constructor(pin:PWMPin, enable:boolean) { 
        super(pin); 
        this._enable = enable; 
    }

    public async run() {
        this._promise = new AbortablePromise((resolve) => {
            console.log("PWMAction: PWMEnable " + this.enable);
            
            if(this.enable) {
                ActivePins.set(this.pin, null);
                PWMWorker.postMessage(["setPin", this.pin]);
            } else {
                ActivePins.delete(this.pin);
                PWMWorker.postMessage(["stop"]);
            }

            resolve("done");
        });

        return this._promise;
    }
}

class PWMSetPeriod extends PWMAction {
    //variable
    private readonly _period!:number;

    //getter
    get period() : number { return this._period; }

    //method
    constructor(pin:PWMPin, period:number) {
        super(pin); 
        
        if(period < 0) return; 
        this._period = period; 
    }

    public run() {
        this._promise = new AbortablePromise((resolve) => {
            console.log("PWMAction: PWMSetPeriod");

            PWMWorker.postMessage(["setPeriod", this.period]);
            resolve("done");
        });

        return this._promise;
    }
}

class PWMSetDuty extends PWMAction {
    //variable
    private readonly _duty!:number;

    //getter
    get duty() : number { return this._duty; }

    //method
    constructor(pin:PWMPin, duty:number) { 
        super(pin); 
        if(duty < 0 || duty > 1) return;
        this._duty = duty; 
    }
    public run() {        
        this._promise = new AbortablePromise ((resolve) => {
            console.log("PWMAction: PWMDuty");
                
            PWMWorker.postMessage(["setDuty", this.duty]);
            PWMWorker.once('message', (message) => {
                resolve(message);
            });
        });
        
        return this._promise;
    }
}


class PWMLinearAccel extends PWMAction {
    //variable
    private readonly _startSpeed!:number
    private readonly _targetSpeed!:number
    private readonly _duration!:number;
    private readonly _stopWatch = new Stopwatch();

    private readonly wait = (timeToDelay:number) => new AbortablePromise((resolve) => setTimeout(resolve, timeToDelay));

    get startSpeed() : number { return this._startSpeed; }
    get targetSpeed() : number { return this._targetSpeed; }
    get duration() : number { return this._duration; }

    //method
    constructor(pin:PWMPin, startSpeed:number, targetSpeed:number, duration:number) {
        super(pin);

        this._startSpeed = startSpeed; 
        this._targetSpeed = targetSpeed;
        this._duration = duration;
    }

    public run() {
        console.log("PWMAction: PWMLinearAccel");

        this._stopWatch.reset();
        PWMWorker.postMessage(["linearAccel", this.startSpeed, this.targetSpeed, this.duration]);
        
        this._promise = new AbortablePromise ((resolve) => {
            PWMWorker.once('message', (message) => {
                this._stopWatch.start();
                if (message == "accel done")
                    resolve("done");
            });
        });
        
        return this._promise;
    }
    
    public async stop() {
        console.log("Stopped: PWMLinearAccel");
        this._stopWatch.stop();

        PWMWorker.postMessage(["stop"]);
        await new Promise ((resolve) => {
            PWMWorker.once('message', (message) => {
                console.log(message);
                resolve("done");
            });
        });
        
        super.stop();
    }

    public pause() {
        this._stopWatch.stop();
        super.pause();
    }
}

class Wait extends Action {
    //variable
    private _duration!:number;
    private readonly _stopWatch = new Stopwatch();

    private readonly wait = (timeToDelay:number) => new AbortablePromise((resolve) => setTimeout(resolve, timeToDelay));

    //getter
    get duration() : number { return this._duration; }

    //method
    constructor(duration:number) {
        super();
        this._duration = duration;
    }

    public run() {
        console.log("Action: Wait - " + this.duration);
        this._stopWatch.reset();
        this._promise = this.wait(this.duration);
        this._stopWatch.start();
        return this._promise;
    }

    public stop() {
        this._stopWatch.stop();
        super.stop();
    }

    public pause() {
        this._stopWatch.stop();
        super.pause();
    }

    public async resume() {
        console.log("RE: wait " + (this._duration - this._stopWatch.getTime()));
        await enableDisabledPins();
        this._promise = this.wait(this.duration - this._stopWatch.getTime());
        this._stopWatch.start();
        return this._promise;
    }
}

export {Action} // abstract class
export {GPIOPin, PWMPin} // enum
export {Wait, GPIOEnable, PWMEnable, PWMLinearAccel, PWMSetDuty, PWMSetPeriod} // actions
export {ActivePins} // const
