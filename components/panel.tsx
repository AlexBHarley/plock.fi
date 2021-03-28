export function Panel({ children }: any) {
  return (
    <div className="bg-white dark:bg-gray-850 shadow rounded-lg px-5 py-4 space-y-6 flex flex-col">
      {children}
    </div>
  );
}

export function PanelWithButton({ children }: any) {
  return (
    <div className="bg-white dark:bg-gray-850 shadow rounded-md">
      <div className="px-5 py-5 space-y-4 rounded-t-md">{children[0]}</div>
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 text-right sm:px-6 rounded-b-md">
        {children[1]}
      </div>
    </div>
  );
}
