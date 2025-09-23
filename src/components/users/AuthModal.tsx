"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaUser,
  FaEnvelope,
  FaLock,
  FaUpload,
  FaSpinner,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Avatar, { genConfig, AvatarFullConfig } from "react-nice-avatar";
import { supabase } from "@/lib/supabaseClient";
import {
  loadFromLocalStorage,
  saveToLocalStorage,
  LOCAL_STORAGE_KEYS,
} from "@/hooks/useLocalStorage";

// Types
interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  avatarConfig?: AvatarFullConfig;
  customAvatarImage?: string | null;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
}

type AuthMode = "login" | "register" | "forgotPassword";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// Default avatar config
const DEFAULT_AVATAR_CONFIG = genConfig();

// Animation variants
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

const slideVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// File upload utility
const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// Main component
const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState<AvatarFullConfig>(DEFAULT_AVATAR_CONFIG);
  const [customAvatarImage, setCustomAvatarImage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({});
      setMessage("");
      setAvatarFile(null);
      setCustomAvatarImage(null);
      setAvatarConfig(genConfig());
    }
  }, [isOpen, mode]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Handle avatar file upload
  const handleAvatarUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, general: "Avatar file must be less than 5MB" }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomAvatarImage(e.target?.result as string);
        setAvatarFile(file);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (mode === "register") {
      if (!validateName(formData.name)) {
        newErrors.name = "Name must be at least 2 characters long";
      }
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (mode !== "forgotPassword") {
      if (!validatePassword(formData.password)) {
        newErrors.password = "Password must be at least 6 characters long";
      }

      if (mode === "register" && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [mode, formData]);

  // Handle authentication
  const handleAuth = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setMessage("");

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || formData.email,
            name: profile?.name || data.user.user_metadata?.name || "User",
            avatar: profile?.avatar_url || "",
            avatarConfig: profile?.avatar_config ? JSON.parse(profile.avatar_config) : DEFAULT_AVATAR_CONFIG,
            customAvatarImage: profile?.avatar_url || null,
          };

          onAuthSuccess(authUser);
          onClose();
        }
      } else if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          let avatarUrl = "";
          
          // Upload custom avatar if provided
          if (avatarFile) {
            try {
              avatarUrl = await uploadAvatar(avatarFile, data.user.id);
            } catch (uploadError) {
              console.error("Avatar upload failed:", uploadError);
              // Continue without avatar
            }
          }

          // Create user profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              name: formData.name,
              email: formData.email,
              avatar_url: avatarUrl,
              avatar_config: JSON.stringify(avatarConfig),
            });

          if (profileError) {
            console.error("Profile creation error:", profileError);
          }

          const authUser: AuthUser = {
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            avatar: avatarUrl,
            avatarConfig,
            customAvatarImage: avatarUrl || null,
          };

          onAuthSuccess(authUser);
          setMessage("Registration successful! Please check your email to verify your account.");
          
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else if (mode === "forgotPassword") {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        setMessage("Password reset email sent! Please check your inbox.");
      }
    } catch (error: any) {
      setErrors({ general: error.message || "An error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }, [mode, formData, validateForm, onAuthSuccess, onClose, avatarConfig, avatarFile]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-xl font-semibold">
              {mode === "login" && "Sign In"}
              {mode === "register" && "Create Account"}
              {mode === "forgotPassword" && "Reset Password"}
            </h2>
            <motion.button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-1"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes />
            </motion.button>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={(e) => {
                e.preventDefault();
                handleAuth();
              }}
              className="space-y-4"
            >
              {/* Avatar section for registration */}
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-center"
                >
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Avatar
                  </label>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <motion.div
                      className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 cursor-pointer relative overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                    >
                      {customAvatarImage ? (
                        <img
                          src={customAvatarImage}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Avatar className="w-full h-full" {...avatarConfig} />
                      )}
                    </motion.div>
                    <div className="flex flex-col gap-2">
                      <motion.button
                        type="button"
                        onClick={() => setAvatarConfig(genConfig())}
                        className="px-3 py-1 text-xs bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.05 }}
                      >
                        Random Avatar
                      </motion.button>
                      <label className="px-3 py-1 text-xs bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF7A47] transition-colors cursor-pointer inline-block text-center">
                        <FaUpload className="inline mr-1" />
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Name field */}
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <FaUser className="inline mr-2" />
                    Full Name
                  </label>
                  <motion.input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                    whileFocus={{ scale: 1.02 }}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
              )}

              {/* Email field */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <FaEnvelope className="inline mr-2" />
                  Email Address
                </label>
                <motion.input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                  whileFocus={{ scale: 1.02 }}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password field */}
              {mode !== "forgotPassword" && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <FaLock className="inline mr-2" />
                    Password
                  </label>
                  <div className="relative">
                    <motion.input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                      whileHover={{ scale: 1.1 }}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </motion.button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Confirm password field */}
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    <FaLock className="inline mr-2" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <motion.input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 pr-12 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 transition-all"
                      whileFocus={{ scale: 1.02 }}
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                      whileHover={{ scale: 1.1 }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </motion.button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              {/* Error message */}
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-3"
                >
                  <p className="text-red-400 text-sm">{errors.general}</p>
                </motion.div>
              )}

              {/* Success message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-xl p-3"
                >
                  <p className="text-green-400 text-sm">{message}</p>
                </motion.div>
              )}

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#FF6B35] text-white font-semibold hover:bg-[#FF7A47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    {mode === "login" && "Signing In..."}
                    {mode === "register" && "Creating Account..."}
                    {mode === "forgotPassword" && "Sending Email..."}
                  </>
                ) : (
                  <>
                    {mode === "login" && "Sign In"}
                    {mode === "register" && "Create Account"}
                    {mode === "forgotPassword" && "Send Reset Email"}
                  </>
                )}
              </motion.button>

              {/* Mode switching */}
              <div className="text-center space-y-2">
                {mode === "login" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode("forgotPassword")}
                      className="text-white/60 hover:text-white text-sm transition-colors"
                    >
                      Forgot your password?
                    </button>
                    <div>
                      <span className="text-white/60 text-sm">Don't have an account? </span>
                      <button
                        type="button"
                        onClick={() => setMode("register")}
                        className="text-[#FF6B35] hover:text-[#FF7A47] text-sm transition-colors"
                      >
                        Sign up
                      </button>
                    </div>
                  </>
                )}

                {mode === "register" && (
                  <div>
                    <span className="text-white/60 text-sm">Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-[#FF6B35] hover:text-[#FF7A47] text-sm transition-colors"
                    >
                      Sign in
                    </button>
                  </div>
                )}

                {mode === "forgotPassword" && (
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-[#FF6B35] hover:text-[#FF7A47] text-sm transition-colors"
                  >
                    Back to Sign In
                  </button>
                )}
              </div>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;