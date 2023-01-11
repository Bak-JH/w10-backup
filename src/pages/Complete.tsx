import React, { useEffect, useState } from 'react'
import Button from '../components/Button';

import classNames from 'classnames';

import checkImg from '../assets/check.png'
import errorImg from '../assets/error.png'

import styled from 'styled-components'

import Footer from '../layout/Footer';
import MainArea from '../layout/MainArea';
import Header from '../layout/Header';
import { useNavigate, useParams } from 'react-router-dom';
import { IpcRendererEvent } from 'electron';
import SlideText from '../components/SlideText';
import Modal from '../components/Modal';
import { ModalInfoTitle, ModalInfoValue, ModalNotice } from '../layout/ModalInfo';

function Complete(){
    
    let navigate = useNavigate()

    const [isError, setIsError] = useState<boolean>(false);
    const [errorModalVisible, seterrorModalVisible] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [filename, setFilename] = useState<string>("helll world");
    const [spentTime, setSpentTime] = useState<string>("Calculating");
    const [resin, setResin] = useState<string>("none");

    const { totalElapsedTime,error } = useParams()

    useEffect(()=>{
        const printInfoListener = window.electronAPI.onPrintInfoMR((event:IpcRendererEvent,state:string,material:string,filename:string,layerHeight:number
            ,elaspsedTime:number,totalTime:number,progress:number)=>{
            setFilename(filename)
            setResin(material)
            if(state === "error")
                setIsError(true)
        })
        
        window.electronAPI.requestPrintInfoRM()
        if(totalElapsedTime){
            let a = new Date(Number(totalElapsedTime))
            setSpentTime(a.getMinutes() +"min " + a.getSeconds() + "sec")
        }
        if(error && error.toLocaleLowerCase() != "false"){
            setIsError(true)
            setErrorMessage(error)
            seterrorModalVisible(true)
        }

        return ()=>{
            window.electronAPI.removeListener(printInfoListener)
        }
    },[])

    return (
    <div>
        <FinishArea>
                <FinishImg src={isError ? errorImg : checkImg} width={60}/>
                <FinishText>
                    {
                        isError ? "Wash Error!" : "Wash Compeleted!"
                    }
                </FinishText>
        </FinishArea>
        <Footer>
                <Button color='gray' type='small' onClick={() => {
                    window.electronAPI.printCommandRM("printAgain")
                }}> Wash again </Button>
                <Button color='blue' type='small' onClick={() => {
                    navigate('/') }}> Close </Button> 
        </Footer>
        <Modal visible={errorModalVisible} onBackClicked={() => {seterrorModalVisible(false)}} selectVisible={false}>
            <ModalNotice text={errorMessage}/>
        </Modal>
    </div>);
}
const FinishArea = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;

    flex-direction: column;
    row-gap: 20px;

    width: 479px;
    height: 260px;
`
const FinishImg = styled.img``

const FinishText = styled.div`
    color: black;
    font-size: 27px;
`

export default Complete;

