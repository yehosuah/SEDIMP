import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { api } from '../lib/api';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token de recuperación no válido o inexistente.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/password/reset', {
        token,
        new_password: password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EBEBEB',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '52px 48px 44px 48px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            fontSize: '26px',
            fontWeight: 700,
            color: '#111111',
            margin: '0 0 10px 0',
            letterSpacing: '-0.3px',
          }}
        >
          Restablecer Contraseña
        </h1>

        <p
          style={{
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 400,
            color: '#9CA3AF',
            margin: '0 0 32px 0',
          }}
        >
          {!success
            ? 'Ingresa tu nueva contraseña'
            : 'Contraseña restablecida correctamente'}
        </p>

        {!success ? (
          <form onSubmit={handleSubmit}>
            {/* Password Field */}
            <div style={{ marginBottom: '12px' }}>
              <input
                type="password"
                placeholder="Nueva contraseña (mínimo 8 car.)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  display: 'block',
                  width: '100%',
                  height: '50px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '15px',
                  color: '#111111',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#111111')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* Confirm Password Field */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  display: 'block',
                  width: '100%',
                  height: '50px',
                  padding: '0 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  fontSize: '15px',
                  color: '#111111',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#111111')}
                onBlur={e  => (e.currentTarget.style.borderColor = '#E5E7EB')}
              />
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#DC2626',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                height: '52px',
                borderRadius: '10px',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '14px',
                letterSpacing: '0.1px',
                transition: 'opacity 150ms ease',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1'; }}
            >
              {loading && (
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              )}
              {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#15803D',
                lineHeight: '1.5',
              }}
            >
              Tu contraseña ha sido restablecida correctamente.
            </div>

            <a
              href="/"
              style={{
                display: 'inline-block',
                textDecoration: 'none',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                padding: '14px 28px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '15px',
                transition: 'opacity 150ms ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Ir a Iniciar Sesión
            </a>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
