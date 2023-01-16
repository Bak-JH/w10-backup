
import { BrowserWindow, ipcMain, IpcMainEvent } from "electron"
import { ProductCH, WorkerCH } from './ipc/cmdChannels'
import { productIpcInit } from "./ipc/product"
const Gpio = require('onoff').Gpio;
const test = new Gpio(6, 'out');

import { PrintWorker, WorkingState } from "./printWorker"

let worker = new PrintWorker()
async function mainProsessing(mainWindow:BrowserWindow){
    ipcMain.on(WorkerCH.startRM,(event:IpcMainEvent,path:string,material:string)=>{
        try {
            let nameArr = path.split('/')
            let name = nameArr[nameArr.length - 1]
            worker.print()

        } catch (error) {
            
            mainWindow.webContents.send(WorkerCH.onStartErrorMR,(error as Error).message)
            console.log((error as Error).message)
        }
    })
    worker.onProgressCB((progress:number)=>{
        mainWindow.webContents.send(WorkerCH.onProgressMR,progress)
    })
    worker.onStateChangeCB((state:WorkingState,message?:string)=>{
        mainWindow.webContents.send(WorkerCH.onWorkingStateChangedMR,state,message)
    })
    worker.onSetTotalTimeCB((value:number)=>{
        mainWindow.webContents.send(WorkerCH.onSetTotalTimeMR,value)
    })
    ipcMain.on(WorkerCH.commandRM,(event:IpcMainEvent,cmd:string)=>{
        switch (cmd) {
            case "pause":
                worker.pause()
                break;
            case "quit":
                worker.stop()
                break;
            case "resume":
                worker.resume()
                break;
            case "printAgain":
                worker.printAgain()
                break;
            default:
                break;
        }
    })
    ipcMain.on(WorkerCH.requestPrintInfoRM,(event:IpcMainEvent)=>{
        mainWindow.webContents.send(WorkerCH.onPrintInfoMR,...worker.getPrintInfo())
    })
    productIpcInit(mainWindow)
}
export {mainProsessing}