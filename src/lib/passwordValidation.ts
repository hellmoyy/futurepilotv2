/**
 * Password Validation Utilities
 * 
 * Enforces strong password policy across the application
 */

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns PasswordStrength object with score and feedback
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Check minimum length
  const hasMinLength = password.length >= 8;
  if (!hasMinLength) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score++;
    if (password.length >= 12) score++; // Bonus for longer passwords
  }

  // Check for uppercase
  const hasUppercase = /[A-Z]/.test(password);
  if (!hasUppercase) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score++;
  }

  // Check for lowercase
  const hasLowercase = /[a-z]/.test(password);
  if (!hasLowercase) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score++;
  }

  // Check for number
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    feedback.push('Password must contain at least one number');
  } else {
    score++;
  }

  // Check for special character (optional but recommended)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (hasSpecialChar) {
    score++;
    feedback.push('✓ Contains special character (good!)');
  } else {
    feedback.push('Consider adding a special character for extra security');
  }

  // Check for common passwords
  const commonPasswords = [
    'password', 'Password123', '12345678', 'qwerty123', 'admin123',
    'letmein', 'welcome123', 'monkey123', 'dragon123', 'master123'
  ];
  if (commonPasswords.some(common => password.toLowerCase().includes(common.toLowerCase()))) {
    feedback.push('⚠️ Password is too common');
    score = Math.max(0, score - 2);
  }

  // Minimum requirements for validity
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  return {
    score: Math.min(5, score),
    feedback,
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
}

/**
 * Get password strength label
 * @param score - Password strength score (0-5)
 * @returns Human-readable strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  if (score <= 1) return 'Very Weak';
  if (score === 2) return 'Weak';
  if (score === 3) return 'Fair';
  if (score === 4) return 'Strong';
  return 'Very Strong';
}

/**
 * Get password strength color
 * @param score - Password strength score (0-5)
 * @returns Tailwind CSS color class
 */
export function getPasswordStrengthColor(score: number): string {
  if (score <= 1) return 'bg-red-500';
  if (score === 2) return 'bg-orange-500';
  if (score === 3) return 'bg-yellow-500';
  if (score === 4) return 'bg-blue-500';
  return 'bg-green-500';
}

/**
 * Validate password meets minimum requirements
 * @param password - Password to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  const strength = validatePasswordStrength(password);
  
  if (!strength.isValid) {
    return strength.feedback
      .filter(f => !f.startsWith('✓') && !f.startsWith('Consider'))
      .join('. ');
  }
  
  return null;
}
