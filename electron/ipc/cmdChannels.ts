//(target:command),(parameter:type),(parameter:type),...,(RT:return type) 
//if return type is void, it can be empty

//*RM - Renderer to Main
//*MR - Main to Renderer
//*TW - Renderer to Main Two Way

enum WorkerCH {  
    startRM          = "worker:start",
    commandRM          = "worker:command, cmd:string",
    shutdownRM          = "worker:shutdown",
    factoryResetRM          = "worker:factoryReset",

    onProgressMR = "product:onProgress, callback:(event:IpcRendererEvent,progress: number) => void",
    onSetTotalTimeMR = "product:onSetTotalTime, callback:(event:IpcRendererEvent,value:number)=>void",
}

enum ProductCH {
    onShutDownEventMR = "product:onShutDownEvent, callback:(event:IpcRendererEvent) => void",
}

export {WorkerCH, ProductCH}