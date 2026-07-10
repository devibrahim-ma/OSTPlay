import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { TranslationService } from '../../core/i18n/translation.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  readonly translationService = inject(TranslationService);

  t(key: string): string {
    return this.translationService.t(key);
  }

  isRegisterTab = false;

  // Form Fields
  username = '';
  email = '';
  password = '';
  selectedAvatarId = 'avatar_1';

  // State
  isLoading = false;

  // Specific validation errors
  usernameError = '';
  emailError = '';
  passwordError = '';
  generalError = '';

  get avatars() {
    return this.authService.avatars;
  }

  setTab(isRegister: boolean) {
    this.isRegisterTab = isRegister;
    this.clearErrors();
    this.password = '';
  }

  clearErrors() {
    this.usernameError = '';
    this.emailError = '';
    this.passwordError = '';
    this.generalError = '';
  }

  selectAvatar(avatarId: string) {
    this.selectedAvatarId = avatarId;
  }

  enterAsGuest() {
    this.authService.loginAsGuest();
  }

  async onSubmit() {
    if (this.isLoading) return;

    this.clearErrors();
    
    const cleanUsername = this.username.trim();
    const cleanEmail = this.email.trim();
    const cleanPassword = this.password.trim();

    let hasErrors = false;

    // Validate Username
    if (!cleanUsername) {
      this.usernameError = this.t('LOGIN.ERRORS.USERNAME_REQUIRED');
      hasErrors = true;
    } else if (cleanUsername.length < 3) {
      this.usernameError = this.t('LOGIN.ERRORS.USERNAME_MIN_LENGTH');
      hasErrors = true;
    }

    // Validate Email (only for registration)
    if (this.isRegisterTab) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail) {
        this.emailError = this.t('LOGIN.ERRORS.EMAIL_REQUIRED');
        hasErrors = true;
      } else if (!emailRegex.test(cleanEmail)) {
        this.emailError = this.t('LOGIN.ERRORS.INVALID_EMAIL');
        hasErrors = true;
      }
    }

    // Validate Password
    if (!cleanPassword) {
      this.passwordError = this.t('LOGIN.ERRORS.PASSWORD_REQUIRED');
      hasErrors = true;
    } else if (cleanPassword.length < 6) {
      this.passwordError = this.t('LOGIN.ERRORS.PASSWORD_MIN_LENGTH');
      hasErrors = true;
    }

    if (hasErrors) return;

    this.isLoading = true;

    try {
      if (this.isRegisterTab) {
        // Check if username is taken
        const taken = await this.authService.isUsernameTaken(cleanUsername);
        if (taken) {
          this.usernameError = this.t('LOGIN.ERRORS.USERNAME_TAKEN');
          this.isLoading = false;
          return;
        }

        // Register
        await this.authService.registerUser(cleanUsername, cleanEmail, cleanPassword, this.selectedAvatarId);
      } else {
        // Login
        await this.authService.loginUser(cleanUsername, cleanPassword);
      }
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      if (error.code === 'auth/invalid-credential' || error.message === 'username-not-found') {
        this.generalError = this.t('LOGIN.ERRORS.INVALID_CREDENTIALS');
      } else if (error.code === 'auth/email-already-in-use') {
        this.emailError = this.t('LOGIN.ERRORS.EMAIL_IN_USE');
      } else if (error.code === 'auth/invalid-email') {
        this.emailError = this.t('LOGIN.ERRORS.INVALID_EMAIL');
      } else {
        this.generalError = this.t('LOGIN.ERRORS.UNKNOWN_ERROR');
      }
    } finally {
      this.isLoading = false;
    }
  }
}
