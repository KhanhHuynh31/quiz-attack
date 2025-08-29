import { useRef, useState } from "react";
import { FaFacebook, FaGoogle, FaTimes, FaUpload, FaUserCircle } from "react-icons/fa";
import Avatar, { genConfig } from "react-nice-avatar";

const AvatarModal = ({
  isOpen,
  onClose,
  onSelect,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (config: any) => void;
  t: any;
}) => {
  const [config, setConfig] = useState(genConfig());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRandomize = () => {
    setConfig(genConfig());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onSelect({ type: "upload", data: event.target?.result });
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-[#2B2D42] rounded-3xl border border-white/10 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#EAEAEA] hover:text-white transition-colors"
        >
          <FaTimes />
        </button>
        <h3 className="text-xl font-bold text-white mb-4">{t.chooseAvatar}</h3>

        <div className="flex justify-center mb-4">
          <Avatar className="w-32 h-32" {...config} />
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={handleRandomize}
            className="rounded-xl bg-[#FF6B35] px-4 py-2 text-white font-semibold"
          >
            Randomize
          </button>
        </div>

        <button
          onClick={() => onSelect({ type: "avatar", config })}
          className="w-full mb-3 rounded-xl bg-[#FF6B35] px-4 py-3 text-white font-semibold"
        >
          Use This Avatar
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4CC9F0] px-4 py-3 text-white font-semibold"
        >
          <FaUpload /> {t.uploadAvatar}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
};
export const LoginModal = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  t,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (data: { username: string; password: string; avatar: any }) => void;
  onRegister: (data: {
    username: string;
    password: string;
    avatar: any;
  }) => void;
  t: any;
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [avatarConfig, setAvatarConfig] = useState<any>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      onRegister({ ...formData, avatar: avatarConfig });
    } else {
      onLogin({ ...formData, avatar: avatarConfig });
    }
    onClose();
  };

  const handleAvatarSelect = (config: any) => {
    setAvatarConfig(config);
    setShowAvatarModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="relative max-w-md w-full bg-[#2B2D42] rounded-3xl border border-white/10 p-6 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#EAEAEA] hover:text-white transition-colors"
          >
            <FaTimes />
          </button>

          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isRegister ? t.register : t.login}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20"
              >
                {avatarConfig ? (
                  avatarConfig.type === "avatar" ? (
                    <Avatar
                      className="w-full h-full"
                      {...avatarConfig.config}
                    />
                  ) : (
                    <img
                      src={avatarConfig.data}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <FaUserCircle className="text-5xl text-[#EAEAEA]" />
                )}
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder={t.username}
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                required
              />
            </div>

            <div>
              <input
                type="password"
                placeholder={t.password}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-[#EAEAEA] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-lg shadow-[#FF6B35]/30 ring-1 ring-white/20 transform hover:scale-105 transition-all"
            >
              {isRegister ? t.register : t.login}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-[#EAEAEA]">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#3b5998] px-4 py-3 text-white font-medium"
              >
                <FaFacebook /> Facebook
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#DB4437] px-4 py-3 text-white font-medium"
              >
                <FaGoogle /> Google
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-[#FF6B35] hover:underline"
              >
                {isRegister
                  ? "Already have an account? Login"
                  : "Need an account? Register"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSelect={handleAvatarSelect}
        t={t}
      />
    </>
  );
};