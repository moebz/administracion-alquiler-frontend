import { Space, Switch } from "antd";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const ActiveFilterSwitch = ({ checked, onChange }: Props) => (
  <Space>
    <span>Mostrar inactivos</span>
    <Switch checked={checked} onChange={onChange} />
  </Space>
);
