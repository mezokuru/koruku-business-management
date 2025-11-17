import { useState, type FormEvent, type ChangeEvent, type FocusEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { validateEmail } from '../lib/utils';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email: string;
  password: string;
}

interface FormTouched {
  email: boolean;
  password: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    password: '',
  });

  const [touched, setTouched] = useState<FormTouched>({
    email: false,
    password: false,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name as keyof FormData, formData[name as keyof FormData]);
  };

  const validateField = (name: keyof FormData, value: string): boolean => {
    let error = '';

    if (!value.trim()) {
      error = 'This field is required';
    } else if (name === 'email' && !validateEmail(value)) {
      error = 'Please enter a valid email address';
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return !error;
  };

  const validateForm = (): boolean => {
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);

    setTouched({
      email: true,
      password: true,
    });

    return emailValid && passwordValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
      });

      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  const isFormValid = formData.email && formData.password && !errors.email && !errors.password;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary" role="img" aria-label="Koruku logo">
            <h1 className="inline">Koruku</h1>
          </div>
          <p className="mt-2 text-sm text-muted">Business Management System</p>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Sign in to your account</h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate aria-label="Login form">
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : ''}
              required
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loginMutation.isPending}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password ? errors.password : ''}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loginMutation.isPending}
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loginMutation.isPending}
              disabled={!isFormValid || loginMutation.isPending}
            >
              Sign in
            </Button>
          </div>

          {loginMutation.isError && (
            <div
              className="rounded-md bg-red-50 p-4 text-sm text-red-800"
              role="alert"
              aria-live="polite"
            >
              {loginMutation.error?.message || 'An error occurred. Please try again.'}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
