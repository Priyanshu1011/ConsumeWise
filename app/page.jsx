import InputForm from "@/components/InputForm";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="flex flex-col px-8 py-4 md:px-20 md:py-5 lg:px-24">
      <nav className="flex items-center justify-center">
        <Logo />
      </nav>
      <main className="py-4 md:py-5">
        <InputForm />
      </main>
      <footer className="flex items-center justify-center text-black select-none">
        &copy;&nbsp;<span>ConsumeWise</span>
        <span className="text-green-800">&nbsp;by Team Gravity</span>
      </footer>
    </div>
  );
}
