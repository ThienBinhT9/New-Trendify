import { Divider, Flex } from "antd";

import "./Modal.scss";
import Button from "../button/Button";
import Text from "../text/Text";

interface Props {
  loading?: boolean;
  textCancel?: string;
  textSubmit?: string;
  btnSubmitType?: "primary" | "link" | "text" | "default" | "dashed" | undefined;
  disableSubmit?: boolean;
  classNameContent?: string;
  classNameContainer?: string;
  onCancel: () => void;
  onSubmit: () => void;
}

const FooterModal = (props: Props) => {
  const {
    loading = false,
    textCancel,
    textSubmit,
    disableSubmit = false,
    btnSubmitType = "primary",
    classNameContent,
    classNameContainer,
    onCancel,
    onSubmit,
  } = props;

  return (
    <Flex className={`footer-modal ${classNameContainer || ""}`}>
      <Divider style={{ marginTop: 4, marginBottom: 16 }} />
      <Flex className={`footer-content ${classNameContent || ""}`}>
        <Button className="footer-btn" size="large" loading={loading} onClick={onCancel}>
          <Text textType="M16">{textCancel || "Cancel"}</Text>
        </Button>
        <Button
          size="large"
          className="footer-btn"
          loading={loading}
          type={btnSubmitType}
          disabled={disableSubmit}
          onClick={onSubmit}
        >
          <Text textType="M16">{textSubmit || "Save"}</Text>
        </Button>
      </Flex>
    </Flex>
  );
};

export default FooterModal;
