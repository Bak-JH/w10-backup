Wash cycle test

GPIOEnable valve true
Wait 5000
GPIOEnable pump1 true
GPIOEnable pump2 false
PWMEnable pump true
PWMSetPeriod pump 62
PWMSetDuty pump 0.95
Wait 52000				//35sec
GPIOEnable pump1 false
Wait 1000
PWMEnable propeller true
PWMSetPeriod propeller 50
GPIOEnable propeller1 true
PWMSetDuty propeller 0.6	//5sec
Wait 30000				//300sec
GPIOEnable propeller1 false
PWMEnable propeller false
Wait 5000
GPIOEnable pump2 true
PWMEnable pump true
PWMSetPeriod pump 62
PWMSetDuty pump 0.95
Wait 55000				//38sec
GPIOEnable pump2 false
GPIOEnable valve false
Wait 1000
