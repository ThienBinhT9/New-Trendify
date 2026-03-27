import { Flex } from "antd";
import { PuffLoader } from "react-spinners";

import "./Loader.scss";

interface Props {
  overlay?: boolean;
  size?: number;
}

const LoaderPuff = (props: Props) => {
  const { size = 16, overlay = false } = props;
  return (
    <Flex className={`loader-container ${overlay ? "loader-container--overlay" : ""}`}>
      <PuffLoader size={size} color="var(--primary-color)" />
    </Flex>
  );
};

export default LoaderPuff;
