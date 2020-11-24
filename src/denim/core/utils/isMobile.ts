import useScreenSize from './useScreenSize';

export const isMobile = () => {
  const { width } = useScreenSize();

  return width < 600;
};

export default isMobile;
