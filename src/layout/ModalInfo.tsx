import React from 'react'
import styled from 'styled-components';
import SlideText from '../components/SlideText';

interface ModalInfoMainAreaProp{
    children: React.ReactNode;

}

interface ModalInfoTitleProp{
    text:string
}

interface ModalInfoValueProp{
    text:string
}

function ModalInfoMainArea({children} : ModalInfoMainAreaProp){
    return (
        <InfoArea >
            {children}
        </InfoArea>
    );
}

function ModalInfoTitle({text} : ModalInfoTitleProp){
    return (
        <TitleText> {text} </TitleText>
    );
}

function ModalInfoValue({text} : ModalInfoValueProp){
    return (
        <ValueText>
            <SlideText text={text}/>
        </ValueText>
    );
}

function ModalNotice({text} : ModalInfoTitleProp){
    return (
        <NoticeText> {text} </NoticeText>
    );
}

const InfoArea = styled.div`
    width                 : 100%;
    display               : grid;
    grid-template-columns : 1fr 1fr;
    justify-items         : right;
    row-gap               : 8px;
    column-gap            : 26px;
`
const TitleText = styled.div`
    max-width        : 150px;
    font-size        : 23px;
    color            : #474747;
    background-color : #000000;
    justify-self     : right;
`
const ValueText = styled.div`
    max-width    : 180px;
    font-size    : 23px;
    color        : #000000;
    justify-self : left;
`
const NoticeText = styled.div`
    font-size : 18px;
`
export {ModalInfoMainArea, ModalInfoTitle, ModalInfoValue, ModalNotice};

