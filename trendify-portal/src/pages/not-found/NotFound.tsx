import { Flex, Empty } from "antd";
import { useNavigate } from "react-router-dom";

import "./NotFound.scss";
import ROUTE_PATHS from "@/routes/path.route";

import Text from "@/components/text/Text";
import Button from "@/components/button/Button";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Flex vertical className="not-found-container">
      <Flex align="center" className="not-found-header">
        <Text textType="M16" className="not-found-logo">
          Trendify
        </Text>
      </Flex>
      <Flex gap={26} flex={1} vertical align="center" justify="center">
        <Flex vertical align="center" gap={8}>
          <Empty description={"Not found"} />
          <Text textType="M20">Looks like this page doesn't exist</Text>
          <Text>Go back to home and continue exploring</Text>
        </Flex>
        <Button onClick={() => navigate(ROUTE_PATHS.HOME)} type="primary" size="large">
          <Text textType="M14">Back to Home</Text>
        </Button>
      </Flex>
    </Flex>
  );
};

export default NotFound;
