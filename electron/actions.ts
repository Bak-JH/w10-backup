const Gpio = require('pigpio').Gpio
import { Worker } from 'worker_threads';
import { log } from './logging'
import { Stopwatch } from 'ts-stopwatch';
import { AbortablePromise } from 'simple-abortable-promise';
import { PWMWorkerMethod } from './worker/pwmWorker';

//enum
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

//const
const ActivePins = new Array<{pin: GPIOPin | PWMPin, duty?:number}>();
const PWMWorker = new Worker(__dirname + '/worker/pwmWorker.js');
const PinMap = new Map<GPIOPin|PWMPin, typeof Gpio>([
    [GPIOPin.pump1,      new Gpio(GPIOPin.pump1,      {mode:Gpio.OUTPUT})],
    [GPIOPin.pump2,      new Gpio(GPIOPin.pump2,      {mode:Gpio.OUTPUT})],
    [GPIOPin.valve,      new Gpio(GPIOPin.valve,      {mode:Gpio.OUTPUT})],
    [GPIOPin.propeller1, new Gpio(GPIOPin.propeller1, {mode:Gpio.OUTPUT})],
    
    [PWMPin.pump,        new Gpio(PWMPin.pump,        {mode:Gpio.OUTPUT})],
    [PWMPin.propeller,   new Gpio(PWMPin.propeller,   {mode:Gpio.OUTPUT})]
])

//function
export function initializePWM() : void {
    PinMap.get(PWMPin.pump).pwmRange(100);
    PinMap.get(PWMPin.propeller).pwmRange(100);
}

function disableAllPins() {
    ActivePins.forEach((obj) => {
         PinMap.get(obj.pin).digitalWrite(0);
    });
}

function enableDisabledPins() {
    ActivePins.forEach((obj) => {
        PinMap.get(obj.pin).digitalWrite(obj.duty ? obj.duty : 1);
    });
}

//class
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

    //getter
    get pin() : GPIOPin { return this._pin; }

    //method
    constructor(pin:GPIOPin) { 
        super(); 
        this._pin = pin; 
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
            log("GPIOAction: GPIOEnable(" + this.pin + "," + this._enable + ")");
            PinMap.get(this.pin).digitalWrite(this.enable);

            if(this.enable) ActivePins.push({pin: this.pin});
            else ActivePins.filter(obj => obj.pin !== this.pin);
            resolve("done");
        });

        return this._promise;
    }
}

class PWMEnable extends PWMAction {
    //variable
    private readonly _enable!:boolean
    private readonly _frequency:number = 0;
    private readonly _duty:number = 0;

    //getter
    get enable() : boolean { return this._enable; }
    get duty() : number { return this._duty; }

    //method
    constructor(pin:PWMPin, enable:boolean, frequency?:number, duty?:number) { 
        super(pin); 
        this._enable = enable;
        if(frequency) PinMap.get(pin).pwmFrequency(frequency)
        if(duty) this._duty = duty
    }

    public async run() {
        this._promise = new AbortablePromise((resolve) => {
            log("PWMAction: PWMEnable " + this.enable + ", " + this.duty);
            if(this.enable) {
                PinMap.get(this.pin).pwmWrite(this.duty);
                ActivePins.push({pin: this.pin, duty: this.duty});
            }
            else {
                PinMap.get(this.pin).digitalWrite(0);
                ActivePins.filter(obj => obj.pin !== this.pin);
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
            log("PWMAction: PWMSetPeriod");

            PWMWorker.postMessage([PWMWorkerMethod.SetPeriod, this.period]);
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
            log("PWMAction: PWMDuty");
                
            PWMWorker.postMessage([PWMWorkerMethod.SetDuty, this.duty]);
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

    //getter
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
        log("PWMAction: PWMLinearAccel");

        this._stopWatch.reset();
        PWMWorker.postMessage([PWMWorkerMethod.LinearAccel, this.startSpeed, this.targetSpeed, this.duration]);
        
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
        log("Stopped: PWMLinearAccel");
        this._stopWatch.stop();

        PWMWorker.postMessage([PWMWorkerMethod.Stop]);
        await new Promise ((resolve) => {
            PWMWorker.once('message', (message) => {
                log(message);
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
        log("Action: Wait - " + this.duration);
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
        log("RE: wait " + (this._duration - this._stopWatch.getTime()));
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
