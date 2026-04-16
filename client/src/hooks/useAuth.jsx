import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useToast } from "./use-toast";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // ✅ Store token inside user object
          setUser({ ...userData, token });

          // Verify token validity
          const response = await authAPI.getMe();
          if (response.success) {
            setUser({ ...response.user, token });
            localStorage.setItem("user", JSON.stringify(response.user));
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // ✅ Sign in
  const signIn = async (email, password) => {
    try {
      const response = await authAPI.signIn({ email, password });

      if (response.success && response.token) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));

        // ✅ Add token into user object
        setUser({ ...response.user, token: response.token });

        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });

        navigate("/");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Error signing in",
        description:
          error.response?.data?.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    }
  };

  // ✅ Sign up
  const signUp = async (data) => {
    try {
      const response = await authAPI.signUp({
        email: data.email,
        password: data.password,
        full_name: data.fullName,
        username: data.username,
      });

      if (response.success) {
        toast({
          title: "Account created!",
          description: response.message || "Please sign in to continue",
        });
      }
    } catch (error) {
      console.error("Sign up error:", error);
      toast({
        title: "Error creating account",
        description:
          error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // ✅ Sign out
  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  // ✅ Update user info
  const updateUser = (updatedUser) => {
    const token = localStorage.getItem("token");
    setUser({ ...updatedUser, token });
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

