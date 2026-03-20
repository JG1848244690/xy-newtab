import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="w-[300px] p-4 bg-white">
      <h1 className="text-xl font-bold text-gray-800 mb-4">
        My Extension
      </h1>
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
