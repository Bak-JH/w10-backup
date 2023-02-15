Wash cycle test
GPIOEnable valve false
Wait 5000
GPIOEnable pump1 true
GPIOEnable pump2 false
PWMEnable pump true
PWMSetPeriod pump 62
PWMSetDuty pump 0.95
Wait 35000
GPIOEnable pump1 false
Wait 1000
PWMEnable propeller true
PWMSetPeriod propeller 50
GPIOEnable propeller1 true
PWMLinearAccel propeller 0.70 0.80 120000
Wait 30000
PWMLinearAccel propeller 0.80 0.80 120000
GPIOEnable propeller1 false
PWMEnable propeller false
Wait 5000
GPIOEnable pump2 true
PWMEnable pump true
PWMSetPeriod pump 62
PWMSetDuty pump 0.95
Wait 38000
GPIOEnable pump2 false
Wait 1000
GPIOEnable valve true
Wait 6000
GPIOEnable pump1 true
GPIOEnable pump2 false
PWMEnable pump true
PWMSetPeriod pump 62
PWMSetDuty pump 0.95
Wait 38000
GPIOEnable pump1 false
Wait 1000
PWMEnable propeller true
PWMSetPeriod propeller 50
GPIOEnable propeller1 true
PWMLinearAccel propeller 0.7 0.8 120000
Wait 30000
PWMLinearAccel propeller 0.8 0.8 120000
GPIOEnable propeller1 false
PWMEnable propeller false
Wait 5000
GPIOEnable pump2 true
PWMEnable pump true
PWMSetPeriod pump 62
PWMSetDuty pump 0.95
Wait 38000
GPIOEnable pump2 false
GPIOEnable valve false
Wait 1000
