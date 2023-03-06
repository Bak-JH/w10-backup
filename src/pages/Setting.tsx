import { useState } from 'react'
import Button from '../components/Button';
import ImageButton from '../components/ImageButton';
import settingImg from '../assets/play.png';
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom';
import SetValue from '../components/SetValue';

function Setting(){
    const navigate = useNavigate();
    const [totalTime, setTotalTime] = useState<number>(600);
    
    return (
    <HomeArea>
        <PageContainer style={{'rowGap': '30px', 'width': 255}}>
            <SetValue
                        title='Wash Time'
                        display='time'
                        value={totalTime}
                        minValue={300}
                        maxValue={1800}
                        sumValue={30}
                        onValueChange={(v : number) => {
                            setTotalTime(v)
                        }}
                        />
        </PageContainer>

        <PageContainer>
            <ImageButton type="startBtn" src={settingImg} color="blue" onClick={() => {
                window.electronAPI.setTimeRM(totalTime);
                window.electronAPI.washStartRM(false); 
                navigate('/progress'); 
            }}>Start</ImageButton>

            <Button type="cancelBtn" color="gray" onClick={() => {navigate('/home')}}>Cancel</Button>        
        </PageContainer>
    </HomeArea>);
}
const HomeArea = styled.div`
    width           : 480px;
    height          : 320px;
    display         : flex;
    justify-content : center;
    align-items     : center;
    column-gap      : 15px;
`
const PageContainer = styled.div`
    display            : grid;
    grid-template-rows : auto;
    row-gap            : 10px;
    justify-content    : center;
    align-items        : center;
`

export default Setting;

