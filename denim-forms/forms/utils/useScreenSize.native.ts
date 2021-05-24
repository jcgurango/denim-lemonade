import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

const useScreenSize = () => {
  const [screenData, setScreenData] = useState<{ width: number, height: number }>(() => {
    const { width, height } = Dimensions.get('window');

    return { width, height };
  });

  useEffect(() => {
    const onChange = (result: { window: ScaledSize, screen: ScaledSize }) => {
      setScreenData(result.window);
    };

    Dimensions.addEventListener('change', onChange);

    return () => {
      Dimensions.removeEventListener('change', onChange);
    };
  });

  return screenData;
};

export default useScreenSize;
