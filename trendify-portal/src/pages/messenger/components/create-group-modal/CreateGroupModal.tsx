import { useState, useMemo } from "react";
import { Modal, Input, Flex, Avatar, Button, message } from "antd";
import { useQuery } from "@tanstack/react-query";

import { SearchIcon } from "@/assets/icons/Icon";
import { searchUsers } from "@/stores/search/api";
import { getAvatarUrl } from "@/utils/common.util";
import useDebounce from "@/hooks/useDebounce";
import { useCreateGroup } from "../../hooks/useCreateGroup";
import Text from "@/components/text/Text";

import "./CreateGroupModal.scss";

interface ISelectedUser {
  id: string;
  displayName: string;
  username: string;
  profilePicture?: any;
}

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (conversationId: string) => void;
}

const CreateGroupModal = ({ open, onClose, onSuccess }: CreateGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<ISelectedUser[]>([]);

  const debouncedSearch = useDebounce(searchTerm, 400);

  const { mutate: createGroupMutate, isPending } = useCreateGroup();

  // Search users
  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["searchUsers", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const res = await searchUsers({ q: debouncedSearch });
      return res.data.data.users;
    },
    enabled: !!debouncedSearch.trim(),
  });

  // Filter out already selected users
  const filteredResults = useMemo(() => {
    if (!searchResults) return [];
    const selectedIds = new Set(selectedUsers.map((u) => u.id));
    return searchResults.filter((u: any) => !selectedIds.has(u.id));
  }, [searchResults, selectedUsers]);

  const handleSelectUser = (user: any) => {
    setSelectedUsers((prev) => [
      ...prev,
      {
        id: user.id,
        displayName: user.displayName || user.username || "Unknown",
        username: user.username,
        profilePicture: user.profilePicture,
      },
    ]);
    setSearchTerm("");
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = () => {
    if (!groupName.trim()) {
      message.warning("Vui lòng nhập tên nhóm");
      return;
    }
    if (selectedUsers.length < 1) {
      message.warning("Vui lòng chọn ít nhất 1 thành viên");
      return;
    }

    createGroupMutate(
      {
        name: groupName.trim(),
        memberIds: selectedUsers.map((u) => u.id),
      },
      {
        onSuccess: (data) => {
          message.success("Đã tạo nhóm thành công!");
          onSuccess?.(data.id);
          handleClose();
        },
        onError: () => {
          message.error("Không thể tạo nhóm. Vui lòng thử lại.");
        },
      },
    );
  };

  const handleClose = () => {
    setGroupName("");
    setSearchTerm("");
    setSelectedUsers([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title="Tạo nhóm chat mới"
      className="create-group-modal"
      centered
      width={460}
      destroyOnClose
    >
      <Flex vertical gap={12}>
        {/* Group Name */}
        <Flex vertical gap={4} className="create-group-modal__group-name">
          <Text textType="M14">Tên nhóm</Text>
          <Input
            placeholder="Nhập tên nhóm..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={100}
            autoFocus
          />
        </Flex>

        {/* Search Members */}
        <Flex vertical gap={4} className="create-group-modal__search">
          <Text textType="M14">Thêm thành viên</Text>
          <Input
            placeholder="Tìm kiếm người dùng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchIcon style={{ width: 14, height: 14, opacity: 0.4 }} />}
          />
        </Flex>

        {/* Selected Users Chips */}
        {selectedUsers.length > 0 && (
          <div className="create-group-modal__selected-chips">
            {selectedUsers.map((user) => (
              <div key={user.id} className="create-group-modal__chip">
                <Avatar src={getAvatarUrl(user.profilePicture)} size={22} />
                <span>{user.displayName}</span>
                <span
                  className="create-group-modal__chip-remove"
                  onClick={() => handleRemoveUser(user.id)}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        <div className="create-group-modal__user-list">
          {isSearching || (searchTerm && searchTerm !== debouncedSearch) ? (
            <div className="create-group-modal__empty">Đang tìm kiếm...</div>
          ) : debouncedSearch && filteredResults.length === 0 ? (
            <div className="create-group-modal__empty">Không tìm thấy người dùng</div>
          ) : (
            filteredResults.map((user: any) => (
              <Flex
                key={user.id}
                className="create-group-modal__user-item"
                align="center"
                gap={10}
                onClick={() => handleSelectUser(user)}
              >
                <Avatar src={getAvatarUrl(user.profilePicture)} size={36} />
                <Flex vertical>
                  <span className="create-group-modal__user-name">
                    {user.displayName || user.username}
                  </span>
                  <span className="create-group-modal__user-username">@{user.username}</span>
                </Flex>
              </Flex>
            ))
          )}
        </div>

        {/* Footer */}
        <Flex justify="flex-end" gap={8} className="create-group-modal__footer">
          <Button onClick={handleClose}>Hủy</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isPending}
            disabled={!groupName.trim() || selectedUsers.length < 1}
          >
            Tạo nhóm ({selectedUsers.length} thành viên)
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default CreateGroupModal;
