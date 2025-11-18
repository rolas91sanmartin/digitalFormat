import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';
import './Auth.css';


const EMAILJS_SERVICE_ID = 'service_g7z09r4'; // Reemplazar con tu Service ID
const EMAILJS_TEMPLATE_ID = 'template_n1f0abq'; // Reemplazar con tu Template ID
const EMAILJS_PUBLIC_KEY = 'pEz5khT6whKJuEsYE'; // Reemplazar con tu Public Key

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Solicitar código de recuperación al backend
      const response = await window.electronAPI.requestPasswordReset(email);

      if (!response.success) {
        throw new Error(response.error);
      }

      const { code: resetCode, username } = response.result;
      setGeneratedCode(resetCode);

      // Enviar email con EmailJS
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: email,
            username: username,
            reset_code: resetCode,
          },
          EMAILJS_PUBLIC_KEY
        );

        await Swal.fire({
          icon: 'success',
          title: '¡Código enviado!',
          text: 'Revisa tu correo electrónico. El código expira en 15 minutos.',
          confirmButtonText: 'Continuar'
        });

        setStep('code');
      } catch (emailError: any) {
        console.error('Error al enviar email:', emailError);
        
        // Mostrar código en alerta si hay error al enviar email (solo para desarrollo)
        await Swal.fire({
          icon: 'warning',
          title: 'Error al enviar email',
          html: `
            <p>No se pudo enviar el email, pero aquí está tu código:</p>
            <h2 style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #2196F3;">
              ${resetCode}
            </h2>
            <p style="color: #666; font-size: 14px;">El código expira en 15 minutos</p>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              Por favor, configura EmailJS correctamente para enviar emails automáticos.
            </p>
          `,
          confirmButtonText: 'Continuar'
        });

        setStep('code');
      }
    } catch (err: any) {
      setError(err.message || 'Error al solicitar código de recuperación');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await window.electronAPI.verifyResetCode(email, code);

      if (!response.success || !response.isValid) {
        throw new Error('Código inválido o expirado');
      }

      setStep('password');
    } catch (err: any) {
      setError(err.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await window.electronAPI.resetPassword(email, code, newPassword);

      if (!response.success) {
        throw new Error(response.error);
      }

      await Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: 'Tu contraseña ha sido cambiada exitosamente.',
        confirmButtonText: 'Iniciar sesión'
      });

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>FormatPrinter IA</h1>
          <p>
            {step === 'email' && 'Recuperar contraseña'}
            {step === 'code' && 'Verificar código'}
            {step === 'password' && 'Nueva contraseña'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Paso 1: Solicitar código */}
        {step === 'email' && (
          <form onSubmit={handleRequestReset} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="tu@email.com"
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Te enviaremos un código de verificación a tu correo
              </small>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Enviando código...
                </>
              ) : (
                'Enviar código'
              )}
            </button>
          </form>
        )}

        {/* Paso 2: Verificar código */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="auth-form">
            <div className="form-group">
              <label htmlFor="code">Código de verificación</label>
              <input
                id="code"
                type="text"
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoFocus
                placeholder="123456"
                maxLength={6}
                style={{ fontSize: '24px', letterSpacing: '10px', textAlign: 'center' }}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Ingresa el código de 6 dígitos que recibiste por email
              </small>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Verificando...
                </>
              ) : (
                'Verificar código'
              )}
            </button>

            <button
              type="button"
              className="btn btn-full"
              onClick={() => setStep('email')}
              style={{ marginTop: '10px', background: '#f5f5f5', color: '#333' }}
            >
              Volver a enviar código
            </button>
          </form>
        )}

        {/* Paso 3: Nueva contraseña */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword">Nueva contraseña</label>
              <input
                id="newPassword"
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Cambiando contraseña...
                </>
              ) : (
                'Cambiar contraseña'
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

