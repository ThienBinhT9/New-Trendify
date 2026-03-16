import { useState } from "react";
import { Flex, Switch } from "antd";
import Text from "@/components/text/Text";

const HideCountsContent = () => {
  const [isHidden, setIsHidden] = useState(false);

  return (
    <Flex vertical className="settings-privacy-profile">
      <Flex align="center" justify="space-between" className="settings-privacy-profile__row">
        <Text textType="R14" className="settings-privacy-profile__label">
          Ẩn số lượt thích và lượt chia sẻ
        </Text>
        <Switch
          checked={isHidden}
          onChange={(checked) => setIsHidden(checked)}
          className="settings-privacy-profile__switch"
        />
      </Flex>
      <Text textType="R14" className="settings-privacy-profile__desc">
        Trên Trendify, hệ thống sẽ ẩn số lượt thích, lượt xem, lượt đăng lại và lượt trích dẫn trên
        bài viết của những trang cá nhân khác. Để ẩn các số liệu này trên chính bài viết của mình,
        bạn có thể mở menu của từng bài viết.
      </Text>
    </Flex>
  );
};

export default HideCountsContent;
