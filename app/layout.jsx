import "/styles/globals.css";

export const metadata = {
  title: "ConsumeWise",
  description:
    "ConsumeWise is an AI-enabled smart label reader that helps consumers understand the health impact of packaged food products and nudges them to make better choices.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased text-blue-800`}>{children}</body>
    </html>
  );
}
