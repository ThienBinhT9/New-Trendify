import { Typography } from "antd";
import { type ComponentProps } from "react";
import parse, { DOMNode, domToReact, Element } from "html-react-parser";

import "./Text.scss";

type ParagraphProps = ComponentProps<typeof Typography.Paragraph>;

interface Props extends ParagraphProps {
  className?: string;
  children: string;
  textType?:
    | "R10"
    | "R12"
    | "R14"
    | "R16"
    | "R18"
    | "R20"
    | "R24"
    | "M10"
    | "M12"
    | "M14"
    | "M16"
    | "M18"
    | "M20"
    | "M24"
    | "M32"
    | "M36"
    | "M40"
    | "M48"
    | "B32"
    | "SB12"
    | "SB14"
    | "SB16"
    | "SB18"
    | "SB22";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClick?: (a: any) => void;
}
const Text = (props: Props) => {
  const { children, className, textType = "R14", onClick, ...rest } = props;

  const postTextOptions = {
    replace: (domNode: DOMNode) => {
      if (domNode instanceof Element && domNode?.attribs) {
        const { ["data-type"]: type, ["data-user-id"]: id } = domNode.attribs;

        if (type === "hashtag" || type === "mention" || id) {
          const content = domToReact((domNode as Element).children as DOMNode[], postTextOptions);

          return <span className="text-tag">{content}</span>;
        }
      }
    },
  };

  return (
    <Typography.Paragraph
      className={`text-container ${className || ""} ${textType || ""}`}
      {...rest}
      onClick={onClick}
    >
      {parse(children, postTextOptions)}
    </Typography.Paragraph>
  );
};

export default Text;
