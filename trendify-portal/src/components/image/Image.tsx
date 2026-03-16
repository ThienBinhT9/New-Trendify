import { Image as ImageAntd, ImageProps } from "antd";
import "./Image.scss";

interface IImageProps extends Omit<ImageProps, "src"> {
  src?: string;
  fallback?: string;
}

const DEFAULT_FALLBACK = "/images/default-image.png";

const Image = (props: IImageProps) => {
  const { src, fallback, preview, ...rest } = props;

  return (
    <ImageAntd
      className={`image-container ${props.className || ""}`}
      src={src}
      fallback={fallback || DEFAULT_FALLBACK}
      preview={src ? preview : false}
      {...rest}
    />
  );
};

export default Image;
