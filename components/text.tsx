export function Link({ link, children }: { link: string; children: any }) {
  return (
    <a className="text-blue-500" target="_blank" href={link}>
      {children}
    </a>
  );
}

export function Bold({ children }: any) {
  return <span className="text-gray-900 dark:text-gray-200">{children}</span>;
}
