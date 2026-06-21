import { useState } from 'react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Recovery Password State
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 423 || err.code === 'account_locked') {
          setError('Tu cuenta está temporalmente bloqueada por exceso de intentos fallidos.');
        } else if (err.status === 429 || err.code === 'rate_limited') {
          setError('Demasiadas solicitudes. Por favor, inténtalo de nuevo en unos minutos.');
        } else {
          setError(err.message || 'Credenciales inválidas o error en el servidor.');
        }
      } else {
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/v1/auth/password/forgot', { email });
      setForgotSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al solicitar enlace de recuperación');
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
      {/* Login Card */}
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
        {!forgotMode ? (
          <>
            {/* Title */}
            <h1
              style={{
                textAlign: 'center',
                fontSize: '30px',
                fontWeight: 700,
                color: '#111111',
                margin: '0 0 10px 0',
                letterSpacing: '-0.3px',
              }}
            >
              ¡Bienvenido!
            </h1>

            {/* Subtitle */}
            <p
              style={{
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 400,
                color: '#9CA3AF',
                margin: '0 0 32px 0',
              }}
            >
              Ingresa tus credenciales para entrar
            </p>

            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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

              {/* Password Field */}
              <div style={{ marginBottom: '12px' }}>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Contraseña"
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

              {/* Forgot password link */}
              <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setForgotSuccess(false);
                    setError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#E8541A',
                    fontSize: '13px',
                    cursor: 'pointer',
                    fontWeight: 500,
                    padding: 0,
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
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

              {/* Sign In Button */}
              <button
                id="login-submit"
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
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Recuperar Contraseña Form */}
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
              Recuperar Contraseña
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
              {!forgotSuccess
                ? 'Ingresa tu correo y te enviaremos un enlace de recuperación'
                : 'Enlace generado con éxito'}
            </p>

            {!forgotSuccess ? (
              <form onSubmit={handleForgotSubmit}>
                {/* Email Field */}
                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
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
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            ) : (
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
                  textAlign: 'center',
                }}
              >
                Se ha generado un token de recuperación. Como estás en un entorno de desarrollo local, revisa la consola del backend para ver el enlace de recuperación.
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {/* Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginTop: '22px' }}>
          <span style={{ fontSize: '11px', color: '#9CA3AF', letterSpacing: '0.2px' }}>powered by</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* 2×2 orange icon */}
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="26" height="26" rx="5" fill="#E8541A" />
              <rect x="6"  y="6"  width="5" height="5" rx="1" fill="white" />
              <rect x="15" y="6"  width="5" height="5" rx="1" fill="white" />
              <rect x="6"  y="15" width="5" height="5" rx="1" fill="white" />
              <rect x="15" y="15" width="5" height="5" rx="1" fill="white" />
            </svg>

            <span style={{ fontSize: '17px', fontWeight: 800, color: '#111111', letterSpacing: '0.5px' }}>
              <span style={{ color: '#E8541A' }}>IM</span>PROGRESS
            </span>
          </div>

          <span style={{ fontSize: '10px', color: '#9CA3AF', letterSpacing: '0.3px' }}>
            Improvement&amp;Progress
          </span>
        </div>
      </div>
    </div>
  );
}
