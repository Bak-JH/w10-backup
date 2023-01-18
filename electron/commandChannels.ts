//(target:command),(parameter:type),(parameter:type),...,(RT:return type) 
//if return type is void, it can be empty

//*RM - Renderer to Main
//*MR - Main to Renderer
//*TW - Renderer to Main Two Way

enum workerCH{  
    waitRM           = "worker:wait,           waitTime:number",
    GPIOEnableRM     = "worker:GPIOEnable,     pin:number, enable:boolean", 
    PWMEnableRM      = "worker:PWMEnable,      pin:number, enable:boolean",
    PWMSetPeriodRM   = "worker:PWMSetPeriod,   pin:number, period:number",
    PWMSetDutyRM     = "worker:PWMSetDuty,     pin:number, duty:number",
    PWMLinearAccelRM = "worker:PWMLinearAccel, minSpd:number, maxSpd:number, accelTime:number",
}