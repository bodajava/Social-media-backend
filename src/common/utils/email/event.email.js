import { EventEmitter } from "node:events";


export const emailEvent = new EventEmitter({})


emailEvent.on("sendEmail" , async(fn)=>{
    try {
        await fn()
    } catch (error) {
        console.log(`faild in email event pleass try agean ${error}`);
        
    }
})