export function Login({ onLogin }: { onLogin: () => void }) {
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

        {/* Email Field */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="email"
            placeholder="Correo electrónico"
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
        <div style={{ marginBottom: '16px' }}>
          <input
            type="password"
            placeholder="Contraseña"
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

        {/* Sign In Button */}
        <button
          onClick={onLogin}
          style={{
            display: 'block',
            width: '100%',
            height: '52px',
            borderRadius: '10px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            marginBottom: '14px',
            letterSpacing: '0.1px',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Iniciar Sesión
        </button>

        {/* Forgot Password */}
        <div style={{ textAlign: 'right', marginBottom: '36px' }}>
          <a
            href="#"
            style={{
              fontSize: '13px',
              color: '#9CA3AF',
              textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Olvidé mi contraseña
          </a>
        </div>

        {/* Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
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
