const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Đang tải trò chơi...</p>
      </div>
    </div>
  );
};

export default LoadingState;