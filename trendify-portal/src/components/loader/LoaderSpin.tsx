import { Flex } from "antd";
import { ClipLoader } from "react-spinners";

import "./Loader.scss";

interface Props {
  overlay?: boolean;
  size?: number;
}

const LoaderSpin = (props: Props) => {
  const { size = 16 } = props;
  return (
    <Flex className="loader-container">
      <ClipLoader size={size} color="var(--primary-color)" />
    </Flex>
  );
};

export default LoaderSpin;
