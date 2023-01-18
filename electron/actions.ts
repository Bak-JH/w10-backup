enum GPIOPin {
    pump1         = 6,
    pump2         = 16,
    valve         = 21,
    propeller1    = 19,
    propeller2    = 20 // not in use
}

enum PWMPin {
    pump          = 12,
    propeller     = 13
}
abstract class Action{
}

class GPIOAction extends Action {
    //variable
    private readonly _pin!:GPIOPin 

    //getter
    get pin() : GPIOPin { return this._pin; }

    //method
    constructor(pin:GPIOPin) { super(); this._pin = pin;  }
}
class PWMAction extends Action{
    //variable
    private readonly _pin!:PWMPin

    //getter
    get pin () : PWMPin { return this._pin; }

    //method
    constructor(pin:PWMPin) { super(); this._pin = pin;  }
}

class GPIOEnable extends GPIOAction {
    //variable
    private readonly _enable!:boolean

    //getter
    get enable() : boolean { return this._enable; }

    //method
    constructor(pin:GPIOPin, enable:boolean) { super(pin); this._enable = enable; }
}

class PWMEnable extends PWMAction {
    //variable
    private readonly _enable!:boolean

    //getter
    get enable() : boolean { return this._enable; }

    //method
    constructor(pin:PWMPin, enable:boolean) { super(pin); this._enable = enable; }
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
}

class PWMLinearAccel extends PWMAction {
    //variable
    private readonly _minSpd!:number
    private readonly _maxSpd!:number
    private readonly _duration!:number;

    //method
    constructor(pin:PWMPin, minSpd:number, maxSpd:number, duration:number) {
        super(pin);
    }

    stepTransform():Array<Action>
    {
        const stepCnt = (_durationNS /_timeStepNS).ceil();
        double spdInc = (_endSpeed - _beginSpeed)/ stepCnt;
        List<IOAction> actions = [];

        for(var i = 0; i < stepCnt - 1; ++i)
        {
        actions.add(PWMSetDuty(_pin, _beginSpeed + spdInc*i));
        actions.add(Wait(Duration(microseconds: _timeStepMS)));
        }
        //we add last step by hand to ensure float error as following:
        //1. total duration must equal to actual duration
        //2. final speed must be exact equal to given end speed
        actions.add(PWMSetDuty(_pin, _endSpeed));
        if(_durationNS < _timeStepNS)
        actions.add(Wait(Duration(microseconds: _durationNS)));
        else
        actions.add(Wait(Duration(microseconds: (_durationNS - _timeStepNS* (stepCnt - 1)))));
        return actions;
    }
    PWMLinearAccel(PWMPin pin, double beginSpeed, double endSpeed, int durationNS):
    _beginSpeed = beginSpeed,_endSpeed = endSpeed,_durationNS = durationNS, super(pin);
    PWMLinearAccel.fromMS(PWMPin pin, double beginSpeed, double endSpeed, int durationMS):
    _beginSpeed = beginSpeed,_endSpeed = endSpeed,_durationNS = durationMS * 1000000, super(pin);
}