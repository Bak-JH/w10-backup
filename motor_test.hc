Example motor1
Wait 5000
GPIOEnable propeller1 true
PWMEnable propeller true
PWMSetPeriod propeller 50
PWMLinearAccel propeller 0.70 0.80 12000
Wait 3000
PWMLinearAccel propeller 0.80 0.80 12000
GPIOEnable propeller1 false
PWMEnable propeller false
Wait 5000