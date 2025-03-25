import iconhubLogo from '../assets/iconhub-logo.webp';

type IconPickerIconProps = {
  style?: React.CSSProperties;
};
const IconPickerIcon = (props: IconPickerIconProps) => {
  return <img style={props.style} src={iconhubLogo} alt="IconHub logo" />;
};

export default IconPickerIcon;
