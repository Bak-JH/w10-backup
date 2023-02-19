import { BinaryValue, Gpio} from 'onoff';
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

const ActivePins:Array<GPIOPin | PWMPin> = [];
const PWMWorker = new Map<PWMPin, Worker>();

function disableAllPins() {
    for(const pin of ActivePins)
    {
        const gpio = new Gpio(pin, "out");
        gpio.writeSync(0);
    }
}
  
function toBinaryValue(boolValue:boolean):BinaryValue {
    return boolValue ? 1 : 0;
}

abstract class Action {
    //variable
    protected _promise!:AbortablePromise<unknown>;

    //method
    public abstract run():Promise<unknown>;
    public stop():void {
        disableAllPins();
        try {
            this._promise.abort();
        } catch(err) {
            console.log(err);
        }
    }
    public pause():void {
        this.stop();
    }
    public resume():Promise<unknown> {
        return this.run();
    }
}

abstract class GPIOAction extends Action {
    //variable
    private readonly _pin!:GPIOPin 
    protected _pinObj!:Gpio;

    //getter
    get pin() : GPIOPin { return this._pin; }
    get pinObj() : Gpio { return this._pinObj; }

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
    // public _stopPromise = new Promise ((resolve) => {
    //     PWMWorker.get(this._pin)?.on('message', (message) => {
    //         console.log(message);
    //         resolve("done");
    //     });
    // });

    //getter
    get pin () : PWMPin { return this._pin; }

    //method
    constructor(pin:PWMPin) {
        super(); 
        this._pin = pin; 
    }

    public async run() {
        this._promise = new AbortablePromise((resolve) => {
            if (!PWMWorker.get(this.pin)) {
                console.log("new PWMWorker - " + this.pin);
                PWMWorker.set(this.pin, new Worker(__dirname + '/worker/pwmWorker.js'));
            }
            resolve("done");
        });

        return this._promise;
    }

    public stop() {
        PWMWorker.get(this.pin)?.postMessage(["stop"]);
        PWMWorker.get(this.pin)?.on('message', (message) => {
            console.log(message);
        });
        super.stop();
    }

    public resume() {
        this._promise = new AbortablePromise ((resolve) => {
            PWMWorker.get(this.pin)?.postMessage(["pause"]);
            resolve("done");
        });

        return this._promise;
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
            this.pinObj.writeSync(toBinaryValue(this._enable));
            ActivePins.push(this.pin);
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
        await super.run();

        this._promise = new AbortablePromise((resolve) => {
            console.log("PWMAction: PWMEnable " + this.enable);

            if(this.enable) PWMWorker.get(this.pin)?.postMessage(["setPin", this.pin]);
            else  PWMWorker.get(this.pin)?.postMessage(["stop"]);

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

    public async run() {
        await super.run();

        this._promise = new AbortablePromise((resolve) => {
            console.log("PWMAction: PWMSetPeriod");

            PWMWorker.get(this.pin)?.postMessage(["setPeriod", this.period]);
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
    public async run() {
        await super.run();
        
        this._promise = new AbortablePromise ((resolve) => {
            console.log("PWMAction: PWMDuty");
                
            PWMWorker.get(this.pin)?.postMessage(["setDuty", this.duty]);
            PWMWorker.get(this.pin)?.on('message', (message) => {
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
    private _duration!:number;
    private _resumeDuration?:number;
    private readonly _stopWatch = new Stopwatch();

    private readonly wait = (timeToDelay:number) => new AbortablePromise((resolve) => setTimeout(resolve, timeToDelay));
    private readonly workerPromise = new Promise ((resolve) => {
        PWMWorker.get(this.pin)?.on('message', () => {
            this._stopWatch.start();
            resolve("done");
        });
    });

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

    public async run() {
        await super.run();
        console.log("PWMAction: PWMLinearAccel");

        this._stopWatch.reset();
        PWMWorker.get(this.pin)?.postMessage(["linearAccel", this.startSpeed, this.targetSpeed, this.duration]);
        await this.workerPromise;
        this._promise = this.wait(this.duration);
        

        return this._promise;
    }
    
    public async stop() {
        console.log("Stopped: PWMLinearAccel");
        this._stopWatch.stop();
        
        await super.stop();
    }

    public resume() {
        return new AbortablePromise((resolve) => {
            PWMWorker.get(this.pin)?.postMessage(["resume", this.targetSpeed, this.duration - this._stopWatch.getTime()])
        });
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
        this._promise = this.wait(this.duration - this._stopWatch.getTime());
        this._stopWatch.start();
        return this._promise;
    }

    public stop() {
        this._stopWatch.stop();
        super.stop();
    }
}

export {Action} // abstract class
export {GPIOPin, PWMPin} // enum
export {Wait, GPIOEnable, PWMEnable, PWMLinearAccel, PWMSetDuty, PWMSetPeriod} // actions
export {ActivePins} // const
