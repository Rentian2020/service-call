import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ onSearch, placeholder = "Search services near you…" }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleChange = (val: string) => {
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-blue-300 focus-within:bg-white transition-colors">
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400"
      />
      {query && (
        <button onClick={() => handleChange("")} className="text-gray-300 hover:text-gray-500 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
