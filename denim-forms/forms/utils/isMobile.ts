import useScreenSize from './useScreenSize';

export const isMobile = () => {
  const { width } = useScreenSize();

  return width < 800;
};

export default isMobile;
