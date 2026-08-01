import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Moon, ShieldCheck, User } from 'lucide-react';
import { userApi } from '../api/user.api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Card, Badge } from '../components/ui/Primitives';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Needs a lowercase letter')
      .regex(/[A-Z]/, 'Needs an uppercase letter')
      .regex(/[0-9]/, 'Needs a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function Settings() {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user?.name || '' } });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (values) => {
    try {
      const { data } = await userApi.updateProfile(values);
      setUser(data.data);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile.');
    }
  };

  const onPasswordSubmit = async (values) => {
    try {
      await userApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password changed.');
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change password.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 md:px-10 md:py-10">
      <h1 className="font-display text-2xl text-ink dark:text-paper md:text-3xl">Settings</h1>
      <p className="mt-1 text-sm text-ink/55 dark:text-paper/55">Manage your account and preferences.</p>

      <Card className="mt-6 flex items-center gap-4 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brass/20 font-display text-lg text-brass-deep dark:text-brass-soft">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink dark:text-paper">{user?.name}</p>
          <p className="truncate text-sm text-ink/50 dark:text-paper/50">{user?.email}</p>
        </div>
        <Badge tone={user?.role === 'admin' ? 'verdigris' : 'neutral'}>
          <ShieldCheck size={11} /> {user?.role}
        </Badge>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-base text-ink dark:text-paper">
          <User size={16} /> Profile
        </h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4" noValidate>
          <Input label="Name" {...profileForm.register('name')} error={profileForm.formState.errors.name?.message} />
          <Button type="submit" size="sm" loading={profileForm.formState.isSubmitting}>
            Save changes
          </Button>
        </form>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="mb-3 font-display text-base text-ink dark:text-paper">Change password</h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
          <Input
            label="Current password"
            type="password"
            {...passwordForm.register('currentPassword')}
            error={passwordForm.formState.errors.currentPassword?.message}
          />
          <Input
            label="New password"
            type="password"
            {...passwordForm.register('newPassword')}
            error={passwordForm.formState.errors.newPassword?.message}
          />
          <Input
            label="Confirm new password"
            type="password"
            {...passwordForm.register('confirmPassword')}
            error={passwordForm.formState.errors.confirmPassword?.message}
          />
          <Button type="submit" size="sm" loading={passwordForm.formState.isSubmitting}>
            Update password
          </Button>
        </form>
      </Card>

      <Card className="mt-4 flex items-center justify-between p-5">
        <div>
          <p className="font-medium text-ink dark:text-paper">Appearance</p>
          <p className="text-sm text-ink/50 dark:text-paper/50">Switch between light and dark mode.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </Button>
      </Card>
    </div>
  );
}
