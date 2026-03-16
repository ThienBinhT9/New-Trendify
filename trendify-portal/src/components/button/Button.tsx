import { Button as ButtonAntd, ButtonProps } from "antd";

import "./Button.scss";
import React from "react";

interface IButtonProps extends ButtonProps {
  className?: string;
  children?: React.ReactNode;
}

const Button = (props: IButtonProps) => {
  const { children, className, ...rest } = props;

  return (
    <ButtonAntd className={`button-container ${className || ""} `} {...rest}>
      {children}
    </ButtonAntd>
  );
};

export default Button;
