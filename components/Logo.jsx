import Image from "next/image";

const Logo = () => {
  return (
    <div className="select-none" draggable={false}>
      <Image
        src={"/assets/logo-no-background.png"}
        width={400}
        height={200}
        alt="Logo"
      />
    </div>
  );
};

export default Logo;
