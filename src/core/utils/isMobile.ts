import { Dimensions } from "react-native";

export const isMobile = () => {
  return Dimensions.get('window').width < 600;
};

export default isMobile;
