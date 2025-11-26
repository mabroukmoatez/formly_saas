import Sidebar from "./imports/Sidebar";

export default function App() {
  return (
    <div className="size-full flex items-start justify-start bg-gray-50 p-8">
      <div className="w-[280px] h-[1024px]">
        <Sidebar />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl">
          <h1 className="mb-4">Welcome to Formly</h1>
          <p className="text-gray-600">
            This is your main content area. The sidebar on the left provides navigation
            to different sections of the application.
          </p>
        </div>
      </div>
    </div>
  );
}
