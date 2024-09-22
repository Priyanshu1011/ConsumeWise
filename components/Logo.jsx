import Image from "next/image";

const Logo = () => {
  return (
    <Image
      src="/assets/logo.png"
      alt="logo"
      width={320}
      height={180}
      priority
      className="w-auto h-auto rounded-lg"
    />
  );
};

export default Logo;
