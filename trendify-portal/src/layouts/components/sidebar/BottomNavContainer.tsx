import { MenuProps } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

import "./BottomNavContainer.scss";

interface BottomNavContainerProps {
  items: Required<MenuProps>["items"][number][];
}

const BottomNavContainer = (props: BottomNavContainerProps) => {
  const { items } = props;

  const navigate = useNavigate();
  const location = useLocation();

  const getSelectedKey = (): string => {
    const matched = [...items]
      .sort((a, b) => String(b?.key).length - String(a?.key).length)
      .find((item) => {
        const key = String(item?.key);
        return key === "/" ? location.pathname === "/" : location.pathname.startsWith(key);
      });

    return String(matched?.key ?? location.pathname);
  };

  const selectedKey = getSelectedKey();

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        if (!item) return null;

        const key = String(item.key);
        const isSelected = key === selectedKey;

        // ant design menu item có thể có icon và label
        const menuItem = item as {
          key: string;
          icon?: React.ReactNode;
          label?: React.ReactNode;
        };

        return (
          <button
            key={key}
            className={`bottom-nav__item ${isSelected ? "bottom-nav__item--active" : ""}`}
            onClick={() => navigate(key)}
          >
            {menuItem.icon && <span className="bottom-nav__icon">{menuItem.icon}</span>}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavContainer;
