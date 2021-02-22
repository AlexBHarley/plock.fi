export function Favicon({ url }) {
  return (
    <img
      referrerPolicy="no-referrer"
      className="inline h-4"
      src={`https://icons.duckduckgo.com/ip3/${url}.ico`}
    />
  );
}
