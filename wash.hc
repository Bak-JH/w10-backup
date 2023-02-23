Wash cycle test
Wait 2000
GPIOEnable pump1 true
PWMEnable pump true
PWMSetPeriod pump 62
PWMSetDuty pump 0.95
Wait 5000				  //50 sec
PWMEnable pump false
PWMEnable propeller true
PWMSetPeriod propeller 50
PWMLinearAccel propeller 0.60 0.80 10000  //12sec
Wait 6000				  //30sec
PWMLinearAccel propeller 0.80 0.60 10000  //12sec
GPIOEnable propeller1 false
PWMEnable propeller false
Wait 5000