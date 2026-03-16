import { Flex } from "antd";
import { useCallback, useEffect, useState } from "react";

import { IPostLocation } from "@/interfaces/post.interface";

import Button from "@/components/button/Button";
import Input from "@/components/input/Input";
import Text from "@/components/text/Text";
import Icon from "@/components/icon/Icon";

interface IProps {
  selectedLocation: IPostLocation | null;
  onBack: () => void;
  onSelect: (location: IPostLocation | null) => void;
}

const searchGoogleMaps = (q: string): Promise<IPostLocation[]> => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("accept-language", "vi");
  url.searchParams.set("addressdetails", "1");

  return (
    fetch(url.toString())
      .then((res) => res.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((items: any[]) =>
        items.map((item) => ({
          name: item.name || item.display_name.split(",")[0],
          address: item.display_name,
          placeId: item.place_id.toString(),
          coordinates: {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          },
        })),
      )
  );
};

const LocationPanel = ({ selectedLocation, onBack, onSelect }: IProps) => {
  const [query, setQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<IPostLocation[]>([]);

  const handleSearchLocation = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const mapped = await searchGoogleMaps(q);
      setResults(mapped);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => handleSearchLocation(query), 400);
    return () => clearTimeout(timer);
  }, [query, handleSearchLocation]);

  const handleChooseLocation = (location: IPostLocation) => {
    onSelect({
      name: location.name,
      address: location.address,
      placeId: location.placeId,
      coordinates: location.coordinates,
    });
    onBack();
  };

  return (
    <Flex vertical className="post-modal-panel post-location-panel">
      <Flex className="post-modal-header">
        <Button
          type="text"
          className="post-icon-btn"
          icon={<Icon name="ArrowIcon" size={28} />}
          onClick={onBack}
        />
        <Text textType="SB22">Chọn địa điểm</Text>
        <span className="post-head-placeholder" />
      </Flex>

      <Flex vertical className="post-location-body">
        <Flex className="post-location-search-wrap">
          <Input
            className="post-location-input"
            placeholder="Tìm kiếm địa điểm"
            prefix={<Icon name="SearchIcon" size={20} />}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
        </Flex>

        {selectedLocation && (
          <Flex className="post-location-selected">
            <Flex vertical>
              <Text textType="SB16">{selectedLocation.name}</Text>
              {selectedLocation.address && (
                <Text className="color-second">{selectedLocation.address}</Text>
              )}
            </Flex>
            <Button
              type="text"
              className="post-location-selected-remove"
              icon={<Icon name="CloseIcon" size={18} />}
              onClick={() => onSelect(null)}
            />
          </Flex>
        )}

        <Flex vertical className="post-location-results">
          {loading ? (
            <Flex className="post-location-empty" justify="center" align="center">
              <Text textType="M14" className="color-second">
                Đang tìm kiếm...
              </Text>
            </Flex>
          ) : !query.trim() ? (
            <Flex className="post-location-empty" justify="center" align="center">
              <Text textType="M14" className="color-second">
                Nhập tên địa điểm để tìm kiếm
              </Text>
            </Flex>
          ) : !results.length ? (
            <Flex className="post-location-empty" justify="center" align="center">
              <Text textType="M14" className="color-second">
                Không tìm thấy địa điểm
              </Text>
            </Flex>
          ) : (
            results.map((loc, index) => {
              const isActive = selectedLocation?.placeId === loc.placeId;
              return (
                <Flex
                  key={index}
                  vertical
                  className={`post-location-item ${isActive ? "active" : ""}`}
                  onClick={() => handleChooseLocation(loc)}
                >
                  <Text textType="SB16" className="post-location-name">
                    {loc.name}
                  </Text>
                  <Text className="color-second">{`${loc.address}`}</Text>
                </Flex>
              );
            })
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default LocationPanel;
