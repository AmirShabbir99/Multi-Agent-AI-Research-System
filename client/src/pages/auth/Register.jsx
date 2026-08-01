import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[a-z]/, 'Add a lowercase letter')
    .regex(/[A-Z]/, 'Add an uppercase letter')
    .regex(/[0-9]/, 'Add a number'),
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await registerUser(values);
      toast.success('Account created. Welcome to ResearchMind.');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create your account.');
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start researching with a citation-backed AI assistant.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Name" placeholder="Your name" {...register('name')} error={errors.name?.message} />
        <Input label="Email" type="email" placeholder="you@example.com" {...register('email')} error={errors.email?.message} />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          hint="8+ characters, with an uppercase letter and a number"
          {...register('password')}
          error={errors.password?.message}
        />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/55 dark:text-paper/55">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brass hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
