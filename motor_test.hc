Example motor1
Wait 500000
GPIOEnable propeller1 true
PWMEnable propeller true
PWMSetPeriod propeller 50
PWMLinearAccel propeller 0.70 0.80 1200000
Wait 30000000
PWMLinearAccel propeller 0.80 0.80 1200000
GPIOEnable propeller1 false
PWMEnable propeller false
Wait 5000000