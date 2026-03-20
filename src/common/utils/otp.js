export const ctrateNumberOtp = async()=>{
    return Math.floor(Math.random() * (999999 - 100000) + 100000)
}