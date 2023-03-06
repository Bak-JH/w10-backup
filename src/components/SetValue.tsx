import styled from 'styled-components'
import plusBtnImg from '../assets/plus.png';
import minusBtnImg from '../assets/minus.png';

type SetValueProps = {
  title          : string;
  display        : string;
  value          : number;
  maxValue       : number | undefined;
  minValue       : number | undefined;
  sumValue       : number;
  btnEnable      : boolean;

  onValueChange? : (v : number) => void;
}

function SetValue({title, display, value, minValue, maxValue, sumValue, btnEnable, onValueChange} : SetValueProps){
  let displayValue:string;

  if(display == 'time') {
    let minute:string = Math.floor(value/60) < 10? '0'+ Math.floor(value/60) : Math.floor(value/60).toString();
    let second:string = Math.floor(value%60) < 10? '0'+ Math.floor(value%60) : Math.floor(value%60).toString();
    displayValue = minute + ' : ' + second;
  } 
  else {
    displayValue = value.toString();
  }

  return (
      <Container>
        <Title>{title}</Title>
        <Value>
            <SumButton onClick={()=>{
              if(!btnEnable)
                  return

              if(!minValue)
                onValueChange && onValueChange(value - sumValue)
              else
                onValueChange && onValueChange(value - sumValue <= minValue ? minValue : value - sumValue)
            }}> <SumButtonImg src={minusBtnImg}/> </SumButton>

            <div style={{width: '100px', justifyItems: 'center',  alignItems: 'center'}}>
              {displayValue}
            </div>

            <SumButton onClick={()=>{
              if(!btnEnable)
                  return

              if(!maxValue)
                onValueChange && onValueChange(value + sumValue)
              else
                onValueChange && onValueChange(value + sumValue >= maxValue ? maxValue : value + sumValue)
            }}> <SumButtonImg src={plusBtnImg}/> </SumButton>
        </Value>


      </Container>
    );
}

SetValue.defaultProps = {
  title     : "",
  value     : 0.0,
  maxValue  : 0.0,
  minValue  : 0.0,
  sumValue  : 0.0,
  btnEnable : true,
};

const Container = styled.div`
  display       : grid;
  color         : black;
  justify-items : center;
  align-items   : center;
  row-gap       : 10px;
  
  grid-template-areas:
		"title title . plusBtn"
		"value value . sumValue"
		"value value . minusBtn";
`
const Title = styled.div`
  grid-area : title;
  color     : #666666;
  font-size : 20px;
`
const Value = styled.div`
  display        : flex;
  grid-area      : value;
  font-size      : 30px;
  flex-direction : row;
  justify-items  : center;
  align-items    : center;
  column-gap     : 15px;
`
const SumButton = styled.div`
  width            : 45px;
  height           : 45px;
  display          : flex;
  justify-content  : center;
  align-items      : center;
  background-color : #C9DBE6;
  border-style     : none;
  border-radius    : 8px;
`
const SumButtonImg = styled.img`
  width : 30px;
`

export default SetValue;