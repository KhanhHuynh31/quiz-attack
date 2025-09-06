interface ErrorStateProps {
  error: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-900 to-purple-900 text-white">
      <div className="text-center p-8 bg-white/10 rounded-2xl backdrop-blur-md">
        <h2 className="text-2xl font-bold mb-4">Lỗi</h2>
        <p className="mb-6">{error}</p>
        <p>Đang chuyển hướng về trang chủ...</p>
      </div>
    </div>
  );
};

export default ErrorState;