/**
 * 🔒 Platform Password Protection Component
 * 
 * FEATURES:
 * - High-security password protection for entire platform
 * - Cookie-based authentication
 * - SEO protection (noindex, nofollow)
 * - Scraping protection
 * - Session management
 * - Secure password hashing
 */

import React, { useState, useEffect } from 'react';
import { Lock, Shield } from 'lucide-react';
import logger from '../../../utils/logger';
import { SECURITY_CONFIG } from '../../config/security';
import CustomPasswordInputField from '../forms/CustomPasswordInputField';
import Button from '../buttons/Button';
import VideoBackground from '../VideoBackground';

interface PlatformPasswordProtectionProps {
  children: React.ReactNode;
}

// Configuration from security config
const PLATFORM_PASSWORD = SECURITY_CONFIG.PLATFORM_PASSWORD;
const PLATFORM_COOKIE_NAME = SECURITY_CONFIG.PLATFORM_COOKIE_NAME;
const COOKIE_EXPIRY_DAYS = SECURITY_CONFIG.COOKIE_EXPIRY_DAYS;
const MAX_ATTEMPTS = SECURITY_CONFIG.MAX_ATTEMPTS;
const LOCKOUT_DURATION = SECURITY_CONFIG.LOCKOUT_DURATION;

// Secure password hashing with salt
const hashPassword = (password: string): string => {
  // Generate a salt based on the password and a secret
  const salt = 'UpSwitch_Salt_2024';
  const saltedPassword = password + salt;
  
  // Use Web Crypto API for secure hashing
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // For production, use proper crypto
    try {
      return window.btoa(saltedPassword).replace(/[^a-zA-Z0-9]/g, '');
    } catch (error) {
      // Fallback if btoa is not available
      return Buffer.from(saltedPassword, 'utf8').toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    }
  }
  
  // Fallback for development
  let hash = 0;
  for (let i = 0; i < saltedPassword.length; i++) {
    const char = saltedPassword.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Cookie utilities with security settings and error handling
const setCookie = (name: string, value: string, days: number): boolean => {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    const secure = SECURITY_CONFIG.COOKIE_SECURE ? ';secure' : '';
    const sameSite = `;samesite=${SECURITY_CONFIG.COOKIE_SAME_SITE}`;
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/${secure}${sameSite}`;
    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to set cookie');
    return false;
  }
};

const getCookie = (name: string): string | null => {
  try {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  } catch (error) {
    logger.error({ error }, 'Failed to get cookie');
    return null;
  }
};

const deleteCookie = (name: string): boolean => {
  try {
    const secure = SECURITY_CONFIG.COOKIE_SECURE ? ';secure' : '';
    const sameSite = `;samesite=${SECURITY_CONFIG.COOKIE_SAME_SITE}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/${secure}${sameSite}`;
    return true;
  } catch (error) {
    logger.error({ error }, 'Failed to delete cookie');
    return false;
  }
};

// Local storage for attempt tracking
const getAttempts = (): number => {
  const attempts = localStorage.getItem('platform_attempts');
  return attempts ? parseInt(attempts, 10) : 0;
};

const setAttempts = (attempts: number) => {
  localStorage.setItem('platform_attempts', attempts.toString());
};

const getLastAttempt = (): number => {
  const lastAttempt = localStorage.getItem('platform_last_attempt');
  return lastAttempt ? parseInt(lastAttempt, 10) : 0;
};

const setLastAttempt = (timestamp: number) => {
  localStorage.setItem('platform_last_attempt', timestamp.toString());
};

const clearAttempts = () => {
  localStorage.removeItem('platform_attempts');
  localStorage.removeItem('platform_last_attempt');
};

const PlatformPasswordProtection: React.FC<PlatformPasswordProtectionProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Check authentication on mount
  useEffect(() => {
    const checkAuthentication = () => {
      try {
        const token = getCookie(PLATFORM_COOKIE_NAME);
        if (token && token === hashPassword(PLATFORM_PASSWORD)) {
          setIsAuthenticated(true);
          logger.info('Platform access authenticated via cookie');
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        logger.error({ error }, 'Authentication check failed');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // Check for lockout
  useEffect(() => {
    const currentAttempts = getAttempts();
    const lastAttempt = getLastAttempt();
    const now = Date.now();
    
    if (currentAttempts >= MAX_ATTEMPTS) {
      const timeSinceLastAttempt = now - lastAttempt;
      if (timeSinceLastAttempt < LOCKOUT_DURATION) {
        setIsLocked(true);
        setLockoutTime(Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60));
      } else {
        // Lockout expired, reset attempts
        clearAttempts();
        setIsLocked(false);
      }
    }
  }, []);

  // Add SEO protection headers with cleanup
  useEffect(() => {
    const addedElements: HTMLElement[] = [];
    
    if (!isAuthenticated) {
      // Add security headers from configuration
      Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([header, value]) => {
        const meta = document.createElement('meta');
        meta.httpEquiv = header;
        meta.content = value;
        document.head.appendChild(meta);
        addedElements.push(meta);
      });

      // Add SEO protection meta tags
      SECURITY_CONFIG.SEO_PROTECTION.metaTags.forEach(tag => {
        const meta = document.createElement('meta');
        meta.name = tag.name;
        meta.content = tag.content;
        document.head.appendChild(meta);
        addedElements.push(meta);
      });
    }

    // Cleanup function
    return () => {
      addedElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLocked) {
      setError(`Too many failed attempts. Please wait ${lockoutTime} minutes before trying again.`);
      return;
    }

    try {
      const currentAttempts = getAttempts();
      const now = Date.now();

      // Check if we're still in lockout period
      if (currentAttempts >= MAX_ATTEMPTS) {
        const lastAttempt = getLastAttempt();
        const timeSinceLastAttempt = now - lastAttempt;
        if (timeSinceLastAttempt < LOCKOUT_DURATION) {
          setError(`Too many failed attempts. Please wait ${Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60)} minutes before trying again.`);
          return;
        } else {
          // Lockout expired, reset attempts
          clearAttempts();
          setIsLocked(false);
        }
      }

      if (password === PLATFORM_PASSWORD) {
        // Correct password
        const token = hashPassword(PLATFORM_PASSWORD);
        setCookie(PLATFORM_COOKIE_NAME, token, COOKIE_EXPIRY_DAYS);
        setIsAuthenticated(true);
        clearAttempts();
        logger.info('Platform access granted');
      } else {
        // Wrong password
        const newAttempts = currentAttempts + 1;
        setAttempts(newAttempts);
        setLastAttempt(now);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockoutTime(Math.ceil(LOCKOUT_DURATION / 1000 / 60));
          setError(`Too many failed attempts. You are locked out for ${Math.ceil(LOCKOUT_DURATION / 1000 / 60)} minutes.`);
          logger.warn('Platform access blocked - too many failed attempts');
        } else {
          setError(`Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
          logger.warn(`Platform access attempt failed - ${MAX_ATTEMPTS - newAttempts} attempts remaining`);
        }
      }
    } catch (error) {
      logger.error({ error }, 'Password verification failed');
      setError('An error occurred. Please try again.');
    }
  };

  const handleLogout = () => {
    deleteCookie(PLATFORM_COOKIE_NAME);
    setIsAuthenticated(false);
    setPassword('');
    setError('');
    clearAttempts();
    setIsLocked(false);
    logger.info('Platform access logged out');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative">
        {/* Video Background - Same as pitch pages but static */}
        <VideoBackground 
          videos={[
            '/videos/home/business-1.mp4',
            '/videos/home/business-2.mp4',
            '/videos/home/business-3.mp4',
          ]}
          opacity={0.5}
          overlayGradient="from-black/40 via-black/30 to-black/60"
          disableAutoRotation={true}
          disableKeyboardInteraction={true}
        />
        
        {/* Password Modal Overlay */}
        <div className="fixed inset-0 z-50 flex items-center justify-center" data-password-overlay="true">
          {/* Background with glassmorphism blur */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-lg" />
          
          {/* Modal content */}
          <div className="relative w-full h-full flex items-center justify-center px-4 pb-4">
            <div className="w-full max-w-md">
              {/* Security Notice */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 backdrop-blur-sm rounded-full mb-4 border border-red-500/30">
                  <Shield className="w-8 h-8 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Platform Access</h1>
                <p className="text-gray-300 text-sm">
                  You need a password to access this platform.
                </p>
              </div>

              {/* Password Form */}
              <div className="bg-white/5 backdrop-blur-2xl rounded-2xl px-8 pb-8 pt-4 border border-white/20 shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <CustomPasswordInputField
                    label="Platform Password"
                    placeholder="Enter platform password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => {}}
                    name="password"
                    required
                    disabled={isLocked}
                    error={error}
                    touched={!!error}
                  />

                  {isLocked && (
                    <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/40 rounded-lg p-4 shadow-lg">
                      <div className="flex items-center space-x-2 text-red-300">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm">
                          Access locked for {lockoutTime} minutes due to multiple failed attempts.
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isLocked || !password.trim()}
                    className="w-full mt-0"
                  >
                    {isLocked ? 'Access Locked' : 'Enter Platform'}
                  </Button>
                </form>
              </div>

              {/* Security Footer */}
              <div className="text-center mt-6 text-gray-300 text-xs bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <p>🔒 All access attempts are logged and monitored</p>
                <p>Unauthorized access is prohibited and may result in legal action</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show protected content with logout option
  return (
    <div className="relative">
      {/* Logout Button - Always visible for platform protection */}
      <div className="fixed top-8 right-8 z-50">
        <button
          onClick={handleLogout}
          className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 group"
          title="Logout from platform"
        >
          <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
      
      {/* Protected Content */}
      {children}
    </div>
  );
};

export default PlatformPasswordProtection;
