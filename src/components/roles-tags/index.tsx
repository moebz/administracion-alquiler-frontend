import { Space, Tag } from "antd";
import { capitalize } from "../../utils/strings";

export const RolesTags = ({ roles }: { roles: string[] }) => {
  if (roles.length === 0) {
    return <>—</>;
  }
  return (
    <Space size={[4, 4]} wrap>
      {roles.map((role) => (
        <Tag key={role}>{capitalize(role)}</Tag>
      ))}
    </Space>
  );
};
