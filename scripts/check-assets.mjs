(async () => {
  const r = await fetch('http://localhost:4123');
  const html = await r.text();
  console.log('HTML status:', r.status, 'len:', html.length);
  const match = html.match(/href="(\/_next\/static\/css\/[^"]+)"/);
  if (match) {
    const cssRes = await fetch('http://localhost:4123' + match[1]);
    console.log('CSS URL:', match[1], 'status:', cssRes.status, 'len:', (await cssRes.text()).length);
  }
  const imgRes = await fetch('http://localhost:4123/hero/bg-atmospheric.jpg');
  console.log('/hero/bg-atmospheric.jpg status:', imgRes.status);
  const handRes = await fetch('http://localhost:4123/hero/hand-match.jpg');
  console.log('/hero/hand-match.jpg status:', handRes.status);
})();
