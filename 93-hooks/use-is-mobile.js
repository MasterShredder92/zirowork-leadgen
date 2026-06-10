window.useIsMobile = function useIsMobile(bp = 768) {
  const [mobile, setMobile] = React.useState(window.innerWidth <= bp);
  React.useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= bp);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, [bp]);
  return mobile;
};
