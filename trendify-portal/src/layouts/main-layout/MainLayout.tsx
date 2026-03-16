import { Flex } from "antd";

import "./MainLayout.scss";
import { ILayout } from "@/interfaces/common.interface";

const MainLayout = (props: ILayout) => {
  const { children, sidebar, header } = props;
  return (
    <Flex vertical>
      <Flex className="main-layout-body">
        {sidebar}
        <Flex flex={1} className="main-layout-content">
          {header}
          <Flex className="main-layout-children" id="mainLayoutChildren">
            {children}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default MainLayout;
