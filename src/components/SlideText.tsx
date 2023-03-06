

import classNames from 'classnames'
import styled from 'styled-components'

import { animateScroll as scroll,} from 'react-scroll'
import { useEffect, useRef, useState } from 'react'

import { v4 as uuidV4 } from 'uuid'
type SlideTextProps = {
    text:string,
}
const sleep = async (ms?: number) => new Promise(resolve => setTimeout(resolve, ms));

function SlideText({text}:SlideTextProps){
    const [slideID, setslideID] = useState("")

    const ref = useRef<HTMLDivElement|null>(null)
    const timerRef = useRef<NodeJS.Timer>()

    const countref = useRef<number>(3)
    
    const slideSpeed = 23

    const doAnimaion = ()=>{
        if(!ref.current)
            return
        
        if(countref.current > 0){
            countref.current = countref.current - 1
            return
        }

        const bouncingWidth = ref.current.clientWidth
        const scrollWidth = ref.current.scrollWidth

        const slidingWidth  = (scrollWidth - bouncingWidth)
        const duration = slidingWidth * slideSpeed

        if(slidingWidth == 0 && timerRef.current){
            clearInterval(timerRef.current)
            return
        }

        if(ref.current.scrollLeft != 0){
            scroll.scrollTo(0,{containerId:slideID,duration:0,horizontal:true,ignoreCancelEvents:true})
            countref.current = 5
        }else{
            scroll.scrollMore(slidingWidth,{containerId:slideID,duration:duration,horizontal:true,smooth:false,ignoreCancelEvents:true})
            countref.current = (duration / 500) + 5
        }
        return duration
    }

    useEffect(()=>{

        let uuid = "slideID-"+uuidV4()

        setslideID(uuid)

        return ()=>{
            if(timerRef.current)
                clearInterval(timerRef.current)
        }

    },[])

    useEffect(() => {
        
        timerRef.current = setInterval(doAnimaion,500)
        
        return ()=>{
            if(timerRef.current)
                clearInterval(timerRef.current)
        }
    }, [slideID])
    
    return <Slide ref={ref} className={classNames('slide-left')} id={slideID}>
        {text}
    </Slide>
}
const Slide = styled.div`
    width: 100%;
    overflow-y: hidden;
    overflow-x: hidden;
    white-space: nowrap;
`
export default SlideText