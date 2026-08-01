import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await login(values);
      toast.success('Welcome back.');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not sign in. Check your credentials and try again.');
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Pick up your research where you left off.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
        <Input label="Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/55 dark:text-paper/55">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-brass hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
