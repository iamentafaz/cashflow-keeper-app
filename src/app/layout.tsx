export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<html lang="en">
  <head>
    <title>KipCash</title>
    <meta name="description" content="Lovable Generated Project" />
    <meta name="author" content="Lovable" />

    <meta property="og:title" content="kip-cash" />
    <meta property="og:description" content="Lovable Generated Project" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@lovable_dev" />
    <meta name="twitter:image" content="https://lovable.dev/opengraph-image-p98pqg.png" />
  </head>

  <body>
    <div id="root">{children}</div>
  </body>
</html>
  )
}