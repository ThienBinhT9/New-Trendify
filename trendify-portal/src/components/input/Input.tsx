import { Input as InputAntd, InputProps, DatePicker, DatePickerProps } from "antd";
import { OTPProps } from "antd/es/input/OTP";

import "./Input.scss";

//Input
interface PropsInput extends InputProps {
  className?: string;
}

const Input = (props: PropsInput) => {
  const { className, ...rest } = props;
  return <InputAntd className={`input-container ${className || ""}`} {...rest} />;
};

//Input Password
interface PropsInputPassword extends InputProps {
  className?: string;
}

export const InputPassword = (props: PropsInputPassword) => {
  const { className, ...rest } = props;

  return <InputAntd.Password className={`input-container ${className || ""}`} {...rest} />;
};

//Input OTP
interface PropsInputOTP extends OTPProps {
  className?: string;
}

export const InputOTP = (props: PropsInputOTP) => {
  const { className, ...rest } = props;

  return <InputAntd.OTP className={`input-container ${className || ""}`} {...rest} />;
};

//Date Picker
interface PropsInputDate extends DatePickerProps {
  className?: string;
  needConfirm?: boolean;
}

export const InputDate = (props: PropsInputDate) => {
  const { className, needConfirm = true, ...rest } = props;

  return (
    <DatePicker
      className={`input-container ${className || ""}`}
      needConfirm={needConfirm}
      {...rest}
    />
  );
};

Input.Password = InputPassword;
Input.Date = InputDate;
Input.OTP = InputOTP;

export default Input;
