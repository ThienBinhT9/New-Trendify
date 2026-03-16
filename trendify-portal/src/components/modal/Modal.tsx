import { Modal as ModalAntd, ModalProps } from "antd";

import "./Modal.scss";

interface Props extends ModalProps {
  closable?: boolean;
  centered?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const Modal = (props: Props) => {
  const { children, className, centered = true, closable = false, ...rest } = props;
  return (
    <ModalAntd
      className={`modal-container ${className || ""}`}
      centered={centered}
      closable={closable}
      {...rest}
    >
      {children}
    </ModalAntd>
  );
};

export default Modal;
