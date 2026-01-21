'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ConsultForm() {
  const router = useRouter();
  const params = useParams();
  const lang = params?.lang as string || 'ja';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      // Redirect to signup page with return URL
      const returnUrl = `/${lang}/consult`;
      router.push(`/${lang}/signup?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      budget: formData.get('budget') as string,
      location: formData.get('location') as string,
      moveIn: formData.get('moveIn') as string,
      note: formData.get('note') as string,
      userId: user.uid, // Include user ID in the consultation data
    };

    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitStatus('success');
        e.currentTarget.reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="mt-10 text-center text-zinc-500">
        読み込み中...
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="mt-10 space-y-6"
      >
        <Input label="お名前" name="name" required />
        <Input label="メールアドレス" name="email" type="email" required />

        <Input label="ご予算（RM）" name="budget" placeholder="例: 1500" />

        <Input
          label="希望エリア・学校名"
          name="location"
          placeholder="Sunway / Monash / KLCC など"
        />

        <Input
          label="入居希望時期"
          name="moveIn"
          placeholder="例: 2026年3月"
        />

        <div>
          <label className="block text-sm font-bold mb-2">
            補足・希望条件
          </label>
          <textarea
            name="note"
            rows={4}
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm"
            placeholder="治安重視、女性一人、家具付き希望など"
          />
        </div>

        {submitStatus === 'success' && (
          <div className="p-4 rounded-xl bg-green-50 text-green-800 text-sm">
            送信完了しました。ありがとうございます。
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm">
            送信に失敗しました。もう一度お試しください。
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 rounded-2xl bg-black text-white font-bold transition hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '送信中...' : '無料で相談する'}
        </button>

        <p className="text-xs text-zinc-500 text-center">
          しつこい営業はありません。内容確認後、必要な場合のみご連絡します。
        </p>
      </form>
    </>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      <input
        {...props}
        className="w-full h-12 rounded-xl border border-zinc-200 px-3 text-sm"
      />
    </div>
  );
}
