import { BinaryValue, Gpio} from 'onoff';

enum GPIOPin {
    pump1         = 6,
    pump2         = 16,
    propeller1    = 19,
    propeller2    = 20, // not in use
    valve         = 21,
    ERROR         = 999
}

enum PWMPin {
    pump          = 12,
    propeller     = 13,
    ERROR         = 999
}

function toBinaryValue(boolValue:boolean):BinaryValue {
    return boolValue ? 1 : 0;
}

abstract class Action {
    //method
    public abstract run():void;
}
 
abstract class GPIOAction extends Action {
    //variable
    private readonly _pin!:GPIOPin 
    protected _gpioObj!:Gpio;

    //getter
    get pin() : GPIOPin { return this._pin; }
    get gpioObj() : Gpio { return this._gpioObj; }

    //method
    constructor(pin:GPIOPin) { 
        super(); 
        this._pin = pin; 
        this._gpioObj = new Gpio(pin, "out");
    }
}
abstract class PWMAction extends Action {
    //variable
    private readonly _pin!:PWMPin
    protected _pwmObj!:Gpio;

    //getter
    get pin () : PWMPin { return this._pin; }
    get pwmObj() : Gpio { return this._pwmObj; }

    //method
    constructor(pin:PWMPin) { 
        super(); 
        this._pin = pin; 
        this._pwmObj = new Gpio(pin, "out");
    }
}

class GPIOEnable extends GPIOAction {
    //variable
    private readonly _enable!:boolean

    //getter
    get enable() : boolean { return this._enable; }

    //method
    constructor(pin:GPIOPin, enable:boolean) { super(pin); this._enable = enable; }
    public run() {
        this._gpioObj.writeSync(toBinaryValue(this._enable));
        console.log("GPIOAction: GPIOEnable");
    }
}

class PWMEnable extends PWMAction {
    //variable
    private readonly _enable!:boolean

    //getter
    get enable() : boolean { return this._enable; }

    //method
    constructor(pin:PWMPin, enable:boolean) { super(pin); this._enable = enable; }
    public run() {
        this._pwmObj.writeSync(toBinaryValue(this._enable));
        console.log("GPIOAction: PWMEnable");
    }
}

class PWMSetPeriod extends PWMAction {
    //variable
    private readonly _period!:number;

    //getter
    get period() : number { return this._period; }

    //method
    constructor(pin:PWMPin, period:number) {
        if(period < 0) return; 
        super(pin); this._period = period; 
    }
    public run() {
        console.log("PWMAction: PWMSetPeriod");
    }
}

class PWMSetDuty extends PWMAction {
    //variable
    private readonly _duty!:number;

    //getter
    get period() : number { return this._duty; }

    //method
    constructor(pin:PWMPin, duty:number) { 
        if(duty < 0 || duty > 1) return;
        super(pin); 
        this._duty = duty; 
    }
    public run() {
        console.log("PWMAction: PWMDuty");
    }
}

class PWMLinearAccel extends PWMAction {
    //variable
    private readonly _minSpeed!:number
    private readonly _maxSpeed!:number
    private readonly _duration!:number;
    private readonly _timeStep = 1000;

    //method
    constructor(pin:PWMPin, minSpeed:number, maxSpeed:number, duration:number) {
        super(pin);

        this._minSpeed = minSpeed;
        this._maxSpeed = maxSpeed;
        this._duration = duration;
    }

    stepTransform():Array<Action>
    {
        const stepCnt = Math.ceil(this._duration / this._timeStep);
        const spdInc = (this._maxSpeed - this._minSpeed)/ stepCnt;
        const actions:Array<Action> = [];

        for(var i = 0; i < stepCnt - 1; ++i)
        {
            actions.push(new PWMSetDuty(this.pin, this._minSpeed + spdInc*i));
            actions.push(new Wait(this._timeStep));
        }
        //we add last step by hand to ensure float error as following:
        //1. total duration must equal to actual duration
        //2. final speed must be exact equal to given end speed
        actions.push(new PWMSetDuty(this.pin, this._maxSpeed));
        if(this._duration < this._timeStep)
        actions.push(new Wait(this._duration));
        else
        actions.push(new Wait(this._duration - this._timeStep * (stepCnt - 1)));
        return actions;
    }

    public run() {
        console.log("PWMAction: PWMLinearAccel");
    }
}

class Wait extends Action {
    //variable
    private readonly _duration!:number;
    private wait = (timeToDelay:number) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

    //getter
    get duration() : number { return this._duration; }

    //method
    constructor(duration:number) {
        super();
        this._duration = duration;
    }

    public async run() {
        console.log("Action: Wait");
        await this.wait(this._duration);
    }
}

export {Action} // abstract class
export {GPIOPin, PWMPin} // enum
export {Wait, GPIOEnable, PWMEnable, PWMLinearAccel, PWMSetDuty, PWMSetPeriod} // actions