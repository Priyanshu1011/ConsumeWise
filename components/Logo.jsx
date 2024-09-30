import Image from "next/image";

const Logo = () => {
  return (
    <div className="text-white">
      <Image
        src={"/assets/logo-no-background.png"}
        width={400}
        height={200}
        alt="Logo"></Image>
    </div>
  );
};

export default Logo;
