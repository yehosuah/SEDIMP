import { useState } from 'react';
import { api } from '../lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/v1/auth/password/change', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          position: 'relative',
        }}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            color: '#9CA3AF',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          &times;
        </button>

        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#111111' }}>
          Cambiar Contraseña
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
          Completa los campos para actualizar tu contraseña de acceso.
        </p>

        {success ? (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '10px',
              color: '#15803D',
              fontSize: '14px',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            Contraseña cambiada con éxito. Cerrando...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #E5E7EB',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #E5E7EB',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #E5E7EB',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontSize: '14px',
                }}
              />
            </div>

            {error && (
              <div
                style={{
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  height: '46px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#111111',
                  color: '#FFFFFF',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Guardando...' : 'Cambiar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
