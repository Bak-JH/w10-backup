import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { WorkerCH, ProductCH } from './ipc/cmdChannels';
let _id = 0

interface EventListener{
    channel:string;
    id:string;
}
interface EventListenerArr{
    [key:string] : (...args : any[]) => void
}
let eventListnerArr : EventListenerArr = {}

function eventADD(channel : string,listner:(...args : any[]) => void) : EventListener{

    _id++
    eventListnerArr[_id.toString()] = listner
    ipcRenderer.on(channel,eventListnerArr[_id.toString()])

    // console.log("IPC EVENT ADD",channel,ipcRenderer.listenerCount(channel),Object.keys(eventListnerArr).length)

    return {channel:channel,id:_id.toString()}
}
function eventRemove(listener:EventListener){
    ipcRenderer.removeListener(listener.channel,eventListnerArr[listener.id])

    delete eventListnerArr[listener.id]

    // console.log("IPC EVENT REMOVE",listener.channel,"Listener Count : ",ipcRenderer.listenerCount(listener.channel),"Total Key Length : ",Object.keys(eventListnerArr).length)
}

interface electronApiInterface {
    washStartRM: (quick?:boolean) => void;
    washCommandRM: (cmd :string) => void;

    shutdownRM: () => void;
    factoryRestRM:()=>void;

    onWorkingStateChangedMR: (callback:(event:IpcRendererEvent,state: string,message?:string) => void) => EventListener;
    onShutDownEventMR: (callback:(event:IpcRendererEvent) => void) => EventListener;
    onSetTotalTimeMR: (callback:(event:IpcRendererEvent,totalTime:number)=>void) => EventListener;

    removeListener : (listener:EventListener) => void;
    removeAllListner : (channel:string) => void;
}

const exposedApi: electronApiInterface = {
    washStartRM: (quick?:boolean) => ipcRenderer.send(WorkerCH.startRM, quick),
    washCommandRM: (cmd :string) => ipcRenderer.send(WorkerCH.commandRM,cmd),
    shutdownRM: () => ipcRenderer.send(WorkerCH.shutdownRM),
    factoryRestRM:() => ipcRenderer.send(WorkerCH.factoryResetRM),

    onWorkingStateChangedMR: (callback:(event: IpcRendererEvent,state: string,message?:string) => void) => {return eventADD(WorkerCH.onWorkingStateChangedMR,callback)},
    onShutDownEventMR: (callback:(event:IpcRendererEvent) => void) => {return eventADD(ProductCH.onShutDownEventMR,callback)},
    onSetTotalTimeMR: (callback:(event:IpcRendererEvent,totalTime:number)=>void) =>{return eventADD(WorkerCH.onSetTotalTimeMR,callback)},

    removeListener : (listener:EventListener) => eventRemove(listener),
    removeAllListner : (channel:string) => ipcRenderer.removeAllListeners(channel),
}
contextBridge.exposeInMainWorld('electronAPI', exposedApi)

export type {electronApiInterface}