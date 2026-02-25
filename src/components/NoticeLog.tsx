interface Props {
  errors: string[];
  notices: string[];
}

export default function NoticeLog({ errors, notices }: Props) {
  if (errors.length === 0 && notices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {errors.map((msg, i) => (
        <div
          key={`err-${i}`}
          className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200"
        >
          <span className="text-red-500 mt-0.5 flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm0 9.5a.75.75 0 100 1.5.75.75 0 000-1.5zm0-7a.75.75 0 00-.75.75v4a.75.75 0 001.5 0v-4A.75.75 0 008 3.5z"/>
            </svg>
          </span>
          <p className="text-sm text-red-700">{msg}</p>
        </div>
      ))}

      {notices.map((msg, i) => (
        <div
          key={`notice-${i}`}
          className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200"
        >
          <span className="text-amber-500 mt-0.5 flex-shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8.982 1.566a1.13 1.13 0 00-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.71c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 01-1.1 0L7.1 5.995A.905.905 0 018 5zm.002 6a1 1 0 110 2 1 1 0 010-2z"/>
            </svg>
          </span>
          <p className="text-sm text-amber-800">{msg}</p>
        </div>
      ))}
    </div>
  );
}
