import React from "react";
import icons from "@/assets/icons/Icon";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: keyof typeof icons;
  size?: number;
}

const Icon: React.FC<IconProps> = ({ name, size = 18, ...rest }) => {
  const SvgIcon = icons[name];

  return (
    <SvgIcon
      width={size}
      height={size}
      stroke="currentColor"
      style={{ cursor: "pointer" }}
      {...rest}
    />
  );
};

export default Icon;
