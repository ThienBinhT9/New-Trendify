import { Tooltip as TooltipAntd, TooltipProps } from "antd";

import "./Tooltip.scss";

interface ITooltipProps extends Pick<TooltipProps, "title" | "placement"> {
  className?: string;
  children: React.ReactNode;
}

const Tooltip = (props: ITooltipProps) => {
  const { children, className, ...rest } = props;

  return (
    <TooltipAntd arrow={false} className={`cumstom-tooltip ${className ?? ""}`} {...rest}>
      {children}
    </TooltipAntd>
  );
};

export default Tooltip;
