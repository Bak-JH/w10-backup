import React from 'react';
import classNames from 'classnames';
import '../styles/Button.scss';

type ButtonProps = {
  children? : React.ReactNode;
  type      : string;
  color     : string;
  onClick?  : () => void;
  enable    : boolean;
  visible   : boolean;
}

function Button({children,type,color,enable,onClick,visible} : ButtonProps){
  return (
    <button className={ classNames('Button', type, color, { 'disable-prop': !enable }, {'invisible-prop': !visible})} onClick={() => {(onClick && enable) && onClick()}} >
      {children}
    </button>
  );
}

Button.defaultProps = {
    type    : '',
    color   : 'blue',
    enable  : true,
    visible : true,
  };

export default Button;