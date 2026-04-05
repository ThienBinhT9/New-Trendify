import { Flex } from "antd";
import { useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";

import Input from "@/components/input/Input";
import Icon from "@/components/icon/Icon";
import ROUTE_PATHS from "@/routes/path.route";

import "./Search.scss";
import {
  useSearchStore,
  setSearchInputValue,
  setSearchFocused,
  clearSearchInput,
} from "./searchStore";

const SearchHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { inputValue } = useSearchStore();

  const submittedQ = searchParams.get("q") ?? "";

  useEffect(() => {
    if (submittedQ && !inputValue) {
      setSearchInputValue(submittedQ);
    }
  }, []);

  const handleSubmit = () => {
    const q = inputValue.trim();
    if (!q) return;
    navigate(`${location.pathname}?q=${encodeURIComponent(q)}`);
  };

  const handleClear = () => {
    clearSearchInput();
    navigate(ROUTE_PATHS.SEARCH);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      clearSearchInput();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <Flex className="header-container header-search-container">
      <Flex className="search-header-input-wrapper" align="center">
        <Input
          className="search-header-input"
          placeholder="Tìm kiếm"
          prefix={<Icon name="SearchSmall" size={16} />}
          suffix={
            inputValue ? (
              <Icon
                name="CloseIcon"
                size={14}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="search-header-clear"
              />
            ) : null
          }
          value={inputValue}
          onChange={(e) => setSearchInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          allowClear={false}
        />
      </Flex>
    </Flex>
  );
};

export default SearchHeader;
