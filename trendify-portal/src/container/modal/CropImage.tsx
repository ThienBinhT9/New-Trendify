import { useState, useCallback } from "react";
import { Slider, Button, Flex } from "antd";
import Modal from "@/components/modal/Modal";
import Cropper, { Area } from "react-easy-crop";

interface CropAvatarModalProps {
  open: boolean;
  imageSrc: string;
  aspect?: number;
  cropShape?: "rect" | "round";
  onCancel: () => void;
  onCrop: (croppedArea: Area) => void;
}

const CropImageModal = ({
  open,
  imageSrc,
  aspect = 1,
  cropShape = "rect",
  onCancel,
  onCrop,
}: CropAvatarModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleSave = () => {
    if (!croppedArea) return;
    onCrop(croppedArea);
  };

  return (
    <Modal open={open} onCancel={onCancel} footer={null} centered className="crop-modal">
      <Flex vertical gap={20}>
        <div className="crop-wrapper">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            tooltip={{ open: false }}
            onChange={(value) => setZoom(value)}
          />
        </div>

        <Flex justify="flex-end" gap={10}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSave}>
            Save
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default CropImageModal;
